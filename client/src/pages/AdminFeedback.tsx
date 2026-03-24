/**
 * Admin Feedback Dashboard — /admin/feedback
 * Owner-only page. Shows all submitted feedback entries in a sortable,
 * filterable table. Gated by ctx.user.role === 'admin' on the server.
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import {
  ArrowLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Bug,
  Star,
  ThumbsUp,
  MessageSquarePlus,
  Lightbulb,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  Clock,
  TrendingUp,
  Mail,
  Users,
  Shield,
  LineChart,
} from "lucide-react";
import { toast } from "sonner";
import { route } from "@/const";

type SortKey = "createdAt" | "category" | "feedbackType";
type SortDir = "asc" | "desc";
type TriageStatus = "new" | "in_progress" | "done" | "dismissed";

const STATUS_META: Record<
  TriageStatus,
  { label: string; color: string; bg: string }
> = {
  new: {
    label: "New",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  in_progress: {
    label: "In Progress",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  done: {
    label: "Done",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  dismissed: {
    label: "Dismissed",
    color: "text-slate-400",
    bg: "bg-slate-500/10 border-slate-500/20",
  },
};

function StatusBadge({
  status,
  id,
  onUpdate,
}: {
  status: TriageStatus;
  id: number;
  onUpdate: (id: number, status: TriageStatus) => void;
}) {
  const m = STATUS_META[status] ?? STATUS_META["new"];
  return (
    <select
      value={status}
      onChange={e => onUpdate(id, e.target.value as TriageStatus)}
      onClick={e => e.stopPropagation()}
      className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold cursor-pointer ${m.bg} ${m.color} focus:outline-none`}
    >
      {(Object.keys(STATUS_META) as TriageStatus[]).map(s => (
        <option key={s} value={s} className="bg-background text-foreground">
          {STATUS_META[s].label}
        </option>
      ))}
    </select>
  );
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  bug: {
    label: "Bug",
    icon: <Bug size={11} />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  feature_request: {
    label: "Feature",
    icon: <Star size={11} />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  content: {
    label: "Content",
    icon: <ThumbsUp size={11} />,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  ux: {
    label: "UX",
    icon: <MessageSquarePlus size={11} />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  other: {
    label: "Other",
    icon: <Lightbulb size={11} />,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
};

function CategoryBadge({ cat }: { cat: string }) {
  const m = CATEGORY_META[cat] ?? CATEGORY_META["other"];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${m.bg} ${m.color}`}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
        type === "sprint_plan"
          ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
          : "bg-slate-500/10 border-slate-500/20 text-slate-400"
      }`}
    >
      {type === "sprint_plan" ? "Sprint" : "General"}
    </span>
  );
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminFeedback() {
  const { user, loading } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [catFilter, setCatFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<Record<number, string>>({});

  const isAdmin = user?.role === "admin";

  const updateNote = trpc.feedback.updateNote.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Note saved.");
    },
    onError: () => toast.error("Failed to save note."),
  });

  const updateStatus = trpc.feedback.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Status updated.");
    },
    onError: () => toast.error("Failed to update status."),
  });

  const handleStatusUpdate = (id: number, status: TriageStatus) => {
    updateStatus.mutate({ id, status });
  };

  const triggerDailyAlert = trpc.feedback.triggerDailyAlert.useMutation({
    onSuccess: () =>
      toast.success(
        "Daily alert check triggered! Check your email if threshold was met."
      ),
    onError: () => toast.error("Failed to trigger daily alert."),
  });

  const triggerDigest = trpc.feedback.triggerDigest.useMutation({
    onSuccess: () => toast.success("Digest sent! Check your notifications."),
    onError: () => toast.error("Failed to send digest."),
  });

  const markAllNew = trpc.feedback.markAllNew.useMutation({
    onSuccess: data => {
      refetch();
      toast.success(
        data.updated > 0
          ? `Marked ${data.updated} item${data.updated === 1 ? "" : "s"} as In Progress.`
          : "No new items to mark."
      );
    },
    onError: () => toast.error("Failed to mark items."),
  });

  const { data, isLoading, refetch, error } =
    trpc.feedback.adminGetAll.useQuery(
      {
        limit: 200,
        category: "all",
        feedbackType: "all",
        sortBy: "createdAt",
        sortDir: "desc",
      },
      { enabled: isAdmin }
    );

  const { data: stats } = trpc.feedback.adminStats.useQuery(undefined, {
    enabled: isAdmin,
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === "asc" ? (
        <ArrowUp size={11} />
      ) : (
        <ArrowDown size={11} />
      )
    ) : (
      <ArrowUpDown size={11} className="opacity-30" />
    );

  const filtered = useMemo(() => {
    let rows = data?.items ?? [];
    if (catFilter !== "all") rows = rows.filter(r => r.category === catFilter);
    if (typeFilter !== "all")
      rows = rows.filter(r => r.feedbackType === typeFilter);
    if (statusFilter !== "all")
      rows = rows.filter(r => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        r =>
          r.message.toLowerCase().includes(q) ||
          (r.page ?? "").toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let va: string | number = a[sortKey] as string;
      let vb: string | number = b[sortKey] as string;
      if (sortKey === "createdAt") {
        va = new Date(a.createdAt).getTime();
        vb = new Date(b.createdAt).getTime();
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, catFilter, typeFilter, search, sortKey, sortDir]);

  const exportCSV = () => {
    const rows = [
      ["ID", "Type", "Category", "Message", "Page", "Created"],
      ...filtered.map(r => [
        r.id,
        r.feedbackType,
        r.category,
        `"${r.message.replace(/"/g, '""')}"`,
        r.page ?? "",
        formatDate(r.createdAt),
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `feedback-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auth guard
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground text-sm mb-3">
            Please log in to access this page.
          </p>
          <Link
            href={route("/")}
            className="text-blue-400 text-sm hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-foreground font-bold mb-1">Access Denied</p>
          <p className="text-muted-foreground text-sm mb-3">
            This page is restricted to admins only.
          </p>
          <Link
            href={route("/")}
            className="text-blue-400 text-sm hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={route("/")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1
                className="text-sm font-bold"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Feedback Dashboard
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Admin view · All submitted feedback
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={route("/admin/stats")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
            >
              <BarChart3 size={11} /> Stats
            </Link>
            <Link
              href={route("/admin/analytics")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
            >
              <LineChart size={11} /> Analytics
            </Link>
            <Link
              href={route("/admin/access")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
            >
              <Shield size={11} /> Access
            </Link>
            <Link
              href={route("/admin/users")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
            >
              <Users size={11} /> Users
            </Link>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
            >
              <RefreshCw size={11} /> Refresh
            </button>
            <button
              onClick={() => exportCSV()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-all"
            >
              <Download size={11} /> Export CSV
            </button>
            <button
              onClick={() => triggerDailyAlert.mutate()}
              disabled={triggerDailyAlert.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-50"
            >
              <Clock size={11} />{" "}
              {triggerDailyAlert.isPending ? "Checking…" : "Test Alert"}
            </button>
            <button
              onClick={() => triggerDigest.mutate()}
              disabled={triggerDigest.isPending}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 text-xs text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50"
            >
              <Mail size={11} />{" "}
              {triggerDigest.isPending ? "Sending…" : "Send Digest"}
            </button>
            {/* Bulk triage: mark all new items as in-progress */}
            {(stats?.last7Days ?? 0) > 0 && (
              <button
                onClick={() => markAllNew.mutate()}
                disabled={markAllNew.isPending}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/10 text-xs text-violet-400 hover:bg-violet-500/20 transition-all disabled:opacity-50 font-medium"
                title="Batch-update all 'New' items to 'In Progress'"
              >
                <TrendingUp size={11} />{" "}
                {markAllNew.isPending ? "Marking…" : "Mark All New"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="prep-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 size={13} className="text-blue-400" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Total
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="prep-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={13} className="text-emerald-400" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Last 7 Days
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-400">
                {stats.last7Days}
              </p>
            </div>
            <div className="prep-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <Star size={13} className="text-amber-400" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Top Category
                </span>
              </div>
              <p className="text-sm font-bold text-foreground capitalize">
                {stats.byCategory
                  .sort((a, b) => b.count - a.count)[0]
                  ?.category?.replace("_", " ") ?? "—"}
              </p>
            </div>
            <div className="prep-card p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={13} className="text-purple-400" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Showing
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {filtered.length}
              </p>
            </div>
          </div>
        )}

        {/* Category breakdown mini-chart */}
        {stats && stats.byCategory.length > 0 && (
          <div className="prep-card p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              By Category
            </p>
            <div className="space-y-2">
              {stats.byCategory
                .sort((a, b) => b.count - a.count)
                .map(({ category, count }) => {
                  const pct =
                    stats.total > 0
                      ? Math.round((count / stats.total) * 100)
                      : 0;
                  const m = CATEGORY_META[category] ?? CATEGORY_META["other"];
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <span
                        className={`w-16 text-[10px] font-medium ${m.color}`}
                      >
                        {m.label}
                      </span>
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            category === "bug"
                              ? "bg-red-500"
                              : category === "feature_request"
                                ? "bg-blue-500"
                                : category === "content"
                                  ? "bg-purple-500"
                                  : category === "ux"
                                    ? "bg-emerald-500"
                                    : "bg-amber-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground w-12 text-right">
                        {count} ({pct}%)
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={12} className="text-muted-foreground" />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary text-xs text-foreground focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Categories</option>
            <option value="bug">Bug</option>
            <option value="feature_request">Feature Request</option>
            <option value="content">Content</option>
            <option value="ux">UX</option>
            <option value="other">Other</option>
          </select>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary text-xs text-foreground focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Types</option>
            <option value="general">General</option>
            <option value="sprint_plan">Sprint Plan</option>
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-secondary text-xs text-foreground focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages…"
            className="flex-1 min-w-40 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Table */}
        <div className="prep-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw
                size={18}
                className="animate-spin text-muted-foreground"
              />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-400 text-sm">
              Failed to load feedback. Make sure you are logged in as admin.
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No feedback entries yet. They will appear here once users submit
              feedback.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-3 py-2.5 text-left text-muted-foreground font-medium w-8">
                      #
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort("feedbackType")}
                    >
                      <span className="flex items-center gap-1">
                        Type <SortIcon k="feedbackType" />
                      </span>
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort("category")}
                    >
                      <span className="flex items-center gap-1">
                        Category <SortIcon k="category" />
                      </span>
                    </th>
                    <th className="px-3 py-2.5 text-left text-muted-foreground font-medium">
                      Message
                    </th>
                    <th className="px-3 py-2.5 text-left text-muted-foreground font-medium">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-left text-muted-foreground font-medium">
                      Page
                    </th>
                    <th
                      className="px-3 py-2.5 text-left text-muted-foreground font-medium cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort("createdAt")}
                    >
                      <span className="flex items-center gap-1">
                        Date <SortIcon k="createdAt" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, idx) => (
                    <>
                      <tr
                        key={row.id}
                        onClick={() =>
                          setExpanded(expanded === row.id ? null : row.id)
                        }
                        className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                      >
                        <td className="px-3 py-2.5 text-muted-foreground/50">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2.5">
                          <TypeBadge type={row.feedbackType} />
                        </td>
                        <td className="px-3 py-2.5">
                          <CategoryBadge cat={row.category} />
                        </td>
                        <td className="px-3 py-2.5 max-w-xs">
                          <p className="truncate text-foreground/80">
                            {row.message}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge
                            status={(row.status ?? "new") as TriageStatus}
                            id={row.id}
                            onUpdate={handleStatusUpdate}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {row.page ?? "—"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                          {formatDate(row.createdAt)}
                        </td>
                      </tr>
                      {expanded === row.id && (
                        <tr
                          key={`${row.id}-expanded`}
                          className="bg-secondary/20"
                        >
                          <td colSpan={7} className="px-4 py-3">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Full Message
                              </p>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                {row.message}
                              </p>
                              {row.metadata &&
                                Object.keys(row.metadata).length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                      Metadata
                                    </p>
                                    <pre className="text-[10px] text-muted-foreground bg-secondary rounded p-2 overflow-x-auto">
                                      {JSON.stringify(row.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              {/* Admin Note */}
                              <div className="mt-3">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Admin Note
                                </p>
                                <textarea
                                  rows={2}
                                  placeholder="e.g. Fixed in v2.3, or Backlogged for Q2…"
                                  value={
                                    noteText[row.id] ?? row.adminNote ?? ""
                                  }
                                  onChange={e =>
                                    setNoteText(prev => ({
                                      ...prev,
                                      [row.id]: e.target.value,
                                    }))
                                  }
                                  onClick={e => e.stopPropagation()}
                                  className="w-full px-3 py-2 rounded-lg border border-border bg-secondary text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 resize-none"
                                />
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    updateNote.mutate({
                                      id: row.id,
                                      adminNote:
                                        noteText[row.id] ?? row.adminNote ?? "",
                                    });
                                  }}
                                  disabled={updateNote.isPending}
                                  className="mt-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold transition-colors disabled:opacity-50"
                                >
                                  {updateNote.isPending
                                    ? "Saving…"
                                    : "Save Note"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground">
          Showing {filtered.length} of {data?.total ?? 0} entries · Click any
          row to expand full message
        </p>
      </div>
    </div>
  );
}
