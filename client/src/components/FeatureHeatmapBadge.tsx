/**
 * FeatureHeatmapBadge — shows "N users used this today" social proof badge.
 * Fetches today's feature click counts from the analytics router and renders
 * a small pill badge next to the feature title if the count is > 0.
 */
import { trpc } from "@/lib/trpc";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

// Singleton query hook — call once at page level and pass counts down
export function useFeatureClicksToday() {
  const { data } = trpc.analytics.featureClicksToday.useQuery(undefined, {
    staleTime: 60_000, // refresh every 60s
    refetchInterval: 60_000,
  });
  return data?.counts ?? {};
}

interface FeatureHeatmapBadgeProps {
  featureKey: string;
  counts: Record<string, number>;
  className?: string;
}

/**
 * Renders a small "N users today" pill if count > 0.
 * featureKey must match the event name used in useAnalytics.trackFeatureClick().
 */
export function FeatureHeatmapBadge({
  featureKey,
  counts,
  className,
}: FeatureHeatmapBadgeProps) {
  const count = counts[featureKey] ?? 0;
  if (count === 0) return null;

  // Colour intensity based on count
  const intensity =
    count >= 20
      ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
      : count >= 10
        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
        : count >= 5
          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
          : "bg-slate-500/20 text-slate-300 border-slate-500/30";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
        intensity,
        className
      )}
      title={`${count} candidate${count === 1 ? "" : "s"} used this today`}
    >
      <Users size={9} />
      {count} today
    </span>
  );
}
