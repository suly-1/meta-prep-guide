// Design: Bold Engineering Dashboard — System Design Tab
import { useState } from "react";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/data";
import { ChevronDown, ChevronUp, ExternalLink, Brain, Database, Server, Shield, BarChart3, Zap, GitBranch, Search } from "lucide-react";

const FRAMEWORK_STEPS = [
  { step: "1. Requirements", time: "5 min", items: ["Functional: what the system must do", "Non-functional: scale, latency, availability, consistency", "Ask: DAU, QPS, data volume, read/write ratio", "Clarify: global vs regional, mobile vs web"] },
  { step: "2. Capacity Estimation", time: "3 min", items: ["Storage: daily writes × record size × retention", "Bandwidth: QPS × avg payload size", "Compute: QPS / requests-per-server", "Cache: 20% of daily reads (Pareto principle)"] },
  { step: "3. High-Level Design", time: "10 min", items: ["Draw core components: clients, LB, API servers, DB, cache", "Define APIs (REST/GraphQL/gRPC)", "Choose SQL vs NoSQL with justification", "Identify the core data flow end-to-end"] },
  { step: "4. Deep Dive", time: "15 min", items: ["Pick 2–3 components to deep-dive (interviewer may guide)", "Database schema and indexing strategy", "Caching strategy: what to cache, eviction policy, TTL", "Scalability: sharding, replication, partitioning"] },
  { step: "5. Bottlenecks & Trade-offs", time: "5 min", items: ["Identify single points of failure", "Discuss consistency vs availability (CAP theorem)", "Address hot spots, thundering herd, cascading failures", "Propose monitoring and alerting strategy"] },
];

const IC7_SIGNALS = [
  "Proactively identifies constraints the interviewer hasn't mentioned",
  "Discusses operational concerns: deployment, rollback, observability",
  "Quantifies trade-offs with numbers, not just words",
  "Proposes phased rollout strategy for risky changes",
  "Connects technical decisions to business impact",
  "Challenges assumptions and proposes alternatives",
];

// ML System Design data from systemdesignhandbook.com/guides/ml-system-design/
const ML_OBJECTIVES = [
  { label: "Scalability", desc: "Handle growing data volumes and user requests; often requires horizontal scaling of inference nodes." },
  { label: "Low Latency", desc: "Fraud detection or search require low tens of milliseconds to keep the user experience seamless." },
  { label: "Reliability", desc: "Maintain consistent performance even in the presence of hardware failures or network partitions." },
  { label: "Adaptability", desc: "Support continuous learning so models evolve as data distributions change over time." },
  { label: "Explainability & Fairness", desc: "Enable monitoring for bias and provide transparency into why specific predictions were made." },
];

const ML_ARCH_LAYERS = [
  { icon: "📥", step: "1. Data Ingestion", desc: "Collect from logs, APIs, IoT sensors. Use streaming platforms (Kafka, Kinesis) for real-time events." },
  { icon: "🗄️", step: "2. Data Storage", desc: "Cold (S3) for historical data, operational (Cassandra/Postgres) for recent data, hot (Redis) for low-latency feature access." },
  { icon: "⚙️", step: "3. Feature Extraction", desc: "Clean, normalize, transform raw data into numerical features using Spark/Beam. Populate feature store to prevent training-serving skew." },
  { icon: "🧠", step: "4. Model Training", desc: "Distributed clusters with TensorFlow/PyTorch/XGBoost. Offline evaluation on historical data using AUC/RMSE before promotion." },
  { icon: "📦", step: "5. Model Deployment", desc: "Containerize (Docker), apply quantization to reduce size/latency, run optimization steps before production packaging." },
  { icon: "🚀", step: "6. Model Serving", desc: "REST/gRPC inference APIs with load balancing. Hardware acceleration (GPU/TPU) for deep learning models." },
  { icon: "📊", step: "7. Monitoring & Feedback", desc: "Track accuracy, latency, concept drift. Capture ground truth labels to trigger retraining and close the loop." },
];

