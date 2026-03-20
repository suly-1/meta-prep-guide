/**
 * Standalone useAuth mock — used in the self-contained HTML export.
 * Always returns "not authenticated" so all auth-gated DB calls are skipped.
 */

export function useAuth() {
  return {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    logout: () => {},
  };
}

export function getLoginUrl(returnPath?: string) {
  return "#";
}
