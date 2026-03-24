import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { collabRooms, sessionEvents, scorecards } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { notifyOwner } from "../_core/notification";

// ── Room management ────────────────────────────────────────────────────────
export const collabRouter = router({
  createRoom: publicProcedure
    .input(
      z.object({
        roomCode: z.string().min(4).max(16),
        questionTitle: z.string().optional(),
        mode: z.enum(["human", "ai"]).default("human"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(collabRooms).values({
        roomCode: input.roomCode,
        questionTitle: input.questionTitle ?? null,
        mode: input.mode,
        status: "waiting",
      });
      return { roomCode: input.roomCode };
    }),

  getRoom: publicProcedure
    .input(z.object({ roomCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(collabRooms)
        .where(eq(collabRooms.roomCode, input.roomCode))
        .limit(1);
      return rows[0] ?? null;
    }),

  updateRoom: publicProcedure
    .input(
      z.object({
        roomCode: z.string(),
        status: z.enum(["waiting", "active", "ended"]).optional(),
        questionTitle: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return;
      const update: Record<string, unknown> = {};
      if (input.status) update.status = input.status;
      if (input.questionTitle) update.questionTitle = input.questionTitle;
      if (input.status === "ended") update.endedAt = new Date();
      await db
        .update(collabRooms)
        .set(update)
        .where(eq(collabRooms.roomCode, input.roomCode));
    }),

  // ── Session events (for replay) ──────────────────────────────────────────
  saveEvent: publicProcedure
    .input(
      z.object({
        roomCode: z.string(),
        eventType: z.string(),
        payload: z
          .record(z.string(), z.unknown())
          .or(z.string())
          .or(z.number())
          .or(z.boolean())
          .or(z.null())
          .optional(),
        actorName: z.string().optional(),
        ts: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return;
      await db.insert(sessionEvents).values({
        roomCode: input.roomCode,
        eventType: input.eventType,
        payload: input.payload,
        actorName: input.actorName ?? null,
        ts: input.ts,
      });
    }),

  getReplay: publicProcedure
    .input(z.object({ roomCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(sessionEvents)
        .where(eq(sessionEvents.roomCode, input.roomCode));
    }),

  // ── Scorecard ────────────────────────────────────────────────────────────
  saveScorecard: publicProcedure
    .input(
      z.object({
        roomCode: z.string(),
        scorerName: z.string().optional(),
        candidateName: z.string().optional(),
        requirementsScore: z.number().min(1).max(5),
        architectureScore: z.number().min(1).max(5),
        scalabilityScore: z.number().min(1).max(5),
        communicationScore: z.number().min(1).max(5),
        overallFeedback: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      // Generate AI coaching note
      const avg = (
        (input.requirementsScore +
          input.architectureScore +
          input.scalabilityScore +
          input.communicationScore) /
        4
      ).toFixed(1);
      const weakDims = [
        input.requirementsScore <= 2 ? "Requirements Gathering" : null,
        input.architectureScore <= 2 ? "Architecture Design" : null,
        input.scalabilityScore <= 2 ? "Scalability Thinking" : null,
        input.communicationScore <= 2 ? "Communication Clarity" : null,
      ].filter(Boolean);

      let aiCoachingNote = "";
      try {
        const res = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a senior Meta engineering interviewer providing concise, actionable feedback. Be direct and specific. 2-3 sentences max.",
            },
            {
              role: "user",
              content: `Candidate scored ${avg}/5 overall in a system design interview. Scores: Requirements ${input.requirementsScore}/5, Architecture ${input.architectureScore}/5, Scalability ${input.scalabilityScore}/5, Communication ${input.communicationScore}/5. ${weakDims.length > 0 ? `Weak areas: ${weakDims.join(", ")}.` : "Strong performance across all dimensions."} ${input.overallFeedback ? `Interviewer notes: ${input.overallFeedback}` : ""} Provide a 2-3 sentence coaching note for the candidate.`,
            },
          ],
        });
        aiCoachingNote = String(res.choices?.[0]?.message?.content ?? "");
      } catch {
        aiCoachingNote = `Overall score ${avg}/5. ${weakDims.length > 0 ? `Focus on improving: ${weakDims.join(", ")}.` : "Strong performance — keep refining your communication of trade-offs."}`;
      }

      await db.insert(scorecards).values({
        roomCode: input.roomCode,
        scorerName: input.scorerName ?? null,
        candidateName: input.candidateName ?? null,
        requirementsScore: input.requirementsScore,
        architectureScore: input.architectureScore,
        scalabilityScore: input.scalabilityScore,
        communicationScore: input.communicationScore,
        overallFeedback: input.overallFeedback ?? null,
        aiCoachingNote,
      });
      return { aiCoachingNote, avg };
    }),

  getScorecard: publicProcedure
    .input(z.object({ roomCode: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const rows = await db
        .select()
        .from(scorecards)
        .where(eq(scorecards.roomCode, input.roomCode))
        .limit(1);
      return rows[0] ?? null;
    }),

  // ── AI Interviewer ────────────────────────────────────────────────────────
  aiFollowUp: publicProcedure
    .input(
      z.object({
        questionTitle: z.string(),
        transcript: z.array(
          z.object({
            role: z.enum(["interviewer", "candidate"]),
            text: z.string(),
          })
        ),
        weakAreas: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const history = input.transcript.map(t => ({
        role:
          t.role === "interviewer" ? ("assistant" as const) : ("user" as const),
        content: t.text,
      }));

      const res = await invokeLLM({
        messages: [
          {
            role: "system",
            content: String(
              `You are a senior Meta Staff Engineer (L6/L7) conducting a system design interview. The question is: "${input.questionTitle}". Ask ONE focused follow-up question to probe deeper. Be concise (1-2 sentences). ${input.weakAreas?.length ? `The candidate seems weak on: ${input.weakAreas.join(", ")}. Probe those areas.` : ""} Do not give hints or answers. Only ask a question.`
            ),
          },
          ...history,
        ],
      });

      return {
        question:
          res.choices?.[0]?.message?.content ??
          "Can you elaborate on your approach to handling failures in this system?",
      };
    }),

  aiFinalFeedback: publicProcedure
    .input(
      z.object({
        questionTitle: z.string(),
        transcript: z.array(
          z.object({
            role: z.enum(["interviewer", "candidate"]),
            text: z.string(),
          })
        ),
        durationMinutes: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const transcriptText = input.transcript
        .map(t => `${t.role.toUpperCase()}: ${t.text}`)
        .join("\n");

      const res = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta Staff Engineer evaluating a system design interview. Provide structured feedback in exactly this JSON format: { "overallScore": <1-5 number>, "requirementsScore": <1-5>, "architectureScore": <1-5>, "scalabilityScore": <1-5>, "communicationScore": <1-5>, "strengths": ["...", "..."], "improvements": ["...", "..."], "level": "L5|L6|L7", "summary": "2-3 sentence coaching note" }`,
          },
          {
            role: "user",
            content: `Question: "${input.questionTitle}"\nDuration: ${input.durationMinutes} minutes\n\nTranscript:\n${transcriptText}\n\nProvide structured feedback JSON.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "interview_feedback",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                requirementsScore: { type: "number" },
                architectureScore: { type: "number" },
                scalabilityScore: { type: "number" },
                communicationScore: { type: "number" },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
                level: { type: "string" },
                summary: { type: "string" },
              },
              required: [
                "overallScore",
                "requirementsScore",
                "architectureScore",
                "scalabilityScore",
                "communicationScore",
                "strengths",
                "improvements",
                "level",
                "summary",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const content = res.choices?.[0]?.message?.content ?? "{}";
      try {
        return JSON.parse(
          typeof content === "string" ? content : JSON.stringify(content)
        );
      } catch {
        return {
          overallScore: 3,
          requirementsScore: 3,
          architectureScore: 3,
          scalabilityScore: 3,
          communicationScore: 3,
          strengths: ["Attempted the problem"],
          improvements: ["More detail needed"],
          level: "L5",
          summary: "Keep practicing system design fundamentals.",
        };
      }
    }),

  // ── STAR Answer Quality Scorer ────────────────────────────────────────────
  scoreStarAnswer: publicProcedure
    .input(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta senior engineering manager evaluating a behavioral interview answer. Score it and return JSON in exactly this format: { "specificityScore": <1-5>, "impactScore": <1-5>, "level": "L5|L6|L7", "coachingNote": "1 paragraph coaching note", "starBreakdown": { "situation": "...", "task": "...", "action": "...", "result": "..." } }`,
          },
          {
            role: "user",
            content: `Question: "${input.question}"\n\nAnswer: "${input.answer}"\n\nScore this STAR answer.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "star_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                specificityScore: { type: "number" },
                impactScore: { type: "number" },
                level: { type: "string" },
                coachingNote: { type: "string" },
                starBreakdown: {
                  type: "object",
                  properties: {
                    situation: { type: "string" },
                    task: { type: "string" },
                    action: { type: "string" },
                    result: { type: "string" },
                  },
                  required: ["situation", "task", "action", "result"],
                  additionalProperties: false,
                },
              },
              required: [
                "specificityScore",
                "impactScore",
                "level",
                "coachingNote",
                "starBreakdown",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const content = res.choices?.[0]?.message?.content ?? "{}";
      try {
        return JSON.parse(
          typeof content === "string" ? content : JSON.stringify(content)
        );
      } catch {
        return {
          specificityScore: 3,
          impactScore: 3,
          level: "L5",
          coachingNote: "Add more specific metrics and quantify your impact.",
          starBreakdown: { situation: "", task: "", action: "", result: "" },
        };
      }
    }),

  // ── Voice-to-STAR (transcription + structuring) ───────────────────────────
  transcribeAndStructure: publicProcedure
    .input(
      z.object({
        audioUrl: z.string().url(),
        question: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      // Dynamic import to avoid issues if voiceTranscription module not available
      let transcription = "";
      try {
        const { transcribeAudio } = await import("../_core/voiceTranscription");
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: "en",
        });
        transcription = (result as { text: string }).text ?? "";
      } catch {
        throw new Error("Transcription failed. Please check audio format.");
      }

      // Structure into STAR
      const res = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a Meta interview coach. Given a raw spoken answer, structure it into STAR format. Return JSON: { "situation": "...", "task": "...", "action": "...", "result": "...", "rawTranscript": "..." }`,
          },
          {
            role: "user",
            content: `Question: "${input.question}"\n\nRaw answer: "${transcription}"\n\nStructure this into STAR format.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "star_structure",
            strict: true,
            schema: {
              type: "object",
              properties: {
                situation: { type: "string" },
                task: { type: "string" },
                action: { type: "string" },
                result: { type: "string" },
                rawTranscript: { type: "string" },
              },
              required: [
                "situation",
                "task",
                "action",
                "result",
                "rawTranscript",
              ],
              additionalProperties: false,
            },
          },
        },
      });

      const content = res.choices?.[0]?.message?.content ?? "{}";
      try {
        return JSON.parse(
          typeof content === "string" ? content : JSON.stringify(content)
        );
      } catch {
        return {
          situation: "",
          task: "",
          action: "",
          result: "",
          rawTranscript: transcription,
        };
      }
    }),

  // ── Answer Quality Scorer ────────────────────────────────────────────────
  scoreAnswer: publicProcedure
    .input(
      z.object({
        question: z.string(),
        answer: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const res = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Meta interviewer evaluating a STAR behavioral answer for an L6/L7 role. Score on three axes (1-5) and give a coaching note. Return JSON only.`,
          },
          {
            role: "user",
            content: `Question: "${input.question}"

Answer: "${input.answer}"

Score this answer.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "answer_score",
            strict: true,
            schema: {
              type: "object",
              properties: {
                specificity: {
                  type: "number",
                  description: "1-5: how specific and concrete the answer is",
                },
                impactClarity: {
                  type: "number",
                  description:
                    "1-5: how clearly the impact/result is communicated",
                },
                level: {
                  type: "string",
                  description: "L5, L6, or L7 — the level this answer signals",
                },
                coachingNote: {
                  type: "string",
                  description: "One paragraph of actionable coaching feedback",
                },
                strengths: {
                  type: "string",
                  description: "What the candidate did well",
                },
                improvements: {
                  type: "string",
                  description: "Key areas to improve",
                },
              },
              required: [
                "specificity",
                "impactClarity",
                "level",
                "coachingNote",
                "strengths",
                "improvements",
              ],
              additionalProperties: false,
            },
          },
        },
      });
      const content = res.choices?.[0]?.message?.content ?? "{}";
      try {
        return JSON.parse(
          typeof content === "string" ? content : JSON.stringify(content)
        );
      } catch {
        return {
          specificity: 3,
          impactClarity: 3,
          level: "L6",
          coachingNote: "Unable to score at this time.",
          strengths: "",
          improvements: "",
        };
      }
    }),

  // ── Upload audio for Voice-to-STAR ───────────────────────────────────────
  uploadAudio: protectedProcedure
    .input(
      z.object({
        audioBase64: z.string(),
        mimeType: z.string().default("audio/webm"),
      })
    )
    .mutation(async ({ input }) => {
      const { storagePut } = await import("../storage");
      const { nanoid } = await import("nanoid");
      const buffer = Buffer.from(input.audioBase64, "base64");
      const key = `voice-answers/${nanoid()}.webm`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),

  // ── Weekly Progress Digest ────────────────────────────────────────────────
  sendWeeklyDigest: protectedProcedure
    .input(
      z.object({
        masteredCount: z.number(),
        totalPatterns: z.number(),
        streakDays: z.number(),
        mockSessions: z.number(),
        weakSpots: z.array(z.string()),
        overallPct: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const weakList = input.weakSpots
        .slice(0, 3)
        .map((w, i) => `${i + 1}. ${w}`)
        .join("\n");
      await notifyOwner({
        title: `📊 Weekly Meta Prep Digest — ${input.overallPct}% Ready`,
        content: `**Weekly Progress Summary**\n\n✅ Patterns Mastered: ${input.masteredCount}/${input.totalPatterns}\n🔥 Current Streak: ${input.streakDays} days\n🎯 Mock Sessions: ${input.mockSessions}\n📈 Overall Readiness: ${input.overallPct}%\n\n**Top 3 Weak Spots to Focus On:**\n${weakList || "None — great work!"}`,
      });
      return { sent: true };
    }),
});
