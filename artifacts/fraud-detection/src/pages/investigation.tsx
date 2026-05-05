import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useListCases } from "@workspace/api-client-react";
import { History, ShieldAlert, FileText, CheckCircle2, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvestigationTimeline() {
  const { data: cases, isLoading } = useListCases({ limit: 10 });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investigation Timeline</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">CASE HISTORIES & EVENTS</p>
        </div>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur flex-1">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Recent Case Timelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <div className="space-y-8">
              {cases?.data.map((c) => (
                <div key={c.id} className="relative pl-8 border-l-2 border-border/60 pb-8 last:pb-0">
                  <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                  
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-primary">{c.caseNumber}</span>
                    <Badge variant="outline" className="uppercase text-[10px]">{c.status}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="bg-card border border-border/40 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-sm">{c.title}</h4>
                    
                    <div className="flex flex-col space-y-3 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/60 before:to-transparent">
                      {/* Timeline Events Simulator */}
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border border-primary bg-primary/10 text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <ShieldAlert className="h-3 w-3" />
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded border border-border/40 bg-background/50 text-xs text-muted-foreground">
                          Alert Triggered ({c.alertIds?.length || 1} alerts)
                        </div>
                      </div>
                      
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border border-secondary bg-secondary text-secondary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <Clock className="h-3 w-3" />
                        </div>
                        <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded border border-border/40 bg-background/50 text-xs text-muted-foreground">
                          Case Created & Assigned
                        </div>
                      </div>

                      {c.notes && c.notes.length > 0 && (
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-accent bg-accent text-accent-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <FileText className="h-3 w-3" />
                          </div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded border border-border/40 bg-background/50 text-xs text-muted-foreground">
                            Investigator Note Added
                          </div>
                        </div>
                      )}

                      {c.status === 'closed' && (
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                            <CheckCircle2 className="h-3 w-3" />
                          </div>
                          <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-3 rounded border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-500">
                            Case Closed
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}