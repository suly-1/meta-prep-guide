import { useState, useMemo } from "react";
import { Trophy, Plus, X, RefreshCw, Crown, Flame, Code2, Layers } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { usePatternRatings, useBehavioralRatings, useMockHistory, useStreak } from "@/hooks/useLocalStorage";
import { PATTERNS, BEHAVIORAL_QUESTIONS } from "@/lib/data";

const HANDLE_KEY = "meta_prep_leaderboard_handle";

function getBadges(patternsMastered: number, mockSessions: number, streakDays: number): string[] {
  const badges: string[] = [];
  if (patternsMastered >= 1) badges.push("First Blood");
  if (streakDays >= 7) badges.push("On Fire 🔥");
  if (patternsMastered >= 10) badges.push("Half-Way There");
  if (mockSessions >= 5) badges.push("Mock Veteran");
  if (patternsMastered >= 20) badges.push("IC7 Ready ⭐");
  return badges;
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Crown size={14} className="text-yellow-400" />;
  if (rank === 2) return <Crown size={14} className="text-slate-300" />;
  if (rank === 3) return <Crown size={14} className="text-amber-600" />;
  return <span className="text-xs text-muted-foreground font-mono w-3.5 text-center">{rank}</span>;
}

export default function Leaderboard() {
  const [expanded, setExpanded] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [handle, setHandle] = useState(() => localStorage.getItem(HANDLE_KEY) ?? "");
  const [inputHandle, setInputHandle] = useState("");
  const [joining, setJoining] = useState(false);

  const [patternRatings] = usePatternRatings();
  const [bqRatings] = useBehavioralRatings();
  const [mockHistory] = useMockHistory();
  const streakData = useStreak();
  const streak = streakData.currentStreak ?? 0;

  // Compute local stats
  const localStats = useMemo(() => {
    const patternsMastered = PATTERNS.filter(p => (patternRatings[p.id] ?? 0) >= 4).length;
    const storiesReady = BEHAVIORAL_QUESTIONS.filter(q => (bqRatings[q.id] ?? 0) >= 4).length;
    const mockSessions = mockHistory.length;
    const overallPct = Math.round(
      (patternsMastered / PATTERNS.length) * 0.6 * 100 +
      (storiesReady / BEHAVIORAL_QUESTIONS.length) * 0.4 * 100
    );
    const badges = getBadges(patternsMastered, mockSessions, streak);
    return { patternsMastered, mockSessions, overallPct, badges, streakDays: streak };
  }, [patternRatings, bqRatings, mockHistory, streak]);

  const { data: entries = [], refetch, isLoading } = trpc.leaderboard.getTop.useQuery(undefined, {
    enabled: expanded,
    staleTime: 30_000,
  });

  const upsert = trpc.leaderboard.upsert.useMutation({
    onSuccess: () => {
      refetch();
      toast.success(`You're on the leaderboard as @${handle}!`);
      setShowJoinModal(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const remove = trpc.leaderboard.remove.useMutation({
    onSuccess: () => {
      localStorage.removeItem(HANDLE_KEY);
      setHandle("");
      refetch();
      toast.success("Removed from leaderboard.");
    },
  });

  const handleJoin = async () => {
    const h = inputHandle.trim().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32);
    if (h.length < 2) { toast.error("Handle must be at least 2 characters."); return; }
    setJoining(true);
    localStorage.setItem(HANDLE_KEY, h);
    setHandle(h);
    await upsert.mutateAsync({ anonHandle: h, ...localStats });
    setJoining(false);
  };

  const handleUpdate = () => {
    if (!handle) return;
    upsert.mutate({ anonHandle: handle, ...localStats });
    toast.success("Leaderboard stats updated!");
  };

  const myRank = entries.findIndex(e => e.anonHandle === handle) + 1;

  return (
    <div className="prep-card p-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Trophy size={14} className="text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">Anonymous Leaderboard</span>
          {myRank > 0 && (
            <span className="badge badge-amber text-xs">You: #{myRank}</span>
          )}
        </button>
        <div className="flex items-center gap-2">
          {handle ? (
            <>
              <button
                onClick={handleUpdate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-all"
              >
                <RefreshCw size={11} /> Sync
              </button>
              <button
                onClick={() => remove.mutate({ anonHandle: handle })}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
              >
                <X size={11} /> Leave
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-all"
            >
              <Plus size={11} /> Add me
            </button>
          )}
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-muted-foreground hover:text-foreground text-xs px-1"
          >
            {expanded ? "▲" : "▼"}
          </button>
        </div>
      </div>

      {/* Expanded leaderboard table */}
      {expanded && (
        <div className="mt-4 space-y-1">
          {isLoading ? (
            <div className="text-xs text-muted-foreground text-center py-4">Loading leaderboard…</div>
          ) : entries.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-6">
              <p>No entries yet — be the first!</p>
              <p className="mt-1 text-muted-foreground/60">Click "Add me" to join the leaderboard anonymously.</p>
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div className="grid grid-cols-[1.5rem_1fr_auto_auto_auto] gap-x-3 px-2 py-1 text-xs text-muted-foreground/60 uppercase tracking-wide">
                <span>#</span>
                <span>Handle</span>
                <span className="flex items-center gap-1"><Code2 size={10} /> Patterns</span>
                <span className="flex items-center gap-1"><Flame size={10} /> Streak</span>
                <span className="flex items-center gap-1"><Layers size={10} /> Mocks</span>
              </div>

              {entries.map((entry, i) => {
                const isMe = entry.anonHandle === handle;
                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[1.5rem_1fr_auto_auto_auto] gap-x-3 items-center px-2 py-1.5 rounded-lg text-sm transition-colors
                      ${isMe ? "bg-blue-500/10 border border-blue-500/20" : "hover:bg-secondary/50"}`}
                  >
                    <div className="flex items-center justify-center">
                      {getRankIcon(i + 1)}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-medium truncate ${isMe ? "text-blue-400" : "text-foreground"}`}>
                        @{entry.anonHandle}
                      </span>
                      {isMe && <span className="badge badge-blue text-xs shrink-0">you</span>}
                      {(entry.badges as string[]).length > 0 && (
                        <span className="text-xs text-muted-foreground truncate hidden sm:block">
                          {(entry.badges as string[]).slice(0, 2).join(" · ")}
                        </span>
                      )}
                    </div>
                    <span className="text-emerald-400 font-semibold text-xs tabular-nums text-right">
                      {entry.patternsMastered}/20
                    </span>
                    <span className="text-orange-400 font-semibold text-xs tabular-nums text-right">
                      🔥{entry.streakDays}
                    </span>
                    <span className="text-purple-400 font-semibold text-xs tabular-nums text-right">
                      {entry.mockSessions}
                    </span>
                  </div>
                );
              })}

              <div className="text-xs text-muted-foreground/50 text-center pt-2">
                Top 20 · Sorted by patterns mastered · Anonymous handles only
              </div>
            </>
          )}
        </div>
      )}

      {/* Join modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                <span className="font-semibold text-foreground">Join the Leaderboard</span>
              </div>
              <button onClick={() => setShowJoinModal(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Pick an anonymous handle. Your real name is never shared. Stats are synced from your local progress.
            </p>

            {/* Current stats preview */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-secondary text-center">
              <div>
                <div className="text-emerald-400 font-bold text-lg">{localStats.patternsMastered}</div>
                <div className="text-xs text-muted-foreground">Patterns</div>
              </div>
              <div>
                <div className="text-orange-400 font-bold text-lg">🔥{localStats.streakDays}</div>
                <div className="text-xs text-muted-foreground">Streak</div>
              </div>
              <div>
                <div className="text-purple-400 font-bold text-lg">{localStats.mockSessions}</div>
                <div className="text-xs text-muted-foreground">Mocks</div>
              </div>
            </div>

            {localStats.badges.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {localStats.badges.map(b => (
                  <span key={b} className="badge badge-amber text-xs">{b}</span>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Anonymous handle (letters, numbers, _ -)</label>
              <input
                type="text"
                value={inputHandle}
                onChange={e => setInputHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 32))}
                placeholder="e.g. prep_ninja_42"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                onKeyDown={e => e.key === "Enter" && handleJoin()}
                maxLength={32}
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={joining || inputHandle.trim().length < 2}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? "Joining…" : "Join Leaderboard"}
            </button>

            <p className="text-xs text-muted-foreground/60 text-center">
              You can remove yourself at any time. No account required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
