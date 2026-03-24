/**
 * AdminUsers — owner-only user management panel
 *
 * Features:
 * - User table with block/unblock toggle + optional reason + auto-expiry
 * - Login activity (last 5 logins per user, expandable)
 * - Expandable audit log with Re-block shortcut on unblock events
 * - Export Audit Log as CSV download
 */
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  ShieldOff,
  ShieldCheck,
  Users,
  ArrowLeft,
  Search,
  Crown,
  UserX,
  UserCheck,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Download,
  Clock,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  blocked: number;
  blockReason: string | null;
  blockedUntil: Date | null;
  createdAt: Date;
  lastSignedIn: Date;
};

type AuditRow = {
  id: number;
  actorId: number;
  actorName: string | null;
  targetId: number;
  targetName: string | null;
  eventType: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Block Dialog ───────────────────────────────────────────────────────────

function BlockDialog({
  userName,
  onConfirm,
  onCancel,
}: {
  userName: string;
  onConfirm: (reason: string, expiryDays: number) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");
  const [expiryDays, setExpiryDays] = useState(0);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldOff size={16} className="text-red-400" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Block {userName}?
          </h2>
        </div>
        <p className="text-xs text-zinc-400">
          This user will immediately lose access. Optionally set an auto-unblock
          date so you don't have to remember to lift it manually.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">
              Reason (optional, max 500 chars)
            </label>
            <textarea
              autoFocus
              placeholder="e.g. Violated terms of use…"
              maxLength={500}
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500/50 resize-none"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">
              Auto-unblock after (days) — 0 = permanent
            </label>
            <input
              type="number"
              min={0}
              max={365}
              value={expiryDays}
              onChange={e =>
                setExpiryDays(Math.max(0, parseInt(e.target.value) || 0))
              }
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-red-500/50"
            />
            {expiryDays > 0 && (
              <p className="text-[10px] text-zinc-500 mt-1">
                Auto-unblocks on{" "}
                {new Date(
                  Date.now() + expiryDays * 86_400_000
                ).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim(), expiryDays)}
            className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg transition-colors font-medium"
          >
            Confirm Block
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [pendingBlockId, setPendingBlockId] = useState<number | null>(null);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [expandedLoginUserId, setExpandedLoginUserId] = useState<number | null>(
    null
  );

  const isOwnerQuery = trpc.auth.isOwner.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: usersData, isLoading } = trpc.adminUsers.listUsers.useQuery(
    undefined,
    {
      enabled: isOwnerQuery.data?.isOwner === true,
    }
  );

  const { data: auditEvents, refetch: refetchAudit } =
    trpc.adminUsers.listEvents.useQuery(undefined, {
      enabled: isOwnerQuery.data?.isOwner === true && showAuditLog,
    });

  // Fetch login history for all user IDs once we have the user list
  const allUserIds = useMemo(
    () => (usersData ?? []).map((u: UserRow) => u.id),
    [usersData]
  );
  const { data: loginHistory } = trpc.adminUsers.getUserLoginHistory.useQuery(
    { userIds: allUserIds },
    { enabled: allUserIds.length > 0 && isOwnerQuery.data?.isOwner === true }
  );

  const { data: csvData, refetch: fetchCsv } =
    trpc.adminUsers.exportAuditLogCsv.useQuery(undefined, {
      enabled: false, // only fetch on demand
    });

  const utils = trpc.useUtils();

  const blockUser = trpc.adminUsers.blockUser.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`User #${vars.userId} blocked`);
      utils.adminUsers.listUsers.invalidate();
      utils.adminUsers.listEvents.invalidate();
      setPendingBlockId(null);
    },
    onError: err => {
      toast.error(err.message);
      setPendingBlockId(null);
    },
  });

  const unblockUser = trpc.adminUsers.unblockUser.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`User #${vars.userId} unblocked`);
      utils.adminUsers.listUsers.invalidate();
      utils.adminUsers.listEvents.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const reBlockUser = trpc.adminUsers.reBlockUser.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`User #${vars.userId} re-blocked`);
      utils.adminUsers.listUsers.invalidate();
      utils.adminUsers.listEvents.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  // Auth loading
  if (authLoading || isOwnerQuery.isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  // Not owner
  if (!isOwnerQuery.data?.isOwner) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <ShieldOff size={40} className="text-red-400 mx-auto" />
          <p className="text-zinc-400 text-sm">
            Owner access required to view this page.
          </p>
          <button
            onClick={() => navigate("/")}
            className="text-blue-400 text-sm hover:underline"
          >
            Return home
          </button>
        </div>
      </div>
    );
  }

  const filtered = (usersData ?? []).filter((u: UserRow) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      String(u.id).includes(q)
    );
  });

  const blockedCount = (usersData ?? []).filter(
    (u: UserRow) => u.blocked
  ).length;
  const totalCount = (usersData ?? []).length;

  const pendingUser = pendingBlockId
    ? (usersData ?? []).find((u: UserRow) => u.id === pendingBlockId)
    : null;

  const handleExportCsv = async () => {
    const result = await fetchCsv();
    const csv = result.data?.csv ?? "";
    if (!csv) {
      toast.error("No audit log data to export.");
      return;
    }
    downloadCsv(csv, `audit-log-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success("Audit log exported.");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Block dialog */}
      {pendingUser && (
        <BlockDialog
          userName={pendingUser.name ?? `User #${pendingUser.id}`}
          onConfirm={(reason, expiryDays) => {
            blockUser.mutate({
              userId: pendingUser.id,
              reason: reason || undefined,
              expiryDays: expiryDays > 0 ? expiryDays : undefined,
            });
          }}
          onCancel={() => setPendingBlockId(null)}
        />
      )}

      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            <h1 className="text-sm font-semibold text-zinc-100">
              User Management
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-3 text-xs text-zinc-500">
            <span>{totalCount} users</span>
            {blockedCount > 0 && (
              <span className="text-red-400 font-medium">
                {blockedCount} blocked
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {/* Info banner */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 text-xs text-amber-300/80 flex items-start gap-2">
          <Crown size={14} className="shrink-0 mt-0.5 text-amber-400" />
          <span>
            <strong className="text-amber-400">Owner-only panel.</strong> Block
            a user to immediately revoke their access. Optionally set an
            auto-unblock date. All actions are logged and a Manus inbox
            notification is sent.
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Search by name, email, or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
          />
        </div>

        {/* User Table */}
        {isLoading ? (
          <div className="text-center py-12 text-zinc-600 text-sm animate-pulse">
            Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-sm">
            No users found.
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    User
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden md:table-cell">
                    Role
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                    Joined
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide hidden lg:table-cell">
                    Last Seen
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wide">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filtered.map((u: UserRow) => {
                  const isCurrentUser = u.id === user?.id;
                  const isBlocked = u.blocked === 1;
                  const isPending =
                    (blockUser.isPending &&
                      blockUser.variables?.userId === u.id) ||
                    (unblockUser.isPending &&
                      unblockUser.variables?.userId === u.id);
                  const logins: Date[] = loginHistory?.[u.id] ?? [];
                  const isLoginExpanded = expandedLoginUserId === u.id;

                  return (
                    <>
                      <tr
                        key={u.id}
                        className={`transition-colors ${
                          isBlocked ? "bg-red-500/5" : "hover:bg-zinc-900/50"
                        }`}
                      >
                        {/* User info */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isBlocked
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {(u.name ?? u.email ?? "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-zinc-200 text-sm">
                                  {u.name ?? "Unknown"}
                                </span>
                                {isCurrentUser && (
                                  <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-medium">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {u.email ?? `ID #${u.id}`}
                              </div>
                              {isBlocked && u.blockReason && (
                                <div className="text-[10px] text-red-400/70 mt-0.5 max-w-[200px] truncate">
                                  Reason: {u.blockReason}
                                </div>
                              )}
                              {isBlocked && u.blockedUntil && (
                                <div className="text-[10px] text-amber-400/70 mt-0.5">
                                  Auto-unblocks: {formatDate(u.blockedUntil)}
                                </div>
                              )}
                              {/* Login history toggle */}
                              {logins.length > 0 && (
                                <button
                                  onClick={() =>
                                    setExpandedLoginUserId(
                                      isLoginExpanded ? null : u.id
                                    )
                                  }
                                  className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 mt-0.5 transition-colors"
                                >
                                  <Clock size={9} />
                                  {logins.length} login
                                  {logins.length !== 1 ? "s" : ""}
                                  {isLoginExpanded ? (
                                    <ChevronUp size={9} />
                                  ) : (
                                    <ChevronDown size={9} />
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              u.role === "admin"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-zinc-800 text-zinc-400"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        {/* Joined */}
                        <td className="px-4 py-3 text-xs text-zinc-500 hidden lg:table-cell">
                          {formatDate(u.createdAt)}
                        </td>

                        {/* Last seen */}
                        <td className="px-4 py-3 text-xs text-zinc-500 hidden lg:table-cell">
                          {formatDate(u.lastSignedIn)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {isBlocked ? (
                            <span className="flex items-center gap-1.5 text-xs text-red-400">
                              <UserX size={12} />
                              Blocked
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                              <UserCheck size={12} />
                              Active
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3 text-right">
                          {isCurrentUser ? (
                            <span className="text-xs text-zinc-600 italic">
                              —
                            </span>
                          ) : isBlocked ? (
                            <button
                              onClick={() =>
                                unblockUser.mutate({ userId: u.id })
                              }
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <ShieldCheck size={12} />
                              {isPending ? "…" : "Unblock"}
                            </button>
                          ) : (
                            <button
                              onClick={() => setPendingBlockId(u.id)}
                              disabled={isPending}
                              className="inline-flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <ShieldOff size={12} />
                              {isPending ? "…" : "Block"}
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Login history expansion row */}
                      {isLoginExpanded && logins.length > 0 && (
                        <tr key={`${u.id}-logins`} className="bg-zinc-900/60">
                          <td colSpan={6} className="px-4 py-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Clock
                                size={11}
                                className="text-zinc-500 shrink-0"
                              />
                              <span className="text-[10px] text-zinc-500 font-medium mr-1">
                                Last {logins.length} login
                                {logins.length !== 1 ? "s:" : ":"}
                              </span>
                              {logins.map((d, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded"
                                >
                                  {formatDateTime(d)}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Log */}
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900">
            <button
              onClick={() => setShowAuditLog(v => !v)}
              className="flex items-center gap-2 text-sm text-zinc-300 font-medium hover:text-zinc-100 transition-colors"
            >
              <ClipboardList size={15} className="text-violet-400" />
              Admin Audit Log
              {auditEvents && auditEvents.length > 0 && (
                <span className="text-xs bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">
                  {auditEvents.length}
                </span>
              )}
              {showAuditLog ? (
                <ChevronUp size={14} className="text-zinc-500" />
              ) : (
                <ChevronDown size={14} className="text-zinc-500" />
              )}
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-500 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Download size={12} />
              Export CSV
            </button>
          </div>

          {showAuditLog && (
            <div className="divide-y divide-zinc-800/50">
              {!auditEvents || auditEvents.length === 0 ? (
                <div className="px-4 py-8 text-center text-xs text-zinc-600">
                  No events recorded yet.
                </div>
              ) : (
                (auditEvents as AuditRow[]).map(ev => {
                  const isBlock = ev.eventType === "block";
                  const isUnblock = ev.eventType === "unblock";
                  const reason =
                    ev.metadata &&
                    typeof ev.metadata === "object" &&
                    "reason" in ev.metadata
                      ? String(ev.metadata.reason)
                      : null;
                  const autoExpiry =
                    ev.metadata &&
                    typeof ev.metadata === "object" &&
                    "blockedUntil" in ev.metadata
                      ? String(ev.metadata.blockedUntil)
                      : null;

                  return (
                    <div
                      key={ev.id}
                      className="px-4 py-3 flex items-start gap-3 hover:bg-zinc-900/40 transition-colors"
                    >
                      <div
                        className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isBlock
                            ? "bg-red-500/20 text-red-400"
                            : "bg-emerald-500/20 text-emerald-400"
                        }`}
                      >
                        {isBlock ? (
                          <UserX size={11} />
                        ) : (
                          <UserCheck size={11} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-zinc-300">
                          <span className="font-medium text-zinc-100">
                            {ev.actorName ?? `Actor #${ev.actorId}`}
                          </span>{" "}
                          <span
                            className={
                              isBlock ? "text-red-400" : "text-emerald-400"
                            }
                          >
                            {isBlock ? "blocked" : "unblocked"}
                          </span>{" "}
                          <span className="font-medium text-zinc-100">
                            {ev.targetName ?? `User #${ev.targetId}`}
                          </span>
                        </div>
                        {reason && (
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            Reason: {reason}
                          </div>
                        )}
                        {autoExpiry && (
                          <div className="text-[10px] text-amber-400/70 mt-0.5">
                            Auto-unblock:{" "}
                            {new Date(autoExpiry).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Re-block shortcut on unblock events */}
                        {isUnblock && (
                          <button
                            onClick={() =>
                              reBlockUser.mutate({ userId: ev.targetId })
                            }
                            disabled={reBlockUser.isPending}
                            title="Re-block this user"
                            className="flex items-center gap-1 text-[10px] text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          >
                            <RotateCcw size={9} />
                            Re-block
                          </button>
                        )}
                        <div className="text-[10px] text-zinc-600 whitespace-nowrap">
                          {formatDateTime(ev.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
