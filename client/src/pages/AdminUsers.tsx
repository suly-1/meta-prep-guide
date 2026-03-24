/**
 * AdminUsers — owner-only user management panel
 * Shows all registered users with instant block/unblock toggle.
 */
import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  blocked: number;
  createdAt: Date;
  lastSignedIn: Date;
  disclaimerAcknowledgedAt: Date | null;
};

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  const isOwnerQuery = trpc.auth.isOwner.useQuery(undefined, {
    enabled: !!user,
  });

  const {
    data: users,
    isLoading,
    refetch,
  } = trpc.adminUsers.listUsers.useQuery(undefined, {
    enabled: isOwnerQuery.data?.isOwner === true,
  });

  const utils = trpc.useUtils();

  const blockUser = trpc.adminUsers.blockUser.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`User #${vars.userId} blocked`);
      utils.adminUsers.listUsers.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const unblockUser = trpc.adminUsers.unblockUser.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`User #${vars.userId} unblocked`);
      utils.adminUsers.listUsers.invalidate();
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

  const filtered = (users ?? []).filter((u: UserRow) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      String(u.id).includes(q)
    );
  });

  const blockedCount = (users ?? []).filter((u: UserRow) => u.blocked).length;
  const totalCount = (users ?? []).length;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
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
            a user to immediately revoke their access. They will see an "Access
            Revoked" screen and cannot use any feature until unblocked. You
            cannot block yourself.
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

        {/* Table */}
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

                  return (
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
                            onClick={() => unblockUser.mutate({ userId: u.id })}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <ShieldCheck size={12} />
                            {isPending ? "…" : "Unblock"}
                          </button>
                        ) : (
                          <button
                            onClick={() => blockUser.mutate({ userId: u.id })}
                            disabled={isPending}
                            className="inline-flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <ShieldOff size={12} />
                            {isPending ? "…" : "Block"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
