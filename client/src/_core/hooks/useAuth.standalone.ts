/**
 * Standalone useAuth mock — used in the self-contained HTML export.
 *
 * Returns a regular (non-admin) guest user. Admin pages check isOwner via
 * trpc.auth.isOwner, which also returns false in standalone mode, so
 * the admin panel is completely inaccessible to all visitors on the
 * static build at metaguide.blog.
 *
 * Only the live Manus-hosted app (metaguide.one) performs real OAuth
 * and grants admin access to the owner.
 */

export function useAuth() {
  return {
    user: {
      id: 0,
      name: "Guest",
      email: "",
      role: "user" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastSignedIn: new Date().toISOString(),
      disclaimerAcknowledgedAt: null,
      blocked: 0,
      blockReason: null,
      blockedUntil: null,
    },
    loading: false,
    error: null,
    isAuthenticated: false,
    logout: () => {},
  };
}

export function getLoginUrl(returnPath?: string) {
  return "#";
}
