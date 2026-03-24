/**
 * Feedback Router
 * Handles general site feedback and sprint-plan-specific suggestions.
 * Stores feedback in DB, sends an instant email alert to the admin,
 * and also notifies the owner via Manus notification as fallback.
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { feedback as feedbackTable } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendWeeklyDigest, sendEmail } from "../weeklyDigest";
import { checkAndSendDailyAlert } from "../dailyAlert";

const DIGEST_EMAIL = process.env.DIGEST_EMAIL ?? "";

// ── Instant alert email ──────────────────────────────────────────────────────
async function sendInstantAlert(opts: {
  category: string;
  feedbackType: string;
  message: string;
  page?: string | null;
  userName?: string | null;
  rating?: number | null;
  sprintPlanId?: string | null;
}) {
  const isSprintPlan = opts.feedbackType === "sprint_plan";
  const emoji = isSprintPlan ? "🏃" : "📬";
  const subject = `${emoji} New ${isSprintPlan ? "Sprint Plan" : "Site"} Feedback — ${opts.category.replace("_", " ").toUpperCase()}`;

  const ratingLine =
    opts.rating != null
      ? `<p><strong>Rating:</strong> ${"⭐".repeat(opts.rating)} (${opts.rating}/5)</p>`
      : "";
  const sprintLine = opts.sprintPlanId
    ? `<p><strong>Sprint Plan ID:</strong> ${opts.sprintPlanId}</p>`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 0; }
  .container { max-width: 560px; margin: 0 auto; padding: 28px 16px; }
  .header { border-bottom: 1px solid #30363d; padding-bottom: 16px; margin-bottom: 20px; }
  .title { font-size: 18px; font-weight: 700; color: #58a6ff; margin: 0 0 4px; }
  .subtitle { font-size: 11px; color: #8b949e; margin: 0; }
  .meta { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; font-size: 12px; line-height: 1.8; }
  .meta strong { color: #e6edf3; }
  .message-box { background: #161b22; border-left: 3px solid #58a6ff; border-radius: 0 8px 8px 0; padding: 12px 14px; font-size: 14px; line-height: 1.6; color: #e6edf3; white-space: pre-wrap; word-break: break-word; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; background: rgba(88,166,255,0.15); color: #58a6ff; }
  .footer { border-top: 1px solid #30363d; padding-top: 14px; margin-top: 20px; font-size: 11px; color: #8b949e; text-align: center; }
  a { color: #58a6ff; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <p class="title">${emoji} New Feedback Received</p>
    <p class="subtitle">${new Date().toLocaleString()}</p>
  </div>
  <div class="meta">
    <p><strong>Type:</strong> <span class="badge">${opts.feedbackType.replace("_", " ")}</span></p>
    <p><strong>Category:</strong> ${opts.category.replace("_", " ")}</p>
    <p><strong>Page:</strong> ${opts.page ?? "unknown"}</p>
    <p><strong>User:</strong> ${opts.userName ?? "Anonymous"}</p>
    ${ratingLine}
    ${sprintLine}
  </div>
  <div class="message-box">${opts.message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  <div class="footer">
    <a href="https://www.metaguide.blog/admin/feedback">View in Dashboard →</a>
  </div>
</div>
</body>
</html>`;

  const text = [
    `New ${isSprintPlan ? "Sprint Plan" : "Site"} Feedback`,
    `Category: ${opts.category}`,
    `Page: ${opts.page ?? "unknown"}`,
    `User: ${opts.userName ?? "Anonymous"}`,
    opts.rating != null ? `Rating: ${opts.rating}/5` : "",
    ``,
    opts.message,
    ``,
    `View: https://www.metaguide.blog/admin/feedback`,
  ]
    .filter(Boolean)
    .join("\n");

  if (DIGEST_EMAIL) {
    try {
      await sendEmail({ to: DIGEST_EMAIL, subject, html, text });
      return;
    } catch {
      // fall through to Manus notification
    }
  }

  // Fallback: Manus notification
  await notifyOwner({ title: subject, content: text }).catch(() => null);
}

// ── Router ───────────────────────────────────────────────────────────────────
export const feedbackRouter = router({
  /** Submit general site feedback */
  submitGeneral: publicProcedure
    .input(
      z.object({
        category: z.enum(["bug", "feature_request", "content", "ux", "other"]),
        message: z.string().min(10).max(2000),
        page: z.string().max(64).optional(),
        userAgent: z.string().max(256).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? null;
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(feedbackTable).values({
        userId,
        feedbackType: "general",
        category: input.category,
        message: input.message,
        page: input.page ?? null,
        metadata: { userAgent: input.userAgent ?? null },
      });

      // Fire instant alert (non-blocking)
      sendInstantAlert({
        category: input.category,
        feedbackType: "general",
        message: input.message,
        page: input.page,
        userName: ctx.user?.name ?? null,
      }).catch(() => null);

      return { success: true };
    }),

  /** Submit sprint-plan-specific feedback */
  submitSprintFeedback: publicProcedure
    .input(
      z.object({
        sprintPlanId: z.string().max(64).optional(),
        rating: z.number().int().min(1).max(5),
        message: z.string().min(5).max(2000),
        dayFeedback: z
          .array(
            z.object({
              day: z.number().int().min(1).max(7),
              comment: z.string().max(500),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user?.id ?? null;
      const db = await getDb();
      if (!db) return { success: false };
      await db.insert(feedbackTable).values({
        userId,
        feedbackType: "sprint_plan",
        category: "feature_request",
        message: input.message,
        page: "7-day-sprint",
        metadata: {
          rating: input.rating,
          sprintPlanId: input.sprintPlanId ?? null,
          dayFeedback: input.dayFeedback ?? [],
        },
      });

      // Fire instant alert (non-blocking)
      sendInstantAlert({
        category: "feature_request",
        feedbackType: "sprint_plan",
        message: input.message,
        page: "7-day-sprint",
        userName: ctx.user?.name ?? null,
        rating: input.rating,
        sprintPlanId: input.sprintPlanId ?? null,
      }).catch(() => null);

      return { success: true };
    }),

  /** Get recent feedback (legacy — kept for backward compat) */
  getRecent: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user) return { items: [] };
      const db = await getDb();
      if (!db) return { items: [] };
      const items = await db
        .select()
        .from(feedbackTable)
        .orderBy(desc(feedbackTable.createdAt))
        .limit(input.limit);
      return { items };
    }),

  /** Admin: Get all feedback entries with full details (owner-only) */
  adminGetAll: adminProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(500).default(200),
        category: z
          .enum(["all", "bug", "feature_request", "content", "ux", "other"])
          .default("all"),
        feedbackType: z.enum(["all", "general", "sprint_plan"]).default("all"),
        sortBy: z
          .enum(["createdAt", "category", "feedbackType"])
          .default("createdAt"),
        sortDir: z.enum(["asc", "desc"]).default("desc"),
        status: z
          .enum(["all", "new", "in_progress", "done", "dismissed"])
          .default("all"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { items: [], total: 0 };
      const items = await db
        .select()
        .from(feedbackTable)
        .orderBy(desc(feedbackTable.createdAt))
        .limit(input.limit);
      // Filter in JS (small dataset)
      let filtered = items;
      if (input.category !== "all") {
        filtered = filtered.filter(i => i.category === input.category);
      }
      if (input.feedbackType !== "all") {
        filtered = filtered.filter(i => i.feedbackType === input.feedbackType);
      }
      if (input.status !== "all") {
        filtered = filtered.filter(i => i.status === input.status);
      }
      return { items: filtered, total: filtered.length };
    }),

  /** Admin: Get feedback summary stats */
  adminStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { byCategory: [], byType: [], total: 0, last7Days: 0 };
    const all = await db
      .select({
        category: feedbackTable.category,
        feedbackType: feedbackTable.feedbackType,
        createdAt: feedbackTable.createdAt,
      })
      .from(feedbackTable);
    const total = all.length;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = all.filter(
      r => new Date(r.createdAt) > sevenDaysAgo
    ).length;
    const catMap: Record<string, number> = {};
    for (const r of all) catMap[r.category] = (catMap[r.category] ?? 0) + 1;
    const byCategory = Object.entries(catMap).map(([category, count]) => ({
      category,
      count,
    }));
    const typeMap: Record<string, number> = {};
    for (const r of all)
      typeMap[r.feedbackType] = (typeMap[r.feedbackType] ?? 0) + 1;
    const byType = Object.entries(typeMap).map(([type, count]) => ({
      type,
      count,
    }));
    return { byCategory, byType, total, last7Days };
  }),

  /** Admin: Manually trigger the weekly digest (for testing) */
  triggerDigest: adminProcedure.mutation(async () => {
    await sendWeeklyDigest();
    return { success: true };
  }),

  /** Admin: Manually trigger the daily unactioned alert (for testing) */
  triggerDailyAlert: adminProcedure.mutation(async () => {
    await checkAndSendDailyAlert();
    return { success: true };
  }),

  /** Admin: Save an internal note on a feedback item */
  updateNote: adminProcedure
    .input(
      z.object({
        id: z.number(),
        adminNote: z.string().max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(feedbackTable)
        .set({ adminNote: input.adminNote })
        .where(eq(feedbackTable.id, input.id));
      return { success: true };
    }),

  /** Admin: Bulk-update all 'new' feedback items to 'in_progress' */
  markAllNew: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const result = await db
      .update(feedbackTable)
      .set({ status: "in_progress" })
      .where(eq(feedbackTable.status, "new"));
    return {
      success: true,
      updated: (result as { affectedRows?: number }).affectedRows ?? 0,
    };
  }),

  /** Admin: Update the triage status of a feedback item */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["new", "in_progress", "done", "dismissed"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(feedbackTable)
        .set({ status: input.status })
        .where(eq(feedbackTable.id, input.id));
      return { success: true };
    }),
});
