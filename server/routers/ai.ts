import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { transcribeAudio } from "../_core/voiceTranscription";

export const aiRouter = router({
  // Tech Retro AI Coach: given project details, return 3 follow-up interview questions
  techRetroCoach: protectedProcedure
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
        input.lessonsLearned
          ? `Lessons Learned: ${input.lessonsLearned}`
          : null,
      ]
        .filter(Boolean)
        .join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta engineering interviewer conducting a Technical Retrospective round for an L6/L7 candidate. 
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
      const content =
        typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent);
      const parsed = JSON.parse(content) as { questions: string[] };
      return { questions: parsed.questions };
    }),

  // System Design Mock Scorecard: evaluate candidate's answers across all 5 framework phases
  sysDesignMockScorecard: protectedProcedure
    .input(
      z.object({
        questionTitle: z.string().max(200),
        level: z.string().max(10),
        tags: z.array(z.string()).max(5),
        phases: z
          .array(
            z.object({
              phase: z.string().max(100),
              answer: z.string().max(3000),
            })
          )
          .min(1)
          .max(5),
      })
    )
    .mutation(async ({ input }) => {
      const transcript = input.phases
        .map(p => `=== ${p.phase} ===\n${p.answer || "(no answer provided)"}`)
        .join("\n\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta Staff Engineer (E7) conducting a System Design interview for an ${input.level} candidate.
The question is: "${input.questionTitle}" (key topics: ${input.tags.join(", ")}).
Evaluate the candidate's answers across all interview phases and return a structured JSON scorecard.
Be rigorous but fair — L6 answers should show solid fundamentals and scalability thinking; L7 answers should show proactive constraint identification, operational concerns, and business impact reasoning.`,
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
                overallScore: {
                  type: "number",
                  description: "Overall score 1-5",
                },
                requirementsScore: {
                  type: "number",
                  description: "Requirements clarification score 1-5",
                },
                architectureScore: {
                  type: "number",
                  description: "HLD architecture score 1-5",
                },
                scalabilityScore: {
                  type: "number",
                  description: "Scalability and deep dive score 1-5",
                },
                communicationScore: {
                  type: "number",
                  description:
                    "Communication and trade-off reasoning score 1-5",
                },
                level: {
                  type: "string",
                  description:
                    "L5, L6, or L7 — the level this performance signals",
                },
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
                  description:
                    "2-3 follow-up questions the interviewer would ask to probe deeper",
                },
                summary: {
                  type: "string",
                  description: "2-3 sentence overall coaching note",
                },
              },
              required: [
                "overallScore",
                "requirementsScore",
                "architectureScore",
                "scalabilityScore",
                "communicationScore",
                "level",
                "strengths",
                "improvements",
                "followUpQuestions",
                "summary",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const content =
        typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent);

      const parsed = JSON.parse(content) as {
        overallScore: number;
        requirementsScore: number;
        architectureScore: number;
        scalabilityScore: number;
        communicationScore: number;
        level: string;
        strengths: string[];
        improvements: string[];
        followUpQuestions: string[];
        summary: string;
      };
      return parsed;
    }),

  // Coding Mock Scorecard: evaluate candidate's approach, pseudocode, complexity, and edge cases
  codingMockScorecard: protectedProcedure
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
        icMode: z.enum(["L6", "L7"]).default("L6"),
      })
    )
    .mutation(async ({ input }) => {
      const icRubric =
        input.icMode === "L7"
          ? `L7 (Senior Staff) rubric: Expect optimal time/space complexity — not just a correct solution. Penalise brute-force approaches even if correct. Require proactive enumeration of ≥4 edge cases without prompting. Follow-up optimisations must be proposed unprompted. Code structure should be production-quality. Evaluate whether the candidate would have passed a real Meta L7 bar.`
          : `L6 (Staff) rubric: Expect a clean, correct solution with proper complexity analysis. 2-3 edge cases identified is sufficient. Minor inefficiencies are acceptable if the candidate explains trade-offs. Clear communication of approach is required. A working solution with O(n log n) where O(n) exists is borderline — note it but do not fail the candidate.`;
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
            content: `You are a senior Meta Staff Engineer (E7) conducting a coding interview for a ${input.icMode} candidate.
The problem is a "${input.patternName}" pattern problem: "${input.problemTitle}" (${input.difficulty}).
Evaluate the candidate's approach, pseudocode, complexity analysis, edge case handling, and follow-up optimization.

${icRubric}

Return a structured JSON scorecard. The level field should reflect what IC level the performance actually signals (L5, L6, or L7), not necessarily the target level.`,
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
                overallScore: {
                  type: "number",
                  description: "Overall score 1-5",
                },
                correctnessScore: {
                  type: "number",
                  description: "Correctness and algorithm quality score 1-5",
                },
                complexityScore: {
                  type: "number",
                  description: "Time/space complexity analysis score 1-5",
                },
                codeQualityScore: {
                  type: "number",
                  description: "Code clarity, naming, structure score 1-5",
                },
                communicationScore: {
                  type: "number",
                  description:
                    "Thinking out loud, explaining approach score 1-5",
                },
                level: {
                  type: "string",
                  description:
                    "L5, L6, or L7 — the level this performance signals",
                },
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
                optimalSolutionHint: {
                  type: "string",
                  description:
                    "1-2 sentence hint toward the optimal solution if the candidate didn't reach it",
                },
                followUpQuestions: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 3,
                  description:
                    "2-3 follow-up questions the interviewer would ask",
                },
                summary: {
                  type: "string",
                  description: "2-3 sentence overall coaching note",
                },
              },
              required: [
                "overallScore",
                "correctnessScore",
                "complexityScore",
                "codeQualityScore",
                "communicationScore",
                "level",
                "strengths",
                "improvements",
                "optimalSolutionHint",
                "followUpQuestions",
                "summary",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const content =
        typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent);

      const parsed = JSON.parse(content) as {
        overallScore: number;
        correctnessScore: number;
        complexityScore: number;
        codeQualityScore: number;
        communicationScore: number;
        level: string;
        strengths: string[];
        improvements: string[];
        optimalSolutionHint: string;
        followUpQuestions: string[];
        summary: string;
      };
      return parsed;
    }),

  // XFN Behavioral Mock Scorecard: evaluate 3 XFN answers for collaboration, alignment, conflict resolution
  xfnMockScorecard: protectedProcedure
    .input(
      z.object({
        rounds: z
          .array(
            z.object({
              question: z.string().max(500),
              answer: z.string().max(3000),
            })
          )
          .min(1)
          .max(3),
        icMode: z.enum(["L6", "L7"]).default("L7"),
      })
    )
    .mutation(async ({ input }) => {
      const transcript = input.rounds
        .map(
          (r, i) =>
            `=== Question ${i + 1} ===\n${r.question}\n\nCandidate Answer:\n${r.answer || "(no answer provided)"}`
        )
        .join("\n\n");

      const icRubric =
        input.icMode === "L7"
          ? `L7 (Senior Staff) rubric — evaluate for: (1) Long-term strategic XFN partnerships spanning multiple teams or orgs, (2) Proactive org-level alignment before problems arise, (3) Driving cross-org initiatives with measurable org-wide impact, (4) Multiplying team effectiveness through influence without authority, (5) Navigating ambiguity at org scale. L7 answers must show strategic thinking beyond tactical execution. Penalize answers that only show project-level impact without org-level influence or strategic foresight.`
          : `L6 (Staff) rubric — evaluate for: (1) Effective project-level XFN collaboration across 2-3 teams, (2) Clear communication and conflict resolution at team level, (3) Driving alignment on shared project goals, (4) Stakeholder management within a project scope, (5) Delivering results through cross-functional work. L6 answers should show strong execution and collaboration skills. Give credit for clear STAR structure with concrete, measurable outcomes.`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta engineering manager conducting an XFN Partnership interview round for a ${input.icMode} candidate.\nEvaluate the candidate's answers to 3 XFN behavioral questions and return a structured JSON scorecard.\nFocus on: collaboration quality, conflict resolution, alignment strategies, stakeholder management, and IC-level signal.\n\n${icRubric}\n\nBe rigorous but constructive. The level field in your response should reflect what IC level the performance actually signals (L5, L6, or L7), not necessarily the target level.`,
          },
          {
            role: "user",
            content: `Here is the candidate's full XFN mock session (evaluated at ${input.icMode} level):\n\n${transcript}\n\nProvide a structured scorecard JSON.`,
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
                overallScore: {
                  type: "number",
                  description: "Overall score 1-5",
                },
                collaborationScore: {
                  type: "number",
                  description: "Collaboration quality score 1-5",
                },
                conflictScore: {
                  type: "number",
                  description: "Conflict resolution score 1-5",
                },
                alignmentScore: {
                  type: "number",
                  description: "Alignment and stakeholder management score 1-5",
                },
                communicationScore: {
                  type: "number",
                  description: "Communication clarity and influence score 1-5",
                },
                level: {
                  type: "string",
                  description:
                    "L5, L6, or L7 — the level this performance signals",
                },
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
                  description:
                    "2-3 follow-up questions the interviewer would ask to probe deeper",
                },
                summary: {
                  type: "string",
                  description: "2-3 sentence overall coaching note",
                },
              },
              required: [
                "overallScore",
                "collaborationScore",
                "conflictScore",
                "alignmentScore",
                "communicationScore",
                "level",
                "strengths",
                "improvements",
                "followUpQuestions",
                "summary",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const content =
        typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent);

      const parsed = JSON.parse(content) as {
        overallScore: number;
        collaborationScore: number;
        conflictScore: number;
        alignmentScore: number;
        communicationScore: number;
        level: string;
        strengths: string[];
        improvements: string[];
        followUpQuestions: string[];
        summary: string;
      };
      return parsed;
    }),

  // Full Mock Day Scorecard: aggregate scores from all 3 rounds into a combined IC-level verdict
  fullMockDayScorecard: protectedProcedure
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
        behavioralScore: z.number().optional(),
        behavioralIcLevel: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const summary = [
        `Coding Round: ${input.codingPattern} — Overall ${input.codingScore.toFixed(1)}/5 (${input.codingIcLevel})`,
        `System Design Round: ${input.sysDesignQuestion} — Overall ${input.sysDesignScore.toFixed(1)}/5 (${input.sysDesignIcLevel})`,
        `XFN Behavioral Round: Overall ${input.xfnScore.toFixed(1)}/5 (${input.xfnIcLevel})`,
        ...(input.behavioralScore !== undefined
          ? [
              `Behavioral STAR Round: Overall ${input.behavioralScore.toFixed(1)}/5 (${input.behavioralIcLevel ?? "L6"})`,
            ]
          : []),
      ].join("\n");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta engineering hiring committee member reviewing a candidate's full interview day results.
