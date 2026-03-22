// DeployStatusBadge — shows the live GitHub Actions deployment status
// in the footer. Polls every 30 seconds.
//
// Visual states:
//   ✅ green  — status=completed + conclusion=success
//   🟡 yellow — status=in_progress | queued | waiting | requested
//   ❌ red    — status=completed + conclusion=failure/cancelled
//   ⬜ grey   — unknown / API error

import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, XCircle, HelpCircle } from "lucide-react";

function getBadgeState(status: string, conclusion: string | null) {
  if (status === "completed") {
    if (conclusion === "success") return "success";
    if (conclusion === "failure" || conclusion === "timed_out")
      return "failure";
    if (conclusion === "cancelled" || conclusion === "skipped")
      return "cancelled";
    return "unknown";
  }
  if (
    status === "in_progress" ||
    status === "queued" ||
    status === "waiting" ||
    status === "requested"
  ) {
    return "in_progress";
  }
  return "unknown";
}

export default function DeployStatusBadge() {
  const { data, isLoading, isError } = trpc.deployStatus.latest.useQuery(
    undefined,
    {
      refetchInterval: 30_000, // poll every 30 s
      staleTime: 20_000,
    }
  );

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
        <Loader2 size={10} className="animate-spin" />
        Checking deploy…
      </span>
    );
  }

  if (isError || !data || data.status === "unknown") {
    return (
      <a
        href="https://github.com/suly-1/meta-prep-guide/actions"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        title="GitHub Actions — status unknown"
      >
        <HelpCircle size={10} />
        Deploy status unknown
      </a>
    );
  }

  const state = getBadgeState(data.status, data.conclusion);

  const config = {
    success: {
      icon: <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />,
      label: "Deployed",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      title: `Last deploy succeeded${data.commitSha ? ` · ${data.commitSha}` : ""}`,
    },
    in_progress: {
      icon: (
        <Loader2 size={11} className="animate-spin text-amber-400 shrink-0" />
      ),
      label: "Deploying…",
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      title: "Deployment in progress",
    },
    failure: {
      icon: <XCircle size={11} className="text-rose-400 shrink-0" />,
      label: "Deploy failed",
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      title: `Last deploy failed${data.commitSha ? ` · ${data.commitSha}` : ""}`,
    },
    cancelled: {
      icon: <XCircle size={11} className="text-zinc-500 shrink-0" />,
      label: "Deploy cancelled",
      color: "text-zinc-500",
      bg: "bg-zinc-500/10 border-zinc-500/20",
      title: "Last deploy was cancelled",
    },
    unknown: {
      icon: (
        <HelpCircle size={11} className="text-muted-foreground/40 shrink-0" />
      ),
      label: "Unknown",
      color: "text-muted-foreground/40",
      bg: "bg-muted/10 border-border/30",
      title: "Deploy status unknown",
    },
  } as const;

  const c = config[state as keyof typeof config] ?? config.unknown;

  return (
    <a
      href={data.runUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={c.title}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-opacity hover:opacity-80 ${c.bg} ${c.color}`}
    >
      {c.icon}
      {c.label}
      {data.commitSha && state === "success" && (
        <span className="text-[9px] opacity-60 font-mono">
          {data.commitSha}
        </span>
      )}
    </a>
  );
}
