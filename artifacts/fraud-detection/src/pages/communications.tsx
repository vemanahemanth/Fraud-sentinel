import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useGetTopRiskUsers } from "@workspace/api-client-react";
import { MessageSquareWarning, Phone, Mail, Ban, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CommunicationsPanel() {
  const { data: users, isLoading } = useGetTopRiskUsers({ limit: 10 });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">CUSTOMER OUTREACH & INTERVENTION</p>
        </div>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur flex-1">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            High Risk Entities Requiring Contact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="font-mono text-xs">USER</TableHead>
                  <TableHead className="font-mono text-xs">CONTACT INFO</TableHead>
                  <TableHead className="font-mono text-xs">RISK TIER</TableHead>
                  <TableHead className="font-mono text-xs text-right">TOTAL SPEND</TableHead>
                  <TableHead className="font-mono text-xs text-right w-[200px]">INTERVENTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  users?.map((user) => (
                    <TableRow key={user.id} className="border-border/40 hover:bg-accent/10">
                      <TableCell>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground font-mono">{user.id.substring(0, 8)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {user.phone || "+1 (555) 000-0000"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-destructive text-destructive uppercase text-[10px]">
                          {user.riskTier.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">${user.totalSpend.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8">
                            <MessageSquareWarning className="h-3 w-3 mr-2" /> Email
                          </Button>
                          <Button size="sm" variant="destructive" className="h-8">
                            <Ban className="h-3 w-3 mr-2" /> Block
                          </Button>
                        </div>
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