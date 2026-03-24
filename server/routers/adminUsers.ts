/**
 * adminUsers router — owner-only user management.
 *
 * listUsers          (ownerProcedure) → user list with blocked status, reason, blockedUntil
 * blockUser          (ownerProcedure) → block user, optional reason + auto-expiry, audit log, notify
 * unblockUser        (ownerProcedure) → unblock user, audit log, notify
 * reBlockUser        (ownerProcedure) → re-apply block from audit log row
 * listEvents         (ownerProcedure) → audit log (last 200 events)
 * exportAuditLogCsv  (ownerProcedure) → full audit log as CSV string
 * getUserLoginHistory(ownerProcedure) → last 5 login timestamps per user
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, inArray } from "drizzle-orm";
import { getDb } from "../db";
import { users, userEvents, loginEvents } from "../../drizzle/schema";
import { ownerProcedure, router } from "../_core/trpc";
import { notifyOwner } from "../_core/notification";

/** Helper: write an audit log row */
async function writeAuditLog(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  opts: {
    actorId: number;
    actorName: string | null;
    targetId: number;
    targetName: string | null;
    eventType: string;
    metadata?: Record<string, unknown>;
  }
) {
  await db.insert(userEvents).values({
    actorId: opts.actorId,
    actorName: opts.actorName ?? "owner",
    targetId: opts.targetId,
    targetName: opts.targetName ?? String(opts.targetId),
    eventType: opts.eventType,
    metadata: opts.metadata ?? {},
  });
}

export const adminUsersRouter = router({
  /** List all registered users (owner only) */
  listUsers: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        blocked: users.blocked,
        blockReason: users.blockReason,
        blockedUntil: users.blockedUntil,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      })
      .from(users)
      .orderBy(users.createdAt);
  }),

  /** Block a user by ID — optional reason + optional auto-expiry */
  blockUser: ownerProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        reason: z.string().max(500).optional(),
        /** Auto-unblock after this many days (0 = permanent) */
        expiryDays: z.number().int().min(0).max(365).optional(),
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

      if (!target)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      if (target.openId === ctx.user.openId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot block yourself",
        });

      const blockedUntil =
        input.expiryDays && input.expiryDays > 0
          ? new Date(Date.now() + input.expiryDays * 86_400_000)
          : null;

      await db
        .update(users)
        .set({
          blocked: 1,
          blockReason: input.reason ?? null,
          blockedUntil,
        })
        .where(eq(users.id, input.userId));

      await writeAuditLog(db, {
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        targetId: target.id,
        targetName: target.name,
        eventType: "block",
        metadata: {
          ...(input.reason ? { reason: input.reason } : {}),
          ...(blockedUntil ? { blockedUntil: blockedUntil.toISOString() } : {}),
        },
      });

      await notifyOwner({
        title: `User blocked: ${target.name ?? target.id}`,
        content: [
          `**Action:** Block`,
          `**Target:** ${target.name ?? "unknown"} (ID: ${target.id})`,
          `**By:** ${ctx.user.name ?? "owner"}`,
          `**Reason:** ${input.reason ?? "(none provided)"}`,
          `**Auto-unblock:** ${blockedUntil ? blockedUntil.toISOString() : "never"}`,
          `**Time:** ${new Date().toISOString()}`,
        ].join("\n"),
      }).catch(() => {});

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

      if (!target)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      await db
        .update(users)
        .set({ blocked: 0, blockReason: null, blockedUntil: null })
        .where(eq(users.id, input.userId));

      await writeAuditLog(db, {
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        targetId: target.id,
        targetName: target.name,
        eventType: "unblock",
      });

      await notifyOwner({
        title: `User unblocked: ${target.name ?? target.id}`,
        content: [
          `**Action:** Unblock`,
          `**Target:** ${target.name ?? "unknown"} (ID: ${target.id})`,
          `**By:** ${ctx.user.name ?? "owner"}`,
          `**Time:** ${new Date().toISOString()}`,
        ].join("\n"),
      }).catch(() => {});

      return { success: true };
    }),

  /**
   * Re-block a user directly from an audit log row.
   * Accepts the targetId from an "unblock" event and re-applies the block.
   */
  reBlockUser: ownerProcedure
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

      if (!target)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      if (target.openId === ctx.user.openId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot block yourself",
        });

      await db
        .update(users)
        .set({
          blocked: 1,
          blockReason: input.reason ?? "Re-blocked from audit log",
          blockedUntil: null,
        })
        .where(eq(users.id, input.userId));

      await writeAuditLog(db, {
        actorId: ctx.user.id,
        actorName: ctx.user.name,
        targetId: target.id,
        targetName: target.name,
        eventType: "block",
        metadata: {
          reason: input.reason ?? "Re-blocked from audit log",
          source: "reblock_shortcut",
        },
      });

      await notifyOwner({
        title: `User re-blocked: ${target.name ?? target.id}`,
        content: [
          `**Action:** Re-block (from audit log shortcut)`,
          `**Target:** ${target.name ?? "unknown"} (ID: ${target.id})`,
          `**By:** ${ctx.user.name ?? "owner"}`,
          `**Time:** ${new Date().toISOString()}`,
        ].join("\n"),
      }).catch(() => {});

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

  /**
   * Export the full audit log as a CSV string.
   * Returns { csv: string } — the client triggers a download.
   */
  exportAuditLogCsv: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { csv: "" };

    const rows = await db
      .select()
      .from(userEvents)
      .orderBy(desc(userEvents.createdAt));

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const header = [
      "id",
      "eventType",
      "actorId",
      "actorName",
      "targetId",
      "targetName",
      "metadata",
      "createdAt",
    ].join(",");

    const lines = rows.map(r =>
      [
        r.id,
        escape(r.eventType),
        r.actorId,
        escape(r.actorName),
        r.targetId,
        escape(r.targetName),
        escape(JSON.stringify(r.metadata ?? {})),
        escape(r.createdAt?.toISOString() ?? ""),
      ].join(",")
    );

    return { csv: [header, ...lines].join("\n") };
  }),

  /**
   * Get the last 5 login timestamps for each user ID in the list.
   * Returns a map of userId → Date[].
   */
  getUserLoginHistory: ownerProcedure
    .input(z.object({ userIds: z.array(z.number().int().positive()) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db || input.userIds.length === 0) return {};

      const rows = await db
        .select()
        .from(loginEvents)
        .where(inArray(loginEvents.userId, input.userIds))
        .orderBy(desc(loginEvents.createdAt));

      // Group by userId, keep last 5 per user
      const map: Record<number, Date[]> = {};
      for (const row of rows) {
        if (!map[row.userId]) map[row.userId] = [];
        if (map[row.userId].length < 5) {
          map[row.userId].push(row.createdAt);
        }
      }
      return map;
    }),
});
