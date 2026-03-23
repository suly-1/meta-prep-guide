// CommunityBanner — Option A
// Dark charcoal (#111827) base, left-aligned copy, SVG mesh grid on the right.
// Features: dismissible (× button, state saved to localStorage), external link
// confirmation modal before navigating away.

import { useState } from "react";
import { X } from "lucide-react";

// ── SVG mesh grid ─────────────────────────────────────────────────────────────
function MeshGrid() {
  return (
    <svg
      viewBox="0 0 420 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full opacity-30"
      aria-hidden="true"
    >
      {[0, 56, 112, 168, 224, 280].map(y => (
        <line
          key={`h${y}`}
          x1="0"
          y1={y}
          x2="420"
          y2={y}
          stroke="#3b82f6"
          strokeWidth="0.5"
        />
      ))}
      {[0, 60, 120, 180, 240, 300, 360, 420].map(x => (
        <line
          key={`v${x}`}
          x1={x}
          y1="0"
          x2={x}
          y2="280"
          stroke="#3b82f6"
          strokeWidth="0.5"
        />
      ))}
      <line
        x1="180"
        y1="112"
        x2="300"
        y2="224"
        stroke="#3b82f6"
        strokeWidth="0.8"
        strokeDasharray="4 3"
      />
      <line
        x1="240"
        y1="56"
        x2="360"
        y2="168"
        stroke="#3b82f6"
        strokeWidth="0.8"
        strokeDasharray="4 3"
      />
      <line
        x1="120"
        y1="168"
        x2="240"
        y2="280"
        stroke="#3b82f6"
        strokeWidth="0.8"
        strokeDasharray="4 3"
      />
      {[
        [180, 112],
        [240, 112],
        [300, 112],
        [120, 168],
        [180, 168],
        [240, 168],
        [300, 168],
        [360, 168],
        [180, 224],
        [240, 224],
        [300, 224],
        [360, 224],
        [240, 56],
        [300, 56],
      ].map(([cx, cy]) => (
        <circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r="3"
          fill="#3b82f6"
          opacity="0.7"
        />
      ))}
      <circle cx="240" cy="168" r="5" fill="#3b82f6" opacity="0.9" />
      <circle cx="300" cy="112" r="4" fill="#60a5fa" opacity="0.8" />
      <polygon
        points="240,224 300,168 360,224"
        fill="none"
        stroke="#3b82f6"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  );
}

// ── Storage key ───────────────────────────────────────────────────────────────
const DISMISSED_KEY = "meta_community_banner_dismissed_v1";

// ── Main component ────────────────────────────────────────────────────────────
export default function CommunityBanner() {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      /* storage unavailable */
    }
  };

  if (dismissed) return null;

  return (
    <>
      <section
        className="relative overflow-hidden border-b border-border"
        style={{ background: "#111827" }}
        aria-label="About this resource"
      >
        {/* Radial glow */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2"
          style={{
            background:
              "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Dismiss banner"
          title="Dismiss — won't show again"
        >
          <X size={14} />
        </button>

        <div className="container relative flex items-stretch min-h-[260px] py-0">
          {/* ── Left: copy ──────────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col justify-center py-10 pr-8 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight mb-3">
              Everything the community learned the hard way — organized,
              refined, and ready for your{" "}
              <span className="text-white">2026 interviews.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-4">
              A community-sourced, independent study resource — not affiliated
              with Meta. Covers L4–L7 Behavioral &amp; Coding rounds, including
              the{" "}
              <span className="text-blue-400 font-medium">
                AI-Enabled Coding Round
              </span>
              .
            </p>

            <p className="text-sm text-amber-400 font-medium leading-snug mb-4">
              Always refer first to any official preparation materials you have
              received.
            </p>

            {/* Footer badges */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-400">
                No affiliation with Meta
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-400">
                Updated March 2026
              </span>
            </div>
          </div>

          {/* ── Right: mesh grid ─────────────────────────────────────────────── */}
          <div className="hidden md:flex items-center justify-end w-[380px] shrink-0 py-6">
            <MeshGrid />
          </div>
        </div>
      </section>
    </>
  );
}