const ML_COMPONENTS = [
  { icon: <Database size={14} />, name: "Feature Store", desc: "Centralized repository ensuring identical feature computation in training and inference. Prevents training-serving skew. Tools: Feast, Tecton (backed by Redis)." },
  { icon: <Server size={14} />, name: "Model Training Service", desc: "Manages distributed training jobs: resource allocation, hyperparameter tuning, checkpointing, data/model parallelism." },
  { icon: <GitBranch size={14} />, name: "Model Registry", desc: "Version-control for ML models. Tracks lineage, metadata, performance metrics. Enables governance and rollback. Tools: MLflow, SageMaker Registry." },
  { icon: <Zap size={14} />, name: "Inference API", desc: "Exposes model via REST/gRPC. Handles thousands of concurrent requests. Includes A/B testing and canary deployment logic." },
  { icon: <BarChart3 size={14} />, name: "Monitoring & Feedback Loop", desc: "Tracks prediction accuracy, latency, and concept drift. Collects new labels to feed back into the training pipeline." },
];

const ML_TRADEOFFS = [
  { aspect: "Accuracy vs Latency", traditional: "Higher accuracy", ml: "Simpler/quantized model for speed" },
  { aspect: "Batch vs Real-time", traditional: "Overnight batch (cheaper)", ml: "Real-time streaming (fresher)" },
  { aspect: "Model size vs Cost", traditional: "Large deep learning model", ml: "Distilled/pruned model" },
  { aspect: "Freshness vs Stability", traditional: "Frequent retraining", ml: "Stable but potentially stale" },
  { aspect: "Explainability vs Power", traditional: "Linear/tree models (interpretable)", ml: "Deep learning (black box)" },
];

const ML_INTERVIEW_STEPS = [
  { step: "1. Clarify the Problem", desc: "Define the business goal (e.g., maximize watch time) and what the system predicts." },
  { step: "2. Estimate the Scale", desc: "Discuss data volume, QPS, and latency targets (e.g., <100ms p99)." },
  { step: "3. Outline Architecture", desc: "Draw the high-level data pipeline, training, and inference layers." },
  { step: "4. Deep Dive Components", desc: "Discuss the feature store, model registry, and serving strategy in detail." },
  { step: "5. Discuss Trade-offs", desc: "Highlight decisions around accuracy vs cost, batch vs real-time, model size vs latency." },
  { step: "6. Reliability & Ethics", desc: "Mention fallback mechanisms, bias detection, differential privacy, and monitoring." },
  { step: "7. Conclude with Improvements", desc: "Suggest evolution path (e.g., batch → real-time, single model → ensemble)." },
];

