/**
 * Weekly Analytics Report
 * Runs every Monday at 08:05 UTC (5 minutes after the feedback digest).
 * Summarises the past 7 days of site usage and emails it to DIGEST_EMAIL.
 */
import cron from "node-cron";
import { getDb } from "./db";
import {
  analyticsSessions,
  analyticsPageViews,
  analyticsEvents,
  feedback as feedbackTable,
} from "../drizzle/schema";
import { gte, eq } from "drizzle-orm";
import { sendEmail } from "./weeklyDigest";
import { notifyOwner } from "./_core/notification";

const DIGEST_EMAIL = process.env.DIGEST_EMAIL ?? "";

// ── Build analytics HTML ──────────────────────────────────────────────────────
function buildAnalyticsHtml(data: {
  dateRange: string;
  summary: {
    totalSessions: number;
    uniqueVisitors: number;
    totalPageViews: number;
    avgSessionMinutes: number;
    totalHours: number;
  };
  pageViews: Array<{ page: string; count: number }>;
  topEvents: Array<{ eventName: string; count: number }>;
  deviceBreakdown: Array<{ deviceType: string; count: number }>;
  browserBreakdown: Array<{ browser: string; count: number }>;
  top3Unactioned: Array<{
    id: number;
    category: string;
    message: string;
    page: string | null;
    createdAt: Date;
  }>;
}): { subject: string; html: string; text: string } {
  const subject = `📊 Weekly Analytics Report — ${data.summary.totalSessions} sessions (${new Date().toDateString()})`;

  const PAGE_LABELS: Record<string, string> = {
    overview: "Overview",
    coding: "Coding",
    behavioral: "Behavioral",
    design: "System Design",
  };

  const DEV_ICONS: Record<string, string> = {
    desktop: "🖥️",
    tablet: "📱",
    mobile: "📱",
  };

  const kpi = (num: string | number, label: string, color = "#58a6ff") =>
    `<div class="kpi"><span class="kpi-num" style="color:${color};">${num}</span><span class="kpi-label">${label}</span></div>`;

  const row = (label: string, value: string | number, pct?: number) => `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:#e6edf3;">${label}</td>
      <td style="padding:6px 0;font-size:13px;color:#e6edf3;text-align:right;font-weight:600;">${value}</td>
      ${pct != null ? `<td style="padding:6px 8px;width:120px;"><div style="background:#21262d;border-radius:4px;height:6px;"><div style="background:#58a6ff;border-radius:4px;height:6px;width:${Math.min(pct, 100)}%;"></div></div></td>` : ""}
    </tr>`;

  const maxPV = data.pageViews[0]?.count ?? 1;
  const maxEv = data.topEvents[0]?.count ?? 1;

  const top3Html =
    data.top3Unactioned.length === 0
      ? `<p style="color:#8b949e;font-size:13px;">No unactioned feedback — backlog is clear! 🎉</p>`
      : data.top3Unactioned
          .map(
            (item, i) => `
      <div style="background:#161b22;border:1px solid #30363d;border-left:3px solid #f85149;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:8px;">
        <div style="font-size:10px;color:#8b949e;margin-bottom:4px;">#${i + 1} · ${item.category.replace("_", " ")} · ${item.page ?? "unknown"} · ${new Date(item.createdAt).toLocaleDateString()}</div>
        <div style="font-size:13px;color:#e6edf3;">${item.message.slice(0, 200).replace(/</g, "&lt;").replace(/>/g, "&gt;")}${item.message.length > 200 ? "…" : ""}</div>
      </div>`
          )
          .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 0; }
  .container { max-width: 640px; margin: 0 auto; padding: 32px 16px; }
  .header { border-bottom: 1px solid #30363d; padding-bottom: 20px; margin-bottom: 24px; }
  .title { font-size: 20px; font-weight: 700; color: #58a6ff; margin: 0 0 4px; }
  .subtitle { font-size: 12px; color: #8b949e; margin: 0; }
  .section-title { font-size: 13px; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; margin: 20px 0 10px; }
  .kpi-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
  .kpi { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px 16px; text-align: center; min-width: 90px; flex: 1; }
  .kpi-num { font-size: 26px; font-weight: 700; display: block; }
  .kpi-label { font-size: 10px; color: #8b949e; }
  table { width: 100%; border-collapse: collapse; }
  .divider { border: none; border-top: 1px solid #30363d; margin: 20px 0; }
  .footer { border-top: 1px solid #30363d; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #8b949e; text-align: center; }
  a { color: #58a6ff; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <p class="title">📊 Weekly Analytics Report</p>
    <p class="subtitle">${data.dateRange}</p>
  </div>

  <!-- Summary KPIs -->
  <p class="section-title">🔢 At a Glance</p>
  <div class="kpi-row">
    ${kpi(data.summary.totalSessions, "Sessions")}
    ${kpi(data.summary.uniqueVisitors, "Logged-in Users", "#3fb950")}
    ${kpi(data.summary.totalPageViews, "Page Views", "#bc8cff")}
    ${kpi(data.summary.avgSessionMinutes + "m", "Avg Session", "#d29922")}
    ${kpi(data.summary.totalHours + "h", "Total Time", "#f85149")}
  </div>

  <hr class="divider">

  <!-- Page Views -->
  <p class="section-title">📄 Page Views by Tab</p>
  <table>
    ${data.pageViews
      .map(pv =>
        row(
          PAGE_LABELS[pv.page] ?? pv.page,
          pv.count,
          Math.round((pv.count / maxPV) * 100)
        )
      )
      .join("")}
  </table>

  <hr class="divider">

  <!-- Top Feature Events -->
  <p class="section-title">⚡ Top Feature Interactions</p>
  <table>
    ${data.topEvents
      .slice(0, 10)
      .map(ev =>
        row(
          ev.eventName.replace("feature_click:", "").replace(/_/g, " "),
          ev.count,
          Math.round((ev.count / maxEv) * 100)
        )
      )
      .join("")}
  </table>

  <hr class="divider">

  <!-- Device & Browser -->
  <p class="section-title">📱 Device & Browser Breakdown</p>
  <table>
    ${data.deviceBreakdown
      .map(d =>
        row(
          `${DEV_ICONS[d.deviceType] ?? "💻"} ${d.deviceType}`,
          d.count,
          data.summary.totalSessions > 0
            ? Math.round((d.count / data.summary.totalSessions) * 100)
            : 0
        )
      )
      .join("")}
    ${data.browserBreakdown
      .slice(0, 5)
      .map(b =>
        row(
          `🌐 ${b.browser}`,
          b.count,
          data.summary.totalSessions > 0
            ? Math.round((b.count / data.summary.totalSessions) * 100)
            : 0
        )
      )
      .join("")}
  </table>

  <hr class="divider">

  <!-- Top 3 Unactioned Feedback -->
  <p class="section-title">🚨 Top 3 Unactioned Feedback Items</p>
  ${top3Html}

  <div class="footer">
    Meta Prep Guide · Analytics Report ·
    <a href="https://www.metaguide.blog/admin/analytics">View Dashboard →</a>
    &nbsp;|&nbsp;
    <a href="https://www.metaguide.blog/admin/feedback">Feedback →</a>
  </div>
</div>
</body>
</html>`;

  const text = [
    `Weekly Analytics Report — ${data.dateRange}`,
    ``,
    `Sessions: ${data.summary.totalSessions}`,
    `Unique logged-in users: ${data.summary.uniqueVisitors}`,
    `Page views: ${data.summary.totalPageViews}`,
    `Avg session: ${data.summary.avgSessionMinutes} min`,
    `Total time on site: ${data.summary.totalHours} hours`,
    ``,
    `Top pages:`,
    ...data.pageViews.map(pv => `  ${pv.page}: ${pv.count}`),
    ``,
    `Top features:`,
    ...data.topEvents.slice(0, 5).map(ev => `  ${ev.eventName}: ${ev.count}`),
    ``,
    `Top 3 unactioned feedback:`,
    ...data.top3Unactioned.map(
      (item, i) =>
        `  #${i + 1} [${item.category}] ${item.message.slice(0, 100)}`
    ),
    ``,
    `View analytics: https://www.metaguide.blog/admin/analytics`,
    `View feedback: https://www.metaguide.blog/admin/feedback`,
  ].join("\n");

  return { subject, html, text };
}

// ── Send analytics report ────────────────────────────────────────────────────
export async function sendWeeklyAnalytics() {
  console.log("[WeeklyAnalytics] Running weekly analytics report…");
  const db = await getDb();
  if (!db) {
    console.warn("[WeeklyAnalytics] No DB connection, skipping.");
    return;
  }

  const since = new Date(Date.now() - 7 * 86400_000);
  const dateRange = `${since.toDateString()} – ${new Date().toDateString()}`;

  // Fetch all data
  const [sessions, pageViews, events, allFeedback] = await Promise.all([
    db
      .select()
      .from(analyticsSessions)
      .where(gte(analyticsSessions.startedAt, since)),
    db
      .select()
      .from(analyticsPageViews)
      .where(gte(analyticsPageViews.createdAt, since)),
    db
      .select()
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since)),
    db.select().from(feedbackTable),
  ]);

  // Aggregate page views
  const pvMap: Record<string, number> = {};
  for (const pv of pageViews) pvMap[pv.page] = (pvMap[pv.page] ?? 0) + 1;
  const pageViewCounts = Object.entries(pvMap)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count);

  // Aggregate events
  const evMap: Record<string, number> = {};
  for (const ev of events) evMap[ev.eventName] = (evMap[ev.eventName] ?? 0) + 1;
  const topEvents = Object.entries(evMap)
    .map(([eventName, count]) => ({ eventName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Device breakdown
  const devMap: Record<string, number> = {};
  for (const s of sessions) {
    const d = s.deviceType ?? "desktop";
    devMap[d] = (devMap[d] ?? 0) + 1;
  }
  const deviceBreakdown = Object.entries(devMap).map(([deviceType, count]) => ({
    deviceType,
    count,
  }));

  // Browser breakdown
  const browserMap: Record<string, number> = {};
  for (const s of sessions) {
    const b = s.browser ?? "Other";
    browserMap[b] = (browserMap[b] ?? 0) + 1;
  }
  const browserBreakdown = Object.entries(browserMap)
    .map(([browser, count]) => ({ browser, count }))
    .sort((a, b) => b.count - a.count);

  // Summary
  const totalSessions = sessions.length;
  const uniqueVisitors = new Set(
    sessions.filter(s => s.userId).map(s => s.userId)
  ).size;
  const totalPageViews = pageViews.length;
  const totalSeconds = sessions.reduce(
    (sum, s) => sum + (s.durationSeconds ?? 0),
    0
  );
  const avgSessionMinutes =
    totalSessions > 0 ? Math.round(totalSeconds / totalSessions / 60) : 0;
  const totalHours = Math.round(totalSeconds / 3600);

  // Top 3 unactioned feedback (oldest new items first)
  const top3Unactioned = allFeedback
    .filter(f => f.status === "new")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .slice(0, 3)
    .map(f => ({
      id: f.id,
      category: f.category,
      message: f.message,
      page: f.page,
      createdAt: f.createdAt,
    }));

  const { subject, html, text } = buildAnalyticsHtml({
    dateRange,
    summary: {
      totalSessions,
      uniqueVisitors,
      totalPageViews,
      avgSessionMinutes,
      totalHours,
    },
    pageViews: pageViewCounts,
    topEvents,
    deviceBreakdown,
    browserBreakdown,
    top3Unactioned,
  });

  // Send via SMTP
  if (DIGEST_EMAIL) {
    try {
      const sent = await sendEmail({ to: DIGEST_EMAIL, subject, html, text });
      if (sent) {
        console.log(`[WeeklyAnalytics] Email sent to ${DIGEST_EMAIL}`);
        return;
      }
    } catch (err) {
      console.warn("[WeeklyAnalytics] SMTP failed, falling back:", err);
    }
  }

  // Fallback
  await notifyOwner({ title: subject, content: text }).catch(() => null);
  console.log("[WeeklyAnalytics] Sent via Manus notification fallback.");
}

// ── Schedule: Every Monday at 08:05 UTC ─────────────────────────────────────
export function startWeeklyAnalyticsCron() {
  cron.schedule("0 5 8 * * 1", () => {
    sendWeeklyAnalytics().catch(err =>
      console.error("[WeeklyAnalytics] Unhandled error:", err)
    );
  });
  console.log("[WeeklyAnalytics] Cron scheduled: every Monday at 08:05 UTC");
}

export { buildAnalyticsHtml };
