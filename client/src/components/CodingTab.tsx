// Design: Bold Engineering Dashboard — System Design Tab
// Features: search, difficulty/freq/mastery filter, quick drill with 30s timer,
// spaced repetition, heatmap, Anki export, weak-spots filter, pattern notes,
// mock interview timer (25/35/45 min), session history, sprint mode
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, Download, Flame, Clock, ChevronDown, ChevronUp, Star, Zap, BarChart2, BookOpen, Filter, Timer, Trophy, X, SkipForward, ChevronRight, Code2, Play, Tag, HelpCircle, Brain } from "lucide-react";
import { PATTERNS, PATTERN_PREREQS } from "@/lib/data";
import { usePatternRatings, usePatternNotes, useSpacedRepetition, useCodingHistory, usePatternTime, useCTCIStreak, useHintAnalytics, useCTCIDifficultyEstimates, type SelfDifficulty } from "@/hooks/useLocalStorage";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";
import PatternDependencyGraph from "@/components/PatternDependencyGraph";
import MockInterviewSimulator from "@/components/MockInterviewSimulator";
import { CodingMockSession } from "@/components/CodingMockSession";

const DIFF_ORDER: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };
const DIFF_COLOR: Record<string, string> = { Easy: "badge-green", Medium: "badge-amber", Hard: "badge-red" };

// Pattern cheat sheet templates (canonical Python skeleton)
const CHEAT_SHEETS: Record<string, string> = {
  "sliding-window": `def max_subarray_sum(nums, k):
    window_sum = sum(nums[:k])
    best = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        best = max(best, window_sum)
    return best

# Variable window:
left = 0
for right in range(len(nums)):
    # expand
    while condition_violated:
        # shrink
        left += 1`,
  "two-pointers": `nums.sort()
left, right = 0, len(nums) - 1
while left < right:
    s = nums[left] + nums[right]
    if s == target: return [left, right]
    elif s < target: left += 1
    else: right -= 1`,
  "fast-slow": `slow = fast = head
while fast and fast.next:
    slow = slow.next
    fast = fast.next.next
    if slow == fast:  # cycle detected
        break`,
  "binary-search": `lo, hi = 0, len(nums) - 1
while lo <= hi:
    mid = (lo + hi) // 2
    if nums[mid] == target: return mid
    elif nums[mid] < target: lo = mid + 1
    else: hi = mid - 1
return -1`,
  "bfs": `from collections import deque
q = deque([start])
visited = {start}
while q:
    node = q.popleft()
    for nei in graph[node]:
        if nei not in visited:
            visited.add(nei)
            q.append(nei)`,
  "dfs-backtrack": `def backtrack(path, choices):
    if is_complete(path):
        result.append(path[:])
        return
    for choice in choices:
        path.append(choice)   # choose
        backtrack(path, next_choices)
        path.pop()            # unchoose`,
  "dynamic-prog": `# Bottom-up DP
dp = [0] * (n + 1)
dp[0] = base_case
for i in range(1, n + 1):
    dp[i] = recurrence(dp, i)
return dp[n]

# Top-down memo
from functools import lru_cache
@lru_cache(maxsize=None)
def dp(i): return recurrence(dp, i)`,
  "greedy": `# Sort by key metric, then make greedy choice
items.sort(key=lambda x: x.metric)
result = []
for item in items:
    if can_include(item, result):
        result.append(item)`,
  "heap-priority": `import heapq
heap = []
heapq.heappush(heap, val)
val = heapq.heappop(heap)   # min

# Top-K largest:
heapq.nlargest(k, nums)
# or maintain min-heap of size k:
for n in nums:
    heapq.heappush(heap, n)
    if len(heap) > k: heapq.heappop(heap)`,
  "intervals": `intervals.sort(key=lambda x: x[0])
merged = [intervals[0]]
for start, end in intervals[1:]:
    if start <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], end)
    else:
        merged.append([start, end])`,
  "monotonic-stack": `stack = []  # indices
for i, val in enumerate(nums):
    while stack and nums[stack[-1]] < val:
        idx = stack.pop()
        # process: next greater of idx is i
    stack.append(i)`,
  "trie": `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False

class Trie:
    def __init__(self): self.root = TrieNode()
    def insert(self, word):
        node = self.root
        for c in word:
            node = node.children.setdefault(c, TrieNode())
        node.is_end = True`,
  "union-find": `parent = list(range(n))
rank = [0] * n
def find(x):
    if parent[x] != x: parent[x] = find(parent[x])
    return parent[x]
def union(x, y):
    px, py = find(x), find(y)
    if px == py: return False
    if rank[px] < rank[py]: px, py = py, px
    parent[py] = px
    if rank[px] == rank[py]: rank[px] += 1
    return True`,
  "graph-advanced": `# Kahn's BFS topological sort
from collections import deque
in_degree = [0] * n
for u, v in edges: in_degree[v] += 1
q = deque(i for i in range(n) if in_degree[i] == 0)
order = []
while q:
    node = q.popleft()
    order.append(node)
    for nei in graph[node]:
        in_degree[nei] -= 1
        if in_degree[nei] == 0: q.append(nei)`,
};

// NeetCode video links per pattern
const PATTERN_VIDEOS: Record<string, { label: string; url: string }> = {
  "sliding-window":  { label: "NeetCode: Sliding Window", url: "https://www.youtube.com/watch?v=p-ss2JNynmw" },
  "two-pointers":    { label: "NeetCode: Two Pointers", url: "https://www.youtube.com/watch?v=jzZsG8n2R9A" },
  "fast-slow":       { label: "NeetCode: Fast & Slow Pointers", url: "https://www.youtube.com/watch?v=gBTe7lFR3vc" },
  "binary-search":   { label: "NeetCode: Binary Search", url: "https://www.youtube.com/watch?v=s4DPM8ct1pI" },
  "bfs":             { label: "NeetCode: BFS", url: "https://www.youtube.com/watch?v=oDqjPvD1nwI" },
  "dfs-backtrack":   { label: "NeetCode: Backtracking", url: "https://www.youtube.com/watch?v=A80YzvNwqXA" },
  "dynamic-prog":    { label: "NeetCode: Dynamic Programming", url: "https://www.youtube.com/watch?v=oBt53YbR9Kk" },
  "greedy":          { label: "NeetCode: Greedy", url: "https://www.youtube.com/watch?v=HjeJhlcos4w" },
  "heap-priority":   { label: "NeetCode: Heap / Priority Queue", url: "https://www.youtube.com/watch?v=HqPJF2L5h9U" },
  "intervals":       { label: "NeetCode: Intervals", url: "https://www.youtube.com/watch?v=A8NUOmlwOlM" },
  "monotonic-stack": { label: "NeetCode: Monotonic Stack", url: "https://www.youtube.com/watch?v=Dq_ObZwTY_Q" },
  "trie":            { label: "NeetCode: Trie", url: "https://www.youtube.com/watch?v=oobqoCJlHA0" },
  "union-find":      { label: "NeetCode: Union-Find", url: "https://www.youtube.com/watch?v=ayW5B2W9hkk" },
  "graph-advanced":  { label: "NeetCode: Topological Sort", url: "https://www.youtube.com/watch?v=cIBFEhD77b4" },
};

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} className={`star-btn ${(hover || value) >= s ? "active" : ""}`}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)} onClick={() => onChange(s)}>★</button>
      ))}
    </div>
  );
}

// ── Complexity Quick-Reference Card ──────────────────────────────────────
const COMPLEXITY_TABLE = [
  { ds: "Array / List",       access: "O(1)",    search: "O(n)",    insert: "O(n)",    delete: "O(n)" },
  { ds: "HashMap / HashSet",  access: "O(1)",    search: "O(1)",    insert: "O(1)",    delete: "O(1)" },
  { ds: "Sorted Array",       access: "O(1)",    search: "O(log n)",insert: "O(n)",    delete: "O(n)" },
  { ds: "Linked List",        access: "O(n)",    search: "O(n)",    insert: "O(1)",    delete: "O(1)" },
  { ds: "Binary Heap",        access: "O(n)",    search: "O(n)",    insert: "O(log n)",delete: "O(log n)" },
  { ds: "BST (balanced)",     access: "O(log n)",search: "O(log n)",insert: "O(log n)",delete: "O(log n)" },
  { ds: "Stack / Queue",      access: "O(n)",    search: "O(n)",    insert: "O(1)",    delete: "O(1)" },
  { ds: "Trie",               access: "O(m)",    search: "O(m)",    insert: "O(m)",    delete: "O(m)" },
  { ds: "Graph (adj list)",   access: "O(V+E)",  search: "O(V+E)",  insert: "O(1)",    delete: "O(E)" },
];

