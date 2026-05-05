import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetFraudTrends, useGetSpendingAnomalies } from "@workspace/api-client-react";
import { BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsExplorer() {
  const { data: trends, isLoading: loadingTrends } = useGetFraudTrends({ period: '30d' });
  const { data: anomalies, isLoading: loadingAnomalies } = useGetSpendingAnomalies();

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Explorer</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">MACRO TRENDS & ANOMALIES</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Fraud Volume Trends (30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px]">
            {!loadingTrends && trends ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.byDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="timestamp" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelFormatter={(v) => new Date(v).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="fraudulent" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} name="Fraudulent TX" />
                  <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Total TX" />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 border-border/40 bg-card/50 backdrop-blur overflow-hidden flex flex-col">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Spending Anomalies
            </CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-y-auto p-0">
            {!loadingAnomalies && anomalies ? (
              <div className="divide-y divide-border/40">
                {anomalies.map((anomaly, i) => (
                  <div key={i} className="p-4 hover:bg-accent/10 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm">{anomaly.userName}</div>
                      <Badge variant="outline" className="border-amber-500 text-amber-500 text-[10px] uppercase">
                        {anomaly.anomalyType}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">{anomaly.description}</div>
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-destructive font-bold">${anomaly.amount.toLocaleString()}</span>
                      <span className="text-muted-foreground">{new Date(anomaly.detectedAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}