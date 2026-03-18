// Design: Bold Engineering Dashboard — Onboarding Modal
import { useState } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";

const STEPS = [
  { title: "Welcome to Meta Prep", body: "This guide covers everything you need for Meta IC6 (Staff) and IC7 (Senior Staff) interviews: Coding, System Design, and Behavioral rounds.", icon: "🎯" },
  { title: "Coding Tab", body: "20 patterns with quick drills, spaced repetition, a mock interview timer, and Anki export. Use the Weak Spots filter to focus on patterns you've rated ★1–2.", icon: "💻" },
  { title: "Behavioral Tab", body: "28 questions across 7 focus areas. Practice Mode gives you a 3-minute timer per question. Full Mock simulates a real 4-question behavioral interview.", icon: "🧠" },
  { title: "Overview Tab", body: "Track your overall readiness, set your interview date, manage your STAR story bank, and print a recruiter-ready summary card.", icon: "📊" },
  { title: "Keyboard Shortcuts", body: "Press 1–4 to switch tabs. Space to start/pause the timer. R to reveal a drill answer. Your progress is auto-saved to localStorage — no account needed.", icon: "⌨️" },
];

interface Props { onDismiss: () => void; }

export default function OnboardingModal({ onDismiss }: Props) {
  const [step, setStep] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="prep-card w-full max-w-md p-6 relative">
        <button onClick={onDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
        {/* Progress dots */}
        <div className="flex gap-1.5 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-blue-500" : "bg-secondary"}`} />
          ))}
        </div>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{STEPS[step].icon}</div>
          <h2 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {STEPS[step].title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{STEPS[step].body}</p>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-sm text-muted-foreground disabled:opacity-30 transition-all">
            <ChevronLeft size={13} /> Back
          </button>
          <span className="text-xs text-muted-foreground">{step + 1}/{STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all">
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <button onClick={onDismiss}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all">
              Let's go! <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
