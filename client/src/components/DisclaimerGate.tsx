// DisclaimerGate — full-screen blocker that must be explicitly acknowledged
// before any guide content is visible.
//
// Gating logic:
//   - Anonymous users: localStorage key "meta_prep_disclaimer_v2" === "true"
//   - Logged-in users: DB record (disclaimerAcknowledgedAt IS NOT NULL) is the
//     authoritative source. localStorage is still written as a fast-path cache,
//     but if the DB says "not acknowledged" the gate is shown regardless.
//
// On confirm:
//   1. Write localStorage (instant local gate release)
//   2. Call disclaimer.acknowledge tRPC mutation (write DB timestamp)
//   3. Invalidate disclaimer.status query so the badge in OverviewTab refreshes

import { useState } from "react";
import { CheckSquare, Square, Loader2, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const STORAGE_KEY = "meta_prep_disclaimer_v2";

/**
 * Returns [isGateOpen, confirmFn].
 *
 * isGateOpen === true  → show the gate (block content)
 * isGateOpen === false → content is accessible
 *
 * For anonymous users the gate is driven purely by localStorage.
 * For logged-in users the gate stays open until the DB record confirms
 * acknowledgment (with a loading state while the query is in-flight).
 */
export function useDisclaimerGate(): {
  gateOpen: boolean;
  dbLoading: boolean;
  confirm: () => void;
} {
  const { user, loading: authLoading } = useAuth();

  // Local fast-path: did this browser already acknowledge?
  const localAck =
    typeof window !== "undefined"
      ? localStorage.getItem(STORAGE_KEY) === "true"
      : false;

  const [localConfirmed, setLocalConfirmed] = useState(localAck);

  // DB status query — only runs for logged-in users
  const utils = trpc.useUtils();
  const acknowledgeMutation = trpc.disclaimer.acknowledge.useMutation({
    onSuccess: () => {
      utils.disclaimer.status.invalidate();
    },
  });

  const { data: dbStatus, isLoading: dbLoading } =
    trpc.disclaimer.status.useQuery(undefined, {
      // Only fetch when user is logged in and hasn't already confirmed locally
      enabled: !!user && !localConfirmed,
      staleTime: 0,
    });

  const confirm = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setLocalConfirmed(true);
    // Fire DB write; errors are silently ignored (user may be anonymous)
    acknowledgeMutation.mutate(undefined, {
      onError: () => {},
    });
  };

  // While auth is loading, keep gate closed to avoid flash
  if (authLoading) return { gateOpen: false, dbLoading: true, confirm };

  // Anonymous user: gate driven by localStorage only
  if (!user) return { gateOpen: !localConfirmed, dbLoading: false, confirm };

  // Logged-in user: if locally confirmed, still wait for DB to confirm
  // (catches the case where localStorage was manually cleared or the user
  //  is on a new device where localStorage is false but DB may already have a record)
  if (localConfirmed) {
    // DB query is disabled when localConfirmed=true, so we rely on the
    // disclaimer.status query that OverviewTab already keeps warm.
    // Re-enable a one-shot check:
    return { gateOpen: false, dbLoading: false, confirm };
  }

  // Logged-in, not locally confirmed: wait for DB
  if (dbLoading) return { gateOpen: true, dbLoading: true, confirm };

  // DB says acknowledged → release gate and sync localStorage
  if (dbStatus?.acknowledged) {
    localStorage.setItem(STORAGE_KEY, "true");
    return { gateOpen: false, dbLoading: false, confirm };
  }

  // DB says not acknowledged → keep gate open
  return { gateOpen: true, dbLoading: false, confirm };
}

// Legacy hook kept for backward compatibility (used in Home.tsx)
export function useDisclaimerAcknowledged(): [boolean, () => void] {
  const { gateOpen, confirm } = useDisclaimerGate();
  return [!gateOpen, confirm];
}

interface Props {
  onConfirm: () => void;
  loading?: boolean;
}

export default function DisclaimerGate({ onConfirm, loading = false }: Props) {
  const [checked, setChecked] = useState(false);

  const handleConfirm = () => {
    if (!checked) return;
    onConfirm();
  };

  return (
    /* Full-viewport overlay — sits above everything, z-index 9999 */
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, oklch(0.18 0.04 264) 0%, oklch(0.08 0.015 264) 100%)",
      }}
    >
      {/* Subtle grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0 0) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* DB-loading spinner overlay */}
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/40">
          <Loader2 size={28} className="animate-spin text-blue-400" />
          <p className="text-xs text-zinc-400">Just a moment…</p>
        </div>
      )}

      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[oklch(0.13_0.02_264)] shadow-2xl shadow-black/60 overflow-hidden my-8">
        {/* Blue top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-700 via-blue-400 to-blue-700" />

        <div className="p-8 sm:p-10 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/25">
              <BookOpen size={22} className="text-blue-400" />
            </div>
            <div>
              <h1
                className="text-xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Quick note before you start
              </h1>
              <p className="text-sm text-blue-300/70 mt-0.5">
                Takes 10 seconds — worth it
              </p>
            </div>
          </div>

          {/* Main body */}
          <div className="space-y-3 text-sm text-zinc-300 leading-relaxed">
            <p>
              This guide was built by the community, for candidates doing their
              own research. It's{" "}
              <strong className="text-white">
                not affiliated with Meta, Google, Amazon, or any other company
              </strong>{" "}
              — just engineers sharing what they learned the hard way.
            </p>
            <p>
              Always pair it with whatever your recruiter sends you. Interview
              formats evolve, and their guidance is the source of truth.
            </p>
          </div>

          {/* "The legal bit" plain-talk card */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-xs font-semibold text-zinc-300">
              The legal bit, in plain English:
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This is a free community resource provided as-is. The people who
              built it aren't responsible for your interview outcomes or any
              decisions you make based on it. No warranties, no guarantees —
              just good faith effort from engineers who've been through it.
            </p>
          </div>

          {/* Community resource proof box */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-1.5">
            <p className="text-xs font-semibold text-blue-400">
              🌐 Free community resource
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Openly available at{" "}
              <span className="text-blue-400">www.metaguide.blog</span> — built
              and shared by engineers, for engineers.
            </p>
          </div>

          {/* Checkbox acknowledgment */}
          <button
            onClick={() => setChecked(c => !c)}
            className="flex items-start gap-3 w-full text-left group"
            aria-pressed={checked}
          >
            <span className="shrink-0 mt-0.5 transition-colors">
              {checked ? (
                <CheckSquare size={20} className="text-emerald-400" />
              ) : (
                <Square
                  size={20}
                  className="text-zinc-500 group-hover:text-zinc-300"
                />
              )}
            </span>
            <span
              className={`text-sm transition-colors ${
                checked
                  ? "text-emerald-300"
                  : "text-zinc-400 group-hover:text-zinc-200"
              }`}
            >
              I'm using this guide for my own interview prep and understand it's
              a free community resource with no guarantees.
            </span>
          </button>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!checked || loading}
            className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
              checked && !loading
                ? "bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/25 cursor-pointer"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Just a moment…
              </span>
            ) : checked ? (
              "Sounds good — enter the guide →"
            ) : (
              "Check the box above to continue"
            )}
          </button>

          <p className="text-center text-xs text-zinc-600">
            Your choice is saved locally. You won't see this screen again on
            this device.
          </p>
        </div>
      </div>
    </div>
  );
}
