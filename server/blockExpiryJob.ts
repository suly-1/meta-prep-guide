/**
 * Block Expiry Job
 *
 * Runs every 5 minutes. Finds all users whose blockedUntil timestamp has
 * passed and lifts their block automatically, writing an audit log entry
 * for each one.
 *
 * This is a belt-and-suspenders complement to the on-request auto-unblock
 * already in requireUser (server/_core/trpc.ts). That middleware handles
 * expiry the moment a user makes a request; this job handles the case where
 * a user never makes a request but an admin is looking at the user table and
 * expects to see the status update.
 */
import cron from "node-cron";
import { and, eq, lte, isNotNull } from "drizzle-orm";
import { getDb } from "./db";
import { users, userEvents } from "../drizzle/schema";

async function runBlockExpiryCheck() {
  try {
    const db = await getDb();
    if (!db) return;

    const now = new Date();

    // Find all users who are blocked AND have a blockedUntil that has passed
    const expired = await db
      .select({
        id: users.id,
        name: users.name,
        blockedUntil: users.blockedUntil,
      })
      .from(users)
      .where(
        and(
          eq(users.blocked, 1),
          isNotNull(users.blockedUntil),
          lte(users.blockedUntil, now)
        )
      );

    if (expired.length === 0) return;

    for (const u of expired) {
      // Lift the block
      await db
        .update(users)
        .set({ blocked: 0, blockReason: null, blockedUntil: null })
        .where(eq(users.id, u.id));

      // Write an audit log entry so the admin can see the automatic unblock
      await db.insert(userEvents).values({
        actorId: 0, // 0 = system
        actorName: "System (auto-expiry)",
        targetId: u.id,
        targetName: u.name,
        eventType: "unblock",
        metadata: {
          reason: "Temporary block expired automatically",
          blockedUntil: u.blockedUntil?.toISOString() ?? null,
          source: "block_expiry_cron",
        },
      });

      console.log(
        `[blockExpiry] Auto-unblocked user #${u.id} (${u.name ?? "unknown"}) — blockedUntil was ${u.blockedUntil?.toISOString()}`
      );
    }

    if (expired.length > 0) {
      console.log(
        `[blockExpiry] Auto-expired ${expired.length} temporary block(s).`
      );
    }
  } catch (err) {
    console.error("[blockExpiry] Error during block expiry check:", err);
  }
}

/**
 * Starts the block expiry cron job.
 * Fires every 5 minutes to lift expired temporary blocks.
 */
export function startBlockExpiryCron() {
  // "0 */5 * * * *" = every 5 minutes (6-field cron: seconds minutes hours dom month dow)
  cron.schedule("0 */5 * * * *", runBlockExpiryCheck);
  console.log("[blockExpiry] Block expiry check scheduled every 5 minutes.");
}
