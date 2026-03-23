// Design: Bold Engineering Dashboard — Behavioral Tab
// Features: search, practice mode (3-min timer), full mock session (4 questions),
// L6/L7 comparison table, mock history log, meta values, STAR framework
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  Brain,
  Play,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Trash2,
  Shuffle,
  Timer,
  X,
  SkipForward,
  Zap,
  HelpCircle,
} from "lucide-react";
import VoiceToStar from "@/components/VoiceToStar";
import { VoiceAnswerMode } from "@/components/VoiceAnswerMode";
import { BEHAVIORAL_QUESTIONS, IC_COMPARISON, META_VALUES } from "@/lib/data";
import {
  useBehavioralRatings,
  useMockHistory,
  useStoryStrengthHistory,
  useTechRetroProjects,
  type MockSession,
  type StoryRatingEntry,
  type TechRetroProject,
} from "@/hooks/useLocalStorage";
import { toast } from "sonner";
import { nanoid } from "nanoid";
import { trpc } from "@/lib/trpc";
import { BehavioralMockSession } from "@/components/BehavioralMockSession";
import { StoryCoverageMatrix } from "@/components/StoryCoverageMatrix";
import { InterviewerPersonaStressTest } from "@/components/InterviewerPersonaStressTest";
import { FeatureHeatmapRow } from "@/components/FeatureHeatmapRow";
import { ImpactQuantificationCoach } from "@/components/ImpactQuantificationCoach";

const AREAS = [
  "All",
  "Conflict & Influence",
  "Ownership & Ambiguity",
  "Scale & Impact",
  "Failure & Learning",
  "XFN Partnership",
];

// ── L4 / L5 Entry-Level Behavioral Guide ──────────────────────────────────
const L4_L5_BEHAVIORAL = [
  {
    level: "L4",
    color: "text-emerald-400",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    badge: "bg-emerald-500/15 text-emerald-300",
    headline: "Software Engineer (E4)",
    expectation:
      "Demonstrate ownership, collaboration, and learning from failure. Answers should be specific, first-person, and grounded in real experience. Interviewers look for clear STAR structure and honest self-reflection.",
    areas: [
      "Ownership & Ambiguity",
      "Conflict & Influence",
      "Failure & Learning",
      "Collaboration",
    ],
    tips: [
      "Use 'I' not 'we' — interviewers want to know YOUR specific contribution, not the team's.",
      "Keep Situation + Task to 1–2 sentences. Spend 70% of your answer on Action and Result.",
      "Quantify results wherever possible — even rough numbers (e.g. 'reduced latency by ~30%') are better than none.",
      "Prepare 3–4 strong stories that can flex across multiple question types (failure, conflict, impact).",
      "It's OK to say 'I was wrong' — L4 interviewers reward self-awareness and growth mindset.",
    ],
    mustPrep: [
      "Tell me about a time you disagreed with a teammate.",
      "Describe a project you owned end-to-end.",
      "Tell me about a mistake you made and what you learned.",
      "How do you handle competing priorities?",
    ],
  },
  {
    level: "L5",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    badge: "bg-blue-500/15 text-blue-300",
    headline: "Senior Software Engineer (E5)",
    expectation:
      "Show team-level impact, cross-functional influence, and data-driven decision making. Answers should demonstrate that you operate beyond your immediate scope — influencing without authority and driving outcomes across teams.",
    areas: [
      "Scale & Impact",
      "XFN Partnership",
      "Ownership & Ambiguity",
      "Conflict & Influence",
    ],
    tips: [
      "Elevate your scope: L5 stories should involve cross-team impact, not just individual contributions.",
      "Show influence without authority — how did you align people who didn't report to you?",
      "Discuss trade-offs explicitly: 'I chose X over Y because...' signals senior-level judgment.",
      "Prepare at least one story about driving a decision with incomplete information.",
      "Mention mentorship or leveling up teammates — L5 is expected to grow the team around them.",
    ],
    mustPrep: [
      "Tell me about a time you influenced a decision without formal authority.",
      "Describe the most impactful project you've driven.",
      "How do you handle a situation where you disagree with your manager?",
      "Tell me about a time you had to deliver bad news to stakeholders.",
    ],
  },
];

