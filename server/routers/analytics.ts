/**
 * Analytics Router
 * Ingests page views, sessions, and feature events from the client.
 * Provides admin-only report queries for the weekly email and dashboard.
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  analyticsPageViews,
  analyticsSessions,
  analyticsEvents,
} from "../../drizzle/schema";
import { gte, desc, sql, eq } from "drizzle-orm";

// ── Ingest procedures (public — fire-and-forget from client) ─────────────────

export const analyticsRouter = router({
  /** Start or upsert a session record */
  startSession: publicProcedure
    .input(
      z.object({
        sessionId: z.string().max(64),
        userId: z.number().nullable(),
        deviceType: z.enum(["desktop", "tablet", "mobile"]).default("desktop"),
        browser: z.string().max(64).nullable(),
        os: z.string().max(64).nullable(),
        referrer: z.string().max(256).nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: true };
      // Insert only if not exists (ignore duplicate sessionId)
      await db
        .insert(analyticsSessions)
        .values({
          sessionId: input.sessionId,
          userId: input.userId ?? undefined,
          deviceType: input.deviceType,
          browser: input.browser ?? undefined,
          os: input.os ?? undefined,
        })
        .onDuplicateKeyUpdate({ set: { sessionId: input.sessionId } });
      return { ok: true };
    }),

  /** Update session duration (heartbeat + on-unload) */
  endSession: publicProcedure
    .input(
      z.object({
        sessionId: z.string().max(64),
        durationSeconds: z.number().int().min(0),
        ended: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: true };
      await db
        .update(analyticsSessions)
        .set({
          durationSeconds: input.durationSeconds,
          endedAt: input.ended ? new Date() : undefined,
        })
        .where(eq(analyticsSessions.sessionId, input.sessionId));
      return { ok: true };
    }),

  /** Track a page view */
  trackPageView: publicProcedure
    .input(
      z.object({
        sessionId: z.string().max(64),
        userId: z.number().nullable(),
        page: z.string().max(128),
        referrer: z.string().max(256).nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: true };
      await db.insert(analyticsPageViews).values({
        sessionId: input.sessionId,
        userId: input.userId ?? undefined,
        page: input.page,
        referrer: input.referrer ?? undefined,
      });
      return { ok: true };
    }),

  /** Track a named feature event */
  trackEvent: publicProcedure
    .input(
      z.object({
        sessionId: z.string().max(64),
        userId: z.number().nullable(),
        eventName: z.string().max(128),
        page: z.string().max(128).optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: true };
      await db.insert(analyticsEvents).values({
        sessionId: input.sessionId,
        userId: input.userId ?? undefined,
        eventName: input.eventName,
        page: input.page ?? undefined,
        metadata: input.metadata ?? {},
      });
      return { ok: true };
    }),

  // ── Admin report queries ───────────────────────────────────────────────────

  /** Admin: Get full analytics report for a given number of past days */
  /** Manually trigger the analytics report email */
  sendReportNow: adminProcedure.mutation(async () => {
    const { sendWeeklyAnalytics } = await import("../weeklyAnalytics");
    await sendWeeklyAnalytics();
    return { success: true };
  }),

  /** DAU trend — sessions per day for the past N days */
  dauTrend: adminProcedure
    .input(z.object({ days: z.number().int().min(7).max(30).default(7) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { trend: [] };
      const since = new Date(Date.now() - input.days * 86400_000);
      const sessions = await db
        .select()
        .from(analyticsSessions)
        .where(gte(analyticsSessions.startedAt, since));
      // Bucket by calendar date
      const dayMap: Record<string, number> = {};
      for (let i = 0; i < input.days; i++) {
        const d = new Date(Date.now() - i * 86400_000);
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = 0;
      }
      for (const s of sessions) {
        const key = new Date(s.startedAt).toISOString().slice(0, 10);
        if (key in dayMap) dayMap[key]++;
      }
      const trend = Object.entries(dayMap)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, sessions]) => ({ date, sessions }));
      return { trend };
    }),

  /** Top feature clicks today (for heatmap badges on main site) */
  featureClicksToday: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { counts: {} };
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const events = await db
      .select()
      .from(analyticsEvents)
      .where(gte(analyticsEvents.createdAt, since));
    const counts: Record<string, number> = {};
    for (const ev of events) {
      if (ev.eventName.startsWith("feature_click:")) {
        const name = ev.eventName.replace("feature_click:", "");
        counts[name] = (counts[name] ?? 0) + 1;
      }
    }
    return { counts };
  }),

  adminReport: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(7) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        return {
          sessions: [],
          pageViews: [],
          topEvents: [],
          deviceBreakdown: [],
          summary: {
            totalSessions: 0,
            uniqueVisitors: 0,
            totalPageViews: 0,
            avgSessionMinutes: 0,
            totalHours: 0,
          },
        };

      const since = new Date(Date.now() - input.days * 86400_000);

      // Sessions in window
      const sessions = await db
        .select()
        .from(analyticsSessions)
        .where(gte(analyticsSessions.startedAt, since))
        .orderBy(desc(analyticsSessions.startedAt));

      // Page views in window
      const pageViews = await db
        .select()
        .from(analyticsPageViews)
        .where(gte(analyticsPageViews.createdAt, since));

      // Events in window
      const events = await db
        .select()
        .from(analyticsEvents)
        .where(gte(analyticsEvents.createdAt, since));

      // Aggregate page view counts
      const pvMap: Record<string, number> = {};
      for (const pv of pageViews) {
        pvMap[pv.page] = (pvMap[pv.page] ?? 0) + 1;
      }
      const pageViewCounts = Object.entries(pvMap)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count);

      // Aggregate event counts
      const evMap: Record<string, number> = {};
      for (const ev of events) {
        evMap[ev.eventName] = (evMap[ev.eventName] ?? 0) + 1;
      }
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
      const deviceBreakdown = Object.entries(devMap).map(
        ([deviceType, count]) => ({ deviceType, count })
      );

      // Summary stats
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

      // Browser breakdown
      const browserMap: Record<string, number> = {};
      for (const s of sessions) {
        const b = s.browser ?? "Other";
        browserMap[b] = (browserMap[b] ?? 0) + 1;
      }
      const browserBreakdown = Object.entries(browserMap)
        .map(([browser, count]) => ({ browser, count }))
        .sort((a, b) => b.count - a.count);

      return {
        sessions: sessions.slice(0, 200),
        pageViews: pageViewCounts,
        topEvents,
        deviceBreakdown,
        browserBreakdown,
        summary: {
          totalSessions,
          uniqueVisitors,
          totalPageViews,
          avgSessionMinutes,
          totalHours,
        },
      };
    }),
});
