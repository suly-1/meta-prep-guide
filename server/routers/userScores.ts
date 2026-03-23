/**
 * User Scores Router
 * Persists pattern ratings, behavioral ratings, STAR notes, and time data
 * to the DB for cross-device sync. Also provides anonymized aggregate stats.
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { userScores } from "../../drizzle/schema";
import { eq, count } from "drizzle-orm";

export const userScoresRouter = router({
  /** Load scores for the current user (merges with localStorage on client) */
  load: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db
      .select()
      .from(userScores)
      .where(eq(userScores.userId, ctx.user.id))
      .limit(1);
    if (!row) return null;
    return {
      patternRatings: row.patternRatings as Record<string, number>,
      behavioralRatings: row.behavioralRatings as Record<string, number>,
      starNotes: row.starNotes as Record<string, string>,
      patternTime: row.patternTime as Record<string, number>,
      interviewDate: row.interviewDate,
      targetLevel: row.targetLevel,
      updatedAt: row.updatedAt,
    };
  }),

  /** Save/upsert scores for the current user */
  save: protectedProcedure
    .input(
      z.object({
        patternRatings: z.record(z.string(), z.number()).optional(),
        behavioralRatings: z.record(z.string(), z.number()).optional(),
        starNotes: z.record(z.string(), z.string()).optional(),
        patternTime: z.record(z.string(), z.number()).optional(),
        interviewDate: z.string().max(16).optional(),
        targetLevel: z.string().max(8).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const existing = await db
        .select({ id: userScores.id })
        .from(userScores)
        .where(eq(userScores.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(userScores)
          .set({
            ...(input.patternRatings !== undefined && {
              patternRatings: input.patternRatings,
            }),
            ...(input.behavioralRatings !== undefined && {
              behavioralRatings: input.behavioralRatings,
            }),
            ...(input.starNotes !== undefined && {
              starNotes: input.starNotes,
            }),
            ...(input.patternTime !== undefined && {
              patternTime: input.patternTime,
            }),
            ...(input.interviewDate !== undefined && {
              interviewDate: input.interviewDate,
            }),
            ...(input.targetLevel !== undefined && {
              targetLevel: input.targetLevel,
            }),
          })
          .where(eq(userScores.userId, ctx.user.id));
      } else {
        await db.insert(userScores).values({
          userId: ctx.user.id,
          patternRatings: input.patternRatings ?? {},
          behavioralRatings: input.behavioralRatings ?? {},
          starNotes: input.starNotes ?? {},
          patternTime: input.patternTime ?? {},
          interviewDate: input.interviewDate ?? null,
          targetLevel: input.targetLevel ?? null,
        });
      }
      return { success: true };
    }),

  /** Get anonymized aggregate stats for the analytics dashboard */
  getAggregateStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalUsers: 0, patternAvgRatings: {}, bqAvgRatings: {} };
    const [totalResult] = await db.select({ total: count() }).from(userScores);

    const total = totalResult?.total ?? 0;

    // Get all scores to compute aggregate pattern stats
    const allScores = await db
      .select({
        patternRatings: userScores.patternRatings,
        behavioralRatings: userScores.behavioralRatings,
      })
      .from(userScores)
      .limit(1000); // cap for performance

    // Aggregate pattern mastery across all users
    const patternTotals: Record<string, { sum: number; count: number }> = {};
    const bqTotals: Record<string, { sum: number; count: number }> = {};

    for (const row of allScores) {
      const pr = row.patternRatings as Record<string, number>;
      const br = row.behavioralRatings as Record<string, number>;
      for (const [k, v] of Object.entries(pr)) {
        if (!patternTotals[k]) patternTotals[k] = { sum: 0, count: 0 };
        patternTotals[k].sum += v;
        patternTotals[k].count += 1;
      }
      for (const [k, v] of Object.entries(br)) {
        if (!bqTotals[k]) bqTotals[k] = { sum: 0, count: 0 };
        bqTotals[k].sum += v;
        bqTotals[k].count += 1;
      }
    }

    const patternAvg: Record<string, number> = {};
    for (const [k, v] of Object.entries(patternTotals)) {
      patternAvg[k] = Math.round((v.sum / v.count) * 10) / 10;
    }

    const bqAvg: Record<string, number> = {};
    for (const [k, v] of Object.entries(bqTotals)) {
      bqAvg[k] = Math.round((v.sum / v.count) * 10) / 10;
    }

    return {
      totalUsers: total,
      patternAvgRatings: patternAvg,
      bqAvgRatings: bqAvg,
    };
  }),
});
