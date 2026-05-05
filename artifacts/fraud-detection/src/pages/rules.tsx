import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useListRules, useToggleRule, useDeleteRule, getListRulesQueryKey } from "@workspace/api-client-react";
import { ShieldCheck, Plus, Settings2, Trash2, Edit } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function RulesBuilder() {
  const { data: rules, isLoading } = useListRules();
  const queryClient = useQueryClient();
  const toggleRule = useToggleRule();
  const deleteRule = useDeleteRule();

  const handleToggle = (id: string, currentEnabled: boolean) => {
    toggleRule.mutate({ id, data: { enabled: !currentEnabled } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRulesQueryKey() });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      deleteRule.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRulesQueryKey() });
        }
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rule Engine</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">FRAUD DETECTION POLICIES</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Rule
        </Button>
      </div>

      <Card className="border-border/40 bg-card/50 backdrop-blur flex-1">
        <CardHeader>
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-primary" />
            Configured Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead className="font-mono text-xs w-[60px]">STATUS</TableHead>
                  <TableHead className="font-mono text-xs w-[100px]">TYPE</TableHead>
                  <TableHead className="font-mono text-xs">NAME & DESCRIPTION</TableHead>
                  <TableHead className="font-mono text-xs">ACTION</TableHead>
                  <TableHead className="font-mono text-xs text-right">TRIGGER COUNT</TableHead>
                  <TableHead className="font-mono text-xs text-right w-[100px]">MANAGE</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i} className="border-border/40">
                      <TableCell><Skeleton className="h-6 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-64" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : rules?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      <ShieldCheck className="mx-auto h-8 w-8 mb-2 opacity-50" />
                      No rules configured
                    </TableCell>
                  </TableRow>
                ) : (
                  rules?.map((rule) => (
                    <TableRow key={rule.id} className={`border-border/40 ${!rule.enabled ? 'opacity-60' : ''}`}>
                      <TableCell>
                        <Switch 
                          checked={rule.enabled} 
                          onCheckedChange={() => handleToggle(rule.id, rule.enabled)}
                          disabled={toggleRule.isPending}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-[10px] bg-background">
                          {rule.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{rule.name}</div>
                        <div className="text-xs text-muted-foreground">{rule.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          rule.action === 'block' ? 'destructive' : 
                          rule.action === 'flag' ? 'secondary' : 'default'
                        } className="uppercase text-[10px]">
                          {rule.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {rule.triggeredCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(rule.id)}>
                            <Trash2 className="h-4 w-4" />
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