function ComplexityCard() {
  const [open, setOpen] = useState(false);
  return (
    <div className="prep-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
        <div className="section-title mb-0 pb-0 border-0">
          <BarChart2 size={14} className="text-cyan-400" />
          Big-O Complexity Quick Reference
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Data structure operations</span>
          {open ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                {["Data Structure","Access","Search","Insert","Delete"].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {COMPLEXITY_TABLE.map(row => (
                <tr key={row.ds} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-3 py-2 font-medium text-foreground">{row.ds}</td>
                  {[row.access, row.search, row.insert, row.delete].map((v, i) => (
                    <td key={i} className={`px-3 py-2 font-mono ${
                      v === "O(1)" ? "text-emerald-400" :
                      v.includes("log") ? "text-blue-400" :
                      v === "O(n)" ? "text-amber-400" : "text-red-400"
                    }`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t border-border flex gap-4 text-xs">
            <span className="text-emerald-400">● O(1) constant</span>
            <span className="text-blue-400">● O(log n) logarithmic</span>
            <span className="text-amber-400">● O(n) linear</span>
            <span className="text-red-400">● O(n²)+ polynomial</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pattern Heatmap ────────────────────────────────────────────────────────
function PatternHeatmap({ ratings }: { ratings: Record<string, number> }) {
  const [patternTime] = usePatternTime();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const masteredCount = PATTERNS.filter(p => (ratings[p.id] ?? 0) >= 4).length;
  const weakCount = PATTERNS.filter(p => (ratings[p.id] ?? 0) > 0 && (ratings[p.id] ?? 0) <= 2).length;
  const ratedCount = PATTERNS.filter(p => ratings[p.id]).length;
  const avgRating = ratedCount
    ? (PATTERNS.filter(p => ratings[p.id]).reduce((s, p) => s + ratings[p.id], 0) / ratedCount).toFixed(1)
    : "—";
  const masteryPct = Math.round((masteredCount / PATTERNS.length) * 100);

  const maxTime = Math.max(...PATTERNS.map(p => patternTime[p.id] ?? 0), 1);

  const getColor = (rating: number) => {
    if (!rating) return "bg-secondary border border-border/50";
    if (rating <= 1) return "bg-red-500/80 border border-red-400/30";
    if (rating <= 2) return "bg-orange-500/80 border border-orange-400/30";
    if (rating <= 3) return "bg-amber-500/80 border border-amber-400/30";
    if (rating <= 4) return "bg-emerald-500/80 border border-emerald-400/30";
    return "bg-emerald-400 border border-emerald-300/50 shadow-sm shadow-emerald-500/30";
  };

  // Group patterns by difficulty for category breakdown
  const byDiff = {
    Easy: PATTERNS.filter(p => p.diff === "Easy"),
    Medium: PATTERNS.filter(p => p.diff === "Medium"),
    Hard: PATTERNS.filter(p => p.diff === "Hard"),
  };

  const hovered = hoveredId ? PATTERNS.find(p => p.id === hoveredId) : null;
  const hoveredRating = hoveredId ? (ratings[hoveredId] ?? 0) : 0;
  const hoveredTime = hoveredId ? (patternTime[hoveredId] ?? 0) : 0;

  // SVG ring params
  const r = 28, cx = 36, cy = 36, circ = 2 * Math.PI * r;
  const dash = (circ * masteryPct) / 100;

  return (
    <div className="prep-card p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart2 size={14} className="text-blue-400" />
        <span className="section-title text-sm mb-0 pb-0 border-0">Pattern Mastery Heatmap</span>
        <span className="ml-auto text-xs text-muted-foreground">{ratedCount}/{PATTERNS.length} rated</span>
      </div>

      <div className="flex gap-4 items-start">
        {/* Mastery ring */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <svg width="72" height="72" className="-rotate-90">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor" strokeWidth="6"
              strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
              className="text-emerald-500 transition-all duration-700" />
          </svg>
          <div className="-mt-[60px] flex flex-col items-center">
            <span className="text-base font-extrabold text-foreground">{masteryPct}%</span>
            <span className="text-[10px] text-muted-foreground">mastered</span>
          </div>
          <div className="mt-[28px] text-center">
            <div className="text-xs text-muted-foreground">avg ★{avgRating}</div>
          </div>
        </div>

        {/* Heatmap grid */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {PATTERNS.map(p => {
              const r = ratings[p.id] ?? 0;
              const timePct = Math.round(((patternTime[p.id] ?? 0) / maxTime) * 100);
              const secs = patternTime[p.id] ?? 0;
              const timeLabel = secs >= 60 ? `${Math.floor(secs/60)}m ${secs%60}s` : secs > 0 ? `${secs}s` : "";
              return (
                <div key={p.id} className="relative group"
                  onMouseEnter={() => setHoveredId(p.id)}
                  onMouseLeave={() => setHoveredId(null)}>
                  <div
                    className={`w-9 h-9 rounded-lg ${getColor(r)} flex items-center justify-center text-xs font-bold text-white cursor-default transition-all hover:scale-125 hover:z-10 relative overflow-hidden`}>
                    {/* Time invested underlay bar */}
                    {timePct > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-400/30 transition-all"
                        style={{ height: `${timePct}%` }} />
                    )}
                    <span className="relative z-10">{r || "·"}</span>
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-background border border-border rounded-lg px-2.5 py-1.5 shadow-lg text-xs whitespace-nowrap">
                      <div className="font-semibold text-foreground">{p.name}</div>
                      <div className="text-muted-foreground">{r ? `★${r}/5` : "Unrated"}{timeLabel ? ` · ${timeLabel} drilled` : ""}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Category breakdown */}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {Object.entries(byDiff).map(([diff, pats]) => {
              const mastered = pats.filter(p => (ratings[p.id] ?? 0) >= 4).length;
              const color = diff === "Easy" ? "text-emerald-400" : diff === "Hard" ? "text-red-400" : "text-amber-400";
              const barColor = diff === "Easy" ? "bg-emerald-500" : diff === "Hard" ? "bg-red-500" : "bg-amber-500";
              return (
                <div key={diff} className="p-2 rounded-lg bg-secondary">
                  <div className={`text-xs font-bold ${color} mb-1`}>{diff}</div>
                  <div className="text-xs text-foreground font-semibold">{mastered}/{pats.length}</div>
                  <div className="h-1 rounded-full bg-border mt-1 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${(mastered/pats.length)*100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mt-3 pt-3 border-t border-border">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/80 inline-block" />Weak (★–1–2)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80 inline-block" />Learning (★–3)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80 inline-block" />Strong (★–4–5)</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-blue-400/30 inline-block border border-blue-400/20" />Time drilled (fill)</span>
        <span className="ml-auto font-medium text-foreground">{weakCount} weak · {masteredCount} mastered</span>
      </div>
    </div>
  );
}

// ── Quick Drill ────────────────────────────────────────────────────────────
function QuickDrill({ ratings, onRate, weakOnly, onTimeLogged }: {
  ratings: Record<string, number>;
  onRate: (id: string, rating: number) => void;
  weakOnly: boolean;
  onTimeLogged: (id: string, seconds: number) => void;
}) {
  const pool = weakOnly
    ? PATTERNS.filter(p => (ratings[p.id] ?? 0) > 0 && (ratings[p.id] ?? 0) <= 2)
    : PATTERNS;
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number | null>(null);

  const current = pool[idx % Math.max(pool.length, 1)];

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(30);
    setRunning(false);
  }, []);

  const startTimer = useCallback(() => {
    startedAtRef.current = Date.now();
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
  }, []);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const next = () => {
    // Log time spent on current pattern
    if (startedAtRef.current !== null) {
      const elapsed = Math.round((Date.now() - startedAtRef.current) / 1000);
      if (elapsed > 0) onTimeLogged(current.id, elapsed);
      startedAtRef.current = null;
    }
    setIdx(i => (i + 1) % Math.max(pool.length, 1));
    setRevealed(false);
    resetTimer();
  };

  if (pool.length === 0) {
    return (
      <div className="prep-card p-6 text-center text-muted-foreground">
        <p className="text-sm">No {weakOnly ? "weak " : ""}patterns found.</p>
        {weakOnly && <p className="text-xs mt-1">Rate some patterns ★1–2 in the table below to populate weak-spots drill.</p>}
      </div>
    );
  }

  return (
    <div className="prep-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-400" />
          <span className="text-sm font-semibold text-foreground">Quick Drill</span>
          {weakOnly && <span className="badge badge-red">Weak Spots Only</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`mono text-lg font-bold ${timeLeft <= 10 ? "text-red-400" : "text-amber-400"}`}>{timeLeft}s</span>
          <button onClick={running ? resetTimer : startTimer}
            className="px-3 py-1 rounded-md text-xs font-semibold bg-secondary hover:bg-accent text-foreground transition-all">
            {running ? "Reset" : "Start"}
          </button>
          <button onClick={next} className="px-3 py-1 rounded-md text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all">
            Next →
          </button>
        </div>
      </div>
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-bold text-foreground">{current.name}</span>
          <span className={`badge ${DIFF_COLOR[current.diff]}`}>{current.diff}</span>
          <span className="badge badge-gray">★{current.freq} freq</span>
        </div>
        <p className="text-sm text-muted-foreground">{current.keyIdea}</p>
      </div>
      {!revealed ? (
        <button onClick={() => { setRevealed(true); resetTimer(); }}
          className="w-full py-2.5 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-blue-500/40 hover:text-blue-400 transition-all">
          Reveal answer
        </button>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-secondary text-sm text-foreground">{current.desc}</div>
          <div className="flex flex-wrap gap-1.5">
            {current.examples.map(e => <span key={e} className="badge badge-blue">{e}</span>)}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Rate this pattern:</span>
            <StarRating value={ratings[current.id] ?? 0} onChange={v => { onRate(current.id, v); next(); }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Mock Interview Timer ───────────────────────────────────────────────────
function MockTimer({ onSessionEnd }: { onSessionEnd: (duration: number) => void }) {
  const [duration, setDuration] = useState(35);
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pct = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const urgent = timeLeft <= 60;
  const warning = timeLeft <= 5 * 60;

  const start = () => {
    setRunning(true);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRunning(false);
          setDone(true);
          onSessionEnd(duration);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const pause = () => { if (timerRef.current) clearInterval(timerRef.current); setRunning(false); };
  const reset = () => { pause(); setTimeLeft(duration * 60); setDone(false); };

  useEffect(() => { reset(); }, [duration]); // eslint-disable-line
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const r = 40;
  const circ = 2 * Math.PI * r;

  return (
    <div className="prep-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={14} className="text-blue-400" />
        <span className="text-sm font-semibold text-foreground">Mock Interview Timer</span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG ring */}
        <div className="relative w-24 h-24 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="oklch(0.28 0.012 264)" strokeWidth="8" />
            <circle cx="50" cy="50" r={r} fill="none"
              stroke={urgent ? "oklch(0.65 0.22 25)" : warning ? "oklch(0.78 0.17 75)" : "oklch(0.62 0.19 258)"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`mono text-lg font-bold ${urgent ? "text-red-400" : warning ? "text-amber-400" : "text-foreground"}`}>
              {mm}:{ss}
            </span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {/* Duration selector */}
          <div className="flex gap-2">
            {[25, 35, 45].map(d => (
              <button key={d} onClick={() => { setDuration(d); }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${duration === d ? "bg-blue-500/20 border-blue-500/40 text-blue-400" : "bg-secondary border-border text-muted-foreground hover:text-foreground"}`}>
                {d} min
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {!running && !done && <button onClick={start} className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold transition-all">Start</button>}
            {running && <button onClick={pause} className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-foreground text-sm font-semibold transition-all">Pause</button>}
            <button onClick={reset} className="px-4 py-2 rounded-lg bg-secondary hover:bg-accent text-foreground text-sm font-semibold transition-all">Reset</button>
          </div>
          {done && <div className="text-sm font-semibold text-emerald-400">✓ Session complete! Session logged.</div>}
        </div>
      </div>
    </div>
  );
}

/// ── Sprint Mode ─────────────────────────────────────────────────────
const SPRINT_DURATION = 120; // 2 minutes per pattern
const SPRINT_COUNT = 5;

type SprintResult = { patternId: string; rated: number; skipped: boolean };

function SprintMode({ ratings, onRate, onClose }: {
  ratings: Record<string, number>;
  onRate: (id: string, rating: number) => void;
  onClose: () => void;
}) {
  // Pick N unmastered (rating < 4) patterns at random; fall back to all if not enough
  const pool = useMemo(() => {
    const unmastered = PATTERNS.filter(p => (ratings[p.id] ?? 0) < 4);
    const source = unmastered.length >= SPRINT_COUNT ? unmastered : PATTERNS;
    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, SPRINT_COUNT);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fixed at mount

  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SPRINT_DURATION);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<SprintResult[]>([]);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = pool[idx];

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(SPRINT_DURATION);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setRevealed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [stopTimer]);

  useEffect(() => {
    startTimer();
    return stopTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const advance = (rated: number, skipped: boolean) => {
    stopTimer();
    if (!skipped && rated > 0) onRate(current.id, rated);
    const newResults = [...results, { patternId: current.id, rated, skipped }];
    setResults(newResults);
    if (idx + 1 >= pool.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setRevealed(false);
    }
  };

  const pct = (timeLeft / SPRINT_DURATION) * 100;
  const urgent = timeLeft <= 20;
  const warning = timeLeft <= 60;

  if (done) {
    const ratedCount = results.filter(r => !r.skipped && r.rated > 0).length;
    const avgRated = ratedCount > 0
      ? (results.filter(r => !r.skipped).reduce((s, r) => s + r.rated, 0) / ratedCount).toFixed(1)
      : "—";
    return (
      <div className="prep-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <span className="text-base font-bold text-foreground">Sprint Complete!</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[["🎯", "Patterns", `${pool.length}`], ["⭐", "Avg Rating", avgRated], ["⏩", "Skipped", `${results.filter(r => r.skipped).length}`]].map(([e, l, v]) => (
            <div key={l as string} className="p-3 rounded-lg bg-secondary text-center">
              <div className="text-lg">{e}</div>
              <div className="text-lg font-bold text-foreground">{v}</div>
              <div className="text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
        <div className="space-y-2 mb-5">
          {results.map((r, i) => {
            const p = pool[i];
            return (
              <div key={p.id} className="flex items-center gap-3 text-xs">
                <span className={`w-2 h-2 rounded-full shrink-0 ${r.skipped ? "bg-muted-foreground" : r.rated >= 4 ? "bg-emerald-400" : r.rated >= 3 ? "bg-amber-400" : "bg-red-400"}`} />
                <span className="flex-1 text-foreground font-medium">{p.name}</span>
                <span className="text-muted-foreground">{r.skipped ? "Skipped" : `★ ${r.rated}`}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-sm font-semibold text-foreground transition-all">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="prep-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-orange-400" />
          <span className="text-sm font-bold text-foreground">Sprint Mode</span>
          <span className="badge badge-gray">{idx + 1}/{pool.length}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={14} /></button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-secondary mb-4 overflow-hidden">
        <div className="h-full rounded-full bg-orange-400 transition-all" style={{ width: `${((idx) / pool.length) * 100}%` }} />
      </div>

      {/* Timer ring + pattern */}
      <div className="flex gap-5 items-start mb-4">
        {/* Circular timer */}
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="oklch(0.28 0.012 264)" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none"
              stroke={urgent ? "oklch(0.65 0.22 25)" : warning ? "oklch(0.78 0.17 75)" : "oklch(0.72 0.18 45)"}
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-mono text-base font-bold ${urgent ? "text-red-400" : warning ? "text-amber-400" : "text-foreground"}`}>
              {String(Math.floor(timeLeft / 60)).padStart(2, "0")}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Pattern info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-base font-bold text-foreground">{current.name}</span>
            <span className={`badge ${DIFF_COLOR[current.diff]}`}>{current.diff}</span>
            {(ratings[current.id] ?? 0) > 0 && (
              <span className="badge badge-gray">★ {ratings[current.id]}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-2">{current.desc}</p>
          {!revealed ? (
            <button onClick={() => setRevealed(true)}
              className="px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent border border-border text-xs font-semibold text-foreground transition-all">
              Reveal Key Idea
            </button>
          ) : (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="text-xs font-bold text-emerald-400 mb-1">Key Idea</div>
              <div className="text-xs text-foreground mb-2">{current.keyIdea}</div>
              <div className="flex flex-wrap gap-1">
                {current.examples.map(e => (
                  <span key={e} className="badge badge-gray">{e}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rating + Skip */}
      {revealed && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-medium">How well did you explain it?</div>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5].map(r => (
              <button key={r} onClick={() => advance(r, false)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  r <= 2 ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  : r === 3 ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                }`}>
                ★ {r}
              </button>
            ))}
            <button onClick={() => advance(0, true)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-secondary border border-border text-muted-foreground text-xs font-semibold hover:text-foreground transition-all">
              <SkipForward size={11} /> Skip
            </button>
          </div>
        </div>
      )}
      {!revealed && (
        <div className="flex justify-end">
          <button onClick={() => advance(0, true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-muted-foreground text-xs font-semibold hover:text-foreground transition-all">
            <SkipForward size={11} /> Skip
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main CodingTab ─────────────────────────────────────────────────────
export default function CodingTab() {
  const [ratings, setRatings] = usePatternRatings();
  const [notes, setNotes] = usePatternNotes();
  const [srDue, setSrDue] = useSpacedRepetition();
  const [sessions, setSessions] = useCodingHistory();
  const [patternTime, setPatternTime] = usePatternTime();

  const handleTimeLogged = (id: string, seconds: number) => {
    setPatternTime(t => ({ ...t, [id]: (t[id] ?? 0) + seconds }));
  };
  const [search, setSearch] = useState("");
  const [filterDiff, setFilterDiff] = useState("All");
  const [filterFreq, setFilterFreq] = useState(0);
  const [filterMastery, setFilterMastery] = useState("All");
  const [weakOnly, setWeakOnly] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [showDrillMode, setShowDrillMode] = useState(false);
  const [showSprintMode, setShowSprintMode] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  // Stuck? hint ladder: patternId → { level, hint, loading }
  const [stuckHints, setStuckHints] = useState<Record<string, { level: "gentle"|"medium"|"full"; hint: string; loading: boolean }>>({});
  const patternHintMutation = trpc.ctci.patternHint.useMutation({
    onError: () => toast.error("Could not generate hint. Try again."),
  });
  const [hintAnalytics, setHintAnalytics] = useHintAnalytics();
  const [showCheatSheet, setShowCheatSheet] = useState<string | null>(null);
  // Explain this pattern AI
  const [explainOpen, setExplainOpen] = useState<string | null>(null);
  const [explainContent, setExplainContent] = useState<Record<string, string>>({});
  const explainMutation = trpc.ai.explainPattern.useMutation({
    onSuccess: (data, vars) => {
      setExplainContent(prev => ({ ...prev, [vars.patternId]: data.explanation }));
    },
    onError: () => toast.error("Could not generate explanation. Try again."),
  });
  const [ctciTags, setCtciTags] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem("ctci_tags_v1") ?? "{}"); } catch { return {}; }
  });
  const saveCtciTags = (tags: Record<string, string[]>) => {
    setCtciTags(tags);
    localStorage.setItem("ctci_tags_v1", JSON.stringify(tags));
  };
  const [tagInput, setTagInput] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split("T")[0];

  // Confetti burst for unlock celebrations
  const triggerUnlockConfetti = (patternName: string) => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"];
    for (let i = 0; i < 60; i++) {
      const el = document.createElement("div");
      el.style.cssText = `position:fixed;top:0;left:${Math.random()*100}vw;width:8px;height:8px;background:${colors[Math.floor(Math.random()*colors.length)]};border-radius:${Math.random()>0.5?"50%":"2px"};z-index:9999;pointer-events:none;animation:confetti-fall ${1.5+Math.random()}s ease-in forwards;transform:rotate(${Math.random()*360}deg);`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3000);
    }
    toast.success(`🔓 ${patternName} unlocked!`, { duration: 4000 });
  };

  const handleRate = (id: string, rating: number) => {
    const prevRatings = ratings;
    setRatings(r => ({ ...r, [id]: rating }));
    // Spaced repetition scheduling
    const days = rating <= 2 ? 1 : rating === 3 ? 3 : rating === 4 ? 7 : 14;
    const due = new Date();
    due.setDate(due.getDate() + days);
    setSrDue(d => ({ ...d, [id]: due.toISOString().split("T")[0] }));
    // Check if any pattern just got unlocked by this rating change
    if (rating >= 3) {
      const updatedRatings = { ...prevRatings, [id]: rating };
      PATTERNS.forEach(p => {
        const prereqs = PATTERN_PREREQS[p.id];
        if (!prereqs || prereqs.length === 0) return;
        const wasLocked = prereqs.some(pid => (prevRatings[pid] ?? 0) < 3);
        const nowUnlocked = prereqs.every(pid => (updatedRatings[pid] ?? 0) >= 3);
        if (wasLocked && nowUnlocked) {
          setTimeout(() => triggerUnlockConfetti(p.name), 300);
        }
      });
    }
  };

  const handleSessionEnd = (duration: number) => {
    setSessions(s => [...s, { id: Date.now().toString(), date: today, duration, type: `${duration}min` as "35min" }]);
    toast.success(`${duration}-min session logged!`);
  };

  const getPatternHint = async (p: typeof PATTERNS[0], level: "gentle"|"medium"|"full") => {
    setStuckHints(h => ({ ...h, [p.id]: { level, hint: "", loading: true } }));
    // Track hint usage analytics
    setHintAnalytics(a => ({
      ...a,
      [p.id]: {
        gentle: (a[p.id]?.gentle ?? 0) + (level === "gentle" ? 1 : 0),
        medium: (a[p.id]?.medium ?? 0) + (level === "medium" ? 1 : 0),
        full:   (a[p.id]?.full   ?? 0) + (level === "full"   ? 1 : 0),
      },
    }));
    try {
      const res = await patternHintMutation.mutateAsync({
        patternName: p.name,
        patternDesc: p.desc,
        patternKeyIdea: p.keyIdea,
        examples: p.examples,
        hintLevel: level,
        userRating: ratings[p.id] ?? 0,
      });
      setStuckHints(h => ({ ...h, [p.id]: { level, hint: res.hint, loading: false } }));
    } catch {
      setStuckHints(h => ({ ...h, [p.id]: { level, hint: "Could not generate hint.", loading: false } }));
    }
  };

  const exportAnkiCSV = () => {
    const rows = ["#separator:comma", "#html:false", "#deck:Meta Coding Patterns", "#notetype:Basic"];
    PATTERNS.forEach(p => {
      const front = `${p.name} (${p.diff})`;
      const back = `Key Idea: ${p.keyIdea}\\n\\nDescription: ${p.desc}\\n\\nExamples: ${p.examples.join(", ")}`;
      rows.push(`"${front}","${back}","Meta,Coding,${p.diff}"`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "meta_patterns_anki.csv"; a.click();
    toast.success("Anki CSV exported! Import into Anki or Quizlet.");
  };

  const filtered = PATTERNS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.keyIdea.toLowerCase().includes(q) || p.examples.some(e => e.toLowerCase().includes(q));
    const matchDiff = filterDiff === "All" || p.diff === filterDiff;
    const matchFreq = filterFreq === 0 || p.freq >= filterFreq;
    const r = ratings[p.id] ?? 0;
    const matchMastery = filterMastery === "All" || (filterMastery === "Mastered" && r >= 4) || (filterMastery === "Weak" && r > 0 && r <= 2) || (filterMastery === "Unrated" && r === 0);
    const matchWeak = !weakOnly || (r > 0 && r <= 2);
    return matchSearch && matchDiff && matchFreq && matchMastery && matchWeak;
  });

  const dueToday = PATTERNS.filter(p => srDue[p.id] && srDue[p.id] <= today);

  return (
    <div className="space-y-5">
      {/* Quick Actions sticky row */}
      <div className="sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-background/90 backdrop-blur-sm border-b border-border flex items-center gap-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:block">Quick Actions</span>
        <div className="flex gap-2 flex-1 flex-wrap">
          <button
            onClick={() => {
              const el = document.getElementById("coding-mock-session");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all"
          >
            <Code2 size={12} />
            Start Coding Mock
            <kbd className="ml-1 px-1 py-0.5 rounded text-[9px] font-mono bg-blue-900/40 text-blue-400 border border-blue-700/40">⌥2</kbd>
          </button>
          <button
            onClick={() => {
              setWeakOnly(true);
              const el = document.getElementById("coding-patterns-list");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
          >
            <Zap size={12} />
            Jump to Weak Patterns
          </button>
        </div>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }))}
          title='Keyboard shortcuts (?)'
          className='ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0'
        >
          <HelpCircle size={13} />
        </button>
      </div>
      {/* CTCI 500 Question Tracker — top of page */}
      <CTCITracker />

      {/* Heatmap */}
      {showHeatmap && <PatternHeatmap ratings={ratings} />}

      {/* Mock Interview Simulator */}
      <MockInterviewSimulator />

      {/* Controls bar */}
      <div id="coding-patterns-list" className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search patterns, key ideas, examples…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50" />
        </div>
        {/* Filters */}
        <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none">
          <option value="All">All Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <select value={filterFreq} onChange={e => setFilterFreq(Number(e.target.value))}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none">
          <option value={0}>All Frequency</option>
          <option value={4}>★4+ freq</option>
          <option value={5}>★5 freq</option>
        </select>
        <select value={filterMastery} onChange={e => setFilterMastery(e.target.value)}
          className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none">
          <option value="All">All Mastery</option>
          <option value="Mastered">Mastered (★4–5)</option>
          <option value="Weak">Weak (★1–2)</option>
          <option value="Unrated">Unrated</option>
        </select>
        {/* Weak spots toggle */}
        <button onClick={() => setWeakOnly(w => !w)}
          className={`filter-btn ${weakOnly ? "filter-btn-weak active" : "filter-btn-weak"}`}>
          🎯 Weak Spots {weakOnly ? "ON" : "OFF"}
        </button>
        {/* Due today */}
        {dueToday.length > 0 && (
          <span className="badge badge-amber">{dueToday.length} due today</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setShowDrillMode(d => !d); setShowSprintMode(false); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-sm font-semibold transition-all">
          <Zap size={13} /> {showDrillMode ? "Hide" : "Show"} Quick Drill
        </button>
        <button onClick={() => { setShowSprintMode(s => !s); setShowDrillMode(false); }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all ${
            showSprintMode
              ? "bg-orange-500/25 border-orange-500/50 text-orange-300"
              : "bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/30 text-orange-400"
          }`}>
          <Timer size={13} /> {showSprintMode ? "Hide" : "Start"} Sprint Mode
        </button>
        <button onClick={() => setShowHeatmap(h => !h)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary hover:bg-accent border border-border text-muted-foreground text-sm font-semibold transition-all">
          <BarChart2 size={13} /> {showHeatmap ? "Hide" : "Show"} Heatmap
        </button>
        <button onClick={exportAnkiCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 text-sm font-semibold transition-all">
          <Download size={13} /> Export Anki CSV
        </button>
      </div>

      {/* Sprint Mode */}
      {showSprintMode && (
        <SprintMode
          ratings={ratings}
          onRate={handleRate}
          onClose={() => setShowSprintMode(false)}
        />
      )}

      {/* Quick Drill */}
      {showDrillMode && <QuickDrill ratings={ratings} onRate={handleRate} weakOnly={weakOnly} onTimeLogged={handleTimeLogged} />}

      {/* Mock Timer */}
      <MockTimer onSessionEnd={handleSessionEnd} />

      {/* Session history summary */}
      {sessions.length > 0 && (
        <div className="prep-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={13} className="text-blue-400" />
            <span className="text-sm font-semibold text-foreground">Session History</span>
            <span className="badge badge-blue ml-auto">{sessions.length} sessions</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sessions.slice(-8).reverse().map(s => (
              <div key={s.id} className="px-2.5 py-1 rounded-md bg-secondary text-xs text-muted-foreground">
                {s.date} · {s.duration}min
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7-step approach */}
      <div className="prep-card p-5">
        <div className="section-title">
          <BookOpen size={14} className="text-blue-400" />
          7-Step Problem-Solving Approach
        </div>
        <ol className="space-y-2">
          {[
            ["Clarify", "Ask 2–3 clarifying questions. Confirm input/output format, constraints, edge cases."],
            ["Examples", "Walk through 2 examples (normal + edge case) before touching code."],
            ["Pattern Recognition", "Identify which of the 14 patterns applies. State it aloud."],
            ["Brute Force First", "Describe the O(n²) or naive solution. Explain why it's suboptimal."],
            ["Optimize", "Apply the pattern. Explain time/space complexity before coding."],
            ["Code", "Write clean, readable code. Use meaningful variable names. No magic numbers."],
            ["Test & Edge Cases", "Trace through your code with examples. Check null, empty, single element."],
          ].map(([step, desc], i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <div><span className="font-semibold text-foreground">{step}: </span><span className="text-muted-foreground">{desc}</span></div>
            </li>
          ))}
        </ol>
      </div>

      {/* Complexity Quick-Reference Card */}
      <ComplexityCard />

      {/* Pattern table */}
      <div className="prep-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="section-title mb-0 pb-0 border-0">
            <Filter size={14} className="text-blue-400" />
            Pattern Quick Reference
          </div>
          <span className="text-xs text-muted-foreground">{filtered.length}/{PATTERNS.length} shown</span>
        </div>
        <div className="divide-y divide-border">
          {filtered.map(p => {
            const r = ratings[p.id] ?? 0;
            const isExpanded = expandedNote === p.id;
            const isDue = srDue[p.id] && srDue[p.id] <= today;
            const secs = patternTime[p.id] ?? 0;
            const mins = Math.floor(secs / 60);
            const maxSecs = Math.max(...PATTERNS.map(x => patternTime[x.id] ?? 0), 1);
            const timePct = Math.min(100, Math.round((secs / maxSecs) * 100));
            // Dependency unlock: check if all prerequisites are rated ≥3
            const prereqs = PATTERN_PREREQS[p.id] ?? [];
            const unmetPrereqs = prereqs.filter(pid => (ratings[pid] ?? 0) < 3);
            const isLocked = unmetPrereqs.length > 0;
            const prereqNames = unmetPrereqs.map(pid => PATTERNS.find(x => x.id === pid)?.name ?? pid);
            return (
              <div key={p.id} className={`p-4 transition-all ${isLocked ? "opacity-50" : ""} ${r >= 4 ? "bg-emerald-500/3" : r > 0 && r <= 2 ? "bg-red-500/3" : ""}`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-semibold text-sm text-foreground">{p.name}</span>
                      <span className={`badge ${DIFF_COLOR[p.diff]}`}>{p.diff}</span>
                      <span className="badge badge-gray">★{p.freq}</span>
                      {isDue && <span className="badge badge-amber">Due today</span>}
                      {r >= 4 && <span className="badge badge-green">Mastered</span>}
                      {r > 0 && r <= 2 && <span className="badge badge-red">Weak</span>}
                      {isLocked && (
                        <span className="badge badge-gray" title={`Unlock by mastering: ${prereqNames.join(", ")}`}>
                          🔒 Locked — master {prereqNames.join(" & ")} first
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-1.5">{p.keyIdea}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.examples.map(e => <span key={e} className="badge badge-blue text-xs">{e}</span>)}
                    </div>
                    {/* Time-invested bar */}
                    {secs > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <Clock size={10} className="text-muted-foreground shrink-0" />
                        <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500/60 transition-all"
                            style={{ width: `${timePct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{mins > 0 ? `${mins}m` : `${secs}s`}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StarRating value={r} onChange={v => handleRate(p.id, v)} />
                    <button onClick={() => setExpandedNote(isExpanded ? null : p.id)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <BookOpen size={11} /> Notes {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                    {/* Stuck? hint ladder */}
                    <button
                      onClick={() => stuckHints[p.id] ? setStuckHints(h => { const n = {...h}; delete n[p.id]; return n; }) : getPatternHint(p, "gentle")}
                      className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                      <Zap size={11} /> {stuckHints[p.id] ? "Hide hints" : "Stuck?"}
                    </button>
                    {/* Cheat Sheet */}
                    {CHEAT_SHEETS[p.id] && (
                      <button
                        onClick={() => setShowCheatSheet(showCheatSheet === p.id ? null : p.id)}
                        className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                        <Code2 size={11} /> {showCheatSheet === p.id ? "Hide" : "Cheat Sheet"}
                      </button>
                    )}
                    {/* Video link */}
                    {PATTERN_VIDEOS[p.id] && (
                      <a href={PATTERN_VIDEOS[p.id].url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                        <Play size={11} /> Video
                      </a>
                    )}
                    {/* Explain this pattern (AI) */}
                    <button
                      onClick={() => {
                        if (explainOpen === p.id) { setExplainOpen(null); return; }
                        setExplainOpen(p.id);
                        if (!explainContent[p.id]) {
                          explainMutation.mutate({ patternId: p.id, patternName: p.name, icMode: "IC6" });
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                      <Brain size={11} /> {explainOpen === p.id ? "Hide AI" : "Explain"}
                    </button>
                  </div>
                </div>
                {/* CTCI Tags */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {(ctciTags[p.id] ?? []).map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400">
                      {tag}
                      <button onClick={() => saveCtciTags({ ...ctciTags, [p.id]: (ctciTags[p.id] ?? []).filter(t => t !== tag) })}
                        className="hover:text-red-400 transition-colors">×</button>
                    </span>
                  ))}
                  <form onSubmit={e => {
                    e.preventDefault();
                    const val = (tagInput[p.id] ?? "").trim();
                    if (val && !(ctciTags[p.id] ?? []).includes(val)) {
                      saveCtciTags({ ...ctciTags, [p.id]: [...(ctciTags[p.id] ?? []), val] });
                    }
                    setTagInput(t => ({ ...t, [p.id]: "" }));
                  }} className="flex items-center gap-1">
                    <input
                      value={tagInput[p.id] ?? ""}
                      onChange={e => setTagInput(t => ({ ...t, [p.id]: e.target.value }))}
                      placeholder="+ tag"
                      className="w-16 px-1.5 py-0.5 rounded bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50"
                    />
                    <button type="submit" className="text-xs text-violet-400 hover:text-violet-300"><Tag size={10} /></button>
                  </form>
                </div>
                {/* Cheat Sheet Panel */}
                {showCheatSheet === p.id && CHEAT_SHEETS[p.id] && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-emerald-500/20">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-500/5 border-b border-emerald-500/20">
                      <span className="text-xs font-bold text-emerald-400">📋 {p.name} — Canonical Template (Python)</span>
                      <button onClick={() => {
                        navigator.clipboard.writeText(CHEAT_SHEETS[p.id]);
                        toast.success("Copied to clipboard!");
                      }} className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Copy</button>
                    </div>
                    <pre className="p-3 text-xs text-foreground font-mono leading-relaxed overflow-x-auto whitespace-pre bg-[#0d1117]">{CHEAT_SHEETS[p.id]}</pre>
                  </div>
                )}
                {/* Explain Pattern AI Panel */}
                {explainOpen === p.id && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-violet-500/20">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-violet-500/5 border-b border-violet-500/20">
                      <span className="text-xs font-bold text-violet-400">🤖 AI Explanation — {p.name}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => explainMutation.mutate({ patternId: p.id, patternName: p.name, icMode: "IC7" })}
                          disabled={explainMutation.isPending}
                          className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
                          IC7 Mode
                        </button>
                        <button
                          onClick={() => explainMutation.mutate({ patternId: p.id, patternName: p.name, icMode: "IC6" })}
                          disabled={explainMutation.isPending}
                          className="text-xs text-violet-400 hover:text-violet-300 transition-colors disabled:opacity-50">
                          IC6 Mode
                        </button>
                      </div>
                    </div>
                    <div className="p-3 text-xs text-foreground bg-[#0d1117] min-h-[60px]">
                      {explainMutation.isPending && explainMutation.variables?.patternId === p.id ? (
                        <span className="text-violet-400 animate-pulse">Generating explanation…</span>
                      ) : explainContent[p.id] ? (
                        <Streamdown>{explainContent[p.id]}</Streamdown>
                      ) : (
                        <span className="text-muted-foreground">Click a mode button to generate an explanation.</span>
                      )}
                    </div>
                  </div>
                )}
                {isExpanded && (
                  <div className="mt-3">
                    <textarea
                      value={notes[p.id] ?? ""}
                      onChange={e => setNotes(n => ({ ...n, [p.id]: e.target.value }))}
                      placeholder="Add your mnemonic, notes, or key insight…"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-blue-500/50 resize-none"
                    />
                  </div>
                )}
                {/* Stuck? 3-step hint ladder */}
                {stuckHints[p.id] && (
                  <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 space-y-3">
                    {/* Level selector */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">Hint Level:</span>
                      {(["gentle", "medium", "full"] as const).map(lvl => (
                        <button key={lvl} onClick={() => getPatternHint(p, lvl)}
                          className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                            stuckHints[p.id]?.level === lvl
                              ? "bg-amber-500 text-black"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}>
                          {lvl === "gentle" ? "1️⃣ Gentle" : lvl === "medium" ? "2️⃣ Medium" : "3️⃣ Full"}
                        </button>
                      ))}
                    </div>
                    {/* Hint content */}
                    {stuckHints[p.id]?.loading ? (
                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <Zap size={11} className="animate-pulse" /> Generating hint…
                      </div>
                    ) : stuckHints[p.id]?.hint ? (
                      <div className="text-xs text-foreground leading-relaxed">{stuckHints[p.id].hint}</div>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No patterns match your filters.</div>
          )}
        </div>
      </div>

      {/* AI-Enabled Round Deep Dive */}
      <AIEnabledRoundSection />

      {/* Pattern Dependency Graph */}
      <PatternDependencyGraph />
    </div>
  );
}

// ── AI-Enabled Round Section ───────────────────────────────────────────────
function AIEnabledRoundSection() {
  const [open, setOpen] = useState(false);

  const checkpoints = [
    { label: "Checkpoint 1", desc: "Understand the codebase structure, identify entry points, and clarify requirements. Often done without AI." },
    { label: "Checkpoint 2", desc: "Implement core logic — the primary function or module. Use AI for boilerplate; you own the algorithm." },
    { label: "Checkpoint 3", desc: "Add edge-case handling, input validation, and error paths. Run tests and fix failures." },
    { label: "Checkpoint 4", desc: "Extend or refactor — add a new feature, optimize a hot path, or improve code quality. Discuss trade-offs." },
    { label: "Checkpoint 5+", desc: "Bonus: runtime analysis, contract changes, data reasoning, or a second extension. Differentiates IC6 from IC7." },
  ];

  const evalCriteria = [
    { icon: "🧠", title: "Problem Solving", desc: "Clarify and refine problem statements. Generate solutions to open-ended and quantitative problems." },
    { icon: "💻", title: "Code Development", desc: "Navigate a codebase, build on working structures, evaluate code quality, and ensure code works as intended after execution." },
    { icon: "🔍", title: "Verification & Debugging", desc: "Find and mitigate errors. Verify solutions meet specified requirements. Run code iteratively." },
    { icon: "🗣️", title: "Technical Communication", desc: "Communicate reasoning, discuss technical ideas, ask thoughtful questions, and incorporate feedback." },
  ];

  const aiTips = [
    ["Use AI for boilerplate", "Let the AI scaffold classes, write repetitive loops, and generate test stubs. You focus on the algorithm and design decisions."],
    ["Be precise with prompts", "Ask for a specific function or small slice of logic — not the entire solution. Vague prompts produce hallucinated code."],
    ["Always review AI output", "AI can suggest suboptimal algorithms, miss constraints, or introduce subtle bugs. Treat every suggestion as a draft to verify."],
    ["Pipeline your work", "While AI drafts one section, you review or explain the previous section to the interviewer. Never wait idle."],
    ["First checkpoint without AI", "Some interviewers ask you to complete checkpoint 1 unaided. Be ready to code fluently from scratch."],
    ["Know your model", "GPT-4o mini, Claude 3.5 Haiku, and Llama 4 Maverick are confirmed available. Each has different latency and hallucination patterns — practice with them before your interview."],
  ];

  const models = [
    { name: "GPT-4o mini", status: "confirmed", note: "Fast, good at Python/JS boilerplate" },
    { name: "Claude 3.5 Haiku", status: "confirmed", note: "Strong at following precise instructions" },
    { name: "Llama 4 Maverick", status: "confirmed", note: "Meta's own model — expect it in most rounds" },
    { name: "GPT-5", status: "unconfirmed", note: "Supported by CoderPad, not yet confirmed" },
    { name: "Gemini 2.5 Pro", status: "unconfirmed", note: "Supported by CoderPad, not yet confirmed" },
    { name: "Claude 4 Sonnet", status: "unconfirmed", note: "Supported by CoderPad, not yet confirmed" },
  ];

  return (
    <div className="prep-card p-5">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div className="text-left">
            <div className="text-sm font-bold text-foreground">Meta AI-Enabled Coding Round</div>
            <div className="text-xs text-muted-foreground">New format since Oct 2025 · CoderPad + AI assistant · 60 min · 4–5 checkpoints</div>
          </div>
          <span className="badge badge-blue ml-2">NEW</span>
        </div>
        {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-5 space-y-5">
          {/* Format overview */}
          <div className="callout callout-blue p-4">
            <div className="text-xs font-bold text-blue-400 mb-2">FORMAT OVERVIEW</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                ["60 min", "Total time"],
                ["CoderPad", "Environment"],
                ["4+ checkpoints", "Target to clear"],
                ["1 question", "Multi-part theme"],
              ].map(([val, lbl]) => (
                <div key={lbl}>
                  <div className="text-base font-bold text-blue-300">{val}</div>
                  <div className="text-xs text-muted-foreground">{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Key insight */}
          <div className="callout callout-amber p-3">
            <div className="text-xs font-bold text-amber-400 mb-1">⚡ KEY INSIGHT</div>
            <p className="text-xs text-muted-foreground">
              This is <strong className="text-foreground">not an interview about how well you use AI</strong>. The AI is a tool to help you demonstrate coding skills more efficiently. You are evaluated on problem-solving, code quality, and verification — not prompt engineering. Clearing <strong className="text-foreground">at least 4 checkpoints</strong> is the target; 3 is the minimum threshold but not a guarantee.
            </p>
          </div>

          {/* Checkpoints */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Typical Checkpoint Progression</div>
            <div className="space-y-2">
              {checkpoints.map((cp, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    i < 3 ? "bg-emerald-500/20 text-emerald-400" : i === 3 ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                  }`}>{i + 1}</div>
                  <div>
                    <div className="text-xs font-semibold text-foreground">{cp.label}</div>
                    <div className="text-xs text-muted-foreground">{cp.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Evaluation criteria */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">What Interviewers Evaluate</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {evalCriteria.map(c => (
                <div key={c.title} className="p-3 rounded-lg bg-secondary">
                  <div className="text-xs font-bold text-foreground mb-1">{c.icon} {c.title}</div>
                  <div className="text-xs text-muted-foreground">{c.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI models */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">Available AI Models</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {models.map(m => (
                <div key={m.name} className="p-2.5 rounded-lg bg-secondary flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${m.status === "confirmed" ? "bg-emerald-400" : "bg-amber-400"}`} />
                  <div>
                    <div className="text-xs font-semibold text-foreground">{m.name}</div>
                    <div className="text-xs text-muted-foreground">{m.note}</div>
                    <div className={`text-xs mt-0.5 ${m.status === "confirmed" ? "text-emerald-400" : "text-amber-400"}`}>
                      {m.status === "confirmed" ? "✓ Confirmed" : "~ Unconfirmed"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI tips */}
          <div>
            <div className="text-xs font-bold text-foreground mb-2 uppercase tracking-wider">How to Use AI Effectively</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {aiTips.map(([title, desc]) => (
                <div key={title} className="callout callout-blue p-3">
                  <div className="text-xs font-bold text-blue-400 mb-1">{title}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Highest-leverage moves */}
          <div className="callout callout-green p-4">
            <div className="text-xs font-bold text-emerald-400 mb-2">✅ YOUR HIGHEST-LEVERAGE MOVES</div>
            <ol className="space-y-1">
              {[
                "Build a requirements checklist before touching code",
                "Write tests first (or understand pre-written tests if provided)",
                "Generate a skeleton before implementing logic",
                "Pipeline your work: while AI drafts, you review or explain to interviewer",
                "Run and debug in small iterations — fix one thing at a time",
                "Be ready for non-coding discussion: runtime analysis, trade-offs, data reasoning",
              ].map((m, i) => (
                <li key={i} className="text-xs text-muted-foreground flex gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">{i + 1}.</span>
                  {m}
                </li>
              ))}
            </ol>
          </div>

          {/* Languages + unit test frameworks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { lang: "Python", test: "unittest" },
              { lang: "Java", test: "JUnit" },
              { lang: "C++", test: "GoogleTest" },
              { lang: "C# / TypeScript", test: "NUnit / Jest" },
            ].map(l => (
              <div key={l.lang} className="p-2.5 rounded-lg bg-secondary text-center">
                <div className="text-xs font-bold text-foreground">{l.lang}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{l.test}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-muted-foreground">
            Source: <a href="https://www.coditioning.com/blog/13/meta-ai-enabled-coding-interview-guide" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Coditioning — Meta AI-Enabled Coding Interview Guide</a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CTCI 500 Question Tracker ──────────────────────────────────────────────
import { CTCI_QUESTIONS, CTCI_ALL_TOPICS } from "@/lib/ctciData";

const PAGE_SIZE = 25;

// ── Daily Challenge helper ─────────────────────────────────────────────────
function getDailyChallenge(solved: Record<number, boolean>): number | null {
  const unsolvedHigh = CTCI_QUESTIONS.filter(q => q.metaFreq === "High" && !solved[q.num]);
  if (unsolvedHigh.length === 0) return null;
  // Deterministic daily seed: day-of-year
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return unsolvedHigh[dayOfYear % unsolvedHigh.length].num;
}

function CTCITracker() {
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [freqFilter, setFreqFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [solved, setSolved] = useState<Record<number, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("ctci_solved") ?? "{}"); } catch { return {}; }
  });
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState<number | null>(null);
  const [editorCode, setEditorCode] = useState<Record<number, string>>(() => {
    try { return JSON.parse(localStorage.getItem("ctci_code") ?? "{}"); } catch { return {}; }
  });
  const [ctciStreak, setCTCIStreak] = useCTCIStreak();
  const [hintOpen, setHintOpen] = useState<number | null>(null);
  const [hints, setHints] = useState<Record<number, string>>({});
  const [notesOpen, setNotesOpen] = useState<number | null>(null);
  const [diffEstOpen, setDiffEstOpen] = useState<number | null>(null);
  const [diffEstimates, setDiffEstimates] = useCTCIDifficultyEstimates();
  const [notes, setNotes] = useState<Record<number, string>>(() => {
    try { return JSON.parse(localStorage.getItem("ctci_notes") ?? "{}"); } catch { return {}; }
  });
  const hintMutation = trpc.ctci.getHint.useMutation({
    onSuccess: (data, variables) => {
      setHints(h => ({ ...h, [variables.problemNum]: data.hint }));
    },
    onError: () => toast.error("Failed to get hint. Try again."),
  });

  const dailyChallengeNum = useMemo(() => getDailyChallenge(solved), [solved]);

  const saveCode = (num: number, code: string) => {
    setEditorCode(c => {
      const next = { ...c, [num]: code };
      localStorage.setItem("ctci_code", JSON.stringify(next));
      return next;
    });
  };

  const saveNote = (num: number, text: string) => {
    setNotes(n => {
      const next = { ...n, [num]: text };
      localStorage.setItem("ctci_notes", JSON.stringify(next));
      return next;
    });
  };

  const exportNotesMarkdown = () => {
    const problemsWithNotes = CTCI_QUESTIONS.filter(q => notes[q.num]?.trim());
    if (problemsWithNotes.length === 0) { toast.error("No notes to export yet."); return; }
    const lines = [
      "# CTCI Problem Notes — Meta Prep Cheat Sheet",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      ...problemsWithNotes.map(q => [
        `## ${q.num}. ${q.name}`,
        `**Difficulty:** ${q.difficulty} | **Topics:** ${q.topics.join(", ")} | **Meta Freq:** ${q.metaFreq}`,
        "",
        notes[q.num].trim(),
        "",
        "---",
        "",
      ].join("\n")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ctci_notes.md"; a.click();
    toast.success(`Exported ${problemsWithNotes.length} problem notes!`);
  };

  const today = new Date().toISOString().split("T")[0];

  const toggle = (num: number) => {
    setSolved(s => {
      const next = { ...s, [num]: !s[num] };
      localStorage.setItem("ctci_solved", JSON.stringify(next));
      // Update CTCI streak when solving the daily challenge
      if (next[num] && num === dailyChallengeNum) {
        setCTCIStreak(prev => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];
          const newStreak = prev.lastSolvedDate === yesterdayStr || prev.lastSolvedDate === today
            ? (prev.lastSolvedDate === today ? prev.currentStreak : prev.currentStreak + 1)
            : 1;
          return {
            currentStreak: newStreak,
            lastSolvedDate: today,
            longestStreak: Math.max(newStreak, prev.longestStreak),
            totalSolved: prev.totalSolved + 1,
          };
        });
      } else if (!next[num] && num === dailyChallengeNum && ctciStreak.lastSolvedDate === today) {
        // Unsolving today's challenge decrements streak
        setCTCIStreak(prev => ({
          ...prev,
          currentStreak: Math.max(0, prev.currentStreak - 1),
          totalSolved: Math.max(0, prev.totalSolved - 1),
        }));
      }
      return next;
    });
  };

  const filtered = CTCI_QUESTIONS.filter(q => {
    if (diffFilter !== "All" && q.difficulty !== diffFilter) return false;
    if (topicFilter !== "All" && !q.topics.includes(topicFilter)) return false;
    if (freqFilter !== "All" && q.metaFreq !== freqFilter) return false;
    if (search && !q.name.toLowerCase().includes(search.toLowerCase()) && !q.topics.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  const solvedCount = Object.values(solved).filter(Boolean).length;
  const highFreqSolved = CTCI_QUESTIONS.filter(q => q.metaFreq === "High" && solved[q.num]).length;
  const highFreqTotal = CTCI_QUESTIONS.filter(q => q.metaFreq === "High").length;

  return (
    <div className="prep-card overflow-hidden" style={{ border: '2px solid transparent', background: 'linear-gradient(var(--background), var(--background)) padding-box, linear-gradient(90deg, #f59e0b, #8b5cf6, #3b82f6, #10b981, #f59e0b) border-box', backgroundSize: '200% 100%', animation: 'ctci-border-march 3s linear infinite' }}>
      {/* Flashing banner */}
      <div style={{ background: 'linear-gradient(90deg, #f59e0b22, #8b5cf622, #3b82f622, #10b98122, #f59e0b22)', animation: 'ctci-bg-pulse 1.5s ease-in-out infinite alternate' }} className="px-5 pt-4 pb-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span style={{ animation: 'ctci-bounce 0.8s ease-in-out infinite alternate' }} className="text-xl">🔥</span>
          <span style={{ animation: 'ctci-bounce 0.8s ease-in-out infinite alternate 0.1s' }} className="text-xl">📚</span>
          <span style={{ animation: 'ctci-bounce 0.8s ease-in-out infinite alternate 0.2s' }} className="text-xl">⚡</span>
          <span className="font-extrabold text-base" style={{ background: 'linear-gradient(90deg, #f59e0b, #8b5cf6, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'ctci-gradient-shift 2s linear infinite', backgroundSize: '200% 100%' }}>
            CRACK THE CODING INTERVIEW
          </span>
          <span style={{ animation: 'ctci-bounce 0.8s ease-in-out infinite alternate 0.3s' }} className="text-xl">🎯</span>
          <span style={{ animation: 'ctci-bounce 0.8s ease-in-out infinite alternate 0.4s' }} className="text-xl">💎</span>
          <span style={{ animation: 'ctci-bounce 0.8s ease-in-out infinite alternate 0.5s' }} className="text-xl">🚀</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <div className="text-xs font-bold" style={{ color: '#a78bfa' }}>— Dinesh Varyani · MUST DO ‼️</div>
          {ctciStreak.currentStreak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/40">
              <span className="text-base" style={{ animation: 'ctci-bounce 0.8s ease-in-out infinite alternate' }}>🔥</span>
              <span className="text-xs font-extrabold text-orange-400">{ctciStreak.currentStreak}</span>
              <span className="text-xs text-orange-300/80">day streak</span>
              {ctciStreak.longestStreak > ctciStreak.currentStreak && (
                <span className="text-xs text-muted-foreground ml-1">· best {ctciStreak.longestStreak}</span>
              )}
            </div>
          )}
          {ctciStreak.totalSolved > 0 && (
            <span className="text-xs text-muted-foreground">{ctciStreak.totalSolved} daily solved</span>
          )}
        </div>
      </div>

      {/* Keyframes injected inline */}
      <style>{`
        @keyframes ctci-border-march {
          0%   { background-position: 0% 0%, 0% 50%; }
          100% { background-position: 0% 0%, 200% 50%; }
        }
        @keyframes ctci-bg-pulse {
          from { opacity: 0.6; }
          to   { opacity: 1; }
        }
        @keyframes ctci-bounce {
          from { transform: translateY(0px) scale(1); }
          to   { transform: translateY(-4px) scale(1.15); }
        }
        @keyframes ctci-gradient-shift {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes ctci-flash {
          0%, 100% { box-shadow: 0 0 0 0 #f59e0b00; }
          50%       { box-shadow: 0 0 18px 4px #f59e0b66; }
        }
      `}</style>

      <div className="p-5 pt-3">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between group" style={{ animation: 'ctci-flash 2s ease-in-out infinite' }}>
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-purple-400" />
          <div className="text-left">
            <div className="text-sm font-bold text-foreground">500 curated LeetCode problems · Meta Frequency tags</div>
            <div className="text-xs text-muted-foreground">{solvedCount}/500 solved · Click to {open ? 'collapse' : 'expand'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold text-purple-400">{Math.round((solvedCount / 500) * 100)}%</div>
          {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="mt-4 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-lg bg-secondary text-center">
              <div className="text-base font-bold text-foreground">{solvedCount}</div>
              <div className="text-xs text-muted-foreground">Total Solved</div>
            </div>
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
              <div className="text-base font-bold text-red-400">{highFreqSolved}/{highFreqTotal}</div>
              <div className="text-xs text-muted-foreground">🔥 High Freq Solved</div>
            </div>
            <div className="p-2.5 rounded-lg bg-secondary text-center">
              <div className="text-base font-bold text-foreground">{500 - solvedCount}</div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Overall progress</span>
              <span>{Math.round((solvedCount / 500) * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${(solvedCount / 500) * 100}%` }} />
            </div>
          </div>

          {/* High-freq progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>🔥 High Meta Frequency ({highFreqTotal} problems)</span>
              <span>{Math.round((highFreqSolved / highFreqTotal) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${(highFreqSolved / highFreqTotal) * 100}%` }} />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-36">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search problems or topics…"
                className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-purple-500/50" />
            </div>
            <select value={freqFilter} onChange={e => handleFilterChange(setFreqFilter)(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none">
              <option value="All">All Freq</option>
              <option value="High">🔥 High (Meta)</option>
              <option value="Medium">⚡ Medium</option>
              <option value="Low">Low</option>
            </select>
            <select value={diffFilter} onChange={e => handleFilterChange(setDiffFilter)(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none">
              <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
            <select value={topicFilter} onChange={e => handleFilterChange(setTopicFilter)(e.target.value)}
              className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none max-w-36">
              <option>All</option>
              {CTCI_ALL_TOPICS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Results count */}
          <div className="text-xs text-muted-foreground">
            Showing {paginated.length} of {filtered.length} problems
            {filtered.length < 500 && <span className="ml-1">(filtered from 500)</span>}
          </div>

          {/* Daily Challenge Banner */}
          {dailyChallengeNum && (() => {
            const dc = CTCI_QUESTIONS.find(q => q.num === dailyChallengeNum);
            if (!dc) return null;
            return (
              <div className="rounded-xl p-3 border-2 border-amber-500/60" style={{ background: 'linear-gradient(135deg, #f59e0b18, #8b5cf618)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg" style={{ animation: 'ctci-bounce 0.8s ease-in-out infinite alternate' }}>🌟</span>
                  <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wide">Problem of the Day</span>
                  <span className="text-xs text-muted-foreground ml-auto">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono w-7">{dc.num}.</span>
                  <a href={dc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-amber-300 hover:underline flex-1">{dc.name}</a>
                  <span className={`badge ${ dc.difficulty === 'Easy' ? 'badge-green' : dc.difficulty === 'Hard' ? 'badge-red' : 'badge-amber' }`}>{dc.difficulty}</span>
                  <span className="badge badge-red text-xs">🔥 Meta</span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {dc.topics.map(t => <span key={t} className="badge badge-gray text-xs">{t}</span>)}
                </div>
              </div>
            );
          })()}

          {/* Question list */}
          <div className="space-y-1">
            {paginated.map(q => {
              const isDaily = q.num === dailyChallengeNum;
              const hasCode = !!editorCode[q.num];
              return (
              <div key={q.num} className="rounded-lg overflow-hidden">
                <div
                  className={`flex items-center gap-3 p-2.5 transition-all ${
                    isDaily ? 'bg-amber-500/15 border border-amber-500/40' :
                    solved[q.num] ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-secondary hover:bg-accent'
                  }`}>
                  <input type="checkbox" checked={!!solved[q.num]} onChange={() => toggle(q.num)}
                    className="w-3.5 h-3.5 accent-purple-500 shrink-0 cursor-pointer" />
                  <span className="text-xs text-muted-foreground w-7 shrink-0 font-mono">{q.num}.</span>
                  <a href={q.url} target="_blank" rel="noopener noreferrer"
                    className={`text-xs font-medium flex-1 hover:underline ${
                      solved[q.num] ? 'line-through text-muted-foreground' : isDaily ? 'text-amber-300 font-bold' : 'text-foreground'
                    }`}>{q.name}</a>
                  <div className="flex gap-1 flex-wrap justify-end items-center">
                    {isDaily && <span className="badge badge-amber text-xs">🌟 Today</span>}
                    {q.metaFreq === 'High' && <span className="badge badge-red text-xs">🔥 Meta</span>}
                    {q.metaFreq === 'Medium' && <span className="badge badge-amber text-xs">⚡ Meta</span>}
                    {q.topics.slice(0, 1).map(t => (
                      <span key={t} className="badge badge-gray text-xs hidden sm:inline">{t}</span>
                    ))}
                    <span className={`badge ${
                      q.difficulty === 'Easy' ? 'badge-green' : q.difficulty === 'Hard' ? 'badge-red' : 'badge-amber'
                    }`}>{q.difficulty}</span>
                    <button
                      onClick={() => setEditorOpen(editorOpen === q.num ? null : q.num)}
                      title="Open code editor"
                      className={`text-xs px-1.5 py-0.5 rounded border transition-all ${
                        hasCode ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' :
                        editorOpen === q.num ? 'border-blue-500/40 text-blue-400 bg-blue-500/10' :
                        'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      {hasCode ? '📝' : '➕'} Code
                    </button>
                    <button
                      onClick={() => setNotesOpen(notesOpen === q.num ? null : q.num)}
                      title="Open notes"
                      className={`text-xs px-1.5 py-0.5 rounded border transition-all ${
                        notes[q.num]?.trim() ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' :
                        notesOpen === q.num ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' :
                        'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      📌 Notes
                    </button>
                    {/* Difficulty Estimator button */}
                    <button
                      onClick={() => setDiffEstOpen(diffEstOpen === q.num ? null : q.num)}
                      title="Rate how hard this felt"
                      className={`text-xs px-1.5 py-0.5 rounded border transition-all ${
                        diffEstimates[q.num] ? 'border-pink-500/40 text-pink-400 bg-pink-500/10' :
                        diffEstOpen === q.num ? 'border-pink-500/40 text-pink-400 bg-pink-500/10' :
                        'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      🤔 Felt?
                    </button>
                  </div>
                </div>
                {/* Difficulty Estimator panel */}
                {diffEstOpen === q.num && (
                  <div className="border-t border-pink-500/20 bg-pink-500/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-pink-400">🤔 How hard did it feel?</span>
                      <span className="text-xs text-muted-foreground">Official: <span className={q.difficulty === 'Easy' ? 'text-emerald-400' : q.difficulty === 'Hard' ? 'text-red-400' : 'text-amber-400'}>{q.difficulty}</span></span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(['Easy', 'Medium', 'Hard', 'Very Hard'] as SelfDifficulty[]).map(level => {
                        const selected = diffEstimates[q.num]?.selfRating === level;
                        const diverges = selected && level !== q.difficulty && !(level === 'Very Hard' && q.difficulty === 'Hard');
                        return (
                          <button key={level}
                            onClick={() => {
                              setDiffEstimates(d => ({ ...d, [q.num]: { selfRating: level, timestamp: Date.now() } }));
                              toast.success(level === q.difficulty ? `✅ Matches official: ${level}` : `📊 Self: ${level} vs Official: ${q.difficulty}${diverges ? ' — worth extra practice!' : ''}`);
                            }}
                            className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-all ${
                              selected
                                ? level === 'Easy' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                  : level === 'Medium' ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                  : level === 'Hard' ? 'bg-red-500/20 border-red-400 text-red-300'
                                  : 'bg-rose-500/20 border-rose-400 text-rose-300'
                                : 'border-border text-muted-foreground hover:bg-accent'
                            }`}>
                            {level === 'Easy' ? '😌' : level === 'Medium' ? '😅' : level === 'Hard' ? '😰' : '💀'} {level}
                          </button>
                        );
                      })}
                    </div>
                    {diffEstimates[q.num] && (() => {
                      const self = diffEstimates[q.num].selfRating;
                      const official = q.difficulty;
                      const selfIdx = ['Easy','Medium','Hard','Very Hard'].indexOf(self);
                      const offIdx = ['Easy','Medium','Hard'].indexOf(official);
                      const gap = selfIdx - offIdx;
                      if (gap === 0) return <p className="text-xs text-emerald-400 mt-2">✅ Your perception matches the official difficulty — great calibration!</p>;
                      if (gap > 0) return <p className="text-xs text-orange-400 mt-2">⚠️ You found this harder than expected. Consider more practice on <strong>{q.topics.slice(0,2).join(' + ')}</strong>.</p>;
                      return <p className="text-xs text-blue-400 mt-2">💪 You found this easier than expected — strong signal on <strong>{q.topics.slice(0,2).join(' + ')}</strong>!</p>;
                    })()}
                  </div>
                )}
                {/* Notes panel */}
                {notesOpen === q.num && (
                  <div className="border-t border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-amber-400">📌 Notes — {q.name}</span>
                      <span className="text-xs text-muted-foreground">Complexity, approach, edge cases</span>
                    </div>
                    <textarea
                      value={notes[q.num] ?? ""}
                      onChange={e => saveNote(q.num, e.target.value)}
                      placeholder={`Time: O(?)  Space: O(?)

Approach:
- 

Edge cases:
- 

Key insight:
`}
                      spellCheck={false}
                      className="w-full font-mono text-xs text-foreground bg-background border border-amber-500/20 rounded-lg p-2.5 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed placeholder:text-muted-foreground/50"
                      rows={8}
                    />
                    <div className="text-xs text-muted-foreground mt-1">💾 Auto-saved · {notes[q.num]?.length ?? 0} chars</div>
                  </div>
                )}
                {/* Inline code editor */}
                {editorOpen === q.num && (
                  <div className="border-t border-border bg-[#1e1e1e] p-0">
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#252526] border-b border-[#3e3e42]">
                      <span className="text-xs text-[#9cdcfe] font-mono">{q.name}.js</span>
                      <div className="flex gap-2">
                        <span className="text-xs text-[#6a9955]">// Write your solution</span>
                        <button onClick={() => setEditorOpen(null)} className="text-[#858585] hover:text-white text-xs">× Close</button>
                      </div>
                    </div>
                    <textarea
                      value={editorCode[q.num] ?? `/**\n * ${q.name}\n * Difficulty: ${q.difficulty} | Topics: ${q.topics.join(', ')}\n */\n\nfunction solution() {\n  // Your code here\n  \n}\n`}
                      onChange={e => saveCode(q.num, e.target.value)}
                      spellCheck={false}
                      className="w-full font-mono text-xs text-[#d4d4d4] bg-[#1e1e1e] p-3 focus:outline-none resize-none leading-relaxed"
                      rows={12}
                      style={{ fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace", tabSize: 2 }}
                      onKeyDown={e => {
                        if (e.key === 'Tab') {
                          e.preventDefault();
                          const el = e.currentTarget;
                          const start = el.selectionStart;
                          const end = el.selectionEnd;
                          const val = el.value;
                          el.value = val.substring(0, start) + '  ' + val.substring(end);
                          el.selectionStart = el.selectionEnd = start + 2;
                          saveCode(q.num, el.value);
                        }
                      }}
                    />
                    <div className="flex items-center justify-between px-3 py-1 bg-[#007acc] text-white">
                      <span className="text-xs">💾 Auto-saved to localStorage</span>
                      <div className="flex items-center gap-2">
                        {hasCode && <span className="text-xs opacity-80">{editorCode[q.num]?.split('\n').length ?? 0} lines</span>}
                        <button
                          onClick={() => {
                            setHintOpen(hintOpen === q.num ? null : q.num);
                            if (hintOpen !== q.num && !hints[q.num]) {
                              hintMutation.mutate({
                                problemName: q.name,
                                problemNum: q.num,
                                difficulty: q.difficulty,
                                topics: q.topics,
                                currentCode: editorCode[q.num],
                              });
                            }
                          }}
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-white/20 hover:bg-white/30 transition-colors font-medium"
                        >
                          {hintMutation.isPending && hintOpen === q.num ? '⏳ Thinking…' : '💡 Get Hint'}
                        </button>
                      </div>
                    </div>
                    {hintOpen === q.num && (
                      <div className="px-3 py-2.5 bg-[#252526] border-t border-[#3e3e42]">
                        {hintMutation.isPending && !hints[q.num] ? (
                          <div className="flex items-center gap-2 text-xs text-[#9cdcfe]">
                            <span className="animate-spin">⏳</span> Getting hint from AI…
                          </div>
                        ) : hints[q.num] ? (
                          <div>
                            <div className="text-xs font-bold text-[#dcdcaa] mb-1">💡 Hint</div>
                            <div className="text-xs text-[#d4d4d4] leading-relaxed">{hints[q.num]}</div>
                            <button
                              onClick={() => {
                                setHints(h => ({ ...h, [q.num]: "" }));
                                hintMutation.mutate({
                                  problemName: q.name,
                                  problemNum: q.num,
                                  difficulty: q.difficulty,
                                  topics: q.topics,
                                  currentCode: editorCode[q.num],
                                });
                              }}
                              className="mt-2 text-xs text-[#858585] hover:text-[#cccccc] transition-colors"
                            >↺ New hint</button>
                          </div>
                        ) : (
                          <div className="text-xs text-[#858585]">Click "Get Hint" to ask the AI for a nudge.</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="p-6 text-center text-muted-foreground text-xs">No problems match your filters.</div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground disabled:opacity-40 hover:bg-accent transition-colors"
              >← Prev</button>
              <div className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {filtered.length} problems
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg bg-secondary text-xs text-foreground disabled:opacity-40 hover:bg-accent transition-colors"
              >Next →</button>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-muted-foreground">
              🔥 High = frequently reported in Meta coding rounds (community data) ·{" "}
              <a href="https://docs.google.com/spreadsheets/d/1pnI8HmSMPcfwrCCu7wYETCXaKDig4VucZDpcjVRuYrE/edit" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">Full Spreadsheet</a>
              {" · "}
              <a href="https://www.youtube.com/user/hubberspot" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">YouTube</a>
            </div>
            <button
              onClick={exportNotesMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-all"
            >
              <Download size={11} /> Export Notes (.md)
            </button>
          </div>
        </div>
      )}

      {/* Coding Mock Session */}
      <div id="coding-mock-session" className="mt-6">
        <CodingMockSession />
      </div>
      </div>
    </div>
  );
}
