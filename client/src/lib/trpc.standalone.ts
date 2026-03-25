// v24 — full procedure coverage: listEvents, checkInactiveUsers, siteAccess stubs
/**
 * Standalone tRPC mock — used in the self-contained HTML export.
 * All server calls are replaced with localStorage-only implementations
 * so the guide works fully offline with no Manus account.
 *
 * The shape mirrors the real trpc client so components need zero changes.
 */
import * as React from "react";

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
    mutate: (
      input: TInput,
      opts?: {
        onSuccess?: (d: TOutput) => void;
        onError?: (e: unknown) => void;
      }
    ) => {
      isPending = true;
      Promise.resolve(fn(input))
        .then(d => {
          isPending = false;
          opts?.onSuccess?.(d);
        })
        .catch(e => {
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
    isOwner: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ isOwner: false }),
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
        makeQuery(
          ls<{
            solved: Record<string, boolean>;
            difficulty: Record<string, string>;
          }>(CTCI_KEY, { solved: {}, difficulty: {} })
        ),
    },
    save: {
      useMutation: () =>
        makeMutation(
          (input: {
            solved: Record<string, boolean>;
            difficulty: Record<string, string>;
          }) => {
            lsSet(CTCI_KEY, input);
            return { success: true };
          }
        ),
    },
  },

  // ── onboarding ────────────────────────────────────────────────────────────
  onboarding: {
    get: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery(
          ls<{ completed: Record<string, boolean>; dismissed: boolean }>(
            ONBOARDING_KEY,
            { completed: {}, dismissed: false }
          )
        ),
    },
    save: {
      useMutation: () =>
        makeMutation(
          (input: {
            completed: Record<string, boolean>;
            dismissed: boolean;
          }) => {
            lsSet(ONBOARDING_KEY, input);
            return { success: true };
          }
        ),
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
          content:
            "⚠️ AI features require the online version at the Manus app.",
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
    interruptModeStart: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            interruptions: [
              "⚠️ AI Interrupt Mode requires the online version at the Manus app.",
              "Visit the online version to use this feature.",
              "AI features are not available in the static build.",
            ],
          }),
        })),
    },
    interruptModeScore: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            score: 0,
            feedback: "⚠️ AI scoring requires the online version.",
            betterResponse: "",
          }),
        })),
    },
    scoreBoECalculation: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            score: 0,
            orderOfMagnitude: "unknown",
            feedback: "⚠️ AI scoring requires the online version.",
            keyAssumptions: [],
            designImplication: "",
          }),
        })),
    },
    tearDownDesign: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            overallScore: 0,
            verdict: "⚠️ AI review requires the online version.",
            criticalFlaws: [],
            minorIssues: [],
            strengths: [],
            prioritizedFixes: [],
          }),
        })),
    },
    scoreThinkOutLoud: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            overallScore: 0,
            dimensions: [],
            topTip: "⚠️ AI coaching requires the online version.",
            modelThinkAloud: "",
          }),
        })),
    },
    scorePatternDrill: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            correct: false,
            correctPattern: "",
            explanation: "⚠️ AI scoring requires the online version.",
            keySignals: [],
            score: 0,
            speedRating: "",
          }),
        })),
    },
    generateRemediationPlan: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            plan: [],
            weeklyMilestones: [],
            estimatedReadinessGain:
              "⚠️ AI planning requires the online version.",
          }),
        })),
    },
    personaStressTestStart: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            challenges: [
              "⚠️ AI Persona Stress Test requires the online version.",
            ],
          }),
        })),
    },
    personaStressTestRespond: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            score: 0,
            feedback: "⚠️ AI scoring requires the online version.",
          }),
        })),
    },
    personaStressTestScore: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI debrief requires the online version.",
        })),
    },
    quantifyImpact: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            scoreOriginal: 0,
            scoreStrengthened: 0,
            weakClaims: [],
            coaching: "⚠️ AI coaching requires the online version.",
            strengthenedStory: "",
          }),
        })),
    },
    generateReadinessReport: {
      useMutation: () =>
        makeMutation(() => ({
          content: JSON.stringify({
            score: 0,
            verdict: "no-go",
            report:
              "⚠️ AI Readiness Report requires the online version at the Manus app.",
          }),
        })),
    },
    // ── AI stubs added in Phase 26 ────────────────────────────────────────
    analyzeComplexity: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    analyzeDebrief: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    buildWhyCompanyStory: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    calibrateSeniorityLevel: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    challengeComplexity: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    detectAntiPatterns: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    explainLikeAPM: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    generateFollowUps: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    generateTenDaySprint: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    getProgressiveHint: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    guidedWalkthroughFeedback: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    interviewerPerspective: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    peerDesignReview: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    predictInterviewQuestions: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    reviewSolution: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    scorePatternGuess: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    scorePeerReviewAnswers: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    scoreTradeoff: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    transcribeAndScoreVoice: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ AI features require the online version.",
        })),
    },
    ic7OptimizationChallenge: {
      useMutation: () =>
        makeMutation(() => ({
          challenge: "⚠️ AI features require the online version.",
          hints: [],
          optimalApproach: "",
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
      useMutation: () => makeMutation(() => ({ url: "" })),
    },
    aiFinalFeedback: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ Collab features require the online version.",
        })),
    },
    aiFollowUp: {
      useMutation: () =>
        makeMutation(() => ({
          content: "⚠️ Collab features require the online version.",
        })),
    },
    createRoom: {
      useMutation: () => makeMutation(() => ({ roomId: "" })),
    },
    saveScorecard: {
      useMutation: () => makeMutation(() => ({ success: true })),
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

  // ── deployStatus ──────────────────────────────────────────────────────────
  // In standalone/GitHub Pages mode, call the GitHub API directly from the browser.
  // The repo is public so no token is needed.
  deployStatus: {
    latest: {
      useQuery: (
        _?: unknown,
        opts?: { refetchInterval?: number; staleTime?: number }
      ) => {
        const [data, setData] = React.useState<{
          status: string;
          conclusion: string | null;
          runUrl: string;
          createdAt: Date | null;
          commitSha: string | null;
        } | null>(null);
        const [isLoading, setIsLoading] = React.useState(true);
        const [isError, setIsError] = React.useState(false);

        const fetchStatus = React.useCallback(async () => {
          try {
            const res = await fetch(
              "https://api.github.com/repos/community-prep/engineering-interview-guide/actions/workflows/1/runs?per_page=1",
              {
                headers: {
                  Accept: "application/vnd.github+json",
                  "X-GitHub-Api-Version": "2022-11-28",
                },
              }
            );
            if (!res.ok) throw new Error("GitHub API error");
            const json = await res.json();
            const run = json.workflow_runs?.[0];
            if (!run) throw new Error("No runs");
            setData({
              status: run.status,
              conclusion: run.conclusion,
              runUrl: run.html_url,
              createdAt: new Date(run.created_at),
              commitSha: run.head_sha?.slice(0, 7) ?? null,
            });
            setIsError(false);
          } catch {
            setIsError(true);
          } finally {
            setIsLoading(false);
          }
        }, []);

        React.useEffect(() => {
          fetchStatus();
          const interval = opts?.refetchInterval;
          if (interval) {
            const id = setInterval(fetchStatus, interval);
            return () => clearInterval(id);
          }
        }, [fetchStatus, opts?.refetchInterval]);

        return { data, isLoading, isError };
      },
    },
  },

  // ── sprintPlan (no-op in standalone) ──────────────────────────────────────
  sprintPlan: {
    generate: {
      useMutation: () =>
        makeMutation(() => ({
          planData: {
            title: "⚠️ Sprint Plan requires the online version",
            summary:
              "Sign in at the Manus app to generate your personalized 7-day sprint plan.",
            targetLevel: "L6",
            timeline: "3-4 weeks",
            days: [],
            keyMetrics: {
              totalHours: 0,
              codingHours: 0,
              behavioralHours: 0,
              systemDesignHours: 0,
            },
            successCriteria: [],
          },
        })),
    },
    save: {
      useMutation: () => makeMutation(() => ({ planId: "", shareToken: "" })),
    },
    getShared: {
      useQuery: () => makeQuery(null),
    },
  },

  // ── feedback (no-op in standalone) ───────────────────────────────────────
  feedback: {
    submitGeneral: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    submitSprintFeedback: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    adminGetAll: {
      useQuery: () => makeQuery({ items: [], total: 0 }),
    },
    adminStats: {
      useQuery: () =>
        makeQuery({ byCategory: [], byType: [], total: 0, last7Days: 0 }),
    },
    triggerDigest: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    triggerDailyAlert: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    updateStatus: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    updateNote: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    markAllNew: {
      useMutation: () => makeMutation(() => ({ success: true, updated: 0 })),
    },
  },

  // ── userScores (no-op in standalone) ─────────────────────────────────────
  userScores: {
    load: {
      useQuery: () => makeQuery(null),
    },
    save: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    getAggregateStats: {
      useQuery: () =>
        makeQuery({ totalUsers: 0, patternAvgRatings: {}, bqAvgRatings: {} }),
    },
  },

  // ── favorites (no-op in standalone) ───────────────────────────────────────────────────────────────────
  favorites: {
    list: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]) },
    toggle: { useMutation: () => makeMutation(() => ({ success: true })) },
    remove: { useMutation: () => makeMutation(() => ({ success: true })) },
    updateNotes: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── progress (no-op in standalone) ───────────────────────────────────────────────────────────────────
  progress: {
    list: { useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]) },
    save: { useMutation: () => makeMutation(() => ({ success: true })) },
  },

  // ── analytics (no-op in standalone) ───────────────────────────────────────────────────────────────────
  analytics: {
    trackSession: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    updateSession: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    startSession: {
      useMutation: () => makeMutation(() => ({ sessionId: "standalone" })),
    },
    endSession: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    trackPageView: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    trackEvent: { useMutation: () => makeMutation(() => ({ success: true })) },
    sendReportNow: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    dauTrend: { useQuery: () => ({ data: { trend: [] }, isLoading: false }) },
    featureClicksToday: {
      useQuery: () => ({ data: { counts: {} }, isLoading: false }),
    },
    adminReport: {
      useQuery: () => ({
        data: {
          sessions: [],
          pageViews: [],
          topEvents: [],
          deviceBreakdown: [],
          browserBreakdown: [],
          top3Unactioned: [],
          summary: {
            totalSessions: 0,
            uniqueVisitors: 0,
            totalPageViews: 0,
            avgSessionMinutes: 0,
            totalHours: 0,
          },
        },
        isLoading: false,
        refetch: () => {},
      }),
    },
  },

  // ── siteAccess ─────────────────────────────────────────────────────────────────────────────
  // In standalone mode, the disclaimer is always enabled (gate uses localStorage).
  // All admin/owner procedures are no-ops.
  siteAccess: {
    checkAccess: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({
          locked: false,
          reason: "no_expiry" as const,
          message: null,
          daysRemaining: null,
        }),
    },
    getDisclaimerEnabled: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ enabled: true }),
    },
    setDisclaimerEnabled: {
      useMutation: () => makeMutation(() => ({ success: true, enabled: true })),
    },
    getSettings: {
      useQuery: () => makeQuery(null),
    },
    updateSettings: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    cohortReset: {
      useMutation: () =>
        makeMutation(() => ({
          success: true,
          newStartDate: new Date().toISOString().slice(0, 10),
        })),
    },
  },

  // ── adminUsers ─────────────────────────────────────────────────────────────────────────────
  // All admin procedures are owner-only and not available in standalone mode.
  // These stubs prevent crashes when navigating to /admin/users on the static build.
  adminUsers: {
    listUsers: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    getUserStats: {
      useQuery: (_?: unknown, _opts?: unknown) =>
        makeQuery({ total: 0, weeklyActive: 0, blocked: 0 }),
    },
    getUserLoginHistory: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    blockUser: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    unblockUser: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    reBlockUser: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
    extendBlock: {
      useMutation: () =>
        makeMutation(() => ({ success: true, newBlockedUntil: null })),
    },
    exportAuditLogCsv: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery({ csv: "" }),
    },
    listEvents: {
      useQuery: (_?: unknown, _opts?: unknown) => makeQuery([]),
    },
    checkInactiveUsers: {
      useMutation: () => makeMutation(() => ({ notified: false, count: 0 })),
    },
  },

  // ── system ─────────────────────────────────────────────────────────────────────────────────────
  system: {
    notifyOwner: {
      useMutation: () => makeMutation(() => ({ success: true })),
    },
  },

  // ── useUtils (no-op) ────────────────────────────────────────────────────────────────────────────────
  useUtils: () => ({
    disclaimer: { status: { invalidate: () => {} } },
    ratings: { getAll: { invalidate: () => {} } },
    ctciProgress: { get: { invalidate: () => {} } },
    onboarding: { get: { invalidate: () => {} } },
    leaderboard: { getTop: { invalidate: () => {} } },
    siteAccess: { getDisclaimerEnabled: { invalidate: () => {} } },
    adminUsers: {
      listUsers: { invalidate: () => {} },
      listEvents: { invalidate: () => {} },
    },
  }),

  // ── Provider (passthrough) ────────────────────────────────────────────────────────────────
  Provider: ({ children }: { children: React.ReactNode }) => children,
  createClient: () => ({}),
};

export default trpc;
