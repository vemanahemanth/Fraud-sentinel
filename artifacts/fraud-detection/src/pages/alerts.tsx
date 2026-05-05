import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useListAlerts, useGetAlertBreakdown, useAcknowledgeAlert, useResolveAlert, getListAlertsQueryKey, getGetAlertBreakdownQueryKey } from "@workspace/api-client-react";
import { AlertCircle, CheckCircle2, ShieldAlert, AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const SEVERITY_COLORS: Record<string, string> = {
  critical: "destructive",
  high: "amber-500",
  warning: "amber-500",
  info: "blue-500"
};

const SEVERITY_ICONS: Record<string, any> = {
  critical: ShieldAlert,
  high: AlertTriangle,
  warning: AlertCircle,
  info: Info
};

export default function AlertsDashboard() {
  const [page, setPage] = useState(1);
  const [resolveAlertId, setResolveAlertId] = useState<string | null>(null);
  const [resolution, setResolution] = useState("");
  
  const queryClient = useQueryClient();
  const { data: alerts, isLoading: loadingAlerts } = useListAlerts({ page, limit: 20 });
  const { data: breakdown, isLoading: loadingBreakdown } = useGetAlertBreakdown();
  
  const ackAlert = useAcknowledgeAlert();
  const resAlert = useResolveAlert();

  const handleAcknowledge = (id: string) => {
    ackAlert.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
      }
    });
  };

  const handleResolve = () => {
    if (!resolveAlertId) return;
    resAlert.mutate({ id: resolveAlertId, data: { resolution, resolvedBy: "current_user" } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() });
        setResolveAlertId(null);
        setResolution("");
      }
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alert Dashboard</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">SYSTEM ALERTS & NOTIFICATIONS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BarChart className="w-4 h-4 text-primary" />
              Alert Breakdown By Type
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            {loadingBreakdown ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={breakdown?.byType} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="type" type="category" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--accent)/0.2)' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                    itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {breakdown?.byType.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill="hsl(var(--primary))" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-primary" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40 hover:bg-transparent">
                    <TableHead className="font-mono text-xs w-[120px]">SEVERITY</TableHead>
                    <TableHead className="font-mono text-xs">TITLE</TableHead>
                    <TableHead className="font-mono text-xs">STATUS</TableHead>
                    <TableHead className="font-mono text-xs w-[180px]">TIME</TableHead>
                    <TableHead className="font-mono text-xs text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAlerts ? (
                    Array(5).fill(0).map((_, i) => (
                      <TableRow key={i} className="border-border/40">
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : alerts?.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        <ShieldCheck className="mx-auto h-8 w-8 mb-2 opacity-50" />
                        No alerts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    alerts?.data.map((alert) => {
                      const Icon = SEVERITY_ICONS[alert.severity] || Info;
                      return (
                        <TableRow key={alert.id} className="border-border/40">
                          <TableCell>
                            <Badge variant="outline" className={`border-${SEVERITY_COLORS[alert.severity]} text-${SEVERITY_COLORS[alert.severity]} flex items-center gap-1 w-fit`}>
                              <Icon className="w-3 h-3" />
                              <span className="uppercase text-[10px]">{alert.severity}</span>
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{alert.title}</TableCell>
                          <TableCell>
                            <Badge variant={alert.status === 'open' ? 'destructive' : alert.status === 'acknowledged' ? 'secondary' : 'outline'} className="uppercase text-[10px]">
                              {alert.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {new Date(alert.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {alert.status === 'open' && (
                              <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(alert.id)} disabled={ackAlert.isPending}>
                                Acknowledge
                              </Button>
                            )}
                            {alert.status === 'acknowledged' && (
                              <Button size="sm" variant="default" onClick={() => setResolveAlertId(alert.id)}>
                                Resolve
                              </Button>
                            )}
                            {alert.status === 'resolved' && (
                              <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                Resolved
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {!loadingAlerts && alerts?.totalPages && alerts.totalPages > 1 && (
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page === alerts.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!resolveAlertId} onOpenChange={(open) => !open && setResolveAlertId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Resolve Alert</DialogTitle>
            <DialogDescription>
              Provide a resolution reason for this alert before closing it.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="resolution">Resolution Note</Label>
              <Input
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="e.g., False positive, user verified via 2FA..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveAlertId(null)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={!resolution || resAlert.isPending}>Submit Resolution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}