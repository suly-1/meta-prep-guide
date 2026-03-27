/**
 * sprint-sw.js — Service Worker for weakness sprint notifications
 * Handles the "Snooze 30 min" action button on the notification.
 */

const SNOOZE_TAG = "meta-guide-sprint-snoozed";
const SPRINT_TAG = "meta-guide-sprint";
const SNOOZE_MS  = 30 * 60 * 1000; // 30 minutes

self.addEventListener("notificationclick", (event) => {
  const action = event.action;
  const notification = event.notification;
  notification.close();

  if (action === "snooze") {
    // Schedule a new notification after 30 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification("💪 Weakness Sprint (snoozed)", {
            body: "Your snoozed 20-minute weakness sprint is ready. Time to fix those patterns!",
            icon: "/favicon.ico",
            tag: SNOOZE_TAG,
            requireInteraction: false,
            actions: [
              { action: "snooze", title: "Snooze 30 min" },
            ],
          });
          resolve();
        }, SNOOZE_MS);
      })
    );
  }
  // Default click (no action or "open") — just focus/open the app
  else {
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow("/");
      })
    );
  }
});

// Required for the SW to activate immediately
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));
