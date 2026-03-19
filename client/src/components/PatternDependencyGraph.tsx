import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { PATTERNS } from "@/lib/data";
import { usePatternRatings } from "@/hooks/useLocalStorage";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

// ── Graph data ────────────────────────────────────────────────────────────────
const NODES = PATTERNS.map(p => ({ id: p.id, name: p.name, diff: p.diff, freq: p.freq, desc: p.desc, examples: p.examples, keyIdea: p.keyIdea }));

const LINKS: { source: string; target: string; label: string }[] = [
  // Sliding Window family
  { source: "two-pointers",    target: "sliding-window",  label: "extends" },
  { source: "sliding-window",  target: "monotonic-stack", label: "combines with" },
  // Pointer family
  { source: "two-pointers",    target: "fast-slow",       label: "variant" },
  { source: "two-pointers",    target: "intervals",       label: "used in" },
  // Search family
  { source: "binary-search",   target: "two-pointers",    label: "pairs with" },
  { source: "binary-search",   target: "greedy",          label: "combines with" },
  // Graph family
  { source: "bfs",             target: "dfs-backtrack",   label: "complement" },
  { source: "bfs",             target: "union-find",      label: "alternative" },
  { source: "dfs-backtrack",   target: "trie",            label: "uses" },
  { source: "dfs-backtrack",   target: "dynamic-prog",    label: "memoize →" },
  { source: "dfs-backtrack",   target: "graph-advanced",  label: "used in" },
  // DP family
  { source: "dynamic-prog",    target: "greedy",          label: "vs." },
  { source: "dynamic-prog",    target: "binary-search",   label: "optimise with" },
  // Heap / Priority Queue
  { source: "heap-priority",   target: "bfs",             label: "Dijkstra →" },
  { source: "heap-priority",   target: "greedy",          label: "implements" },
  // Stack / Monotonic
  { source: "monotonic-stack", target: "dynamic-prog",    label: "optimise" },
  // Union-Find
  { source: "union-find",      target: "graph-advanced",  label: "alternative" },
  // Trie
  { source: "trie",            target: "binary-search",   label: "replaces" },
];

const DIFF_COLOR: Record<string, string> = {
  Easy:   "#10b981",
  Medium: "#3b82f6",
  Hard:   "#ef4444",
};

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string; name: string; diff: string; freq: number;
  desc: string; examples: string[]; keyIdea: string;
}
interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  label: string;
}

