import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  disclaimerAcknowledgedAt: timestamp("disclaimerAcknowledgedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Collab Rooms ──────────────────────────────────────────────────────────
export const collabRooms = mysqlTable("collab_rooms", {
  id: int("id").autoincrement().primaryKey(),
  roomCode: varchar("roomCode", { length: 16 }).notNull().unique(),
  questionId: varchar("questionId", { length: 64 }),
  questionTitle: text("questionTitle"),
  mode: mysqlEnum("mode", ["human", "ai"]).default("human").notNull(),
  status: mysqlEnum("status", ["waiting", "active", "ended"])
    .default("waiting")
    .notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  endedAt: timestamp("endedAt"),
});
export type CollabRoom = typeof collabRooms.$inferSelect;

// ── Session Events (for replay) ───────────────────────────────────────────
export const sessionEvents = mysqlTable("session_events", {
  id: int("id").autoincrement().primaryKey(),
  roomCode: varchar("roomCode", { length: 16 }).notNull(),
  eventType: varchar("eventType", { length: 32 }).notNull(),
  payload: json("payload").notNull(),
  actorName: varchar("actorName", { length: 128 }),
  ts: bigint("ts", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SessionEvent = typeof sessionEvents.$inferSelect;

// ── Scorecards ────────────────────────────────────────────────────────────
export const scorecards = mysqlTable("scorecards", {
  id: int("id").autoincrement().primaryKey(),
  roomCode: varchar("roomCode", { length: 16 }).notNull(),
  scorerName: varchar("scorerName", { length: 128 }),
  candidateName: varchar("candidateName", { length: 128 }),
  requirementsScore: int("requirementsScore").notNull().default(3),
  architectureScore: int("architectureScore").notNull().default(3),
  scalabilityScore: int("scalabilityScore").notNull().default(3),
  communicationScore: int("communicationScore").notNull().default(3),
  overallFeedback: text("overallFeedback"),
  aiCoachingNote: text("aiCoachingNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Scorecard = typeof scorecards.$inferSelect;

// ── Leaderboard ────────────────────────────────────────────────────────────
export const leaderboardEntries = mysqlTable("leaderboard_entries", {
  id: int("id").autoincrement().primaryKey(),
  anonHandle: varchar("anonHandle", { length: 32 }).notNull(),
  streakDays: int("streakDays").notNull().default(0),
  patternsMastered: int("patternsMastered").notNull().default(0),
  mockSessions: int("mockSessions").notNull().default(0),
  overallPct: int("overallPct").notNull().default(0),
  badges: json("badges").notNull().$type<string[]>().default([]),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LeaderboardEntry = typeof leaderboardEntries.$inferSelect;

// ── Onboarding Progress ───────────────────────────────────────────────────
export const onboardingProgress = mysqlTable("onboarding_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  progress: json("progress").notNull().$type<Record<string, boolean>>(),
  dismissed: int("dismissed").notNull().default(0), // 0 = false, 1 = true
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingProgress = typeof onboardingProgress.$inferSelect;

// ── User Ratings (pattern + behavioral question ratings) ─────────────────────
export const userRatings = mysqlTable("user_ratings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ratingType: varchar("ratingType", { length: 32 }).notNull(), // 'pattern' | 'bq'
  ratings: json("ratings").notNull().$type<Record<string, number>>(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserRating = typeof userRatings.$inferSelect;

// ── CTCI Progress (solved state + self-difficulty estimates) ────────────────────
export const ctciProgress = mysqlTable("ctci_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  solved: json("solved").notNull().$type<Record<string, boolean>>(),
  difficulty: json("difficulty").notNull().$type<Record<string, string>>(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CtciProgress = typeof ctciProgress.$inferSelect;

// ── Mock Session History (Coding, System Design, XFN) ───────────────────────
export const mockSessions = mysqlTable("mock_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sessionType: varchar("sessionType", { length: 32 }).notNull(), // 'coding' | 'sd' | 'xfn'
  sessionId: varchar("sessionId", { length: 64 }).notNull(), // client-generated nanoid
  sessionData: json("sessionData").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type MockSession = typeof mockSessions.$inferSelect;

// ── User Feedback (general site + sprint plan suggestions) ─────────────────
export const feedback = mysqlTable("feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  feedbackType: mysqlEnum("feedbackType", ["general", "sprint_plan"])
    .notNull()
    .default("general"),
  category: mysqlEnum("category", [
    "bug",
    "feature_request",
    "content",
    "ux",
    "other",
  ])
    .notNull()
    .default("other"),
  message: text("message").notNull(),
  page: varchar("page", { length: 64 }),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Feedback = typeof feedback.$inferSelect;

// ── User Score Snapshots (cross-device persistent scores) ─────────────────
export const userScores = mysqlTable("user_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  patternRatings: json("patternRatings")
    .notNull()
    .$type<Record<string, number>>()
    .default({}),
  behavioralRatings: json("behavioralRatings")
    .notNull()
    .$type<Record<string, number>>()
    .default({}),
  starNotes: json("starNotes")
    .notNull()
    .$type<Record<string, string>>()
    .default({}),
  patternTime: json("patternTime")
    .notNull()
    .$type<Record<string, number>>()
    .default({}),
  interviewDate: varchar("interviewDate", { length: 16 }),
  targetLevel: varchar("targetLevel", { length: 8 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserScores = typeof userScores.$inferSelect;

// ── Sprint Plans (7-day generated plans) ─────────────────────────────────
export const sprintPlans = mysqlTable("sprint_plans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  planId: varchar("planId", { length: 64 }).notNull().unique(),
  targetLevel: varchar("targetLevel", { length: 8 }),
  timeline: varchar("timeline", { length: 32 }),
  planData: json("planData").notNull().$type<Record<string, unknown>>(),
  shareToken: varchar("shareToken", { length: 64 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SprintPlan = typeof sprintPlans.$inferSelect;
