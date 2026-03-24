/**
 * adminUsers router — owner-only user management.
 *
 * listUsers   (ownerProcedure) → paginated user list with blocked status + reason
 * blockUser   (ownerProcedure) → block a user, record reason, write audit log, notify owner
 * unblockUser (ownerProcedure) → unblock a user, write audit log, notify owner
 * listEvents  (ownerProcedure) → audit log of all block/unblock actions
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import { users, userEvents } from "../../drizzle/schema";
import { ownerProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";

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
        blockReason: users.blockReason,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(users.createdAt);
    return rows;
  }),

  /** Block a user by ID — they will see "Access Revoked" on every page load */
  blockUser: ownerProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });

      const [target] = await db
        .select({ id: users.id, openId: users.openId, name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Owner cannot block themselves
      if (target.openId === ctx.user.openId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot block yourself",
        });
      }

      await db
        .update(users)
        .set({ blocked: 1, blockReason: input.reason ?? null })
        .where(eq(users.id, input.userId));

      // Write audit log
      await db.insert(userEvents).values({
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? "owner",
        targetId: target.id,
        targetName: target.name ?? String(target.id),
        eventType: "block",
        metadata: input.reason ? { reason: input.reason } : {},
      });

      // Notify owner via Manus inbox
      await notifyOwner({
        title: `User blocked: ${target.name ?? target.id}`,
        content: [
          `**Action:** Block`,
          `**Target:** ${target.name ?? "unknown"} (ID: ${target.id})`,
          `**By:** ${ctx.user.name ?? "owner"}`,
          `**Reason:** ${input.reason ?? "(none provided)"}`,
          `**Time:** ${new Date().toISOString()}`,
        ].join("\n"),
      }).catch(() => {
        /* non-fatal — block still applied */
      });

      return { success: true };
    }),

  /** Unblock a user by ID — restores full access immediately */
  unblockUser: ownerProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });

      const [target] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      await db
        .update(users)
        .set({ blocked: 0, blockReason: null })
        .where(eq(users.id, input.userId));

      // Write audit log
      await db.insert(userEvents).values({
        actorId: ctx.user.id,
        actorName: ctx.user.name ?? "owner",
        targetId: target.id,
        targetName: target.name ?? String(target.id),
        eventType: "unblock",
        metadata: {},
      });

      // Notify owner via Manus inbox
      await notifyOwner({
        title: `User unblocked: ${target.name ?? target.id}`,
        content: [
          `**Action:** Unblock`,
          `**Target:** ${target.name ?? "unknown"} (ID: ${target.id})`,
          `**By:** ${ctx.user.name ?? "owner"}`,
          `**Time:** ${new Date().toISOString()}`,
        ].join("\n"),
      }).catch(() => {
        /* non-fatal */
      });

      return { success: true };
    }),

  /** Audit log — last 200 block/unblock events (owner only) */
  listEvents: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(userEvents)
      .orderBy(desc(userEvents.createdAt))
      .limit(200);
  }),
});
