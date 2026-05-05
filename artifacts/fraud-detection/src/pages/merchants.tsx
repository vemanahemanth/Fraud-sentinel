import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useListMerchants, useBlockMerchant, useUnblockMerchant, getListMerchantsQueryKey } from "@workspace/api-client-react";
import { Store, Ban, ShieldCheck, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";

export default function MerchantsManager() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data: merchants, isLoading } = useListMerchants({ page, limit: 20, search: search || undefined });
  
  const queryClient = useQueryClient();
  const blockMerchant = useBlockMerchant();
  const unblockMerchant = useUnblockMerchant();

  const handleBlock = (id: string) => {
    const reason = prompt("Enter reason for blocking:");
    if (reason) {
      blockMerchant.mutate({ id, data: { reason } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListMerchantsQueryKey() });
        }
      });
    }
  };

  const handleUnblock = (id: string) => {
    unblockMerchant.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMerchantsQueryKey() });
      }
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merchant Control</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">ENTITY BLACKLISTS & MONITORING</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Merchant
        </Button>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur flex-1">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Store className="w-4 h-4 text-primary" />
              Monitored Merchants
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search merchants..." 
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
                  <TableHead className="font-mono text-xs w-[120px]">MERCHANT ID</TableHead>
                  <TableHead className="font-mono text-xs">NAME</TableHead>
                  <TableHead className="font-mono text-xs">CATEGORY</TableHead>
                  <TableHead className="font-mono text-xs">COUNTRY</TableHead>
                  <TableHead className="font-mono text-xs">STATUS</TableHead>
                  <TableHead className="font-mono text-xs text-right">FRAUD RATE</TableHead>
                  <TableHead className="font-mono text-xs text-right">TOTAL TXS</TableHead>
                  <TableHead className="font-mono text-xs text-right w-[100px]">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(10).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  merchants?.data.map((merchant) => (
                    <TableRow key={merchant.id} className={`border-border/40 ${merchant.status === 'blocked' ? 'bg-destructive/5' : ''}`}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{merchant.id.substring(0, 8)}</TableCell>
                      <TableCell className="font-medium text-sm">
                        {merchant.name}
                        {merchant.blockedReason && (
                          <div className="text-[10px] text-destructive mt-1">{merchant.blockedReason}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{merchant.category}</TableCell>
                      <TableCell className="text-sm">{merchant.country}</TableCell>
                      <TableCell>
                        <Badge variant={
                          merchant.status === 'blocked' ? 'destructive' : 
                          merchant.status === 'flagged' ? 'secondary' : 'outline'
                        } className="uppercase text-[10px]">
                          {merchant.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        <span className={merchant.fraudRate > 5 ? 'text-destructive' : merchant.fraudRate > 2 ? 'text-amber-500' : 'text-emerald-500'}>
                          {merchant.fraudRate.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{merchant.totalTransactions.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {merchant.status !== 'blocked' ? (
                          <Button size="sm" variant="destructive" className="h-8 w-full" onClick={() => handleBlock(merchant.id)} disabled={blockMerchant.isPending}>
                            Block
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" className="h-8 w-full" onClick={() => handleUnblock(merchant.id)} disabled={unblockMerchant.isPending}>
                            Unblock
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