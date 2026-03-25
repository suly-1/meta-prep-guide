/**
 * procedures.smoke.test.ts
 *
 * Smoke-tests every public/protected tRPC procedure by calling it against
 * a mocked (unavailable) database. Each test asserts the procedure either:
 *   - returns a valid response (graceful DB-unavailable path), OR
 *   - throws a typed TRPCError (auth/permission guard), NOT an unhandled crash.
 *
 * This catches broken imports, missing DB columns, and type mismatches
 * before they reach users. Add a test here for every new procedure.
 */
import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { TRPCError } from "@trpc/server";

// Mock the database so all tests run without a real DB connection
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(null),
}));

// Mock LLM to avoid real API calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: '{"sentiment":"neutral"}' } }],
  }),
}));

// Mock email/notification helpers
vi.mock("./weeklyDigest", () => ({
  sendWeeklyDigest: vi.fn().mockResolvedValue(undefined),
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./dailyAlert", () => ({
  checkAndSendDailyAlert: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

// ── Context factories ────────────────────────────────────────────────────────

function anonCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function userCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "user-open-id",
      name: "Test User",
      email: "user@test.com",
      role: "user",
      loginMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      disclaimerAcknowledgedAt: null,
      blocked: 0,
      blockReason: null,
      blockedUntil: null,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function adminCtx(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: process.env.OWNER_OPEN_ID ?? "owner-open-id",
      name: "Admin",
      email: "admin@test.com",
      role: "admin",
      loginMethod: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      disclaimerAcknowledgedAt: new Date(),
      blocked: 0,
      blockReason: null,
      blockedUntil: null,
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// Helper: assert a procedure either resolves or throws a TRPCError (not a raw crash)
async function assertSafeCall(fn: () => Promise<unknown>) {
  try {
    await fn();
    // Resolved — pass
  } catch (err) {
    // Must be a typed TRPCError, not an unhandled crash
    expect(err).toBeInstanceOf(TRPCError);
  }
}

// ── Public procedures ────────────────────────────────────────────────────────

describe("siteAccess public procedures", () => {
  it("checkAccess returns without throwing (DB unavailable)", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.siteAccess.checkAccess();
    expect(result).toHaveProperty("locked");
  });
});

describe("disclaimer public procedures", () => {
  it("status returns without throwing for anonymous user", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.disclaimer.status();
    expect(result).toHaveProperty("acknowledged");
  });
});

describe("leaderboard public procedures", () => {
  it("getTop returns empty array when DB unavailable", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.leaderboard.getTop();
    expect(Array.isArray(result)).toBe(true);
  });

  it("checkHandle returns taken:false when DB unavailable", async () => {
    const caller = appRouter.createCaller(anonCtx());
    const result = await caller.leaderboard.checkHandle({ anonHandle: "test" });
    expect(result.taken).toBe(false);
  });
});

describe("feedback public procedures", () => {
  it("submitGeneral returns without throwing (DB unavailable)", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await assertSafeCall(() =>
      caller.feedback.submitGeneral({
        message: "test message",
        category: "other",
        feedbackType: "general",
      })
    );
  });
});

describe("deployStatus public procedures", () => {
  it("latest returns without throwing", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await assertSafeCall(() => caller.deployStatus.latest());
  });
});

// ── Protected procedures (require auth) ─────────────────────────────────────

describe("ratings procedures", () => {
  it("getAll returns without throwing for anonymous user (public procedure)", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await assertSafeCall(() => caller.ratings.getAll());
  });

  it("savePatternRatings rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(
      caller.ratings.savePatternRatings({ ratings: {} })
    ).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("userScores protected procedures", () => {
  it("load returns without throwing for authenticated user", async () => {
    const caller = appRouter.createCaller(userCtx());
    await assertSafeCall(() => caller.userScores.load());
  });

  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(caller.userScores.load()).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("progress protected procedures", () => {
  it("list returns without throwing for authenticated user", async () => {
    const caller = appRouter.createCaller(userCtx());
    await assertSafeCall(() => caller.progress.list());
  });
});

describe("favorites protected procedures", () => {
  it("list returns without throwing for authenticated user", async () => {
    const caller = appRouter.createCaller(userCtx());
    await assertSafeCall(() => caller.favorites.list());
  });
});

describe("disclaimer protected procedures", () => {
  it("acknowledge returns without throwing for authenticated user", async () => {
    const caller = appRouter.createCaller(userCtx());
    await assertSafeCall(() => caller.disclaimer.acknowledge());
  });

  it("rejects unauthenticated callers", async () => {
    const caller = appRouter.createCaller(anonCtx());
    await expect(caller.disclaimer.acknowledge()).rejects.toBeInstanceOf(
      TRPCError
    );
  });
});

describe("onboarding protected procedures", () => {
  it("get returns without throwing for authenticated user", async () => {
    const caller = appRouter.createCaller(userCtx());
    await assertSafeCall(() => caller.onboarding.get());
  });
});

describe("ctciProgress protected procedures", () => {
  it("get returns without throwing for authenticated user", async () => {
    const caller = appRouter.createCaller(userCtx());
    await assertSafeCall(() => caller.ctciProgress.get());
  });
});

// ── Admin-only procedures ────────────────────────────────────────────────────

describe("feedback admin procedures", () => {
  it("adminStats returns without throwing for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() => caller.feedback.adminStats());
  });

  it("adminGetAll returns without throwing for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() => caller.feedback.adminGetAll({}));
  });

  it("rejects non-admin callers for adminStats", async () => {
    const caller = appRouter.createCaller(userCtx());
    await expect(caller.feedback.adminStats()).rejects.toBeInstanceOf(
      TRPCError
    );
  });
});

describe("adminUsers procedures", () => {
  it("getUserStats returns without throwing for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() => caller.adminUsers.getUserStats());
  });

  it("listUsers returns without throwing for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() => caller.adminUsers.listUsers());
  });

  it("blockUser rejects gracefully when DB null", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() =>
      caller.adminUsers.blockUser({
        userId: 9999,
        reason: "test",
        expiryDays: 1,
      })
    );
  });

  it("unblockUser rejects gracefully when DB null", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() => caller.adminUsers.unblockUser({ userId: 9999 }));
  });

  it("extendBlock rejects gracefully when DB null", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() =>
      caller.adminUsers.extendBlock({ userId: 9999, expiryDays: 7 })
    );
  });

  it("reBlockUser rejects gracefully when DB null", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() => caller.adminUsers.reBlockUser({ userId: 9999 }));
  });
});

describe("siteAccess owner procedures", () => {
  it("getSettings returns without throwing for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() => caller.siteAccess.getSettings());
  });
});

describe("userScores admin procedures", () => {
  it("getAggregateStats returns without throwing for admin", async () => {
    const caller = appRouter.createCaller(adminCtx());
    await assertSafeCall(() => caller.userScores.getAggregateStats());
  });
});
