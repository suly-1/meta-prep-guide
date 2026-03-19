import { useState, useEffect, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// ── Streak tracker ─────────────────────────────────────────────────────────
export interface StreakData {
  currentStreak: number;
  lastVisit: string | null;
  longestStreak: number;
}

export function useStreak() {
  const [streak, setStreak] = useLocalStorage<StreakData>("meta_streak_v1", {
    currentStreak: 0,
    lastVisit: null,
    longestStreak: 0,
  });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    setStreak((prev) => {
      if (prev.lastVisit === today) return prev;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      const newStreak = prev.lastVisit === yesterdayStr ? prev.currentStreak + 1 : 1;
      return { currentStreak: newStreak, lastVisit: today, longestStreak: Math.max(newStreak, prev.longestStreak) };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  return streak;
}

// ── Pattern ratings ────────────────────────────────────────────────────────
export function usePatternRatings() {
  return useLocalStorage<Record<string, number>>("meta_pattern_ratings_v1", {});
}

// ── Pattern notes ──────────────────────────────────────────────────────────
export function usePatternNotes() {
  return useLocalStorage<Record<string, string>>("meta_pattern_notes_v1", {});
}

// ── Spaced repetition due dates ────────────────────────────────────────────
export function useSpacedRepetition() {
  return useLocalStorage<Record<string, string>>("meta_sr_due_v1", {});
}

// ── Behavioral story ratings ───────────────────────────────────────────────
export function useBehavioralRatings() {
  return useLocalStorage<Record<string, number>>("meta_bq_ratings_v1", {});
}

// ── STAR story notes ───────────────────────────────────────────────────────
export function useStarNotes() {
  return useLocalStorage<Record<string, string>>("meta_star_notes_v1", {});
}

// ── Mock session history ───────────────────────────────────────────────────
export interface MockSession {
  id: string;
  date: string;
  questions: Array<{ text: string; area: string }>;
  ratings: number[];
  avgScore: number;
}

export function useMockHistory() {
  return useLocalStorage<MockSession[]>("meta_mock_history_v1", []);
}

// ── Coding session history ─────────────────────────────────────────────────
export interface CodingSession {
  id: string;
  date: string;
  duration: number; // minutes
  type: "25min" | "35min" | "45min" | "drill";
}

export function useCodingHistory() {
  return useLocalStorage<CodingSession[]>("meta_coding_sessions_v1", []);
}

// ── Interview countdown ────────────────────────────────────────────────────
export function useInterviewDate() {
  return useLocalStorage<string | null>("meta_interview_date_v1", null);
}

// ── Notification settings ──────────────────────────────────────────────────
export interface NotifSettings {
  enabled: boolean;
  time: string;
  dismissed: boolean;
}

export function useNotifSettings() {
  return useLocalStorage<NotifSettings>("meta_notif_v1", { enabled: false, time: "09:00", dismissed: false });
}

// ── Onboarding dismissed ──────────────────────────────────────────────────
export function useOnboardingDismissed() {
  return useLocalStorage<boolean>("meta_onboarding_v1", false);
}

// ── Disclaimer dismissed ──────────────────────────────────────────────────
export function useDisclaimerDismissed() {
  return useLocalStorage<boolean>("meta_disclaimer_v1", false);
}

// ── Confetti fired ────────────────────────────────────────────────────────────────────────────────
export function useCongratsShown() {
  return useLocalStorage<boolean>("meta_congrats_v1", false);
}

// ── Readiness trend (14-day daily snapshots) ───────────────────────────────────────
export interface ReadinessSnapshot {
  date: string; // ISO date YYYY-MM-DD
  pct: number;  // 0-100
}

export function useReadinessTrend() {
  return useLocalStorage<ReadinessSnapshot[]>("meta_readiness_trend_v1", []);
}

// ── Per-pattern time tracker (seconds spent per pattern id) ───────────────────────────────────────
export function usePatternTime() {
  return useLocalStorage<Record<string, number>>("meta_pattern_time_v1", {});
}
// ── CTCI Daily Challenge streak ────────────────────────────────────────────
export interface CTCIStreakData {
  currentStreak: number;
  lastSolvedDate: string | null; // ISO date YYYY-MM-DD
  longestStreak: number;
  totalSolved: number;
}

export function useCTCIStreak() {
  return useLocalStorage<CTCIStreakData>("meta_ctci_streak_v1", {
    currentStreak: 0,
    lastSolvedDate: null,
    longestStreak: 0,
    totalSolved: 0,
  });
}

// ── Readiness Goal Setter ──────────────────────────────────────────────────
export interface ReadinessGoal {
  targetPct: number;   // 0-100
  targetDate: string;  // YYYY-MM-DD
}

export function useReadinessGoal() {
  return useLocalStorage<ReadinessGoal | null>("meta_readiness_goal_v1", null);
}

// ── Mock Interview Simulator history ──────────────────────────────────────────
export interface SimulatorSession {
  id: string;
  date: string;           // ISO date YYYY-MM-DD
  icTarget: "IC5" | "IC6" | "IC7";
  codingProblem: string;
  codingNotes: string;
  bq1Question: string;
  bq1Answer: string;
  bq2Question: string;
  bq2Answer: string;
  totalTimeUsed: number;  // seconds
  // Debrief results
  overallVerdict: string;
  overallScore: number;
  codingScore: number;
  behavioralScore: number;
  icLevelAssessment: string;
  codingAssessment: string;
  behavioralAssessment: string;
  topStrengths: string[];
  criticalGaps: string[];
  nextSteps: string[];
}

export function useSimulatorHistory() {
  return useLocalStorage<SimulatorSession[]>("meta_simulator_history_v1", []);
}

// ── Hint usage analytics (per pattern: { gentle, medium, full } counts) ───────
export interface HintCounts {
  gentle: number;
  medium: number;
  full: number;
}

export function useHintAnalytics() {
  return useLocalStorage<Record<string, HintCounts>>("meta_hint_analytics_v1", {});
}

// ── CTCI Difficulty Estimator (self-assessment per problem) ───────────────────
export type SelfDifficulty = "Easy" | "Medium" | "Hard" | "Very Hard";
export interface DifficultyEstimate {
  selfRating: SelfDifficulty;
  timestamp: number;
}
export function useCTCIDifficultyEstimates() {
  return useLocalStorage<Record<string, DifficultyEstimate>>("meta_ctci_difficulty_v1", {});
}

// ── Behavioral Story Strength Tracker (per-question rating history) ───────────
export interface StoryRatingEntry {
  timestamp: number;
  rating: number;
}
export function useStoryStrengthHistory() {
  return useLocalStorage<Record<string, StoryRatingEntry[]>>("meta_story_strength_v1", {});
}

// ── Technical Retrospective Projects ──────────────────────────────────────────
export interface TechRetroProject {
  id: string;
  name: string;
  scope: string;
  tradeoffs: string;
  biggestBug: string;
  outcome: string;
  lessonsLearned: string;
  createdAt: number;
}
export function useTechRetroProjects() {
  return useLocalStorage<TechRetroProject[]>("meta_tech_retro_projects_v1", []);
}

// ── Flash Card Spaced Repetition due dates ─────────────────────────────────
// Keys are flash card indices (as strings), values are ISO date strings (YYYY-MM-DD)
export function useFlashCardSRDue() {
  return useLocalStorage<Record<string, string>>("meta_sd_flashcard_sr_v1", {});
}

// ── Daily study checklist ──────────────────────────────────────────────────
export function useDailyChecklist() {
  return useLocalStorage<Record<string, boolean>>("meta_daily_checklist_v1", {});
}

// ── Onboarding progress (5-step guided checklist for new users) ────────────
export function useOnboardingProgress() {
  return useLocalStorage<Record<string, boolean>>("meta_onboarding_progress_v1", {});
}

// ── Theme preference ───────────────────────────────────────────────────────
export function useThemePreference() {
  return useLocalStorage<"dark" | "light">("meta_theme_v1", "dark");
}
