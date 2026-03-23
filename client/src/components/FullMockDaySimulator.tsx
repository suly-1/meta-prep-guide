/**
 * Full Mock Day Simulator
 * Chains: Coding (45 min) → System Design (45 min) → XFN Behavioral (45 min) → Behavioral STAR (30 min)
 * Ends with a combined AI scorecard (hiring recommendation + IC level verdict + 2-week remediation plan)
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import {
  PATTERNS,
  BEHAVIORAL_QUESTIONS,
  SYSTEM_DESIGN_QUESTIONS,
} from "@/lib/data";
import { toast } from "sonner";
import {
  Play,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trophy,
  RotateCcw,
  Loader2,
  Calendar,
} from "lucide-react";
import Editor from "@monaco-editor/react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Round = "coding" | "sysdesign" | "xfn" | "behavioral";
type Phase = "idle" | "running" | "between" | "scoring" | "done";

interface RoundResult {
  round: Round;
  overallScore: number;
  level: string;
  label: string;
}

interface FullScorecard {
  overallScore: number;
  levelVerdict: string;
  hiringRecommendation: string;
  codingCoaching: string;
  sysDesignCoaching: string;
  xfnCoaching: string;
  behavioralCoaching?: string;
  topStrengths: string[];
  topImprovements: string[];
  summary: string;
  remediationPlan?: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const XFN_QUESTIONS = BEHAVIORAL_QUESTIONS.filter(
  q => q.area === "XFN Partnership"
);
const BEHAVIORAL_ONLY_QUESTIONS = BEHAVIORAL_QUESTIONS.filter(
  q => q.area !== "XFN Partnership"
);
const SD_QUESTIONS = SYSTEM_DESIGN_QUESTIONS;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Timer ring ───────────────────────────────────────────────────────────────
function TimerRing({
  seconds,
  total,
  color,
}: {
  seconds: number;
  total: number;
  color: string;
}) {
  const pct = seconds / total;
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width={100} height={100} className="rotate-[-90deg]">
      <circle
        cx={50}
        cy={50}
        r={r}
        fill="none"
        stroke="#1e293b"
        strokeWidth={8}
      />
      <circle
        cx={50}
        cy={50}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 1s linear" }}
      />
      <text
        x={50}
        y={54}
        textAnchor="middle"
        className="rotate-90"
        style={{
          transform: "rotate(90deg) translate(0px, -100px)",
          fill: color,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "monospace",
        }}
      >
        {fmtTime(seconds)}
      </text>
    </svg>
  );
}

// ─── Single round mini-session ────────────────────────────────────────────────
interface MiniRoundProps {
  round: Round;
  question: string;
  durationSec: number;
  onComplete: (answer: string) => void;
}

function MiniRound({
  round,
  question,
  durationSec,
  onComplete,
}: MiniRoundProps) {
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [answer, setAnswer] = useState("");
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          setRunning(false);
          toast.info("⏰ Time's up for this round!");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    []
  );

  const ringColor =
    timeLeft > durationSec * 0.33
      ? "#8b5cf6"
      : timeLeft > 60
        ? "#f59e0b"
        : "#ef4444";

  const labels: Record<Round, string> = {
    coding: "💻 Coding Round",
    sysdesign: "🏗️ System Design Round",
    xfn: "🤝 XFN Behavioral Round",
    behavioral: "🎯 Behavioral STAR Round",
  };

  const hints: Record<Round, string[]> = {
    coding: [
      "Clarify constraints & examples",
      "State your approach before coding",
      "Analyze time & space complexity",
      "Handle edge cases",
    ],
    sysdesign: [
      "Gather requirements (functional + non-functional)",
      "Estimate capacity (QPS, storage)",
      "Draw HLD: components + data flow",
      "Deep dive on bottlenecks + trade-offs",
    ],
    xfn: [
      "Set the Situation clearly",
      "Describe the Task/conflict",
      "Walk through your Actions step by step",
      "Quantify the Result + lessons learned",
    ],
    behavioral: [
      "Open with a crisp Situation (1-2 sentences)",
      "State your specific Task/ownership",
      "Detail 3+ concrete Actions you took",
      "Quantify the Result — numbers matter at L7",
    ],
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex items-center justify-center">
          <TimerRing seconds={timeLeft} total={durationSec} color={ringColor} />
          <span
            className="absolute text-xs font-mono"
            style={{ color: ringColor }}
          >
            {fmtTime(timeLeft)}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-purple-400 mb-1">
            {labels[round]}
          </div>
          <div className="text-sm font-semibold text-foreground leading-snug">
            {question}
          </div>
        </div>
        {!running && timeLeft === durationSec && (
          <button
            onClick={start}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
          >
            <Play size={12} /> Start
          </button>
        )}
      </div>

      {/* Hints */}
      <div className="grid grid-cols-2 gap-1.5">
        {hints[round].map((h, i) => (
          <div
            key={i}
            className="text-xs px-2.5 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300"
          >
            {i + 1}. {h}
          </div>
        ))}
      </div>

      {/* Answer area */}
      {round === "coding" ? (
        <div className="rounded-lg overflow-hidden border border-border">
          <Editor
            height="220px"
            defaultLanguage="python"
            theme="vs-dark"
            value={answer}
            onChange={v => setAnswer(v ?? "")}
            options={{
              fontSize: 13,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>
      ) : (
        <textarea
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder={
            round === "sysdesign"
              ? "Describe your architecture, components, data flow, trade-offs…"
              : round === "behavioral"
                ? "Walk through your STAR story with specific details, numbers, and impact…"
                : "Walk through your STAR story about cross-functional collaboration…"
          }
          className="w-full h-36 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-purple-500"
        />
      )}

      <button
        onClick={() => onComplete(answer)}
        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
      >
        <ChevronRight size={14} /> Submit & Continue
      </button>
    </div>
  );
}

