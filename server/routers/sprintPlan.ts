/**
 * Sprint Plan Router
 * Generates 7-day study schedules using AI + readiness data.
 * Supports saving, sharing (public token), and retrieving plans.
 */
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { sprintPlans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

function generateId(): string {
  return `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateShareToken(): string {
  return `share_${Math.random().toString(36).slice(2, 12)}${Math.random().toString(36).slice(2, 12)}`;
}

export const sprintPlanRouter = router({
  /** Generate a 7-day sprint plan using AI + current readiness data */
  generate: publicProcedure
    .input(
      z.object({
        targetLevel: z.enum(["L4", "L5", "L6", "L7"]).default("L6"),
        timeline: z
          .enum(["1-2 weeks", "3-4 weeks", "1-2 months", "3+ months"])
          .default("3-4 weeks"),
        weakPatterns: z.array(z.string()).default([]),
        weakBQAreas: z.array(z.string()).default([]),
        storiesWritten: z.number().int().min(0).default(0),
        avgPatternScore: z.number().min(0).max(5).default(0),
        avgBQScore: z.number().min(0).max(5).default(0),
        readinessScore: z.number().min(0).max(100).optional(),
        mockSessionsDone: z.number().int().min(0).default(0),
      })
    )
    .mutation(async ({ input }) => {
      const systemPrompt = `You are an expert technical interview coach specializing in FAANG-level engineering interviews.
Generate a focused 7-day sprint study plan in JSON format. Be specific, actionable, and realistic.
Each day should have 2-3 focused tasks with time estimates. Total daily study time: 2-3 hours.`;

      const userPrompt = `Generate a 7-day sprint plan for a candidate targeting ${input.targetLevel} at a top tech company.

Candidate profile:
- Timeline: ${input.timeline}
- Average pattern score: ${input.avgPatternScore.toFixed(1)}/5
- Average behavioral score: ${input.avgBQScore.toFixed(1)}/5
- STAR stories written: ${input.storiesWritten}
- Mock sessions completed: ${input.mockSessionsDone}
- Readiness score: ${input.readinessScore ?? "not yet assessed"}%
- Weak coding patterns: ${input.weakPatterns.length > 0 ? input.weakPatterns.join(", ") : "none identified yet"}
- Weak behavioral areas: ${input.weakBQAreas.length > 0 ? input.weakBQAreas.join(", ") : "none identified yet"}

Return a JSON object with this exact structure:
{
  "title": "7-Day Sprint Plan for [Level]",
  "summary": "2-sentence overview of the plan strategy",
  "targetLevel": "${input.targetLevel}",
  "timeline": "${input.timeline}",
  "days": [
    {
      "day": 1,
      "theme": "Day theme (e.g., 'Pattern Foundation')",
      "focus": "Primary focus area",
      "tasks": [
        {
          "id": "d1t1",
          "title": "Task title",
          "description": "Specific action to take",
          "timeMinutes": 45,
          "category": "coding|behavioral|system_design|review",
          "priority": "high|medium|low",
          "resource": "Optional: specific pattern/question/topic name"
        }
      ],
      "dailyGoal": "What success looks like for this day",
      "checkIn": "End-of-day self-assessment question"
    }
  ],
  "keyMetrics": {
    "totalHours": 18,
    "codingHours": 8,
    "behavioralHours": 5,
    "systemDesignHours": 5
  },
  "successCriteria": ["Criterion 1", "Criterion 2", "Criterion 3"]
}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });

      const rawContent = response.choices?.[0]?.message?.content;
      const content = typeof rawContent === "string" ? rawContent : null;
      if (!content) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate sprint plan",
        });
      }

      let planData: Record<string, unknown>;
      try {
        planData = JSON.parse(content) as Record<string, unknown>;
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Invalid plan format from AI",
        });
      }

      return { planData };
    }),

  /** Save a sprint plan to DB (creates shareable link) */
  save: publicProcedure
    .input(
      z.object({
        planData: z.record(z.string(), z.unknown()),
        targetLevel: z.string().max(8).optional(),
        timeline: z.string().max(32).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const planId = generateId();
      const shareToken = generateShareToken();
      const userId = ctx.user?.id ?? null;
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DB unavailable",
        });
      await db.insert(sprintPlans).values({
        userId,
        planId,
        targetLevel: input.targetLevel ?? null,
        timeline: input.timeline ?? null,
        planData: input.planData,
        shareToken,
      });

      return { planId, shareToken };
    }),

  /** Get a saved sprint plan by planId (owner) */
  getById: publicProcedure
    .input(z.object({ planId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [plan] = await db
        .select()
        .from(sprintPlans)
        .where(eq(sprintPlans.planId, input.planId))
        .limit(1);
      if (!plan) return null;
      return plan;
    }),

  /** Get a shared sprint plan by share token (public) — expires after 30 days */
  getByShareToken: publicProcedure
    .input(z.object({ shareToken: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [plan] = await db
        .select()
        .from(sprintPlans)
        .where(eq(sprintPlans.shareToken, input.shareToken))
        .limit(1);
      if (!plan) return null;
      // Shared links expire after 30 days
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const createdAt =
        plan.createdAt instanceof Date
          ? plan.createdAt
          : new Date(plan.createdAt);
      if (Date.now() - createdAt.getTime() > THIRTY_DAYS_MS) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This shared plan link has expired (30 days).",
        });
      }
      return {
        planId: plan.planId,
        targetLevel: plan.targetLevel,
        timeline: plan.timeline,
        planData: plan.planData,
        createdAt: plan.createdAt,
      };
    }),

  /** List plans for the current user */
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const plans = await db
      .select({
        planId: sprintPlans.planId,
        targetLevel: sprintPlans.targetLevel,
        timeline: sprintPlans.timeline,
        shareToken: sprintPlans.shareToken,
        createdAt: sprintPlans.createdAt,
      })
      .from(sprintPlans)
      .where(eq(sprintPlans.userId, ctx.user.id))
      .limit(20);
    return plans;
  }),
});
