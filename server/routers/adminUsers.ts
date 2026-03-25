/**
 * adminUsers router — owner-only user management.
 *
 * listUsers          (ownerProcedure) → user list with blocked status, reason, blockedUntil
 * blockUser          (ownerProcedure) → block user, optional reason + auto-expiry, audit log, notify
 * unblockUser        (ownerProcedure) → unblock user, audit log, notify
 * reBlockUser        (ownerProcedure) → re-apply block from audit log row (supports expiryDays)
 * extendBlock         (ownerProcedure) → modify blockedUntil on an already-blocked user
 * listEvents         (ownerProcedure) → audit log (last 200 events)
 * exportAuditLogCsv  (ownerProcedure) → full audit log as CSV string
 * getUserLoginHistory(ownerProcedure) → last 5 login timestamps per user
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, inArray, gte, sql } from "drizzle-orm";
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
  /**
   * Cohort health summary — total users, weekly active, currently blocked.
   * "Weekly active" = logged in at least once in the last 7 days.
   */
  getUserStats: ownerProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, weeklyActive: 0, blocked: 0 };

    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

    const [totals] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        blocked: sql<number>`SUM(CASE WHEN ${users.blocked} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(users);

    // Count distinct users who logged in within the last 7 days
    const [activeRow] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${loginEvents.userId})` })
      .from(loginEvents)
      .where(gte(loginEvents.createdAt, sevenDaysAgo));

    return {
      total: Number(totals?.total ?? 0),
      weeklyActive: Number(activeRow?.count ?? 0),
      blocked: Number(totals?.blocked ?? 0),
    };
  }),

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

      if (target.openId === ctx.user!.openId)
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
        actorId: ctx.user!.id,
        actorName: ctx.user!.name,
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
          `**By:** ${ctx.user!.name ?? "owner"}`,
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
        actorId: ctx.user!.id,
        actorName: ctx.user!.name,
        targetId: target.id,
        targetName: target.name,
        eventType: "unblock",
      });

      await notifyOwner({
        title: `User unblocked: ${target.name ?? target.id}`,
        content: [
          `**Action:** Unblock`,
          `**Target:** ${target.name ?? "unknown"} (ID: ${target.id})`,
          `**By:** ${ctx.user!.name ?? "owner"}`,
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
        /** Optional: auto-unblock after this many days (0 = permanent) */
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
      if (target.openId === ctx.user!.openId)
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
          blockReason: input.reason ?? "Re-blocked from audit log",
          blockedUntil,
        })
        .where(eq(users.id, input.userId));
      await writeAuditLog(db, {
        actorId: ctx.user!.id,
        actorName: ctx.user!.name,
        targetId: target.id,
        targetName: target.name,
        eventType: "block",
        metadata: {
          reason: input.reason ?? "Re-blocked from audit log",
          source: "reblock_shortcut",
          ...(blockedUntil ? { blockedUntil: blockedUntil.toISOString() } : {}),
        },
      });
      await notifyOwner({
        title: `User re-blocked: ${target.name ?? target.id}`,
        content: [
          `**Action:** Re-block (from audit log shortcut)`,
          `**Target:** ${target.name ?? "unknown"} (ID: ${target.id})`,
          `**By:** ${ctx.user!.name ?? "owner"}`,
          `**Auto-unblock:** ${blockedUntil ? blockedUntil.toISOString() : "never"}`,
          `**Time:** ${new Date().toISOString()}`,
        ].join("\n"),
      }).catch(() => {});
      return { success: true };
    }),

  /**
   * Extend (or shorten) the block duration for an already-blocked user.
   * Can also convert a permanent block to a temporary one and vice-versa.
   * Does NOT change the blockReason unless a new reason is provided.
   */
  extendBlock: ownerProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        /** New expiry in days from NOW. Pass 0 to make the block permanent. */
        expiryDays: z.number().int().min(0).max(365),
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
        .select({
          id: users.id,
          openId: users.openId,
          name: users.name,
          blocked: users.blocked,
          blockReason: users.blockReason,
          blockedUntil: users.blockedUntil,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      if (!target)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      if (target.openId === ctx.user!.openId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot modify your own block",
        });
      if (target.blocked !== 1)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User is not currently blocked",
        });
      const newBlockedUntil =
        input.expiryDays > 0
          ? new Date(Date.now() + input.expiryDays * 86_400_000)
          : null;
      const newReason = input.reason ?? target.blockReason ?? null;
      await db
        .update(users)
        .set({ blockedUntil: newBlockedUntil, blockReason: newReason })
        .where(eq(users.id, input.userId));
      const prevExpiry = target.blockedUntil
        ? target.blockedUntil.toISOString()
        : "permanent";
      const newExpiry = newBlockedUntil
        ? newBlockedUntil.toISOString()
        : "permanent";
      await writeAuditLog(db, {
        actorId: ctx.user!.id,
        actorName: ctx.user!.name,
        targetId: target.id,
        targetName: target.name,
        eventType: "block_extended",
        metadata: {
          prevExpiry,
          newExpiry,
          ...(input.reason ? { reason: input.reason } : {}),
        },
      });
      await notifyOwner({
        title: `Block modified: ${target.name ?? target.id}`,
        content: [
          `**Action:** Block duration modified`,
          `**Target:** ${target.name ?? "unknown"} (ID: ${target.id})`,
          `**By:** ${ctx.user!.name ?? "owner"}`,
          `**Previous expiry:** ${prevExpiry}`,
          `**New expiry:** ${newExpiry}`,
          `**Time:** ${new Date().toISOString()}`,
        ].join("\n"),
      }).catch(() => {});
      return { success: true, newBlockedUntil };
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

  /**
   * Check for users who haven't logged in for 14+ days and send a Manus
   * notification to the owner listing them. Designed to be called by a
   * scheduled cron job or manually from the admin panel.
   */
  checkInactiveUsers: ownerProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) return { notified: false, count: 0 };

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Find all non-blocked users whose last login was > 14 days ago
    // (or who have never logged in and registered > 14 days ago)
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.blocked, 0));

    if (allUsers.length === 0) return { notified: false, count: 0 };

    // Get the most recent login for each user
    const latestLogins = await db
      .select({
        userId: loginEvents.userId,
        lastLogin: sql<Date>`MAX(${loginEvents.createdAt})`.as("lastLogin"),
      })
      .from(loginEvents)
      .groupBy(loginEvents.userId);

    const latestMap: Record<number, Date> = {};
    for (const row of latestLogins) {
      latestMap[row.userId] = row.lastLogin;
    }

    const inactive = allUsers.filter(u => {
      const last = latestMap[u.id];
      if (!last) {
        // Never logged in — check if account is older than 14 days
        return u.createdAt && u.createdAt < fourteenDaysAgo;
      }
      return last < fourteenDaysAgo;
    });

    if (inactive.length === 0) return { notified: false, count: 0 };

    const lines = inactive.map(u => {
      const last = latestMap[u.id];
      const lastStr = last
        ? last.toISOString().slice(0, 10)
        : "never logged in";
      return `- ${u.name ?? u.email ?? `User #${u.id}`} (last login: ${lastStr})`;
    });

    await notifyOwner({
      title: `⚠️ ${inactive.length} inactive user${inactive.length === 1 ? "" : "s"} (14+ days)`,
      content: [
        `The following users have not logged in for 14 or more days:`,
        "",
        ...lines,
        "",
        `Consider following up or blocking inactive accounts before their 60-day window closes.`,
      ].join("\n"),
    }).catch(() => {});

    return { notified: true, count: inactive.length };
  }),
});
