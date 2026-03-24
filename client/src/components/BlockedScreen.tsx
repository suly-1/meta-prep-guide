/**
 * BlockedScreen — shown to users whose access has been revoked by the owner.
 * Replaces the entire app content with a clear, non-dismissible message.
 */
import { ShieldOff } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function BlockedScreen() {
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <ShieldOff size={36} className="text-red-400" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Access Revoked</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Your access to this guide has been revoked by the administrator. If
            you believe this is an error, please contact the site owner.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-zinc-800" />

        {/* Sign out */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-600">
            You are currently signed in. Sign out to return to the login page.
          </p>
          <button
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            className="w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {logout.isPending ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </div>
    </div>
  );
}
