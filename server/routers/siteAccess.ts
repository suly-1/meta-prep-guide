/**
 * siteAccess router — manages the hybrid access gate.
 *
 * checkAccess    (public)         → { locked, reason, message, daysRemaining }
 * getSettings    (ownerProcedure) → full site_settings row
 * updateSettings (ownerProcedure) → update lock config
 */
import { z } from "zod";
import { publicProcedure, ownerProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { siteSettings, users } from "../../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

/** Fetch or auto-create the singleton settings row (id=1). */
async function getOrCreateSettings() {
  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  if (rows.length > 0) return rows[0];

  // First-time bootstrap — insert default row
  await db
    .insert(siteSettings)
    .values({ id: 1, lockDays: 60, manualLockEnabled: 0 });
  const fresh = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1))
    .limit(1);
  return fresh[0] ?? null;
}

type LockState =
  | {
      locked: true;
      reason: "manual" | "expired";
      message: string;
      daysRemaining: null;
    }
  | {
      locked: false;
      reason: "active" | "no_expiry";
      message: null;
      daysRemaining: number | null;
    };

/** Determine whether the site is currently locked and why. */
function computeLockState(
  settings: NonNullable<Awaited<ReturnType<typeof getOrCreateSettings>>>
): LockState {
  // Manual lock takes priority
  if (settings.manualLockEnabled === 1) {
    return {
      locked: true,
      reason: "manual",
      message:
        settings.lockMessage ||
        "This guide is currently closed. Please check back later.",
      daysRemaining: null,
    };
  }

  // Auto-lock after N days
  if (settings.lockStartDate) {
    const start = new Date(settings.lockStartDate);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );
    const lockDays = settings.lockDays ?? 60;

    if (diffDays >= lockDays) {
      return {
        locked: true,
        reason: "expired",
        message:
          settings.lockMessage ||
          `This guide's ${lockDays}-day access window has ended. A new cohort may open soon.`,
        daysRemaining: null,
      };
    }

    return {
      locked: false,
      reason: "active",
      message: null,
      daysRemaining: lockDays - diffDays,
    };
  }

  return {
    locked: false,
    reason: "no_expiry",
    message: null,
    daysRemaining: null,
  };
}

export const siteAccessRouter = router({
  /**
   * Public — called by the AccessGate component on every page load.
   * Returns { locked, reason, message, daysRemaining }.
   * The owner is NEVER locked out — the frontend checks auth.isOwner separately.
   */
  checkAccess: publicProcedure.query(async () => {
    const settings = await getOrCreateSettings();
    if (!settings) {
      // DB unavailable — fail open (don't lock users out if DB is down)
      return {
        locked: false,
        reason: "no_expiry" as const,
        message: null,
        daysRemaining: null,
      };
    }
    return computeLockState(settings);
  }),

  /** Owner-only — returns the full settings row for the admin panel. */
  getSettings: ownerProcedure.query(async () => {
    return getOrCreateSettings();
  }),

  /**
   * Owner-only — Cohort Reset.
   * Resets the 60-day clock to today, clears all disclaimerAcknowledgedAt,
   * and sends a Manus inbox notification to the owner.
   */
  cohortReset: ownerProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const today = new Date().toISOString().slice(0, 10);

    // 1. Reset clock
    await db
      .update(siteSettings)
      .set({ lockStartDate: today, manualLockEnabled: 0 })
      .where(eq(siteSettings.id, 1));

    // 2. Clear all disclaimer acknowledgments
    await db
      .update(users)
      .set({ disclaimerAcknowledgedAt: null })
      .where(isNotNull(users.disclaimerAcknowledgedAt));

    // 3. Notify owner
    await notifyOwner({
      title: "Cohort Reset applied",
      content: [
        `**Action:** Cohort Reset`,
        `**By:** ${ctx.user!.name ?? "owner"}`,
        `**New clock start:** ${today}`,
        `**Effect:** All disclaimer acknowledgments cleared. 60-day window restarted.`,
        `**Time:** ${new Date().toISOString()}`,
      ].join("\n"),
    }).catch(() => {});

    return { success: true, newStartDate: today };
  }),

  /** Owner-only — update any combination of lock settings. */
  updateSettings: ownerProcedure
    .input(
      z.object({
        lockStartDate: z.string().max(16).nullable().optional(),
        lockDays: z.number().int().min(1).max(3650).optional(),
        manualLockEnabled: z.boolean().optional(),
        lockMessage: z.string().max(500).nullable().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const patch: Record<string, unknown> = {};
      if (input.lockStartDate !== undefined)
        patch.lockStartDate = input.lockStartDate;
      if (input.lockDays !== undefined) patch.lockDays = input.lockDays;
      if (input.manualLockEnabled !== undefined)
        patch.manualLockEnabled = input.manualLockEnabled ? 1 : 0;
      if (input.lockMessage !== undefined)
        patch.lockMessage = input.lockMessage;

      await db.update(siteSettings).set(patch).where(eq(siteSettings.id, 1));
      return { success: true };
    }),

  /**
   * Public — returns whether the disclaimer gate is currently enabled.
   * Called by DisclaimerGate to decide whether to show the gate at all.
   */
  getDisclaimerEnabled: publicProcedure.query(async () => {
    const settings = await getOrCreateSettings();
    // Default to enabled (1) if DB is unavailable
    return { enabled: settings ? settings.disclaimerEnabled !== 0 : true };
  }),

  /**
   * Owner-only — toggle the disclaimer gate on or off globally.
   * When disabled, all users skip the disclaimer regardless of their acknowledgment state.
   */
  setDisclaimerEnabled: ownerProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(siteSettings)
        .set({ disclaimerEnabled: input.enabled ? 1 : 0 })
        .where(eq(siteSettings.id, 1));
      return { success: true, enabled: input.enabled };
    }),
});
