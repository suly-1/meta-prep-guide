/**
 * Score Sync Banner
 * Prompts logged-in users to sync their localStorage scores to the DB
 * for cross-device access and aggregate analytics.
 * Shows as a compact banner in the Overview tab.
 */
import { useState, useEffect } from "react";
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Check,
  X,
  Info,
  Smartphone,
  Monitor,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  usePatternRatings,
  useBehavioralRatings,
  useStarNotes,
  useInterviewDate,
} from "@/hooks/useLocalStorage";

export function ScoreSyncBanner() {
  const { user, isAuthenticated } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [synced, setSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const [patternRatings, setPatternRatings] = usePatternRatings();
  const [behavioralRatings, setBehavioralRatings] = useBehavioralRatings();
  const [starNotes, setStarNotes] = useStarNotes();
  const [interviewDate] = useInterviewDate();

  // Check if user has any scores to sync
  const hasScores =
    Object.keys(patternRatings).length > 0 ||
    Object.keys(behavioralRatings).length > 0;

  // Load scores from DB on mount (if authenticated)
  const { data: dbScores, isLoading: isLoadingDb } =
    trpc.userScores.load.useQuery(undefined, {
      enabled: isAuthenticated,
      staleTime: 5 * 60 * 1000,
    });

  // Merge DB scores into localStorage when loaded
  useEffect(() => {
    if (!dbScores) return;
    // Merge: DB wins for keys that exist in DB, localStorage wins for new keys
    if (dbScores.patternRatings) {
      setPatternRatings(prev => ({ ...prev, ...dbScores.patternRatings }));
    }
    if (dbScores.behavioralRatings) {
      setBehavioralRatings(prev => ({
        ...prev,
        ...dbScores.behavioralRatings,
      }));
    }
    if (dbScores.starNotes) {
      setStarNotes(prev => ({ ...prev, ...dbScores.starNotes }));
    }
    if (dbScores.updatedAt) {
      setLastSyncTime(new Date(dbScores.updatedAt));
      setSynced(true);
    }
  }, [dbScores]);

  // Save mutation
  const saveMutation = trpc.userScores.save.useMutation({
    onSuccess: data => {
      setSynced(true);
      setLastSyncTime(new Date());
      toast.success("Scores synced to cloud! Access from any device.");
    },
    onError: () => toast.error("Sync failed. Please try again."),
  });

  const handleSync = () => {
    saveMutation.mutate({
      patternRatings,
      behavioralRatings,
      starNotes,
      interviewDate: interviewDate ?? undefined,
    });
  };

  // Don't show if not authenticated or dismissed or no scores
  if (!isAuthenticated || dismissed) return null;
  if (!hasScores && !dbScores) return null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs transition-all ${
        synced
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-blue-500/5 border-blue-500/20"
      }`}
    >
      {/* Icon */}
      <div className="shrink-0">
        {isLoadingDb ? (
          <RefreshCw size={13} className="text-blue-400 animate-spin" />
        ) : synced ? (
          <Cloud size={13} className="text-emerald-400" />
        ) : (
          <CloudOff size={13} className="text-blue-400" />
        )}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        {synced ? (
          <span className="text-emerald-400 font-medium">
            Scores synced
            {lastSyncTime && (
              <span className="text-muted-foreground font-normal ml-1">
                · Last sync:{" "}
                {lastSyncTime.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </span>
        ) : (
          <span className="text-blue-400 font-medium">
            Sync your scores to the cloud
            <span className="text-muted-foreground font-normal ml-1">
              · Access from any device, track progress over time
            </span>
          </span>
        )}
      </div>

      {/* Device icons */}
      <div className="flex items-center gap-1 text-muted-foreground/40 shrink-0">
        <Monitor size={10} />
        <span className="text-[9px]">↔</span>
        <Smartphone size={10} />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {synced ? (
          <button
            onClick={handleSync}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all text-[10px] disabled:opacity-50"
          >
            <RefreshCw
              size={9}
              className={saveMutation.isPending ? "animate-spin" : ""}
            />
            Re-sync
          </button>
        ) : (
          <button
            onClick={handleSync}
            disabled={saveMutation.isPending}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-all text-[10px] disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <RefreshCw size={9} className="animate-spin" />
            ) : (
              <Cloud size={9} />
            )}
            {saveMutation.isPending ? "Syncing..." : "Sync Now"}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <X size={11} />
        </button>
      </div>
    </div>
  );
}