export default function PatternDependencyGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<NodeDatum | null>(null);
  const [patternRatings] = usePatternRatings();
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const W = containerRef.current.clientWidth || 700;
    const H = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", W).attr("height", H).attr("viewBox", `0 0 ${W} ${H}`);

    // Defs
    const defs = svg.append("defs");
    defs.append("marker").attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10").attr("refX", 22).attr("refY", 0)
      .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
      .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", "rgba(148,163,184,0.5)");

    const g = svg.append("g");

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);
    zoomRef.current = zoom;

    // Simulation
    const nodes: NodeDatum[] = NODES.map(n => ({ ...n }));
    const links: LinkDatum[] = LINKS.map(l => ({ ...l }));

    const sim = d3.forceSimulation<NodeDatum>(nodes)
      .force("link", d3.forceLink<NodeDatum, LinkDatum>(links).id(d => d.id).distance(110).strength(0.5))
      .force("charge", d3.forceManyBody().strength(-320))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(38));

    // Links
    const link = g.append("g").selectAll("line")
      .data(links).join("line")
      .attr("stroke", "rgba(148,163,184,0.25)")
      .attr("stroke-width", 1.5)
      .attr("marker-end", "url(#arrowhead)");

    // Link labels
    const linkLabel = g.append("g").selectAll("text")
      .data(links).join("text")
      .attr("font-size", 9).attr("fill", "rgba(148,163,184,0.5)")
      .attr("text-anchor", "middle").text(d => d.label);

    // Nodes
    const node = g.append("g").selectAll<SVGGElement, NodeDatum>("g")
      .data(nodes).join("g")
      .style("cursor", "pointer")
      .call(
        d3.drag<SVGGElement, NodeDatum>()
          .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on("drag",  (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end",   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on("click", (_event, d) => setSelected(d));

    // Node circle
    node.append("circle")
      .attr("r", d => 14 + d.freq * 2)
      .attr("fill", d => {
        const rating = patternRatings[d.id] ?? 0;
        if (rating >= 4) return "rgba(16,185,129,0.18)";
        if (rating >= 2) return "rgba(59,130,246,0.14)";
        return "rgba(30,41,59,0.9)";
      })
      .attr("stroke", d => {
        const rating = patternRatings[d.id] ?? 0;
        if (rating >= 4) return "#10b981";
        return DIFF_COLOR[d.diff] ?? "#3b82f6";
      })
      .attr("stroke-width", d => (patternRatings[d.id] ?? 0) >= 4 ? 2.5 : 1.5)
      .attr("filter", d => (patternRatings[d.id] ?? 0) >= 4 ? "drop-shadow(0 0 8px rgba(16,185,129,0.6))" : "none");

    // Node label
    node.append("text")
      .attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("font-size", 9.5).attr("font-weight", "600")
      .attr("fill", d => (patternRatings[d.id] ?? 0) >= 4 ? "#6ee7b7" : "#e2e8f0")
      .attr("pointer-events", "none")
      .each(function(d) {
        const words = d.name.split(" ");
        const el = d3.select(this);
        if (words.length <= 2) {
          el.text(d.name);
        } else {
          el.append("tspan").attr("x", 0).attr("dy", "-0.6em").text(words.slice(0, 2).join(" "));
          el.append("tspan").attr("x", 0).attr("dy", "1.2em").text(words.slice(2).join(" "));
        }
      });

    // Freq badge
    node.append("circle")
      .attr("cx", d => 14 + d.freq * 2 - 4).attr("cy", d => -(14 + d.freq * 2 - 4))
      .attr("r", 6).attr("fill", "#1e293b").attr("stroke", "#475569").attr("stroke-width", 1);
    node.append("text")
      .attr("x", d => 14 + d.freq * 2 - 4).attr("y", d => -(14 + d.freq * 2 - 4))
      .attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("font-size", 7).attr("font-weight", "700").attr("fill", "#94a3b8")
      .attr("pointer-events", "none")
      .text(d => `★${d.freq}`);

    // Tick
    sim.on("tick", () => {
      link
        .attr("x1", d => (d.source as NodeDatum).x!)
        .attr("y1", d => (d.source as NodeDatum).y!)
        .attr("x2", d => (d.target as NodeDatum).x!)
        .attr("y2", d => (d.target as NodeDatum).y!);
      linkLabel
        .attr("x", d => ((d.source as NodeDatum).x! + (d.target as NodeDatum).x!) / 2)
        .attr("y", d => ((d.source as NodeDatum).y! + (d.target as NodeDatum).y!) / 2 - 6);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => { sim.stop(); };
  }, [patternRatings]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomRef.current.scaleBy, factor);
  };
  const handleReset = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  const rating = selected ? (patternRatings[selected.id] ?? 0) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="section-title">Pattern Dependency Graph</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click any node to view the pattern card. Drag to reposition. Scroll to zoom.
            <span className="ml-2 text-emerald-400">Green glow = mastered (★4+)</span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => handleZoom(1.3)} className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors" title="Zoom in"><ZoomIn size={14} /></button>
          <button onClick={() => handleZoom(0.77)} className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors" title="Zoom out"><ZoomOut size={14} /></button>
          <button onClick={handleReset} className="p-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors" title="Reset view"><RotateCcw size={14} /></button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {[["Easy","#10b981"],["Medium","#3b82f6"],["Hard","#ef4444"]].map(([label,color]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
            {label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 ml-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block bg-emerald-500/30 border border-emerald-500" style={{ boxShadow: "0 0 6px rgba(16,185,129,0.6)" }} />
          Mastered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-slate-400">★N</span> = Meta frequency
        </span>
      </div>

      {/* SVG graph */}
      <div ref={containerRef} className="relative rounded-xl border border-border bg-card overflow-hidden" style={{ height: 480 }}>
        <svg ref={svgRef} className="w-full h-full" />
      </div>

      {/* Inline pattern card */}
      {selected && (
        <div className="relative rounded-xl border border-border bg-card p-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            onClick={() => setSelected(null)}
            className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0"
              style={{ background: `${DIFF_COLOR[selected.diff]}22`, border: `1px solid ${DIFF_COLOR[selected.diff]}44`, color: DIFF_COLOR[selected.diff] }}>
              {selected.diff[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-foreground">{selected.name}</h4>
                <span className="badge" style={{ background: `${DIFF_COLOR[selected.diff]}22`, color: DIFF_COLOR[selected.diff], border: `1px solid ${DIFF_COLOR[selected.diff]}44` }}>{selected.diff}</span>
                <span className="badge badge-blue">★{selected.freq} Meta freq</span>
                {rating >= 4 && <span className="badge" style={{ background:"rgba(16,185,129,0.15)", color:"#10b981", border:"1px solid rgba(16,185,129,0.3)" }}>✓ Mastered</span>}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{selected.desc}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Idea</div>
              <p className="text-sm text-foreground font-medium">{selected.keyIdea}</p>
            </div>
            <div className="rounded-lg bg-secondary/50 p-3">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Classic Examples</div>
              <div className="flex flex-wrap gap-1.5">
                {selected.examples.map(ex => (
                  <span key={ex} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{ex}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Mastery rating display */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Your mastery:</span>
            {[1,2,3,4,5].map(s => (
              <span key={s} className={`text-base ${s <= rating ? "text-amber-400" : "text-muted-foreground/30"}`}>★</span>
            ))}
            {rating === 0 && <span className="text-xs text-muted-foreground">Not rated yet — go to the Patterns section to rate</span>}
          </div>
        </div>
      )}
    </div>
  );
}
