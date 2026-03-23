/**
 * #8 — Interviewer Persona Stress Test
 * Candidate picks a behavioral question and an interviewer persona.
 * AI plays the persona and fires 3 follow-up challenges.
 * Candidate responds to each. AI scores the full exchange.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import { BEHAVIORAL_QUESTIONS } from "@/lib/data";
import {
  UserX,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageSquare,
} from "lucide-react";

const PERSONAS = [
  {
    id: "skeptic",
    name: "The Skeptic",
    description:
      "Challenges every claim with 'But how do you know that worked?'",
    icon: "🔍",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
  {
    id: "devil",
    name: "The Devil's Advocate",
    description: "Argues the opposite of everything you say",
    icon: "😈",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    id: "detail",
    name: "The Detail Obsessive",
    description: "Demands exact numbers, dates, and metrics for every claim",
    icon: "📊",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "silent",
    name: "The Silent Starer",
    description: "Responds with 'Interesting. Tell me more.' to everything",
    icon: "😶",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  {
    id: "friendly",
    name: "The Friendly Trap",
    description: "Warm and encouraging — then asks the hardest follow-up",
    icon: "😊",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
];

interface Exchange {
  challenge: string;
  response: string;
  score?: number;
  feedback?: string;
}

export function InterviewerPersonaStressTest() {
  const [expanded, setExpanded] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(PERSONAS[0]);
  const [selectedQId, setSelectedQId] = useState(
    BEHAVIORAL_QUESTIONS[0]?.id ?? ""
  );
  const [initialAnswer, setInitialAnswer] = useState("");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [phase, setPhase] = useState<"setup" | "challenges" | "done">("setup");
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [responseInput, setResponseInput] = useState("");
  const [finalScore, setFinalScore] = useState<string | null>(null);

  const startMutation = trpc.ai.personaStressTestStart.useMutation();
  const respondMutation = trpc.ai.personaStressTestRespond.useMutation();
  const scoreMutation = trpc.ai.personaStressTestScore.useMutation();

  const selectedQ = BEHAVIORAL_QUESTIONS.find(q => q.id === selectedQId);

  async function handleStart() {
    if (!initialAnswer.trim()) {
      toast.error("Write your initial answer first");
      return;
    }
    try {
      const res = await startMutation.mutateAsync({
        question: selectedQ?.q ?? "",
        answer: initialAnswer,
        persona: selectedPersona.id,
        personaDescription: selectedPersona.description,
      });
      const parsed = JSON.parse(res.content) as { challenges: string[] };
      setChallenges(parsed.challenges);
      setPhase("challenges");
      setCurrentChallengeIdx(0);
    } catch {
      toast.error("Failed to start — try again");
    }
  }

  async function handleRespond() {
    if (!responseInput.trim()) return;
    const challenge = challenges[currentChallengeIdx];
    try {
      const res = await respondMutation.mutateAsync({
        question: selectedQ?.q ?? "",
        initialAnswer,
        persona: selectedPersona.id,
        challenge,
        response: responseInput,
      });
      const parsed = JSON.parse(res.content) as {
        score: number;
        feedback: string;
      };
      const newExchange: Exchange = {
        challenge,
        response: responseInput,
        score: parsed.score,
        feedback: parsed.feedback,
      };
      const updatedExchanges = [...exchanges, newExchange];
      setExchanges(updatedExchanges);
      setResponseInput("");

      const nextIdx = currentChallengeIdx + 1;
      if (nextIdx >= challenges.length) {
        setPhase("done");
        // Generate final summary
        try {
          const summaryRes = await scoreMutation.mutateAsync({
            question: selectedQ?.q ?? "",
            initialAnswer,
            persona: selectedPersona.id,
            exchanges: updatedExchanges.map(e => ({
              challenge: e.challenge,
              response: e.response,
              score: e.score ?? 0,
            })),
          });
          setFinalScore(summaryRes.content);
        } catch {
          // non-fatal
        }
      } else {
        setCurrentChallengeIdx(nextIdx);
      }
    } catch {
      toast.error("Scoring failed");
    }
  }

  function reset() {
    setPhase("setup");
    setExchanges([]);
    setChallenges([]);
    setInitialAnswer("");
    setResponseInput("");
    setFinalScore(null);
    setCurrentChallengeIdx(0);
  }

  const avgScore =
    exchanges.length > 0
      ? exchanges.reduce((a, e) => a + (e.score ?? 0), 0) / exchanges.length
      : null;

  return (
    <div
      id="behavioral-persona-stress"
      className="rounded-xl border-2 border-orange-500/60 bg-gradient-to-br from-orange-950/40 to-red-950/30 overflow-hidden"
      style={{ boxShadow: "0 0 24px rgba(249,115,22,0.12)" }}
    >
      {/* HIGH IMPACT header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500/20 to-red-500/10 border-b border-orange-500/30">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-orange-600 text-white text-[10px] font-black tracking-wider uppercase">
            🎯 Very High Impact
          </span>
          <UserX size={16} className="text-orange-400" />
          <span className="text-sm font-bold text-orange-300">
            Interviewer Persona Stress Test
          </span>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-orange-400 hover:text-orange-300 transition-colors"
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!expanded && (
        <div className="px-4 py-3">
          <p className="text-xs text-muted-foreground">
            AI plays a hostile interviewer persona and fires 3 follow-up
            challenges at your answer. Builds resilience for the toughest
            interviewers.
          </p>
          <button
            onClick={() => setExpanded(true)}
            className="mt-2 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            Start stress test →
          </button>
        </div>
      )}

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Why this matters */}
          <div className="flex gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <AlertTriangle
              size={14}
              className="text-orange-400 shrink-0 mt-0.5"
            />
            <p className="text-xs text-orange-200">
              <strong>Why this matters:</strong> Most candidates prepare for
              friendly interviewers. The ones who fail are caught off-guard by
              skeptics and devil's advocates. This drill makes hostile
              follow-ups feel routine.
            </p>
          </div>

          {/* Setup phase */}
          {phase === "setup" && (
            <div className="space-y-4">
              {/* Persona selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Choose Interviewer Persona
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {PERSONAS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPersona(p)}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${selectedPersona.id === p.id ? `${p.bgColor} ${p.borderColor} border` : "bg-white/5 border-white/10 hover:bg-white/10"}`}
                    >
                      <span className="text-xl shrink-0">{p.icon}</span>
                      <div>
                        <div
                          className={`text-xs font-bold ${selectedPersona.id === p.id ? p.color : "text-foreground"}`}
                        >
                          {p.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {p.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Behavioral Question
                </label>
                <select
                  value={selectedQId}
                  onChange={e => setSelectedQId(e.target.value)}
                  className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground"
                >
                  {BEHAVIORAL_QUESTIONS.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.q.slice(0, 80)}
                      {q.q.length > 80 ? "…" : ""}
                    </option>
                  ))}
                </select>
                {selectedQ && (
                  <p className="text-xs text-muted-foreground p-2 rounded-lg bg-white/5 border border-white/10">
                    {selectedQ.q}
                  </p>
                )}
              </div>

              {/* Initial answer */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Your Initial Answer (STAR format)
                </label>
                <textarea
                  value={initialAnswer}
                  onChange={e => setInitialAnswer(e.target.value)}
                  rows={6}
                  placeholder="Write your STAR answer here — Situation, Task, Action, Result..."
                  className="w-full text-xs rounded-lg bg-background border border-border px-3 py-2 text-foreground resize-none"
                />
              </div>

              <button
                onClick={handleStart}
                disabled={startMutation.isPending || !initialAnswer.trim()}
                className="w-full py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-sm font-bold transition-all"
              >
                {startMutation.isPending
                  ? "Generating challenges…"
                  : `Face ${selectedPersona.name} →`}
              </button>
            </div>
          )}

          {/* Challenges phase */}
          {(phase === "challenges" || phase === "done") && (
            <div className="space-y-4">
              {/* Persona badge */}
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${selectedPersona.bgColor} border ${selectedPersona.borderColor}`}
              >
                <span>{selectedPersona.icon}</span>
                <span className={`text-xs font-bold ${selectedPersona.color}`}>
                  {selectedPersona.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  — {selectedPersona.description}
                </span>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {exchanges.length}/{challenges.length} challenges completed
                </span>
                {avgScore !== null && (
                  <span
                    className={`font-bold ${avgScore >= 4 ? "text-emerald-400" : avgScore >= 3 ? "text-amber-400" : "text-red-400"}`}
                  >
                    Avg: {avgScore.toFixed(1)}/5
                  </span>
                )}
              </div>

              {/* Completed exchanges */}
              {exchanges.map((ex, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0">
                      {selectedPersona.icon}
                    </span>
                    <p className="text-xs font-semibold text-foreground">
                      "{ex.challenge}"
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <MessageSquare
                      size={12}
                      className="text-muted-foreground shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-foreground/70">{ex.response}</p>
                  </div>
                  {ex.score !== undefined && (
                    <div className="flex items-center justify-between pt-1 border-t border-white/5">
                      <p className="text-xs text-muted-foreground">
                        {ex.feedback}
                      </p>
                      <span
                        className={`text-xs font-bold shrink-0 ml-2 ${ex.score >= 4 ? "text-emerald-400" : ex.score >= 3 ? "text-amber-400" : "text-red-400"}`}
                      >
                        {ex.score}/5
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Current challenge */}
              {phase === "challenges" && challenges[currentChallengeIdx] && (
                <div className="space-y-3 rounded-xl border-2 border-orange-500/40 p-4 bg-orange-950/20">
                  <div className="flex items-start gap-2">
                    <span className="text-lg shrink-0">
                      {selectedPersona.icon}
                    </span>
                    <p className="text-sm font-bold text-foreground">
                      "{challenges[currentChallengeIdx]}"
                    </p>
                  </div>
                  <textarea
                    value={responseInput}
                    onChange={e => setResponseInput(e.target.value)}
                    rows={4}
                    placeholder="Respond to this challenge..."
                    className="w-full text-xs rounded-lg bg-background/50 border border-orange-500/40 px-3 py-2 text-foreground resize-none"
                    autoFocus
                  />
                  <button
                    onClick={handleRespond}
                    disabled={
                      respondMutation.isPending || !responseInput.trim()
                    }
                    className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white text-xs font-bold transition-all"
                  >
                    {respondMutation.isPending
                      ? "Scoring…"
                      : "Submit Response →"}
                  </button>
                </div>
              )}

              {/* Final score */}
              {phase === "done" && finalScore && (
                <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                  <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                    Final Verdict
                  </div>
                  <Streamdown>{finalScore}</Streamdown>
                </div>
              )}

              {/* Reset */}
              <button
                onClick={reset}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={12} />
                Try a different persona or question
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
