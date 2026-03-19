import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { ctciProgress } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const ctciProgressRouter = router({
  /** Get CTCI progress for the current user */
  get: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const db = await getDb();
    if (!db) return null;
    const rows = await db
      .select()
      .from(ctciProgress)
      .where(eq(ctciProgress.userId, ctx.user.id))
      .limit(1);
    if (rows.length === 0) return null;
    return {
      solved: rows[0].solved as Record<string, boolean>,
      difficulty: rows[0].difficulty as Record<string, string>,
    };
  }),

  /** Upsert CTCI progress */
  save: protectedProcedure
    .input(
      z.object({
        solved: z.record(z.string(), z.boolean()),
        difficulty: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      const existing = await db
        .select({ id: ctciProgress.id })
        .from(ctciProgress)
        .where(eq(ctciProgress.userId, ctx.user.id))
        .limit(1);
      if (existing.length === 0) {
        await db.insert(ctciProgress).values([{
          userId: ctx.user.id,
          solved: input.solved as Record<string, boolean>,
          difficulty: input.difficulty as Record<string, string>,
        }]);
      } else {
        await db
          .update(ctciProgress)
          .set({
            solved: input.solved as Record<string, boolean>,
            difficulty: input.difficulty as Record<string, string>,
          })
          .where(eq(ctciProgress.userId, ctx.user.id));
      }
      return { success: true };
    }),
});