function L4L5BehavioralCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="prep-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
      >
        <div className="section-title mb-0 pb-0 border-0">
          <Brain size={14} className="text-emerald-400" />
          L4 / L5 Entry-Level Behavioral Guide
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            E4 · E5 expectations, tips &amp; must-prep questions
          </span>
          {open ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>
      {open && (
        <div className="p-4 pt-0 grid sm:grid-cols-2 gap-4">
          {L4_L5_BEHAVIORAL.map(tier => (
            <div
              key={tier.level}
              className={`rounded-lg border ${tier.border} ${tier.bg} p-4 space-y-3`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${tier.badge}`}
                >
                  {tier.level}
                </span>
                <span className={`text-sm font-semibold ${tier.color}`}>
                  {tier.headline}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {tier.expectation}
              </p>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  Focus areas
                </p>
                <div className="flex flex-wrap gap-1">
                  {tier.areas.map(a => (
                    <span
                      key={a}
                      className="text-xs px-2 py-0.5 rounded bg-secondary border border-border text-muted-foreground"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  Interview tips
                </p>
                <ul className="space-y-1">
                  {tier.tips.map((t, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex gap-1.5"
                    >
                      <span className={`${tier.color} shrink-0`}>›</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">
                  Must-prep questions
                </p>
                <ul className="space-y-0.5">
                  {tier.mustPrep.map((q, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex gap-1.5"
                    >
                      <span className={`${tier.color} shrink-0`}>·</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Flashcard Flip Deck ────────────────────────────────────────────────────
interface Flashcard {
  id: string;
  question: string;
  area: string;
  probes: string[];
  l6Answer: string;
  l7Answer: string;
}

const FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    question: "Tell me about a time you influenced without authority.",
    area: "Conflict & Influence",
    probes: [
      "How did you build alignment?",
      "What resistance did you face?",
      "What would you do differently?",
    ],
    l6Answer:
      "I identified key stakeholders, built a data-driven case, and held 1:1s to address concerns. The team adopted my proposal after I demonstrated a small pilot with measurable results.",
    l7Answer:
      "I mapped the org landscape to find hidden influencers, built a coalition across 3 orgs, and created a shared narrative that tied the proposal to each team's OKRs. I also anticipated objections and pre-addressed them in the doc. The initiative shipped org-wide and became a standard pattern.",
  },
  {
    id: "fc-2",
    question:
      "Describe a project where you had to make a decision with incomplete information.",
    area: "Ownership & Ambiguity",
    probes: [
      "What was the cost of waiting for more data?",
      "How did you de-risk the decision?",
      "What was the outcome?",
    ],
    l6Answer:
      "I defined the minimum data needed to make a reversible decision, set a time-box, and moved forward with a rollback plan. The decision proved correct and we shipped on schedule.",
    l7Answer:
      "I framed the decision as a two-way door vs. one-way door. For reversible decisions I moved fast with instrumentation; for irreversible ones I ran a structured pre-mortem with 5 senior engineers. I also documented the decision log so the team could learn from it. This pattern became our team's default for ambiguous calls.",
  },
  {
    id: "fc-3",
    question: "Tell me about the most impactful project you've led.",
    area: "Scale & Impact",
    probes: [
      "What made it L7 scope?",
      "How did you measure success?",
      "What was the org-wide effect?",
    ],
    l6Answer:
      "I led a 3-engineer team to rebuild our data pipeline, reducing latency by 40% and enabling two new product features that drove a 15% increase in DAU.",
    l7Answer:
      "I identified a platform-level bottleneck affecting 8 product teams, built the business case for a 6-month investment, staffed a cross-functional team of 12, and drove the architecture decisions. The platform now handles 10x traffic, unblocked 3 major product launches, and saved $2M/year in infrastructure costs. I also mentored 2 engineers who are now TLs.",
  },
  {
    id: "fc-4",
    question: "Tell me about a significant failure and what you learned.",
    area: "Failure & Learning",
    probes: [
      "What was your personal role in the failure?",
      "How did you handle the aftermath?",
      "What systemic change did you drive?",
    ],
    l6Answer:
      "I underestimated the complexity of a migration, causing a 2-hour outage. I owned the incident, wrote a thorough post-mortem, and implemented automated rollback that prevented 3 similar incidents.",
    l7Answer:
      "I made a strategic bet on a technology that didn't pan out, costing 4 months of eng time. I took full ownership, presented the learnings to leadership, and used the failure to build a better technical evaluation framework that the org now uses. I also used it as a coaching moment for my team on how to fail fast and learn faster.",
  },
  {
    id: "fc-5",
    question:
      "How do you handle a situation where you disagree with your manager?",
    area: "Conflict & Influence",
    probes: [
      "Did you escalate? Why or why not?",
      "How did you maintain the relationship?",
      "What was the outcome?",
    ],
    l6Answer:
      "I prepared a data-backed counter-proposal, had a direct 1:1 conversation, and committed to the decision once made. I made sure to revisit the outcome together.",
    l7Answer:
      "I distinguish between disagreements on strategy vs. execution. For strategy, I write a crisp 1-pager with tradeoffs and request a structured debate. For execution, I disagree-and-commit while documenting my concerns. I've learned that the quality of the disagreement process matters as much as the outcome — it builds trust and psychological safety.",
  },
  {
    id: "fc-6",
    question: "Describe a time you had to deliver bad news to stakeholders.",
    area: "Ownership & Ambiguity",
    probes: [
      "How did you frame the news?",
      "What was the stakeholder reaction?",
      "What did you do to rebuild trust?",
    ],
    l6Answer:
      "I delivered the news early with context, proposed a mitigation plan, and set up a weekly sync to restore confidence. The stakeholders appreciated the transparency.",
    l7Answer:
      "I believe bad news should travel fast. I gave stakeholders a heads-up before the formal announcement, provided a root cause analysis, and presented 3 recovery options with tradeoffs. I also took accountability publicly in the all-hands. This approach turned a potential trust crisis into a demonstration of leadership maturity.",
  },
  {
    id: "fc-7",
    question: "Tell me about a time you drove a cross-functional initiative.",
    area: "XFN Partnership",
    probes: [
      "How did you align different priorities?",
      "What was the biggest friction point?",
      "How did you measure success?",
    ],
    l6Answer:
      "I set up a shared OKR with PM and Design, held weekly syncs, and used a RACI matrix to clarify ownership. The feature shipped on time with high quality.",
    l7Answer:
      "I started by mapping each team's incentives and finding the shared north star metric. I created a joint charter, ran a kickoff with all stakeholders, and established a lightweight governance model. When priorities conflicted, I escalated with a clear recommendation rather than just surfacing the problem. The initiative delivered $5M in incremental revenue and became a template for future XFN work.",
  },
  {
    id: "fc-8",
    question: "How do you prioritize when everything seems urgent?",
    area: "Ownership & Ambiguity",
    probes: [
      "What framework do you use?",
      "How do you communicate trade-offs?",
      "What do you deprioritize?",
    ],
    l6Answer:
      "I use an impact/effort matrix, align with my manager on the top 3 priorities, and communicate trade-offs to stakeholders. I revisit priorities weekly.",
    l7Answer:
      "I use a combination of RICE scoring and strategic alignment checks. I also distinguish between urgent-important (do now), important-not-urgent (schedule), and urgent-not-important (delegate). At L7, I also think about which decisions only I can make vs. which I should push down to my team. I've found that the best prioritization is often about what NOT to do.",
  },
];

function FlashcardFlipDeck() {
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showL7, setShowL7] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [filter, setFilter] = useState("All");

  const filteredCards =
    filter === "All" ? FLASHCARDS : FLASHCARDS.filter(c => c.area === filter);
  const card = filteredCards[cardIdx % filteredCards.length];

  const next = () => {
    setCardIdx(i => (i + 1) % filteredCards.length);
    setFlipped(false);
    setShowL7(false);
    setUserAnswer("");
  };
  const prev = () => {
    setCardIdx(i => (i - 1 + filteredCards.length) % filteredCards.length);
    setFlipped(false);
    setShowL7(false);
    setUserAnswer("");
  };
  const wc = userAnswer.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="prep-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="section-title mb-0.5">Flashcard Flip Deck</div>
          <div className="text-xs text-muted-foreground">
            Type your answer, then flip to compare L6 vs L7 sample responses
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={e => {
              setFilter(e.target.value);
              setCardIdx(0);
              setFlipped(false);
              setUserAnswer("");
            }}
            className="px-2 py-1 rounded-md bg-secondary border border-border text-xs text-foreground focus:outline-none"
          >
            <option value="All">All Areas</option>
            {AREAS.slice(1).map(a => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {(cardIdx % filteredCards.length) + 1}/{filteredCards.length}
          </span>
        </div>
      </div>

      {/* Card */}
      <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${AREA_COLORS[card.area] ? `badge ${AREA_COLORS[card.area]}` : "badge badge-gray"}`}
            >
              {card.area}
            </span>
            <p className="mt-2 text-sm font-semibold text-foreground leading-relaxed">
              {card.question}
            </p>
          </div>
        </div>

        {/* User answer */}
        {!flipped && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold">
                Your Answer (STAR format)
              </span>
              <span
                className={`text-[10px] font-mono ${wc < 50 ? "text-red-400" : wc < 150 ? "text-amber-400" : "text-emerald-400"}`}
              >
                {wc} words
              </span>
            </div>
            <textarea
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="S: Situation...&#10;T: Task...&#10;A: Action...&#10;R: Result..."
              rows={5}
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                Probes the interviewer may ask:
              </span>
              <div className="flex flex-wrap gap-1">
                {card.probes.map((p, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setFlipped(true)}
              className="w-full py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all"
            >
              🔄 Flip — See Sample Answers
            </button>
          </div>
        )}

        {/* Flipped: sample answers */}
        {flipped && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setShowL7(false)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  !showL7
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                L6 Sample
              </button>
              <button
                onClick={() => setShowL7(true)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  showL7
                    ? "bg-violet-500/15 border-violet-500/30 text-violet-400"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                L7 Sample
              </button>
            </div>
            <div
              className={`p-4 rounded-lg border text-xs leading-relaxed ${
                showL7
                  ? "bg-violet-500/10 border-violet-500/20 text-violet-100"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-100"
              }`}
            >
              <div
                className={`text-[10px] font-bold mb-2 ${showL7 ? "text-violet-400" : "text-blue-400"}`}
              >
                {showL7
                  ? "L7 Answer — Strategic, Org-wide, Systemic"
                  : "L6 Answer — Solid, Data-driven, Team-scoped"}
              </div>
              {showL7 ? card.l7Answer : card.l6Answer}
            </div>
            {userAnswer.trim() && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="text-[10px] font-bold text-muted-foreground mb-1">
                  Your Answer
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {userAnswer}
                </p>
              </div>
            )}
            <button
              onClick={() => setFlipped(false)}
              className="w-full py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs text-muted-foreground transition-all"
            >
              ↩ Back to answer
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          className="px-4 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs text-muted-foreground transition-all"
        >
          ← Prev
        </button>
        <div className="flex gap-1.5">
          {filteredCards.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCardIdx(i);
                setFlipped(false);
                setUserAnswer("");
              }}
              className={`w-2 h-2 rounded-full transition-all ${i === cardIdx % filteredCards.length ? "bg-blue-500" : "bg-secondary hover:bg-muted-foreground"}`}
            />
          ))}
        </div>
        <button
          onClick={next}
          className="px-4 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-xs text-muted-foreground transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ── 8 Key Signals That Distinguish L7 from L6 ────────────────────────────
const L7_SIGNALS = [
  {
    num: 1,
    signal: "Scope of Impact",
    ic6: "Drives impact within your team or a single product area. Projects affect 1–2 teams.",
    ic7: "Drives org-wide or company-wide impact. Projects affect multiple orgs, platforms, or external partners.",
    tip: "Quantify the blast radius of your work. How many teams, users, or revenue lines were affected?",
  },
  {
    num: 2,
    signal: "Ambiguity Tolerance",
    ic6: "Works well with defined requirements. Can handle moderate ambiguity with manager guidance.",
    ic7: "Thrives in high ambiguity. Creates clarity for others. Defines the problem before solving it.",
    tip: "Show examples where YOU defined the problem statement, not just solved a given one.",
  },
  {
    num: 3,
    signal: "Influence & Persuasion",
    ic6: "Influences within team and immediate stakeholders. Good at 1:1 alignment.",
    ic7: "Influences across org boundaries, including senior leadership. Shapes strategy, not just execution.",
    tip: "Name the VP or Director you influenced. Describe the coalition you built across orgs.",
  },
  {
    num: 4,
    signal: "Technical Depth vs. Breadth",
    ic6: "Deep expertise in 1–2 technical domains. Strong individual contributor.",
    ic7: "Deep expertise PLUS broad architectural judgment. Can reason about system-level tradeoffs across domains.",
    tip: "Demonstrate both: a deep technical decision AND a cross-cutting architectural choice.",
  },
  {
    num: 5,
    signal: "Talent Multiplier",
    ic6: "Mentors 1–2 junior engineers. Good at code reviews and pair programming.",
    ic7: "Systematically raises the bar for the whole team. Creates leverage through documentation, frameworks, and processes that outlast you.",
    tip: "Describe a framework, RFC, or process you created that others now use independently.",
  },
  {
    num: 6,
    signal: "Failure & Learning",
    ic6: "Owns mistakes, writes post-mortems, implements fixes. Learns from failures.",
    ic7: "Turns failures into systemic improvements. Uses failures to build institutional knowledge and change org behavior.",
    tip: "Show how your failure led to a process, tool, or cultural change that prevented future failures.",
  },
  {
    num: 7,
    signal: "Strategic Thinking",
    ic6: "Understands the 'why' behind projects. Can articulate business impact.",
    ic7: "Proactively identifies strategic opportunities and risks. Shapes the roadmap, not just executes it.",
    tip: "Describe a time you proposed a project that wasn't on the roadmap and convinced leadership to fund it.",
  },
  {
    num: 8,
    signal: "Communication & Storytelling",
    ic6: "Clear written and verbal communication. Good at technical docs and design reviews.",
    ic7: "Tailors communication to the audience (engineer, PM, VP, CEO). Tells compelling stories that drive decisions.",
    tip: "Prepare a version of each story for a technical audience AND a non-technical executive audience.",
  },
];

function L7Signals() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="prep-card p-5 space-y-4">
      <div>
        <div className="section-title mb-0.5">
          8 Key Signals That Distinguish L7 from L6
        </div>
        <div className="text-xs text-muted-foreground">
          Click any signal to see the L6 vs L7 contrast and a coaching tip
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {L7_SIGNALS.map(s => (
          <div
            key={s.num}
            className="rounded-xl border border-border bg-secondary/30 overflow-hidden"
          >
            <button
              onClick={() => setExpanded(expanded === s.num ? null : s.num)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-bold flex items-center justify-center shrink-0">
                {s.num}
              </span>
              <span className="text-sm font-semibold text-foreground flex-1">
                {s.signal}
              </span>
              <span className="text-muted-foreground text-xs">
                {expanded === s.num ? "▲" : "▼"}
              </span>
            </button>
            {expanded === s.num && (
              <div className="px-4 pb-4 space-y-3 border-t border-border">
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="text-[10px] font-bold text-blue-400 mb-1">
                      L6
                    </div>
                    <p className="text-xs text-blue-100 leading-relaxed">
                      {s.ic6}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                    <div className="text-[10px] font-bold text-violet-400 mb-1">
                      L7
                    </div>
                    <p className="text-xs text-violet-100 leading-relaxed">
                      {s.ic7}
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] font-bold text-amber-400 mb-1">
                    💡 Coaching Tip
                  </div>
                  <p className="text-xs text-amber-100 leading-relaxed">
                    {s.tip}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
const AREA_COLORS: Record<string, string> = {
  "Conflict & Influence": "badge-red",
  "Ownership & Ambiguity": "badge-amber",
  "Scale & Impact": "badge-blue",
  "Failure & Learning": "badge-purple",
  "XFN Partnership": "badge-teal",
};

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          className={`star-btn ${(hover || value) >= s ? "active" : ""}`}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ── Practice Mode ──────────────────────────────────────────────────────────
function PracticeMode({
  ratings,
  onRate,
}: {
  ratings: Record<string, number>;
  onRate: (id: string, v: number) => void;
}) {
  const [qIdx, setQIdx] = useState(() =>
    Math.floor(Math.random() * BEHAVIORAL_QUESTIONS.length)
  );
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const q = BEHAVIORAL_QUESTIONS[qIdx];
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const pct = ((180 - timeLeft) / 180) * 100;
  const r = 36;
  const circ = 2 * Math.PI * r;

  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(180);
    setRunning(false);
  }, []);

  const start = () => {
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          setRevealed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const next = () => {
    setQIdx(Math.floor(Math.random() * BEHAVIORAL_QUESTIONS.length));
    setRevealed(false);
    reset();
  };

  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Play size={14} className="text-purple-400" />
        <span className="text-sm font-semibold text-foreground">
          Practice Mode
        </span>
        <span className={`badge ${AREA_COLORS[q.area] ?? "badge-gray"}`}>
          {q.area}
        </span>
        {"tier" in q && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
              (q as any).tier === "L7"
                ? "text-violet-300 bg-violet-500/15 border-violet-500/30"
                : (q as any).tier === "L6"
                  ? "text-blue-300 bg-blue-500/15 border-blue-500/30"
                  : "text-emerald-300 bg-emerald-500/15 border-emerald-500/30"
            }`}
          >
            {(q as any).tier}
          </span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Timer ring */}
        <div className="relative w-20 h-20 shrink-0 mx-auto sm:mx-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="oklch(0.28 0.012 264)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={
                timeLeft <= 30
                  ? "oklch(0.65 0.22 25)"
                  : timeLeft <= 60
                    ? "oklch(0.78 0.17 75)"
                    : "oklch(0.58 0.2 295)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="mono text-sm font-bold text-foreground">
              {mm}:{ss}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {q.q}
          </p>
          <div className="flex gap-2 flex-wrap">
            {!running && timeLeft === 180 && (
              <button
                onClick={start}
                className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 text-xs font-semibold transition-all"
              >
                Start Timer
              </button>
            )}
            {running && (
              <button
                onClick={reset}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
              >
                Reset
              </button>
            )}
            <button
              onClick={() => setRevealed(r => !r)}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
            >
              {revealed ? "Hide" : "Reveal"} Probes
            </button>
            <button
              onClick={next}
              className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all"
            >
              Next Question →
            </button>
          </div>
          {revealed && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-secondary text-xs text-muted-foreground">
                {q.hint}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  Rate your answer:
                </span>
                <StarRating
                  value={ratings[q.id] ?? 0}
                  onChange={v => {
                    onRate(q.id, v);
                    next();
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Full Mock Session ──────────────────────────────────────────────────────
function FullMockSession({
  onComplete,
}: {
  onComplete: (session: MockSession) => void;
}) {
  const FOCUS_AREAS = [
    "Conflict & Influence",
    "Ownership & Ambiguity",
    "Scale & Impact",
    "Failure & Learning",
  ];
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);
  const [running, setRunning] = useState(false);
  const [ratings, setRatings] = useState<number[]>([0, 0, 0, 0]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick one random question per focus area
  const [questions] = useState(() =>
    FOCUS_AREAS.map(area => {
      const pool = BEHAVIORAL_QUESTIONS.filter(q => q.area === area);
      return pool[Math.floor(Math.random() * pool.length)];
    })
  );

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const pct = ((180 - timeLeft) / 180) * 100;
  const r = 40;
  const circ = 2 * Math.PI * r;

  const startTimer = useCallback(() => {
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  const pauseTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setRunning(false);
  };
  const resetTimer = () => {
    pauseTimer();
    setTimeLeft(180);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const rateAndNext = (rating: number) => {
    const newRatings = [...ratings];
    newRatings[step] = rating;
    setRatings(newRatings);
    if (step < 3) {
      setStep(step + 1);
      resetTimer();
    } else {
      // Done
      clearInterval(timerRef.current!);
      const avg = newRatings.reduce((s, r) => s + r, 0) / 4;
      const session: MockSession = {
        id: nanoid(),
        date: new Date().toISOString(),
        questions: questions.map(q => ({ text: q.q, area: q.area })),
        ratings: newRatings,
        avgScore: avg,
      };
      onComplete(session);
      setPhase("done");
    }
  };

  if (phase === "idle") {
    return (
      <div className="prep-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-foreground">
            Full Mock Session
          </span>
          <span className="badge badge-blue">4 questions · 3 min each</span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Simulates a real behavioral interview. One question per focus area,
          3-minute timer each. Rate yourself honestly at the end of each
          question.
        </p>
        <button
          onClick={() => setPhase("running")}
          className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all"
        >
          Start Full Mock
        </button>
      </div>
    );
  }

  if (phase === "done") {
    const avg = ratings.reduce((s, r) => s + r, 0) / 4;
    return (
      <div className="prep-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={14} className="text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">
            Mock Complete
          </span>
          <span className="badge badge-green">Session saved</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {questions.map((q, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary text-center">
              <div className="text-xs text-muted-foreground mb-1 truncate">
                {q.area}
              </div>
              <div className="text-xl font-bold text-foreground stat-num">
                ★{ratings[i]}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <span className="text-sm text-muted-foreground">
            Session average:
          </span>
          <span className="text-xl font-bold text-emerald-400 stat-num">
            {avg.toFixed(1)}/5
          </span>
        </div>
        <button
          onClick={() => {
            setPhase("idle");
            setStep(0);
            setRatings([0, 0, 0, 0]);
            resetTimer();
          }}
          className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-sm font-semibold text-foreground transition-all"
        >
          Start New Mock
        </button>
      </div>
    );
  }

  // Running
  const q = questions[step];
  return (
    <div className="prep-card p-5">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${i < step ? "bg-emerald-500" : i === step ? "bg-blue-500" : "bg-secondary"}`}
          />
        ))}
        <span className="text-xs text-muted-foreground shrink-0">
          Q{step + 1}/4
        </span>
      </div>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Timer ring */}
        <div className="relative w-24 h-24 shrink-0 mx-auto sm:mx-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="oklch(0.28 0.012 264)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={
                timeLeft <= 30 ? "oklch(0.65 0.22 25)" : "oklch(0.62 0.19 258)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="mono text-lg font-bold text-foreground">
              {mm}:{ss}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <span className={`badge ${AREA_COLORS[q.area] ?? "badge-gray"}`}>
            {q.area}
          </span>
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {q.q}
          </p>
          <div className="flex gap-2 flex-wrap">
            {!running && (
              <button
                onClick={startTimer}
                className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all"
              >
                Start Timer
              </button>
            )}
            {running && (
              <button
                onClick={pauseTimer}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
              >
                Pause
              </button>
            )}
            <button
              onClick={resetTimer}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
            >
              <RotateCcw size={11} className="inline mr-1" />
              Reset
            </button>
          </div>
          <div className="p-3 rounded-lg bg-secondary text-xs text-muted-foreground">
            {q.hint}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Rate & continue:
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(v => (
                <button
                  key={v}
                  onClick={() => rateAndNext(v)}
                  className="w-8 h-8 rounded-md bg-secondary hover:bg-blue-500/20 hover:text-blue-400 text-sm font-bold text-muted-foreground transition-all border border-border hover:border-blue-500/40"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mock History Log ───────────────────────────────────────────────────────
function MockHistoryLog({
  history,
  onClear,
}: {
  history: MockSession[];
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (history.length === 0) return null;

  const avg = history.reduce((s, m) => s + m.avgScore, 0) / history.length;
  const best = Math.max(...history.map(m => m.avgScore));
  const last3 = history.slice(-3).map(m => m.avgScore);
  const trend =
    last3.length >= 2
      ? last3[last3.length - 1] > last3[0]
        ? "↑ Up"
        : last3[last3.length - 1] < last3[0]
          ? "↓ Down"
          : "→ Flat"
      : "—";

  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Brain size={14} className="text-indigo-400" />
        <span className="text-sm font-semibold text-foreground">
          Full Mock Session History
        </span>
        <span className="badge badge-indigo ml-auto">
          {history.length} sessions
        </span>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-muted-foreground hover:text-foreground"
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="stat-num text-xl text-foreground">
            {avg.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">Overall avg</div>
        </div>
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="stat-num text-xl text-emerald-400">
            {best.toFixed(1)}
          </div>
          <div className="text-xs text-muted-foreground">Best session</div>
        </div>
        <div className="p-3 rounded-lg bg-secondary text-center">
          <div className="stat-num text-xl text-blue-400">{trend}</div>
          <div className="text-xs text-muted-foreground">Trend (last 3)</div>
        </div>
      </div>
      {expanded && (
        <div className="space-y-2 mt-3">
          {history
            .slice()
            .reverse()
            .map(session => (
              <div
                key={session.id}
                className="p-3 rounded-lg bg-secondary text-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">
                    {new Date(session.date).toLocaleDateString()}
                  </span>
                  <span className="font-bold text-foreground">
                    avg ★{session.avgScore.toFixed(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {session.questions.map((q, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span
                        className={`badge ${AREA_COLORS[q.area] ?? "badge-gray"} text-xs`}
                      >
                        {q.area.split(" ")[0]}
                      </span>
                      <span className="text-amber-400">
                        ★{session.ratings[i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors mt-2"
          >
            <Trash2 size={11} /> Clear all history
          </button>
        </div>
      )}
    </div>
  );
}

// ── Surprise Me (Randomizer + 3-min STAR timer) ─────────────────────────────────────────────────────
const STAR_DURATION = 180; // 3 minutes

function SurpriseMe({
  ratings,
  onRate,
  onClose,
}: {
  ratings: Record<string, number>;
  onRate: (id: string, v: number) => void;
  onClose: () => void;
}) {
  // Pick a random unrated question; fall back to any question
  const pickQuestion = useCallback(() => {
    const unrated = BEHAVIORAL_QUESTIONS.filter(q => !(ratings[q.id] ?? 0));
    const pool = unrated.length > 0 ? unrated : BEHAVIORAL_QUESTIONS;
    return pool[Math.floor(Math.random() * pool.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [q, setQ] = useState(pickQuestion);
  const [timeLeft, setTimeLeft] = useState(STAR_DURATION);
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const next = () => {
    stopTimer();
    setQ(pickQuestion());
    setTimeLeft(STAR_DURATION);
    setRunning(false);
    setRevealed(false);
    setDone(false);
  };

  const pct = ((STAR_DURATION - timeLeft) / STAR_DURATION) * 100;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const urgent = timeLeft <= 30;
  const warning = timeLeft <= 60;

  return (
    <div className="prep-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shuffle size={14} className="text-pink-400" />
          <span className="text-sm font-bold text-foreground">Surprise Me</span>
          <span className={`badge ${AREA_COLORS[q.area] ?? "badge-gray"}`}>
            {q.area}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Circular timer */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="oklch(0.28 0.012 264)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={
                urgent
                  ? "oklch(0.65 0.22 25)"
                  : warning
                    ? "oklch(0.78 0.17 75)"
                    : "oklch(0.58 0.2 295)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`font-mono text-base font-bold ${urgent ? "text-red-400" : warning ? "text-amber-400" : "text-foreground"}`}
            >
              {mm}:{ss}
            </span>
          </div>
        </div>

        {/* Question + controls */}
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {q.q}
          </p>

          {/* STAR phase labels */}
          <div className="flex gap-1.5 flex-wrap">
            {["S — Situation", "T — Task", "A — Action", "R — Result"].map(
              (label, i) => {
                const colors = [
                  "text-blue-400",
                  "text-amber-400",
                  "text-purple-400",
                  "text-emerald-400",
                ];
                return (
                  <span
                    key={label}
                    className={`text-xs font-semibold ${colors[i]}`}
                  >
                    {label}
                  </span>
                );
              }
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 flex-wrap">
            {!running && !done && timeLeft === STAR_DURATION && (
              <button
                onClick={startTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-400 text-xs font-semibold transition-all"
              >
                <Timer size={11} /> Start Timer
              </button>
            )}
            {running && (
              <button
                onClick={stopTimer}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
              >
                Pause
              </button>
            )}
            <button
              onClick={() => setRevealed(r => !r)}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
            >
              {revealed ? "Hide" : "Show"} Probes
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all"
            >
              <SkipForward size={11} /> Skip
            </button>
          </div>

          {/* Hint */}
          {revealed && (
            <div className="p-3 rounded-lg bg-secondary text-xs text-muted-foreground">
              {q.hint}
            </div>
          )}

          {/* Rate + next */}
          {(done || revealed) && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Rate your answer:
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    className={`star-btn ${(ratings[q.id] ?? 0) >= s ? "active" : ""}`}
                    onClick={() => {
                      onRate(q.id, s);
                      next();
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          {done && (
            <div className="text-xs font-semibold text-amber-400">
              ⏱ Time’s up! Rate your answer above to continue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── XFN Surprise Me ─────────────────────────────────────────────────────────────────
const XFN_QUESTIONS = BEHAVIORAL_QUESTIONS.filter(
  q => q.area === "XFN Partnership"
);

function XFNSurpriseMe({
  ratings,
  onRate,
  onClose,
}: {
  ratings: Record<string, number>;
  onRate: (id: string, v: number) => void;
  onClose: () => void;
}) {
  const pickQuestion = useCallback(() => {
    const unrated = XFN_QUESTIONS.filter(q => !(ratings[q.id] ?? 0));
    const pool = unrated.length > 0 ? unrated : XFN_QUESTIONS;
    return pool[Math.floor(Math.random() * pool.length)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [q, setQ] = useState(pickQuestion);
  const [timeLeft, setTimeLeft] = useState(STAR_DURATION);
  const [running, setRunning] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const next = () => {
    stopTimer();
    setQ(pickQuestion());
    setTimeLeft(STAR_DURATION);
    setRunning(false);
    setRevealed(false);
    setDone(false);
  };

  const pct = ((STAR_DURATION - timeLeft) / STAR_DURATION) * 100;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const urgent = timeLeft <= 30;
  const warning = timeLeft <= 60;

  return (
    <div
      className="prep-card p-5"
      style={{
        border: "1px solid rgba(20,184,166,0.3)",
        background: "rgba(20,184,166,0.05)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-teal-400">🤝</span>
          <span className="text-sm font-bold text-foreground">
            Surprise Me (XFN)
          </span>
          <span className="badge badge-teal">XFN Partnership</span>
          <span className="text-xs text-muted-foreground">
            {XFN_QUESTIONS.length} questions
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Circular timer */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke="oklch(0.28 0.012 264)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={
                urgent
                  ? "oklch(0.65 0.22 25)"
                  : warning
                    ? "oklch(0.78 0.17 75)"
                    : "oklch(0.6 0.18 185)"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className={`font-mono text-base font-bold ${urgent ? "text-red-400" : warning ? "text-amber-400" : "text-teal-400"}`}
            >
              {mm}:{ss}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-foreground leading-relaxed">
            {q.q}
          </p>

          {/* XFN-specific STAR context */}
          <div className="flex gap-1.5 flex-wrap">
            {["S — Situation", "T — Task", "A — Action", "R — Result"].map(
              (label, i) => {
                const colors = [
                  "text-blue-400",
                  "text-amber-400",
                  "text-violet-400",
                  "text-emerald-400",
                ];
                return (
                  <span
                    key={label}
                    className={`text-xs font-semibold ${colors[i]}`}
                  >
                    {label}
                  </span>
                );
              }
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            {!running && !done && timeLeft === STAR_DURATION && (
              <button
                onClick={startTimer}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-400 text-xs font-semibold transition-all"
              >
                <Timer size={11} /> Start Timer
              </button>
            )}
            {running && (
              <button
                onClick={stopTimer}
                className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
              >
                Pause
              </button>
            )}
            <button
              onClick={() => setRevealed(rv => !rv)}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-xs font-semibold transition-all"
            >
              {revealed ? "Hide" : "Show"} Probes
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-semibold transition-all"
            >
              <SkipForward size={11} /> Skip
            </button>
          </div>

          {revealed && (
            <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300">
              <span className="font-bold text-teal-400">Hint: </span>
              {q.hint}
            </div>
          )}

          {(done || revealed) && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                Rate your answer:
              </span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button
                    key={s}
                    className={`star-btn ${(ratings[q.id] ?? 0) >= s ? "active" : ""}`}
                    onClick={() => {
                      onRate(q.id, s);
                      next();
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          )}

          {done && (
            <div className="text-xs font-semibold text-amber-400">
              ⏱ Time's up! Rate your answer above to continue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

//// ── Answer Scorer ─────────────────────────────────────────────────────────────────
function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-bold ${color}`}>{value}/5</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color.replace("text-", "bg-")}`}
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ── Behavioral Story Strength Tracker ──────────────────────────────────────────
function StoryStrengthTracker({
  ratings,
  storyHistory,
}: {
  ratings: Record<string, number>;
  storyHistory: Record<string, StoryRatingEntry[]>;
}) {
  const [expanded, setExpanded] = useState(false);

  const rated = BEHAVIORAL_QUESTIONS.filter(
    q => ratings[q.id] || (storyHistory[q.id]?.length ?? 0) > 0
  );
  if (rated.length === 0) {
    return (
      <div className="prep-card p-5">
        <div className="section-title">
          <span className="text-teal-400">📈</span> Behavioral Story Strength
          Tracker
        </div>
        <div className="text-center py-4 text-muted-foreground text-sm">
          <div className="text-3xl mb-2">📝</div>
          <div>No stories rated yet.</div>
          <div className="text-xs mt-1">
            Rate your answers below to track strength trends over time.
          </div>
        </div>
      </div>
    );
  }

  // Sort by current rating descending
  const sorted = [...rated].sort(
    (a, b) => (ratings[b.id] ?? 0) - (ratings[a.id] ?? 0)
  );

  // Sparkline SVG for a single question
  function Sparkline({ entries }: { entries: StoryRatingEntry[] }) {
    if (entries.length < 2) {
      return (
        <span className="text-xs text-muted-foreground">
          ({entries.length} rating)
        </span>
      );
    }
    const W = 80,
      H = 24,
      pad = 2;
    const vals = entries.map(e => e.rating);
    const min = 1,
      max = 5;
    const pts = vals
      .map((v, i) => {
        const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
        const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
        return `${x},${y}`;
      })
      .join(" ");
    const last = vals[vals.length - 1];
    const trend = vals.length >= 2 ? last - vals[vals.length - 2] : 0;
    const color = trend > 0 ? "#10b981" : trend < 0 ? "#ef4444" : "#6b7280";
    return (
      <svg width={W} height={H} className="shrink-0">
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {vals.map((v, i) => {
          const x = pad + (i / (vals.length - 1)) * (W - pad * 2);
          const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={i === vals.length - 1 ? 3 : 1.5}
              fill={color}
            />
          );
        })}
      </svg>
    );
  }

  const AREA_BADGE: Record<string, string> = {
    "Conflict & Influence": "text-red-400 bg-red-500/10 border-red-500/20",
    "Ownership & Ambiguity":
      "text-amber-400 bg-amber-500/10 border-amber-500/20",
    "Scale & Impact": "text-blue-400 bg-blue-500/10 border-blue-500/20",
    "Failure & Learning":
      "text-purple-400 bg-purple-500/10 border-purple-500/20",
  };

  const displayList = expanded ? sorted : sorted.slice(0, 5);

  return (
    <div className="prep-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-teal-400 text-lg">📈</span>
          <div>
            <div className="text-sm font-bold text-foreground">
              Behavioral Story Strength Tracker
            </div>
            <div className="text-xs text-muted-foreground">
              {rated.length} stories tracked · trend lines show improvement over
              time
            </div>
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      <div className="divide-y divide-border">
        {displayList.map(q => {
          const entries = storyHistory[q.id] ?? [];
          const current = ratings[q.id] ?? 0;
          const trend =
            entries.length >= 2
              ? entries[entries.length - 1].rating -
                entries[entries.length - 2].rating
              : 0;
          const trendIcon = trend > 0 ? "↑" : trend < 0 ? "↓" : "—";
          const trendColor =
            trend > 0
              ? "text-emerald-400"
              : trend < 0
                ? "text-red-400"
                : "text-muted-foreground";
          return (
            <div key={q.id} className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-foreground truncate">
                  {q.q.slice(0, 60)}
                  {q.q.length > 60 ? "…" : ""}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${AREA_BADGE[q.area] ?? "text-muted-foreground bg-secondary border-border"}`}
                  >
                    {q.area}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entries.length} rating{entries.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <Sparkline entries={entries} />
              <div className="text-right shrink-0">
                <div className="text-sm font-black text-foreground">
                  ★{current || "—"}
                </div>
                <div className={`text-xs font-bold ${trendColor}`}>
                  {trendIcon}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {sorted.length > 5 && (
        <div className="p-3 border-t border-border text-center">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? "Show less" : `Show all ${sorted.length} stories`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── XFN Story Builder ─────────────────────────────────────────────────────────────────
const XFN_TEMPLATES = [
  {
    id: "xfn_alignment",
    title: "Alignment Breakdown",
    scenario:
      "PM wanted to ship Feature X immediately; I needed 2 more weeks for reliability hardening",
    situation:
      "Our team was mid-sprint when PM escalated a request to ship Feature X by end of quarter. I believed the backend was not ready — we had 3 unresolved race conditions and no load-test data.",
    task: "I needed to either align with PM on a safe ship date or find a way to de-risk the feature fast enough to meet their deadline without compromising reliability.",
    action:
      "I set up a 30-min sync with PM and Data Science lead. I brought a one-pager with: (1) the specific risks and their blast radius, (2) a 2-week hardening plan with daily milestones, (3) a phased rollout option (1% → 10% → 100%) that let us ship on their date with a kill-switch. We agreed on the phased plan.",
    result:
      "Shipped on PM's date at 1% traffic. Caught a memory leak at 5% that would have been a P0 at full traffic. Full rollout 10 days later. PM credited the phased approach in the team retro.",
  },
  {
    id: "xfn_underperforming",
    title: "Underperforming XFN Partner",
    scenario:
      "Key Design partner was consistently missing review deadlines, blocking my team's sprint",
    situation:
      "My team's sprint velocity dropped 30% over 6 weeks because design specs were arriving 3–5 days late, causing engineers to context-switch or sit idle.",
    task: "I needed to unblock my team without damaging the relationship with Design, and without escalating prematurely.",
    action:
      "I had a 1:1 with the Design lead to understand their constraints — they were under-staffed and had no visibility into our sprint timelines. I proposed a shared Figma board with a 5-day design-freeze rule and a weekly 15-min sync. I also offered to have one of my engineers do rough wireframes for lower-priority tickets to reduce their load.",
    result:
      "Design latency dropped from 4.2 days avg to 0.8 days within 2 sprints. Team velocity recovered. Design lead later cited this as a model for XFN collaboration in their org.",
  },
  {
    id: "xfn_competing_goals",
    title: "Competing Goals Across Functions",
    scenario:
      "Legal wanted to block a feature; Growth wanted to ship it; I had to broker alignment",
    situation:
      "Growth team had a high-impact A/B test ready to launch. Legal flagged a potential GDPR compliance issue 2 days before launch. Both teams came to me as the tech lead to resolve it.",
    task: "I needed to find a path that satisfied Legal's compliance requirements without killing the experiment or delaying it by weeks.",
    action:
      "I facilitated a 3-way meeting with Growth PM, Legal counsel, and our Privacy engineer. I prepared a technical options doc: (1) full block, (2) geo-fence the test to non-EU users, (3) add explicit consent flow. Legal approved option 2 as compliant. I owned the geo-fencing implementation personally to keep the timeline.",
    result:
      "Launched on schedule in non-EU markets (80% of target audience). Experiment hit statistical significance in 12 days. EU launch followed 3 weeks later after consent flow was added.",
  },
];

interface XFNStoryBuilderProps {
  onPopulatePlanner?: (scope: string, outcome: string) => void;
}

function XFNStoryBuilder({ onPopulatePlanner }: XFNStoryBuilderProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    (typeof XFN_TEMPLATES)[0] | null
  >(null);
  const [story, setStory] = useState({
    situation: "",
    task: "",
    action: "",
    result: "",
  });
  const [saved, setSaved] = useState<Record<string, typeof story>>(() => {
    try {
      return JSON.parse(localStorage.getItem("meta_xfn_stories_v1") ?? "{}");
    } catch {
      return {};
    }
  });

  const loadTemplate = (t: (typeof XFN_TEMPLATES)[0]) => {
    setSelectedTemplate(t);
    setStory({
      situation: t.situation,
      task: t.task,
      action: t.action,
      result: t.result,
    });
  };

  const saveStory = () => {
    if (!selectedTemplate) return;
    const updated = { ...saved, [selectedTemplate.id]: story };
    setSaved(updated);
    localStorage.setItem("meta_xfn_stories_v1", JSON.stringify(updated));
    toast.success("XFN story saved!");
  };

  const populatePlanner = () => {
    if (!selectedTemplate || !onPopulatePlanner) return;
    onPopulatePlanner(
      `XFN scenario: ${selectedTemplate.scenario}\n\nSituation: ${story.situation}`,
      story.result
    );
    toast.success("Populated Tech Retro Planner with scope & outcome!");
  };

  return (
    <div className="prep-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-teal-400 text-lg">🤝</span>
          <div>
            <div className="text-sm font-bold text-foreground">
              XFN Story Builder
            </div>
            <div className="text-xs text-muted-foreground">
              3 STAR templates for XFN scenarios · auto-populates Tech Retro
              Planner
            </div>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            open
              ? "bg-teal-500/20 border-teal-500/40 text-teal-400"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {open ? "✕ Close" : "Build Story"}
        </button>
      </div>

      {open && (
        <div className="p-4 space-y-4">
          {/* Template picker */}
          <div>
            <div className="text-xs font-bold text-teal-400 mb-2">
              Choose a scenario template:
            </div>
            <div className="grid gap-2">
              {XFN_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    selectedTemplate?.id === t.id
                      ? "bg-teal-500/15 border-teal-500/40 text-teal-300"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-teal-500/30"
                  }`}
                >
                  <div className="text-xs font-bold mb-0.5">{t.title}</div>
                  <div className="text-[11px] opacity-75 italic">
                    “{t.scenario}”
                  </div>
                  {saved[t.id] && (
                    <span className="text-[10px] text-emerald-400 mt-1 block">
                      ✓ Saved
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* STAR editor */}
          {selectedTemplate && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-teal-400">
                Edit your STAR story:
              </div>
              {(
                [
                  ["situation", "S — Situation", "text-blue-400"],
                  ["task", "T — Task", "text-amber-400"],
                  ["action", "A — Action", "text-violet-400"],
                  ["result", "R — Result", "text-emerald-400"],
                ] as [keyof typeof story, string, string][]
              ).map(([k, label, color]) => (
                <div key={k}>
                  <label className={`text-xs font-bold block mb-1 ${color}`}>
                    {label}
                  </label>
                  <textarea
                    value={story[k]}
                    onChange={e =>
                      setStory(s => ({ ...s, [k]: e.target.value }))
                    }
                    rows={3}
                    className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-teal-500/50 resize-none placeholder:text-muted-foreground/50 leading-relaxed"
                  />
                </div>
              ))}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={saveStory}
                  className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-400 text-xs font-bold transition-all"
                >
                  💾 Save Story
                </button>
                {onPopulatePlanner && (
                  <button
                    onClick={populatePlanner}
                    className="px-3 py-1.5 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-xs font-bold transition-all"
                  >
                    💼 → Populate Tech Retro Planner
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Technical Retrospective Project Planner ────────────────────────────────────────────
const EMPTY_PROJECT: Omit<TechRetroProject, "id" | "createdAt"> = {
  name: "",
  scope: "",
  tradeoffs: "",
  biggestBug: "",
  outcome: "",
  lessonsLearned: "",
};

function TechRetroPlanner({
  prePopulate,
}: {
  prePopulate?: { scope: string; outcome: string } | null;
}) {
  const [projects, setProjects] = useTechRetroProjects();
  const [open, setOpen] = useState(false);
  const [form, setForm] =
    useState<Omit<TechRetroProject, "id" | "createdAt">>(EMPTY_PROJECT);
  const [editId, setEditId] = useState<string | null>(null);

  // Auto-open and pre-fill when XFN Story Builder populates
  useEffect(() => {
    if (prePopulate) {
      setForm(f => ({
        ...f,
        scope: prePopulate.scope,
        outcome: prePopulate.outcome,
      }));
      setEditId(null);
      setOpen(true);
    }
  }, [prePopulate]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [coachProjectId, setCoachProjectId] = useState<string | null>(null);
  const [coachQuestions, setCoachQuestions] = useState<string[]>([]);
  const coachMutation = trpc.ai.techRetroCoach.useMutation();
  const scoreMutation = trpc.collab.scoreAnswer.useMutation();

  type QuestionScore = {
    specificity: number;
    impactClarity: number;
    level: string;
    coachingNote: string;
    strengths: string;
    improvements: string;
  };
  const [coachAnswers, setCoachAnswers] = useState<Record<number, string>>({});
  const [coachScores, setCoachScores] = useState<Record<number, QuestionScore>>(
    {}
  );
  const [scoringIdx, setScoringIdx] = useState<number | null>(null);

  const scoreCoachAnswer = async (questionIdx: number, question: string) => {
    const answer = coachAnswers[questionIdx];
    if (!answer?.trim()) {
      toast.error("Please write an answer first.");
      return;
    }
    setScoringIdx(questionIdx);
    try {
      const result = await scoreMutation.mutateAsync({ question, answer });
      setCoachScores(s => ({ ...s, [questionIdx]: result }));
    } catch {
      toast.error("Scoring failed. Please try again.");
    } finally {
      setScoringIdx(null);
    }
  };

  const runAICoach = async (p: TechRetroProject) => {
    setCoachProjectId(p.id);
    setCoachQuestions([]);
    setCoachAnswers({});
    setCoachScores({});
    try {
      const result = await coachMutation.mutateAsync({
        name: p.name,
        scope: p.scope,
        tradeoffs: p.tradeoffs,
        biggestBug: p.biggestBug,
        outcome: p.outcome,
        lessonsLearned: p.lessonsLearned,
      });
      setCoachQuestions(result.questions);
    } catch {
      toast.error("AI Coach failed. Please try again.");
      setCoachProjectId(null);
    }
  };

  const set = (k: keyof typeof EMPTY_PROJECT, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    if (editId) {
      setProjects(ps => ps.map(p => (p.id === editId ? { ...p, ...form } : p)));
      toast.success("Project updated!");
    } else {
      setProjects(ps => [
        ...ps,
        { ...form, id: nanoid(), createdAt: Date.now() },
      ]);
      toast.success("Project saved!");
    }
    setForm(EMPTY_PROJECT);
    setEditId(null);
    setOpen(false);
  };

  const handleEdit = (p: TechRetroProject) => {
    setForm({
      name: p.name,
      scope: p.scope,
      tradeoffs: p.tradeoffs,
      biggestBug: p.biggestBug,
      outcome: p.outcome,
      lessonsLearned: p.lessonsLearned,
    });
    setEditId(p.id);
    setOpen(true);
  };

  const handleDelete = (id: string) => {
    setProjects(ps => ps.filter(p => p.id !== id));
    toast.success("Project deleted.");
  };

  const exportExcalidraw = (p: TechRetroProject) => {
    // Generate Excalidraw-compatible JSON with text elements arranged as a structured outline
    const elements: object[] = [];
    let y = 0;
    const addText = (
      text: string,
      x: number,
      fontSize: number,
      color: string,
      bold: boolean
    ) => {
      elements.push({
        type: "text",
        id: nanoid(),
        x,
        y,
        width: 700,
        height: fontSize * 1.5,
        angle: 0,
        strokeColor: color,
        backgroundColor: "transparent",
        fillStyle: "solid",
        strokeWidth: 1,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 0,
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        text,
        fontSize,
        fontFamily: 1,
        textAlign: "left",
        verticalAlign: "top",
        containerId: null,
        originalText: text,
        lineHeight: 1.25,
        baseline: fontSize,
        fontWeight: bold ? "bold" : "normal",
      });
      y += fontSize * 2;
    };
    const addRect = (label: string, accentColor: string) => {
      elements.push({
        type: "rectangle",
        id: nanoid(),
        x: -10,
        y: y - 4,
        width: 720,
        height: 28,
        angle: 0,
        strokeColor: accentColor,
        backgroundColor: accentColor + "22",
        fillStyle: "solid",
        strokeWidth: 1.5,
        strokeStyle: "solid",
        roughness: 0,
        opacity: 80,
        groupIds: [],
        frameId: null,
        roundness: { type: 3 },
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 0,
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
      });
    };

    const sections: [string, string, string][] = [
      ["Project Name", p.name, "#8b5cf6"],
      ["Scope", p.scope, "#3b82f6"],
      ["Key Trade-offs", p.tradeoffs, "#f59e0b"],
      ["Biggest Bug / Incident", p.biggestBug, "#ef4444"],
      ["Outcome & Impact", p.outcome, "#10b981"],
      ["Lessons Learned", p.lessonsLearned, "#06b6d4"],
    ];

    sections.forEach(([label, value, color]) => {
      addRect(label, color);
      addText(label.toUpperCase(), 0, 13, color, true);
      value
        .split("\n")
        .forEach(line => addText(line || " ", 20, 14, "#e2e8f0", false));
      y += 16;
    });

    const excalidrawData = {
      type: "excalidraw",
      version: 2,
      source: "meta-prep-guide",
      elements,
      appState: { viewBackgroundColor: "#0f172a", gridSize: null },
      files: {},
    };

    const blob = new Blob([JSON.stringify(excalidrawData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tech-retro-${p.name.replace(/\s+/g, "-").toLowerCase()}.excalidraw`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported! Open in excalidraw.com → File → Open");
  };

  return (
    <div className="prep-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-violet-400 text-lg">💼</span>
          <div>
            <div className="text-sm font-bold text-foreground">
              Technical Retrospective Project Planner
            </div>
            <div className="text-xs text-muted-foreground">
              {projects.length} project{projects.length !== 1 ? "s" : ""} saved
              · exports Excalidraw-ready outline
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            setForm(EMPTY_PROJECT);
            setEditId(null);
            setOpen(o => !o);
          }}
          className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
            open
              ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {open ? "✕ Cancel" : "+ New Project"}
        </button>
      </div>

      {/* Form */}
      {open && (
        <div className="p-4 border-b border-border space-y-3 bg-violet-500/5">
          <div className="text-xs font-bold text-violet-400 mb-1">
            Fill in your project details for the Technical Retrospective round
          </div>
          {(
            [
              [
                "name",
                "Project Name *",
                "e.g. Ads Ranking Revamp, Feed Integrity Pipeline",
              ],
              [
                "scope",
                "Scope & Scale",
                "e.g. 3 engineers, 6 months, 10M users affected, $2M infra cost",
              ],
              [
                "tradeoffs",
                "Key Trade-offs",
                "e.g. Consistency vs latency, build vs buy, monolith vs microservices",
              ],
              [
                "biggestBug",
                "Biggest Bug / Incident",
                "e.g. Race condition in distributed lock, caused 2h outage, P0",
              ],
              [
                "outcome",
                "Outcome & Impact",
                "e.g. 40% latency reduction, 2× throughput, $500k/yr savings",
              ],
              [
                "lessonsLearned",
                "Lessons Learned",
                "e.g. Should have load-tested earlier, needed clearer ownership boundaries",
              ],
            ] as [keyof typeof EMPTY_PROJECT, string, string][]
          ).map(([k, label, placeholder]) => (
            <div key={k}>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                {label}
              </label>
              <textarea
                value={form[k]}
                onChange={e => set(k, e.target.value)}
                placeholder={placeholder}
                rows={k === "tradeoffs" || k === "lessonsLearned" ? 3 : 2}
                className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-violet-500/50 resize-none placeholder:text-muted-foreground/50 leading-relaxed"
              />
            </div>
          ))}
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 text-sm font-bold transition-all"
          >
            {editId ? "Update Project" : "Save Project"}
          </button>
        </div>
      )}

      {/* Saved projects */}
      {projects.length > 0 && (
        <div className="divide-y divide-border">
          {projects.map(p => (
            <div key={p.id}>
              <div
                className="p-3 flex items-center gap-3 cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => setExpandedId(id => (id === p.id ? null : p.id))}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-foreground truncate">
                    {p.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {p.scope || "No scope defined"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      runAICoach(p);
                    }}
                    disabled={
                      coachMutation.isPending && coachProjectId === p.id
                    }
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all disabled:opacity-60"
                  >
                    {coachMutation.isPending && coachProjectId === p.id
                      ? "⏳ Thinking…"
                      : "🤖 AI Coach"}
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      exportExcalidraw(p);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold transition-all"
                  >
                    🎨 Export
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleEdit(p);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors text-xs px-1"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(p.id);
                    }}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                  {expandedId === p.id ? (
                    <ChevronUp size={14} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={14} className="text-muted-foreground" />
                  )}
                </div>
              </div>
              {expandedId === p.id && (
                <div className="px-4 pb-4 space-y-3 bg-secondary/30">
                  {(
                    [
                      ["Key Trade-offs", p.tradeoffs, "text-amber-400"],
                      ["Biggest Bug / Incident", p.biggestBug, "text-red-400"],
                      ["Outcome & Impact", p.outcome, "text-emerald-400"],
                      ["Lessons Learned", p.lessonsLearned, "text-cyan-400"],
                    ] as [string, string, string][]
                  )
                    .filter(([, v]) => v)
                    .map(([label, value, color]) => (
                      <div key={label}>
                        <div className={`text-xs font-bold mb-1 ${color}`}>
                          {label}
                        </div>
                        <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                          {value}
                        </div>
                      </div>
                    ))}
                  {/* AI Coach results with Answer Evaluator */}
                  {coachProjectId === p.id && coachQuestions.length > 0 && (
                    <div className="mt-2 space-y-3">
                      <div className="text-xs font-bold text-emerald-400">
                        🤖 AI Coach — Practice answering these 3 follow-up
                        questions:
                      </div>
                      {coachQuestions.map((cq, i) => {
                        const score = coachScores[i];
                        return (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2"
                          >
                            <div className="flex gap-2">
                              <span className="text-emerald-400 font-black text-xs shrink-0 mt-0.5">
                                Q{i + 1}.
                              </span>
                              <span className="text-xs text-foreground leading-relaxed font-medium">
                                {cq}
                              </span>
                            </div>
                            <textarea
                              value={coachAnswers[i] ?? ""}
                              onChange={e =>
                                setCoachAnswers(a => ({
                                  ...a,
                                  [i]: e.target.value,
                                }))
                              }
                              placeholder="Write your STAR answer here…"
                              rows={3}
                              className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-emerald-500/50 resize-none placeholder:text-muted-foreground/50 leading-relaxed"
                            />
                            <button
                              onClick={() => scoreCoachAnswer(i, cq)}
                              disabled={scoringIdx === i}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition-all disabled:opacity-60"
                            >
                              {scoringIdx === i
                                ? "⏳ Scoring…"
                                : "📊 Score My Answer"}
                            </button>
                            {score && (
                              <div className="mt-2 space-y-2 p-3 rounded-lg bg-background/60 border border-border">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-foreground">
                                    AI Score
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      score.level === "L7"
                                        ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                                        : score.level === "L6"
                                          ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                          : "bg-secondary text-muted-foreground border-border"
                                    }`}
                                  >
                                    {score.level}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-muted-foreground">
                                        Specificity
                                      </span>
                                      <span className="font-bold text-blue-400">
                                        {score.specificity}/5
                                      </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-blue-400 transition-all duration-700"
                                        style={{
                                          width: `${(score.specificity / 5) * 100}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-xs mb-1">
                                      <span className="text-muted-foreground">
                                        Impact Clarity
                                      </span>
                                      <span className="font-bold text-emerald-400">
                                        {score.impactClarity}/5
                                      </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                                      <div
                                        className="h-full rounded-full bg-emerald-400 transition-all duration-700"
                                        style={{
                                          width: `${(score.impactClarity / 5) * 100}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                {score.coachingNote && (
                                  <div className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-2">
                                    <span className="font-bold text-foreground">
                                      Coach:{" "}
                                    </span>
                                    {score.coachingNote}
                                  </div>
                                )}
                                {score.strengths && (
                                  <div className="text-xs text-emerald-400 leading-relaxed">
                                    <span className="font-bold">
                                      ✅ Strengths:{" "}
                                    </span>
                                    {score.strengths}
                                  </div>
                                )}
                                {score.improvements && (
                                  <div className="text-xs text-amber-400 leading-relaxed">
                                    <span className="font-bold">
                                      💡 Improve:{" "}
                                    </span>
                                    {score.improvements}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground pt-1">
                    Saved {new Date(p.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {projects.length === 0 && !open && (
        <div className="p-6 text-center text-muted-foreground text-sm">
          <div className="text-3xl mb-2">💼</div>
          <div>No projects yet.</div>
          <div className="text-xs mt-1">
            Add a project to prepare your Technical Retrospective story and
            export it as an Excalidraw diagram.
          </div>
        </div>
      )}
    </div>
  );
}

function AnswerScorer() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [icTarget, setIcTarget] = useState<"L5" | "L6" | "L7">("L6");
  const [result, setResult] = useState<{
    specificity: number;
    impact: number;
    levelFit: number;
    overall: number;
    strengths: string[];
    improvements: string[];
  } | null>(null);

  const scoreMutation = trpc.ctci.scoreAnswer.useMutation({
    onSuccess: data => setResult(data),
    onError: () => toast.error("Scoring failed. Try again."),
  });

  const handleScore = () => {
    if (!question.trim() || !answer.trim()) {
      toast.error("Please enter both a question and your answer.");
      return;
    }
    setResult(null);
    scoreMutation.mutate({
      question: question.trim(),
      answer: answer.trim(),
      icTarget,
    });
  };

  return (
    <div className="prep-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 group"
      >
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-sm font-bold text-foreground">
            AI Answer Scorer
          </span>
          <span className="badge badge-amber">LLM</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Paste a STAR answer → get rubric scores</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
          {/* IC Target selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground shrink-0">
              Target level:
            </span>
            {(["L5", "L6", "L7"] as const).map(ic => (
              <button
                key={ic}
                onClick={() => setIcTarget(ic)}
                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                  icTarget === ic
                    ? "bg-blue-600 border-blue-500 text-white"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>

          {/* Question input */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Behavioral Question
            </label>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Tell me about a time you influenced without authority"
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
            />
          </div>

          {/* Answer textarea */}
          <div>
            <label className="text-xs font-bold text-muted-foreground block mb-1">
              Your STAR Answer
            </label>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Situation: ...
Task: ...
Action: ...
Result: ..."
              rows={8}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
            />
            {/* Word count + pacing guide */}
            {(() => {
              const words = answer.trim()
                ? answer.trim().split(/\s+/).length
                : 0;
              const estSecs = Math.round(words / 2.5); // ~150 wpm speaking pace
              const mins = Math.floor(estSecs / 60);
              const secs = estSecs % 60;
              const color =
                words < 100
                  ? "text-amber-400"
                  : words <= 350
                    ? "text-emerald-400"
                    : "text-red-400";
              const label =
                words < 100
                  ? "Too short"
                  : words <= 250
                    ? "Good length"
                    : words <= 350
                      ? "Detailed"
                      : "Too long";
              return (
                <div className="flex items-center justify-between mt-1.5">
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-semibold ${color}`}>
                      {words} words — {label}
                    </span>
                    <span className="text-muted-foreground">
                      ~{mins > 0 ? `${mins}m ` : ""}
                      {secs}s to speak
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-amber-400">&lt;100 short</span>
                    <span className="text-emerald-400">100–250 ideal</span>
                    <span className="text-red-400">&gt;350 too long</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Score button */}
          <button
            onClick={handleScore}
            disabled={scoreMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black text-sm font-bold transition-all"
          >
            <Zap size={13} />
            {scoreMutation.isPending ? "Scoring with AI…" : "Score This Answer"}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-4 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  Score Results — {icTarget} Rubric
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span
                      key={s}
                      className={
                        s <= result.overall
                          ? "text-amber-400"
                          : "text-muted-foreground/30"
                      }
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-sm font-extrabold text-amber-400 ml-1">
                    {result.overall}/5
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                <ScoreBar
                  label="Specificity (concrete metrics, names, dates)"
                  value={result.specificity}
                  color="text-blue-400"
                />
                <ScoreBar
                  label="Impact (measurable business/technical outcome)"
                  value={result.impact}
                  color="text-emerald-400"
                />
                <ScoreBar
                  label={`IC-Level Fit (${icTarget} scope & ownership)`}
                  value={result.levelFit}
                  color="text-purple-400"
                />
              </div>
              {result.strengths.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-emerald-400 mb-1">
                    ✅ Strengths
                  </div>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex gap-2"
                      >
                        <span className="text-emerald-400 shrink-0">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.improvements.length > 0 && (
                <div>
                  <div className="text-xs font-bold text-amber-400 mb-1">
                    💡 Improvements
                  </div>
                  <ul className="space-y-1">
                    {result.improvements.map((s, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex gap-2"
                      >
                        <span className="text-amber-400 shrink-0">•</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main BehavioralTab ─────────────────────────────────────────────────
export default function BehavioralTab() {
  const [ratings, setRatings] = useBehavioralRatings();
  const [history, setHistory] = useMockHistory();
  const [storyHistory, setStoryHistory] = useStoryStrengthHistory();

  // DB sync for BQ ratings
  const bqDbSynced = useRef(false);
  const { data: dbRatingsData } = trpc.ratings.getAll.useQuery(undefined, {
    retry: false,
  });
  const saveBqRatingsMutation = trpc.ratings.saveBqRatings.useMutation();

  // Load from DB on mount — merge DB ratings into localStorage (DB wins for higher ratings)
  useEffect(() => {
    if (dbRatingsData?.bqRatings && !bqDbSynced.current) {
      bqDbSynced.current = true;
      setRatings(local => {
        const merged = { ...local };
        for (const [k, v] of Object.entries(dbRatingsData.bqRatings!)) {
          if ((v ?? 0) > (local[k] ?? 0)) merged[k] = v;
        }
        return merged;
      });
    }
  }, [dbRatingsData, setRatings]);
  const [search, setSearch] = useState("");
  const [filterArea, setFilterArea] = useState("All");
  const [filterTier, setFilterTier] = useState("All");
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  // STAR answer drafts per question
  const [starDrafts, setStarDrafts] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem("star_drafts_v1") ?? "{}");
    } catch {
      return {};
    }
  });
  const saveStarDraft = (id: string, text: string) => {
    const updated = { ...starDrafts, [id]: text };
    setStarDrafts(updated);
    localStorage.setItem("star_drafts_v1", JSON.stringify(updated));
  };
  // STAR version history: id → [{timestamp, text}]
  const [starVersions, setStarVersions] = useState<
    Record<string, Array<{ timestamp: number; text: string }>>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("star_versions_v1") ?? "{}");
    } catch {
      return {};
    }
  });
  const saveStarVersion = (id: string, text: string) => {
    if (!text.trim()) return;
    const prev = starVersions[id] ?? [];
    const updated = {
      ...starVersions,
      [id]: [...prev, { timestamp: Date.now(), text }].slice(-5),
    };
    setStarVersions(updated);
    localStorage.setItem("star_versions_v1", JSON.stringify(updated));
    toast.success("Version saved!");
  };
  const [showVersions, setShowVersions] = useState<string | null>(null);
  // Surprise Me randomizer
  const handleSurpriseMe = () => {
    const unrated = BEHAVIORAL_QUESTIONS.filter(
      q => !ratings[q.id] || ratings[q.id] < 3
    );
    const pool = unrated.length > 0 ? unrated : BEHAVIORAL_QUESTIONS;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setExpandedQ(pick.id);
    setTimeout(() => {
      const el = document.getElementById(`bq-${pick.id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };
  const [showMock, setShowMock] = useState(false);
  const [showPractice, setShowPractice] = useState(false);
  const [showSurprise, setShowSurprise] = useState(false);
  const [showXFNSurprise, setShowXFNSurprise] = useState(false);
  const [xfnPrePopulate, setXfnPrePopulate] = useState<{
    scope: string;
    outcome: string;
  } | null>(null);

  const handleRate = (id: string, v: number) => {
    const updatedRatings = { ...ratings, [id]: v };
    setRatings(r => ({ ...r, [id]: v }));
    // Persist to DB if logged in
    if (bqDbSynced.current) {
      saveBqRatingsMutation.mutate({ ratings: updatedRatings });
    }
    setStoryHistory(h => ({
      ...h,
      [id]: [...(h[id] ?? []), { timestamp: Date.now(), rating: v }].slice(-20),
    }));
  };

  const handleMockComplete = (session: MockSession) => {
    setHistory(h => [...h, session]);
    toast.success(
      `Mock session saved! Average: ★${session.avgScore.toFixed(1)}`
    );
    setShowMock(false);
  };

  const filtered = BEHAVIORAL_QUESTIONS.filter(q => {
    const s = search.toLowerCase();
    return (
      (filterArea === "All" || q.area === filterArea) &&
      (filterTier === "All" || (q as any).tier === filterTier) &&
      (!s || q.q.toLowerCase().includes(s) || q.hint.toLowerCase().includes(s))
    );
  });

  return (
    <div className="space-y-5">
      {/* ═══ HIGH IMPACT FEATURES — TOP OF PAGE ═══════════════════════════════ */}
      <FeatureHeatmapRow
        featureKeys={[
          "story_coverage_matrix",
          "interviewer_persona_stress",
          "adversarial_review",
        ]}
      />
      <StoryCoverageMatrix />
      <InterviewerPersonaStressTest />
      <ImpactQuantificationCoach />
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Quick Actions sticky row */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-background/90 backdrop-blur-sm border-b border-border flex items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block">
          Quick Actions
        </span>
        <div className="flex gap-2 flex-1 flex-wrap">
          <button
            onClick={() => {
              const el = document.getElementById("behavioral-voice-star");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
          >
            <Brain size={12} />
            Record STAR Answer
            <kbd className="ml-1 px-1 py-0.5 rounded text-[9px] font-mono bg-emerald-900/40 text-emerald-400 border border-emerald-700/40">
              ⌥3
            </kbd>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("behavioral-xfn-mock");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all"
          >
            <Zap size={12} />
            Start XFN Mock
          </button>
          <button
            onClick={handleSurpriseMe}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
          >
            <Shuffle size={12} />
            Surprise Me
          </button>
        </div>
        <button
          onClick={() =>
            window.dispatchEvent(
              new KeyboardEvent("keydown", { key: "?", bubbles: true })
            )
          }
          title="Keyboard shortcuts (?)"
          className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0"
        >
          <HelpCircle size={13} />
        </button>
      </div>
      {/* XFN Story Builder */}
      <XFNStoryBuilder
        onPopulatePlanner={(scope, outcome) =>
          setXfnPrePopulate({ scope, outcome })
        }
      />
      {/* Technical Retrospective Project Planner */}
      <TechRetroPlanner prePopulate={xfnPrePopulate} />
      {/* XFN Behavioral Mock Session */}
      <div id="behavioral-xfn-mock">
        <BehavioralMockSession />
      </div>

      {/* ===== L7 EXCLUSIVE: TECHNICAL RETROSPECTIVE + XFN PARTNERSHIP ===== */}
      <div
        className="relative overflow-hidden rounded-xl"
        style={{
          background:
            "linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #1e3a5f 60%, #0f172a 100%)",
          boxShadow:
            "0 0 40px rgba(139,92,246,0.3), 0 0 80px rgba(59,130,246,0.15)",
          border: "2px solid transparent",
          backgroundClip: "padding-box",
        }}
      >
        {/* Animated gradient border overlay */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, #8b5cf6, #3b82f6, #06b6d4, #8b5cf6)",
            backgroundSize: "300% 100%",
            animation: "gradientShift 4s linear infinite",
            padding: "2px",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        <div className="relative p-5">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="text-3xl animate-bounce">🎤</div>
            <div>
              <div className="text-lg font-black text-white tracking-tight">
                L7 EXCLUSIVE INTERVIEW ROUNDS
              </div>
              <div className="text-xs font-bold text-violet-300">
                Technical Retrospective · XFN Partnership · MUST PREPARE ‼️
              </div>
            </div>
            <div className="ml-auto flex gap-1.5 flex-wrap justify-end">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-violet-500/30 text-violet-200 border border-violet-500/50 animate-pulse">
                L7 ONLY
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-200 border border-blue-500/50">
                45 MIN EACH
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* === TECHNICAL RETROSPECTIVE === */}
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">1️⃣</span>
                <div>
                  <div className="text-sm font-black text-violet-200">
                    Technical Retrospective
                  </div>
                  <div className="text-[10px] text-violet-400">
                    45-min discussion · NOT a presentation · Excalidraw
                    preferred
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-bold text-white mb-1.5">
                    📋 What to Prepare
                  </div>
                  <ul className="space-y-1 text-slate-300">
                    <li>
                      • Choose a{" "}
                      <strong className="text-violet-300">
                        recent project spanning 18–24 months
                      </strong>{" "}
                      at L7 scope
                    </li>
                    <li>
                      • Prepare an{" "}
                      <strong className="text-violet-300">
                        alternative backup project
                      </strong>{" "}
                      (in case of NDA)
                    </li>
                    <li>
                      • Focus on{" "}
                      <strong className="text-violet-300">
                        production projects
                      </strong>
                      , not toy ones
                    </li>
                    <li>
                      • Prepare: high-level architecture, low-level details,
                      trade-offs, metrics, roadblocks
                    </li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-bold text-white mb-1.5">
                    🎯 Evaluation Criteria
                  </div>
                  <ul className="space-y-1 text-slate-300">
                    <li>
                      •{" "}
                      <strong className="text-violet-300">
                        Technical depth & breadth
                      </strong>{" "}
                      — box diagram → nitty-gritty details
                    </li>
                    <li>
                      •{" "}
                      <strong className="text-violet-300">
                        Context-setting
                      </strong>{" "}
                      — communicate the technical landscape clearly
                    </li>
                    <li>
                      •{" "}
                      <strong className="text-violet-300">
                        System architecture & trade-offs
                      </strong>{" "}
                      — good judgment in design decisions
                    </li>
                    <li>
                      • <strong className="text-violet-300">Scope</strong> —
                      does the project reflect L7-level impact?
                    </li>
                  </ul>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <div className="font-bold text-emerald-400 mb-1">✅ DO</div>
                    <ul className="space-y-0.5 text-slate-300">
                      <li>• Show breadth AND depth</li>
                      <li>• Discuss what you'd do differently</li>
                      <li>• Talk about biggest bug / SEV</li>
                      <li>
                        • Use{" "}
                        <strong className="text-emerald-300">Excalidraw</strong>{" "}
                        live
                      </li>
                      <li>• Prepare code samples</li>
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="font-bold text-red-400 mb-1">❌ DON'T</div>
                    <ul className="space-y-0.5 text-slate-300">
                      <li>• No slide decks</li>
                      <li>• Don't over-explain biz context</li>
                      <li>• Don't pick early-career projects</li>
                      <li>• Don't rehearse a pitch</li>
                      <li>• Don't claim no mistakes</li>
                    </ul>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                  <span className="font-bold">💡 Pro tip:</span> Drawing live on{" "}
                  <a
                    href="https://excalidraw.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-amber-300 hover:text-amber-100"
                  >
                    Excalidraw
                  </a>{" "}
                  is <strong>preferred</strong> — practice before your
                  interview!
                </div>
              </div>
            </div>

            {/* === XFN PARTNERSHIP === */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">2️⃣</span>
                <div>
                  <div className="text-sm font-black text-blue-200">
                    XFN Partnership & Communication
                  </div>
                  <div className="text-[10px] text-blue-400">
                    Discussion Q&A · ~5 questions + follow-ups
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-bold text-white mb-1.5">
                    📋 5 Core Competencies
                  </div>
                  <ul className="space-y-1 text-slate-300">
                    <li>
                      •{" "}
                      <strong className="text-blue-300">
                        Building & maintaining XFN relationships
                      </strong>{" "}
                      — mutual respect, shared impact
                    </li>
                    <li>
                      •{" "}
                      <strong className="text-blue-300">
                        Working through conflict
                      </strong>{" "}
                      — competing goals, misalignment
                    </li>
                    <li>
                      •{" "}
                      <strong className="text-blue-300">
                        Communicating effectively
                      </strong>{" "}
                      — keeping teams aligned, gathering feedback
                    </li>
                    <li>
                      •{" "}
                      <strong className="text-blue-300">
                        Strategic thinking
                      </strong>{" "}
                      — your process & approach to partnerships
                    </li>
                    <li>
                      •{" "}
                      <strong className="text-blue-300">
                        Influencing at scale
                      </strong>{" "}
                      — driving outcomes without direct authority
                    </li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="font-bold text-white mb-1.5">
                    ❓ Example Questions to Prepare
                  </div>
                  <ul className="space-y-1 text-slate-300">
                    <li>
                      • Tell me about an XFN partnership that went well. What
                      could have gone better?
                    </li>
                    <li>
                      • Who's the most challenging person you've worked with?
                      What would they say about you?
                    </li>
                    <li>
                      • Walk me through a project requiring multi-function
                      collaboration.
                    </li>
                    <li>
                      • When have you managed through competing goals or lack of
                      alignment?
                    </li>
                    <li>
                      • Have you had a key XFN partner who was underperforming?
                      How did you handle it?
                    </li>
                    <li>
                      • What were your go-to methods for communicating? Have any
                      ever backfired?
                    </li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <div className="font-bold text-cyan-300 mb-1.5">
                    🏆 L7-Level Expectations
                  </div>
                  <ul className="space-y-1 text-slate-300">
                    <li>
                      • Cross-org collaboration at{" "}
                      <strong className="text-cyan-300">
                        significant scale
                      </strong>
                    </li>
                    <li>
                      • Influencing decisions{" "}
                      <strong className="text-cyan-300">
                        without direct authority
                      </strong>
                    </li>
                    <li>
                      • Managing through{" "}
                      <strong className="text-cyan-300">
                        complexity and ambiguity
                      </strong>
                    </li>
                    <li>
                      • Building trust with diverse stakeholders (PMs,
                      designers, data scientists)
                    </li>
                  </ul>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <div className="font-bold text-emerald-400 mb-1">
                    ✅ Tips for Success
                  </div>
                  <ul className="space-y-0.5 text-slate-300">
                    <li>
                      • Have{" "}
                      <strong className="text-emerald-300">
                        2–3 strong, detailed examples
                      </strong>{" "}
                      ready covering different aspects
                    </li>
                    <li>
                      • Be specific about{" "}
                      <strong className="text-emerald-300">YOUR role</strong>{" "}
                      and actions, not just the team's
                    </li>
                    <li>
                      • Show{" "}
                      <strong className="text-emerald-300">
                        self-awareness
                      </strong>{" "}
                      — what you learned and would do differently
                    </li>
                    <li>
                      • Balance breadth & depth; stay responsive to follow-up
                      questions
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* General Tips Footer */}
          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="font-bold text-white text-xs mb-2">
              📋 General Tips for Both Interviews
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-300">
              <div>
                ⏱️ <strong className="text-white">Time management</strong> —
                manage both time and depth
              </div>
              <div>
                💬 <strong className="text-white">Be interactive</strong> —
                discussions, not monologues
              </div>
              <div>
                🪞 <strong className="text-white">Show self-reflection</strong>{" "}
                — candid reflections on mistakes
              </div>
              <div>
                🕐 <strong className="text-white">Stay recent</strong> — use
                most recent, relevant examples
              </div>
              <div>
                🎨 <strong className="text-white">Prepare Excalidraw</strong> —
                practice at{" "}
                <a
                  href="https://excalidraw.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-blue-300"
                >
                  excalidraw.com
                </a>
              </div>
              <div>
                🎯 <strong className="text-white">L7 scope</strong> — every
                example should reflect L7-level impact
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Answer Scorer */}
      <AnswerScorer />

      {/* Meta Values */}
      <div className="prep-card p-5">
        <div className="section-title">
          <Brain size={14} className="text-purple-400" />
          Meta's Core Values
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {META_VALUES.map(v => (
            <div
              key={v.name}
              className="p-3 rounded-lg bg-secondary border border-border"
            >
              <div className="text-xs font-bold text-foreground mb-1">
                {v.name}
              </div>
              <div className="text-xs text-muted-foreground">{v.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* L6 vs L7 Comparison */}
      <div className="prep-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="section-title mb-0 pb-0 border-0">
            L6 vs L7 Behavioral Expectations
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Dimension
                </th>
                <th className="text-left p-3 text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  L6 — Staff Engineer
                </th>
                <th className="text-left p-3 text-xs font-semibold text-purple-400 uppercase tracking-wider">
                  L7 — Senior Staff Engineer
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {IC_COMPARISON.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-secondary/30" : ""}>
                  <td className="p-3 text-xs font-semibold text-foreground">
                    {row.dimension}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {row.ic6}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {row.ic7}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Practice / Mock / Surprise buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => {
            setShowPractice(p => !p);
            setShowMock(false);
            setShowSurprise(false);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${showPractice ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
        >
          <Play size={13} /> Practice Mode
        </button>
        <button
          onClick={() => {
            setShowMock(m => !m);
            setShowPractice(false);
            setShowSurprise(false);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${showMock ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
        >
          <Brain size={13} /> Full Mock Session
        </button>
        <button
          onClick={() => {
            setShowSurprise(s => !s);
            setShowPractice(false);
            setShowMock(false);
            setShowXFNSurprise(false);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
            showSurprise
              ? "bg-pink-500/20 border-pink-500/40 text-pink-400"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Shuffle size={13} /> Surprise Me
        </button>
        <button
          onClick={() => {
            setShowXFNSurprise(s => !s);
            setShowPractice(false);
            setShowMock(false);
            setShowSurprise(false);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
            showXFNSurprise
              ? "bg-teal-500/20 border-teal-500/40 text-teal-400"
              : "bg-secondary border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          🤝 Surprise Me (XFN)
        </button>
      </div>

      {showSurprise && (
        <SurpriseMe
          ratings={ratings}
          onRate={handleRate}
          onClose={() => setShowSurprise(false)}
        />
      )}
      {showXFNSurprise && (
        <XFNSurpriseMe
          ratings={ratings}
          onRate={handleRate}
          onClose={() => setShowXFNSurprise(false)}
        />
      )}
      {showPractice && <PracticeMode ratings={ratings} onRate={handleRate} />}
      {showMock && <FullMockSession onComplete={handleMockComplete} />}

      {/* Behavioral Story Strength Tracker */}
      <StoryStrengthTracker ratings={ratings} storyHistory={storyHistory} />

      {/* Mock History */}
      <MockHistoryLog
        history={history}
        onClear={() => {
          setHistory([]);
          toast.success("History cleared.");
        }}
      />

      {/* Voice-to-STAR Recorder + Answer Quality Scorer */}
      <div id="behavioral-voice-star">
        <VoiceToStar />
      </div>

      {/* Flashcard Flip Deck */}
      <FlashcardFlipDeck />

      {/* L4 / L5 Entry-Level Behavioral Guide */}
      <L4L5BehavioralCard />

      {/* 8 Key Signals That Distinguish L7 from L6 */}
      <L7Signals />

      {/* STAR Framework */}
      <div className="prep-card p-5">
        <div className="section-title">STAR Framework</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            [
              "S — Situation",
              "Set the scene. 1–2 sentences max. Context only, no solution yet.",
              "text-blue-400",
            ],
            [
              "T — Task",
              "Your specific responsibility. What were YOU asked to do?",
              "text-amber-400",
            ],
            [
              "A — Action",
              "The bulk of your answer. What YOU did, step by step. Use 'I', not 'we'.",
              "text-purple-400",
            ],
            [
              "R — Result",
              "Quantify the outcome. Business impact, not just technical completion.",
              "text-emerald-400",
            ],
          ].map(([title, desc, color]) => (
            <div key={title} className="p-3 rounded-lg bg-secondary">
              <div className={`text-xs font-bold mb-1 ${color}`}>{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search questions and probes…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <select
          value={filterArea}
          onChange={e => setFilterArea(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none"
        >
          {AREAS.map(a => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={filterTier}
          onChange={e => setFilterTier(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none"
        >
          <option value="All">All Levels</option>
          <option value="L5">L5+</option>
          <option value="L6">L6+</option>
          <option value="L7">L7 Only</option>
        </select>
      </div>

      {/* Questions list */}
      <div className="space-y-2">
        {filtered.map(q => {
          const r = ratings[q.id] ?? 0;
          const isOpen = expandedQ === q.id;
          return (
            <div key={q.id} className="bq-item">
              <button
                className="bq-trigger"
                onClick={() => setExpandedQ(isOpen ? null : q.id)}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span
                    className={`badge ${AREA_COLORS[q.area] ?? "badge-gray"} shrink-0`}
                  >
                    {q.area.split(" ")[0]}
                  </span>
                  <span
                    className={`text-[9px] px-1 py-0.5 rounded font-bold border shrink-0 ${
                      (q as any).tier === "L7"
                        ? "text-violet-400 bg-violet-500/10 border-violet-500/20"
                        : (q as any).tier === "L6"
                          ? "text-blue-400 bg-blue-500/10 border-blue-500/20"
                          : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    }`}
                  >
                    {(q as any).tier}
                  </span>
                  <span className="truncate text-left">{q.q}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {r > 0 && (
                    <span className="text-amber-400 text-xs font-bold">
                      ★{r}
                    </span>
                  )}
                  {r >= 4 && (
                    <span className="badge badge-green text-xs">Ready</span>
                  )}
                  {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </div>
              </button>
              {isOpen && (
                <div className="bq-body space-y-3" id={`bq-${q.id}`}>
                  <div className="p-2.5 rounded-md bg-secondary/50 text-xs text-muted-foreground">
                    {q.hint}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Rate your story:
                    </span>
                    <StarRating value={r} onChange={v => handleRate(q.id, v)} />
                  </div>
                  {/* STAR Answer Draft */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        STAR Draft
                      </span>
                      <div className="flex items-center gap-2">
                        {(() => {
                          const wc = (starDrafts[q.id] ?? "")
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean).length;
                          const color =
                            wc < 80
                              ? "text-red-400"
                              : wc < 200
                                ? "text-amber-400"
                                : "text-emerald-400";
                          return (
                            <span className={`text-[10px] font-mono ${color}`}>
                              {wc} words
                            </span>
                          );
                        })()}
                        <button
                          onClick={() =>
                            saveStarVersion(q.id, starDrafts[q.id] ?? "")
                          }
                          className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Save version
                        </button>
                        {(starVersions[q.id]?.length ?? 0) > 0 && (
                          <button
                            onClick={() =>
                              setShowVersions(
                                showVersions === q.id ? null : q.id
                              )
                            }
                            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showVersions === q.id
                              ? "Hide"
                              : `History (${starVersions[q.id].length})`}
                          </button>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={starDrafts[q.id] ?? ""}
                      onChange={e => saveStarDraft(q.id, e.target.value)}
                      placeholder="S: Situation — set the scene&#10;T: Task — what was your responsibility&#10;A: Action — what you specifically did&#10;R: Result — quantified outcome"
                      rows={5}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                    />
                    {/* Voice Answer Mode — record and score STAR answer inline */}
                    <VoiceAnswerMode
                      questionText={q.q}
                      icMode={(q as any).tier === "L7" ? "L7" : "L6"}
                    />
                    {/* Version History Panel */}
                    {showVersions === q.id &&
                      (starVersions[q.id]?.length ?? 0) > 0 && (
                        <div className="rounded-lg border border-border overflow-hidden">
                          <div className="px-3 py-1.5 bg-secondary/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                            Saved Versions (last 5)
                          </div>
                          <div className="divide-y divide-border max-h-48 overflow-y-auto">
                            {[...(starVersions[q.id] ?? [])]
                              .reverse()
                              .map((v, i) => (
                                <div key={i} className="p-2.5 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(v.timestamp).toLocaleString()}
                                    </span>
                                    <button
                                      onClick={() => {
                                        saveStarDraft(q.id, v.text);
                                        toast.success("Draft restored!");
                                      }}
                                      className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                      Restore
                                    </button>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                                    {v.text}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No questions match your search.
          </div>
        )}
      </div>
      {/* High impact features moved to top */}
    </div>
  );
}
