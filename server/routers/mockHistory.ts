import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { mockSessions } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const SESSION_TYPES = ["coding", "sd", "xfn"] as const;
type SessionType = (typeof SESSION_TYPES)[number];

export const mockHistoryRouter = router({
  /** Get all mock sessions of a given type for the current user */
  getByType: publicProcedure
    .input(z.object({ sessionType: z.enum(SESSION_TYPES) }))
    .query(async ({ ctx, input }) => {
      if (!ctx.user) return [];
      const db = await getDb();
      if (!db) return [];
      const rows = await db
        .select()
        .from(mockSessions)
        .where(
          and(
            eq(mockSessions.userId, ctx.user.id),
            eq(mockSessions.sessionType, input.sessionType)
          )
        )
        .orderBy(desc(mockSessions.createdAt))
        .limit(50);
      return rows.map((r) => ({
        sessionId: r.sessionId,
        sessionData: r.sessionData as Record<string, unknown>,
        createdAt: r.createdAt,
      }));
    }),

  /** Upsert a single mock session (insert-or-ignore on duplicate sessionId) */
  upsertSession: protectedProcedure
    .input(
      z.object({
        sessionType: z.enum(SESSION_TYPES),
        sessionId: z.string().min(1).max(64),
        sessionData: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      // Check if already exists
      const existing = await db
        .select({ id: mockSessions.id })
        .from(mockSessions)
        .where(
          and(
            eq(mockSessions.userId, ctx.user.id),
            eq(mockSessions.sessionId, input.sessionId)
          )
        )
        .limit(1);
      if (existing.length > 0) return { success: true }; // already synced
      await db.insert(mockSessions).values([{
        userId: ctx.user.id,
        sessionType: input.sessionType,
        sessionId: input.sessionId,
        sessionData: input.sessionData as Record<string, unknown>,
      }]);
      return { success: true };
    }),

  /** Delete a mock session by sessionId */
  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };
      await db
        .delete(mockSessions)
        .where(
          and(
            eq(mockSessions.userId, ctx.user.id),
            eq(mockSessions.sessionId, input.sessionId)
          )
        );
      return { success: true };
    }),
});
