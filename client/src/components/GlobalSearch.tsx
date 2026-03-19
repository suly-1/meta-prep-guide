import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Code2, MessageSquare, Server, Layers } from "lucide-react";
import { PATTERNS, BEHAVIORAL_QUESTIONS, SYSTEM_DESIGN_QUESTIONS } from "@/lib/data";
import { CTCI_QUESTIONS } from "@/lib/ctciData";

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  tab: string;
  icon: React.ReactNode;
  color: string;
}

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  // Coding patterns
  PATTERNS.forEach(p => {
    results.push({
      id: `pattern_${p.id}`,
      title: p.name,
      subtitle: `Coding Pattern · ${p.diff}`,
      tab: "coding",
      icon: <Code2 size={13} />,
      color: "text-blue-400",
    });
  });

  // CTCI problems
  CTCI_QUESTIONS.forEach((q, i) => {
    results.push({
      id: `ctci_${i}`,
      title: q.name,
      subtitle: `CTCI · ${q.difficulty}`,
      tab: "coding",
      icon: <Code2 size={13} />,
      color: "text-blue-300",
    });
  });

  // Behavioral questions
  BEHAVIORAL_QUESTIONS.forEach(q => {
    results.push({
      id: `bq_${q.id}`,
      title: q.q.slice(0, 80) + (q.q.length > 80 ? "…" : ""),
      subtitle: `Behavioral · ${q.area}`,
      tab: "behavioral",
      icon: <MessageSquare size={13} />,
      color: "text-purple-400",
    });
  });

  // System design questions
  SYSTEM_DESIGN_QUESTIONS.forEach((q, i) => {
    results.push({
      id: `sd_${i}`,
      title: q.title,
      subtitle: `System Design · ${q.level}`,
      tab: "design",
      icon: <Server size={13} />,
      color: "text-cyan-400",
    });
  });

  // Flash card topics
  const flashTopics = ["Consistent Hashing", "CAP Theorem", "Rate Limiting", "Load Balancing", "Database Sharding", "Message Queues", "CDN", "Caching Strategies", "API Gateway", "Service Mesh", "Event Sourcing", "CQRS", "Saga Pattern", "Circuit Breaker", "Bloom Filter"];
  flashTopics.forEach((topic, i) => {
    results.push({
      id: `flash_${i}`,
      title: topic,
      subtitle: "System Design Flash Card",
      tab: "design",
      icon: <Layers size={13} />,
      color: "text-cyan-300",
    });
  });

  return results;
}

const SEARCH_INDEX = buildIndex();

interface GlobalSearchProps {
  onNavigate: (tab: string) => void;
}

export default function GlobalSearch({ onNavigate }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);

  const results = query.trim().length < 2
    ? []
    : SEARCH_INDEX.filter(r =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.subtitle.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery("");
    setSelected(0);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const handleSelect = useCallback((result: SearchResult) => {
    onNavigate(result.tab);
    handleClose();
  }, [onNavigate, handleClose]);

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) handleClose();
        else handleOpen();
      }
      if (e.key === "Escape" && open) handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, handleOpen, handleClose]);

  // Arrow key navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === "Enter" && results[selected]) { handleSelect(results[selected]); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, selected, handleSelect]);

  return (
    <>
      {/* Trigger button */}
      <button onClick={handleOpen}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all text-xs"
        title="Global search (⌘K)">
        <Search size={12} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-background border border-border text-[9px] font-mono">⌘K</kbd>
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={handleClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-4 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search size={15} className="text-muted-foreground shrink-0" />
              <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelected(0); }}
                placeholder="Search patterns, questions, topics…"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-muted-foreground">ESC</kbd>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Results */}
            {query.trim().length >= 2 && (
              <div className="max-h-80 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">No results for "{query}"</div>
                ) : (
                  results.map((result, i) => (
                    <button key={result.id} onClick={() => handleSelect(result)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        i === selected ? "bg-accent" : "hover:bg-accent/50"
                      }`}>
                      <span className={`shrink-0 ${result.color}`}>{result.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground truncate">{result.title}</div>
                        <div className="text-xs text-muted-foreground">{result.subtitle}</div>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                        result.tab === "coding" ? "text-blue-400 border-blue-500/30 bg-blue-500/10" :
                        result.tab === "behavioral" ? "text-purple-400 border-purple-500/30 bg-purple-500/10" :
                        "text-cyan-400 border-cyan-500/30 bg-cyan-500/10"
                      }`}>
                        {result.tab === "coding" ? "Coding" : result.tab === "behavioral" ? "Behavioral" : "Sys Design"}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Footer hint */}
            {query.trim().length < 2 && (
              <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                Type at least 2 characters to search across {SEARCH_INDEX.length} items
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
