/**
 * Progress Router — save and retrieve daily readiness snapshots for trend charts.
 * Snapshots are upserted once per day (by snapshotDate) to avoid duplicates.
 */
import { z } from "zod";
import { and, eq, desc, gte } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { progressSnapshots } from "../../drizzle/schema";

export const progressRouter = router({
  /** Get the last N snapshots for the current user (default: 60 days) */
  list: protectedProcedure
    .input(
      z.object({ days: z.number().min(7).max(365).default(60) }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const daysBack = input?.days ?? 60;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysBack);
      const cutoffStr = cutoff.toISOString().slice(0, 10); // YYYY-MM-DD

      return db
        .select()
        .from(progressSnapshots)
        .where(
          and(
            eq(progressSnapshots.userId, ctx.user.id),
            gte(progressSnapshots.snapshotDate, cutoffStr)
          )
        )
        .orderBy(desc(progressSnapshots.snapshotDate))
        .limit(daysBack);
    }),

  /** Save (upsert) today's snapshot. One row per user per day. */
  save: protectedProcedure
    .input(
      z.object({
        codingPct: z.number().min(0).max(100),
        behavioralPct: z.number().min(0).max(100),
        overallPct: z.number().min(0).max(100),
        streakDays: z.number().min(0),
        mockSessionCount: z.number().min(0),
        patternsMastered: z.number().min(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const today = new Date().toISOString().slice(0, 10);

      // Check if today's snapshot already exists
      const existing = await db
        .select({ id: progressSnapshots.id })
        .from(progressSnapshots)
        .where(
          and(
            eq(progressSnapshots.userId, ctx.user.id),
            eq(progressSnapshots.snapshotDate, today)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(progressSnapshots)
          .set({
            codingPct: input.codingPct,
            behavioralPct: input.behavioralPct,
            overallPct: input.overallPct,
            streakDays: input.streakDays,
            mockSessionCount: input.mockSessionCount,
            patternsMastered: input.patternsMastered,
          })
          .where(
            and(
              eq(progressSnapshots.userId, ctx.user.id),
              eq(progressSnapshots.snapshotDate, today)
            )
          );
        return { saved: true, date: today, updated: true };
      } else {
        await db.insert(progressSnapshots).values({
          userId: ctx.user.id,
          snapshotDate: today,
          ...input,
        });
        return { saved: true, date: today, updated: false };
      }
    }),

  /** Get the latest single snapshot (for quick dashboard summary) */
  latest: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const rows = await db
      .select()
      .from(progressSnapshots)
      .where(eq(progressSnapshots.userId, ctx.user.id))
      .orderBy(desc(progressSnapshots.snapshotDate))
      .limit(1);

    return rows.length > 0 ? rows[0] : null;
  }),
});
