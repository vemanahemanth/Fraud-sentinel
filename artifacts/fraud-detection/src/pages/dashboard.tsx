import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  useGetDashboardSummary, 
  useGetTransactionVelocity,
  useListTransactions
} from "@workspace/api-client-react";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, ShieldAlert, Ban, AlertTriangle, Zap } from "lucide-react";

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: velocity, isLoading: loadingVelocity } = useGetTransactionVelocity({ interval: "1h" });
  const { data: transactions, isLoading: loadingTransactions } = useListTransactions({ limit: 10 });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Real-time Monitor</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">SYSTEM STATUS: <span className="text-emerald-500 font-bold">NOMINAL</span></p>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Total Transactions" 
          value={summary?.totalTransactionsToday} 
          loading={loadingSummary} 
          icon={Activity} 
          trend="+12%" 
        />
        <KpiCard 
          title="Fraudulent Blocked" 
          value={summary?.blockedToday} 
          loading={loadingSummary} 
          icon={Ban} 
          trend="+2.4%" 
          alert
        />
        <KpiCard 
          title="Critical Alerts" 
          value={summary?.criticalAlerts} 
          loading={loadingSummary} 
          icon={ShieldAlert} 
          alert
        />
        <KpiCard 
          title="Avg Response Time" 
          value={summary ? `${summary.avgResponseTimeMs}ms` : undefined} 
          loading={loadingSummary} 
          icon={Zap} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Velocity Chart */}
        <Card className="xl:col-span-2 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Transaction Velocity (1H)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {loadingVelocity ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="full" height="100%">
                <AreaChart data={velocity}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => new Date(v).toLocaleTimeString()} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats/Trends */}
        <Card className="border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <div className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>Detection Rate</span>
                    <span className="font-mono">{summary?.detectionRate}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${summary?.detectionRate || 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2 text-sm">
                    <span>False Positive Rate</span>
                    <span className="font-mono">{summary?.falsePositiveRate}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${summary?.falsePositiveRate || 0}%` }} />
                  </div>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <div className="text-2xl font-bold text-destructive">{summary?.openAlerts}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Open Alerts</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Live Feed */}
      <Card className="border-border/40 bg-card/50 backdrop-blur overflow-hidden">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Live Transaction Feed
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-mono text-xs">ID</TableHead>
                <TableHead className="font-mono text-xs">MERCHANT</TableHead>
                <TableHead className="font-mono text-xs">AMOUNT</TableHead>
                <TableHead className="font-mono text-xs">RISK SCORE</TableHead>
                <TableHead className="font-mono text-xs">STATUS</TableHead>
                <TableHead className="font-mono text-xs text-right">TIME</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingTransactions ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : (
                transactions?.data.map((tx) => (
                  <TableRow key={tx.id} className="border-border/40 hover:bg-accent/10 cursor-pointer transition-colors group">
                    <TableCell className="font-mono text-xs text-muted-foreground group-hover:text-primary transition-colors">
                      {tx.id.substring(0, 8)}
                    </TableCell>
                    <TableCell className="font-medium">{tx.merchantName}</TableCell>
                    <TableCell className="font-mono">${tx.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        tx.riskScore > 80 ? "border-destructive text-destructive" :
                        tx.riskScore > 50 ? "border-amber-500 text-amber-500" :
                        "border-emerald-500 text-emerald-500"
                      }>
                        {tx.riskScore}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.status === 'blocked' ? 'destructive' : tx.status === 'flagged' ? 'default' : 'secondary'} className="uppercase text-[10px]">
                        {tx.status}
                      </Badge>
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

function KpiCard({ title, value, loading, icon: Icon, trend, alert }: any) {
  return (
    <Card className={`border-border/40 bg-card/50 backdrop-blur ${alert ? 'border-destructive/30 shadow-[0_0_15px_-5px_rgba(220,38,38,0.2)]' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${alert ? 'text-destructive' : 'text-primary'}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="flex flex-col">
            <span className={`text-3xl font-bold tracking-tight ${alert ? 'text-destructive' : 'text-foreground'}`}>
              {value?.toLocaleString() || 0}
            </span>
            {trend && (
              <span className="text-xs text-muted-foreground mt-1 font-mono">
                {trend} vs last 1h
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
