/**
 * useAnalytics — lightweight first-party analytics tracker.
 *
 * Tracks:
 *  - Session start (device type, browser, OS)
 *  - Page views (tab changes)
 *  - Feature engagement events (explicit calls)
 *  - Session duration (heartbeat every 30s + on unload)
 *
 * No PII is collected. Session ID is a random UUID stored in sessionStorage.
 * All data is sent to the server via tRPC (fire-and-forget).
 */
import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateSessionId(): string {
  const key = "mg_session_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function detectDevice(): "desktop" | "tablet" | "mobile" {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Other";
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
    return "iOS";
  return "Other";
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseAnalyticsOptions {
  /** Current page/tab name, e.g. "overview" | "coding" | "behavioral" | "design" */
  page: string;
  /** Optional authenticated user ID */
  userId?: number | null;
}

export function useAnalytics({ page, userId }: UseAnalyticsOptions) {
  const sessionId = useRef(getOrCreateSessionId());
  const sessionStarted = useRef(false);
  const lastPage = useRef<string>("");
  const sessionStartTime = useRef(Date.now());

  const startSession = trpc.analytics.startSession.useMutation();
  const trackPageView = trpc.analytics.trackPageView.useMutation();
  const trackEvent = trpc.analytics.trackEvent.useMutation();
  const endSession = trpc.analytics.endSession.useMutation();

  // Start session once per browser tab
  useEffect(() => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;
    sessionStartTime.current = Date.now();

    startSession
      .mutateAsync({
        sessionId: sessionId.current,
        userId: userId ?? null,
        deviceType: detectDevice(),
        browser: detectBrowser(),
        os: detectOS(),
        referrer: document.referrer || null,
      })
      .catch(() => null);

    // Heartbeat: update duration every 30s
    const heartbeat = setInterval(() => {
      const seconds = Math.round(
        (Date.now() - sessionStartTime.current) / 1000
      );
      endSession
        .mutateAsync({
          sessionId: sessionId.current,
          durationSeconds: seconds,
          ended: false,
        })
        .catch(() => null);
    }, 30_000);

    // End session on tab close
    const handleUnload = () => {
      const seconds = Math.round(
        (Date.now() - sessionStartTime.current) / 1000
      );
      // Use sendBeacon for reliability on unload
      const payload = JSON.stringify({
        sessionId: sessionId.current,
        durationSeconds: seconds,
        ended: true,
      });
      navigator.sendBeacon?.("/api/analytics/end-session", payload);
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => {
      clearInterval(heartbeat);
      window.removeEventListener("beforeunload", handleUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track page views when page changes
  useEffect(() => {
    if (lastPage.current === page) return;
    lastPage.current = page;

    trackPageView
      .mutateAsync({
        sessionId: sessionId.current,
        userId: userId ?? null,
        page,
        referrer: document.referrer || null,
      })
      .catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, userId]);

  // Expose a function to track feature engagement events
  const track = useCallback(
    (eventName: string, metadata?: Record<string, unknown>) => {
      trackEvent
        .mutateAsync({
          sessionId: sessionId.current,
          userId: userId ?? null,
          eventName,
          page,
          metadata: metadata ?? {},
        })
        .catch(() => null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, userId]
  );

  return { track, sessionId: sessionId.current };
}
