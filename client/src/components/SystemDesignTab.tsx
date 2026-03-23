// Design: Bold Engineering Dashboard — System Design Tab
import { useState } from "react";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/data";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Brain,
  Database,
  Server,
  Shield,
  BarChart3,
  Zap,
  GitBranch,
  Search,
  HelpCircle,
} from "lucide-react";
import { useFlashCardSRDue } from "@/hooks/useLocalStorage";
import { SystemDesignMockSession } from "@/components/SystemDesignMockSession";
import {
  CapacityCalculator,
  DesignPatternLibrary,
  FlashCardCSVImport,
} from "@/components/SystemDesignExtras";
import { SystemDesignDiagramTemplates } from "@/components/SystemDesignDiagramTemplates";
import SystemDesignFailureAnalysis from "@/components/SystemDesignFailureAnalysis";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { AIInterviewerInterruptMode } from "@/components/AIInterviewerInterruptMode";
import { BackOfEnvelopeCalculator } from "@/components/BackOfEnvelopeCalculator";
import { TearDownMyDesign } from "@/components/TearDownMyDesign";
import { FeatureHeatmapRow } from "@/components/FeatureHeatmapRow";
import {
  GuidedDesignWalkthrough,
  TradeoffDecisionSimulator,
  MetaComponentLibrary,
  ScaleEstimationCalculator,
  AntiPatternDetector,
  PeerDesignReview,
  DesignDocGenerator,
  ComplexityCheatSheet,
  ExplainLikeAPM,
  TimeBoxedPracticeTimer,
  EnhancedQuestionBank,
} from "@/components/SystemDesignEnhancements";

const FRAMEWORK_STEPS = [
  {
    step: "1. Requirements",
    time: "5 min",
    items: [
      "Functional: what the system must do",
      "Non-functional: scale, latency, availability, consistency",
      "Ask: DAU, QPS, data volume, read/write ratio",
      "Clarify: global vs regional, mobile vs web",
    ],
  },
  {
    step: "2. Capacity Estimation",
    time: "3 min",
    items: [
      "Storage: daily writes × record size × retention",
      "Bandwidth: QPS × avg payload size",
      "Compute: QPS / requests-per-server",
      "Cache: 20% of daily reads (Pareto principle)",
    ],
  },
  {
    step: "3. High-Level Design",
    time: "10 min",
    items: [
      "Draw core components: clients, LB, API servers, DB, cache",
      "Define APIs (REST/GraphQL/gRPC)",
      "Choose SQL vs NoSQL with justification",
      "Identify the core data flow end-to-end",
    ],
  },
  {
    step: "4. Deep Dive",
    time: "15 min",
    items: [
      "Pick 2–3 components to deep-dive (interviewer may guide)",
      "Database schema and indexing strategy",
      "Caching strategy: what to cache, eviction policy, TTL",
      "Scalability: sharding, replication, partitioning",
    ],
  },
  {
    step: "5. Bottlenecks & Trade-offs",
    time: "5 min",
    items: [
      "Identify single points of failure",
      "Discuss consistency vs availability (CAP theorem)",
      "Address hot spots, thundering herd, cascading failures",
      "Propose monitoring and alerting strategy",
    ],
  },
];

const L7_SIGNALS = [
  "Proactively identifies constraints the interviewer hasn't mentioned",
  "Discusses operational concerns: deployment, rollback, observability",
  "Quantifies trade-offs with numbers, not just words",
  "Proposes phased rollout strategy for risky changes",
  "Connects technical decisions to business impact",
  "Challenges assumptions and proposes alternatives",
];

// ML System Design data from systemdesignhandbook.com/guides/ml-system-design/
const ML_OBJECTIVES = [
  {
    label: "Scalability",
    desc: "Handle growing data volumes and user requests; often requires horizontal scaling of inference nodes.",
  },
  {
    label: "Low Latency",
    desc: "Fraud detection or search require low tens of milliseconds to keep the user experience seamless.",
  },
  {
    label: "Reliability",
    desc: "Maintain consistent performance even in the presence of hardware failures or network partitions.",
  },
  {
    label: "Adaptability",
    desc: "Support continuous learning so models evolve as data distributions change over time.",
  },
  {
    label: "Explainability & Fairness",
    desc: "Enable monitoring for bias and provide transparency into why specific predictions were made.",
  },
];

const ML_ARCH_LAYERS = [
  {
    icon: "📥",
    step: "1. Data Ingestion",
    desc: "Collect from logs, APIs, IoT sensors. Use streaming platforms (Kafka, Kinesis) for real-time events.",
  },
  {
    icon: "🗄️",
    step: "2. Data Storage",
    desc: "Cold (S3) for historical data, operational (Cassandra/Postgres) for recent data, hot (Redis) for low-latency feature access.",
  },
  {
    icon: "⚙️",
    step: "3. Feature Extraction",
    desc: "Clean, normalize, transform raw data into numerical features using Spark/Beam. Populate feature store to prevent training-serving skew.",
  },
  {
    icon: "🧠",
    step: "4. Model Training",
    desc: "Distributed clusters with TensorFlow/PyTorch/XGBoost. Offline evaluation on historical data using AUC/RMSE before promotion.",
  },
  {
    icon: "📦",
    step: "5. Model Deployment",
    desc: "Containerize (Docker), apply quantization to reduce size/latency, run optimization steps before production packaging.",
  },
  {
    icon: "🚀",
    step: "6. Model Serving",
    desc: "REST/gRPC inference APIs with load balancing. Hardware acceleration (GPU/TPU) for deep learning models.",
  },
  {
    icon: "📊",
    step: "7. Monitoring & Feedback",
    desc: "Track accuracy, latency, concept drift. Capture ground truth labels to trigger retraining and close the loop.",
  },
];

const ML_COMPONENTS = [
  {
    icon: <Database size={14} />,
    name: "Feature Store",
    desc: "Centralized repository ensuring identical feature computation in training and inference. Prevents training-serving skew. Tools: Feast, Tecton (backed by Redis).",
  },
  {
    icon: <Server size={14} />,
    name: "Model Training Service",
    desc: "Manages distributed training jobs: resource allocation, hyperparameter tuning, checkpointing, data/model parallelism.",
  },
  {
    icon: <GitBranch size={14} />,
    name: "Model Registry",
    desc: "Version-control for ML models. Tracks lineage, metadata, performance metrics. Enables governance and rollback. Tools: MLflow, SageMaker Registry.",
  },
  {
    icon: <Zap size={14} />,
    name: "Inference API",
    desc: "Exposes model via REST/gRPC. Handles thousands of concurrent requests. Includes A/B testing and canary deployment logic.",
  },
  {
    icon: <BarChart3 size={14} />,
    name: "Monitoring & Feedback Loop",
    desc: "Tracks prediction accuracy, latency, and concept drift. Collects new labels to feed back into the training pipeline.",
  },
];

const ML_TRADEOFFS = [
  {
    aspect: "Accuracy vs Latency",
    traditional: "Higher accuracy",
    ml: "Simpler/quantized model for speed",
  },
  {
    aspect: "Batch vs Real-time",
    traditional: "Overnight batch (cheaper)",
    ml: "Real-time streaming (fresher)",
  },
  {
    aspect: "Model size vs Cost",
    traditional: "Large deep learning model",
    ml: "Distilled/pruned model",
  },
  {
    aspect: "Freshness vs Stability",
    traditional: "Frequent retraining",
    ml: "Stable but potentially stale",
  },
  {
    aspect: "Explainability vs Power",
    traditional: "Linear/tree models (interpretable)",
    ml: "Deep learning (black box)",
  },
];

const ML_INTERVIEW_STEPS = [
  {
    step: "1. Clarify the Problem",
    desc: "Define the business goal (e.g., maximize watch time) and what the system predicts.",
  },
  {
    step: "2. Estimate the Scale",
    desc: "Discuss data volume, QPS, and latency targets (e.g., <100ms p99).",
  },
  {
    step: "3. Outline Architecture",
    desc: "Draw the high-level data pipeline, training, and inference layers.",
  },
  {
    step: "4. Deep Dive Components",
    desc: "Discuss the feature store, model registry, and serving strategy in detail.",
  },
  {
    step: "5. Discuss Trade-offs",
    desc: "Highlight decisions around accuracy vs cost, batch vs real-time, model size vs latency.",
  },
  {
    step: "6. Reliability & Ethics",
    desc: "Mention fallback mechanisms, bias detection, differential privacy, and monitoring.",
  },
  {
    step: "7. Conclude with Improvements",
    desc: "Suggest evolution path (e.g., batch → real-time, single model → ensemble).",
  },
];

