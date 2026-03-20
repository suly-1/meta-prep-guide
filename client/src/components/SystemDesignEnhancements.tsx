// System Design Enhancements — Batch 5
// Features: Guided Walkthrough, Trade-off Simulator, Meta Component Library,
// Scale Estimation Calculator, Question Bank w/ Tiers, Anti-Pattern Detector,
// Peer Design Review, Design Doc Generator, Complexity Cheat Sheet,
// Explain Like a PM, Time-Boxed Practice Timer
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, ChevronUp, Brain, Clock, FileText, AlertTriangle, Users, BookOpen, Zap, Timer, Copy, Check, Play, Pause, RotateCcw, Download } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import jsPDF from "jspdf";

// ── Shared helpers ────────────────────────────────────────────────────────────
function SectionWrapper({ id, title, icon, accent = "blue", children }: {
  id?: string; title: string; icon: React.ReactNode; accent?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const accentMap: Record<string, string> = {
    blue: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    violet: "text-violet-400 border-violet-500/20 bg-violet-500/5",
    emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    cyan: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    rose: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    purple: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    orange: "text-orange-400 border-orange-500/20 bg-orange-500/5",
  };
  const cls = accentMap[accent] ?? accentMap.blue;
  return (
    <div id={id} className={`prep-card border ${cls}`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className={cls.split(" ")[0]}>{icon}</span>
          <span className="text-sm font-bold text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ── 1. Guided Design Walkthrough Mode ────────────────────────────────────────
const WALKTHROUGH_PROBLEMS = [
  "Design Facebook News Feed",
  "Design Instagram Reels Ranking",
  "Design WhatsApp Message Delivery",
  "Design Meta's Notification System",
  "Design a Distributed Cache (Memcache-style)",
  "Design a URL Shortener at Meta scale",
  "Design a Rate Limiter for Meta's API Gateway",
  "Design Meta's Ad Targeting Pipeline",
  "Design a Distributed Job Queue",
  "Design a Real-time Presence System",
  "Design a Search Autocomplete Service",
  "Design a Distributed File Storage System",
];
const WALKTHROUGH_STEPS = [
  { label: "Requirements", time: "5 min", prompt: "List 3–5 functional requirements and 3 non-functional requirements (scale, latency, availability). Ask: DAU, QPS, data volume, read/write ratio, global vs regional." },
  { label: "Scale Estimation", time: "3 min", prompt: "Estimate: daily writes, storage per year, peak QPS, bandwidth. Show your math. Flag any assumptions." },
  { label: "Data Model", time: "5 min", prompt: "Define the core entities and their relationships. Choose SQL vs NoSQL with justification. Sketch the primary schema." },
  { label: "API Design", time: "5 min", prompt: "Define 2–3 core APIs (REST or gRPC). Include request/response shapes and any auth/rate-limiting considerations." },
  { label: "High-Level Design", time: "10 min", prompt: "Draw the core components: clients, load balancer, API servers, database, cache, message queue. Describe the end-to-end data flow for the primary use case." },
  { label: "Deep Dive", time: "10 min", prompt: "Pick 2 components to deep-dive. Discuss sharding strategy, caching policy, replication, or the specific bottleneck for this problem." },
  { label: "Trade-offs & Bottlenecks", time: "5 min", prompt: "Identify 2 SPOFs. Discuss consistency vs availability. Name one IC7 signal: operational concern, phased rollout, or business impact connection." },
];

export function GuidedDesignWalkthrough() {
  const [problem, setProblem] = useState(WALKTHROUGH_PROBLEMS[0]);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(WALKTHROUGH_STEPS.length).fill(""));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scoreMutation = trpc.ai.guidedWalkthroughFeedback.useMutation();

  useEffect(() => {
    if (started) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const step = WALKTHROUGH_STEPS[stepIdx];
  const isLast = stepIdx === WALKTHROUGH_STEPS.length - 1;

  const handleNext = async () => {
    if (isLast) {
      // Get LLM feedback on the full walkthrough
      try {
        const transcript = WALKTHROUGH_STEPS.map((s, i) => `## ${s.label}\n${answers[i] || "(skipped)"}`).join("\n\n");
        const result = await scoreMutation.mutateAsync({ problem, transcript });
        setFeedback(result.feedback);
        setStarted(false);
      } catch {
        toast.error("Could not get AI feedback. Please try again.");
      }
    } else {
      setStepIdx(i => i + 1);
    }
  };

  const reset = () => {
    setStepIdx(0);
    setAnswers(Array(WALKTHROUGH_STEPS.length).fill(""));
    setFeedback(null);
    setStarted(false);
    setElapsed(0);
  };

  if (!started && !feedback) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">Walk through any system design problem using Meta's 5-step framework. At each step, write your answer — then get AI coaching on your IC6/IC7 signal.</p>
        <div className="flex gap-2 flex-wrap">
          <select
            value={problem}
            onChange={e => setProblem(e.target.value)}
            className="flex-1 min-w-0 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            {WALKTHROUGH_PROBLEMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button
          onClick={() => setStarted(true)}
          className="w-full py-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm font-bold transition-all flex items-center justify-center gap-2"
        >
          <Play size={14} /> Start Walkthrough
        </button>
      </div>
    );
  }

  if (feedback) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">AI Coaching Feedback</div>
          <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw size={11} /> New Session</button>
        </div>
        <div className="bg-secondary/40 rounded-lg p-4 text-sm">
          <Streamdown>{feedback}</Streamdown>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-blue-400">{problem}</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-mono">{fmt(elapsed)}</span>
          <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><RotateCcw size={11} /> Reset</button>
        </div>
      </div>
      {/* Step progress */}
      <div className="flex gap-1">
        {WALKTHROUGH_STEPS.map((s, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < stepIdx ? "bg-emerald-500" : i === stepIdx ? "bg-blue-500" : "bg-secondary"}`} />
        ))}
      </div>
      {/* Current step */}
      <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Step {stepIdx + 1}/{WALKTHROUGH_STEPS.length} — {step.label}</span>
          <span className="text-xs text-muted-foreground">Target: {step.time}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{step.prompt}</p>
      </div>
      <textarea
        value={answers[stepIdx]}
        onChange={e => {
          const next = [...answers];
          next[stepIdx] = e.target.value;
          setAnswers(next);
        }}
        placeholder="Write your answer here…"
        rows={6}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y"
      />
      <div className="flex gap-2">
        {stepIdx > 0 && (
          <button onClick={() => setStepIdx(i => i - 1)} className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm text-muted-foreground transition-all">
            ← Back
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={scoreMutation.isPending}
          className="flex-1 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-sm font-bold transition-all disabled:opacity-50"
        >
          {scoreMutation.isPending ? "Getting AI Feedback…" : isLast ? "Finish & Get AI Feedback" : "Next Step →"}
        </button>
      </div>
    </div>
  );
}

// ── 2. Trade-off Decision Simulator ──────────────────────────────────────────
const TRADEOFF_SCENARIOS = [
  {
    id: "newsfeed-fanout",
    title: "News Feed Fanout Strategy",
    context: "Your news feed serves 500M DAU. Each user follows up to 5,000 accounts. A celebrity with 50M followers posts a photo.",
    question: "Which fanout strategy do you choose?",
    options: [
      { id: "push", label: "Push (fan-out on write)", desc: "Pre-compute and write to all follower feeds at post time." },
      { id: "pull", label: "Pull (fan-out on read)", desc: "Compute the feed dynamically when the user opens the app." },
      { id: "hybrid", label: "Hybrid", desc: "Push for regular users, pull for celebrities (high-follower accounts)." },
    ],
  },
  {
    id: "consistency-model",
    title: "Consistency Model for Likes Counter",
    context: "A viral post receives 10,000 likes per second. Users expect to see the like count update quickly.",
    question: "Which consistency model do you choose for the likes counter?",
    options: [
      { id: "strong", label: "Strong Consistency", desc: "Every read sees the latest write. Use a single primary DB with synchronous replication." },
      { id: "eventual", label: "Eventual Consistency", desc: "Counts may lag by seconds. Use distributed counters with async aggregation." },
      { id: "causal", label: "Causal Consistency", desc: "A user always sees their own like reflected immediately, but others may lag." },
    ],
  },
  {
    id: "storage-engine",
    title: "Storage Engine for User Activity Log",
    context: "You need to store 1TB/day of user activity events. Queries are 95% time-range scans, 5% point lookups by user ID.",
    question: "Which storage engine do you choose?",
    options: [
      { id: "cassandra", label: "Apache Cassandra", desc: "Wide-column store. Excellent for time-series with partition key = user_id, clustering key = timestamp." },
      { id: "mysql", label: "MySQL (sharded)", desc: "Familiar, ACID, but requires careful sharding strategy for this volume." },
      { id: "clickhouse", label: "ClickHouse / columnar DB", desc: "Optimized for analytical range scans. Extremely fast for aggregations over time ranges." },
    ],
  },
  {
    id: "cache-strategy",
    title: "Cache Invalidation Strategy",
    context: "You cache user profile data. Profiles update infrequently (avg once per week) but reads are extremely hot (10K QPS per popular user).",
    question: "Which cache invalidation strategy do you choose?",
    options: [
      { id: "ttl", label: "TTL-based expiry", desc: "Cache entries expire after a fixed time (e.g., 5 minutes). Simple but may serve stale data." },
      { id: "write-through", label: "Write-through cache", desc: "Update cache synchronously on every profile write. Always consistent but adds write latency." },
      { id: "event-driven", label: "Event-driven invalidation", desc: "Publish a cache-invalidation event on profile update. Workers delete/refresh the cache entry." },
    ],
  },
  {
    id: "message-delivery",
    title: "Message Delivery Guarantee",
    context: "You're designing WhatsApp-style messaging. A message must reach the recipient even if they're offline for 7 days.",
    question: "Which delivery guarantee model do you implement?",
    options: [
      { id: "at-most-once", label: "At-most-once", desc: "Fire and forget. Fastest, but messages can be lost if the server crashes." },
      { id: "at-least-once", label: "At-least-once", desc: "Retry until acknowledged. Messages may be delivered multiple times — requires client-side dedup." },
      { id: "exactly-once", label: "Exactly-once", desc: "Guaranteed single delivery. Requires idempotency keys and distributed transaction coordination." },
    ],
  },
];

export function TradeoffDecisionSimulator() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [justification, setJustification] = useState("");
  const [feedback, setFeedback] = useState<{ score: number; verdict: string; coaching: string; ic7Signal: string } | null>(null);
  const scoreMutation = trpc.ai.scoreTradeoff.useMutation();
  const scenario = TRADEOFF_SCENARIOS[scenarioIdx];

  const reset = () => { setSelected(null); setJustification(""); setFeedback(null); };
  const handleNext = () => { reset(); setScenarioIdx(i => (i + 1) % TRADEOFF_SCENARIOS.length); };

  const handleSubmit = async () => {
    if (!selected || justification.trim().length < 20) {
      toast.error("Please select an option and write at least 20 characters of justification.");
      return;
    }
    try {
      const option = scenario.options.find(o => o.id === selected)!;
      const result = await scoreMutation.mutateAsync({
        scenarioTitle: scenario.title,
        context: scenario.context,
        question: scenario.question,
        chosenOption: option.label,
        chosenDesc: option.desc,
        justification,
      });
      setFeedback(result);
    } catch {
      toast.error("Could not get AI feedback. Please try again.");
    }
  };

  const scoreColor = (s: number) => s >= 4 ? "text-emerald-400" : s >= 3 ? "text-blue-400" : s >= 2 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {TRADEOFF_SCENARIOS.map((_, i) => (
            <button key={i} onClick={() => { reset(); setScenarioIdx(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === scenarioIdx ? "bg-violet-400" : "bg-secondary"}`} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{scenarioIdx + 1} / {TRADEOFF_SCENARIOS.length}</span>
      </div>

      {/* Scenario */}
      <div className="bg-secondary/40 rounded-lg p-4 space-y-2">
        <div className="text-xs font-bold text-violet-400 uppercase tracking-wider">{scenario.title}</div>
        <p className="text-xs text-muted-foreground leading-relaxed">{scenario.context}</p>
        <p className="text-sm font-semibold text-foreground">{scenario.question}</p>
      </div>

      {/* Options */}
      {!feedback && (
        <div className="space-y-2">
          {scenario.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${selected === opt.id ? "border-violet-500/50 bg-violet-500/10" : "border-border bg-secondary/30 hover:border-violet-500/30"}`}
            >
              <div className="text-sm font-semibold text-foreground">{opt.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      )}

      {/* Justification */}
      {!feedback && (
        <>
          <textarea
            value={justification}
            onChange={e => setJustification(e.target.value)}
            placeholder="Justify your choice — explain the trade-offs, when this breaks down, and what you'd monitor…"
            rows={4}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y"
          />
          <button
            onClick={handleSubmit}
            disabled={scoreMutation.isPending || !selected}
            className="w-full py-2.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-bold transition-all disabled:opacity-50"
          >
            {scoreMutation.isPending ? "Scoring your trade-off…" : "Submit for IC6/IC7 Scoring"}
          </button>
        </>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/40 border border-border">
            <div className="text-center">
              <div className={`text-2xl font-black ${scoreColor(feedback.score)}`}>{feedback.score.toFixed(1)}</div>
              <div className="text-[10px] text-muted-foreground">/ 5.0</div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-foreground">{feedback.verdict}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{feedback.coaching}</div>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-purple-500/5 border border-purple-500/20">
            <div className="text-xs font-bold text-purple-400 mb-1">IC7 Signal</div>
            <div className="text-xs text-muted-foreground">{feedback.ic7Signal}</div>
          </div>
          <div className="flex gap-2">
            <button onClick={reset} className="flex-1 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm text-muted-foreground transition-all">Try Again</button>
            <button onClick={handleNext} className="flex-1 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-bold transition-all">Next Scenario →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 3. Meta-Specific Component Library ───────────────────────────────────────
const META_COMPONENTS = [
  {
    name: "TAO", category: "Storage", color: "blue",
    tagline: "The Associations and Objects store — Meta's social graph backbone",
    description: "TAO (The Associations and Objects) is Meta's distributed data store for the social graph. It stores objects (users, posts, pages) and typed associations (friendships, likes, follows). Built on top of MySQL with a write-through cache layer. Handles trillions of reads per day.",
    whenToUse: "Any problem involving social graphs, follower/following relationships, or entity associations at Meta scale.",
    keyProperties: ["Object store + association store", "Write-through cache (TAO cache → MySQL)", "Eventual consistency for associations", "Supports range queries on associations"],
    metaSignal: "Mentioning TAO for social graph storage immediately signals deep Meta familiarity.",
  },
  {
    name: "Memcache", category: "Caching", color: "emerald",
    tagline: "Meta's distributed in-memory caching layer — the world's largest Memcached deployment",
    description: "Meta runs the world's largest Memcached deployment, serving trillions of cache requests per day. Key innovations: regional pools, cold cluster warmup, lease mechanism to prevent thundering herd, and mcrouter for routing/replication.",
    whenToUse: "Any problem requiring a distributed cache layer. Use for hot reads, session storage, or computed results.",
    keyProperties: ["Lease mechanism prevents thundering herd", "mcrouter for multi-region routing", "Cold cluster warmup for safe deployments", "Regional pools for geo-locality"],
    metaSignal: "Discussing the lease mechanism or thundering herd prevention shows IC7-level depth.",
  },
  {
    name: "Scuba", category: "Analytics", color: "amber",
    tagline: "Meta's real-time analytics and time-series data store",
    description: "Scuba is Meta's in-memory time-series data store for real-time analytics. Data is stored in memory across a cluster of machines. Supports ad-hoc queries over recent data (last 30 days). Used for monitoring, A/B test analysis, and operational dashboards.",
    whenToUse: "Real-time analytics, monitoring dashboards, A/B test result queries, operational metrics.",
    keyProperties: ["Fully in-memory (no disk persistence)", "Columnar storage for fast aggregations", "Supports ad-hoc SQL-like queries", "30-day rolling window of data"],
    metaSignal: "Citing Scuba for analytics/monitoring shows awareness of Meta's observability stack.",
  },
  {
    name: "ZippyDB", category: "Storage", color: "cyan",
    tagline: "Meta's distributed key-value store — built on RocksDB + Raft",
    description: "ZippyDB is Meta's strongly-consistent distributed key-value store. Built on RocksDB (storage engine) with Raft (consensus). Supports ACID transactions, range scans, and TTL. Used for configuration, feature flags, and metadata storage.",
    whenToUse: "Strongly-consistent KV storage: configuration data, feature flags, metadata, rate limiter state.",
    keyProperties: ["RocksDB storage engine", "Raft consensus for strong consistency", "ACID transactions", "TTL support for ephemeral data"],
    metaSignal: "Choosing ZippyDB over Redis for consistency-critical data shows architectural maturity.",
  },
  {
    name: "Laser", category: "ML", color: "purple",
    tagline: "Meta's low-latency ML feature store for real-time inference",
    description: "Laser is Meta's feature store for serving ML features at low latency during real-time inference. Stores pre-computed user and item features. Backed by RocksDB with a tiered memory/SSD architecture. Serves billions of feature lookups per second.",
    whenToUse: "Any ML system design problem requiring real-time feature serving during inference.",
    keyProperties: ["Tiered storage: memory → SSD → remote", "Billions of lookups/second", "Prevents training-serving skew", "Supports batch and real-time feature updates"],
    metaSignal: "Citing Laser in an ML system design round immediately elevates the answer to IC7 territory.",
  },
  {
    name: "Tupperware", category: "Infrastructure", color: "rose",
    tagline: "Meta's container orchestration platform (pre-dates Kubernetes at Meta)",
    description: "Tupperware is Meta's internal container orchestration system, analogous to Kubernetes. Manages containerized workloads across Meta's global fleet. Handles scheduling, resource allocation, health monitoring, and rolling deployments.",
    whenToUse: "When discussing deployment, scaling, or container orchestration in any system design problem.",
    keyProperties: ["Container scheduling across global fleet", "Resource allocation and bin-packing", "Rolling deployments with health checks", "Integration with Meta's capacity planning"],
    metaSignal: "Referencing Tupperware instead of Kubernetes shows you know Meta's actual infra stack.",
  },
  {
    name: "Haystack", category: "Storage", color: "orange",
    tagline: "Meta's object storage for photos and videos — optimized for long-tail reads",
    description: "Haystack is Meta's blob storage system optimized for storing and serving photos. Key insight: traditional NAS systems had too many metadata lookups per photo read. Haystack stores multiple photos per physical file, reducing metadata overhead. Serves hundreds of billions of photos.",
    whenToUse: "Any problem involving media storage (photos, videos, blobs) at Meta scale.",
    keyProperties: ["Multiple objects per physical file", "Eliminates per-object metadata overhead", "Immutable writes (append-only)", "CDN layer in front for hot content"],
    metaSignal: "Discussing Haystack for media storage shows knowledge of Meta's actual storage architecture.",
  },
  {
    name: "Presto", category: "Analytics", color: "violet",
    tagline: "Meta's distributed SQL query engine for data warehouse analytics",
    description: "Presto (now Trino) is Meta's distributed SQL query engine for running interactive analytics queries over large datasets stored in Hive/HDFS. Supports federated queries across multiple data sources. Used by thousands of Meta engineers for ad-hoc data analysis.",
    whenToUse: "Offline analytics, data warehouse queries, batch reporting, A/B test analysis over historical data.",
    keyProperties: ["Distributed SQL execution", "Federated queries across data sources", "Columnar execution for performance", "Integrates with Hive metastore"],
    metaSignal: "Distinguishing Presto (batch analytics) from Scuba (real-time) shows systems thinking depth.",
  },
];

const colorMap: Record<string, { badge: string; border: string; bg: string }> = {
  blue: { badge: "bg-blue-500/20 text-blue-300", border: "border-blue-500/30", bg: "bg-blue-500/5" },
  emerald: { badge: "bg-emerald-500/20 text-emerald-300", border: "border-emerald-500/30", bg: "bg-emerald-500/5" },
  amber: { badge: "bg-amber-500/20 text-amber-300", border: "border-amber-500/30", bg: "bg-amber-500/5" },
  cyan: { badge: "bg-cyan-500/20 text-cyan-300", border: "border-cyan-500/30", bg: "bg-cyan-500/5" },
  purple: { badge: "bg-purple-500/20 text-purple-300", border: "border-purple-500/30", bg: "bg-purple-500/5" },
  rose: { badge: "bg-rose-500/20 text-rose-300", border: "border-rose-500/30", bg: "bg-rose-500/5" },
  orange: { badge: "bg-orange-500/20 text-orange-300", border: "border-orange-500/30", bg: "bg-orange-500/5" },
  violet: { badge: "bg-violet-500/20 text-violet-300", border: "border-violet-500/30", bg: "bg-violet-500/5" },
};

export function MetaComponentLibrary() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("All");
  const categories = ["All", ...Array.from(new Set(META_COMPONENTS.map(c => c.category)))];
  const filtered = filter === "All" ? META_COMPONENTS : META_COMPONENTS.filter(c => c.category === filter);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Reference panel for Meta's internal systems. Name-dropping these correctly in an interview signals deep familiarity with Meta's stack.</p>
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${filter === cat ? "bg-cyan-600/30 text-cyan-300 border border-cyan-500/40" : "bg-secondary text-muted-foreground border border-border hover:border-cyan-500/30"}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.map(comp => {
          const cls = colorMap[comp.color] ?? colorMap.blue;
          const isOpen = expanded === comp.name;
          return (
            <div key={comp.name} className={`rounded-lg border ${cls.border} ${cls.bg} overflow-hidden`}>
              <button onClick={() => setExpanded(isOpen ? null : comp.name)} className="w-full flex items-start justify-between gap-3 p-3 text-left">
                <div className="flex items-start gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${cls.badge}`}>{comp.category}</span>
                  <div>
                    <div className="text-sm font-bold text-foreground">{comp.name}</div>
                    <div className="text-xs text-muted-foreground">{comp.tagline}</div>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={13} className="text-muted-foreground shrink-0 mt-1" /> : <ChevronDown size={13} className="text-muted-foreground shrink-0 mt-1" />}
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-3 border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">{comp.description}</p>
                  <div>
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">When to Use</div>
                    <p className="text-xs text-muted-foreground">{comp.whenToUse}</p>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-1">Key Properties</div>
                    <ul className="space-y-0.5">
                      {comp.keyProperties.map(p => <li key={p} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-emerald-400 shrink-0">•</span>{p}</li>)}
                    </ul>
                  </div>
                  <div className={`p-2 rounded-lg ${cls.bg} border ${cls.border}`}>
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "inherit" }}>IC7 Interview Signal</div>
                    <p className="text-xs text-muted-foreground">{comp.metaSignal}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── 4. Enhanced Scale Estimation Calculator ───────────────────────────────────
export function ScaleEstimationCalculator() {
  const [dau, setDau] = useState(500);
  const [dauUnit, setDauUnit] = useState<"M" | "B">("M");
  const [writesPerUser, setWritesPerUser] = useState(2);
  const [readsPerUser, setReadsPerUser] = useState(100);
  const [recordSizeKB, setRecordSizeKB] = useState(1);
  const [retentionYears, setRetentionYears] = useState(5);
  const [mediaPerWrite, setMediaPerWrite] = useState(0);
  const [mediaSizeMB, setMediaSizeMB] = useState(2);

  const dauActual = dau * (dauUnit === "M" ? 1e6 : 1e9);
  const dailyWrites = dauActual * writesPerUser;
  const dailyReads = dauActual * readsPerUser;
  const peakQPSWrites = (dailyWrites / 86400) * 3; // 3x peak factor
  const peakQPSReads = (dailyReads / 86400) * 3;
  const storagePerDayGB = (dailyWrites * recordSizeKB) / (1024 * 1024);
  const storagePerDayMediaGB = (dailyWrites * mediaPerWrite * mediaSizeMB) / 1024;
  const totalStorageGB = (storagePerDayGB + storagePerDayMediaGB) * 365 * retentionYears;
  const bandwidthGbps = (peakQPSReads * recordSizeKB * 1024 * 8) / 1e9;

  const fmt = (n: number, decimals = 1) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(decimals)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(decimals)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(decimals)}K`;
    return n.toFixed(decimals);
  };
  const fmtStorage = (gb: number) => {
    if (gb >= 1e6) return `${(gb / 1e6).toFixed(1)} EB`;
    if (gb >= 1e3) return `${(gb / 1e3).toFixed(1)} TB`;
    return `${gb.toFixed(1)} GB`;
  };

  const isSane = (val: number, max: number) => val <= max;
  const warnings: string[] = [];
  if (!isSane(peakQPSWrites, 1e6)) warnings.push("Peak write QPS > 1M — consider write batching or async processing");
  if (!isSane(totalStorageGB, 1e9)) warnings.push("Total storage > 1 EB — verify your assumptions");
  if (bandwidthGbps > 100) warnings.push("Bandwidth > 100 Gbps — you'll need aggressive CDN/edge caching");

  const InputRow = ({ label, value, onChange, min, max, step, unit }: {
    label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit?: string;
  }) => (
    <div className="flex items-center gap-3">
      <label className="text-xs text-muted-foreground w-36 shrink-0">{label}</label>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-cyan-500" />
      <span className="text-xs font-mono text-cyan-300 w-16 text-right">{value}{unit ?? ""}</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Adjust the sliders to model your system's scale. Results update in real time.</p>
      {/* Inputs */}
      <div className="space-y-3 bg-secondary/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <label className="text-xs text-muted-foreground w-36 shrink-0">DAU</label>
          <input type="range" min={1} max={dauUnit === "M" ? 1000 : 10} step={1} value={dau}
            onChange={e => setDau(Number(e.target.value))} className="flex-1 accent-cyan-500" />
          <span className="text-xs font-mono text-cyan-300 w-16 text-right">{dau}{dauUnit}</span>
          <select value={dauUnit} onChange={e => setDauUnit(e.target.value as "M" | "B")}
            className="bg-secondary border border-border rounded px-1 py-0.5 text-xs text-foreground">
            <option value="M">M</option>
            <option value="B">B</option>
          </select>
        </div>
        <InputRow label="Writes / user / day" value={writesPerUser} onChange={setWritesPerUser} min={1} max={100} step={1} />
        <InputRow label="Reads / user / day" value={readsPerUser} onChange={setReadsPerUser} min={1} max={1000} step={10} />
        <InputRow label="Record size" value={recordSizeKB} onChange={setRecordSizeKB} min={0.1} max={100} step={0.1} unit=" KB" />
        <InputRow label="Retention" value={retentionYears} onChange={setRetentionYears} min={1} max={10} step={1} unit=" yr" />
        <InputRow label="Media / write" value={mediaPerWrite} onChange={setMediaPerWrite} min={0} max={5} step={0.5} />
        {mediaPerWrite > 0 && <InputRow label="Media size" value={mediaSizeMB} onChange={setMediaSizeMB} min={0.1} max={50} step={0.1} unit=" MB" />}
      </div>
      {/* Results */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Daily Writes", value: fmt(dailyWrites), color: "text-blue-400" },
          { label: "Daily Reads", value: fmt(dailyReads), color: "text-emerald-400" },
          { label: "Peak Write QPS", value: fmt(peakQPSWrites), color: "text-amber-400" },
          { label: "Peak Read QPS", value: fmt(peakQPSReads), color: "text-cyan-400" },
          { label: "Storage / day", value: fmtStorage(storagePerDayGB + storagePerDayMediaGB), color: "text-violet-400" },
          { label: `Total (${retentionYears}yr)`, value: fmtStorage(totalStorageGB), color: "text-rose-400" },
          { label: "Peak Bandwidth", value: `${bandwidthGbps.toFixed(1)} Gbps`, color: "text-orange-400" },
          { label: "Servers (10K QPS)", value: Math.ceil(peakQPSReads / 10000).toString(), color: "text-purple-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-secondary/40 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
            <div className={`text-lg font-black font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>
      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map(w => (
            <div key={w} className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 5. Architecture Anti-Pattern Detector ────────────────────────────────────
export function AntiPatternDetector() {
  const [design, setDesign] = useState("");
  const [result, setResult] = useState<{ antiPatterns: Array<{ name: string; severity: string; explanation: string; fix: string }>; overallSignal: string; icLevel: string } | null>(null);
  const detectMutation = trpc.ai.detectAntiPatterns.useMutation();

  const handleDetect = async () => {
    if (design.trim().length < 50) {
      toast.error("Please describe your design in at least 50 characters.");
      return;
    }
    try {
      const res = await detectMutation.mutateAsync({ design });
      setResult(res);
    } catch {
      toast.error("Could not analyze design. Please try again.");
    }
  };

  const severityColor = (s: string) =>
    s === "Critical" ? "text-red-400 bg-red-500/10 border-red-500/30" :
    s === "High" ? "text-orange-400 bg-orange-500/10 border-orange-500/30" :
    "text-amber-400 bg-amber-500/10 border-amber-500/30";

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Paste or describe your system design. The AI will scan for common IC6 failure patterns: SPOFs, missing async processing, synchronous critical paths, no consistency model, no capacity planning.</p>
      <textarea
        value={design}
        onChange={e => setDesign(e.target.value)}
        placeholder="Describe your design: components, data flow, storage choices, scaling strategy…"
        rows={6}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y"
      />
      <button
        onClick={handleDetect}
        disabled={detectMutation.isPending}
        className="w-full py-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <AlertTriangle size={14} />
        {detectMutation.isPending ? "Scanning for anti-patterns…" : "Detect Anti-Patterns"}
      </button>
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-foreground">Found {result.antiPatterns.length} issue{result.antiPatterns.length !== 1 ? "s" : ""}</div>
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${result.icLevel === "IC7" ? "text-purple-400 bg-purple-500/10" : result.icLevel === "IC6" ? "text-blue-400 bg-blue-500/10" : "text-amber-400 bg-amber-500/10"}`}>{result.icLevel} Signal</span>
          </div>
          {result.antiPatterns.map((ap, i) => (
            <div key={i} className={`p-3 rounded-lg border ${severityColor(ap.severity)}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">{ap.severity}</span>
                <span className="text-sm font-bold text-foreground">{ap.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{ap.explanation}</p>
              <div className="text-xs font-semibold text-emerald-400">Fix: {ap.fix}</div>
            </div>
          ))}
          <div className="p-3 rounded-lg bg-secondary/40 border border-border">
            <div className="text-xs font-bold text-foreground mb-1">Overall Assessment</div>
            <p className="text-xs text-muted-foreground">{result.overallSignal}</p>
          </div>
          <button onClick={() => { setResult(null); setDesign(""); }} className="w-full py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm text-muted-foreground transition-all">Clear & Try Another Design</button>
        </div>
      )}
    </div>
  );
}

// ── 6. Peer Design Review Simulator ──────────────────────────────────────────
export function PeerDesignReview() {
  const [problem, setProblem] = useState("Design Facebook News Feed");
  const [design, setDesign] = useState("");
  const [icMode, setIcMode] = useState<"IC6" | "IC7">("IC6");
  const [result, setResult] = useState<{ questions: Array<{ question: string; whyAsked: string; goodAnswerHint: string }>; overallVerdict: string; ic7Gap: string } | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [phase, setPhase] = useState<"input" | "questions" | "done">("input");
  const reviewMutation = trpc.ai.peerDesignReview.useMutation();
  const scoreMutation = trpc.ai.scorePeerReviewAnswers.useMutation();
  const [finalFeedback, setFinalFeedback] = useState<string | null>(null);

  const handleReview = async () => {
    if (design.trim().length < 50) { toast.error("Please describe your design in at least 50 characters."); return; }
    try {
      const res = await reviewMutation.mutateAsync({ problem, design, icMode });
      setResult(res);
      setAnswers(Array(res.questions.length).fill(""));
      setPhase("questions");
    } catch { toast.error("Could not generate review questions. Please try again."); }
  };

  const handleScore = async () => {
    if (!result) return;
    try {
      const transcript = result.questions.map((q, i) => `Q: ${q.question}\nA: ${answers[i] || "(no answer)"}`).join("\n\n");
      const res = await scoreMutation.mutateAsync({ problem, icMode, transcript });
      setFinalFeedback(res.feedback);
      setPhase("done");
    } catch { toast.error("Could not score answers. Please try again."); }
  };

  const reset = () => { setDesign(""); setResult(null); setAnswers([]); setPhase("input"); setFinalFeedback(null); };

  return (
    <div className="space-y-4">
      {phase === "input" && (
        <>
          <p className="text-xs text-muted-foreground">Describe your design. A skeptical senior engineer will ask 3 adversarial questions to probe your design under pressure — a key IC7 differentiator.</p>
          <div className="flex gap-2">
            <select value={problem} onChange={e => setProblem(e.target.value)}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              {["Design Facebook News Feed", "Design Instagram Reels Ranking", "Design WhatsApp Message Delivery",
                "Design Meta's Notification System", "Design a Distributed Cache", "Design a Rate Limiter",
                "Design a URL Shortener", "Design a Distributed Job Queue"].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <select value={icMode} onChange={e => setIcMode(e.target.value as "IC6" | "IC7")}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground">
              <option value="IC6">IC6</option>
              <option value="IC7">IC7</option>
            </select>
          </div>
          <textarea value={design} onChange={e => setDesign(e.target.value)}
            placeholder="Describe your design: components, data flow, storage choices, scaling strategy, trade-offs…"
            rows={6} className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y" />
          <button onClick={handleReview} disabled={reviewMutation.isPending}
            className="w-full py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Users size={14} />
            {reviewMutation.isPending ? "Generating adversarial questions…" : "Start Peer Review"}
          </button>
        </>
      )}

      {phase === "questions" && result && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground bg-secondary/40 rounded-lg p-3">
            A senior engineer is reviewing your design for <span className="font-semibold text-foreground">{problem}</span>. Answer each question as you would in a real interview.
          </div>
          {result.questions.map((q, i) => (
            <div key={i} className="space-y-2">
              <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                <div className="text-xs font-bold text-rose-400 mb-1">Question {i + 1}</div>
                <p className="text-sm font-semibold text-foreground">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-1">Why asked: {q.whyAsked}</p>
              </div>
              <textarea value={answers[i]} onChange={e => { const next = [...answers]; next[i] = e.target.value; setAnswers(next); }}
                placeholder="Your answer…" rows={3}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y" />
            </div>
          ))}
          <button onClick={handleScore} disabled={scoreMutation.isPending}
            className="w-full py-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-bold transition-all disabled:opacity-50">
            {scoreMutation.isPending ? "Scoring your defense…" : "Submit Answers for Scoring"}
          </button>
        </div>
      )}

      {phase === "done" && finalFeedback && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Peer Review Feedback</div>
          <div className="bg-secondary/40 rounded-lg p-4 text-sm">
            <Streamdown>{finalFeedback}</Streamdown>
          </div>
          <button onClick={reset} className="w-full py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm text-muted-foreground transition-all">Start New Review</button>
        </div>
      )}
    </div>
  );
}

// ── 7. Design Doc Template Generator ─────────────────────────────────────────
const DOC_SECTIONS = [
  { key: "context", label: "Context & Motivation", placeholder: "What problem are we solving? Why now? What's the business impact?" },
  { key: "goals", label: "Goals", placeholder: "What will this system do? List 3–5 specific, measurable goals." },
  { key: "nonGoals", label: "Non-Goals", placeholder: "What is explicitly out of scope? This prevents scope creep." },
  { key: "design", label: "Proposed Design", placeholder: "High-level architecture, key components, data flow, API design." },
  { key: "tradeoffs", label: "Trade-offs & Alternatives", placeholder: "What alternatives did you consider? Why did you choose this approach?" },
  { key: "openQuestions", label: "Open Questions", placeholder: "What decisions are still unresolved? What do you need input on?" },
];

export function DesignDocGenerator() {
  const [problem, setProblem] = useState("Design Facebook News Feed");
  const [sections, setSections] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const updateSection = (key: string, val: string) => setSections(s => ({ ...s, [key]: val }));

  const generateMarkdown = () => {
    const lines = [`# Design Doc: ${problem}`, `\n_Author: [Your Name] | Date: ${new Date().toLocaleDateString()}_\n`];
    DOC_SECTIONS.forEach(s => {
      lines.push(`## ${s.label}`);
      lines.push(sections[s.key]?.trim() || "_[To be filled]_");
      lines.push("");
    });
    return lines.join("\n");
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Design doc copied to clipboard!");
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const md = generateMarkdown();
    const lines = md.split("\n");
    let y = 15;
    doc.setFontSize(10);
    lines.forEach(line => {
      if (y > 280) { doc.addPage(); y = 15; }
      if (line.startsWith("# ")) { doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text(line.replace("# ", ""), 10, y); doc.setFontSize(10); doc.setFont("helvetica", "normal"); y += 8; }
      else if (line.startsWith("## ")) { doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text(line.replace("## ", ""), 10, y); doc.setFontSize(10); doc.setFont("helvetica", "normal"); y += 6; }
      else if (line.trim()) { const wrapped = doc.splitTextToSize(line, 190); doc.text(wrapped, 10, y); y += wrapped.length * 5; }
      else { y += 3; }
    });
    doc.save(`design-doc-${problem.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    toast.success("PDF exported!");
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Fill in each section to generate a Meta-style design doc. Export as Markdown or PDF.</p>
      <input value={problem} onChange={e => setProblem(e.target.value)}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
        placeholder="Problem title (e.g. Design Facebook News Feed)" />
      <div className="space-y-3">
        {DOC_SECTIONS.map(s => (
          <div key={s.key}>
            <label className="text-xs font-bold text-foreground block mb-1">{s.label}</label>
            <textarea value={sections[s.key] ?? ""} onChange={e => updateSection(s.key, e.target.value)}
              placeholder={s.placeholder} rows={3}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground resize-y" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={handleCopy} className="flex-1 py-2 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-sm text-muted-foreground transition-all flex items-center justify-center gap-2">
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied!" : "Copy Markdown"}
        </button>
        <button onClick={handleExportPDF} className="flex-1 py-2 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-sm font-bold transition-all flex items-center justify-center gap-2">
          <Download size={13} /> Export PDF
        </button>
      </div>
    </div>
  );
}

// ── 8. Complexity Cheat Sheet ─────────────────────────────────────────────────
const LATENCY_NUMBERS = [
  { op: "L1 cache reference", ns: 0.5, note: "~0.5 ns" },
  { op: "Branch mispredict", ns: 5, note: "~5 ns" },
  { op: "L2 cache reference", ns: 7, note: "~7 ns" },
  { op: "Mutex lock/unlock", ns: 25, note: "~25 ns" },
  { op: "Main memory reference", ns: 100, note: "~100 ns" },
  { op: "Compress 1KB (Snappy)", ns: 3000, note: "~3 μs" },
  { op: "Send 1KB over 1 Gbps", ns: 10000, note: "~10 μs" },
  { op: "Read 4KB from SSD", ns: 150000, note: "~150 μs" },
  { op: "Read 1MB sequentially (mem)", ns: 250000, note: "~250 μs" },
  { op: "Round trip within datacenter", ns: 500000, note: "~0.5 ms" },
  { op: "Read 1MB sequentially (SSD)", ns: 1000000, note: "~1 ms" },
  { op: "Disk seek", ns: 10000000, note: "~10 ms" },
  { op: "Read 1MB sequentially (disk)", ns: 20000000, note: "~20 ms" },
  { op: "Send packet CA→Netherlands→CA", ns: 150000000, note: "~150 ms" },
];
const CAP_ROWS = [
  { system: "MySQL (single primary)", c: true, a: false, p: false, note: "Strongly consistent, not partition tolerant" },
  { system: "Cassandra", c: false, a: true, p: true, note: "Tunable consistency (QUORUM for stronger)" },
  { system: "DynamoDB", c: false, a: true, p: true, note: "Eventual by default, optional strong reads" },
  { system: "ZooKeeper / etcd", c: true, a: false, p: true, note: "CP — used for distributed coordination" },
  { system: "Redis (single)", c: true, a: false, p: false, note: "Single node: consistent but not HA" },
  { system: "Redis Cluster", c: false, a: true, p: true, note: "AP — may lose writes on partition" },
  { system: "HBase", c: true, a: false, p: true, note: "CP — strong consistency via HDFS" },
  { system: "CockroachDB", c: true, a: false, p: true, note: "CP — distributed SQL with Raft" },
];

export function ComplexityCheatSheet() {
  const [tab, setTab] = useState<"latency" | "cap" | "patterns">("latency");
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-secondary/40 rounded-lg p-1">
        {(["latency", "cap", "patterns"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all capitalize ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "cap" ? "CAP Theorem" : t === "latency" ? "Latency Numbers" : "Read/Write Patterns"}
          </button>
        ))}
      </div>
      {tab === "latency" && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border"><th className="text-left p-2 text-muted-foreground">Operation</th><th className="text-right p-2 text-muted-foreground">Latency</th></tr></thead>
            <tbody className="divide-y divide-border">
              {LATENCY_NUMBERS.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-secondary/20" : ""}>
                  <td className="p-2 text-foreground">{r.op}</td>
                  <td className={`p-2 text-right font-mono font-bold ${r.ns < 1000 ? "text-emerald-400" : r.ns < 1000000 ? "text-blue-400" : r.ns < 100000000 ? "text-amber-400" : "text-red-400"}`}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tab === "cap" && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">CAP Theorem: a distributed system can guarantee at most 2 of 3 properties. In practice, partition tolerance (P) is mandatory — so the real choice is C vs A.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground">System</th>
                <th className="text-center p-2 text-blue-400">C</th>
                <th className="text-center p-2 text-emerald-400">A</th>
                <th className="text-center p-2 text-amber-400">P</th>
                <th className="text-left p-2 text-muted-foreground">Note</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {CAP_ROWS.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-secondary/20" : ""}>
                    <td className="p-2 font-semibold text-foreground">{r.system}</td>
                    <td className="p-2 text-center">{r.c ? "✅" : "❌"}</td>
                    <td className="p-2 text-center">{r.a ? "✅" : "❌"}</td>
                    <td className="p-2 text-center">{r.p ? "✅" : "❌"}</td>
                    <td className="p-2 text-muted-foreground">{r.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {tab === "patterns" && (
        <div className="space-y-3">
          {[
            { title: "Read-Heavy Systems", color: "blue", items: ["Add read replicas (MySQL, Postgres)", "Cache aggressively (Redis, Memcache)", "CDN for static/media content", "Denormalize for query performance", "Use eventual consistency where acceptable"] },
            { title: "Write-Heavy Systems", color: "amber", items: ["Use append-only / log-structured storage", "Batch writes (buffering, micro-batching)", "Async processing via message queues", "Write-ahead log (WAL) for durability", "Sharding to distribute write load"] },
            { title: "High-Availability Patterns", color: "emerald", items: ["Active-active multi-region replication", "Circuit breaker for cascading failures", "Bulkhead pattern to isolate failures", "Health checks + auto-restart (Tupperware)", "Graceful degradation (serve stale data)"] },
            { title: "Scalability Patterns", color: "violet", items: ["Horizontal scaling (stateless services)", "Consistent hashing for sharding", "CQRS for read/write separation", "Event sourcing for audit + replay", "Saga pattern for distributed transactions"] },
          ].map(({ title, color, items }) => (
            <div key={title} className={`p-3 rounded-lg bg-${color}-500/5 border border-${color}-500/20`}>
              <div className={`text-xs font-bold text-${color}-400 mb-2`}>{title}</div>
              <ul className="space-y-0.5">
                {items.map(item => <li key={item} className="text-xs text-muted-foreground flex gap-1.5"><span className={`text-${color}-400 shrink-0`}>•</span>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 9. Explain Like a PM Mode ─────────────────────────────────────────────────
export function ExplainLikeAPM() {
  const [design, setDesign] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const explainMutation = trpc.ai.explainLikeAPM.useMutation();

  const handleExplain = async () => {
    if (design.trim().length < 30) { toast.error("Please describe your design in at least 30 characters."); return; }
    try {
      const res = await explainMutation.mutateAsync({ design });
      setResult(res.explanation);
    } catch { toast.error("Could not generate PM explanation. Please try again."); }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Paste your technical design. The AI rewrites it in non-technical language — practicing the IC7 skill of communicating architecture to PMs and business stakeholders.</p>
      <textarea value={design} onChange={e => setDesign(e.target.value)}
        placeholder="Describe your technical design…" rows={5}
        className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y" />
      <button onClick={handleExplain} disabled={explainMutation.isPending}
        className="w-full py-2.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-300 text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        <Zap size={14} />
        {explainMutation.isPending ? "Translating for PM…" : "Explain Like a PM"}
      </button>
      {result && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-orange-400 uppercase tracking-wider">PM-Friendly Explanation</div>
          <div className="bg-secondary/40 rounded-lg p-4 text-sm">
            <Streamdown>{result}</Streamdown>
          </div>
          <button onClick={() => setResult(null)} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Clear</button>
        </div>
      )}
    </div>
  );
}

// ── 10. Time-Boxed Practice Timer ─────────────────────────────────────────────
const TIMER_PRESETS = [
  { label: "45 min (Standard)", total: 45 * 60, phases: [
    { name: "Requirements", end: 5 * 60 },
    { name: "Scale Estimation", end: 8 * 60 },
    { name: "High-Level Design", end: 18 * 60 },
    { name: "Deep Dive", end: 38 * 60 },
    { name: "Trade-offs & Wrap-up", end: 45 * 60 },
  ]},
  { label: "60 min (Extended)", total: 60 * 60, phases: [
    { name: "Requirements", end: 7 * 60 },
    { name: "Scale Estimation", end: 12 * 60 },
    { name: "High-Level Design", end: 25 * 60 },
    { name: "Deep Dive", end: 50 * 60 },
    { name: "Trade-offs & Wrap-up", end: 60 * 60 },
  ]},
  { label: "30 min (Quick Practice)", total: 30 * 60, phases: [
    { name: "Requirements", end: 4 * 60 },
    { name: "Scale Estimation", end: 7 * 60 },
    { name: "High-Level Design", end: 15 * 60 },
    { name: "Deep Dive", end: 26 * 60 },
    { name: "Trade-offs & Wrap-up", end: 30 * 60 },
  ]},
];

export function TimeBoxedPracticeTimer() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const preset = TIMER_PRESETS[presetIdx];
  const remaining = preset.total - elapsed;
  const pct = (elapsed / preset.total) * 100;

  const currentPhaseIdx = preset.phases.findIndex(p => elapsed < p.end);
  const currentPhase = currentPhaseIdx >= 0 ? preset.phases[currentPhaseIdx] : preset.phases[preset.phases.length - 1];
  const phaseStart = currentPhaseIdx > 0 ? preset.phases[currentPhaseIdx - 1].end : 0;
  const phaseElapsed = elapsed - phaseStart;
  const phaseDuration = currentPhase.end - phaseStart;
  const phasePct = Math.min((phaseElapsed / phaseDuration) * 100, 100);

  const nextPhase = currentPhaseIdx >= 0 && currentPhaseIdx < preset.phases.length - 1 ? preset.phases[currentPhaseIdx + 1] : null;
  const timeToNext = nextPhase ? nextPhase.end - elapsed : 0;

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e + 1 >= preset.total) { setRunning(false); return preset.total; }
          // Phase transition alert
          const newElapsed = e + 1;
          const prevPhaseIdx = preset.phases.findIndex(p => e < p.end);
          const newPhaseIdx = preset.phases.findIndex(p => newElapsed < p.end);
          if (prevPhaseIdx !== newPhaseIdx && newPhaseIdx >= 0) {
            toast.info(`⏱ Now: ${preset.phases[newPhaseIdx].name}`, { duration: 3000 });
          }
          return newElapsed;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, preset]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const reset = () => { setRunning(false); setElapsed(0); };

  const isOvertime = elapsed >= preset.total;
  const isWarning = timeToNext > 0 && timeToNext <= 60;

  return (
    <div className="space-y-4">
      {/* Preset selector */}
      <div className="flex gap-1 bg-secondary/40 rounded-lg p-1">
        {TIMER_PRESETS.map((p, i) => (
          <button key={i} onClick={() => { setPresetIdx(i); reset(); }}
            className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${presetIdx === i ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {p.label.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Main timer display */}
      <div className="text-center space-y-2">
        <div className={`text-5xl font-black font-mono tabular-nums ${isOvertime ? "text-red-400" : isWarning ? "text-amber-400" : "text-foreground"}`}>
          {isOvertime ? "+" + fmt(elapsed - preset.total) : fmt(remaining)}
        </div>
        <div className="text-xs text-muted-foreground">{isOvertime ? "Overtime!" : `${fmt(elapsed)} elapsed`}</div>
      </div>

      {/* Overall progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 transition-all duration-1000 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>

      {/* Phase indicator */}
      <div className={`p-3 rounded-lg border ${isWarning ? "bg-amber-500/10 border-amber-500/30" : "bg-secondary/40 border-border"}`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-bold ${isWarning ? "text-amber-400" : "text-blue-400"}`}>
            {isWarning ? "⚠️ " : ""}Phase {currentPhaseIdx + 1}/{preset.phases.length}: {currentPhase.name}
          </span>
          {nextPhase && <span className="text-xs text-muted-foreground">Next: {nextPhase.name} in {fmt(timeToNext)}</span>}
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-1000 rounded-full" style={{ width: `${phasePct}%` }} />
        </div>
      </div>

      {/* Phase checklist */}
      <div className="grid grid-cols-5 gap-1">
        {preset.phases.map((p, i) => {
          const done = elapsed >= p.end;
          const active = i === currentPhaseIdx;
          return (
            <div key={i} className={`text-center p-1.5 rounded text-[10px] font-semibold transition-all ${done ? "bg-emerald-500/20 text-emerald-400" : active ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40" : "bg-secondary text-muted-foreground"}`}>
              {done ? "✓" : active ? "▶" : ""} {p.name.split(" ")[0]}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button onClick={() => setRunning(r => !r)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${running ? "bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300" : "bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300"}`}>
          {running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> {elapsed > 0 ? "Resume" : "Start"}</>}
        </button>
        <button onClick={reset} className="px-4 py-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground transition-all">
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}

// ── 11. Enhanced Question Bank with Difficulty Tiers ─────────────────────────
const ENHANCED_QUESTIONS = [
  // Coding-Adjacent (45 min)
  { title: "Design a URL Shortener", tier: "Coding-Adjacent", duration: "45 min", tags: ["Hashing", "Redirection", "Analytics"], metaRelevance: "Medium" },
  { title: "Design a Rate Limiter", tier: "Coding-Adjacent", duration: "45 min", tags: ["Token Bucket", "Sliding Window", "Redis"], metaRelevance: "High" },
  { title: "Design a Key-Value Store", tier: "Coding-Adjacent", duration: "45 min", tags: ["LSM Tree", "Consistent Hashing", "Replication"], metaRelevance: "High" },
  { title: "Design a Web Crawler", tier: "Coding-Adjacent", duration: "45 min", tags: ["BFS", "Politeness", "Deduplication"], metaRelevance: "Medium" },
  { title: "Design a Pastebin", tier: "Coding-Adjacent", duration: "45 min", tags: ["Blob Storage", "CDN", "Expiry"], metaRelevance: "Low" },
  // Full System Design (60 min)
  { title: "Design Facebook News Feed", tier: "Full System Design", duration: "60 min", tags: ["Fan-out", "Ranking", "Pagination"], metaRelevance: "Critical" },
  { title: "Design Instagram Reels Ranking", tier: "Full System Design", duration: "60 min", tags: ["ML Ranking", "Feature Store", "Real-time"], metaRelevance: "Critical" },
  { title: "Design WhatsApp Message Delivery", tier: "Full System Design", duration: "60 min", tags: ["E2E Encryption", "Offline Delivery", "Presence"], metaRelevance: "Critical" },
  { title: "Design Meta's Notification System", tier: "Full System Design", duration: "60 min", tags: ["Push/Pull", "Fan-out", "Delivery Guarantees"], metaRelevance: "Critical" },
  { title: "Design Instagram", tier: "Full System Design", duration: "60 min", tags: ["CDN", "Media Storage", "Feed Generation"], metaRelevance: "Critical" },
  { title: "Design Facebook Messenger", tier: "Full System Design", duration: "60 min", tags: ["WebSockets", "Message Storage", "Presence"], metaRelevance: "Critical" },
  { title: "Design a Distributed Cache (Memcache-style)", tier: "Full System Design", duration: "60 min", tags: ["Consistent Hashing", "Eviction", "Thundering Herd"], metaRelevance: "Critical" },
  { title: "Design Meta's Ad Targeting Pipeline", tier: "Full System Design", duration: "60 min", tags: ["ML Pipeline", "Real-time Bidding", "Privacy"], metaRelevance: "Critical" },
  { title: "Design a Real-time Presence System", tier: "Full System Design", duration: "60 min", tags: ["WebSockets", "Heartbeat", "Pub/Sub"], metaRelevance: "High" },
  { title: "Design a Search Autocomplete Service", tier: "Full System Design", duration: "60 min", tags: ["Trie", "Top-K", "Ranking"], metaRelevance: "High" },
  // Deep Dive (45 min, one component)
  { title: "Deep Dive: News Feed Ranking Algorithm", tier: "Deep Dive", duration: "45 min", tags: ["ML Features", "Scoring", "A/B Testing"], metaRelevance: "Critical" },
  { title: "Deep Dive: Distributed Database Sharding", tier: "Deep Dive", duration: "45 min", tags: ["Consistent Hashing", "Hot Spots", "Rebalancing"], metaRelevance: "High" },
  { title: "Deep Dive: Cache Invalidation Strategy", tier: "Deep Dive", duration: "45 min", tags: ["TTL", "Write-through", "Event-driven"], metaRelevance: "High" },
  { title: "Deep Dive: Message Queue Design", tier: "Deep Dive", duration: "45 min", tags: ["At-least-once", "Idempotency", "Dead Letter Queue"], metaRelevance: "High" },
  { title: "Deep Dive: API Gateway Design", tier: "Deep Dive", duration: "45 min", tags: ["Rate Limiting", "Auth", "Load Balancing"], metaRelevance: "High" },
];

const tierColors: Record<string, string> = {
  "Coding-Adjacent": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  "Full System Design": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "Deep Dive": "text-purple-400 bg-purple-500/10 border-purple-500/20",
};
const relevanceColors: Record<string, string> = {
  "Critical": "text-red-400",
  "High": "text-amber-400",
  "Medium": "text-blue-400",
  "Low": "text-muted-foreground",
};

export function EnhancedQuestionBank() {
  const [tierFilter, setTierFilter] = useState("All");
  const [relevanceFilter, setRelevanceFilter] = useState("All");
  const tiers = ["All", "Coding-Adjacent", "Full System Design", "Deep Dive"];
  const relevances = ["All", "Critical", "High", "Medium", "Low"];
  const filtered = ENHANCED_QUESTIONS.filter(q =>
    (tierFilter === "All" || q.tier === tierFilter) &&
    (relevanceFilter === "All" || q.metaRelevance === relevanceFilter)
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Questions categorised by Meta interview round type and Meta relevance. Start with Critical + Full System Design for maximum ROI.</p>
      <div className="space-y-2">
        <div className="flex gap-1 flex-wrap">
          {tiers.map(t => (
            <button key={t} onClick={() => setTierFilter(t)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${tierFilter === t ? "bg-blue-600/30 text-blue-300 border border-blue-500/40" : "bg-secondary text-muted-foreground border border-border hover:border-blue-500/30"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {relevances.map(r => (
            <button key={r} onClick={() => setRelevanceFilter(r)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${relevanceFilter === r ? "bg-amber-600/30 text-amber-300 border border-amber-500/40" : "bg-secondary text-muted-foreground border border-border hover:border-amber-500/30"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="text-xs text-muted-foreground">{filtered.length} questions</div>
      <div className="space-y-2">
        {filtered.map((q, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border hover:border-blue-500/20 transition-all">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tierColors[q.tier]}`}>{q.tier}</span>
                <span className="text-[10px] text-muted-foreground">{q.duration}</span>
                <span className={`text-[10px] font-bold ml-auto ${relevanceColors[q.metaRelevance]}`}>{q.metaRelevance}</span>
              </div>
              <div className="text-sm font-semibold text-foreground">{q.title}</div>
              <div className="flex gap-1 flex-wrap mt-1">
                {q.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{tag}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
