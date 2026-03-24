/**
 * adminUsers router — owner-only user management
 * Provides list, block, and unblock operations for all registered users.
 */
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { ownerProcedure, router } from "../_core/trpc";

export const adminUsersRouter = router({
  /** List all registered users (owner only) */
  listUsers: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        blocked: users.blocked,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
        disclaimerAcknowledgedAt: users.disclaimerAcknowledgedAt,
      })
      .from(users)
      .orderBy(users.createdAt);
    return rows;
  }),

  /** Block a user by ID — they will see "Access Revoked" on every page load */
  blockUser: ownerProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      // Owner cannot block themselves
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });
      const [target] = await db
        .select({ id: users.id, openId: users.openId })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (target.openId === ctx.user.openId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot block yourself",
        });
      }

      await db
        .update(users)
        .set({ blocked: 1 })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  /** Unblock a user by ID — restores full access immediately */
  unblockUser: ownerProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });
      const [target] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      await db
        .update(users)
        .set({ blocked: 0 })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),
});