// ─── Remediation Plan section ─────────────────────────────────────────────────
function RemediationPlan({ plan }: { plan: string[] }) {
  const [open, setOpen] = useState(false);
  if (!plan || plan.length === 0) return null;
  return (
    <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-blue-400" />
          <span className="text-xs font-bold text-blue-300">
            2-Week Remediation Plan
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {plan.map((item, i) => (
            <div key={i} className="flex gap-3 text-xs">
              <span className="shrink-0 w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              <span className="text-muted-foreground leading-relaxed">
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
const ROUNDS: Round[] = ["coding", "sysdesign", "xfn", "behavioral"];
const ROUND_DURATIONS: Record<Round, number> = {
  coding: 45 * 60,
  sysdesign: 45 * 60,
  xfn: 45 * 60,
  behavioral: 30 * 60,
};

const FULL_MOCK_HISTORY_KEY = "full_mock_day_history_v1";

function loadFullMockHistory(): Array<{
  date: string;
  overallScore: number;
  levelVerdict: string;
  hiringRecommendation: string;
}> {
  try {
    return JSON.parse(localStorage.getItem(FULL_MOCK_HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function FullMockDaySimulator() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [roundIndex, setRoundIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<Round, string>>({
    coding: "",
    sysdesign: "",
    xfn: "",
    behavioral: "",
  });
  const [questions, setQuestions] = useState<Record<Round, string>>({
    coding: "",
    sysdesign: "",
    xfn: "",
    behavioral: "",
  });
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [scorecard, setScorecard] = useState<FullScorecard | null>(null);
  const [expanded, setExpanded] = useState(false);
  const lastMock = (() => {
    const h = loadFullMockHistory();
    return h.length ? h[h.length - 1] : null;
  })();

  const codingScoreMutation = trpc.ai.codingMockScorecard.useMutation();
  const sysDesignScoreMutation = trpc.ai.sysDesignMockScorecard.useMutation();
  const xfnScoreMutation = trpc.ai.xfnMockScorecard.useMutation();
  const fullScorecardMutation = trpc.ai.fullMockDayScorecard.useMutation();

  const startDay = useCallback(() => {
    const codingPattern = pick(PATTERNS);
    const sdQ = pick(
      SD_QUESTIONS as unknown as { title: string; desc?: string }[]
    );
    const xfnQ =
      XFN_QUESTIONS.length > 0 ? pick(XFN_QUESTIONS) : BEHAVIORAL_QUESTIONS[0];
    const bqQ =
      BEHAVIORAL_ONLY_QUESTIONS.length > 0
        ? pick(BEHAVIORAL_ONLY_QUESTIONS)
        : BEHAVIORAL_QUESTIONS[0];
    setQuestions({
      coding: `${codingPattern.name}: ${codingPattern.desc ?? "Solve a representative problem for this pattern."}`,
      sysdesign: `${sdQ.title}: ${sdQ.desc ?? "Design this system end-to-end."}`,
      xfn: xfnQ.q,
      behavioral: bqQ.q,
    });
    setAnswers({ coding: "", sysdesign: "", xfn: "", behavioral: "" });
    setRoundResults([]);
    setScorecard(null);
    setRoundIndex(0);
    setPhase("running");
  }, []);

  const handleRoundComplete = useCallback(
    async (answer: string) => {
      const round = ROUNDS[roundIndex];
      setAnswers(prev => ({ ...prev, [round]: answer }));

      let result: RoundResult;
      try {
        if (round === "coding") {
          const pattern =
            PATTERNS.find(p => questions.coding.startsWith(p.name)) ??
            PATTERNS[0];
          const res = await codingScoreMutation.mutateAsync({
            patternName: pattern.name,
            problemTitle: pattern.examples?.[0] ?? pattern.name,
            difficulty: pattern.diff,
            approach: answer.slice(0, 600),
            pseudocode: answer.slice(600, 1800),
            complexity: answer.slice(1800, 2200),
            edgeCases: answer.slice(2200, 2600),
            followUp: answer.slice(2600),
          });
          result = {
            round,
            overallScore: res.overallScore,
            level: res.level,
            label: pattern.name,
          };
        } else if (round === "sysdesign") {
          const sdQ = SD_QUESTIONS[0] as unknown as {
            title: string;
            level: string;
            tags: string[];
          };
          const matchedQ =
            (
              SD_QUESTIONS as unknown as {
                title: string;
                level: string;
                tags: string[];
              }[]
            ).find(q => questions.sysdesign.startsWith(q.title)) ?? sdQ;
          const res = await sysDesignScoreMutation.mutateAsync({
            questionTitle: matchedQ.title,
            level: matchedQ.level ?? "L6",
            tags: matchedQ.tags ?? [],
            phases: [
              { phase: "Requirements", answer: answer.slice(0, 400) },
              { phase: "Capacity Estimation", answer: answer.slice(400, 700) },
              { phase: "HLD", answer: answer.slice(700, 1400) },
              { phase: "API Design", answer: answer.slice(1400, 1800) },
              { phase: "Deep Dive", answer: answer.slice(1800, 2200) },
              { phase: "Trade-offs", answer: answer.slice(2200) },
            ],
          });
          result = {
            round,
            overallScore: res.overallScore,
            level: res.level,
            label: matchedQ.title,
          };
        } else {
          // xfn and behavioral both use xfnMockScorecard
          const q = round === "xfn" ? questions.xfn : questions.behavioral;
          const res = await xfnScoreMutation.mutateAsync({
            rounds: [{ question: q, answer }],
          });
          const label = round === "xfn" ? "XFN Partnership" : "Behavioral STAR";
          result = {
            round,
            overallScore: res.overallScore,
            level: res.level,
            label,
          };
        }
      } catch {
        result = { round, overallScore: 3, level: "L6", label: round };
      }

      const newResults = [...roundResults, result];
      setRoundResults(newResults);

      if (roundIndex < ROUNDS.length - 1) {
        setRoundIndex(i => i + 1);
        setPhase("between");
        setTimeout(() => setPhase("running"), 200);
      } else {
        setPhase("scoring");
        try {
          const codingR = newResults.find(r => r.round === "coding")!;
          const sdR = newResults.find(r => r.round === "sysdesign")!;
          const xfnR = newResults.find(r => r.round === "xfn")!;
          const bqR = newResults.find(r => r.round === "behavioral");
          const sc = await fullScorecardMutation.mutateAsync({
            codingScore: codingR.overallScore,
            codingIcLevel: codingR.level,
            codingPattern: codingR.label,
            sysDesignScore: sdR.overallScore,
            sysDesignIcLevel: sdR.level,
            sysDesignQuestion: sdR.label,
            xfnScore: xfnR.overallScore,
            xfnIcLevel: xfnR.level,
            behavioralScore: bqR?.overallScore ?? 3,
            behavioralIcLevel: bqR?.level ?? "L6",
          });
          setScorecard(sc);
          try {
            const history = loadFullMockHistory();
            history.push({
              date: new Date().toISOString().split("T")[0],
              overallScore: sc.overallScore,
              levelVerdict: sc.levelVerdict,
              hiringRecommendation: sc.hiringRecommendation,
            });
            localStorage.setItem(
              FULL_MOCK_HISTORY_KEY,
              JSON.stringify(history.slice(-20))
            );
          } catch {
            /* ignore */
          }
        } catch {
          toast.error(
            "Could not generate final scorecard. Showing round scores only."
          );
        }
        setPhase("done");
      }
    },
    [
      roundIndex,
      roundResults,
      questions,
      codingScoreMutation,
      sysDesignScoreMutation,
      xfnScoreMutation,
      fullScorecardMutation,
    ]
  );

  const recColor = (rec: string) => {
    if (rec.includes("Strong")) return "text-emerald-400";
    if (rec.includes("Hire")) return "text-blue-400";
    if (rec.includes("Borderline")) return "text-amber-400";
    return "text-red-400";
  };

  const roundLabel: Record<Round, string> = {
    coding: "💻 Coding",
    sysdesign: "🏗️ System Design",
    xfn: "🤝 XFN Behavioral",
    behavioral: "🎯 Behavioral STAR",
  };

  const roundEmoji: Record<Round, string> = {
    coding: "💻",
    sysdesign: "🏗️",
    xfn: "🤝",
    behavioral: "🎯",
  };

  return (
    <div className="rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 via-slate-900/60 to-blue-950/40 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-yellow-400" />
          <div className="text-left">
            <div className="text-sm font-bold text-foreground">
              Full Mock Day Simulator
            </div>
            <div className="text-xs text-muted-foreground">
              Coding → System Design → XFN → Behavioral · ~3 hours · AI
              composite scorecard + 2-week plan
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {lastMock && phase === "idle" && (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-600/50 text-slate-300 font-medium whitespace-nowrap">
              Last mock: {lastMock.date.slice(5).replace("-", "/")} ·{" "}
              {lastMock.overallScore.toFixed(1)}/5 {lastMock.levelVerdict}
            </span>
          )}
          {phase === "done" && scorecard && (
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-600 ${recColor(scorecard.hiringRecommendation)}`}
            >
              {scorecard.hiringRecommendation}
            </span>
          )}
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-purple-500/20">
          {/* Idle state */}
          {phase === "idle" && (
            <div className="pt-4 space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {ROUNDS.map((r, i) => (
                  <div
                    key={r}
                    className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 text-center"
                  >
                    <div className="text-lg mb-1">{roundEmoji[r]}</div>
                    <div className="text-xs font-bold text-foreground">
                      {roundLabel[r].replace(/^[^\s]+ /, "")}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {r === "behavioral" ? "30 min" : "45 min"}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Simulates a full FAANG-style interview loop. Each round is
                independently scored, then the AI generates a composite L6/L7
                promotion decision and a personalised 2-week remediation plan.
              </p>
              <button
                onClick={startDay}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                <Play size={14} /> Start Full Mock Day (~3 hours)
              </button>
            </div>
          )}

          {/* Running state */}
          {(phase === "running" || phase === "between") && (
            <div className="pt-4 space-y-4">
              {/* Round progress bar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {ROUNDS.map((r, i) => (
                  <div key={r} className="flex items-center gap-1">
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-all ${
                        i < roundIndex
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : i === roundIndex
                            ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                            : "bg-slate-800/60 border-slate-700/50 text-muted-foreground"
                      }`}
                    >
                      {i < roundIndex ? "✓" : i + 1} {roundLabel[r]}
                    </div>
                    {i < ROUNDS.length - 1 && (
                      <ChevronRight
                        size={12}
                        className="text-muted-foreground"
                      />
                    )}
                  </div>
                ))}
              </div>

              <MiniRound
                round={ROUNDS[roundIndex]}
                question={questions[ROUNDS[roundIndex]]}
                durationSec={ROUND_DURATIONS[ROUNDS[roundIndex]]}
                onComplete={handleRoundComplete}
              />
            </div>
          )}

          {/* Scoring state */}
          {phase === "scoring" && (
            <div className="pt-8 flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-purple-400" />
              <div className="text-sm font-semibold text-foreground">
                Generating your full interview day scorecard…
              </div>
              <div className="text-xs text-muted-foreground">
                The AI is reviewing all 4 rounds and building your remediation
                plan
              </div>
            </div>
          )}

          {/* Done state */}
          {phase === "done" && (
            <div className="pt-4 space-y-4">
              {/* Round summary */}
              <div className="grid grid-cols-4 gap-2">
                {roundResults.map(r => (
                  <div
                    key={r.round}
                    className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-3 text-center"
                  >
                    <div className="text-lg mb-1">{roundEmoji[r.round]}</div>
                    <div className="text-xs text-muted-foreground mb-1 truncate">
                      {r.label}
                    </div>
                    <div className="text-lg font-bold text-foreground">
                      {r.overallScore.toFixed(1)}
                      <span className="text-xs text-muted-foreground">/5</span>
                    </div>
                    <div className="text-xs font-semibold text-purple-400">
                      {r.level}
                    </div>
                  </div>
                ))}
              </div>

              {/* Full scorecard */}
              {scorecard && (
                <div className="rounded-xl bg-slate-900/80 border border-purple-500/30 p-4 space-y-4">
                  {/* Verdict */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Overall Score
                      </div>
                      <div className="text-2xl font-bold text-foreground">
                        {scorecard.overallScore.toFixed(1)}
                        <span className="text-sm text-muted-foreground">
                          /5
                        </span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">
                        IC Level
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {scorecard.levelVerdict}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        Recommendation
                      </div>
                      <div
                        className={`text-base font-bold ${recColor(scorecard.hiringRecommendation)}`}
                      >
                        {scorecard.hiringRecommendation}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-muted-foreground leading-relaxed border-t border-slate-700/50 pt-3">
                    {scorecard.summary}
                  </p>

                  {/* Per-round coaching */}
                  <div className="space-y-2">
                    {[
                      { label: "💻 Coding", text: scorecard.codingCoaching },
                      {
                        label: "🏗️ System Design",
                        text: scorecard.sysDesignCoaching,
                      },
                      {
                        label: "🤝 XFN Behavioral",
                        text: scorecard.xfnCoaching,
                      },
                      ...(scorecard.behavioralCoaching
                        ? [
                            {
                              label: "🎯 Behavioral STAR",
                              text: scorecard.behavioralCoaching,
                            },
                          ]
                        : []),
                    ].map(({ label, text }) => (
                      <div
                        key={label}
                        className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-2.5"
                      >
                        <div className="text-xs font-bold text-foreground mb-0.5">
                          {label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strengths + Improvements */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 mb-1.5">
                        ✅ Top Strengths
                      </div>
                      <ul className="space-y-1">
                        {scorecard.topStrengths.map((s, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex gap-1.5"
                          >
                            <span className="text-emerald-400 shrink-0">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-400 mb-1.5">
                        🎯 Top Improvements
                      </div>
                      <ul className="space-y-1">
                        {scorecard.topImprovements.map((s, i) => (
                          <li
                            key={i}
                            className="text-xs text-muted-foreground flex gap-1.5"
                          >
                            <span className="text-amber-400 shrink-0">•</span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* 2-week remediation plan */}
              {scorecard?.remediationPlan &&
                scorecard.remediationPlan.length > 0 && (
                  <RemediationPlan plan={scorecard.remediationPlan} />
                )}

              <button
                onClick={() => {
                  setPhase("idle");
                  setRoundIndex(0);
                }}
                className="w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm font-semibold text-foreground transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw size={13} /> Start New Mock Day
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
