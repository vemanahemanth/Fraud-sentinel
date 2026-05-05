import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGetModelPerformance, GetModelPerformanceModelName } from "@workspace/api-client-react";
import { BrainCircuit, Activity, Target, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

export default function ModelPerformance() {
  const [model, setModel] = useState<GetModelPerformanceModelName>('isolation_forest');
  const { data: perf, isLoading } = useGetModelPerformance({ modelName: model });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ML Performance</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">MODEL DIAGNOSTICS & METRICS</p>
        </div>
        <div className="w-64">
          <Select value={model} onValueChange={(val) => setModel(val as GetModelPerformanceModelName)}>
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="isolation_forest">Isolation Forest</SelectItem>
              <SelectItem value="autoencoder">Autoencoder</SelectItem>
              <SelectItem value="velocity_model">Velocity Model</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!isLoading && perf && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard title="Precision" value={`${(perf.precision * 100).toFixed(1)}%`} icon={Target} />
            <MetricCard title="Recall" value={`${(perf.recall * 100).toFixed(1)}%`} icon={Activity} />
            <MetricCard title="F1 Score" value={`${(perf.f1Score * 100).toFixed(1)}%`} icon={BrainCircuit} />
            <MetricCard title="Avg Latency" value={`${perf.avgLatencyMs.toFixed(1)}ms`} icon={Zap} alert={perf.avgLatencyMs > 100} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Confusion Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-center text-sm font-mono">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-md">
                    <div className="text-muted-foreground mb-1">True Negatives</div>
                    <div className="text-2xl font-bold text-emerald-500">{perf.confusionMatrix.tn}</div>
                  </div>
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md">
                    <div className="text-muted-foreground mb-1">False Positives</div>
                    <div className="text-2xl font-bold text-destructive">{perf.confusionMatrix.fp}</div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-md">
                    <div className="text-muted-foreground mb-1">False Negatives</div>
                    <div className="text-2xl font-bold text-amber-500">{perf.confusionMatrix.fn}</div>
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-md">
                    <div className="text-muted-foreground mb-1">True Positives</div>
                    <div className="text-2xl font-bold text-blue-500">{perf.confusionMatrix.tp}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-border/40 bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perf.scoreDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <XAxis dataKey="bucket" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <RechartsTooltip cursor={{ fill: 'hsl(var(--accent)/0.2)' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, alert }: any) {
  return (
    <Card className={`border-border/40 bg-card/50 backdrop-blur ${alert ? 'border-destructive/30' : ''}`}>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-1">{title}</p>
          <p className={`text-3xl font-bold tracking-tight ${alert ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${alert ? 'bg-destructive/10' : 'bg-primary/10'}`}>
          <Icon className={`h-6 w-6 ${alert ? 'text-destructive' : 'text-primary'}`} />
        </div>
      </CardContent>
    </Card>
  );
}