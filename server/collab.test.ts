import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB and LLM to avoid real network calls
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    insert: vi
      .fn()
      .mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) }),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    }),
  }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: "What are your scale requirements for this system?",
        },
      },
    ],
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAuthCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-open-id",
      name: "Test User",
      email: "test@example.com",
      role: "user" as const,
      loginMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      disclaimerAcknowledgedAt: null,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("collab.createRoom", () => {
  it("creates a room with valid roomCode", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.collab.createRoom({
      roomCode: "TEST01",
      questionTitle: "Design a URL Shortener",
      mode: "human",
    });
    expect(result).toHaveProperty("roomCode", "TEST01");
  });

  it("rejects roomCode shorter than 4 chars", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.collab.createRoom({ roomCode: "AB", mode: "human" })
    ).rejects.toThrow();
  });
});

describe("collab.aiFollowUp", () => {
  it("returns a follow-up question string", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.collab.aiFollowUp({
      questionTitle: "Design a News Feed",
      transcript: [
        { role: "candidate", text: "I would use a fanout-on-write approach." },
      ],
      weakAreas: ["Scalability"],
    });
    expect(result).toHaveProperty("question");
    expect(typeof result.question).toBe("string");
    expect(result.question.length).toBeGreaterThan(5);
  });
});

describe("collab.sendWeeklyDigest", () => {
  it("sends a weekly digest notification", async () => {
    const caller = appRouter.createCaller(createAuthCtx());
    const result = await caller.collab.sendWeeklyDigest({
      masteredCount: 12,
      totalPatterns: 20,
      streakDays: 7,
      mockSessions: 3,
      weakSpots: ["Dynamic Programming", "Segment Tree"],
      overallPct: 72,
    });
    expect(result).toEqual({ sent: true });
  });
});

describe("collab.saveScorecard", () => {
  it("saves a scorecard and returns aiCoachingNote and avg", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.collab.saveScorecard({
      roomCode: "TEST01",
      scorerName: "Interviewer A",
      candidateName: "Candidate B",
      requirementsScore: 4,
      architectureScore: 4,
      scalabilityScore: 3,
      communicationScore: 5,
      overallFeedback: "Strong communicator, needs more depth on scalability.",
    });
    expect(result).toHaveProperty("aiCoachingNote");
    expect(result).toHaveProperty("avg");
    expect(typeof result.avg).toBe("string");
  });
});
