// Design: Bold Engineering Dashboard — Overview Tab
// Features: IC6/IC7 comparison cards, readiness dashboard, pattern heatmap,
// weak-spot dashboard, interview countdown, STAR story bank, recruiter card
// with peer comparison, progress export, interview day checklist
import { useState } from "react";
import { Calendar, Download, Printer, Target, Brain, TrendingUp, Flame, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { PATTERNS, BEHAVIORAL_QUESTIONS, STAR_STORIES, PREP_TIMELINE, INTERVIEW_DAY_CHECKLIST, RESOURCES, IC_COMPARISON, PEER_BENCHMARKS } from "@/lib/data";
import { usePatternRatings, useBehavioralRatings, useMockHistory, useInterviewDate, useStarNotes, useStreak } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ── IC6/IC7 Level Cards ────────────────────────────────────────────────────
function LevelCards() {
  return (
    <div className="space-y-4">
      <div className="section-title">IC6 vs IC7 — What Meta Expects</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* IC6 */}
        <div className="prep-card p-5 border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-blue text-sm px-3 py-1">IC6 — Staff Engineer</span>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ["Scope & Impact", "Leads major initiatives at team/org level. Defines technical direction for a domain."],
              ["Technical Leadership", "Designs systems used by 25–30+ engineers. Owns architecture decisions end-to-end."],
              ["Business & XFN", "Project-level cross-functional collaboration. Connects technical work to business outcomes."],
              ["Communication", "Clear and precise within team and org. Writes design docs that drive alignment."],
            ].map(([title, desc]) => (
              <div key={title}>
                <div className="text-xs font-semibold text-blue-400 mb-0.5">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>
        {/* IC7 */}
        <div className="prep-card p-5 border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="badge badge-purple text-sm px-3 py-1">IC7 — Senior Staff Engineer</span>
          </div>
          <div className="space-y-3 text-sm">
            {[
              ["Scope & Impact", "Leads portfolios of initiatives across multiple teams. Shapes org-level technical strategy."],
              ["Technical Leadership", "Influences 30–50+ engineers. Sets the technical bar for the entire org."],
              ["Business & XFN", "Long-term strategic partnerships with product, design, and business leadership."],
              ["Communication", "Communicates across disciplines and all levels. Drives industry-level conversations."],
            ].map(([title, desc]) => (
              <div key={title}>
                <div className="text-xs font-semibold text-purple-400 mb-0.5">{title}</div>
                <div className="text-xs text-muted-foreground">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Comparison table */}
      <div className="prep-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Dimension</th>
                <th className="text-left p-3 text-xs font-semibold text-blue-400">IC6</th>
                <th className="text-left p-3 text-xs font-semibold text-purple-400">IC7</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {IC_COMPARISON.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-secondary/20" : ""}>
                  <td className="p-3 text-xs font-semibold text-foreground">{row.dimension}</td>
                  <td className="p-3 text-xs text-muted-foreground">{row.ic6}</td>
                  <td className="p-3 text-xs text-muted-foreground">{row.ic7}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Readiness Dashboard ────────────────────────────────────────────────────
function ReadinessDashboard() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const streak = useStreak();

  const masteredPatterns = PATTERNS.filter(p => (patternRatings[p.id] ?? 0) >= 4).length;
  const readyStories = BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) >= 4).length;
  const avgMock = mockHistory.length
    ? mockHistory.reduce((s, m) => s + m.avgScore, 0) / mockHistory.length
    : 0;
  const overallPct = Math.round(
    ((masteredPatterns / PATTERNS.length) * 0.6 + (readyStories / BEHAVIORAL_QUESTIONS.length) * 0.4) * 100
  );

  const weakPatterns = PATTERNS.filter(p => { const r = patternRatings[p.id] ?? 0; return r > 0 && r <= 2; }).slice(0, 3);
  const weakBQ = BEHAVIORAL_QUESTIONS.filter(q => { const r = bqRatings[q.id] ?? 0; return r > 0 && r <= 2; }).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Overall readiness */}
      <div className={`prep-card p-5 ${overallPct >= 100 ? "border-emerald-500/40 bg-emerald-500/5" : ""}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="section-title mb-0 pb-0 border-0">Overall Readiness</div>
          <span className={`text-2xl font-extrabold stat-num ${overallPct >= 80 ? "text-emerald-400" : overallPct >= 50 ? "text-amber-400" : "text-red-400"}`}>
            {overallPct}%
          </span>
        </div>
        <div className="progress-bar mb-2">
          <div className={`progress-bar-fill ${overallPct >= 80 ? "bg-emerald-500" : overallPct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${overallPct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center">
            <div className="stat-num text-lg text-blue-400">{masteredPatterns}/{PATTERNS.length}</div>
            <div className="text-xs text-muted-foreground">Patterns mastered</div>
          </div>
          <div className="text-center">
            <div className="stat-num text-lg text-purple-400">{readyStories}/{BEHAVIORAL_QUESTIONS.length}</div>
            <div className="text-xs text-muted-foreground">Stories ready</div>
          </div>
          <div className="text-center">
            <div className="stat-num text-lg text-emerald-400">{avgMock > 0 ? avgMock.toFixed(1) : "—"}</div>
            <div className="text-xs text-muted-foreground">Mock avg</div>
          </div>
        </div>
      </div>

      {/* Weak-spot dashboard */}
      {(weakPatterns.length > 0 || weakBQ.length > 0) && (
        <div className="prep-card p-4 border-amber-500/20">
          <div className="section-title text-amber-400 mb-3">⚠ Weak-Spot Dashboard</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {weakPatterns.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Weak Patterns</div>
                <div className="space-y-1.5">
                  {weakPatterns.map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <span className="badge badge-red">★{patternRatings[p.id]}</span>
                      <span className="text-foreground">{p.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {weakBQ.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Weak Behavioral Areas</div>
                <div className="space-y-1.5">
                  {weakBQ.map(q => (
                    <div key={q.id} className="flex items-center gap-2 text-xs">
                      <span className="badge badge-red">★{bqRatings[q.id]}</span>
                      <span className="text-foreground truncate">{q.area}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recruiter card with peer comparison */}
      <RecruiterCard masteredPatterns={masteredPatterns} readyStories={readyStories} avgMock={avgMock} streak={streak.currentStreak} overallPct={overallPct} />
    </div>
  );
}

// ── Recruiter Card with Peer Comparison ───────────────────────────────────
function RecruiterCard({ masteredPatterns, readyStories, avgMock, streak, overallPct }: {
  masteredPatterns: number; readyStories: number; avgMock: number; streak: number; overallPct: number;
}) {
  const patternsPercentile = masteredPatterns >= PEER_BENCHMARKS.patternsTop20 ? "Top 20%" : masteredPatterns >= PEER_BENCHMARKS.patternsTop50 ? "Top 50%" : "Below median";
  const storiesPercentile = readyStories >= PEER_BENCHMARKS.storiesTop20 ? "Top 20%" : readyStories >= PEER_BENCHMARKS.storiesTop50 ? "Top 50%" : "Below median";
  const mockPercentile = avgMock >= PEER_BENCHMARKS.mockAvgTop20 ? "Top 20%" : avgMock > 0 ? "Average" : "No data";

  const handlePrint = () => window.print();

  return (
    <div className="prep-card p-5 border-indigo-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="section-title mb-0 pb-0 border-0 text-indigo-400">Recruiter-Ready Summary</div>
        <button onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 text-xs font-semibold transition-all">
          <Printer size={11} /> Print / Save PDF
        </button>
      </div>
      <div id="recruiter-card" className="space-y-3">
        {/* Overall readiness */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
          <TrendingUp size={16} className="text-emerald-400 shrink-0" />
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">Overall Readiness</div>
            <div className="progress-bar mt-1">
              <div className="progress-bar-fill bg-emerald-500" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
          <span className="text-lg font-bold stat-num text-emerald-400">{overallPct}%</span>
        </div>
        {/* Stats with peer comparison */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Target size={13} className="text-blue-400" />, label: "Patterns Mastered", value: `${masteredPatterns}/${PATTERNS.length}`, peer: patternsPercentile },
            { icon: <Brain size={13} className="text-purple-400" />, label: "Stories Ready", value: `${readyStories}/${BEHAVIORAL_QUESTIONS.length}`, peer: storiesPercentile },
            { icon: <TrendingUp size={13} className="text-emerald-400" />, label: "Mock Avg Score", value: avgMock > 0 ? `${avgMock.toFixed(1)}/5` : "—", peer: mockPercentile },
            { icon: <Flame size={13} className="text-orange-400" />, label: "Current Streak", value: `${streak} days`, peer: streak >= PEER_BENCHMARKS.streakTop20 ? "Top 20%" : "Active" },
          ].map(item => (
            <div key={item.label} className="p-3 rounded-lg bg-secondary">
              <div className="flex items-center gap-1.5 mb-1">{item.icon}<span className="text-xs text-muted-foreground">{item.label}</span></div>
              <div className="text-base font-bold stat-num text-foreground">{item.value}</div>
              <div className={`text-xs mt-0.5 ${item.peer === "Top 20%" ? "text-emerald-400" : item.peer === "Top 50%" ? "text-amber-400" : "text-muted-foreground"}`}>
                {item.peer}
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-muted-foreground text-center pt-1">
          Peer benchmarks based on anonymised aggregate data from similar candidates
        </div>
      </div>
    </div>
  );
}

// ── Interview Countdown ────────────────────────────────────────────────────
function InterviewCountdown() {
  const [interviewDate, setInterviewDate] = useInterviewDate();
  const daysLeft = interviewDate ? getDaysUntil(interviewDate) : null;

  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={14} className="text-amber-400" />
        <span className="section-title mb-0 pb-0 border-0">Interview Countdown</span>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className={`text-5xl font-extrabold stat-num ${daysLeft === null ? "text-muted-foreground" : daysLeft <= 7 ? "text-red-400" : daysLeft <= 14 ? "text-amber-400" : "text-emerald-400"}`}>
          {daysLeft === null ? "—" : daysLeft === 0 ? "🎯" : `${daysLeft}d`}
        </div>
        <div className="flex-1 space-y-2">
          <div className="text-sm text-muted-foreground">
            {daysLeft === null ? "Set your interview date to track your countdown." : daysLeft === 0 ? "Today is the day! You've got this." : daysLeft <= 7 ? `${daysLeft} days left — final sprint mode!` : `${daysLeft} days remaining — stay consistent.`}
          </div>
          <input type="date" value={interviewDate ?? ""} onChange={e => setInterviewDate(e.target.value || null)}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-amber-500/50" />
        </div>
      </div>
    </div>
  );
}

// ── Prep Timeline ──────────────────────────────────────────────────────────
function PrepTimeline() {
  const [interviewDate] = useInterviewDate();
  const currentWeek = (() => {
    if (!interviewDate) return -1;
    const days = getDaysUntil(interviewDate);
    if (days > 49) return 0;
    if (days > 35) return 1;
    if (days > 21) return 2;
    if (days > 14) return 3;
    if (days > 7) return 4;
    return 4;
  })();

  return (
    <div className="prep-card p-5">
      <div className="section-title">8-Week Prep Timeline</div>
      <div className="space-y-3">
        {PREP_TIMELINE.map((week, i) => (
          <div key={i} className={`p-3 rounded-lg border transition-all ${i === currentWeek ? "border-blue-500/40 bg-blue-500/5" : "border-border bg-secondary/30"}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-foreground">{week.week}</span>
              <span className={`badge ${i === currentWeek ? "badge-blue" : "badge-gray"}`}>{week.focus}</span>
              {i === currentWeek && <span className="badge badge-blue text-xs">← You are here</span>}
            </div>
            <ul className="space-y-1">
              {week.items.map((item, j) => (
                <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="text-blue-400 mt-0.5">·</span>{item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── STAR Story Bank ────────────────────────────────────────────────────────
function StarStoryBank() {
  const [notes, setNotes] = useStarNotes();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success("STAR template copied!");
  };

  return (
    <div className="prep-card p-5">
      <div className="section-title">
        <Brain size={14} className="text-purple-400" />
        STAR Story Bank
      </div>
      <div className="space-y-2">
        {STAR_STORIES.map(story => (
          <div key={story.id} className="rounded-lg border border-border overflow-hidden">
            <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-all"
              onClick={() => setExpanded(expanded === story.id ? null : story.id)}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{story.title}</span>
                  {story.tags.map(t => <span key={t} className="badge badge-purple text-xs">{t}</span>)}
                </div>
              </div>
              {expanded === story.id ? <ChevronUp size={13} className="text-muted-foreground shrink-0" /> : <ChevronDown size={13} className="text-muted-foreground shrink-0" />}
            </button>
            {expanded === story.id && (
              <div className="p-3 border-t border-border space-y-3">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono bg-secondary p-3 rounded-lg">{story.template}</pre>
                <div className="flex gap-2">
                  <button onClick={() => handleCopy(story.id, story.template)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-xs font-semibold text-muted-foreground transition-all">
                    {copied === story.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    {copied === story.id ? "Copied!" : "Copy template"}
                  </button>
                </div>
                <textarea value={notes[story.id] ?? ""} onChange={e => setNotes(n => ({ ...n, [story.id]: e.target.value }))}
                  placeholder="Add your personal story notes here…" rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress Export ────────────────────────────────────────────────────────
function ProgressExport() {
  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const streak = useStreak();

  const exportTxt = () => {
    const masteredPatterns = PATTERNS.filter(p => (patternRatings[p.id] ?? 0) >= 4);
    const weakPatterns = PATTERNS.filter(p => { const r = patternRatings[p.id] ?? 0; return r > 0 && r <= 2; });
    const readyStories = BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) >= 4);
    const overallPct = Math.round(((masteredPatterns.length / PATTERNS.length) * 0.6 + (readyStories.length / BEHAVIORAL_QUESTIONS.length) * 0.4) * 100);

    const lines = [
      "META INTERVIEW PREP — PROGRESS REPORT",
      `Generated: ${new Date().toLocaleString()}`,
      "=".repeat(50),
      `Overall Readiness: ${overallPct}%`,
      `Current Streak: ${streak.currentStreak} days (best: ${streak.longestStreak})`,
      "",
      `PATTERNS MASTERED (${masteredPatterns.length}/${PATTERNS.length}):`,
      ...masteredPatterns.map(p => `  ★${patternRatings[p.id]} ${p.name}`),
      "",
      `WEAK PATTERNS (${weakPatterns.length}):`,
      ...weakPatterns.map(p => `  ★${patternRatings[p.id]} ${p.name}`),
      "",
      `BEHAVIORAL STORIES READY (${readyStories.length}/${BEHAVIORAL_QUESTIONS.length}):`,
      ...readyStories.map(q => `  ★${bqRatings[q.id]} [${q.area}] ${q.q.slice(0, 60)}…`),
      "",
      `MOCK SESSION HISTORY (${mockHistory.length} sessions):`,
      ...mockHistory.map(m => `  ${new Date(m.date).toLocaleDateString()} — avg ★${m.avgScore.toFixed(1)}`),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "meta_prep_progress.txt"; a.click();
    toast.success("Progress report downloaded!");
  };

  return (
    <button onClick={exportTxt}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary hover:bg-accent border border-border text-sm font-semibold text-muted-foreground hover:text-foreground transition-all">
      <Download size={13} /> Export Progress Report (.txt)
    </button>
  );
}

// ── Interview Day Checklist ────────────────────────────────────────────────
function InterviewDayChecklist() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setChecked(c => ({ ...c, [key]: !c[key] }));

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="section-title mb-0 pb-0 border-0">Interview Day Checklist</div>
        <button onClick={() => window.print()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-xs font-semibold text-muted-foreground transition-all">
          <Printer size={11} /> Print
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {INTERVIEW_DAY_CHECKLIST.map(phase => (
          <div key={phase.phase}>
            <div className="text-xs font-bold text-foreground mb-2">{phase.phase}</div>
            <div className="space-y-1.5">
              {phase.items.map((item, i) => {
                const key = `${phase.phase}-${i}`;
                return (
                  <label key={key} className="flex items-start gap-2 cursor-pointer group">
                    <input type="checkbox" checked={checked[key] ?? false} onChange={() => toggle(key)}
                      className="mt-0.5 accent-blue-500 shrink-0" />
                    <span className={`text-xs transition-colors ${checked[key] ? "line-through text-muted-foreground/50" : "text-muted-foreground group-hover:text-foreground"}`}>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Resources ──────────────────────────────────────────────────────────────
function ResourcesSection() {
  const TAG_COLORS: Record<string, string> = { Coding: "badge-blue", "System Design": "badge-purple", Behavioral: "badge-amber" };
  return (
    <div className="prep-card p-5">
      <div className="section-title">Curated Resources</div>
      <div className="space-y-2">
        {RESOURCES.map(r => (
          <a key={r.title} href={r.url} target="_blank" rel="noopener noreferrer"
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary hover:bg-accent border border-border transition-all group">
            <span className={`badge ${TAG_COLORS[r.tag] ?? "badge-gray"} shrink-0 mt-0.5`}>{r.tag}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors">{r.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{r.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Main OverviewTab ───────────────────────────────────────────────────────
export default function OverviewTab() {
  return (
    <div className="space-y-6">
      <LevelCards />
      <ReadinessDashboard />
      <InterviewCountdown />
      <PrepTimeline />
      <StarStoryBank />
      <InterviewDayChecklist />
      <ResourcesSection />
      <div className="flex justify-start">
        <ProgressExport />
      </div>
    </div>
  );
}
