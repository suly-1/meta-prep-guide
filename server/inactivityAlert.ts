/**
 * Daily Inactivity Alert
 * Runs every day at 08:00 UTC.
 * Checks for non-blocked users who haven't logged in for 14+ days and sends
 * a Manus inbox notification to the owner listing them.
 */
import cron from "node-cron";
import { getDb } from "./db";
import { users, loginEvents } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

async function runInactivityCheck() {
  try {
    const db = await getDb();
    if (!db) return;

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.blocked, 0));

    if (allUsers.length === 0) return;

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
        return u.createdAt && u.createdAt < fourteenDaysAgo;
      }
      return last < fourteenDaysAgo;
    });

    if (inactive.length === 0) return;

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

    console.log(
      `[inactivityAlert] Notified owner of ${inactive.length} inactive user(s).`
    );
  } catch (err) {
    console.error("[inactivityAlert] Error during inactivity check:", err);
  }
}

/**
 * Starts the daily inactivity alert cron job.
 * Fires every day at 08:00 UTC.
 */
export function startInactivityAlertCron() {
  // "0 8 * * *" = at 08:00 UTC every day
  cron.schedule("0 8 * * *", runInactivityCheck, {
    timezone: "UTC",
  });
  console.log(
    "[inactivityAlert] Daily inactivity check scheduled at 08:00 UTC."
  );
}
