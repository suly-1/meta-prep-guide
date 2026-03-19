import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const aiRouter = router({
  // Tech Retro AI Coach: given project details, return 3 follow-up interview questions
  techRetroCoach: publicProcedure
    .input(
      z.object({
        name: z.string().max(200),
        scope: z.string().max(1000),
        tradeoffs: z.string().max(1000),
        biggestBug: z.string().max(1000),
        outcome: z.string().max(1000),
        lessonsLearned: z.string().max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const projectSummary = [
        `Project: ${input.name}`,
        input.scope ? `Scope: ${input.scope}` : null,
        input.tradeoffs ? `Key Trade-offs: ${input.tradeoffs}` : null,
        input.biggestBug ? `Biggest Bug/Incident: ${input.biggestBug}` : null,
        input.outcome ? `Outcome & Impact: ${input.outcome}` : null,
        input.lessonsLearned ? `Lessons Learned: ${input.lessonsLearned}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta engineering interviewer conducting a Technical Retrospective round for an IC6/IC7 candidate. 
Your job is to probe deeply into the candidate's project to assess: technical depth, ownership, trade-off reasoning, incident handling, and lessons learned.
Generate exactly 3 sharp, probing follow-up questions that a real Meta interviewer would ask. 
Each question should target a potential weakness or unexplored area in the project description.
Format your response as a JSON array of 3 strings, each being a single interview question.
Keep each question under 50 words. Be direct and challenging — not generic.`,
          },
          {
            role: "user",
            content: `Here is the candidate's project summary for the Technical Retrospective:\n\n${projectSummary}\n\nGenerate 3 probing follow-up questions.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interview_questions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 3,
                  maxItems: 3,
                },
              },
              required: ["questions"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
      const parsed = JSON.parse(content) as { questions: string[] };
      return { questions: parsed.questions };
    }),

  // System Design Mock Scorecard: evaluate candidate's answers across all 5 framework phases
  sysDesignMockScorecard: publicProcedure
    .input(
      z.object({
        questionTitle: z.string().max(200),
        level: z.string().max(10),
        tags: z.array(z.string()).max(5),
        phases: z.array(
          z.object({
            phase: z.string().max(100),
            answer: z.string().max(3000),
          })
        ).min(1).max(5),
      })
    )
    .mutation(async ({ input }) => {
      const transcript = input.phases
        .map((p) => `=== ${p.phase} ===\n${p.answer || "(no answer provided)"}`)
        .join("\n\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta Staff Engineer (E7) conducting a System Design interview for an ${input.level} candidate.
The question is: "${input.questionTitle}" (key topics: ${input.tags.join(", ")}).
Evaluate the candidate's answers across all interview phases and return a structured JSON scorecard.
Be rigorous but fair — IC6 answers should show solid fundamentals and scalability thinking; IC7 answers should show proactive constraint identification, operational concerns, and business impact reasoning.`,
          },
          {
            role: "user",
            content: `Here is the candidate's full interview session:\n\n${transcript}\n\nProvide a structured scorecard JSON.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "sysdesign_scorecard",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number", description: "Overall score 1-5" },
                requirementsScore: { type: "number", description: "Requirements clarification score 1-5" },
                architectureScore: { type: "number", description: "HLD architecture score 1-5" },
                scalabilityScore: { type: "number", description: "Scalability and deep dive score 1-5" },
                communicationScore: { type: "number", description: "Communication and trade-off reasoning score 1-5" },
                icLevel: { type: "string", description: "IC5, IC6, or IC7 — the level this performance signals" },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 3,
                },
                improvements: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 3,
                },
                followUpQuestions: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 3,
                  description: "2-3 follow-up questions the interviewer would ask to probe deeper",
                },
                summary: { type: "string", description: "2-3 sentence overall coaching note" },
              },
              required: ["overallScore", "requirementsScore", "architectureScore", "scalabilityScore", "communicationScore", "icLevel", "strengths", "improvements", "followUpQuestions", "summary"],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);

      const parsed = JSON.parse(content) as {
        overallScore: number;
        requirementsScore: number;
        architectureScore: number;
        scalabilityScore: number;
        communicationScore: number;
        icLevel: string;
        strengths: string[];
        improvements: string[];
        followUpQuestions: string[];
        summary: string;
      };
      return parsed;
    }),
});
