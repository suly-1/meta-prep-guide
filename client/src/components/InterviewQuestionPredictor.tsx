/**
 * Interview Question Prediction Engine
 * Based on target team + level, predicts the most likely questions.
 * Helps candidates focus prep on what they'll actually be asked.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Crosshair,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Server,
  Brain,
  Code2,
  Lightbulb,
} from "lucide-react";

interface PredictionResult {
  systemDesign: string[];
  behavioralFocusAreas: Array<{ area: string; questions: string[] }>;
  codingPatterns: Array<{ pattern: string; examples: string[] }>;
  teamInsight: string;
}

const META_TEAMS = [
  "Ads Infrastructure",
  "Ads Ranking & Targeting",
  "Integrity & Safety",
  "Infrastructure & Reliability",
  "WhatsApp",
  "Instagram",
  "Reality Labs / AR/VR",
  "Messenger",
  "Core ML Platform",
  "Data Infrastructure",
  "Privacy Engineering",
  "Developer Platform",
  "Commerce",
  "Video & Live",
  "Search",
  "Growth",
];

export function InterviewQuestionPredictor() {
  const [expanded, setExpanded] = useState(false);
  const [targetTeam, setTargetTeam] = useState("");
  const [customTeam, setCustomTeam] = useState("");
  const [targetLevel, setTargetLevel] = useState("L6");
  const [interviewType, setInterviewType] = useState<
    "coding" | "system_design" | "behavioral" | "all"
  >("all");
  const [result, setResult] = useState<PredictionResult | null>(null);

  const predictMutation = trpc.ai.predictInterviewQuestions.useMutation({
    onSuccess: data => {
      try {
        const parsed = JSON.parse(data.content) as PredictionResult;
        setResult(parsed);
      } catch {
        toast.error("Failed to parse prediction");
      }
    },
    onError: () => toast.error("Prediction failed — please try again"),
  });

  const handleSubmit = () => {
    const team = customTeam.trim() || targetTeam;
    if (!team) {
      toast.error("Please select or enter your target team");
      return;
    }
    setResult(null);
    predictMutation.mutate({ targetTeam: team, targetLevel, interviewType });
  };

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-cyan-500/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Crosshair size={16} className="text-cyan-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">
              Interview Question Predictor
            </div>
            <div className="text-xs text-muted-foreground">
              Know what your specific team will ask before you walk in.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-medium">
            Team-Specific
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-cyan-500/20">
          <div className="mt-4 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300">
            Different Meta teams ask very different questions. Ads teams focus
            on auction systems and ranking. Integrity teams ask about content
            moderation at scale. Infrastructure teams probe distributed
            consensus and storage. This tool predicts what YOUR team asks.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Target Team
              </label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                value={targetTeam}
                onChange={e => {
                  setTargetTeam(e.target.value);
                  setCustomTeam("");
                }}
              >
                <option value="">Select a team...</option>
                {META_TEAMS.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Or Enter Custom Team
              </label>
              <input
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                placeholder="e.g. Feed Ranking"
                value={customTeam}
                onChange={e => {
                  setCustomTeam(e.target.value);
                  setTargetTeam("");
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Target Level
              </label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                value={targetLevel}
                onChange={e => setTargetLevel(e.target.value)}
              >
                {["L4", "L5", "L6", "L7"].map(l => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Focus Area
              </label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                value={interviewType}
                onChange={e =>
                  setInterviewType(
                    e.target.value as
                      | "coding"
                      | "system_design"
                      | "behavioral"
                      | "all"
                  )
                }
              >
                <option value="all">All Rounds</option>
                <option value="coding">Coding Only</option>
                <option value="system_design">System Design Only</option>
                <option value="behavioral">Behavioral Only</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              predictMutation.isPending || (!targetTeam && !customTeam.trim())
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {predictMutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Crosshair size={14} />
            )}
            {predictMutation.isPending
              ? "Predicting..."
              : "Predict My Questions"}
          </button>

          {result && (
            <div className="space-y-4 pt-2">
              {/* Team insight */}
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-xs font-semibold text-cyan-400 mb-1 flex items-center gap-1">
                  <Lightbulb size={12} />
                  Team Insight
                </div>
                <p className="text-xs text-cyan-200">{result.teamInsight}</p>
              </div>

              {/* System Design */}
              {result.systemDesign.length > 0 && (
                <div className="p-4 rounded-xl border border-border bg-secondary/20">
                  <div className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Server size={13} className="text-blue-400" />
                    Top System Design Questions
                  </div>
                  <ol className="space-y-2">
                    {result.systemDesign.map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-xs text-muted-foreground font-mono mt-0.5 shrink-0">
                          {i + 1}.
                        </span>
                        <span className="text-foreground">{q}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Behavioral */}
              {result.behavioralFocusAreas.length > 0 && (
                <div className="p-4 rounded-xl border border-border bg-secondary/20">
                  <div className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Brain size={13} className="text-purple-400" />
                    Behavioral Focus Areas
                  </div>
                  <div className="space-y-3">
                    {result.behavioralFocusAreas.map((area, i) => (
                      <div key={i}>
                        <div className="text-xs font-semibold text-purple-300 mb-1">
                          {area.area}
                        </div>
                        <ul className="space-y-1">
                          {area.questions.map((q, j) => (
                            <li
                              key={j}
                              className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-purple-500 shrink-0">
                                ›
                              </span>
                              {q}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coding patterns */}
              {result.codingPatterns.length > 0 && (
                <div className="p-4 rounded-xl border border-border bg-secondary/20">
                  <div className="text-xs font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Code2 size={13} className="text-emerald-400" />
                    Likely Coding Patterns
                  </div>
                  <div className="space-y-3">
                    {result.codingPatterns.map((pat, i) => (
                      <div key={i}>
                        <div className="text-xs font-semibold text-emerald-300 mb-1">
                          {pat.pattern}
                        </div>
                        <ul className="space-y-1">
                          {pat.examples.map((ex, j) => (
                            <li
                              key={j}
                              className="text-xs text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-emerald-500 shrink-0">
                                ›
                              </span>
                              {ex}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