export default function SystemDesignTab() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState("All");
  const [mlSection, setMlSection] = useState<string | null>(null);

  const filtered = SYSTEM_DESIGN_QUESTIONS.filter(q => filterLevel === "All" || q.level === filterLevel);

  return (
    <div className="space-y-5">
      {/* Framework */}
      <div className="prep-card p-5">
        <div className="section-title">System Design Framework (38-min Interview)</div>
        <div className="space-y-2">
          {FRAMEWORK_STEPS.map((s, i) => (
            <div key={i} className="rounded-lg border border-border overflow-hidden">
              <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-secondary/50 transition-all"
                onClick={() => setExpanded(expanded === i ? null : i)}>
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                <span className="flex-1 text-sm font-semibold text-foreground">{s.step}</span>
                <span className="badge badge-gray">{s.time}</span>
                {expanded === i ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
              </button>
              {expanded === i && (
                <div className="p-3 border-t border-border">
                  <ul className="space-y-1.5">
                    {s.items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="text-blue-400 mt-0.5 shrink-0">·</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* IC7 signals */}
      <div className="prep-card p-5 border-purple-500/20">
        <div className="section-title text-purple-400">IC7 Differentiation Signals</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {IC7_SIGNALS.map((s, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="text-purple-400 mt-0.5 shrink-0">✦</span>{s}
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
              <div className="text-sm font-bold text-foreground">ML System Design Guide</div>
              <div className="text-xs text-muted-foreground">Complete lifecycle: data pipelines → training → serving → monitoring</div>
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
              <span className="text-emerald-400">◆</span> What is ML System Design?
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              ML System Design is the engineering discipline of architecting systems that can <strong className="text-foreground">train, deploy, and maintain</strong> machine learning models at production scale. It sits at the intersection of ML (accuracy, feature quality, optimization) and traditional System Design (scalability, latency, reliability).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold">Aspect</th>
                    <th className="text-left py-1.5 pr-3 text-muted-foreground font-semibold">Traditional System</th>
                    <th className="text-left py-1.5 text-muted-foreground font-semibold">ML System</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {[
                    ["Core logic", "Handwritten rules / Business logic", "Learned probabilistic models"],
                    ["Data", "Structured, schema-driven", "High volume, distribution evolves"],
                    ["Failure modes", "Predictable (bugs, crashes)", "Silent failures (drift, bias)"],
                    ["Testing", "Unit / Integration tests", "A/B testing, offline evaluation"],
                    ["Maintenance", "Code updates", "Continuous retraining & monitoring"],
                  ].map(([a, b, c]) => (
                    <tr key={a}>
                      <td className="py-1.5 pr-3 text-foreground font-medium">{a}</td>
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
              {ML_OBJECTIVES.map((o) => (
                <div key={o.label} className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-emerald-400 mb-1">{o.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{o.desc}</div>
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
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">◆</span> Step-by-Step Architecture (7 Layers)</span>
              {mlSection === "arch" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {mlSection === "arch" && (
              <div className="space-y-2">
                {ML_ARCH_LAYERS.map((l) => (
                  <div key={l.step} className="flex gap-3 p-3 rounded-lg bg-secondary border border-border">
                    <span className="text-base shrink-0 mt-0.5">{l.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-foreground mb-0.5">{l.step}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{l.desc}</div>
                    </div>
                  </div>
                ))}
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <strong>Note:</strong> Each layer enforces a contract — data shape, freshness, latency, and correctness. Most production issues arise when these contracts are implicit rather than explicit.
                </div>
              </div>
            )}
          </div>

          {/* Core Components */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() => setMlSection(mlSection === "components" ? null : "components")}
            >
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">◆</span> Core Components</span>
              {mlSection === "components" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {mlSection === "components" && (
              <div className="space-y-2">
                {ML_COMPONENTS.map((c) => (
                  <div key={c.name} className="flex gap-3 p-3 rounded-lg bg-secondary border border-border">
                    <span className="text-emerald-400 shrink-0 mt-0.5">{c.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-foreground mb-0.5">{c.name}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed">{c.desc}</div>
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
              onClick={() => setMlSection(mlSection === "serving" ? null : "serving")}
            >
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">◆</span> Batch vs Real-time · Training · Serving Architecture</span>
              {mlSection === "serving" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {mlSection === "serving" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="text-xs font-bold text-blue-400 mb-2">Batch Systems</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Process large datasets periodically (daily/weekly). Suitable for offline analytics, pre-computed recommendations, forecasting. Example: rebuilding recommendation embeddings overnight.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="text-xs font-bold text-orange-400 mb-2">Real-time Systems</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">Respond to live inputs in milliseconds. Essential for fraud detection, search ranking, dynamic pricing. Example: blocking a suspicious credit card transaction instantly.</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">Training Architecture</div>
                  <div className="space-y-1.5">
                    {[
                      ["Data Parallelism", "Split data across workers; each trains a copy and computes gradients that are aggregated."],
                      ["Model Parallelism", "Split large models (LLMs) across multiple GPUs/TPUs when they don't fit in a single device."],
                      ["Parameter Servers vs All-Reduce", "Central node stores weights (param server) vs. ring all-reduce where workers exchange gradients directly."],
                      ["Checkpointing", "Save model state periodically so training can resume from the last checkpoint after node failure."],
                    ].map(([t, d]) => (
                      <div key={t as string} className="flex gap-2 text-xs">
                        <span className="text-emerald-400 shrink-0 font-semibold">{t}:</span>
                        <span className="text-muted-foreground">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">Serving Flow</div>
                  <div className="font-mono text-xs text-emerald-400 bg-background/50 rounded p-2 mb-2">
                    Client → Load Balancer → Inference API → Feature Store/Cache → Inference Cache → Model Server → Logging
                  </div>
                  <div className="space-y-1.5">
                    {[
                      ["Feature Cache", "Redis/Memcached for frequently accessed features (avoid slow DB lookups)."],
                      ["Inference Cache", "Cache final model output for identical inputs to avoid redundant computation."],
                      ["Model Cache", "Keep model weights in RAM/GPU memory to avoid disk-load latency per request."],
                      ["Edge Inference", "Deploy lightweight models (TFLite) on-device to eliminate network latency entirely."],
                    ].map(([t, d]) => (
                      <div key={t as string} className="flex gap-2 text-xs">
                        <span className="text-emerald-400 shrink-0 font-semibold">{t}:</span>
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
              onClick={() => setMlSection(mlSection === "scale" ? null : "scale")}
            >
              <span className="flex items-center gap-1.5"><Search size={12} className="text-emerald-400" /> Indexing · Scalability · Fault Tolerance · Monitoring</span>
              {mlSection === "scale" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {mlSection === "scale" && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">Indexing for Efficient Retrieval</div>
                  <div className="space-y-1.5">
                    {[
                      ["Vector Indexing", "Semantic search & recommendations. Items → embeddings. HNSW + FAISS/Milvus for Approximate Nearest Neighbor (ANN) search."],
                      ["Inverted Indexing", "Keyword-based search (Elasticsearch). Maps words to documents."],
                      ["Hash Indexing", "Fast exact lookups for classification tasks or feature retrieval."],
                    ].map(([t, d]) => (
                      <div key={t as string} className="flex gap-2 text-xs">
                        <span className="text-emerald-400 shrink-0 font-semibold">{t}:</span>
                        <span className="text-muted-foreground">{d}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="text-xs font-bold text-foreground mb-2">Scalability Approaches</div>
                    <ul className="space-y-1">
                      {["Horizontal scaling of inference nodes", "Model partitioning across hardware", "Async queues (Kafka/RabbitMQ) for traffic spikes", "Load balancing across healthy nodes", "Auto-scaling based on real-time metrics"].map(s => (
                        <li key={s} className="flex gap-1.5 text-xs text-muted-foreground">
                          <span className="text-emerald-400 shrink-0">·</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="text-xs font-bold text-foreground mb-2">Fault Tolerance</div>
                    <ul className="space-y-1">
                      {["Replicate model across availability zones", "Retry with exponential backoff", "Fallback to simpler model (logistic regression) on timeout", "Automated anomaly detection & alerting"].map(s => (
                        <li key={s} className="flex gap-1.5 text-xs text-muted-foreground">
                          <span className="text-emerald-400 shrink-0">·</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">Data Drift & Monitoring</div>
                  <p className="text-xs text-muted-foreground mb-2">Track precision/recall/F1/AUC on labeled data. Monitor latency/throughput against SLAs. Detect input feature drift using statistical tests. Tools: Prometheus, Grafana, Evidently AI.</p>
                  <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <strong>Tip:</strong> Use online evaluation (e.g., real-time click-through rate) as a proxy for model performance when ground-truth labels are delayed.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Security */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() => setMlSection(mlSection === "security" ? null : "security")}
            >
              <span className="flex items-center gap-1.5"><Shield size={12} className="text-emerald-400" /> Security & Privacy Considerations</span>
              {mlSection === "security" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {mlSection === "security" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  ["Encryption", "Encrypt data in transit (TLS) and at rest."],
                  ["Access Control", "RBAC and token-based authentication for APIs."],
                  ["Differential Privacy", "Add noise to training data to prevent models from memorizing sensitive individual details."],
                  ["Bias & Fairness", "Regularly audit models for bias against protected groups using SHAP or LIME."],
                  ["Compliance", "Adhere to GDPR, CCPA, and other data protection regulations."],
                ].map(([t, d]) => (
                  <div key={t as string} className="p-3 rounded-lg bg-secondary border border-border">
                    <div className="text-xs font-bold text-foreground mb-1">{t}</div>
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
              onClick={() => setMlSection(mlSection === "tradeoffs" ? null : "tradeoffs")}
            >
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">◆</span> ML System Design Trade-offs</span>
              {mlSection === "tradeoffs" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {mlSection === "tradeoffs" && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-3 text-muted-foreground font-semibold">Trade-off</th>
                      <th className="text-left py-2 pr-3 text-muted-foreground font-semibold">Option A</th>
                      <th className="text-left py-2 text-muted-foreground font-semibold">Option B</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {ML_TRADEOFFS.map((t) => (
                      <tr key={t.aspect}>
                        <td className="py-2 pr-3 text-foreground font-medium">{t.aspect}</td>
                        <td className="py-2 pr-3 text-muted-foreground">{t.traditional}</td>
                        <td className="py-2 text-muted-foreground">{t.ml}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground mt-2 italic">Acknowledging these trade-offs in interviews demonstrates maturity in engineering judgment.</p>
              </div>
            )}
          </div>

          {/* Case Study */}
          <div>
            <button
              className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-2 hover:text-emerald-400 transition-colors"
              onClick={() => setMlSection(mlSection === "casestudy" ? null : "casestudy")}
            >
              <span className="flex items-center gap-1.5"><span className="text-emerald-400">◆</span> Case Study: ML-Powered Recommendation System</span>
              {mlSection === "casestudy" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {mlSection === "casestudy" && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs font-bold text-blue-400 mb-1">Problem Statement</div>
                  <p className="text-xs text-muted-foreground">Design a system that provides personalized movie recommendations, updates based on user activity, and returns results in under 200ms.</p>
                  <div className="flex gap-4 mt-2">
                    {[["Personalization", "Match user history"], ["Freshness", "Update after each watch"], ["Latency", "<200ms at p99"]].map(([k, v]) => (
                      <div key={k}>
                        <div className="text-xs font-bold text-blue-400">{k}</div>
                        <div className="text-xs text-muted-foreground">{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <div className="text-xs font-bold text-foreground mb-2">High-Level Architecture</div>
                  <div className="space-y-1.5">
                    {[
                      ["Data Ingestion", "Stream user viewing history and ratings via Kafka."],
                      ["Data Preprocessing", "Spark jobs compute user/item embeddings. Feature store manages real-time user features."],
                      ["Model Training", "Two-tower neural network trained to predict user-item affinity."],
                      ["Candidate Generation", "FAISS retrieves top 500 relevant movies from millions."],
                      ["Ranking", "Heavy ranking model scores the 500 candidates for precise ordering."],
                      ["Model Serving", "TensorFlow Serving behind a load balancer."],
                      ["Caching", "Top recommendations cached in Redis for subsequent page loads."],
                    ].map(([t, d]) => (
                      <div key={t as string} className="flex gap-2 text-xs">
                        <span className="text-emerald-400 shrink-0 font-semibold w-36">{t}:</span>
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
            <div className="text-xs font-bold text-emerald-400 mb-3">ML System Design Interview Roadmap</div>
            <div className="space-y-2">
              {ML_INTERVIEW_STEPS.map((s, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                  <div>
                    <span className="text-xs font-semibold text-foreground">{s.step}: </span>
                    <span className="text-xs text-muted-foreground">{s.desc}</span>
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
          <div className="section-title mb-0 pb-0 border-0">Practice Questions</div>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none">
            <option value="All">All Levels</option>
            <option value="IC6+">IC6+</option>
            <option value="IC7+">IC7+</option>
          </select>
        </div>
        <div className="divide-y divide-border">
          {filtered.map((q, i) => (
            <div key={i} className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-foreground">{q.title}</span>
                  <span className={`badge ${q.level === "IC7+" ? "badge-purple" : "badge-blue"}`}>{q.level}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {q.tags.map(t => <span key={t} className="badge badge-gray text-xs">{t}</span>)}
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
            ["CAP Theorem", "Consistency, Availability, Partition Tolerance — pick 2"],
            ["Consistent Hashing", "Distribute data across nodes with minimal rehashing"],
            ["Leader Election", "Raft or Paxos for distributed consensus"],
            ["Event Sourcing", "Store state changes as immutable events"],
            ["CQRS", "Separate read and write models for scalability"],
            ["Circuit Breaker", "Prevent cascading failures in distributed systems"],
            ["Saga Pattern", "Distributed transactions without 2PC"],
            ["Bloom Filter", "Probabilistic set membership with O(1) lookup"],
            ["Write-Ahead Log", "Durability guarantee before committing changes"],
          ].map(([title, desc]) => (
            <div key={title} className="p-3 rounded-lg bg-secondary">
              <div className="text-xs font-bold text-foreground mb-1">{title}</div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
