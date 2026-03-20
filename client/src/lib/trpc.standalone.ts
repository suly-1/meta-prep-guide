/**
 * Standalone tRPC mock — used in the self-contained HTML export.
 * All server calls are replaced with localStorage-only implementations
 * so the guide works fully offline with no Manus account.
 *
 * The shape mirrors the real trpc client so components need zero changes.
 */

// ─── helpers ────────────────────────────────────────────────────────────────

function ls<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Returns a React-Query-compatible query result object */
function makeQuery<T>(data: T) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: () => Promise.resolve({ data }),
  };
}

/** Returns a React-Query-compatible mutation object */
function makeMutation<TInput = unknown, TOutput = unknown>(
  fn: (input: TInput) => TOutput | Promise<TOutput>
) {
  let isPending = false;
  const listeners: Array<() => void> = [];

  return {
    mutate: (input: TInput, opts?: { onSuccess?: (d: TOutput) => void; onError?: (e: unknown) => void }) => {
      isPending = true;
      Promise.resolve(fn(input))
        .then((d) => {
          isPending = false;
          opts?.onSuccess?.(d);
        })
        .catch((e) => {
          isPending = false;
          opts?.onError?.(e);
        });
    },
    mutateAsync: (input: TInput) => Promise.resolve(fn(input)),
    isPending,
    isError: false,
    error: null,
    reset: () => {},
  };
}

// ─── stub implementations ────────────────────────────────────────────────────

const RATINGS_KEY = "meta_prep_ratings_v1";
const BQ_RATINGS_KEY = "meta_prep_bq_ratings_v1";
const CTCI_KEY = "meta_prep_ctci_v1";
const ONBOARDING_KEY = "meta_prep_onboarding_v1";

export const trpc = {
  // ── auth ──────────────────────────────────────────────────────────────────
  auth: {
    me: {
      useQuery: () => makeQuery(null),
    },
    logout: {
      useMutation: () => makeMutation(() => {}),
    },
  },

  // ── disclaimer ────────────────────────────────────────────────────────────
  // In standalone mode, the DB is not available.
  // Return acknowledged: false so the gate uses localStorage only
  // (the useDisclaimerGate hook will fall back to localStorage for anonymous users)
  disclaimer: {
    status: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ acknowledged: false, acknowledgedAt: null }),
    },
    acknowledge: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    adminReport: {
      useQuery: () => makeQuery([]),
    },
  },

  // ── ratings ───────────────────────────────────────────────────────────────
  ratings: {
    getAll: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({
          patternRatings: ls<Record<string, number>>(RATINGS_KEY, {}),
          bqRatings: ls<Record<string, number>>(BQ_RATINGS_KEY, {}),
        }),
    },
    savePatternRatings: {
      useMutation: () =>
        makeMutation((input: { ratings: Record<string, number> }) => {
          lsSet(RATINGS_KEY, input.ratings);
          return { success: true };
        }),
    },
    saveBqRatings: {
      useMutation: () =>
        makeMutation((input: { ratings: Record<string, number> }) => {
          lsSet(BQ_RATINGS_KEY, input.ratings);
          return { success: true };
        }),
    },
  },

  // ── ctciProgress ──────────────────────────────────────────────────────────
  ctciProgress: {
    get: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery(ls<{ solved: Record<string, boolean>; difficulty: Record<string, string> }>(
          CTCI_KEY,
          { solved: {}, difficulty: {} }
        )),
    },
    save: {
      useMutation: () =>
        makeMutation((input: { solved: Record<string, boolean>; difficulty: Record<string, string> }) => {
          lsSet(CTCI_KEY, input);
          return { success: true };
        }),
    },
  },

  // ── onboarding ────────────────────────────────────────────────────────────
  onboarding: {
    get: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery(ls<{ completed: Record<string, boolean>; dismissed: boolean }>(
          ONBOARDING_KEY,
          { completed: {}, dismissed: false }
        )),
    },
    save: {
      useMutation: () =>
        makeMutation((input: { completed: Record<string, boolean>; dismissed: boolean }) => {
          lsSet(ONBOARDING_KEY, input);
          return { success: true };
        }),
    },
  },

  // ── mockHistory ───────────────────────────────────────────────────────────
  mockHistory: {
    upsertSession: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
  },

  // ── leaderboard ───────────────────────────────────────────────────────────
  leaderboard: {
    getTop: {
      useQuery: () => makeQuery([]),
    },
    upsert: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    remove: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
  },

  // ── AI mutations (no-op in standalone — AI requires server) ───────────────
  ai: {
    chat: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version at the Manus app.",
        })),
    },
    explainPattern: {
      useMutation: () =>
        makeMutation(() => ({
          explanation: "⚠️ AI explanations require the online version.",
        })),
    },
    codingMockScorecard: {
      useMutation: () =>
        makeMutation(() => ({
          scorecard: "⚠️ AI scoring requires the online version.",
        })),
    },
    sysDesignMockScorecard: {
      useMutation: () =>
        makeMutation(() => ({
          scorecard: "⚠️ AI scoring requires the online version.",
        })),
    },
    xfnMockScorecard: {
      useMutation: () =>
        makeMutation(() => ({
          scorecard: "⚠️ AI scoring requires the online version.",
        })),
    },
    fullMockDayScorecard: {
      useMutation: () =>
        makeMutation(() => ({
          scorecard: "⚠️ AI scoring requires the online version.",
        })),
    },
    techRetroCoach: {
      useMutation: () =>
        makeMutation(() => ({
          coaching: "⚠️ AI coaching requires the online version.",
        })),
    },
  },

  // ── collab (no-op in standalone) ─────────────────────────────────────────
  collab: {
    scoreAnswer: {
      useMutation: () =>
        makeMutation(() => ({
          score: "⚠️ Collab features require the online version.",
        })),
    },
    transcribeAndStructure: {
      useMutation: () =>
        makeMutation(() => ({
          structured: "⚠️ Voice features require the online version.",
        })),
    },
    uploadAudio: {
      useMutation: () =>
        makeMutation(() => ({ url: "" })),
    },
  },

  // ── ctci AI hints (no-op in standalone) ──────────────────────────────────
  ctci: {
    getHint: {
      useMutation: () =>
        makeMutation(() => ({
          hint: "⚠️ AI hints require the online version.",
        })),
    },
    patternHint: {
      useMutation: () =>
        makeMutation(() => ({
          hint: "⚠️ AI hints require the online version.",
        })),
    },
    scoreAnswer: {
      useMutation: () =>
        makeMutation(() => ({
          score: "⚠️ AI scoring requires the online version.",
        })),
    },
    generateDebrief: {
      useMutation: () =>
        makeMutation(() => ({
          debrief: "⚠️ AI debrief requires the online version.",
        })),
    },
    studyPlan: {
      useMutation: () =>
        makeMutation(() => ({
          plan: "⚠️ AI study plan requires the online version.",
        })),
    },
  },

  // ── system ────────────────────────────────────────────────────────────────
  system: {
    notifyOwner: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
  },

  // ── useUtils (no-op) ──────────────────────────────────────────────────────
  useUtils: () => ({
    disclaimer: { status: { invalidate: () => {} } },
    ratings: { getAll: { invalidate: () => {} } },
    ctciProgress: { get: { invalidate: () => {} } },
    onboarding: { get: { invalidate: () => {} } },
    leaderboard: { getTop: { invalidate: () => {} } },
  }),

  // ── Provider (passthrough) ────────────────────────────────────────────────
  Provider: ({ children }: { children: React.ReactNode }) => children,
  createClient: () => ({}),
};

export default trpc;
