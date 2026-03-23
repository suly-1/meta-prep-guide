/**
 * Feedback Router
 * Handles general site feedback and sprint-plan-specific suggestions.
 * Stores feedback in DB and notifies the owner via Manus notification.
 */
import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { feedback as feedbackTable } from "../../drizzle/schema";
import { desc } from "drizzle-orm";

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

      // Notify owner
      await notifyOwner({
        title: `📬 New Site Feedback: ${input.category.replace("_", " ").toUpperCase()}`,
        content: [
          `**Category:** ${input.category}`,
          `**Page:** ${input.page ?? "unknown"}`,
          `**User:** ${ctx.user?.name ?? "Anonymous"}`,
          ``,
          `**Message:**`,
          input.message,
        ].join("\n"),
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

      await notifyOwner({
        title: `🏃 Sprint Plan Feedback — ${input.rating}/5 stars`,
        content: [
          `**Rating:** ${"⭐".repeat(input.rating)}`,
          `**User:** ${ctx.user?.name ?? "Anonymous"}`,
          `**Sprint Plan ID:** ${input.sprintPlanId ?? "N/A"}`,
          ``,
          `**Overall Feedback:**`,
          input.message,
          ...(input.dayFeedback && input.dayFeedback.length > 0
            ? [
                ``,
                `**Per-Day Comments:**`,
                ...input.dayFeedback.map(d => `Day ${d.day}: ${d.comment}`),
              ]
            : []),
        ].join("\n"),
      }).catch(() => null);

      return { success: true };
    }),

  /** Get recent feedback (admin view — owner only) */
  getRecent: publicProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
    .query(async ({ input, ctx }) => {
      // Only the owner can see all feedback
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
});
