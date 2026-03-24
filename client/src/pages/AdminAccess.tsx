/**
 * AdminAccess — Owner-only control panel for the site access gate.
 * Route: /admin/access
 *
 * Features:
 * - Manual lock/unlock toggle (immediate effect)
 * - Set the 60-day clock start date
 * - Configure the number of lock days
 * - Customize the message shown on the locked screen
 * - Live preview of current lock state
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  Clock,
  ShieldAlert,
  CalendarDays,
  MessageSquare,
  Settings2,
  ArrowLeft,
  Eye,
  RefreshCw,
  Users,
  AlertTriangle,
} from "lucide-react";

export default function AdminAccess() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  // Owner check
  const { data: ownerData, isLoading: ownerLoading } =
    trpc.auth.isOwner.useQuery(undefined, {
      enabled: !!user,
    });

  // Current settings
  const {
    data: settings,
    isLoading: settingsLoading,
    refetch,
  } = trpc.siteAccess.getSettings.useQuery(undefined, {
    enabled: !!ownerData?.isOwner,
  });

  // Current access state (for live preview)
  const { data: accessState, refetch: refetchAccess } =
    trpc.siteAccess.checkAccess.useQuery(undefined, { staleTime: 0 });

  // Local form state
  const [manualLock, setManualLock] = useState(false);
  const [lockStartDate, setLockStartDate] = useState("");
  const [lockDays, setLockDays] = useState(60);
  const [lockMessage, setLockMessage] = useState("");
  const [dirty, setDirty] = useState(false);

  // Sync form with loaded settings
  useEffect(() => {
    if (settings) {
      setManualLock(settings.manualLockEnabled === 1);
      setLockStartDate(settings.lockStartDate ?? "");
      setLockDays(settings.lockDays ?? 60);
      setLockMessage(settings.lockMessage ?? "");
      setDirty(false);
    }
  }, [settings]);

  const [showCohortConfirm, setShowCohortConfirm] = useState(false);

  const cohortResetMutation = trpc.siteAccess.cohortReset.useMutation({
    onSuccess: data => {
      toast.success(
        `Cohort reset! Clock restarted from ${data.newStartDate}. All disclaimers cleared.`
      );
      setShowCohortConfirm(false);
      refetch();
      refetchAccess();
    },
    onError: err => toast.error(`Cohort reset failed: ${err.message}`),
  });

  const updateMutation = trpc.siteAccess.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Access settings saved.");
      setDirty(false);
      refetch();
      refetchAccess();
    },
    onError: err => toast.error(`Failed to save: ${err.message}`),
  });

  // Quick-toggle manual lock without saving the full form
  const quickToggle = trpc.siteAccess.updateSettings.useMutation({
    onSuccess: (_, vars) => {
      const locked = vars.manualLockEnabled;
      toast.success(locked ? "Site manually locked." : "Site unlocked.");
      refetch();
      refetchAccess();
    },
    onError: err => toast.error(`Failed: ${err.message}`),
  });

  // Auth guard
  if (loading || ownerLoading || settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !ownerData?.isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
          <p className="text-muted-foreground text-sm">
            Owner access required.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  // Compute days elapsed if start date is set
  const daysElapsed = lockStartDate
    ? Math.floor(
        (Date.now() - new Date(lockStartDate).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;
  const daysRemaining =
    daysElapsed !== null ? Math.max(0, lockDays - daysElapsed) : null;

  const handleSave = () => {
    updateMutation.mutate({
      manualLockEnabled: manualLock,
      lockStartDate: lockStartDate || null,
      lockDays,
      lockMessage: lockMessage || null,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50">
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-blue-400" />
              Access Gate Control
            </h1>
            <p className="text-xs text-muted-foreground">
              Control who can access the guide and when.
            </p>
          </div>
          {/* Live status badge */}
          {accessState?.locked ? (
            <Badge variant="destructive" className="gap-1">
              <Lock className="w-3 h-3" />
              LOCKED
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1 border-emerald-500/40 text-emerald-400"
            >
              <Unlock className="w-3 h-3" />
              OPEN
            </Badge>
          )}
        </div>
      </div>

      <div className="container py-8 max-w-2xl space-y-6">
        {/* Quick Toggle Card */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400" />
              Manual Lock
            </CardTitle>
            <CardDescription>
              Instantly lock or unlock the site for all visitors. You (the
              owner) always retain access regardless of this setting.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {manualLock ? "Site is manually locked" : "Site is open"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {manualLock
                    ? "Visitors see the locked screen immediately."
                    : "Visitors can access the guide normally."}
                </p>
              </div>
              <Switch
                checked={manualLock}
                onCheckedChange={val => {
                  setManualLock(val);
                  setDirty(true);
                  // Also quick-save this toggle immediately
                  quickToggle.mutate({ manualLockEnabled: val });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Auto-Lock Timer Card */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Auto-Lock Timer
            </CardTitle>
            <CardDescription>
              The site automatically locks after the specified number of days
              from the start date. Leave the start date blank to disable the
              timer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate" className="text-xs">
                  <CalendarDays className="w-3.5 h-3.5 inline mr-1" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={lockStartDate}
                  onChange={e => {
                    setLockStartDate(e.target.value);
                    setDirty(true);
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  When the 60-day clock began.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lockDays" className="text-xs">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  Lock After (days)
                </Label>
                <Input
                  id="lockDays"
                  type="number"
                  min={1}
                  max={3650}
                  value={lockDays}
                  onChange={e => {
                    setLockDays(parseInt(e.target.value) || 60);
                    setDirty(true);
                  }}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Default: 60 days.
                </p>
              </div>
            </div>

            {/* Reset Clock shortcut */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                onClick={() => {
                  const today = new Date().toISOString().slice(0, 10);
                  setLockStartDate(today);
                  setDirty(true);
                  // Immediately persist
                  updateMutation.mutate({
                    manualLockEnabled: manualLock,
                    lockStartDate: today,
                    lockDays,
                    lockMessage: lockMessage || null,
                  });
                }}
                disabled={updateMutation.isPending}
              >
                <RefreshCw className="w-3 h-3" />
                Reset Clock to Today
              </Button>
              <span className="text-xs text-muted-foreground">
                Sets start date to today and saves immediately.
              </span>
            </div>

            {/* Timer status */}
            {lockStartDate && (
              <div className="rounded-lg bg-muted/40 border border-border p-3 text-sm space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Days elapsed</span>
                  <span className="font-mono font-medium">
                    {daysElapsed ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Days remaining</span>
                  <span
                    className={`font-mono font-medium ${
                      (daysRemaining ?? 999) <= 7
                        ? "text-red-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {daysRemaining ?? "—"}
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((daysElapsed ?? 0) / lockDays) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Message Card */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              Locked Screen Message
            </CardTitle>
            <CardDescription>
              The message shown to visitors when the site is locked. Leave blank
              to use the default message.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="This guide is currently closed. Please check back later."
              value={lockMessage}
              onChange={e => {
                setLockMessage(e.target.value);
                setDirty(true);
              }}
              rows={3}
              maxLength={500}
              className="text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground mt-1.5 text-right">
              {lockMessage.length}/500
            </p>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card className="border-border bg-muted/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              Live Status Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-background p-4 text-center space-y-2">
              {accessState?.locked ? (
                <>
                  <Lock className="w-6 h-6 text-muted-foreground mx-auto" />
                  <p className="text-sm font-medium text-foreground">
                    {accessState.reason === "expired"
                      ? "Access Window Closed"
                      : "Guide Temporarily Closed"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {accessState.message}
                  </p>
                  <Badge variant="destructive" className="text-xs">
                    Locked — {accessState.reason}
                  </Badge>
                </>
              ) : (
                <>
                  <Unlock className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p className="text-sm font-medium text-foreground">
                    Guide is Open
                  </p>
                  {accessState?.daysRemaining !== null &&
                    accessState?.daysRemaining !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {accessState.daysRemaining} days remaining before
                        auto-lock
                      </p>
                    )}
                  <Badge
                    variant="outline"
                    className="text-xs border-emerald-500/40 text-emerald-400"
                  >
                    Open — {accessState?.reason ?? "no_expiry"}
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cohort Reset Card */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Cohort Reset
            </CardTitle>
            <CardDescription>
              Start a new cohort: resets the 60-day clock to today, clears all
              disclaimer acknowledgments so returning users must re-read it, and
              sends you a Manus inbox confirmation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showCohortConfirm ? (
              <Button
                variant="outline"
                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 gap-2"
                onClick={() => setShowCohortConfirm(true)}
              >
                <RefreshCw className="w-4 h-4" />
                Start New Cohort
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300">
                    This will reset the 60-day clock to{" "}
                    <strong>{new Date().toLocaleDateString()}</strong> and clear
                    all disclaimer acknowledgments. Users will be prompted to
                    re-read the disclaimer on their next visit.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCohortConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
                    onClick={() => cohortResetMutation.mutate()}
                    disabled={cohortResetMutation.isPending}
                  >
                    {cohortResetMutation.isPending ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : null}
                    Confirm Cohort Reset
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        {dirty && (
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (settings) {
                  setManualLock(settings.manualLockEnabled === 1);
                  setLockStartDate(settings.lockStartDate ?? "");
                  setLockDays(settings.lockDays ?? 60);
                  setLockMessage(settings.lockMessage ?? "");
                  setDirty(false);
                }
              }}
            >
              Discard
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
