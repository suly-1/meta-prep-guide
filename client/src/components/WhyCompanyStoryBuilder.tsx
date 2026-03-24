/**
 * "Why This Company" Story Builder
 * 5 questions → 90-second genuine Why Meta narrative.
 * Closes the culture-fit signal gap that costs ~10% of candidates their offer.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
} from "lucide-react";

interface WhyStoryResult {
  story: string;
  keyThemes: string[];
  whatToAvoid: string[];
  followUpPrep: string;
}

export function WhyCompanyStoryBuilder() {
  const [expanded, setExpanded] = useState(false);
  const [targetLevel, setTargetLevel] = useState("L6");
  const [targetTeam, setTargetTeam] = useState("");
  const [motivations, setMotivations] = useState("");
  const [relevantExperience, setRelevantExperience] = useState("");
  const [specificProducts, setSpecificProducts] = useState("");
  const [result, setResult] = useState<WhyStoryResult | null>(null);
  const [copied, setCopied] = useState(false);

  const buildMutation = trpc.ai.buildWhyCompanyStory.useMutation({
    onSuccess: data => {
      try {
        const parsed = JSON.parse(data.content) as WhyStoryResult;
        setResult(parsed);
      } catch {
        toast.error("Failed to parse result");
      }
    },
    onError: () => toast.error("Generation failed — please try again"),
  });

  const handleSubmit = () => {
    if (
      motivations.trim().length < 50 ||
      relevantExperience.trim().length < 50
    ) {
      toast.error(
        "Please fill in your motivations and relevant experience (at least 50 chars each)"
      );
      return;
    }
    setResult(null);
    buildMutation.mutate({
      targetCompany: "Meta",
      targetTeam: targetTeam || undefined,
      targetLevel,
      motivations,
      relevantExperience,
      specificProducts: specificProducts || undefined,
    });
  };

  const handleCopy = () => {
    if (result?.story) {
      navigator.clipboard.writeText(result.story);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-rose-500/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
            <Heart size={16} className="text-rose-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm text-foreground">
              "Why Meta" Story Builder
            </div>
            <div className="text-xs text-muted-foreground">
              Build a genuine 90-second narrative. Generic answers kill
              culture-fit scores.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-medium">
            Culture Signal
          </span>
          {expanded ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-rose-500/20">
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
            Meta interviewers score "Operating at Meta" as a real signal.
            Generic answers like "I love the scale" or "Meta's mission is
            inspiring" are red flags. This tool builds a specific, authentic
            narrative from your actual motivations.
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground font-medium block mb-1">
                Target Level
              </label>
              <select
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500/50"
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
                Target Team (optional)
              </label>
              <input
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                placeholder="e.g. Ads Infrastructure, Integrity, AR/VR"
                value={targetTeam}
                onChange={e => setTargetTeam(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              Why do you actually want to work at Meta? (be honest and specific)
            </label>
            <textarea
              className="w-full h-24 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-rose-500/50"
              placeholder="e.g. 'I've been building distributed systems for 8 years and Meta's infrastructure problems — serving 3B users with sub-100ms latency — are genuinely unsolved at that scale. I want to work on problems where the engineering constraints are the frontier...'"
              value={motivations}
              onChange={e => setMotivations(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              What relevant experience do you bring?
            </label>
            <textarea
              className="w-full h-20 bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-rose-500/50"
              placeholder="e.g. '5 years at Google Ads, built bidding systems handling 10M QPS, led a team of 8 engineers...'"
              value={relevantExperience}
              onChange={e => setRelevantExperience(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-medium block mb-1">
              Specific Meta products or engineering challenges you care about
              (optional)
            </label>
            <input
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500/50"
              placeholder="e.g. Horizon Worlds rendering pipeline, Integrity ML systems, Ads auction design"
              value={specificProducts}
              onChange={e => setSpecificProducts(e.target.value)}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={
              buildMutation.isPending ||
              motivations.length < 50 ||
              relevantExperience.length < 50
            }
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {buildMutation.isPending ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Heart size={14} />
            )}
            {buildMutation.isPending
              ? "Building your story..."
              : "Build My Why Meta Story"}
          </button>

          {result && (
            <div className="space-y-4 pt-2">
              {/* The story */}
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-rose-300">
                    Your 90-Second "Why Meta" Story
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-rose-300 transition-colors"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {result.story}
                </p>
              </div>

              {/* Key themes */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-xs font-semibold text-emerald-400 mb-2">
                  What Makes This Authentic
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.keyThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* What to avoid */}
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Phrases to Avoid (Generic Red Flags)
                </div>
                <ul className="space-y-1">
                  {result.whatToAvoid.map((phrase, i) => (
                    <li key={i} className="text-xs text-red-300">
                      ✗ "{phrase}"
                    </li>
                  ))}
                </ul>
              </div>

              {/* Follow-up prep */}
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs font-semibold text-blue-400 mb-1">
                  How to Handle "Tell Me More"
                </div>
                <p className="text-xs text-blue-200">{result.followUpPrep}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