You have scores from 3-4 rounds: Coding, System Design, XFN Behavioral, and optionally a Behavioral STAR round.
Provide an overall IC-level verdict, a hiring recommendation, specific coaching for each round, and a 2-week remediation plan.
Be direct and honest — this is what a real debrief would look like.`,
          },
          {
            role: "user",
            content: `Here are the candidate's full interview day results:\n\n${summary}\n\nProvide a comprehensive final scorecard JSON.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "full_mock_day_scorecard",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: {
                  type: "number",
                  description: "Weighted overall score 1-5",
                },
                levelVerdict: {
                  type: "string",
                  description:
                    "L5, L6, or L7 — the overall hiring level signal",
                },
                hiringRecommendation: {
                  type: "string",
                  description: "Strong Hire, Hire, Borderline, or No Hire",
                },
                codingCoaching: {
                  type: "string",
                  description: "1-2 sentence coaching for the coding round",
                },
                sysDesignCoaching: {
                  type: "string",
                  description:
                    "1-2 sentence coaching for the system design round",
                },
                xfnCoaching: {
                  type: "string",
                  description:
                    "1-2 sentence coaching for the XFN behavioral round",
                },
                behavioralCoaching: {
                  type: "string",
                  description:
                    "1-2 sentence coaching for the behavioral STAR round",
                },
                remediationPlan: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 7,
                  maxItems: 14,
                  description:
                    "Day-by-day 2-week remediation plan items, each a specific actionable task",
                },
                topStrengths: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 3,
                },
                topImprovements: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 3,
                },
                summary: {
                  type: "string",
                  description: "3-4 sentence overall debrief note",
                },
              },
              required: [
                "overallScore",
                "levelVerdict",
                "hiringRecommendation",
                "codingCoaching",
                "sysDesignCoaching",
                "xfnCoaching",
                "behavioralCoaching",
                "remediationPlan",
                "topStrengths",
                "topImprovements",
                "summary",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const content =
        typeof rawContent === "string"
          ? rawContent
          : JSON.stringify(rawContent);
      const parsed = JSON.parse(content) as {
        overallScore: number;
        levelVerdict: string;
        hiringRecommendation: string;
        codingCoaching: string;
        sysDesignCoaching: string;
        xfnCoaching: string;
        behavioralCoaching: string;
        remediationPlan: string[];
        topStrengths: string[];
        topImprovements: string[];
        summary: string;
      };
      return parsed;
    }),

  // Explain a coding pattern at L6 or L7 level
  explainPattern: protectedProcedure
    .input(
      z.object({
        patternId: z.string().max(60),
        patternName: z.string().max(100),
        icMode: z.enum(["L6", "L7"]).default("L6"),
      })
    )
    .mutation(async ({ input }) => {
      const levelNote =
        input.icMode === "L7"
          ? "Target L7 (Senior Staff Engineer). Emphasise trade-offs, edge cases, and when NOT to use this pattern. Include complexity analysis and real-world Meta-scale examples."
          : "Target L6 (Staff Engineer). Cover the core intuition, canonical template, and 2-3 representative LeetCode problems.";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta engineer coaching a candidate on coding interview patterns. ${levelNote} Respond in concise Markdown (max 350 words).`,
          },
          {
            role: "user",
            content: `Explain the "${input.patternName}" pattern (id: ${input.patternId}) for a Meta ${input.icMode} interview. Include: 1) Core intuition in 1-2 sentences. 2) When to recognise it. 3) Canonical Python template snippet. 4) 2 representative LeetCode problems with difficulty. 5) Common pitfalls.`,
          },
        ],
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      return {
        explanation:
          typeof rawContent === "string"
            ? rawContent
            : JSON.stringify(rawContent),
      };
    }),

  // Guided Design Walkthrough — AI feedback on full walkthrough transcript
  guidedWalkthroughFeedback: protectedProcedure
    .input(
      z.object({
        problem: z.string().max(200),
        transcript: z.string().max(8000),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a senior Meta Staff/Principal Engineer conducting a system design interview. Score the candidate's walkthrough against the L6/L7 rubric. Be specific, constructive, and cite exact quotes from their transcript. Respond in Markdown.",
          },
          {
            role: "user",
            content: `Problem: ${input.problem}\n\nCandidate's walkthrough:\n${input.transcript}\n\nProvide: 1) Overall IC level signal (L5/L6/L7) with one-line verdict. 2) Strengths (2-3 specific things done well). 3) Gaps (2-3 specific things missing or weak). 4) L7 differentiators they missed. 5) One concrete suggestion to improve the weakest section. Keep total response under 400 words.`,
          },
        ],
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      return {
        feedback:
          typeof rawContent === "string"
            ? rawContent
            : JSON.stringify(rawContent),
      };
    }),

  // Trade-off Decision Simulator — score a candidate's trade-off justification
  scoreTradeoff: protectedProcedure
    .input(
      z.object({
        scenarioTitle: z.string().max(200),
        context: z.string().max(500),
        question: z.string().max(300),
        chosenOption: z.string().max(100),
        chosenDesc: z.string().max(300),
        justification: z.string().max(2000),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a senior Meta engineer scoring a system design trade-off justification. Score 1-5. Return JSON only.",
          },
          {
            role: "user",
            content: `Scenario: ${input.scenarioTitle}\nContext: ${input.context}\nQuestion: ${input.question}\nChosen: ${input.chosenOption} — ${input.chosenDesc}\nJustification: ${input.justification}\n\nReturn JSON: { "score": number (1.0-5.0), "verdict": string (one sentence), "coaching": string (one concrete improvement), "ic7Signal": string (what L7 answer would add) }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "tradeoff_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                verdict: { type: "string" },
                coaching: { type: "string" },
                ic7Signal: { type: "string" },
              },
              required: ["score", "verdict", "coaching", "ic7Signal"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const parsed =
        typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      return parsed as {
        score: number;
        verdict: string;
        coaching: string;
        ic7Signal: string;
      };
    }),

  // Architecture Anti-Pattern Detector
  detectAntiPatterns: protectedProcedure
    .input(z.object({ design: z.string().max(4000) }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a senior Meta engineer reviewing a system design for anti-patterns. Return JSON only.",
          },
          {
            role: "user",
            content: `Design description:\n${input.design}\n\nIdentify up to 5 anti-patterns. Return JSON: { "antiPatterns": [ { "name": string, "severity": "Critical"|"High"|"Medium", "explanation": string, "fix": string } ], "overallSignal": string, "level": "L5"|"L6"|"L7" }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "anti_patterns",
            strict: true,
            schema: {
              type: "object",
              properties: {
                antiPatterns: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      severity: { type: "string" },
                      explanation: { type: "string" },
                      fix: { type: "string" },
                    },
                    required: ["name", "severity", "explanation", "fix"],
                    additionalProperties: false,
                  },
                },
                overallSignal: { type: "string" },
                level: { type: "string" },
              },
              required: ["antiPatterns", "overallSignal", "level"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const parsed =
        typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      return parsed as {
        antiPatterns: Array<{
          name: string;
          severity: string;
          explanation: string;
          fix: string;
        }>;
        overallSignal: string;
        level: string;
      };
    }),

  // Peer Design Review — generate adversarial questions
  peerDesignReview: protectedProcedure
    .input(
      z.object({
        problem: z.string().max(200),
        design: z.string().max(4000),
        icMode: z.enum(["L6", "L7"]),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a skeptical senior ${input.icMode} Meta engineer reviewing a system design. Generate 3 adversarial follow-up questions that probe weak points. Return JSON only.`,
          },
          {
            role: "user",
            content: `Problem: ${input.problem}\nDesign: ${input.design}\n\nReturn JSON: { "questions": [ { "question": string, "whyAsked": string, "goodAnswerHint": string } ], "overallVerdict": string, "ic7Gap": string }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "peer_review",
            strict: true,
            schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      whyAsked: { type: "string" },
                      goodAnswerHint: { type: "string" },
                    },
                    required: ["question", "whyAsked", "goodAnswerHint"],
                    additionalProperties: false,
                  },
                },
                overallVerdict: { type: "string" },
                ic7Gap: { type: "string" },
              },
              required: ["questions", "overallVerdict", "ic7Gap"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const parsed =
        typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      return parsed as {
        questions: Array<{
          question: string;
          whyAsked: string;
          goodAnswerHint: string;
        }>;
        overallVerdict: string;
        ic7Gap: string;
      };
    }),

  // Score Peer Review Answers
  scorePeerReviewAnswers: protectedProcedure
    .input(
      z.object({
        problem: z.string().max(200),
        icMode: z.enum(["L6", "L7"]),
        transcript: z.string().max(6000),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta ${input.icMode} engineer scoring a candidate's defense of their system design. Be specific and cite their answers. Respond in Markdown.`,
          },
          {
            role: "user",
            content: `Problem: ${input.problem}\n\nQ&A Transcript:\n${input.transcript}\n\nProvide: 1) Overall defense score (1-5) with verdict. 2) Best answer (cite it). 3) Weakest answer and what was missing. 4) L7 signal: what would a principal engineer have said differently? Keep under 350 words.`,
          },
        ],
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      return {
        feedback:
          typeof rawContent === "string"
            ? rawContent
            : JSON.stringify(rawContent),
      };
    }),

  // Explain Like a PM
  explainLikeAPM: protectedProcedure
    .input(z.object({ design: z.string().max(4000) }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a senior Meta engineer who excels at communicating technical architecture to non-technical stakeholders. Rewrite the given technical design in clear, jargon-free language that a Product Manager or business executive would understand. Focus on: what the system does, why each major decision was made, what risks were mitigated, and what the user impact is. Respond in Markdown.",
          },
          {
            role: "user",
            content: `Technical design:\n${input.design}\n\nRewrite this for a PM audience. Use analogies where helpful. Keep under 300 words.`,
          },
        ],
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      return {
        explanation:
          typeof rawContent === "string"
            ? rawContent
            : JSON.stringify(rawContent),
      };
    }),

  // ── Code Practice AI ─────────────────────────────────────────────────────

  // 1. AI Solution Reviewer — score code against L6/L7 rubric
  reviewSolution: protectedProcedure
    .input(
      z.object({
        problemTitle: z.string().max(200),
        difficulty: z.string().max(10),
        topic: z.string().max(60),
        code: z.string().max(6000),
        language: z.string().max(20),
        icMode: z.enum(["L6", "L7"]).default("L6"),
      })
    )
    .mutation(async ({ input }) => {
      const icRubric =
        input.icMode === "L7"
          ? "L7 (Senior Staff): Require optimal complexity, ≥4 edge cases unprompted, production-quality code structure, and proactive follow-up optimizations."
          : "L6 (Staff): Expect clean correct solution, proper complexity analysis, 2-3 edge cases, clear communication. Minor inefficiencies OK if trade-offs explained.";
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta Staff Engineer (E7) reviewing a coding interview solution. ${icRubric} Return JSON only.`,
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle} (${input.difficulty}, ${input.topic})\nLanguage: ${input.language}\n\nCode:\n${input.code}\n\nReturn JSON: { "score": number (1.0-5.0), "verdict": string (one sentence, e.g. 'This signals L6 — clean solution but missed the O(n) optimization'), "correctness": number (1-5), "complexity": number (1-5), "edgeCases": number (1-5), "codeQuality": number (1-5), "level": "L5"|"L6"|"L7", "strengths": [string, string], "coaching": string (one concrete improvement), "optimalComplexity": string (e.g. 'O(n) time, O(1) space') }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "solution_review",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                verdict: { type: "string" },
                correctness: { type: "number" },
                complexity: { type: "number" },
                edgeCases: { type: "number" },
                codeQuality: { type: "number" },
                level: { type: "string" },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 2,
                  maxItems: 2,
                },
                coaching: { type: "string" },
                optimalComplexity: { type: "string" },
              },
              required: [
                "score",
                "verdict",
                "correctness",
                "complexity",
                "edgeCases",
                "codeQuality",
                "level",
                "strengths",
                "coaching",
                "optimalComplexity",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const parsed =
        typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      return parsed as {
        score: number;
        verdict: string;
        correctness: number;
        complexity: number;
        edgeCases: number;
        codeQuality: number;
        level: string;
        strengths: string[];
        coaching: string;
        optimalComplexity: string;
      };
    }),

  // 2. 3-Level Hint System — progressive hints without giving away the answer
  getProgressiveHint: protectedProcedure
    .input(
      z.object({
        problemTitle: z.string().max(200),
        difficulty: z.string().max(10),
        topic: z.string().max(60),
        description: z.string().max(1000),
        level: z.number().int().min(1).max(3),
      })
    )
    .mutation(async ({ input }) => {
      const levelInstructions = [
        "Level 1 (Pattern Recognition): Give ONLY a pattern recognition hint — what data structure or algorithmic pattern applies. Do NOT mention the approach. Example: 'Think about what data structure gives O(1) lookup.' Max 2 sentences.",
        "Level 2 (Approach): Give a directional approach hint — the general strategy without pseudocode. Example: 'Try a sliding window with two pointers — expand right, shrink left when the window becomes invalid.' Max 3 sentences.",
        "Level 3 (Pseudocode Skeleton): Provide a pseudocode skeleton with blanks for the candidate to fill in. Show the structure but leave the key logic as comments like '# fill in: condition to shrink window'. Max 10 lines.",
      ][input.level - 1];
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta coding interviewer giving a progressive hint. ${levelInstructions} Do NOT give the full solution.`,
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle} (${input.difficulty}, ${input.topic})\nDescription: ${input.description}\n\nGive a Level ${input.level} hint.`,
          },
        ],
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      return {
        hint:
          typeof rawContent === "string"
            ? rawContent
            : JSON.stringify(rawContent),
        level: input.level,
      };
    }),

  // 3. Follow-Up Question Generator — 2-3 interviewer follow-ups after solution
  generateFollowUps: protectedProcedure
    .input(
      z.object({
        problemTitle: z.string().max(200),
        difficulty: z.string().max(10),
        topic: z.string().max(60),
        code: z.string().max(6000),
        icMode: z.enum(["L6", "L7"]).default("L6"),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta ${input.icMode} interviewer. After a candidate submits their solution, you ask 3 follow-up questions to probe deeper. Questions should test: edge cases, scalability, alternative approaches, or real-world constraints. Return JSON only.`,
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle} (${input.difficulty}, ${input.topic})\nSolution:\n${input.code}\n\nReturn JSON: { "questions": [ { "question": string, "intent": string (why you're asking), "level": "L6"|"L7" (which level this question targets) } ] }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "followup_questions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question: { type: "string" },
                      intent: { type: "string" },
                      level: { type: "string" },
                    },
                    required: ["question", "intent", "level"],
                    additionalProperties: false,
                  },
                  minItems: 2,
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
      const parsed =
        typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      return parsed as {
        questions: Array<{ question: string; intent: string; level: string }>;
      };
    }),

  // 4. Complexity Analyzer — identify actual vs optimal time/space complexity
  analyzeComplexity: protectedProcedure
    .input(
      z.object({
        problemTitle: z.string().max(200),
        topic: z.string().max(60),
        code: z.string().max(6000),
        language: z.string().max(20),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a senior Meta engineer analyzing the time and space complexity of a coding solution. Be precise. Return JSON only.",
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle} (${input.topic})\nLanguage: ${input.language}\n\nCode:\n${input.code}\n\nReturn JSON: { "actualTime": string (e.g. 'O(n log n)'), "actualSpace": string, "optimalTime": string, "optimalSpace": string, "isOptimal": boolean, "timeExplanation": string (1-2 sentences explaining the actual time complexity), "gapExplanation": string (if not optimal: what change would achieve optimal; if optimal: 'Your solution is already optimal.'), "bottleneck": string (the specific line or operation that dominates the complexity) }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "complexity_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                actualTime: { type: "string" },
                actualSpace: { type: "string" },
                optimalTime: { type: "string" },
                optimalSpace: { type: "string" },
                isOptimal: { type: "boolean" },
                timeExplanation: { type: "string" },
                gapExplanation: { type: "string" },
                bottleneck: { type: "string" },
              },
              required: [
                "actualTime",
                "actualSpace",
                "optimalTime",
                "optimalSpace",
                "isOptimal",
                "timeExplanation",
                "gapExplanation",
                "bottleneck",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const parsed =
        typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      return parsed as {
        actualTime: string;
        actualSpace: string;
        optimalTime: string;
        optimalSpace: string;
        isOptimal: boolean;
        timeExplanation: string;
        gapExplanation: string;
        bottleneck: string;
      };
    }),

  // 5. Pattern Recognition Trainer — score candidate's pattern guess
  scorePatternGuess: protectedProcedure
    .input(
      z.object({
        problemTitle: z.string().max(200),
        description: z.string().max(1000),
        correctTopic: z.string().max(60),
        candidateGuess: z.string().max(200),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a Meta coding interviewer scoring a candidate's pattern recognition guess. Return JSON only.",
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle}\nDescription: ${input.description}\nCorrect pattern: ${input.correctTopic}\nCandidate's guess: ${input.candidateGuess}\n\nReturn JSON: { "isCorrect": boolean, "score": number (0-3: 0=wrong, 1=partially right, 2=right pattern wrong name, 3=exactly right), "feedback": string (1-2 sentences: confirm/correct the guess and explain why this pattern fits), "keySignal": string (the one signal in the problem description that most strongly indicates this pattern) }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "pattern_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                isCorrect: { type: "boolean" },
                score: { type: "number" },
                feedback: { type: "string" },
                keySignal: { type: "string" },
              },
              required: ["isCorrect", "score", "feedback", "keySignal"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const parsed =
        typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      return parsed as {
        isCorrect: boolean;
        score: number;
        feedback: string;
        keySignal: string;
      };
    }),

  // 6. L7 Optimization Challenge — challenge candidate to improve their solution
  ic7OptimizationChallenge: protectedProcedure
    .input(
      z.object({
        problemTitle: z.string().max(200),
        topic: z.string().max(60),
        code: z.string().max(6000),
        language: z.string().max(20),
        currentComplexity: z.string().max(100),
        targetComplexity: z.string().max(100),
        hint: z.boolean().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are a senior Meta Principal Engineer (L7) challenging a candidate to optimize their solution. Be direct and Socratic — ask questions, don't give answers. Return JSON only.",
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle} (${input.topic})\nLanguage: ${input.language}\nCurrent solution complexity: ${input.currentComplexity}\nTarget complexity: ${input.targetComplexity}\n\nCode:\n${input.code}\n\nReturn JSON: { "challenge": string (the L7 challenge statement, e.g. 'Your O(n log n) solution is correct. Can you get to O(n)?'), "probeQuestion": string (one Socratic question to guide them without giving the answer), ${input.hint ? '"hint": string (a concrete directional hint — what to change, not how),' : '"hint": null,'} "ic7Insight": string (what an L7 engineer would immediately see that the current solution misses) }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ic7_challenge",
            strict: true,
            schema: {
              type: "object",
              properties: {
                challenge: { type: "string" },
                probeQuestion: { type: "string" },
                hint: { type: ["string", "null"] },
                ic7Insight: { type: "string" },
              },
              required: ["challenge", "probeQuestion", "hint", "ic7Insight"],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      const parsed =
        typeof rawContent === "string" ? JSON.parse(rawContent) : rawContent;
      return parsed as {
        challenge: string;
        probeQuestion: string;
        hint: string | null;
        ic7Insight: string;
      };
    }),

  // ── Voice Answer: transcribe audio and score STAR answer ─────────────────
  transcribeAndScoreVoice: protectedProcedure
    .input(
      z.object({
        audioUrl: z.string(),
        questionText: z.string(),
        icMode: z.enum(["L6", "L7"]).default("L6"),
      })
    )
    .mutation(async ({ input }) => {
      // Step 1: Transcribe audio via Whisper
      const transcription = await transcribeAudio({
        audioUrl: input.audioUrl,
        language: "en",
        prompt:
          "Transcribe a behavioral interview answer using the STAR method (Situation, Task, Action, Result).",
      });
      if ("error" in transcription) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: transcription.error,
        });
      }
      const transcript = transcription.text;

      // Step 2: Score the STAR answer with LLM
      const scoreResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta ${input.icMode} interviewer evaluating a behavioral answer. Score strictly against the ${input.icMode} rubric. Return JSON only.`,
          },
          {
            role: "user",
            content: `Question: "${input.questionText}"\n\nCandidate's spoken answer (transcribed):\n"${transcript}"\n\nEvaluate against the ${input.icMode} rubric and return JSON: { "situation": number (0-5), "task": number (0-5), "action": number (0-5), "result": number (0-5), "overallScore": number (0-5, one decimal), "level": string (L5/L6/L7), "verdict": string (one-line assessment), "strengths": [string] (2-3 specific strengths), "gaps": [string] (2-3 specific gaps), "coaching": string (most important improvement for next attempt), "starStructure": string (brief note on STAR format usage) }`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "voice_star_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                situation: { type: "number" },
                task: { type: "number" },
                action: { type: "number" },
                result: { type: "number" },
                overallScore: { type: "number" },
                level: { type: "string" },
                verdict: { type: "string" },
                strengths: { type: "array", items: { type: "string" } },
                gaps: { type: "array", items: { type: "string" } },
                coaching: { type: "string" },
                starStructure: { type: "string" },
              },
              required: [
                "situation",
                "task",
                "action",
                "result",
                "overallScore",
                "level",
                "verdict",
                "strengths",
                "gaps",
                "coaching",
                "starStructure",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const rawScore = scoreResponse?.choices?.[0]?.message?.content;
      if (!rawScore) throw new Error("No score from AI");
      const score =
        typeof rawScore === "string" ? JSON.parse(rawScore) : rawScore;
      return { transcript, ...score } as {
        transcript: string;
        situation: number;
        task: number;
        action: number;
        result: number;
        overallScore: number;
        level: string;
        verdict: string;
        strengths: string[];
        gaps: string[];
        coaching: string;
        starStructure: string;
      };
    }),

  // Interviewer Perspective Simulator — responds as a Meta interviewer reviewing a design summary
  interviewerPerspective: protectedProcedure
    .input(z.object({ designSummary: z.string().min(30).max(2000) }))
    .output(z.object({ content: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta Staff Engineer (L7) conducting a system design interview. Review the candidate's design summary and respond as a real Meta interviewer would. Return ONLY valid JSON with this exact structure: { "verdict": string, "failurePatterns": string[], "rubricScores": { "Scope & Success Metrics": string, "Request Flow & Hot Path": string, "Data Model & Storage": string, "Architecture & Boundaries": string, "Scale & Bottlenecks": string, "Reliability & Operability": string, "Trade-offs & Judgment": string, "Collaboration & Communication": string }, "feedback": string }. Each rubric score must be exactly one of: "Strong", "Adequate", or "Weak". Verdict must be one of: "L7 Strong Hire", "L6 Hire", "L6 Borderline", "Below L6 - No Hire".`,
          },
          {
            role: "user",
            content: `Candidate's design summary:\n"${input.designSummary}"`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interviewer_perspective",
            strict: true,
            schema: {
              type: "object",
              properties: {
                verdict: { type: "string" },
                failurePatterns: { type: "array", items: { type: "string" } },
                rubricScores: {
                  type: "object",
                  properties: {
                    "Scope & Success Metrics": { type: "string" },
                    "Request Flow & Hot Path": { type: "string" },
                    "Data Model & Storage": { type: "string" },
                    "Architecture & Boundaries": { type: "string" },
                    "Scale & Bottlenecks": { type: "string" },
                    "Reliability & Operability": { type: "string" },
                    "Trade-offs & Judgment": { type: "string" },
                    "Collaboration & Communication": { type: "string" },
                  },
                  required: [
                    "Scope & Success Metrics",
                    "Request Flow & Hot Path",
                    "Data Model & Storage",
                    "Architecture & Boundaries",
                    "Scale & Bottlenecks",
                    "Reliability & Operability",
                    "Trade-offs & Judgment",
                    "Collaboration & Communication",
                  ],
                  additionalProperties: false,
                },
                feedback: { type: "string" },
              },
              required: [
                "verdict",
                "failurePatterns",
                "rubricScores",
                "feedback",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const rawContent = response?.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("No response from AI");
      return {
        content:
          typeof rawContent === "string"
            ? rawContent
            : JSON.stringify(rawContent),
      };
    }),

  // ── Feature #1: AI Interviewer Interrupt Mode ─────────────────────────────
  interruptModeStart: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        approach: z.string(),
        interruptStyle: z.enum([
          "clarifying",
          "pivot",
          "deep_dive",
          "challenge",
          "time_pressure",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta interviewer. Your interrupt style is: ${input.interruptStyle}. Generate exactly 3 realistic interruptions a Meta interviewer would make. Return JSON: {"interruptions": ["...", "...", "..."]}`,
          },
          {
            role: "user",
            content: `Topic: ${input.topic}\nApproach: ${input.approach}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interruptions",
            strict: true,
            schema: {
              type: "object",
              properties: {
                interruptions: { type: "array", items: { type: "string" } },
              },
              required: ["interruptions"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  interruptModeScore: protectedProcedure
    .input(
      z.object({
        topic: z.string(),
        approach: z.string(),
        interruption: z.string(),
        response: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta senior engineer scoring a candidate's response to an interviewer interruption. Score 1-5. Return JSON: {"score": 4, "feedback": "...", "betterResponse": "..."}`,
          },
          {
            role: "user",
            content: `Topic: ${input.topic}\nApproach: ${input.approach}\nInterruption: ${input.interruption}\nResponse: ${input.response}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interrupt_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                feedback: { type: "string" },
                betterResponse: { type: "string" },
              },
              required: ["score", "feedback", "betterResponse"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── Feature #2: Back-of-Envelope Calculator ───────────────────────────────
  scoreBoECalculation: protectedProcedure
    .input(
      z.object({
        problem: z.string(),
        calculation: z.string(),
        result: z.string(),
        unit: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta staff engineer reviewing a back-of-envelope estimation. Return JSON: {"score": 4, "orderOfMagnitude": "correct", "feedback": "...", "keyAssumptions": ["..."], "designImplication": "..."}`,
          },
          {
            role: "user",
            content: `Problem: ${input.problem}\nCalculation: ${input.calculation}\nResult: ${input.result} ${input.unit}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "boe_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                orderOfMagnitude: { type: "string" },
                feedback: { type: "string" },
                keyAssumptions: { type: "array", items: { type: "string" } },
                designImplication: { type: "string" },
              },
              required: [
                "score",
                "orderOfMagnitude",
                "feedback",
                "keyAssumptions",
                "designImplication",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── Feature #3: Tear Down My Design ──────────────────────────────────────
  tearDownDesign: protectedProcedure
    .input(
      z.object({
        problem: z.string(),
        design: z.string(),
        targetLevel: z.enum(["L4", "L5", "L6", "L7"]),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a hostile but fair Meta staff engineer reviewing a system design. Find every flaw, edge case, and missing consideration. Return JSON: {"overallScore": 6, "verdict": "...", "criticalFlaws": [{"flaw": "...", "severity": "critical", "fix": "..."}], "minorIssues": ["..."], "strengths": ["..."], "prioritizedFixes": ["1. ...", "2. ..."]}`,
          },
          {
            role: "user",
            content: `Problem: ${input.problem}\nDesign: ${input.design}\nTarget level: ${input.targetLevel}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "tear_down",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                verdict: { type: "string" },
                criticalFlaws: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      flaw: { type: "string" },
                      severity: { type: "string" },
                      fix: { type: "string" },
                    },
                    required: ["flaw", "severity", "fix"],
                    additionalProperties: false,
                  },
                },
                minorIssues: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } },
                prioritizedFixes: { type: "array", items: { type: "string" } },
              },
              required: [
                "overallScore",
                "verdict",
                "criticalFlaws",
                "minorIssues",
                "strengths",
                "prioritizedFixes",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── Feature #4: Think Out Loud Coach ─────────────────────────────────────
  scoreThinkOutLoud: protectedProcedure
    .input(z.object({ problem: z.string(), transcript: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interviewer evaluating a candidate's think-out-loud process. Score 5 dimensions: Problem Clarification, Approach Articulation, Complexity Awareness, Edge Cases, Communication. Return JSON: {"overallScore": 7, "dimensions": [{"name": "Problem Clarification", "score": 4, "feedback": "..."}, {"name": "Approach Articulation", "score": 3, "feedback": "..."}, {"name": "Complexity Awareness", "score": 4, "feedback": "..."}, {"name": "Edge Cases", "score": 3, "feedback": "..."}, {"name": "Communication", "score": 4, "feedback": "..."}], "topTip": "...", "modelThinkAloud": "..."}`,
          },
          {
            role: "user",
            content: `Problem: ${input.problem}\nTranscript: ${input.transcript}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "think_out_loud",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                dimensions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      score: { type: "number" },
                      feedback: { type: "string" },
                    },
                    required: ["name", "score", "feedback"],
                    additionalProperties: false,
                  },
                },
                topTip: { type: "string" },
                modelThinkAloud: { type: "string" },
              },
              required: [
                "overallScore",
                "dimensions",
                "topTip",
                "modelThinkAloud",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── Feature #5: Pattern Speed Drill ──────────────────────────────────────
  scorePatternDrill: protectedProcedure
    .input(
      z.object({
        problem: z.string(),
        guessedPattern: z.string(),
        timeSeconds: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interviewer. A candidate guessed a coding pattern in ${input.timeSeconds}s. Evaluate correctness. speedRating: fast (<15s), good (15-30s), slow (30-60s), too_slow (>60s). Return JSON: {"correct": true, "correctPattern": "Two Pointers", "explanation": "...", "keySignals": ["..."], "score": 5, "speedRating": "fast"}`,
          },
          {
            role: "user",
            content: `Problem: ${input.problem}\nGuessed: ${input.guessedPattern}\nTime: ${input.timeSeconds}s`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "pattern_drill",
            strict: true,
            schema: {
              type: "object",
              properties: {
                correct: { type: "boolean" },
                correctPattern: { type: "string" },
                explanation: { type: "string" },
                keySignals: { type: "array", items: { type: "string" } },
                score: { type: "number" },
                speedRating: { type: "string" },
              },
              required: [
                "correct",
                "correctPattern",
                "explanation",
                "keySignals",
                "score",
                "speedRating",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── Feature #6: Weak Pattern Remediation Plan ────────────────────────────
  generateRemediationPlan: protectedProcedure
    .input(
      z.object({
        weakPatterns: z.array(
          z.object({ id: z.string(), name: z.string(), rating: z.number() })
        ),
        daysAvailable: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interview coach. Create a day-by-day remediation plan for weak patterns. Return JSON: {"plan": [{"day": 1, "pattern": "Two Pointers", "focus": "...", "problems": ["..."], "goal": "..."}], "weeklyMilestones": ["..."], "estimatedReadinessGain": "..."}`,
          },
          {
            role: "user",
            content: `Weak patterns: ${JSON.stringify(input.weakPatterns)}\nDays: ${input.daysAvailable}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "remediation_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                plan: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "number" },
                      pattern: { type: "string" },
                      focus: { type: "string" },
                      problems: { type: "array", items: { type: "string" } },
                      goal: { type: "string" },
                    },
                    required: ["day", "pattern", "focus", "problems", "goal"],
                    additionalProperties: false,
                  },
                },
                weeklyMilestones: { type: "array", items: { type: "string" } },
                estimatedReadinessGain: { type: "string" },
              },
              required: ["plan", "weeklyMilestones", "estimatedReadinessGain"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── Feature #8: Persona Stress Test ──────────────────────────────────────
  personaStressTestStart: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        answer: z.string(),
        persona: z.string(),
        personaDescription: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are playing "${input.persona}": ${input.personaDescription}. Generate 3 follow-up challenges in character. Return JSON: {"challenges": ["...", "...", "..."]}`,
          },
          {
            role: "user",
            content: `Question: ${input.question}\nAnswer: ${input.answer}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "persona_challenges",
            strict: true,
            schema: {
              type: "object",
              properties: {
                challenges: { type: "array", items: { type: "string" } },
              },
              required: ["challenges"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  personaStressTestRespond: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        initialAnswer: z.string(),
        persona: z.string(),
        challenge: z.string(),
        response: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Score a candidate's response to a behavioral follow-up challenge 1-5. Return JSON: {"score": 4, "feedback": "..."}`,
          },
          {
            role: "user",
            content: `Question: ${input.question}\nInitial: ${input.initialAnswer}\nPersona: ${input.persona}\nChallenge: ${input.challenge}\nResponse: ${input.response}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "challenge_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                feedback: { type: "string" },
              },
              required: ["score", "feedback"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = res?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  personaStressTestScore: protectedProcedure
    .input(
      z.object({
        question: z.string(),
        initialAnswer: z.string(),
        persona: z.string(),
        exchanges: z.array(
          z.object({
            challenge: z.string(),
            response: z.string(),
            score: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const avgScore =
        input.exchanges.reduce((a, e) => a + e.score, 0) /
        input.exchanges.length;
      const res = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Write a 3-4 sentence debrief for a behavioral stress test. Avg score: ${avgScore.toFixed(1)}/5. Cover: resilience, strongest moment, biggest gap, one tip. Return plain markdown.`,
          },
          {
            role: "user",
            content: `Question: ${input.question}\nPersona: ${input.persona}\nExchanges: ${JSON.stringify(input.exchanges)}`,
          },
        ],
      });
      const raw = res?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── Feature #9: Impact Quantification Coach ───────────────────────────────
  quantifyImpact: protectedProcedure
    .input(z.object({ story: z.string() }))
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta L6 interview coach. Analyze the STAR story: find vague claims, suggest metrics, rewrite at L6 standard. Return JSON: {"scoreOriginal": 4, "scoreStrengthened": 9, "weakClaims": [{"original": "...", "suggestion": "..."}], "coaching": "...", "strengthenedStory": "..."}`,
          },
          { role: "user", content: input.story },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "quantify_impact",
            strict: true,
            schema: {
              type: "object",
              properties: {
                scoreOriginal: { type: "number" },
                scoreStrengthened: { type: "number" },
                weakClaims: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      original: { type: "string" },
                      suggestion: { type: "string" },
                    },
                    required: ["original", "suggestion"],
                    additionalProperties: false,
                  },
                },
                coaching: { type: "string" },
                strengthenedStory: { type: "string" },
              },
              required: [
                "scoreOriginal",
                "scoreStrengthened",
                "weakClaims",
                "coaching",
                "strengthenedStory",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── NEW: Seniority Level Calibrator ─────────────────────────────────────
  // Evaluates a STAR story against the target level rubric and returns a
  // "Level Signal" badge (L4-L7) with a specific rewrite suggestion.
  calibrateSeniorityLevel: protectedProcedure
    .input(
      z.object({
        story: z.string().max(3000),
        targetLevel: z.enum(["L4", "L5", "L6", "L7"]),
        question: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta senior hiring committee member who evaluates STAR stories for seniority level.
You assess stories on four dimensions:
1. Scope of impact (team vs org vs company vs industry)
2. Ambiguity handled (clear task vs ambiguous problem vs undefined space)
3. Stakeholder influence (individual contributor vs led team vs influenced org)
4. Candidate as driver vs contributor

Level rubric:
- L4: Team-scoped, clear task, individual contributor, minimal ambiguity
- L5: Cross-team, some ambiguity, led small team or project
- L6: Org-scoped, significant ambiguity, drove cross-functional initiative, measurable org impact
- L7: Company/industry-scoped, high ambiguity, shaped strategy, multiplied teams

Return JSON with: detectedLevel (L4/L5/L6/L7), targetLevel match analysis, scopeSignal, ambiguitySignal, influenceSignal, driverSignal (each: "strong"|"weak"|"absent"), rewriteSuggestion (specific 2-3 sentence instruction to elevate the story to target level), and coaching (markdown string with detailed feedback).`,
          },
          {
            role: "user",
            content: `Target level: ${input.targetLevel}\n\nSTAR Story:\n${input.story}${input.question ? `\n\nInterview question: ${input.question}` : ""}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "seniority_calibration",
            strict: true,
            schema: {
              type: "object",
              properties: {
                detectedLevel: { type: "string" },
                scopeSignal: { type: "string" },
                ambiguitySignal: { type: "string" },
                influenceSignal: { type: "string" },
                driverSignal: { type: "string" },
                rewriteSuggestion: { type: "string" },
                coaching: { type: "string" },
              },
              required: [
                "detectedLevel",
                "scopeSignal",
                "ambiguitySignal",
                "influenceSignal",
                "driverSignal",
                "rewriteSuggestion",
                "coaching",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── NEW: Complexity Proof Trainer ─────────────────────────────────────────
  // Challenges the candidate to prove their complexity claim, not just state it.
  challengeComplexity: protectedProcedure
    .input(
      z.object({
        problemTitle: z.string().max(200),
        solutionDescription: z.string().max(2000),
        claimedTimeComplexity: z.string().max(50),
        claimedSpaceComplexity: z.string().max(50),
        candidateProof: z.string().max(2000),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interviewer who has just heard a candidate claim their solution is ${input.claimedTimeComplexity} time and ${input.claimedSpaceComplexity} space. You need to evaluate their proof.

Evaluate the proof on:
1. Correctness: Is the claimed complexity actually correct?
2. Proof quality: Did they identify the dominant term? Did they handle nested loops correctly? Did they account for amortized cost if applicable? Did they include recursion stack space?
3. Common mistakes: flag any of these if present: forgetting amortized cost, wrong dominant term, ignoring call stack space, conflating average vs worst case, missing the inner loop contribution.

Return JSON with: complexityCorrect (boolean), proofQuality ("strong"|"adequate"|"weak"|"incorrect"), actualTimeComplexity (string), actualSpaceComplexity (string), mistakesFound (array of strings), strengths (array of strings), modelProof (markdown string showing how to prove it correctly), followUpQuestion (a single sharp interviewer follow-up question to probe deeper).`,
          },
          {
            role: "user",
            content: `Problem: ${input.problemTitle}\nSolution: ${input.solutionDescription}\nClaimed: ${input.claimedTimeComplexity} time, ${input.claimedSpaceComplexity} space\n\nCandidate's proof:\n${input.candidateProof}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "complexity_proof",
            strict: true,
            schema: {
              type: "object",
              properties: {
                complexityCorrect: { type: "boolean" },
                proofQuality: { type: "string" },
                actualTimeComplexity: { type: "string" },
                actualSpaceComplexity: { type: "string" },
                mistakesFound: { type: "array", items: { type: "string" } },
                strengths: { type: "array", items: { type: "string" } },
                modelProof: { type: "string" },
                followUpQuestion: { type: "string" },
              },
              required: [
                "complexityCorrect",
                "proofQuality",
                "actualTimeComplexity",
                "actualSpaceComplexity",
                "mistakesFound",
                "strengths",
                "modelProof",
                "followUpQuestion",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── NEW: Post-Interview Debrief Analyzer ──────────────────────────────────
  // Takes a structured debrief and returns a prioritized fix list.
  analyzeDebrief: protectedProcedure
    .input(
      z.object({
        roundType: z.enum([
          "coding",
          "system_design",
          "behavioral",
          "full_loop",
        ]),
        questionsAsked: z.string().max(1000),
        approachTaken: z.string().max(2000),
        uncertainMoments: z.string().max(1000),
        interviewerReactions: z.string().max(1000),
        selfScore: z.number().min(1).max(5),
        targetLevel: z.string().max(10),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interview coach analyzing a candidate's post-interview debrief. Your job is to identify the most likely failure points and generate a specific, actionable fix list for the next attempt.

Analyze the debrief and return:
1. likelyOutcome: "strong_hire" | "hire" | "borderline" | "no_hire" based on the signals
2. topFailurePoints: array of up to 3 specific failure modes identified from the debrief
3. fixList: array of exactly 3 specific, actionable items to practice before the next attempt (each with a title and a 1-sentence action)
4. strengths: array of up to 3 things the candidate did well
5. coaching: markdown string with detailed analysis and next steps

Be direct and honest. Do not sugarcoat. The candidate needs accurate signal to improve.`,
          },
          {
            role: "user",
            content: `Round: ${input.roundType} | Target: ${input.targetLevel} | Self-score: ${input.selfScore}/5\n\nQuestions asked: ${input.questionsAsked}\nApproach taken: ${input.approachTaken}\nUncertain moments: ${input.uncertainMoments}\nInterviewer reactions: ${input.interviewerReactions}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "debrief_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                likelyOutcome: { type: "string" },
                topFailurePoints: { type: "array", items: { type: "string" } },
                fixList: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      action: { type: "string" },
                    },
                    required: ["title", "action"],
                    additionalProperties: false,
                  },
                },
                strengths: { type: "array", items: { type: "string" } },
                coaching: { type: "string" },
              },
              required: [
                "likelyOutcome",
                "topFailurePoints",
                "fixList",
                "strengths",
                "coaching",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── NEW: 10-Day Final Sprint Generator ────────────────────────────────────
  // Reads all performance data and generates a personalized day-by-day plan.
  generateTenDaySprint: protectedProcedure
    .input(
      z.object({
        daysUntilInterview: z.number().min(1).max(30),
        targetLevel: z.string().max(10),
        weakPatterns: z.array(z.string()).max(10),
        weakBehavioralAreas: z.array(z.string()).max(10),
        uncoveredMetaValues: z.array(z.string()).max(10),
        avgPatternScore: z.number(),
        avgBehavioralScore: z.number(),
        mockSessionsCompleted: z.number(),
        lastMockScore: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const days = Math.min(input.daysUntilInterview, 10);
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interview coach building a personalized ${days}-day final sprint plan for a candidate.

Rules:
- Day ${days} (interview day): ONLY "Day-of routine: review cheat sheet, 1 easy warm-up, breathing exercise, logistics check"
- Day ${days - 1}: Full mock day (coding + system design + behavioral)
- Other days: 2-hour focused sessions targeting the candidate's specific weak spots
- Each day must have: a title, a 2-hour session breakdown (morning/afternoon blocks), and 1 specific goal
- Prioritize weak patterns and uncovered behavioral areas
- Include complexity proof practice if avgPatternScore < 3.5
- Include STAR story rewrites if avgBehavioralScore < 3.5
- Day 1 should always start with the weakest pattern

Return JSON: { days: [ { day: 1, title: string, morningBlock: string, afternoonBlock: string, goal: string } ] }`,
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "ten_day_sprint",
            strict: true,
            schema: {
              type: "object",
              properties: {
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "number" },
                      title: { type: "string" },
                      morningBlock: { type: "string" },
                      afternoonBlock: { type: "string" },
                      goal: { type: "string" },
                    },
                    required: [
                      "day",
                      "title",
                      "morningBlock",
                      "afternoonBlock",
                      "goal",
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: ["days"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── NEW: "Why This Company" Story Builder ─────────────────────────────────
  buildWhyCompanyStory: protectedProcedure
    .input(
      z.object({
        targetCompany: z.string().max(100).default("Meta"),
        targetTeam: z.string().max(200).optional(),
        targetLevel: z.string().max(10),
        motivations: z.string().max(2000), // candidate's raw motivations
        relevantExperience: z.string().max(2000),
        specificProducts: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interview coach helping a candidate build a genuine, specific "Why ${input.targetCompany}" narrative for their interview.

The story must:
- Be 90 seconds when spoken (approximately 200-250 words)
- Reference specific Meta products, engineering challenges, or cultural values — not generic statements
- Connect the candidate's background to Meta's specific mission and technical scale
- Sound authentic, not rehearsed
- End with a forward-looking statement about what they want to build at Meta

Return JSON: { story: string (the 90-second narrative), keyThemes: string[] (3 themes that make it authentic), whatToAvoid: string[] (3 generic phrases to avoid), followUpPrep: string (how to handle "tell me more" follow-ups) }`,
          },
          {
            role: "user",
            content: `Target: ${input.targetCompany}${input.targetTeam ? ` / ${input.targetTeam}` : ""} | Level: ${input.targetLevel}\n\nMy motivations: ${input.motivations}\nRelevant experience: ${input.relevantExperience}${input.specificProducts ? `\nProducts I care about: ${input.specificProducts}` : ""}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "why_company_story",
            strict: true,
            schema: {
              type: "object",
              properties: {
                story: { type: "string" },
                keyThemes: { type: "array", items: { type: "string" } },
                whatToAvoid: { type: "array", items: { type: "string" } },
                followUpPrep: { type: "string" },
              },
              required: ["story", "keyThemes", "whatToAvoid", "followUpPrep"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── NEW: Interview Question Prediction Engine ─────────────────────────────
  predictInterviewQuestions: protectedProcedure
    .input(
      z.object({
        targetTeam: z.string().max(200),
        targetLevel: z.string().max(10),
        interviewType: z.enum(["coding", "system_design", "behavioral", "all"]),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interview coach with deep knowledge of what each Meta team asks in interviews. Based on the team and level, predict the most likely interview questions.

For system design: predict 5 most likely questions for this team (e.g., Ads team asks about auction systems, ranking pipelines; Infrastructure asks about distributed storage, consensus; Integrity asks about content moderation at scale).
For behavioral: predict the 3 most likely focus areas and 2 specific questions per area for this team and level.
For coding: predict the 3 most likely pattern types and 2 example problems per pattern.

Return JSON: { systemDesign: string[], behavioralFocusAreas: [{area: string, questions: string[]}], codingPatterns: [{pattern: string, examples: string[]}], teamInsight: string (1-2 sentences about what this team specifically values) }`,
          },
          {
            role: "user",
            content: `Team: ${input.targetTeam} | Level: ${input.targetLevel} | Focus: ${input.interviewType}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "question_prediction",
            strict: true,
            schema: {
              type: "object",
              properties: {
                systemDesign: { type: "array", items: { type: "string" } },
                behavioralFocusAreas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      area: { type: "string" },
                      questions: { type: "array", items: { type: "string" } },
                    },
                    required: ["area", "questions"],
                    additionalProperties: false,
                  },
                },
                codingPatterns: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      pattern: { type: "string" },
                      examples: { type: "array", items: { type: "string" } },
                    },
                    required: ["pattern", "examples"],
                    additionalProperties: false,
                  },
                },
                teamInsight: { type: "string" },
              },
              required: [
                "systemDesign",
                "behavioralFocusAreas",
                "codingPatterns",
                "teamInsight",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),

  // ── Feature #10: Interview Readiness Report ───────────────────────────────
  generateReadinessReport: protectedProcedure
    .input(
      z.object({
        patterns: z.array(
          z.object({ id: z.string(), name: z.string(), rating: z.number() })
        ),
        behavioralQuestions: z.array(
          z.object({
            id: z.string(),
            q: z.string(),
            area: z.string(),
            rating: z.number(),
            hasStory: z.boolean(),
          })
        ),
        metaValues: z.array(z.object({ name: z.string() })),
        stats: z.object({
          masteredPatterns: z.number(),
          weakPatterns: z.number(),
          totalPatterns: z.number(),
          avgPatternScore: z.number(),
          readyBQ: z.number(),
          totalBQ: z.number(),
          avgBQScore: z.number(),
          storiesWritten: z.number(),
          valuesCovered: z.number(),
          totalValues: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interview coach. Generate a comprehensive readiness report. Score 0-100, verdict: "go" (>=75), "almost" (55-74), "no-go" (<55). Include: executive summary, coding readiness, behavioral readiness, critical gaps, 7-day action plan, final recommendation. Return JSON: {"score": 72, "verdict": "almost", "report": "## Executive Summary\n..."}`,
          },
          { role: "user", content: JSON.stringify(input) },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "readiness_report",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "number" },
                verdict: { type: "string" },
                report: { type: "string" },
              },
              required: ["score", "verdict", "report"],
              additionalProperties: false,
            },
          },
        },
      });
      const raw = response?.choices?.[0]?.message?.content;
      if (!raw) throw new Error("No response");
      return { content: typeof raw === "string" ? raw : JSON.stringify(raw) };
    }),
});
