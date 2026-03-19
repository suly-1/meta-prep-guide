import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { leaderboardEntries } from "../../drizzle/schema";
import { desc, eq } from "drizzle-orm";

// ── Leaderboard Router ────────────────────────────────────────────────────────
export const leaderboardRouter = router({
  // Get top 20 entries
  getTop: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select()
      .from(leaderboardEntries)
      .orderBy(desc(leaderboardEntries.patternsMastered), desc(leaderboardEntries.streakDays))
      .limit(20);
    return rows;
  }),

  // Upsert a leaderboard entry by handle
  upsert: publicProcedure
    .input(
      z.object({
        anonHandle: z.string().min(2).max(32),
        streakDays: z.number().int().min(0),
        patternsMastered: z.number().int().min(0).max(20),
        mockSessions: z.number().int().min(0),
        overallPct: z.number().int().min(0).max(100),
        badges: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if handle already exists
      const existing = await db
        .select()
        .from(leaderboardEntries)
        .where(eq(leaderboardEntries.anonHandle, input.anonHandle))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(leaderboardEntries)
          .set({
            streakDays: input.streakDays,
            patternsMastered: input.patternsMastered,
            mockSessions: input.mockSessions,
            overallPct: input.overallPct,
            badges: input.badges,
          })
          .where(eq(leaderboardEntries.anonHandle, input.anonHandle));
      } else {
        await db.insert(leaderboardEntries).values({
          anonHandle: input.anonHandle,
          streakDays: input.streakDays,
          patternsMastered: input.patternsMastered,
          mockSessions: input.mockSessions,
          overallPct: input.overallPct,
          badges: input.badges,
        });
      }

      return { success: true, handle: input.anonHandle };
    }),

  // Remove a handle from the leaderboard
  remove: publicProcedure
    .input(z.object({ anonHandle: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .delete(leaderboardEntries)
        .where(eq(leaderboardEntries.anonHandle, input.anonHandle));
      return { success: true };
    }),

  // Check if a handle is taken
  checkHandle: publicProcedure
    .input(z.object({ anonHandle: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { taken: false };
      const rows = await db
        .select({ id: leaderboardEntries.id })
        .from(leaderboardEntries)
        .where(eq(leaderboardEntries.anonHandle, input.anonHandle))
        .limit(1);
      return { taken: rows.length > 0 };
    }),
});
