import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useGetDashboardSummary,
  useGetTransactionVelocity,
} from "@workspace/api-client-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ShieldAlert, Ban, AlertTriangle, Zap, Wifi, WifiOff, Radio } from "lucide-react";
import { useTransactionStream } from "@/hooks/useTransactionStream";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: velocity, isLoading: loadingVelocity } = useGetTransactionVelocity({ interval: "1h" });
  const { transactions: streamTxs, alerts: streamAlerts, status: wsStatus } = useTransactionStream();

  const blockedCount = useMemo(
    () => streamTxs.filter((t) => t.status === "blocked").length,
    [streamTxs]
  );
  const criticalCount = useMemo(
    () => streamAlerts.filter((a) => a.severity === "critical").length,
    [streamAlerts]
  );
  const avgResponseTime = useMemo(() => {
    if (!summary?.avgResponseTimeMs) return null;
    return summary.avgResponseTimeMs;
  }, [summary]);

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-time Monitor</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            SYSTEM STATUS: <span className="text-emerald-500 font-bold">NOMINAL</span>
          </p>
        </div>
        <WsStatusBadge status={wsStatus} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Live Transactions"
          value={streamTxs.length}
          icon={Activity}
          trend="this session"
          live
        />
        <KpiCard
          title="Fraudulent Blocked"
          value={blockedCount || summary?.blockedToday || 0}
          loading={false}
          icon={Ban}
          alert
        />
        <KpiCard
          title="Critical Alerts"
          value={criticalCount || summary?.criticalAlerts || 0}
          loading={false}
          icon={ShieldAlert}
          alert
        />
        <KpiCard
          title="Avg Response Time"
          value={avgResponseTime ? `${avgResponseTime}ms` : undefined}
          loading={loadingSummary}
          icon={Zap}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Transaction Velocity (1H)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            {loadingVelocity ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={velocity}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-border/40 bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-muted-foreground">Detection Rate</span>
                      <span className="font-mono">{summary?.detectionRate ?? 0}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${summary?.detectionRate || 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-xs">
                      <span className="text-muted-foreground">False Positive Rate</span>
                      <span className="font-mono">{summary?.falsePositiveRate ?? 0}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${summary?.falsePositiveRate || 0}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-2xl font-bold text-destructive">{summary?.openAlerts ?? 0}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">Open Alerts</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {streamAlerts.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5 backdrop-blur shadow-[0_0_20px_-5px_rgba(220,38,38,0.15)]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-destructive flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Live Alerts ({streamAlerts.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[180px] overflow-y-auto">
                {streamAlerts.slice(0, 5).map((al) => (
                  <div key={al.id} className="text-xs p-2 rounded bg-card/60 border border-border/40">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${al.severity === "critical" ? "bg-destructive" : al.severity === "high" ? "bg-orange-500" : "bg-amber-400"}`} />
                      <span className="font-medium text-foreground truncate">{al.title}</span>
                    </div>
                    <p className="text-muted-foreground pl-3 truncate">{al.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary animate-pulse" />
            Live Transaction Feed
            {streamTxs.length > 0 && (
              <span className="ml-auto text-xs text-primary font-mono">{streamTxs.length} events</span>
            )}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-mono text-xs w-[90px]">TXN ID</TableHead>
                <TableHead className="font-mono text-xs">MERCHANT</TableHead>
                <TableHead className="font-mono text-xs">LOCATION</TableHead>
                <TableHead className="font-mono text-xs">AMOUNT</TableHead>
                <TableHead className="font-mono text-xs">RISK</TableHead>
                <TableHead className="font-mono text-xs">STATUS</TableHead>
                <TableHead className="font-mono text-xs">RULES HIT</TableHead>
                <TableHead className="font-mono text-xs text-right">TIME</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {streamTxs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Radio className="w-8 h-8 text-primary animate-pulse" />
                      <span className="font-mono text-sm">Awaiting transaction stream…</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                streamTxs.map((tx) => (
                  <TableRow
                    key={tx.id}
                    className={`border-border/40 cursor-pointer transition-all duration-500 ${
                      tx._new
                        ? tx.status === "blocked"
                          ? "bg-destructive/15 border-l-2 border-l-destructive"
                          : tx.status === "flagged"
                          ? "bg-amber-500/10 border-l-2 border-l-amber-500"
                          : "bg-primary/10 border-l-2 border-l-primary"
                        : "hover:bg-accent/10"
                    }`}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {tx.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{tx.merchantName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {tx.city}, {tx.country}
                    </TableCell>
                    <TableCell className="font-mono text-sm">${tx.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          tx.riskScore >= 80
                            ? "border-destructive text-destructive font-mono text-xs"
                            : tx.riskScore >= 50
                            ? "border-amber-500 text-amber-500 font-mono text-xs"
                            : "border-emerald-500 text-emerald-500 font-mono text-xs"
                        }
                      >
                        {tx.riskScore}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          tx.status === "blocked"
                            ? "destructive"
                            : tx.status === "flagged"
                            ? "default"
                            : "secondary"
                        }
                        className="uppercase text-[10px] font-mono"
                      >
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {tx.triggeredRules.length > 0 ? (
                        <span className="text-amber-500 font-mono">{tx.triggeredRules[0]}{tx.triggeredRules.length > 1 ? ` +${tx.triggeredRules.length - 1}` : ""}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground font-mono">
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function WsStatusBadge({ status }: { status: string }) {
  const config = {
    connected: { icon: Wifi, color: "text-emerald-500", label: "LIVE", bg: "bg-emerald-500/10 border-emerald-500/30" },
    connecting: { icon: Wifi, color: "text-amber-400", label: "CONNECTING", bg: "bg-amber-400/10 border-amber-400/30" },
    disconnected: { icon: WifiOff, color: "text-muted-foreground", label: "OFFLINE", bg: "bg-secondary border-border" },
    error: { icon: WifiOff, color: "text-destructive", label: "ERROR", bg: "bg-destructive/10 border-destructive/30" },
  }[status] ?? { icon: WifiOff, color: "text-muted-foreground", label: "UNKNOWN", bg: "bg-secondary border-border" };

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono ${config.bg} ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
      {status === "connected" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}
    </div>
  );
}

function KpiCard({ title, value, loading, icon: Icon, trend, alert, live }: {
  title: string;
  value?: string | number;
  loading?: boolean;
  icon: React.ElementType;
  trend?: string;
  alert?: boolean;
  live?: boolean;
}) {
  return (
    <Card className={`border-border/40 bg-card/50 backdrop-blur ${alert ? "border-destructive/30 shadow-[0_0_15px_-5px_rgba(220,38,38,0.2)]" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${alert ? "text-destructive" : live ? "text-primary animate-pulse" : "text-primary"}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex flex-col">
            <span className={`text-3xl font-bold tracking-tight transition-all duration-300 ${alert ? "text-destructive" : "text-foreground"}`}>
              {typeof value === "number" ? value.toLocaleString() : (value ?? "0")}
            </span>
            {trend && (
              <span className="text-xs text-muted-foreground mt-1 font-mono">{trend}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
