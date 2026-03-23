import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock LLM to avoid real network calls
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            overallScore: 4,
            collaborationScore: 4,
            conflictScore: 3,
            alignmentScore: 4,
            communicationScore: 4,
            level: "L6",
            strengths: ["Clear STAR structure", "Concrete outcomes"],
            improvements: ["Add org-level impact", "More strategic framing"],
            followUpQuestions: [
              "How did you handle pushback?",
              "What would you do differently?",
              "How did you scale this?",
            ],
            summary: "Strong L6-level collaboration with clear examples.",
          }),
        },
      },
    ],
  }),
}));

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("ai.xfnMockScorecard", () => {
  it("returns a scorecard for L6 mode", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.ai.xfnMockScorecard({
      rounds: [
        {
          question:
            "Tell me about a time you worked with a cross-functional team.",
          answer: "I collaborated with PM and design to ship a feature.",
        },
        {
          question: "Describe a conflict with a partner team.",
          answer:
            "We had disagreement on API design, I facilitated a sync to align.",
        },
        {
          question: "How do you build trust with XFN partners?",
          answer:
            "Regular check-ins, clear docs, and follow-through on commitments.",
        },
      ],
      icMode: "L6",
    });
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("collaborationScore");
    expect(result).toHaveProperty("conflictScore");
    expect(result).toHaveProperty("alignmentScore");
    expect(result).toHaveProperty("communicationScore");
    expect(result).toHaveProperty("level");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("improvements");
    expect(result).toHaveProperty("followUpQuestions");
    expect(result).toHaveProperty("summary");
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.improvements)).toBe(true);
    expect(Array.isArray(result.followUpQuestions)).toBe(true);
  });

  it("returns a scorecard for L7 mode", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.ai.xfnMockScorecard({
      rounds: [
        {
          question: "Describe an org-level XFN initiative you drove.",
          answer: "I led a cross-org alignment effort spanning 5 teams.",
        },
        {
          question: "How have you influenced without authority?",
          answer: "I built consensus through data and stakeholder workshops.",
        },
        {
          question: "Tell me about a strategic partnership you built.",
          answer: "I partnered with a sister org to create a shared platform.",
        },
      ],
      icMode: "L7",
    });
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("level");
    expect(typeof result.overallScore).toBe("number");
    expect(result.overallScore).toBeGreaterThanOrEqual(1);
    expect(result.overallScore).toBeLessThanOrEqual(5);
  });

  it("defaults to L7 mode when icMode is not specified", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.ai.xfnMockScorecard({
      rounds: [
        {
          question: "Tell me about XFN collaboration.",
          answer: "I worked with multiple teams.",
        },
      ],
      // icMode defaults to "L7"
    });
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("summary");
  });

  it("rejects empty rounds array", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.ai.xfnMockScorecard({ rounds: [], icMode: "L6" })
    ).rejects.toThrow();
  });
});
