/**
 * StandaloneAdminGate — shown on /admin/* routes in the static build.
 *
 * The correct PIN is never stored in the JS bundle. Instead, a SHA-256 hash
 * of ADMIN_PIN is injected at build time via vite.standalone.config.ts.
 * The user's input is hashed client-side and compared to that value.
 *
 * On success: redirects to https://metaguide.one/#/admin/feedback
 * On failure: shake animation + error message
 * After 5 wrong attempts: 15-minute lockout (localStorage-based)
 */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, KeyRound, Loader2, ExternalLink } from "lucide-react";

const LIVE_ADMIN_URL = "https://metaguide.one/#/admin/feedback";
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const LOCKOUT_KEY = "standalone_admin_lockout";
const ATTEMPTS_KEY = "standalone_admin_attempts";

declare const __ADMIN_PIN_HASH__: string;
const ADMIN_PIN_HASH =
  typeof __ADMIN_PIN_HASH__ !== "undefined" ? __ADMIN_PIN_HASH__ : "";

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

function getLockoutState(): { locked: boolean; remainingMs: number } {
  try {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return { locked: false, remainingMs: 0 };
    const until = parseInt(raw, 10);
    const remaining = until - Date.now();
    if (remaining > 0) return { locked: true, remainingMs: remaining };
    localStorage.removeItem(LOCKOUT_KEY);
    localStorage.removeItem(ATTEMPTS_KEY);
    return { locked: false, remainingMs: 0 };
  } catch {
    return { locked: false, remainingMs: 0 };
  }
}

function getAttempts(): number {
  try {
    return parseInt(localStorage.getItem(ATTEMPTS_KEY) ?? "0", 10);
  } catch {
    return 0;
  }
}

function recordFailedAttempt(): number {
  const attempts = getAttempts() + 1;
  try {
    localStorage.setItem(ATTEMPTS_KEY, String(attempts));
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_KEY, String(Date.now() + LOCKOUT_MS));
    }
  } catch {
    // ignore
  }
  return attempts;
}

function formatMs(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function StandaloneAdminGate() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [checking, setChecking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lockoutMs, setLockoutMs] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const { locked, remainingMs } = getLockoutState();
    if (locked) setLockoutMs(remainingMs);
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (lockoutMs <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      const { locked, remainingMs } = getLockoutState();
      if (!locked) {
        setLockoutMs(0);
        clearInterval(timerRef.current!);
      } else {
        setLockoutMs(remainingMs);
      }
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockoutMs > 0]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim() || checking || lockoutMs > 0) return;
    setChecking(true);
    setError("");
    try {
      if (!ADMIN_PIN_HASH) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = LIVE_ADMIN_URL;
        }, 800);
        return;
      }
      const inputHash = await sha256(pin.trim());
      if (inputHash === ADMIN_PIN_HASH) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = LIVE_ADMIN_URL;
        }, 800);
      } else {
        const attempts = recordFailedAttempt();
        const { locked, remainingMs } = getLockoutState();
        if (locked) {
          setLockoutMs(remainingMs);
          setError(
            `Too many wrong attempts. Locked for ${formatMs(remainingMs)}.`
          );
        } else {
          const remaining = MAX_ATTEMPTS - attempts;
          setError(
            remaining > 0
              ? `Incorrect PIN. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Incorrect PIN."
          );
        }
        triggerShake();
        setPin("");
        inputRef.current?.focus();
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div
        className={shake ? "w-full max-w-sm animate-shake" : "w-full max-w-sm"}
      >
        <div className="flex justify-center mb-6">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              success
                ? "bg-emerald-500/20"
                : lockoutMs > 0
                  ? "bg-red-500/20"
                  : "bg-blue-500/20"
            }`}
          >
            {success ? (
              <ExternalLink className="w-8 h-8 text-emerald-400" />
            ) : lockoutMs > 0 ? (
              <ShieldAlert className="w-8 h-8 text-red-400" />
            ) : (
              <KeyRound className="w-8 h-8 text-blue-400" />
            )}
          </div>
        </div>

        <h1 className="text-xl font-bold text-foreground text-center mb-1">
          {success
            ? "Access Granted"
            : lockoutMs > 0
              ? "Access Locked"
              : "Admin Access"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-6">
          {success
            ? "Redirecting to admin panel\u2026"
            : lockoutMs > 0
              ? `Too many failed attempts. Try again in ${formatMs(lockoutMs)}.`
              : "Enter your admin PIN to continue to the live admin panel."}
        </p>

        {!success && lockoutMs <= 0 && (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              placeholder="Enter PIN"
              value={pin}
              onChange={e => {
                setPin(e.target.value);
                setError("");
              }}
              disabled={checking}
              className="text-center text-lg tracking-widest"
              autoComplete="current-password"
            />
            {error && (
              <p className="text-red-400 text-xs text-center">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={!pin.trim() || checking}
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying\u2026
                </>
              ) : (
                "Continue to Admin Panel"
              )}
            </Button>
          </form>
        )}

        {lockoutMs > 0 && (
          <div className="text-center">
            <div className="text-4xl font-mono font-bold text-red-400 mb-2">
              {formatMs(lockoutMs)}
            </div>
            <p className="text-xs text-muted-foreground">
              Locked until countdown reaches 0:00
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <a
            href="/#/"
            className="text-xs text-muted-foreground hover:underline"
          >
            \u2190 Back to guide
          </a>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-6px); }
          40%, 60% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}
