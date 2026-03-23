/**
 * /admin/analytics — Live site analytics dashboard (admin-only)
 * Shows visitor counts, session durations, page views, feature engagement,
 * device/browser breakdown, DAU trend chart, and Top 3 unactioned feedback.
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  ArrowLeft,
  RefreshCw,
  Users,
  Eye,
  Clock,
  Monitor,
  AlertCircle,
  Activity,
  TrendingUp,
  Send,
} from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#58a6ff", "#3fb950", "#d29922", "#f85149", "#bc8cff"];

const PAGE_LABELS: Record<string, string> = {
  overview: "Overview",
  coding: "Coding",
  behavioral: "Behavioral",
  design: "System Design",
};

const DEV_ICONS: Record<string, string> = {
  desktop: "🖥️",
  tablet: "📱",
  mobile: "📱",
};

function KpiCard({
  icon: Icon,
  label,
  value,
  color = "#58a6ff",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <Card className="bg-[#161b22] border-[#30363d]">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={14} style={{ color }} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="text-2xl font-bold" style={{ color }}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAnalytics() {
  const { user, loading } = useAuth();
  const [days, setDays] = useState(7);
  const [dauDays, setDauDays] = useState(7);

  const { data, isLoading, refetch } = trpc.analytics.adminReport.useQuery(
    { days },
    { enabled: !!user && (user as { role?: string }).role === "admin" }
  );

  const { data: dauData, isLoading: dauLoading } =
    trpc.analytics.dauTrend.useQuery(
      { days: dauDays },
      { enabled: !!user && (user as { role?: string }).role === "admin" }
    );

  const sendReport = trpc.analytics.sendReportNow.useMutation({
    onSuccess: () =>
      toast.success("Report sent!", {
        description: "Analytics email delivered.",
      }),
    onError: () =>
      toast.error("Failed to send", { description: "Check server logs." }),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  if (!user || (user as { role?: string }).role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <Card className="bg-[#161b22] border-[#30363d] p-8 text-center">
          <AlertCircle className="mx-auto mb-3 text-red-400" size={32} />
          <p className="text-sm text-muted-foreground">
            Admin access required.
          </p>
          <Link href="/">
            <Button variant="outline" size="sm" className="mt-4">
              Go Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-[#0d1117] text-foreground">
      {/* Header */}
      <div className="border-b border-[#30363d] bg-[#161b22] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/feedback">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft size={14} />
                Feedback
              </Button>
            </Link>
            <div>
              <h1 className="text-base font-semibold flex items-center gap-2">
                <Activity size={16} className="text-[#58a6ff]" />
                Site Analytics
              </h1>
              <p className="text-xs text-muted-foreground">
                First-party usage data · No PII collected
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Day range selector */}
            <div className="flex gap-1">
              {[7, 14, 30].map(d => (
                <Button
                  key={d}
                  variant={days === d ? "default" : "outline"}
                  size="sm"
                  className="text-xs px-2 py-1 h-7"
                  onClick={() => setDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                size={12}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </Button>
            {/* Send Report Now */}
            <Button
              variant="default"
              size="sm"
              className="gap-1 bg-[#238636] hover:bg-[#2ea043] border-0"
              onClick={() => sendReport.mutate()}
              disabled={sendReport.isPending}
            >
              <Send
                size={12}
                className={sendReport.isPending ? "animate-pulse" : ""}
              />
              {sendReport.isPending ? "Sending…" : "Send Report Now"}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {isLoading || !data ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            Loading analytics…
          </div>
        ) : (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <KpiCard
                icon={Users}
                label="Sessions"
                value={s!.totalSessions}
                color="#58a6ff"
              />
              <KpiCard
                icon={TrendingUp}
                label="Logged-in Users"
                value={s!.uniqueVisitors}
                color="#3fb950"
              />
              <KpiCard
                icon={Eye}
                label="Page Views"
                value={s!.totalPageViews}
                color="#bc8cff"
              />
              <KpiCard
                icon={Clock}
                label="Avg Session"
                value={`${s!.avgSessionMinutes}m`}
                color="#d29922"
              />
              <KpiCard
                icon={Monitor}
                label="Total Time"
                value={`${s!.totalHours}h`}
                color="#f85149"
              />
            </div>

            {/* DAU Trend Line Chart */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#3fb950]" />
                    Daily Active Users (Sessions / Day)
                  </CardTitle>
                  <div className="flex gap-1">
                    {[7, 30].map(d => (
                      <Button
                        key={d}
                        variant={dauDays === d ? "default" : "outline"}
                        size="sm"
                        className="text-xs px-2 py-0.5 h-6"
                        onClick={() => setDauDays(d)}
                      >
                        {d}d
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {dauLoading ? (
                  <div className="h-[160px] flex items-center justify-center text-muted-foreground text-xs">
                    Loading trend…
                  </div>
                ) : (dauData?.trend?.length ?? 0) === 0 ? (
                  <div className="h-[160px] flex items-center justify-center text-muted-foreground text-xs">
                    No session data yet for this period.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={dauData?.trend ?? []}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#21262d"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={d => {
                          const dt = new Date(d);
                          return `${dt.getMonth() + 1}/${dt.getDate()}`;
                        }}
                        tick={{ fontSize: 10, fill: "#8b949e" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 10, fill: "#8b949e" }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#21262d",
                          border: "1px solid #30363d",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelFormatter={d => {
                          const dt = new Date(d as string);
                          return dt.toLocaleDateString();
                        }}
                        formatter={(v: number) => [v, "Sessions"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="sessions"
                        stroke="#3fb950"
                        strokeWidth={2}
                        dot={{ fill: "#3fb950", r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Page Views Chart */}
            {data.pageViews.length > 0 && (
              <Card className="bg-[#161b22] border-[#30363d]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Page Views by Tab
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data.pageViews}>
                      <XAxis
                        dataKey="page"
                        tickFormatter={p => PAGE_LABELS[p] ?? p}
                        tick={{ fontSize: 11, fill: "#8b949e" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#8b949e" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#21262d",
                          border: "1px solid #30363d",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelFormatter={p => PAGE_LABELS[p as string] ?? p}
                      />
                      <Bar
                        dataKey="count"
                        fill="#58a6ff"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Top Events + Device Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Feature Events */}
              {data.topEvents.length > 0 && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      ⚡ Top Feature Interactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {data.topEvents.slice(0, 8).map((ev, i) => {
                      const maxCount = data.topEvents[0]?.count ?? 1;
                      const pct = Math.round((ev.count / maxCount) * 100);
                      return (
                        <div key={ev.eventName}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-foreground truncate max-w-[200px]">
                              {ev.eventName
                                .replace("feature_click:", "")
                                .replace(/_/g, " ")}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              {ev.count}
                            </span>
                          </div>
                          <div className="bg-[#21262d] rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${pct}%`,
                                background: COLORS[i % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Device Breakdown */}
              {data.deviceBreakdown.length > 0 && (
                <Card className="bg-[#161b22] border-[#30363d]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      📱 Device & Browser
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <ResponsiveContainer width={120} height={120}>
                        <PieChart>
                          <Pie
                            data={data.deviceBreakdown}
                            dataKey="count"
                            nameKey="deviceType"
                            cx="50%"
                            cy="50%"
                            outerRadius={50}
                          >
                            {data.deviceBreakdown.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "#21262d",
                              border: "1px solid #30363d",
                              borderRadius: 8,
                              fontSize: 11,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1 text-xs">
                        {data.deviceBreakdown.map((d, i) => (
                          <div
                            key={d.deviceType}
                            className="flex items-center gap-2"
                          >
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            <span className="text-foreground capitalize">
                              {DEV_ICONS[d.deviceType]} {d.deviceType}
                            </span>
                            <span className="text-muted-foreground ml-auto">
                              {d.count}
                            </span>
                          </div>
                        ))}
                        <div className="border-t border-[#30363d] pt-1 mt-1">
                          {(
                            data as {
                              browserBreakdown?: Array<{
                                browser: string;
                                count: number;
                              }>;
                            }
                          ).browserBreakdown
                            ?.slice(0, 3)
                            .map((b, i) => (
                              <div
                                key={b.browser}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    background: COLORS[(i + 3) % COLORS.length],
                                  }}
                                />
                                <span className="text-foreground">
                                  🌐 {b.browser}
                                </span>
                                <span className="text-muted-foreground ml-auto">
                                  {b.count}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Top 3 Unactioned Feedback */}
            <Card className="bg-[#161b22] border-[#30363d]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle size={14} className="text-red-400" />
                  Top 3 Unactioned Feedback Items
                  <Link href="/admin/feedback">
                    <span className="ml-auto text-xs text-[#58a6ff] cursor-pointer hover:underline font-normal">
                      View all →
                    </span>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(
                  data as {
                    top3Unactioned?: Array<{
                      id: number;
                      category: string;
                      message: string;
                      page: string | null;
                      createdAt: Date;
                    }>;
                  }
                ).top3Unactioned?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No unactioned feedback — backlog is clear! 🎉
                  </p>
                ) : (
                  (
                    data as {
                      top3Unactioned?: Array<{
                        id: number;
                        category: string;
                        message: string;
                        page: string | null;
                        createdAt: Date;
                      }>;
                    }
                  ).top3Unactioned?.map((item, i) => (
                    <div
                      key={item.id}
                      className="border-l-2 border-red-500/60 pl-3 py-1"
                    >
                      <div className="text-xs text-muted-foreground mb-0.5">
                        #{i + 1} · {item.category.replace("_", " ")} ·{" "}
                        {item.page ?? "unknown"} ·{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-foreground">
                        {item.message.slice(0, 200)}
                        {item.message.length > 200 ? "…" : ""}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Empty state */}
            {s!.totalSessions === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No analytics data yet for the selected period. Data will appear
                once visitors start using the site.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
