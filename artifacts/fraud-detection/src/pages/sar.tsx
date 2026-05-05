import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useListSARs, useSubmitSAR, getListSARsQueryKey } from "@workspace/api-client-react";
import { FileText, Plus, Send } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function SARPortal() {
  const [page, setPage] = useState(1);
  const { data: sars, isLoading } = useListSARs({ page, limit: 20 });
  const submitSAR = useSubmitSAR();
  const queryClient = useQueryClient();

  const handleSubmit = (id: string) => {
    submitSAR.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSARsQueryKey() });
      }
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SAR Filing Portal</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">SUSPICIOUS ACTIVITY REPORTS</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New SAR Draft
        </Button>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur flex-1">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            SAR Filings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="font-mono text-xs w-[120px]">SAR NUMBER</TableHead>
                  <TableHead className="font-mono text-xs">SUBJECT</TableHead>
                  <TableHead className="font-mono text-xs">ACTIVITY TYPE</TableHead>
                  <TableHead className="font-mono text-xs">STATUS</TableHead>
                  <TableHead className="font-mono text-xs text-right">AMOUNT</TableHead>
                  <TableHead className="font-mono text-xs text-right w-[120px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(10).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  sars?.data.map((sar) => (
                    <TableRow key={sar.id} className="border-border/40 hover:bg-accent/10 transition-colors">
                      <TableCell className="font-mono text-xs text-primary">{sar.sarNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{sar.subjectName}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">{sar.subjectType}</div>
                      </TableCell>
                      <TableCell className="text-sm">{sar.suspiciousActivityType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>
                        <Badge variant={
                          sar.status === 'draft' ? 'outline' : 
                          sar.status === 'submitted' ? 'secondary' : 
                          sar.status === 'accepted' ? 'default' : 'destructive'
                        } className={`uppercase text-[10px] ${sar.status === 'accepted' ? 'bg-emerald-500 text-white' : ''}`}>
                          {sar.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">${sar.amountInvolved.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {sar.status === 'draft' && (
                          <Button size="sm" variant="outline" className="h-8 w-full" onClick={() => handleSubmit(sar.id)} disabled={submitSAR.isPending}>
                            <Send className="w-3 h-3 mr-2" />
                            Submit
                          </Button>
                        )}
                        {sar.status !== 'draft' && (
                          <Button size="sm" variant="ghost" className="h-8 w-full text-muted-foreground">
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}