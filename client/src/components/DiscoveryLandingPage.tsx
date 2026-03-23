/**
 * DiscoveryLandingPage — shown on first visit (or via /about route)
 * Clearly frames the site as a public, community-created resource
 * that candidates discover independently — not distributed by interviewers.
 */
import { useState } from "react";
import { Search, Globe, Users, ShieldCheck, X } from "lucide-react";

interface DiscoveryLandingPageProps {
  onEnter: () => void;
}

export default function DiscoveryLandingPage({
  onEnter,
}: DiscoveryLandingPageProps) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <Globe size={28} className="text-blue-400" />
          </div>
          <h1
            className="text-2xl font-extrabold text-foreground mb-2"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Engineering Interview Prep
          </h1>
          <p className="text-sm text-muted-foreground">
            L4 · L5 · L6 · L7 — FAANG Interview Study Guide
          </p>
        </div>

        {/* Community resource proof points */}
        <div className="space-y-3 mb-6">
          <div className="prep-card p-4 flex items-start gap-3">
            <Globe size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">
                Publicly available community resource
              </p>
              <p className="text-xs text-muted-foreground">
                This guide is openly accessible at{" "}
                <span className="text-blue-400">www.metaguide.blog</span> and
                discoverable via any search engine. It is not distributed
                privately by any company or interviewer.
              </p>
            </div>
          </div>

          <div className="prep-card p-4 flex items-start gap-3">
            <Search size={16} className="text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">
                Independently discoverable
              </p>
              <p className="text-xs text-muted-foreground">
                You can find this guide by searching "FAANG L6 interview prep",
                "Staff Engineer interview guide", or similar terms. It is not
                affiliated with any company's official recruitment process.
              </p>
            </div>
          </div>

          <div className="prep-card p-4 flex items-start gap-3">
            <Users size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground mb-0.5">
                Not affiliated with Meta or any FAANG company
              </p>
              <p className="text-xs text-muted-foreground">
                This is an independent study resource. It is not endorsed by,
                affiliated with, or approved by Meta Platforms, Google, Amazon,
                Apple, Netflix, or any other company. Interview formats may
                change — always verify with any official guidance you receive.
              </p>
            </div>
          </div>
        </div>

        {/* Job seeker confirmation gate */}
        <div className="prep-card p-4 mb-4 border-blue-500/30 bg-blue-500/5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-blue-500 w-4 h-4 shrink-0"
            />
            <span className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">
                I confirm that I am a job seeker
              </span>{" "}
              using this resource for my own interview preparation. I
              independently discovered this public resource and it was not
              provided to me by any interviewer or company as part of any
              official process.
            </span>
          </label>
        </div>

        {/* Enter button */}
        <button
          onClick={() => {
            if (confirmed) onEnter();
          }}
          disabled={!confirmed}
          className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
            confirmed
              ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
              : "bg-secondary text-muted-foreground cursor-not-allowed"
          }`}
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {confirmed
            ? "Enter Study Guide →"
            : "Please confirm above to continue"}
        </button>

        <p className="text-center text-[10px] text-muted-foreground mt-4">
          Your confirmation is stored locally in your browser. You won't see
          this screen again on this device.
        </p>
      </div>
    </div>
  );
}

/**
 * Inline disclaimer banner — shown persistently at the top of every page
 * after the user has passed the landing gate.
 */
export function DisclaimerBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-blue-500/8 border-b border-blue-500/20 px-4 py-2">
      <div className="container flex items-start gap-3">
        <ShieldCheck size={13} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="flex-1 text-[11px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-blue-400">
            Independent Community Resource:{" "}
          </span>
          This guide is publicly available at{" "}
          <span className="text-blue-400">www.metaguide.blog</span> and is not
          affiliated with Meta, Google, or any FAANG company. It was not
          provided by any interviewer. Always refer to official materials from
          official sources.
        </p>
        <button
          onClick={onDismiss}
          className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
