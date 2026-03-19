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

  // Coding Mock Scorecard: evaluate candidate's approach, pseudocode, complexity, and edge cases
  codingMockScorecard: publicProcedure
    .input(
      z.object({
        patternName: z.string().max(200),
        problemTitle: z.string().max(200),
        difficulty: z.string().max(10),
        approach: z.string().max(3000),
        pseudocode: z.string().max(3000),
        complexity: z.string().max(500),
        edgeCases: z.string().max(1000),
        followUp: z.string().max(1000),
      })
    )
    .mutation(async ({ input }) => {
      const transcript = [
        `Pattern: ${input.patternName}`,
        `Problem: ${input.problemTitle} (${input.difficulty})`,
        `\n=== Approach & Intuition ===\n${input.approach || "(not provided)"}`,
        `\n=== Pseudocode / Solution ===\n${input.pseudocode || "(not provided)"}`,
        `\n=== Time & Space Complexity ===\n${input.complexity || "(not provided)"}`,
        `\n=== Edge Cases ===\n${input.edgeCases || "(not provided)"}`,
        `\n=== Follow-up Optimization ===\n${input.followUp || "(not provided)"}`,
      ].join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta Staff Engineer (E7) conducting a coding interview for an IC6/IC7 candidate.
The problem is a "${input.patternName}" pattern problem: "${input.problemTitle}" (${input.difficulty}).
Evaluate the candidate's approach, pseudocode, complexity analysis, edge case handling, and follow-up optimization.
Be rigorous: IC6 should show clean code, correct complexity, and 2-3 edge cases; IC7 should show optimal solutions, proactive edge case enumeration, and follow-up optimizations.
Return a structured JSON scorecard.`,
          },
          {
            role: "user",
            content: `Here is the candidate's coding session:\n\n${transcript}\n\nProvide a structured scorecard JSON.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "coding_scorecard",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number", description: "Overall score 1-5" },
                correctnessScore: { type: "number", description: "Correctness and algorithm quality score 1-5" },
                complexityScore: { type: "number", description: "Time/space complexity analysis score 1-5" },
                codeQualityScore: { type: "number", description: "Code clarity, naming, structure score 1-5" },
                communicationScore: { type: "number", description: "Thinking out loud, explaining approach score 1-5" },
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
                optimalSolutionHint: { type: "string", description: "1-2 sentence hint toward the optimal solution if the candidate didn't reach it" },
                followUpQuestions: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 3,
                  description: "2-3 follow-up questions the interviewer would ask",
                },
                summary: { type: "string", description: "2-3 sentence overall coaching note" },
              },
              required: ["overallScore", "correctnessScore", "complexityScore", "codeQualityScore", "communicationScore", "icLevel", "strengths", "improvements", "optimalSolutionHint", "followUpQuestions", "summary"],
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
        correctnessScore: number;
        complexityScore: number;
        codeQualityScore: number;
        communicationScore: number;
        icLevel: string;
        strengths: string[];
        improvements: string[];
        optimalSolutionHint: string;
        followUpQuestions: string[];
        summary: string;
      };
      return parsed;
    }),

  // XFN Behavioral Mock Scorecard: evaluate 3 XFN answers for collaboration, alignment, conflict resolution
  xfnMockScorecard: publicProcedure
    .input(
      z.object({
        rounds: z.array(
          z.object({
            question: z.string().max(500),
            answer: z.string().max(3000),
          })
        ).min(1).max(3),
      })
    )
    .mutation(async ({ input }) => {
      const transcript = input.rounds
        .map((r, i) => `=== Question ${i + 1} ===\n${r.question}\n\nCandidate Answer:\n${r.answer || "(no answer provided)"}`)
        .join("\n\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta engineering manager conducting an XFN Partnership interview round for an IC6/IC7 candidate.
Evaluate the candidate's answers to 3 XFN behavioral questions and return a structured JSON scorecard.
Focus on: collaboration quality, conflict resolution, alignment strategies, stakeholder management, and IC-level signal.
IC6 should show effective project-level XFN collaboration; IC7 should show long-term strategic partnerships, proactive alignment, and org-level influence.
Be rigorous but constructive.`,
          },
          {
            role: "user",
            content: `Here is the candidate's full XFN mock session:\n\n${transcript}\n\nProvide a structured scorecard JSON.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "xfn_scorecard",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number", description: "Overall score 1-5" },
                collaborationScore: { type: "number", description: "Collaboration quality score 1-5" },
                conflictScore: { type: "number", description: "Conflict resolution score 1-5" },
                alignmentScore: { type: "number", description: "Alignment and stakeholder management score 1-5" },
                communicationScore: { type: "number", description: "Communication clarity and influence score 1-5" },
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
              required: ["overallScore", "collaborationScore", "conflictScore", "alignmentScore", "communicationScore", "icLevel", "strengths", "improvements", "followUpQuestions", "summary"],
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
        collaborationScore: number;
        conflictScore: number;
        alignmentScore: number;
        communicationScore: number;
        icLevel: string;
        strengths: string[];
        improvements: string[];
        followUpQuestions: string[];
        summary: string;
      };
      return parsed;
    }),

  // Full Mock Day Scorecard: aggregate scores from all 3 rounds into a combined IC-level verdict
  fullMockDayScorecard: publicProcedure
    .input(
      z.object({
        codingScore: z.number(),
        codingIcLevel: z.string(),
        codingPattern: z.string(),
        sysDesignScore: z.number(),
        sysDesignIcLevel: z.string(),
        sysDesignQuestion: z.string(),
        xfnScore: z.number(),
        xfnIcLevel: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const summary = [
        `Coding Round: ${input.codingPattern} — Overall ${input.codingScore.toFixed(1)}/5 (${input.codingIcLevel})`,
        `System Design Round: ${input.sysDesignQuestion} — Overall ${input.sysDesignScore.toFixed(1)}/5 (${input.sysDesignIcLevel})`,
        `XFN Behavioral Round: Overall ${input.xfnScore.toFixed(1)}/5 (${input.xfnIcLevel})`,
      ].join('\n');

      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `You are a Meta engineering hiring committee member reviewing a candidate's full interview day results.
You have scores from 3 rounds: Coding, System Design, and XFN Behavioral.
Provide an overall IC-level verdict, a hiring recommendation, and specific coaching for each round.
Be direct and honest — this is what a real debrief would look like.`,
          },
          {
            role: 'user',
            content: `Here are the candidate's full interview day results:\n\n${summary}\n\nProvide a comprehensive final scorecard JSON.`,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'full_mock_day_scorecard',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                overallScore: { type: 'number', description: 'Weighted overall score 1-5' },
                icLevelVerdict: { type: 'string', description: 'IC5, IC6, or IC7 — the overall hiring level signal' },
                hiringRecommendation: { type: 'string', description: 'Strong Hire, Hire, Borderline, or No Hire' },
                codingCoaching: { type: 'string', description: '1-2 sentence coaching for the coding round' },
                sysDesignCoaching: { type: 'string', description: '1-2 sentence coaching for the system design round' },
                xfnCoaching: { type: 'string', description: '1-2 sentence coaching for the XFN behavioral round' },
                topStrengths: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 2,
                  maxItems: 3,
                },
                topImprovements: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 2,
                  maxItems: 3,
                },
                summary: { type: 'string', description: '3-4 sentence overall debrief note' },
              },
              required: ['overallScore', 'icLevelVerdict', 'hiringRecommendation', 'codingCoaching', 'sysDesignCoaching', 'xfnCoaching', 'topStrengths', 'topImprovements', 'summary'],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error('No response from AI');
      const content = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
      const parsed = JSON.parse(content) as {
        overallScore: number;
        icLevelVerdict: string;
        hiringRecommendation: string;
        codingCoaching: string;
        sysDesignCoaching: string;
        xfnCoaching: string;
        topStrengths: string[];
        topImprovements: string[];
        summary: string;
      };
      return parsed;
    }),
});
