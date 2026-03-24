/**
 * Favorites Router — save/remove/list favorite interview questions
 * Supports coding patterns, behavioral questions, system design topics, and CTCI problems.
 */
import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { favoriteQuestions } from "../../drizzle/schema";

const questionTypeSchema = z.enum(["coding", "behavioral", "design", "ctci"]);

export const favoritesRouter = router({
  /** List all favorites for the current user, newest first */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(favoriteQuestions)
      .where(eq(favoriteQuestions.userId, ctx.user.id))
      .orderBy(desc(favoriteQuestions.createdAt));
  }),

  /** Add a question to favorites (idempotent — silently ignores duplicates) */
  add: protectedProcedure
    .input(
      z.object({
        questionId: z.string().min(1).max(128),
        questionType: questionTypeSchema,
        questionText: z.string().min(1).max(512),
        notes: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if already favorited
      const existing = await db
        .select({ id: favoriteQuestions.id })
        .from(favoriteQuestions)
        .where(
          and(
            eq(favoriteQuestions.userId, ctx.user.id),
            eq(favoriteQuestions.questionId, input.questionId)
          )
        )
        .limit(1);

      if (existing.length > 0) return { id: existing[0].id, created: false };

      const result = await db.insert(favoriteQuestions).values({
        userId: ctx.user.id,
        questionId: input.questionId,
        questionType: input.questionType,
        questionText: input.questionText,
        notes: input.notes ?? null,
      });

      return { id: Number(result[0].insertId), created: true };
    }),

  /** Remove a question from favorites */
  remove: protectedProcedure
    .input(z.object({ questionId: z.string().min(1).max(128) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .delete(favoriteQuestions)
        .where(
          and(
            eq(favoriteQuestions.userId, ctx.user.id),
            eq(favoriteQuestions.questionId, input.questionId)
          )
        );

      return { success: true };
    }),

  /** Toggle favorite status — adds if not present, removes if present */
  toggle: protectedProcedure
    .input(
      z.object({
        questionId: z.string().min(1).max(128),
        questionType: questionTypeSchema,
        questionText: z.string().min(1).max(512),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const existing = await db
        .select({ id: favoriteQuestions.id })
        .from(favoriteQuestions)
        .where(
          and(
            eq(favoriteQuestions.userId, ctx.user.id),
            eq(favoriteQuestions.questionId, input.questionId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .delete(favoriteQuestions)
          .where(
            and(
              eq(favoriteQuestions.userId, ctx.user.id),
              eq(favoriteQuestions.questionId, input.questionId)
            )
          );
        return { favorited: false };
      } else {
        await db.insert(favoriteQuestions).values({
          userId: ctx.user.id,
          questionId: input.questionId,
          questionType: input.questionType,
          questionText: input.questionText,
          notes: null,
        });
        return { favorited: true };
      }
    }),

  /** Update notes on a favorited question */
  updateNotes: protectedProcedure
    .input(
      z.object({
        questionId: z.string().min(1).max(128),
        notes: z.string().max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(favoriteQuestions)
        .set({ notes: input.notes })
        .where(
          and(
            eq(favoriteQuestions.userId, ctx.user.id),
            eq(favoriteQuestions.questionId, input.questionId)
          )
        );

      return { success: true };
    }),
});
