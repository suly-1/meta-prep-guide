import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module so tests run without a real DB
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("leaderboard.getTop", () => {
  it("returns empty array when DB is unavailable", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.leaderboard.getTop();
    expect(result).toEqual([]);
  });
});

describe("leaderboard.checkHandle", () => {
  it("returns taken: false when DB is unavailable", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.leaderboard.checkHandle({ anonHandle: "test_user" });
    expect(result).toEqual({ taken: false });
  });
});

describe("leaderboard.upsert", () => {
  it("throws when DB is unavailable", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.leaderboard.upsert({
        anonHandle: "test_user",
        streakDays: 5,
        patternsMastered: 10,
        mockSessions: 3,
        overallPct: 72,
        badges: ["First Blood"],
      })
    ).rejects.toThrow("Database unavailable");
  });

  it("rejects handles shorter than 2 characters", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.leaderboard.upsert({
        anonHandle: "x",
        streakDays: 0,
        patternsMastered: 0,
        mockSessions: 0,
        overallPct: 0,
        badges: [],
      })
    ).rejects.toThrow();
  });
});

describe("leaderboard.remove", () => {
  it("throws when DB is unavailable", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.leaderboard.remove({ anonHandle: "test_user" })
    ).rejects.toThrow("Database unavailable");
  });
});
