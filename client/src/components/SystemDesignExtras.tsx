import { useState, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Calculator,
  BookOpen,
  Upload,
  Plus,
  Trash2,
  Download,
} from "lucide-react";
import { useFlashCardSRDue } from "@/hooks/useLocalStorage";

// ── Capacity Estimation Calculator ────────────────────────────────────────────
export function CapacityCalculator() {
  const [open, setOpen] = useState(false);
  const [dau, setDau] = useState("100");
  const [writesPerUser, setWritesPerUser] = useState("5");
  const [readsPerUser, setReadsPerUser] = useState("50");
  const [recordSizeKB, setRecordSizeKB] = useState("1");
  const [retentionYears, setRetentionYears] = useState("5");
  const [avgPayloadKB, setAvgPayloadKB] = useState("10");
  const [requestsPerServer, setRequestsPerServer] = useState("1000");

  const PRESETS = [
    {
      name: "News Feed",
      dau: "500",
      writesPerUser: "3",
      readsPerUser: "100",
      recordSizeKB: "2",
      retentionYears: "5",
      avgPayloadKB: "15",
      requestsPerServer: "1000",
    },
    {
      name: "Messenger",
      dau: "1000",
      writesPerUser: "20",
      readsPerUser: "80",
      recordSizeKB: "0.5",
      retentionYears: "3",
      avgPayloadKB: "2",
      requestsPerServer: "2000",
    },
    {
      name: "Instagram",
      dau: "500",
      writesPerUser: "2",
      readsPerUser: "60",
      recordSizeKB: "500",
      retentionYears: "10",
      avgPayloadKB: "200",
      requestsPerServer: "500",
    },
  ];
  const applyPreset = (p: (typeof PRESETS)[0]) => {
    setDau(p.dau);
    setWritesPerUser(p.writesPerUser);
    setReadsPerUser(p.readsPerUser);
    setRecordSizeKB(p.recordSizeKB);
    setRetentionYears(p.retentionYears);
    setAvgPayloadKB(p.avgPayloadKB);
    setRequestsPerServer(p.requestsPerServer);
  };
  const dauN = parseFloat(dau) * 1e6 || 0;
  const writesPerUserN = parseFloat(writesPerUser) || 0;
  const readsPerUserN = parseFloat(readsPerUser) || 0;
  const recordSizeKBN = parseFloat(recordSizeKB) || 0;
  const retentionYearsN = parseFloat(retentionYears) || 0;
  const avgPayloadKBN = parseFloat(avgPayloadKB) || 0;
  const requestsPerServerN = parseFloat(requestsPerServer) || 0;

  const writeQPS = Math.round((dauN * writesPerUserN) / 86400);
  const readQPS = Math.round((dauN * readsPerUserN) / 86400);
  const totalQPS = writeQPS + readQPS;
  const dailyStorageGB = (dauN * writesPerUserN * recordSizeKBN) / 1e6;
  const totalStorageTB = (dailyStorageGB * 365 * retentionYearsN) / 1000;
  const writeBandwidthMbps = ((writeQPS * recordSizeKBN * 8) / 1000).toFixed(1);
  const readBandwidthMbps = ((readQPS * avgPayloadKBN * 8) / 1000).toFixed(1);
  const serversNeeded = Math.ceil(totalQPS / requestsPerServerN);
  const cacheGB = ((dauN * readsPerUserN * avgPayloadKBN * 0.2) / 1e6).toFixed(
    1
  );

  const fmt = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toString();
  };

  return (
    <div className="prep-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 group"
      >
        <div className="flex items-center gap-2">
          <Calculator size={14} className="text-cyan-400" />
          <span className="text-sm font-bold text-foreground">
            Capacity Estimation Calculator
          </span>
          <span className="badge badge-blue">Interactive</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>DAU × writes/reads → QPS, storage, bandwidth</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-5">
          {/* Presets */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground shrink-0">
              Presets:
            </span>
            {PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="px-2.5 py-1 rounded-md bg-secondary hover:bg-accent border border-border text-xs font-semibold text-foreground transition-all"
              >
                {p.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "DAU (millions)",
                val: dau,
                set: setDau,
                placeholder: "100",
              },
              {
                label: "Writes/user/day",
                val: writesPerUser,
                set: setWritesPerUser,
                placeholder: "5",
              },
              {
                label: "Reads/user/day",
                val: readsPerUser,
                set: setReadsPerUser,
                placeholder: "50",
              },
              {
                label: "Record size (KB)",
                val: recordSizeKB,
                set: setRecordSizeKB,
                placeholder: "1",
              },
              {
                label: "Avg payload (KB)",
                val: avgPayloadKB,
                set: setAvgPayloadKB,
                placeholder: "10",
              },
              {
                label: "Retention (years)",
                val: retentionYears,
                set: setRetentionYears,
                placeholder: "5",
              },
              {
                label: "Req/server/s",
                val: requestsPerServer,
                set: setRequestsPerServer,
                placeholder: "1000",
              },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label}>
                <label className="text-[10px] font-semibold text-muted-foreground block mb-1">
                  {label}
                </label>
                <input
                  type="number"
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-2 py-1.5 rounded-md bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Write QPS",
                val: fmt(writeQPS),
                color: "text-amber-400",
                sub: "writes/sec",
              },
              {
                label: "Read QPS",
                val: fmt(readQPS),
                color: "text-blue-400",
                sub: "reads/sec",
              },
              {
                label: "Total QPS",
                val: fmt(totalQPS),
                color: "text-emerald-400",
                sub: "req/sec",
              },
              {
                label: "Servers Needed",
                val: serversNeeded.toString(),
                color: "text-violet-400",
                sub: "app servers",
              },
              {
                label: "Daily Storage",
                val: `${dailyStorageGB.toFixed(1)} GB`,
                color: "text-cyan-400",
                sub: "per day",
              },
              {
                label: "Total Storage",
                val: `${totalStorageTB.toFixed(1)} TB`,
                color: "text-orange-400",
                sub: `over ${retentionYears}yr`,
              },
              {
                label: "Write Bandwidth",
                val: `${writeBandwidthMbps} Mbps`,
                color: "text-pink-400",
                sub: "outbound",
              },
              {
                label: "Cache Size (20%)",
                val: `${cacheGB} GB`,
                color: "text-teal-400",
                sub: "recommended",
              },
            ].map(({ label, val, color, sub }) => (
              <div
                key={label}
                className="p-3 rounded-lg bg-secondary border border-border"
              >
                <div className="text-[10px] text-muted-foreground mb-0.5">
                  {label}
                </div>
                <div className={`text-lg font-black ${color}`}>{val}</div>
                <div className="text-[10px] text-muted-foreground">{sub}</div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-300">
            <span className="font-bold">💡 Interview tip:</span> State your
            assumptions out loud before calculating. Round aggressively (100M
            DAU, not 98.7M). The interviewer cares about your reasoning, not
            precision.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Design Pattern Library ─────────────────────────────────────────────────────
const DESIGN_PATTERNS = [
  {
    name: "Strangler Fig",
    category: "Migration",
    icon: "🌿",
    when: "Migrating a monolith to microservices incrementally",
    how: "Route new traffic to new service; old service handles legacy paths. Gradually strangle the old system by moving routes one by one.",
    tradeoffs:
      "Slow but safe. Requires a routing layer (API gateway or feature flags). Old and new code coexist temporarily.",
    metaSignal:
      "Shows you understand incremental delivery and risk management.",
  },
  {
    name: "Saga Pattern",
    category: "Distributed Transactions",
    icon: "🔗",
    when: "Coordinating multi-step transactions across microservices without 2PC",
    how: "Choreography: each service emits events and reacts to others. Orchestration: a central coordinator calls each service in sequence.",
    tradeoffs:
      "Choreography is decoupled but hard to trace. Orchestration is easier to reason about but creates a coordinator SPOF.",
    metaSignal:
      "L7 signal: knowing when to use each and how to handle compensating transactions.",
  },
  {
    name: "CQRS",
    category: "Data Access",
    icon: "⚡",
    when: "Read and write workloads have very different scaling needs",
    how: "Separate the write model (commands → event store) from the read model (queries → optimized read replicas or materialized views).",
    tradeoffs:
      "Eventual consistency between write and read models. Increased complexity. Great for high-read systems like social feeds.",
    metaSignal:
      "Pair with Event Sourcing for audit logs and time-travel queries.",
  },
  {
    name: "Event Sourcing",
    category: "Data Access",
    icon: "📜",
    when: "Need full audit trail, time-travel queries, or event replay",
    how: "Store every state change as an immutable event. Current state is derived by replaying events. Snapshots optimize replay performance.",
    tradeoffs:
      "Append-only log is fast but querying current state requires replay or snapshots. Schema evolution is hard.",
    metaSignal:
      "Used in financial systems, collaborative editing (like Google Docs), and Meta's internal audit systems.",
  },
  {
    name: "Bulkhead",
    category: "Reliability",
    icon: "🛡️",
    when: "Isolating failures to prevent cascading across services",
    how: "Partition resources (thread pools, connection pools, memory) per downstream dependency. If one dependency degrades, only its bulkhead is affected.",
    tradeoffs:
      "Wastes resources when partitions are underutilized. Adds configuration complexity.",
    metaSignal:
      "Pair with Circuit Breaker for defense-in-depth against cascading failures.",
  },
  {
    name: "Outbox Pattern",
    category: "Reliability",
    icon: "📤",
    when: "Ensuring a DB write and a message publish happen atomically",
    how: "Write to DB and an outbox table in the same transaction. A separate relay process reads the outbox and publishes to the message broker.",
    tradeoffs:
      "Adds latency (relay polling). Requires idempotent consumers. Solves dual-write problem without distributed transactions.",
    metaSignal:
      "L7: understanding the dual-write problem and why 2PC is impractical at scale.",
  },
  {
    name: "Read-Through Cache",
    category: "Caching",
    icon: "💾",
    when: "Reducing DB load for frequently read, rarely updated data",
    how: "On cache miss, application fetches from DB and populates cache. Subsequent reads hit cache. TTL controls staleness.",
    tradeoffs:
      "Cache stampede on cold start (use probabilistic early expiration). Stale data risk. Choose TTL based on acceptable staleness.",
    metaSignal:
      "Contrast with write-through (always consistent) and write-behind (async, risk of loss).",
  },
  {
    name: "Sidecar",
    category: "Infrastructure",
    icon: "🚗",
    when: "Adding cross-cutting concerns (logging, auth, TLS) without changing service code",
    how: "Deploy a helper container alongside each service pod. Sidecar intercepts traffic and handles concerns transparently.",
    tradeoffs:
      "Increases resource usage. Adds network hop. But keeps service code clean and enables consistent policy enforcement.",
    metaSignal:
      "Foundation of service mesh (Istio, Envoy). Common in Meta's internal infrastructure.",
  },
];

export function DesignPatternLibrary() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("All");
  const categories = [
    "All",
    ...Array.from(new Set(DESIGN_PATTERNS.map(p => p.category))),
  ];
  const filtered = DESIGN_PATTERNS.filter(
    p => filterCat === "All" || p.category === filterCat
  );

  return (
    <div className="prep-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 group"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-violet-400" />
          <span className="text-sm font-bold text-foreground">
            Design Pattern Library
          </span>
          <span className="badge badge-purple">8 patterns</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>When to use · How · Trade-offs · Meta signal</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                  filterCat === c
                    ? "bg-violet-500/20 border-violet-500/40 text-violet-300"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filtered.map(p => (
              <div
                key={p.name}
                className="rounded-lg border border-border overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpanded(expanded === p.name ? null : p.name)
                  }
                  className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
                >
                  <span className="text-lg shrink-0">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {p.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/20 font-semibold">
                        {p.category}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {p.when}
                    </div>
                  </div>
                  {expanded === p.name ? (
                    <ChevronUp
                      size={13}
                      className="shrink-0 text-muted-foreground"
                    />
                  ) : (
                    <ChevronDown
                      size={13}
                      className="shrink-0 text-muted-foreground"
                    />
                  )}
                </button>
                {expanded === p.name && (
                  <div className="px-4 pb-4 space-y-2.5 border-t border-border pt-3">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        When to Use
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.when}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                        How It Works
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.how}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                        Trade-offs
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.tradeoffs}
                      </div>
                    </div>
                    <div className="p-2 rounded-md bg-violet-500/10 border border-violet-500/20">
                      <div className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-1">
                        🎯 Meta Interview Signal
                      </div>
                      <div className="text-xs text-violet-200">
                        {p.metaSignal}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Flash Card CSV Import ──────────────────────────────────────────────────────
interface CustomCard {
  id: string;
  q: string;
  a: string;
  tag: string;
}

export function FlashCardCSVImport({
  onImport,
}: {
  onImport: (cards: CustomCard[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<CustomCard[]>([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setPreview([]);
    setImported(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const cards: CustomCard[] = [];
      for (let i = 1; i < lines.length; i++) {
        // Support comma-separated with quoted fields
        const parts =
          lines[i]
            .match(/(".*?"|[^,]+)(?=,|$)/g)
            ?.map(p => p.replace(/^"|"$/g, "").trim()) ?? [];
        if (parts.length >= 2) {
          cards.push({
            id: `csv-${Date.now()}-${i}`,
            q: parts[0],
            a: parts[1],
            tag: parts[2] ?? "Custom",
          });
        }
      }
      if (cards.length === 0) {
        setError(
          "No valid rows found. Expected: Question,Answer,Tag (header row optional)"
        );
        return;
      }
      setPreview(cards.slice(0, 5));
      onImport(cards);
      setImported(true);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const csv = `Question,Answer,Tag\n"What is consistent hashing?","Distributes keys across nodes using a hash ring. Only K/N keys move when nodes join/leave.","Fundamentals"\n"When to use Redis vs Memcached?","Redis: persistence, data structures, pub/sub, Lua scripts. Memcached: pure caching, simpler, multi-threaded.","Databases"`;
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "flash-cards-template.csv";
    a.click();
  };

  return (
    <div className="prep-card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 group"
      >
        <div className="flex items-center gap-2">
          <Upload size={14} className="text-orange-400" />
          <span className="text-sm font-bold text-foreground">
            Flash Card CSV Import
          </span>
          <span className="badge badge-amber">Bulk Add</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Import Q&A pairs from CSV into your custom deck</span>
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download size={12} /> Download Template CSV
            </button>
            <span className="text-xs text-muted-foreground">
              Format: Question, Answer, Tag (header row optional)
            </span>
          </div>
          <div
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-orange-500/40 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Click to select a CSV file
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              or drag and drop
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFile}
            />
          </div>
          {error && (
            <div className="text-xs text-red-400 p-2 rounded-md bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}
          {imported && preview.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-400">
                ✓ Imported {preview.length}+ cards — preview:
              </div>
              {preview.map(c => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-md bg-secondary border border-border"
                >
                  <div className="text-xs font-semibold text-foreground truncate">
                    {c.q}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {c.a}
                  </div>
                  <span className="text-[9px] px-1 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/20 font-semibold mt-1 inline-block">
                    {c.tag}
                  </span>
                </div>
              ))}
              <div className="text-xs text-emerald-400">
                Cards added to your custom deck in the Flash Cards section
                below.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
