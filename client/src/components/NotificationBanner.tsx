// Design: Bold Engineering Dashboard — Notification Banner
import { useState, useEffect } from "react";
import { Bell, X, BellOff } from "lucide-react";
import { useNotifSettings } from "@/hooks/useLocalStorage";
import { toast } from "sonner";

export default function NotificationBanner() {
  const [settings, setSettings] = useNotifSettings();
  const [time, setTime] = useState(settings.time);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!settings.dismissed && !settings.enabled) {
      const t = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(t);
    }
  }, [settings.dismissed, settings.enabled]);

  // Daily nudge check
  useEffect(() => {
    if (!settings.enabled) return;
    const interval = setInterval(() => {
      const now = new Date();
      const [h, m] = settings.time.split(":").map(Number);
      if (now.getHours() === h && now.getMinutes() === m) {
        if (Notification.permission === "granted") {
          new Notification("Meta Prep Daily Reminder", {
            body: "Time for your daily drill! Keep the streak going 🔥",
            icon: "/favicon.ico",
          });
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [settings.enabled, settings.time]);

  const handleEnable = async () => {
    if (!("Notification" in window)) {
      toast.error("Browser notifications not supported.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setSettings({ enabled: true, time, dismissed: true });
      new Notification("Meta Prep Reminder Set!", { body: `You'll be reminded daily at ${time} 🎯` });
      setShow(false);
      toast.success(`Daily reminder set for ${time}`);
    } else {
      toast.error("Notification permission denied. Enable in browser settings.");
    }
  };

  const handleDisable = () => {
    setSettings(s => ({ ...s, enabled: false }));
    toast.success("Daily reminder disabled.");
  };

  const handleDismiss = () => {
    setSettings(s => ({ ...s, dismissed: true }));
    setShow(false);
  };

  // Active state badge
  if (settings.enabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
        <Bell size={11} className="text-emerald-400" />
        <span className="text-emerald-400 font-medium">Reminder: {settings.time}</span>
        <button onClick={handleDisable} className="text-muted-foreground hover:text-foreground ml-1">
          <BellOff size={11} />
        </button>
      </div>
    );
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 prep-card p-4 shadow-2xl border-blue-500/30">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell size={14} className="text-blue-400" />
          <span className="text-sm font-semibold text-foreground">Set Daily Reminder</span>
        </div>
        <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
          <X size={14} />
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">Get a daily browser notification to complete at least one drill or practice session.</p>
      <div className="flex items-center gap-2 mb-3">
        <input type="time" value={time} onChange={e => setTime(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-blue-500/50" />
        <button onClick={handleEnable}
          className="px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold transition-all whitespace-nowrap">
          Enable
        </button>
      </div>
      <button onClick={handleDismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        No thanks
      </button>
    </div>
  );
}
