import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

export const ctciRouter = router({
  generateDebrief: publicProcedure
    .input(
      z.object({
        codingProblem: z.string(),
        codingNotes: z.string().optional(),
        codingTimeUsed: z.number(), // seconds
        bq1Question: z.string(),
        bq1Answer: z.string().optional(),
        bq2Question: z.string(),
        bq2Answer: z.string().optional(),
        icTarget: z.enum(["IC5", "IC6", "IC7"]).default("IC6"),
        totalTimeUsed: z.number(), // seconds
      })
    )
    .mutation(async ({ input }) => {
      const { codingProblem, codingNotes, codingTimeUsed, bq1Question, bq1Answer, bq2Question, bq2Answer, icTarget, totalTimeUsed } = input;

      const systemPrompt = `You are a senior Meta engineering interviewer writing a post-interview debrief.
Assess the candidate's performance in a 45-minute mock interview for ${icTarget} level.
Be direct, specific, and constructive. Use Meta's hiring bar language.

Respond ONLY with valid JSON:
{
  "overallVerdict": "Strong Hire" | "Hire" | "Borderline" | "No Hire",
  "overallScore": <1-5>,
  "codingAssessment": "<2-3 sentences on coding performance>",
  "codingScore": <1-5>,
  "behavioralAssessment": "<2-3 sentences on behavioral performance>",
  "behavioralScore": <1-5>,
  "icLevelAssessment": "<1-2 sentences on whether they demonstrated ${icTarget} scope>",
  "topStrengths": ["<strength 1>", "<strength 2>"],
  "criticalGaps": ["<gap 1>", "<gap 2>"],
  "nextSteps": ["<action 1>", "<action 2>", "<action 3>"]
}`;

      const codingMins = Math.floor(codingTimeUsed / 60);
      const totalMins = Math.floor(totalTimeUsed / 60);

      const userMsg = `MOCK INTERVIEW DEBRIEF REQUEST
Target Level: ${icTarget}
Total time used: ${totalMins} min

--- CODING SECTION (time: ${codingMins} min) ---
Problem: ${codingProblem}
Candidate notes/approach: ${codingNotes?.trim() || "(no notes provided)"}

--- BEHAVIORAL SECTION ---
Q1: ${bq1Question}
A1: ${bq1Answer?.trim() || "(no answer provided)"}

Q2: ${bq2Question}
A2: ${bq2Answer?.trim() || "(no answer provided)"}

Generate the debrief JSON.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "mock_debrief",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallVerdict: { type: "string" },
                overallScore: { type: "integer" },
                codingAssessment: { type: "string" },
                codingScore: { type: "integer" },
                behavioralAssessment: { type: "string" },
                behavioralScore: { type: "integer" },
                icLevelAssessment: { type: "string" },
                topStrengths: { type: "array", items: { type: "string" } },
                criticalGaps: { type: "array", items: { type: "string" } },
                nextSteps: { type: "array", items: { type: "string" } },
              },
              required: ["overallVerdict","overallScore","codingAssessment","codingScore","behavioralAssessment","behavioralScore","icLevelAssessment","topStrengths","criticalGaps","nextSteps"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices?.[0]?.message?.content ?? "{}";
      try {
        const p = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
        return {
          overallVerdict: p.overallVerdict ?? "Borderline",
          overallScore: Math.min(5, Math.max(1, p.overallScore ?? 3)),
          codingAssessment: p.codingAssessment ?? "",
          codingScore: Math.min(5, Math.max(1, p.codingScore ?? 3)),
          behavioralAssessment: p.behavioralAssessment ?? "",
          behavioralScore: Math.min(5, Math.max(1, p.behavioralScore ?? 3)),
          icLevelAssessment: p.icLevelAssessment ?? "",
          topStrengths: p.topStrengths ?? [],
          criticalGaps: p.criticalGaps ?? [],
          nextSteps: p.nextSteps ?? [],
        };
      } catch {
        return {
          overallVerdict: "Borderline", overallScore: 3,
          codingAssessment: "Could not generate assessment.", codingScore: 3,
          behavioralAssessment: "Could not generate assessment.", behavioralScore: 3,
          icLevelAssessment: "Could not generate assessment.",
          topStrengths: [], criticalGaps: [], nextSteps: ["Retry the debrief."],
        };
      }
    }),

  scoreAnswer: publicProcedure
    .input(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
        icTarget: z.enum(["IC5", "IC6", "IC7"]).default("IC6"),
      })
    )
    .mutation(async ({ input }) => {
      const { question, answer, icTarget } = input;

      const systemPrompt = `You are a Meta senior engineering interviewer evaluating a STAR behavioral answer.
Score the answer on THREE dimensions, each 1-5:
1. Specificity (1=vague/generic, 5=concrete metrics/names/dates)
2. Impact (1=no measurable outcome, 5=clear business/technical impact with numbers)
3. IC-Level Fit (1=below ${icTarget}, 5=clearly demonstrates ${icTarget} scope and ownership)

Respond ONLY with valid JSON in this exact shape:
{
  "specificity": <1-5>,
  "impact": <1-5>,
  "icLevelFit": <1-5>,
  "overall": <1-5>,
  "strengths": ["<one sentence>", "<one sentence>"],
  "improvements": ["<one sentence>", "<one sentence>"]
}
No extra text outside the JSON.`;

      const userMsg = `Question: ${question}

Answer:
${answer.slice(0, 2000)}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "answer_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                specificity: { type: "integer" },
                impact: { type: "integer" },
                icLevelFit: { type: "integer" },
                overall: { type: "integer" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
              },
              required: ["specificity", "impact", "icLevelFit", "overall", "strengths", "improvements"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices?.[0]?.message?.content ?? "{}";
      try {
        const parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
        return {
          specificity: Math.min(5, Math.max(1, parsed.specificity ?? 3)),
          impact: Math.min(5, Math.max(1, parsed.impact ?? 3)),
          icLevelFit: Math.min(5, Math.max(1, parsed.icLevelFit ?? 3)),
          overall: Math.min(5, Math.max(1, parsed.overall ?? 3)),
          strengths: parsed.strengths ?? [],
          improvements: parsed.improvements ?? [],
        };
      } catch {
        return { specificity: 3, impact: 3, icLevelFit: 3, overall: 3, strengths: [], improvements: ["Could not parse AI response."] };
      }
    }),

  patternHint: publicProcedure
    .input(
      z.object({
        patternName: z.string().min(1),
        patternDesc: z.string(),
        patternKeyIdea: z.string(),
        examples: z.array(z.string()),
        hintLevel: z.enum(["gentle", "medium", "full"]),
        userRating: z.number().int().min(0).max(5),
      })
    )
    .mutation(async ({ input }) => {
      const { patternName, patternDesc, patternKeyIdea, examples, hintLevel, userRating } = input;

      const levelInstructions = {
        gentle: `Give a GENTLE hint (1-2 sentences). Only point toward the category/intuition. Do NOT name the algorithm or data structure directly. Ask a guiding question.`,
        medium: `Give a MEDIUM hint (2-3 sentences). Name the data structure or algorithm pattern. Explain WHY it applies here. Give one concrete step to start. Do NOT write code.`,
        full: `Give a FULL WALKTHROUGH (4-6 sentences). Explain the complete approach step by step: data structure choice, algorithm, key insight, time/space complexity. You may use pseudocode but NOT a full solution.`,
      };

      const systemPrompt = `You are a Meta coding interview coach helping a candidate understand algorithmic patterns.
${levelInstructions[hintLevel]}
Be encouraging. Tailor to someone who rated their mastery ${userRating}/5.`;

      const userMsg = `Pattern: ${patternName}
Description: ${patternDesc}
Key Idea: ${patternKeyIdea}
Example problems: ${examples.join(", ")}

I'm stuck. Give me a ${hintLevel} hint.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      });

      const hint = response.choices?.[0]?.message?.content ?? "Think about what data structure gives you the key property you need here.";
      return { hint: typeof hint === "string" ? hint : JSON.stringify(hint) };
    }),

  studyPlan: publicProcedure
    .input(
      z.object({
        durationMins: z.enum(["30", "60", "90"]),
        icTarget: z.enum(["IC5", "IC6", "IC7"]).default("IC6"),
        readinessPct: z.number().min(0).max(100),
        srDuePatterns: z.array(z.string()),
        srDueBehavioral: z.array(z.string()),
        mostHintedPatterns: z.array(z.string()),
        weakPatterns: z.array(z.string()),
        ctciUnsolved: z.number().int().min(0),
        daysToInterview: z.number().int().min(0).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { durationMins, icTarget, readinessPct, srDuePatterns, srDueBehavioral, mostHintedPatterns, weakPatterns, ctciUnsolved, daysToInterview } = input;

      const systemPrompt = `You are a Meta interview prep coach building a focused study session plan.
Create a prioritised, time-boxed plan for a ${durationMins}-minute session targeting ${icTarget}.
Be specific, actionable, and encouraging. Use emojis sparingly for readability.

Respond ONLY with valid JSON:
{
  "headline": "<one motivating sentence for today's session>",
  "blocks": [
    { "emoji": "<single emoji>", "title": "<block title>", "durationMins": <number>, "tasks": ["<task 1>", "<task 2>"] }
  ],
  "tip": "<one tactical tip for today>",
  "warningIfAny": "<optional warning if readiness is low or interview is close, else null>"
}`;

      const userMsg = `Session: ${durationMins} min | Target: ${icTarget} | Readiness: ${readinessPct}%
Days to interview: ${daysToInterview ?? 'unknown'}
SR due patterns: ${srDuePatterns.slice(0,5).join(', ') || 'none'}
SR due behavioral: ${srDueBehavioral.slice(0,3).join(', ') || 'none'}
Most-hinted patterns (need work): ${mostHintedPatterns.slice(0,3).join(', ') || 'none'}
Weak patterns (rated ≤2): ${weakPatterns.slice(0,5).join(', ') || 'none'}
Unsolved CTCI problems: ${ctciUnsolved}

Build the optimal study plan.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "study_plan",
            strict: true,
            schema: {
              type: "object",
              properties: {
                headline: { type: "string" },
                blocks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      emoji: { type: "string" },
                      title: { type: "string" },
                      durationMins: { type: "integer" },
                      tasks: { type: "array", items: { type: "string" } },
                    },
                    required: ["emoji", "title", "durationMins", "tasks"],
                    additionalProperties: false,
                  },
                },
                tip: { type: "string" },
                warningIfAny: { type: ["string", "null"] },
              },
              required: ["headline", "blocks", "tip", "warningIfAny"],
              additionalProperties: false,
            },
          },
        },
      });

      const raw = response.choices?.[0]?.message?.content ?? "{}";
      try {
        const p = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
        return {
          headline: p.headline ?? "Let's get to work!",
          blocks: p.blocks ?? [],
          tip: p.tip ?? "",
          warningIfAny: p.warningIfAny ?? null,
        };
      } catch {
        return { headline: "Session ready!", blocks: [], tip: "Focus on your weakest patterns first.", warningIfAny: null };
      }
    }),

  getHint: publicProcedure
    .input(
      z.object({
        problemName: z.string().min(1),
        problemNum: z.number().int().positive(),
        difficulty: z.string(),
        topics: z.array(z.string()),
        currentCode: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { problemName, difficulty, topics, currentCode } = input;

      const systemPrompt = `You are a coding interview coach helping a candidate prepare for Meta interviews.
Your job is to give a HINT — not the full solution.
Rules:
- Give 1-2 sentences maximum
- Point toward the right data structure or algorithmic pattern WITHOUT revealing the full approach
- If the user has written code, comment on the direction (right/wrong) without fixing it
- Never write actual solution code
- Be encouraging and concise`;

      const userMsg = `Problem: ${problemName} (${difficulty})
Topics: ${topics.join(", ")}
${currentCode && currentCode.trim().length > 50 ? `\nCurrent code attempt:\n\`\`\`\n${currentCode.slice(0, 800)}\n\`\`\`` : ""}

Give me a hint to get unstuck without spoiling the solution.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      });

      const hint = response.choices?.[0]?.message?.content ?? "Think about which data structure gives you O(1) lookup here.";

      return { hint: typeof hint === "string" ? hint : JSON.stringify(hint) };
    }),
});
