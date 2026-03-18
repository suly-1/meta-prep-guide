// Design: Bold Engineering Dashboard — System Design Tab
import { useState } from "react";
import { SYSTEM_DESIGN_QUESTIONS } from "@/lib/data";
import { ChevronDown, ChevronUp } from "lucide-react";

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

export default function SystemDesignTab() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState("All");

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