export default function SystemDesignTab() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState("All");
  const [mlSection, setMlSection] = useState<string | null>(null);

  const filtered = SYSTEM_DESIGN_QUESTIONS.filter(
    q => filterLevel === "All" || q.level === filterLevel
  );

  return (
    <div className="space-y-5">
      {/* ═══ HIGH IMPACT FEATURES — TOP OF PAGE ═══════════════════════════════ */}
      <FeatureHeatmapRow
        featureKeys={[
          "ai_interviewer_interrupt",
          "back_of_envelope",
          "tear_down_my_design",
        ]}
      />
      <AIInterviewerInterruptMode />
      <BackOfEnvelopeCalculator />
      <TearDownMyDesign />
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Quick Actions sticky row */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-background/90 backdrop-blur-sm border-b border-border flex items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block">
          Quick Actions
        </span>
        <div className="flex gap-2 flex-1 flex-wrap">
          <button
            onClick={() => {
              const el = document.getElementById("sysdesign-diagram-templates");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold transition-all"
          >
            <GitBranch size={12} />
            Open Diagram Template
            <kbd className="ml-1 px-1 py-0.5 rounded text-[9px] font-mono bg-violet-900/40 text-violet-400 border border-violet-700/40">
              ⌥4
            </kbd>
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("sysdesign-mock-session");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all"
          >
            <Brain size={12} />
            Start SD Mock
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("sysdesign-capacity-calc");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all"
          >
            <Database size={12} />
            Start Capacity Calc
          </button>
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
      </div>

      {/* ═══════════════════════════════════════════════════════════════
           🚨 META SYSTEM DESIGN PREP 2026 — MUST READ GUIDE
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-xl border-2 border-transparent"
        style={{
          background:
            "linear-gradient(135deg, #1a0533 0%, #0d1f3c 40%, #0a2a1a 100%)",
          boxShadow:
            "0 0 40px rgba(168,85,247,0.25), 0 0 80px rgba(59,130,246,0.15)",
        }}
      >
        {/* Animated rainbow border */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, #f59e0b, #ef4444, #8b5cf6, #3b82f6, #10b981, #f59e0b)",
            backgroundSize: "300% 100%",
            animation: "borderMarch 3s linear infinite",
            padding: "2px",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />

        {/* Glowing header */}
        <div className="relative p-5 border-b border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-2xl"
                  style={{ animation: "bounce 1s ease-in-out infinite" }}
                >
                  🚨
                </span>
                <span
                  className="text-lg font-black tracking-tight"
                  style={{
                    background:
                      "linear-gradient(90deg, #fbbf24, #f87171, #a78bfa, #60a5fa, #34d399)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    animation: "gradientShift 3s linear infinite",
                  }}
                >
                  META SYSTEM DESIGN PREP 2026
                </span>
                <span
                  className="text-2xl"
                  style={{ animation: "bounce 1s ease-in-out infinite 0.2s" }}
                >
                  🚨
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                🎯 L6/L7 Targeted · ML + Backend + Full Stack · All 3 Tracks ·
                Updated 2026
              </div>
            </div>
            <a
              href="https://d2xsxph8kpxj0f.cloudfront.net/310519663323723940/cRTBYDQNffnDPa87zbUz9b/meta-system-design-guide-2026_57e76a36.html"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black"
              style={{
                background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                boxShadow: "0 0 15px rgba(251,191,36,0.5)",
                animation: "pulse 2s ease-in-out infinite",
              }}
            >
              🔗 Open Full Guide <ExternalLink size={11} />
            </a>
          </div>

          {/* Challenge banner */}
          <div
            className="mt-3 p-3 rounded-lg text-xs font-semibold text-center"
            style={{
              background:
                "linear-gradient(90deg, rgba(239,68,68,0.2), rgba(168,85,247,0.2), rgba(59,130,246,0.2))",
              border: "1px solid rgba(255,255,255,0.1)",
              animation: "pulse 3s ease-in-out infinite",
            }}
          >
            ⚡ Can you answer all 6 ML questions + 6 SWE questions cold? 💀 Most
            L5s can't. L6/L7 candidates who pass have practised every single
            one. 🔥
          </div>
        </div>

        {/* Track selector */}
        <div className="p-5 space-y-4">
          {/* Interview Loop */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔄</span>
                <span className="text-sm font-bold text-white">
                  Meta's Full Interview Loop Structure
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  MUST KNOW
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <div className="mt-2 space-y-2 pl-2">
              {[
                {
                  n: "1",
                  title: "Recruiter Screen",
                  desc: "Background, motivation, cultural alignment. ~30 min.",
                  color: "text-slate-300",
                  bg: "bg-slate-500/10",
                },
                {
                  n: "2",
                  title: "Technical Phone Screen",
                  desc: "1 coding round (2 medium LeetCode problems) + optional behavioral. CoderPad. ~45–60 min.",
                  color: "text-blue-300",
                  bg: "bg-blue-500/10",
                  gate: "Must pass to reach onsite",
                },
                {
                  n: "3",
                  title: "Onsite Full Loop (4–6 Rounds)",
                  desc: "1–2 Coding, 1–2 System/Product Design, 1 Behavioral, optionally 1 Project Retrospective (E6+). 45 min each.",
                  color: "text-purple-300",
                  bg: "bg-purple-500/10",
                },
                {
                  n: "4",
                  title: "Hiring Committee Review",
                  desc: "All packets reviewed collectively. Level determination (E5 vs E6) happens here.",
                  color: "text-amber-300",
                  bg: "bg-amber-500/10",
                },
                {
                  n: "5",
                  title: "Team Match & Offer",
                  desc: "Candidate selects a team and enters offer negotiation.",
                  color: "text-emerald-300",
                  bg: "bg-emerald-500/10",
                },
              ].map(s => (
                <div
                  key={s.n}
                  className={`flex gap-3 p-3 rounded-lg ${s.bg} border border-white/5`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${s.color} bg-white/10`}
                  >
                    {s.n}
                  </span>
                  <div>
                    <div className={`text-xs font-bold ${s.color}`}>
                      {s.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {s.desc}
                    </div>
                    {s.gate && (
                      <div className="mt-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded inline-block">
                        🚧 Gate: {s.gate}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                💡 <strong>Critical:</strong> The design round in the onsite
                carries more weight than the technical screen design round. It
                is the{" "}
                <strong>single most common reason E6+ candidates fail.</strong>
              </div>
            </div>
          </details>

          {/* 3 Tracks */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛤️</span>
                <span className="text-sm font-bold text-white">
                  3 Interview Tracks — Which One Are You?
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  PICK YOURS
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-3 text-slate-400 font-semibold">
                      Track
                    </th>
                    <th className="text-left py-2 pr-3 text-slate-400 font-semibold">
                      Levels
                    </th>
                    <th className="text-left py-2 pr-3 text-slate-400 font-semibold">
                      Interview Type
                    </th>
                    <th className="text-left py-2 text-slate-400 font-semibold">
                      Key Focus
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    [
                      "🤖 ML System Design",
                      "L6 (E6), L7 (E7)",
                      "ML System Design (45 min)",
                      "Ranking, Recommendations, Ads, Feature Engineering, Model Deployment",
                    ],
                    [
                      "⚙️ Back End / System Generalist",
                      "L5–L7",
                      "Systems Design (45 min)",
                      "Distributed systems, Scalability, Availability, Sharding, Caching",
                    ],
                    [
                      "🖥️ Full Stack / Product Generalist",
                      "L5–L7",
                      "Product Architecture (45 min)",
                      "API design, Data models, Client-server, Protocols, Usability",
                    ],
                  ].map(([track, levels, type, focus]) => (
                    <tr key={track as string}>
                      <td className="py-2 pr-3 font-semibold text-white">
                        {track}
                      </td>
                      <td className="py-2 pr-3 text-slate-300">{levels}</td>
                      <td className="py-2 pr-3 text-slate-300">{type}</td>
                      <td className="py-2 text-slate-400">{focus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* 5 ML Signals */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">📡</span>
                <span className="text-sm font-bold text-white">
                  5 Signals Meta Evaluates in ML System Design
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OFFICIAL
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <div className="mt-2 space-y-2 pl-2">
              {[
                {
                  n: "01",
                  emoji: "🗺️",
                  title: "Problem Navigation",
                  desc: "Visualize and organize the entire problem and solution space. Connect business context and needs to ML decisions.",
                },
                {
                  n: "02",
                  emoji: "🗄️",
                  title: "Training Data",
                  desc: "Identify methods to collect training data. Evaluate constraints and risks with the proposed method.",
                },
                {
                  n: "03",
                  emoji: "⚙️",
                  title: "Feature Engineering",
                  desc: "Come up with relevant ML features. Identify the most important features for the specific task.",
                },
                {
                  n: "04",
                  emoji: "🧠",
                  title: "Modeling",
                  desc: "Explain modeling choices. Justify model selection. Explain the trade-offs between different approaches.",
                },
                {
                  n: "05",
                  emoji: "📊",
                  title: "Evaluation",
                  desc: "Define offline and online metrics. Design A/B testing strategy. Identify feedback loops and data drift.",
                },
              ].map(s => (
                <div
                  key={s.n}
                  className="flex gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                >
                  <span className="text-emerald-400 font-black text-xs w-6 shrink-0 mt-0.5">
                    {s.n}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-emerald-300">
                      {s.emoji} {s.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* 4 SWE Signals */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <span className="text-sm font-bold text-white">
                  4 Signals Meta Evaluates in SWE System Design
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  OFFICIAL
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <div className="mt-2 space-y-2 pl-2">
              {[
                {
                  n: "01",
                  emoji: "🗺️",
                  title: "Problem Navigation",
                  desc: "Organize the problem space, constraints, and potential solutions. Ask questions to reduce ambiguity before designing.",
                },
                {
                  n: "02",
                  emoji: "🏗️",
                  title: "Solution Design",
                  desc: "Design a working solution that addresses the complete problem. Consider the big picture before diving into details.",
                },
                {
                  n: "03",
                  emoji: "⚡",
                  title: "Technical Excellence",
                  desc: "Dive into technical details. Identify dependencies and trade-offs. Mitigate risks proactively.",
                },
                {
                  n: "04",
                  emoji: "💬",
                  title: "Technical Communication",
                  desc: "Articulate your vision and technical ideas clearly. Understand and address feedback from the interviewer.",
                },
              ].map(s => (
                <div
                  key={s.n}
                  className="flex gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10"
                >
                  <span className="text-blue-400 font-black text-xs w-6 shrink-0 mt-0.5">
                    {s.n}
                  </span>
                  <div>
                    <div className="text-xs font-bold text-blue-300">
                      {s.emoji} {s.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* L6 vs L7 Pass/Fail */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚖️</span>
                <span className="text-sm font-bold text-white">
                  L4/L5/L6/L7 — What Separates Pass from Fail 💀
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                  CRITICAL
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 pr-3 text-slate-400 font-semibold">
                      Dimension
                    </th>
                    <th className="text-left py-2 pr-3 text-emerald-400 font-semibold">
                      ✅ Passing (E6/E7)
                    </th>
                    <th className="text-left py-2 text-red-400 font-semibold">
                      ❌ Failing / Down-levelled
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    [
                      "Scope Definition",
                      "Proactively narrows scope, identifies the right problem",
                      "Jumps into design without clarifying requirements",
                    ],
                    [
                      "Scale Thinking",
                      "Specific strategies (sharding, CDN, event-driven) at Meta's scale",
                      "Generic 'add more servers' or 'use a database'",
                    ],
                    [
                      "Trade-off Articulation",
                      "Identifies trade-offs (consistency vs. availability) and defends choices",
                      "Presents only one solution without comparing alternatives",
                    ],
                    [
                      "Communication",
                      "Thinks out loud, incorporates feedback, treats it as a conversation",
                      "Goes silent, presents a monologue, ignores hints",
                    ],
                    [
                      "Leadership Signal (E6+)",
                      "Discusses team build plan, milestones, and organizational impact",
                      "Focuses only on technical architecture without team/org context",
                    ],
                  ].map(([dim, pass, fail]) => (
                    <tr key={dim as string}>
                      <td className="py-2 pr-3 font-semibold text-white">
                        {dim}
                      </td>
                      <td className="py-2 pr-3 text-emerald-300">{pass}</td>
                      <td className="py-2 text-red-300">{fail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {/* Example Questions — ML */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">🤖</span>
                <span className="text-sm font-bold text-white">
                  ML System Design — Example Questions 🔥
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  PRACTICE THESE
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <div className="mt-2 space-y-2 pl-2">
              {[
                [
                  "🏆",
                  "Design a personalised news ranking system",
                  "Ranking, user signals, real-time feature serving",
                ],
                [
                  "🛍️",
                  "Design a product recommendation system",
                  "Collaborative filtering, embeddings, cold-start problem",
                ],
                [
                  "📢",
                  "Design an evaluation framework for ads ranking",
                  "Offline/online metrics, A/B testing, feedback loops",
                ],
                [
                  "🛡️",
                  "Design a content moderation system",
                  "Multi-label classification, human-in-the-loop, safety",
                ],
                [
                  "👥",
                  "Design a friend recommendation system",
                  "Graph-based ML, link prediction, scalability",
                ],
                [
                  "🚨",
                  "Design a fraud detection system",
                  "Anomaly detection, imbalanced data, real-time inference",
                ],
              ].map(([emoji, q, challenge]) => (
                <div
                  key={q as string}
                  className="flex gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-colors"
                >
                  <span className="text-base shrink-0">{emoji}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{q}</div>
                    <div className="text-[10px] text-purple-300 mt-0.5">
                      Core challenge: {challenge}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* Example Questions — SWE */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚙️</span>
                <span className="text-sm font-bold text-white">
                  SWE System Design — Example Questions 🔥
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  PRACTICE THESE
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <div className="mt-2 space-y-2 pl-2">
              {[
                [
                  "🔗",
                  "Design a URL shortener (like bit.ly)",
                  "Hashing, redirects, analytics at scale",
                ],
                [
                  "📰",
                  "Design Facebook's News Feed",
                  "Fan-out on write vs. read, ranking, real-time updates",
                ],
                [
                  "🎬",
                  "Design a worldwide video distribution system",
                  "CDN, transcoding pipeline, storage at scale",
                ],
                [
                  "📊",
                  "Design an ad impressions aggregator",
                  "Stream processing, approximate counting, data pipelines",
                ],
                [
                  "⚡",
                  "Design a distributed cache",
                  "Consistent hashing, eviction policies, replication",
                ],
                [
                  "💬",
                  "Design a real-time messaging system (like WhatsApp)",
                  "WebSockets, message ordering, delivery guarantees",
                ],
              ].map(([emoji, q, challenge]) => (
                <div
                  key={q as string}
                  className="flex gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors"
                >
                  <span className="text-base shrink-0">{emoji}</span>
                  <div>
                    <div className="text-xs font-bold text-white">{q}</div>
                    <div className="text-[10px] text-blue-300 mt-0.5">
                      Core challenge: {challenge}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* Official Resources */}
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer list-none p-3 rounded-lg hover:bg-white/5 transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-lg">📚</span>
                <span className="text-sm font-bold text-white">
                  Official Meta Resources + Top Prep Platforms
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  FREE PDFs
                </span>
              </div>
              <ChevronDown
                size={14}
                className="text-slate-400 group-open:rotate-180 transition-transform"
              />
            </summary>
            <div className="mt-2 space-y-2 pl-2">
              {[
                {
                  emoji: "📄",
                  title: "Official Meta ML Onsite Guide (PDF)",
                  desc: "Covers Coding, ML System Design, Behavioral rounds with exact evaluation criteria",
                  href: "https://d3no4ktch0fdq4.cloudfront.net/public/course/files/Meta_ML_onsite_interview_prep.pdf",
                  tag: "FREE",
                  tagColor: "text-emerald-400",
                },
                {
                  emoji: "📄",
                  title: "Official Meta ML Initial Screen Guide (PDF)",
                  desc: "Covers coding and ML design components of the phone screen round",
                  href: "https://d3no4ktch0fdq4.cloudfront.net/public/course/files/Meta_ML_initial_interview_prep.pdf",
                  tag: "FREE",
                  tagColor: "text-emerald-400",
                },
                {
                  emoji: "📄",
                  title: "Official Meta SWE Full Loop Guide (PDF)",
                  desc: "System Design, Product Architecture, evaluation criteria for Full Stack / Back End",
                  href: "https://d3no4ktch0fdq4.cloudfront.net/public/course/files/Meta_SWE_full_loop_guide.pdf",
                  tag: "FREE",
                  tagColor: "text-emerald-400",
                },
                {
                  emoji: "🎓",
                  title: "HelloInterview — System Design in a Hurry",
                  desc: "Built by FAANG hiring managers. Delivery framework, core concepts, question breakdowns. Updated 2026.",
                  href: "https://www.hellointerview.com/learn/system-design/in-a-hurry/introduction",
                  tag: "FREE",
                  tagColor: "text-emerald-400",
                },
                {
                  emoji: "🚀",
                  title: "Exponent — 79 Verified Meta Questions",
                  desc: "79 verified Meta system design questions with answers + ML system design course. Updated March 2026.",
                  href: "https://www.tryexponent.com/meta",
                  tag: "PAID",
                  tagColor: "text-amber-400",
                },
                {
                  emoji: "📦",
                  title: "ByteByteGo — Alex Xu",
                  desc: "Visual learners & Back End generalists. Step-by-step breakdowns with animations and diagrams.",
                  href: "https://bytebytego.com",
                  tag: "PAID",
                  tagColor: "text-amber-400",
                },
                {
                  emoji: "📋",
                  title: "GitHub: System Design Primer",
                  desc: "Official Meta recommendation. Comprehensive open-source resource on scalability, availability, consistency.",
                  href: "https://github.com/donnemartin/system-design-primer",
                  tag: "FREE",
                  tagColor: "text-emerald-400",
                },
              ].map(r => (
                <a
                  key={r.title}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group/link"
                >
                  <span className="text-base shrink-0">{r.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover/link:text-amber-300 transition-colors">
                        {r.title}
                      </span>
                      <span className={`text-[10px] font-bold ${r.tagColor}`}>
                        {r.tag}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {r.desc}
                    </div>
                  </div>
                  <ExternalLink
                    size={11}
                    className="text-slate-500 shrink-0 mt-0.5"
                  />
                </a>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Framework */}
      <div className="prep-card p-5">
        <div className="section-title">
          System Design Framework (38-min Interview)
        </div>
        <div className="space-y-2">
          {FRAMEWORK_STEPS.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border border-border overflow-hidden"
            >
              <button
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-all"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-foreground">
                  {s.step}
                </span>
                <span className="badge badge-gray">{s.time}</span>
                {expanded === i ? (
                  <ChevronUp size={13} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={13} className="text-muted-foreground" />
                )}
              </button>
              {expanded === i && (
                <div className="p-3 border-t border-border">
                  <ul className="space-y-1.5">
                    {s.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-xs text-muted-foreground"
                      >
                        <span className="text-blue-400 mt-0.5 shrink-0">·</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* L7 signals */}
      <div className="prep-card p-5 border-purple-500/20">
        <div className="section-title text-purple-400">
          L7 Differentiation Signals
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {L7_SIGNALS.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-muted-foreground"
            >
              <span className="text-purple-400 mt-0.5 shrink-0">✦</span>
              {s}
            </div>
          ))}
        </div>
      </div>

      {/* ─── ML System Design Section ─── */}
      <div className="prep-card overflow-hidden border-emerald-500/20">
        {/* Header */}
        <div className="p-4 border-b border-border bg-emerald-500/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={16} className="text-emerald-400" />
            <div>
              <div className="text-sm font-bold text-foreground">
                ML System Design Guide
              </div>
              <div className="text-xs text-muted-foreground">
                Complete lifecycle: data pipelines → training → serving →
                monitoring
              </div>
            </div>
          </div>
          <a
            href="https://www.systemdesignhandbook.com/guides/ml-system-design/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Source <ExternalLink size={11} />
          </a>
        </div>

        <div className="p-4 space-y-4">
          {/* What is ML System Design */}
          <div className="rounded-lg border border-border p-4 bg-secondary/30">
            <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <span className="text-emerald-400">◆</span> What is ML System
              Design?
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              ML System Design is the engineering discipline of architecting
              systems that can{" "}
              <strong className="text-foreground">
                train, deploy, and maintain
              </strong>{" "}
              machine learning models at production scale. It sits at the
              intersection of ML (accuracy, feature quality, optimization) and
              traditional System Design (scalability, latency, reliability).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold">
                      Aspect
                    </th>
                    <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold">
                      Traditional System
                    </th>
                    <th className="text-left py-1.5 text-muted-foreground font-semibold">
                      ML System
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    [
                      "Core logic",
                      "Handwritten rules / Business logic",
                      "Learned probabilistic models",
                    ],
                    [
                      "Data",
                      "Structured, schema-driven",
                      "High volume, distribution evolves",
                    ],
                    [
                      "Failure modes",
                      "Predictable (bugs, crashes)",
                      "Silent failures (drift, bias)",
                    ],
                    [
                      "Testing",
                      "Unit / Integration tests",
                      "A/B testing, offline evaluation",
                    ],
                    [
                      "Maintenance",
                      "Code updates",
                      "Continuous retraining & monitoring",
                    ],
                  ].map(([a, b, c]) => (
                    <tr key={a}>
                      <td className="py-1.5 pr-3 text-foreground font-medium">
                        {a}
                      </td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{b}</td>
                      <td className="py-1.5 text-muted-foreground">{c}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Core Objectives */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <span className="text-emerald-400">◆</span> Core Objectives
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {ML_OBJECTIVES.map(o => (
                <div
                  key={o.label}
                  className="p-3 rounded-lg bg-secondary border border-border"
                >
                  <div className="text-xs font-bold text-emerald-400 mb-1">
                    {o.label}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {o.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Architecture Layers */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() => setMlSection(mlSection === "arch" ? null : "arch")}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">◆</span> Step-by-Step
                Architecture (7 Layers)
              </span>
              {mlSection === "arch" ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
            </button>
            {mlSection === "arch" && (
              <div className="space-y-2">
                {ML_ARCH_LAYERS.map(l => (
                  <div
                    key={l.step}
                    className="flex gap-3 p-3 rounded-lg bg-secondary border border-border"
                  >
                    <span className="text-base shrink-0 mt-0.5">{l.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-foreground mb-0.5">
                        {l.step}
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {l.desc}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <strong>Note:</strong> Each layer enforces a contract — data
                  shape, freshness, latency, and correctness. Most production
                  issues arise when these contracts are implicit rather than
                  explicit.
                </div>
              </div>
            )}
          </div>

          {/* Core Components */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() =>
                setMlSection(mlSection === "components" ? null : "components")
              }
            >
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">◆</span> Core Components
              </span>
              {mlSection === "components" ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
            </button>
            {mlSection === "components" && (
              <div className="space-y-2">
                {ML_COMPONENTS.map(c => (
                  <div
                    key={c.name}
                    className="flex gap-3 p-3 rounded-lg bg-secondary border border-border"
                  >
                    <span className="text-emerald-400 shrink-0 mt-0.5">
                      {c.icon}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-foreground mb-0.5">
                        {c.name}
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        {c.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Batch vs Real-time + Training + Serving */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() =>
                setMlSection(mlSection === "serving" ? null : "serving")
              }
            >
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">◆</span> Batch vs Real-time ·
                Training · Serving Architecture
              </span>
              {mlSection === "serving" ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
            </button>
            {mlSection === "serving" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="text-xs font-bold text-blue-400 mb-2">
                      Batch Systems
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Process large datasets periodically (daily/weekly).
                      Suitable for offline analytics, pre-computed
                      recommendations, forecasting. Example: rebuilding
                      recommendation embeddings overnight.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="text-xs font-bold text-orange-400 mb-2">
                      Real-time Systems
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Respond to live inputs in milliseconds. Essential for
                      fraud detection, search ranking, dynamic pricing. Example:
                      blocking a suspicious credit card transaction instantly.
                    </p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">
                    Training Architecture
                  </div>
                  <div className="space-y-1.5">
                    {[
                      [
                        "Data Parallelism",
                        "Split data across workers; each trains a copy and computes gradients that are aggregated.",
                      ],
                      [
                        "Model Parallelism",
                        "Split large models (LLMs) across multiple GPUs/TPUs when they don't fit in a single device.",
                      ],
                      [
                        "Parameter Servers vs All-Reduce",
                        "Central node stores weights (param server) vs. ring all-reduce where workers exchange gradients directly.",
                      ],
                      [
                        "Checkpointing",
                        "Save model state periodically so training can resume from the last checkpoint after node failure.",
                      ],
                    ].map(([t, d]) => (
                      <div key={t as string} className="flex gap-2 text-xs">
                        <span className="text-emerald-400 shrink-0 font-semibold">
                          {t}:
                        </span>
                        <span className="text-muted-foreground">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">
                    Serving Flow
                  </div>
                  <div className="font-mono text-xs text-emerald-400 bg-background/50 rounded p-2 mb-2">
                    Client → Load Balancer → Inference API → Feature Store/Cache
                    → Inference Cache → Model Server → Logging
                  </div>
                  <div className="space-y-1.5">
                    {[
                      [
                        "Feature Cache",
                        "Redis/Memcached for frequently accessed features (avoid slow DB lookups).",
                      ],
                      [
                        "Inference Cache",
                        "Cache final model output for identical inputs to avoid redundant computation.",
                      ],
                      [
                        "Model Cache",
                        "Keep model weights in RAM/GPU memory to avoid disk-load latency per request.",
                      ],
                      [
                        "Edge Inference",
                        "Deploy lightweight models (TFLite) on-device to eliminate network latency entirely.",
                      ],
                    ].map(([t, d]) => (
                      <div key={t as string} className="flex gap-2 text-xs">
                        <span className="text-emerald-400 shrink-0 font-semibold">
                          {t}:
                        </span>
                        <span className="text-muted-foreground">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Indexing + Scalability + Fault Tolerance */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() =>
                setMlSection(mlSection === "scale" ? null : "scale")
              }
            >
              <span className="flex items-center gap-1.5">
                <Search size={12} className="text-emerald-400" /> Indexing ·
                Scalability · Fault Tolerance · Monitoring
              </span>
              {mlSection === "scale" ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
            </button>
            {mlSection === "scale" && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">
                    Indexing for Efficient Retrieval
                  </div>
                  <div className="space-y-1.5">
                    {[
                      [
                        "Vector Indexing",
                        "Semantic search & recommendations. Items → embeddings. HNSW + FAISS/Milvus for Approximate Nearest Neighbor (ANN) search.",
                      ],
                      [
                        "Inverted Indexing",
                        "Keyword-based search (Elasticsearch). Maps words to documents.",
                      ],
                      [
                        "Hash Indexing",
                        "Fast exact lookups for classification tasks or feature retrieval.",
                      ],
                    ].map(([t, d]) => (
                      <div key={t as string} className="flex gap-2 text-xs">
                        <span className="text-emerald-400 shrink-0 font-semibold">
                          {t}:
                        </span>
                        <span className="text-muted-foreground">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="text-xs font-bold text-foreground mb-2">
                      Scalability Approaches
                    </div>
                    <ul className="space-y-1">
                      {[
                        "Horizontal scaling of inference nodes",
                        "Model partitioning across hardware",
                        "Async queues (Kafka/RabbitMQ) for traffic spikes",
                        "Load balancing across healthy nodes",
                        "Auto-scaling based on real-time metrics",
                      ].map(s => (
                        <li
                          key={s}
                          className="flex gap-1.5 text-xs text-muted-foreground"
                        >
                          <span className="text-emerald-400 shrink-0">·</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="text-xs font-bold text-foreground mb-2">
                      Fault Tolerance
                    </div>
                    <ul className="space-y-1">
                      {[
                        "Replicate model across availability zones",
                        "Retry with exponential backoff",
                        "Fallback to simpler model (logistic regression) on timeout",
                        "Automated anomaly detection & alerting",
                      ].map(s => (
                        <li
                          key={s}
                          className="flex gap-1.5 text-xs text-muted-foreground"
                        >
                          <span className="text-emerald-400 shrink-0">·</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">
                    Data Drift & Monitoring
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Track precision/recall/F1/AUC on labeled data. Monitor
                    latency/throughput against SLAs. Detect input feature drift
                    using statistical tests. Tools: Prometheus, Grafana,
                    Evidently AI.
                  </p>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <strong>Tip:</strong> Use online evaluation (e.g., real-time
                    click-through rate) as a proxy for model performance when
                    ground-truth labels are delayed.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() =>
                setMlSection(mlSection === "security" ? null : "security")
              }
            >
              <span className="flex items-center gap-1.5">
                <Shield size={12} className="text-emerald-400" /> Security &
                Privacy Considerations
              </span>
              {mlSection === "security" ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
            </button>
            {mlSection === "security" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ["Encryption", "Encrypt data in transit (TLS) and at rest."],
                  [
                    "Access Control",
                    "RBAC and token-based authentication for APIs.",
                  ],
                  [
                    "Differential Privacy",
                    "Add noise to training data to prevent models from memorizing sensitive individual details.",
                  ],
                  [
                    "Bias & Fairness",
                    "Regularly audit models for bias against protected groups using SHAP or LIME.",
                  ],
                  [
                    "Compliance",
                    "Adhere to GDPR, CCPA, and other data protection regulations.",
                  ],
                ].map(([t, d]) => (
                  <div
                    key={t as string}
                    className="p-3 rounded-lg bg-secondary border border-border"
                  >
                    <div className="text-xs font-bold text-foreground mb-1">
                      {t}
                    </div>
                    <div className="text-xs text-muted-foreground">{d}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trade-offs */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() =>
                setMlSection(mlSection === "tradeoffs" ? null : "tradeoffs")
              }
            >
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">◆</span> ML System Design
                Trade-offs
              </span>
              {mlSection === "tradeoffs" ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
            </button>
            {mlSection === "tradeoffs" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 text-muted-foreground font-semibold">
                        Trade-off
                      </th>
                      <th className="text-left py-2 pr-3 text-muted-foreground font-semibold">
                        Option A
                      </th>
                      <th className="text-left py-2 text-muted-foreground font-semibold">
                        Option B
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {ML_TRADEOFFS.map(t => (
                      <tr key={t.aspect}>
                        <td className="py-2 pr-3 text-foreground font-medium">
                          {t.aspect}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {t.traditional}
                        </td>
                        <td className="py-2 text-muted-foreground">{t.ml}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2 italic">
                  Acknowledging these trade-offs in interviews demonstrates
                  maturity in engineering judgment.
                </p>
              </div>
            )}
          </div>

          {/* Case Study */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() =>
                setMlSection(mlSection === "casestudy" ? null : "casestudy")
              }
            >
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-400">◆</span> Case Study:
                ML-Powered Recommendation System
              </span>
              {mlSection === "casestudy" ? (
                <ChevronUp size={13} />
              ) : (
                <ChevronDown size={13} />
              )}
            </button>
            {mlSection === "casestudy" && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs font-bold text-blue-400 mb-1">
                    Problem Statement
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Design a system that provides personalized movie
                    recommendations, updates based on user activity, and returns
                    results in under 200ms.
                  </p>
                  <div className="flex gap-4 mt-2">
                    {[
                      ["Personalization", "Match user history"],
                      ["Freshness", "Update after each watch"],
                      ["Latency", "<200ms at p99"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-xs font-bold text-blue-400">
                          {k}
                        </div>
                        <div className="text-xs text-muted-foreground">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">
                    High-Level Architecture
                  </div>
                  <div className="space-y-1.5">
                    {[
                      [
                        "Data Ingestion",
                        "Stream user viewing history and ratings via Kafka.",
                      ],
                      [
                        "Data Preprocessing",
                        "Spark jobs compute user/item embeddings. Feature store manages real-time user features.",
                      ],
                      [
                        "Model Training",
                        "Two-tower neural network trained to predict user-item affinity.",
                      ],
                      [
                        "Candidate Generation",
                        "FAISS retrieves top 500 relevant movies from millions.",
                      ],
                      [
                        "Ranking",
                        "Heavy ranking model scores the 500 candidates for precise ordering.",
                      ],
                      [
                        "Model Serving",
                        "TensorFlow Serving behind a load balancer.",
                      ],
                      [
                        "Caching",
                        "Top recommendations cached in Redis for subsequent page loads.",
                      ],
                    ].map(([t, d]) => (
                      <div key={t as string} className="flex gap-2 text-xs">
                        <span className="text-emerald-400 shrink-0 font-semibold w-36">
                          {t}:
                        </span>
                        <span className="text-muted-foreground">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interview Roadmap */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="text-xs font-bold text-emerald-400 mb-3">
              ML System Design Interview Roadmap
            </div>
            <div className="space-y-2">
              {ML_INTERVIEW_STEPS.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-foreground">
                      {s.step}:{" "}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {s.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Practice questions */}
      <div className="prep-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="section-title mb-0 pb-0 border-0">
            Practice Questions
          </div>
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none"
          >
            <option value="All">All Levels</option>
            <option value="L6+">L6+</option>
            <option value="L7+">L7+</option>
          </select>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((q, i) => (
            <div key={i} className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-foreground">
                    {q.title}
                  </span>
                  <span
                    className={`badge ${q.level === "L7+" ? "badge-purple" : "badge-blue"}`}
                  >
                    {q.level}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {q.tags.map(t => (
                    <span key={t} className="badge badge-gray text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key concepts */}
      <div className="prep-card p-5">
        <div className="section-title">Key Distributed Systems Concepts</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            [
              "CAP Theorem",
              "Consistency, Availability, Partition Tolerance — pick 2",
            ],
            [
              "Consistent Hashing",
              "Distribute data across nodes with minimal rehashing",
            ],
            ["Leader Election", "Raft or Paxos for distributed consensus"],
            ["Event Sourcing", "Store state changes as immutable events"],
            ["CQRS", "Separate read and write models for scalability"],
            [
              "Circuit Breaker",
              "Prevent cascading failures in distributed systems",
            ],
            ["Saga Pattern", "Distributed transactions without 2PC"],
            ["Bloom Filter", "Probabilistic set membership with O(1) lookup"],
            [
              "Write-Ahead Log",
              "Durability guarantee before committing changes",
            ],
          ].map(([title, desc]) => (
            <div key={title} className="p-3 rounded-lg bg-secondary">
              <div className="text-xs font-bold text-foreground mb-1">
                {title}
              </div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* System Design Diagram Templates */}
      <div id="sysdesign-diagram-templates">
        <SystemDesignDiagramTemplates />
      </div>
      {/* Capacity Estimation Calculator */}
      <div id="sysdesign-capacity-calc">
        <CapacityCalculator />
      </div>

      {/* Design Pattern Library */}
      <DesignPatternLibrary />

      {/* Flash Card CSV Import */}
      <FlashCardCSVImport onImport={() => {}} />

      {/* System Design Mock Session */}
      <div id="sysdesign-mock-session">
        <SectionErrorBoundary label="AI Mock Session">
          <SystemDesignMockSession />
        </SectionErrorBoundary>
      </div>

      {/* System Design Flash Cards Drill Mode */}
      <SystemDesignFlashCards />

      {/* ═══════════════════════════════════════════════════════════════
           🆕 SYSTEM DESIGN ENHANCEMENTS — BATCH 5
          ═══════════════════════════════════════════════════════════════ */}

      {/* Time-Boxed Practice Timer */}
      <div className="prep-card border border-blue-500/20 bg-blue-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">⏱</span>
            <span className="text-sm font-bold text-foreground">
              Time-Boxed Practice Timer
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
              NEW
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            45/60/30-min interview timer with phase checkpoints and transition
            alerts.
          </p>
        </div>
        <div className="p-4">
          <TimeBoxedPracticeTimer />
        </div>
      </div>

      {/* Guided Design Walkthrough */}
      <div className="prep-card border border-blue-500/20 bg-blue-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Brain size={14} className="text-blue-400" />
            <span className="text-sm font-bold text-foreground">
              Guided Design Walkthrough Mode
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
              NEW · AI
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Walk through any problem using Meta's 5-step framework. Get AI
            coaching on your L6/L7 signal.
          </p>
        </div>
        <div className="p-4">
          <SectionErrorBoundary label="Guided Design Walkthrough">
            <GuidedDesignWalkthrough />
          </SectionErrorBoundary>
        </div>
      </div>

      {/* Trade-off Decision Simulator */}
      <div className="prep-card border border-violet-500/20 bg-violet-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-violet-400" />
            <span className="text-sm font-bold text-foreground">
              Trade-off Decision Simulator
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold">
              NEW · AI
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Pick a strategy, justify it, get L6/L7 scoring. 5 real Meta-scale
            scenarios.
          </p>
        </div>
        <div className="p-4">
          <SectionErrorBoundary label="Trade-off Decision Simulator">
            <TradeoffDecisionSimulator />
          </SectionErrorBoundary>
        </div>
      </div>

      {/* Meta-Specific Component Library */}
      <div className="prep-card border border-cyan-500/20 bg-cyan-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-cyan-400" />
            <span className="text-sm font-bold text-foreground">
              Meta-Specific Component Library
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
              NEW
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            TAO, Memcache, Scuba, ZippyDB, Laser, Tupperware, Haystack, Presto —
            with L7 interview signals.
          </p>
        </div>
        <div className="p-4">
          <MetaComponentLibrary />
        </div>
      </div>

      {/* Enhanced Scale Estimation Calculator */}
      <div className="prep-card border border-cyan-500/20 bg-cyan-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-cyan-400" />
            <span className="text-sm font-bold text-foreground">
              Scale Estimation Calculator
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold">
              NEW
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time sliders for DAU, writes, reads, record size, retention,
            media. Instant QPS, storage, and bandwidth estimates with sanity
            warnings.
          </p>
        </div>
        <div className="p-4">
          <ScaleEstimationCalculator />
        </div>
      </div>

      {/* Architecture Anti-Pattern Detector */}
      <div className="prep-card border border-rose-500/20 bg-rose-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Shield size={14} className="text-rose-400" />
            <span className="text-sm font-bold text-foreground">
              Architecture Anti-Pattern Detector
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
              NEW · AI
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paste your design. AI scans for SPOFs, missing async processing, no
            consistency model, and other L6 failure patterns.
          </p>
        </div>
        <div className="p-4">
          <SectionErrorBoundary label="Anti-Pattern Detector">
            <AntiPatternDetector />
          </SectionErrorBoundary>
        </div>
      </div>

      {/* Peer Design Review Simulator */}
      <div className="prep-card border border-emerald-500/20 bg-emerald-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Search size={14} className="text-emerald-400" />
            <span className="text-sm font-bold text-foreground">
              Peer Design Review Simulator
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
              NEW · AI
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Describe your design. A skeptical senior engineer asks 3 adversarial
            questions to probe it under pressure.
          </p>
        </div>
        <div className="p-4">
          <SectionErrorBoundary label="Peer Design Review">
            <PeerDesignReview />
          </SectionErrorBoundary>
        </div>
      </div>

      {/* Complexity Cheat Sheet */}
      <div className="prep-card border border-amber-500/20 bg-amber-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">📊</span>
            <span className="text-sm font-bold text-foreground">
              Complexity Cheat Sheet
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
              NEW
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Latency numbers every engineer should know, CAP theorem quick
            reference, and read/write patterns.
          </p>
        </div>
        <div className="p-4">
          <ComplexityCheatSheet />
        </div>
      </div>

      {/* Design Doc Template Generator */}
      <div className="prep-card border border-violet-500/20 bg-violet-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-violet-400">📄</span>
            <span className="text-sm font-bold text-foreground">
              Design Doc Template Generator
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-semibold">
              NEW
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Fill in each section to generate a Meta-style design doc. Export as
            Markdown or PDF.
          </p>
        </div>
        <div className="p-4">
          <DesignDocGenerator />
        </div>
      </div>

      {/* Explain Like a PM */}
      <div className="prep-card border border-orange-500/20 bg-orange-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-orange-400" />
            <span className="text-sm font-bold text-foreground">
              Explain Like a PM Mode
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-semibold">
              NEW · AI
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Paste your technical design. AI rewrites it in PM-friendly language
            — practicing the L7 communication skill.
          </p>
        </div>
        <div className="p-4">
          <SectionErrorBoundary label="Explain Like a PM">
            <ExplainLikeAPM />
          </SectionErrorBoundary>
        </div>
      </div>

      {/* Enhanced Question Bank */}
      <div className="prep-card border border-blue-500/20 bg-blue-500/5">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-blue-400">📚</span>
            <span className="text-sm font-bold text-foreground">
              Question Bank with Difficulty Tiers
            </span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
              NEW
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            20 questions categorised by tier (Coding-Adjacent / Full System
            Design / Deep Dive) and Meta relevance.
          </p>
        </div>
        <div className="p-4">
          <EnhancedQuestionBank />
        </div>
      </div>
      {/* ═══════════════════════════════════════════════════════════════
           📊 WHY CANDIDATES FAIL — Research-backed failure analysis
          ═══════════════════════════════════════════════════════════════ */}
      <div
        id="sd-failure-analysis"
        className="prep-card border border-red-500/20 bg-red-500/5"
      >
        <div className="p-4">
          <SectionErrorBoundary label="Failure Analysis">
            <SystemDesignFailureAnalysis />
          </SectionErrorBoundary>
        </div>
      </div>
    </div>
  );
}

// ── System Design Flash Cards ─────────────────────────────────────────────────
const FLASH_CARDS = [
  {
    q: "What is the CAP theorem?",
    a: "A distributed system can guarantee at most 2 of: Consistency (every read gets the latest write), Availability (every request gets a response), Partition Tolerance (system works despite network splits). In practice, P is unavoidable, so you choose CP or AP.",
    tag: "Fundamentals",
  },
  {
    q: "When would you use consistent hashing?",
    a: "When distributing data across nodes where nodes can join/leave frequently (e.g., distributed caches, DHTs). It minimizes key remapping when topology changes — only K/N keys move on average (K=keys, N=nodes). Used in Cassandra, DynamoDB, Memcached.",
    tag: "Fundamentals",
  },
  {
    q: "Explain the difference between SQL and NoSQL. When do you choose each?",
    a: "SQL: ACID, structured schema, strong consistency, vertical scaling, great for relational data and complex queries. NoSQL: flexible schema, horizontal scaling, eventual consistency, great for high-throughput unstructured/semi-structured data. Choose SQL for financial/transactional systems; NoSQL for social feeds, logs, catalogs.",
    tag: "Databases",
  },
  {
    q: "What is a write-ahead log (WAL) and why is it important?",
    a: "WAL records every change to a log before applying it to the database. Ensures durability: if the system crashes mid-write, the log can replay the operation. Used in PostgreSQL, Kafka (commit log), and most ACID databases. Key for crash recovery and replication.",
    tag: "Databases",
  },
  {
    q: "How does a CDN work and when should you use one?",
    a: "CDN caches static assets (images, JS, CSS, video) at edge nodes geographically close to users. Reduces latency, offloads origin servers, improves availability. Use for: static assets, media streaming, API acceleration. Key concepts: cache-control headers, TTL, cache invalidation, origin pull vs push.",
    tag: "Scalability",
  },
  {
    q: "What is the difference between horizontal and vertical scaling?",
    a: "Vertical (scale-up): add more CPU/RAM to existing machine. Simple but has limits and single point of failure. Horizontal (scale-out): add more machines. Enables near-infinite scale, better fault tolerance. Requires stateless services, load balancing, and distributed data management.",
    tag: "Scalability",
  },
  {
    q: "Explain the fan-out problem in social networks.",
    a: "When a user with millions of followers posts, you need to update millions of feeds. Push model (write-time fan-out): write to all follower feeds on post — fast reads, slow writes. Pull model (read-time fan-out): compute feed on read — slow reads, fast writes. Hybrid: push for normal users, pull for celebrities (>threshold followers).",
    tag: "Meta-Specific",
  },
  {
    q: "What is a circuit breaker pattern?",
    a: "Prevents cascading failures: wraps calls to a service and tracks failure rate. States: Closed (normal), Open (failing — fast-fail all requests), Half-Open (probe with limited traffic). When failure rate exceeds threshold, opens circuit. After timeout, tries half-open. Used in Netflix Hystrix, resilience4j.",
    tag: "Reliability",
  },
  {
    q: "How do you design a rate limiter?",
    a: "Algorithms: Token Bucket (smooth, allows bursts), Leaky Bucket (strict rate), Fixed Window Counter (simple, boundary spikes), Sliding Window Log (accurate, memory-heavy), Sliding Window Counter (balanced). For distributed: use Redis with atomic operations (INCR + EXPIRE or Lua scripts). Store per user/IP/API key.",
    tag: "Meta-Specific",
  },
  {
    q: "What is eventual consistency and when is it acceptable?",
    a: "Eventual consistency: all replicas converge to the same value given no new updates. Acceptable for: social media likes/views, shopping cart (resolve on checkout), DNS, product catalogs. NOT acceptable for: financial transactions, inventory (overselling), authentication. Tradeoff: availability and performance vs strong consistency.",
    tag: "Fundamentals",
  },
  {
    q: "How would you design a distributed job queue?",
    a: "Components: Producer (enqueues jobs), Queue (Kafka/SQS/RabbitMQ), Workers (consume and process), Dead Letter Queue (failed jobs), Scheduler (delayed/recurring jobs). Key concerns: at-least-once delivery, idempotency (dedup by job ID), priority queues, visibility timeout, backpressure, monitoring lag.",
    tag: "Meta-Specific",
  },
  {
    q: "Explain the Saga pattern for distributed transactions.",
    a: "Manages distributed transactions without 2PC. Two types: Choreography (services emit events, react to each other — decoupled but hard to track) and Orchestration (central coordinator calls each service — easier to reason about). Each step has a compensating transaction for rollback. Used when ACID across services is infeasible.",
    tag: "Reliability",
  },
  {
    q: "What is CQRS and when should you use it?",
    a: "Command Query Responsibility Segregation: separate read (Query) and write (Command) models. Write model optimizes for consistency and business rules; read model optimizes for query performance (denormalized, pre-computed). Use when read/write patterns differ significantly, need high read throughput, or want event sourcing. Adds complexity — don't use for simple CRUD.",
    tag: "Databases",
  },
  {
    q: "How do you handle hot spots in a distributed database?",
    a: "Hot spots occur when one shard/partition gets disproportionate traffic. Solutions: (1) Add random suffix to hot keys to spread across shards, (2) Pre-split hot partitions, (3) Caching layer in front of hot data, (4) Read replicas for hot reads, (5) Application-level sharding with consistent hashing, (6) Adaptive load balancing.",
    tag: "Scalability",
  },
  {
    q: "What is the difference between a message queue and a stream?",
    a: "Message Queue (RabbitMQ, SQS): each message consumed by one consumer, deleted after processing. Good for task distribution, work queues. Stream (Kafka, Kinesis): messages retained for a period, multiple consumers can read independently at their own offset. Good for event sourcing, audit logs, analytics, replay. Kafka is both.",
    tag: "Fundamentals",
  },
];

interface CustomCard {
  id: string;
  q: string;
  a: string;
  tag: string;
}

function SystemDesignFlashCards() {
  const [mode, setMode] = useState<"browse" | "drill" | "manage">("browse");
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filterTag, setFilterTag] = useState("All");
  const [knownCards, setKnownCards] = useState<Set<number>>(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem("sd_known_cards") ?? "[]") as number[]
      );
    } catch {
      return new Set();
    }
  });
  const [sessionScore, setSessionScore] = useState({ known: 0, review: 0 });
  const [sessionDone, setSessionDone] = useState(false);
  const [srDue, setSrDue] = useFlashCardSRDue();

  // Custom cards
  const [customCards, setCustomCards] = useState<CustomCard[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("sd_custom_cards_v1") ?? "[]");
    } catch {
      return [];
    }
  });
  const [newCard, setNewCard] = useState({ q: "", a: "", tag: "Custom" });
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  const saveCustomCards = (cards: CustomCard[]) => {
    setCustomCards(cards);
    localStorage.setItem("sd_custom_cards_v1", JSON.stringify(cards));
  };

  const addCustomCard = () => {
    if (!newCard.q.trim() || !newCard.a.trim()) return;
    const card: CustomCard = { id: `custom_${Date.now()}`, ...newCard };
    saveCustomCards([...customCards, card]);
    setNewCard({ q: "", a: "", tag: "Custom" });
  };

  const deleteCustomCard = (id: string) =>
    saveCustomCards(customCards.filter(c => c.id !== id));

  const updateCustomCard = (id: string, updates: Partial<CustomCard>) => {
    saveCustomCards(
      customCards.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // Merge built-in + custom cards for display
  const ALL_CARDS = [
    ...FLASH_CARDS,
    ...customCards.map(c => ({ q: c.q, a: c.a, tag: c.tag })),
  ];

  const tags = ["All", ...Array.from(new Set(ALL_CARDS.map(c => c.tag)))];
  const deck =
    filterTag === "All"
      ? ALL_CARDS
      : ALL_CARDS.filter(c => c.tag === filterTag);
  // In drill mode, show cards that are NOT mastered OR are due for SR review today
  const today = new Date().toISOString().split("T")[0];
  const drillDeck = deck.filter(c => {
    const globalIdx = ALL_CARDS.indexOf(c);
    const isKnown = knownCards.has(globalIdx);
    const isDue = srDue[String(globalIdx)] && srDue[String(globalIdx)] <= today;
    return !isKnown || isDue;
  });

  // SR interval: 1 day after first review, 3 days, 7 days, 14 days (SM-2 simplified)
  const getNextSRDate = (globalIdx: number): string => {
    const existing = srDue[String(globalIdx)];
    const lastDate = existing ? new Date(existing) : new Date();
    const daysSince = existing
      ? Math.round((Date.now() - lastDate.getTime()) / 86400000)
      : 0;
    const interval =
      daysSince < 1 ? 1 : daysSince < 3 ? 3 : daysSince < 7 ? 7 : 14;
    const next = new Date();
    next.setDate(next.getDate() + interval);
    return next.toISOString().split("T")[0];
  };

  const saveKnown = (set: Set<number>) => {
    localStorage.setItem("sd_known_cards", JSON.stringify(Array.from(set)));
  };

  const markKnown = () => {
    const globalIdx = ALL_CARDS.indexOf(deck[cardIdx]);
    const next = new Set(knownCards);
    next.add(globalIdx);
    setKnownCards(next);
    saveKnown(next);
    // Remove from SR due (mastered, no need to review)
    setSrDue(d => {
      const n = { ...d };
      delete n[String(globalIdx)];
      return n;
    });
    setSessionScore(s => ({ ...s, known: s.known + 1 }));
    nextCard();
  };

  const markReview = () => {
    const globalIdx = ALL_CARDS.indexOf(deck[cardIdx]);
    // Remove from known (needs more practice) and schedule SR review
    const next = new Set(knownCards);
    next.delete(globalIdx);
    setKnownCards(next);
    saveKnown(next);
    setSrDue(d => ({ ...d, [String(globalIdx)]: getNextSRDate(globalIdx) }));
    setSessionScore(s => ({ ...s, review: s.review + 1 }));
    nextCard();
  };

  const nextCard = () => {
    setFlipped(false);
    const activeDeck = mode === "drill" ? drillDeck : deck;
    if (cardIdx + 1 >= activeDeck.length) {
      setSessionDone(true);
    } else {
      setCardIdx(i => i + 1);
    }
  };

  const startDrill = () => {
    setMode("drill");
    setCardIdx(0);
    setFlipped(false);
    setSessionScore({ known: 0, review: 0 });
    setSessionDone(false);
  };

  const resetSession = () => {
    setCardIdx(0);
    setFlipped(false);
    setSessionScore({ known: 0, review: 0 });
    setSessionDone(false);
  };

  const resetAll = () => {
    const next = new Set<number>();
    setKnownCards(next);
    saveKnown(next);
    resetSession();
    setMode("browse");
  };

  const activeDeck = mode === "drill" ? drillDeck : deck;
  const currentCard = activeDeck[cardIdx];

  const TAG_COLORS: Record<string, string> = {
    Fundamentals: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    Databases: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    Scalability: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    Reliability: "text-red-400 bg-red-500/10 border-red-500/30",
    "Meta-Specific": "text-purple-400 bg-purple-500/10 border-purple-500/30",
  };

  return (
    <div className="prep-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">🃏</span>
          <div>
            <div className="text-sm font-bold text-foreground">
              System Design Flash Cards
            </div>
            <div className="text-xs text-muted-foreground">
              {ALL_CARDS.length} cards ({FLASH_CARDS.length} built-in
              {customCards.length > 0 ? ` + ${customCards.length} custom` : ""})
              · {knownCards.size} mastered
              {Object.values(srDue).filter(d => d <= today).length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold">
                  ⏰ {Object.values(srDue).filter(d => d <= today).length} due
                  today
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(m => (m === "manage" ? "browse" : "manage"))}
            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              mode === "manage"
                ? "bg-blue-500/20 border-blue-500/40 text-blue-400"
                : "bg-secondary border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            ➕ My Cards
          </button>
          <button
            onClick={startDrill}
            className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 text-xs font-bold transition-all"
          >
            ⚡ Drill Mode
          </button>
          {knownCards.size > 0 && (
            <button
              onClick={resetAll}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      {/* Tag filter */}
      <div className="p-3 border-b border-border flex gap-2 flex-wrap">
        {tags.map(t => (
          <button
            key={t}
            onClick={() => {
              setFilterTag(t);
              setCardIdx(0);
              setFlipped(false);
              setSessionDone(false);
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              filterTag === t
                ? (TAG_COLORS[t] ??
                  "bg-secondary border-border text-foreground")
                : "bg-transparent border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Manage Custom Cards panel */}
      {mode === "manage" && (
        <div className="p-4 border-b border-border space-y-4 bg-blue-500/5">
          <div className="text-xs font-bold text-blue-400">
            Add your own flash card
          </div>
          <div className="space-y-2">
            <textarea
              value={newCard.q}
              onChange={e => setNewCard(c => ({ ...c, q: e.target.value }))}
              placeholder="Question (e.g. How does Kafka guarantee ordering within a partition?)"
              rows={2}
              className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-blue-500/50 resize-none placeholder:text-muted-foreground/50"
            />
            <textarea
              value={newCard.a}
              onChange={e => setNewCard(c => ({ ...c, a: e.target.value }))}
              placeholder="Answer (e.g. Kafka guarantees ordering within a single partition by assigning sequential offsets…)"
              rows={3}
              className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2.5 focus:outline-none focus:border-blue-500/50 resize-none placeholder:text-muted-foreground/50"
            />
            <div className="flex items-center gap-2">
              <input
                value={newCard.tag}
                onChange={e => setNewCard(c => ({ ...c, tag: e.target.value }))}
                placeholder="Tag (e.g. Kafka, Custom)"
                className="flex-1 text-xs text-foreground bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500/50 placeholder:text-muted-foreground/50"
              />
              <button
                onClick={addCustomCard}
                disabled={!newCard.q.trim() || !newCard.a.trim()}
                className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add Card
              </button>
            </div>
          </div>

          {customCards.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground">
                Your cards ({customCards.length})
              </div>
              {customCards.map(c => (
                <div
                  key={c.id}
                  className="p-3 rounded-lg bg-secondary border border-border"
                >
                  {editingCardId === c.id ? (
                    <div className="space-y-2">
                      <textarea
                        defaultValue={c.q}
                        id={`eq-${c.id}`}
                        rows={2}
                        className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2 focus:outline-none resize-none"
                      />
                      <textarea
                        defaultValue={c.a}
                        id={`ea-${c.id}`}
                        rows={3}
                        className="w-full text-xs text-foreground bg-background border border-border rounded-lg p-2 focus:outline-none resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const q =
                              (
                                document.getElementById(
                                  `eq-${c.id}`
                                ) as HTMLTextAreaElement
                              )?.value ?? c.q;
                            const a =
                              (
                                document.getElementById(
                                  `ea-${c.id}`
                                ) as HTMLTextAreaElement
                              )?.value ?? c.a;
                            updateCustomCard(c.id, { q, a });
                            setEditingCardId(null);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCardId(null)}
                          className="px-2.5 py-1 rounded-lg bg-secondary border border-border text-muted-foreground text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {c.q}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                          {c.a}
                        </div>
                        <span className="text-[10px] text-blue-400 mt-1 inline-block">
                          {c.tag}
                        </span>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditingCardId(c.id)}
                          className="text-muted-foreground hover:text-foreground text-xs px-1"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteCustomCard(c.id)}
                          className="text-muted-foreground hover:text-red-400 text-xs px-1"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Card area */}
      <div className="p-5">
        {sessionDone ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-lg font-black text-foreground mb-1">
              Session Complete!
            </div>
            <div className="flex justify-center gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">
                  {sessionScore.known}
                </div>
                <div className="text-xs text-muted-foreground">Got it</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-orange-400">
                  {sessionScore.review}
                </div>
                <div className="text-xs text-muted-foreground">Review</div>
              </div>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={resetSession}
                className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-sm font-semibold text-foreground transition-all"
              >
                Restart
              </button>
              <button
                onClick={() => {
                  setMode("browse");
                  resetSession();
                }}
                className="px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 text-sm font-semibold transition-all"
              >
                Browse All
              </button>
            </div>
          </div>
        ) : currentCard ? (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {mode === "drill" ? "⚡ Drill" : "📖 Browse"} · Card{" "}
                {cardIdx + 1} of {activeDeck.length}
              </span>
              <span
                className={`px-2 py-0.5 rounded border text-[10px] font-bold ${TAG_COLORS[currentCard.tag] ?? "text-muted-foreground border-border"}`}
              >
                {currentCard.tag}
              </span>
            </div>
            <div className="h-1 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-yellow-500/60 transition-all duration-300"
                style={{
                  width: `${((cardIdx + 1) / activeDeck.length) * 100}%`,
                }}
              />
            </div>

            {/* Flash card */}
            <div
              onClick={() => setFlipped(f => !f)}
              className={`relative rounded-xl border cursor-pointer transition-all duration-300 min-h-36 p-5 flex flex-col justify-center ${
                flipped
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : "bg-secondary border-border hover:border-yellow-500/30"
              }`}
            >
              {!flipped ? (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                    Question
                  </div>
                  <div className="text-sm font-semibold text-foreground leading-relaxed">
                    {currentCard.q}
                  </div>
                  <div className="text-xs text-muted-foreground mt-3">
                    Click to reveal answer
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Answer
                  </div>
                  <div className="text-xs text-foreground leading-relaxed">
                    {currentCard.a}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {flipped && (
              <div className="flex gap-3">
                <button
                  onClick={markKnown}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 text-sm font-bold transition-all"
                >
                  ✅ Got it!
                </button>
                <div className="flex-1 flex flex-col gap-1">
                  <button
                    onClick={markReview}
                    className="w-full py-2.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 text-sm font-bold transition-all"
                  >
                    🔄 Review Again
                  </button>
                  <div className="text-[10px] text-center text-muted-foreground">
                    ⏰ Scheduled for SR review in{" "}
                    {(() => {
                      const globalIdx = ALL_CARDS.indexOf(deck[cardIdx]);
                      const existing = srDue[String(globalIdx)];
                      const daysSince = existing
                        ? Math.round(
                            (Date.now() - new Date(existing).getTime()) /
                              86400000
                          )
                        : 0;
                      return daysSince < 1
                        ? 1
                        : daysSince < 3
                          ? 3
                          : daysSince < 7
                            ? 7
                            : 14;
                    })()}{" "}
                    day(s)
                  </div>
                </div>
              </div>
            )}
            {!flipped && (
              <button
                onClick={() => setFlipped(true)}
                className="w-full py-2.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 text-sm font-bold transition-all"
              >
                Reveal Answer
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-3xl mb-2">🎉</div>
            <div className="text-sm">All cards mastered in this category!</div>
            <button
              onClick={resetAll}
              className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Reset and start over
            </button>
          </div>
        )}
      </div>
      {/* High impact features moved to top of page */}
    </div>
  );
}
