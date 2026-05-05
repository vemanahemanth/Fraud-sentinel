import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useListUsers } from "@workspace/api-client-react";
import { Users, ShieldAlert, Activity, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function UsersScoring() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data: users, isLoading } = useListUsers({ page, limit: 20, search: search || undefined });

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Risk Scoring</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">BEHAVIORAL & ENTITY ANALYSIS</p>
        </div>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur flex-1">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              User Entities
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  className="pl-8 bg-background" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="font-mono text-xs w-[120px]">USER ID</TableHead>
                  <TableHead className="font-mono text-xs">NAME / EMAIL</TableHead>
                  <TableHead className="font-mono text-xs">RISK TIER</TableHead>
                  <TableHead className="font-mono text-xs text-right">RISK SCORE</TableHead>
                  <TableHead className="font-mono text-xs text-right">TOTAL TXS</TableHead>
                  <TableHead className="font-mono text-xs text-right">FRAUD TXS</TableHead>
                  <TableHead className="font-mono text-xs text-right">TOTAL SPEND</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(10).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  users?.data.map((user) => (
                    <TableRow key={user.id} className="border-border/40 hover:bg-accent/10 cursor-pointer transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">{user.id.substring(0, 8)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`uppercase text-[10px] ${
                          user.riskTier === 'very_high' ? 'border-destructive text-destructive' : 
                          user.riskTier === 'high' ? 'border-amber-500 text-amber-500' :
                          user.riskTier === 'medium' ? 'border-blue-500 text-blue-500' : 'border-emerald-500 text-emerald-500'
                        }`}>
                          {user.riskTier.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <span className={user.riskScore > 80 ? 'text-destructive' : user.riskScore > 50 ? 'text-amber-500' : 'text-emerald-500'}>
                          {user.riskScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{user.totalTransactions}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-destructive">{user.fraudulentTransactions}</TableCell>
                      <TableCell className="text-right font-mono text-sm">${user.totalSpend.toLocaleString()}</TableCell>
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