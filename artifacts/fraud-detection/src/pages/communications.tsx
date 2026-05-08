import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useGetTopRiskUsers } from "@workspace/api-client-react";
import { MessageSquareWarning, Phone, Mail, Ban, AlertTriangle, CheckCircle2, Loader2, ShieldOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

type ActionState = {
  userId: string;
  type: "block" | "email";
  status: "loading" | "success" | "error";
  message?: string;
};

export default function CommunicationsPanel() {
  const { data: users, isLoading } = useGetTopRiskUsers({ limit: 10 });
  const qc = useQueryClient();
  const [actions, setActions] = useState<ActionState[]>([]);

  const getAction = (userId: string, type: "block" | "email") =>
    actions.find((a) => a.userId === userId && a.type === type);

  const setAction = (action: ActionState) =>
    setActions((prev) => {
      const filtered = prev.filter((a) => !(a.userId === action.userId && a.type === action.type));
      return [...filtered, action];
    });

  const clearAction = (userId: string, type: "block" | "email") =>
    setActions((prev) => prev.filter((a) => !(a.userId === userId && a.type === type)));

  const handleBlock = async (userId: string, isBlocked: boolean) => {
    setAction({ userId, type: "block", status: "loading" });
    try {
      const endpoint = isBlocked ? "unblock" : "block";
      const res = await fetch(`/api/users/${userId}/${endpoint}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Request failed");
      }
      setAction({
        userId,
        type: "block",
        status: "success",
        message: isBlocked ? "User unblocked" : "User blocked",
      });
      // Refresh the user list
      qc.invalidateQueries({ queryKey: ["getTopRiskUsers"] });
      // Clear success feedback after 3s
      setTimeout(() => clearAction(userId, "block"), 3000);
    } catch (e) {
      setAction({
        userId,
        type: "block",
        status: "error",
        message: (e as Error).message,
      });
      setTimeout(() => clearAction(userId, "block"), 4000);
    }
  };

  const handleEmail = async (userId: string, userName: string, userEmail: string) => {
    setAction({ userId, type: "email", status: "loading" });
    try {
      const res = await fetch(`/api/users/${userId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Fraud Alert — Suspicious Activity on Your Account",
          message: `Dear ${userName}, we have detected suspicious activity associated with your account. Please review your recent transactions and contact our fraud investigation team if you did not authorise them.`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Request failed");
      }
      const data = await res.json();
      setAction({
        userId,
        type: "email",
        status: "success",
        message: `Sent to ${(data as { email?: string }).email ?? userEmail}`,
      });
      setTimeout(() => clearAction(userId, "email"), 4000);
    } catch (e) {
      setAction({
        userId,
        type: "email",
        status: "error",
        message: (e as Error).message,
      });
      setTimeout(() => clearAction(userId, "email"), 4000);
    }
  };

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
                  <TableHead className="font-mono text-xs text-center">STATUS</TableHead>
                  <TableHead className="font-mono text-xs text-right w-[260px]">INTERVENTION</TableHead>
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
                      <TableCell className="text-center"><Skeleton className="h-6 w-20 mx-auto rounded-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-40 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  users?.map((user) => {
                    const blockAction = getAction(user.id, "block");
                    const emailAction = getAction(user.id, "email");
                    const isBlocked = !!user.blockedAt;

                    return (
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

                        {/* Status column */}
                        <TableCell className="text-center">
                          {isBlocked ? (
                            <Badge variant="destructive" className="uppercase text-[10px] font-mono">
                              <Ban className="w-2.5 h-2.5 mr-1" /> Blocked
                            </Badge>
                          ) : user.flaggedAt ? (
                            <Badge variant="outline" className="border-amber-500 text-amber-500 uppercase text-[10px] font-mono">
                              <AlertTriangle className="w-2.5 h-2.5 mr-1" /> Notified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-border/60 text-muted-foreground uppercase text-[10px] font-mono">
                              Active
                            </Badge>
                          )}
                        </TableCell>

                        {/* Action buttons */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 items-center">
                            {/* Email feedback */}
                            {emailAction?.status === "success" && (
                              <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 animate-in fade-in">
                                <CheckCircle2 className="w-3 h-3" /> {emailAction.message}
                              </span>
                            )}
                            {emailAction?.status === "error" && (
                              <span className="text-[10px] text-destructive font-mono">{emailAction.message}</span>
                            )}

                            {/* Email button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8"
                              disabled={emailAction?.status === "loading"}
                              onClick={() => handleEmail(user.id, user.name, user.email)}
                            >
                              {emailAction?.status === "loading" ? (
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              ) : (
                                <MessageSquareWarning className="h-3 w-3 mr-2" />
                              )}
                              Email
                            </Button>

                            {/* Block feedback */}
                            {blockAction?.status === "success" && (
                              <span className="text-[10px] text-emerald-500 font-mono flex items-center gap-1 animate-in fade-in">
                                <CheckCircle2 className="w-3 h-3" /> {blockAction.message}
                              </span>
                            )}
                            {blockAction?.status === "error" && (
                              <span className="text-[10px] text-destructive font-mono">{blockAction.message}</span>
                            )}

                            {/* Block/Unblock button */}
                            <Button
                              size="sm"
                              variant={isBlocked ? "outline" : "destructive"}
                              className="h-8"
                              disabled={blockAction?.status === "loading"}
                              onClick={() => handleBlock(user.id, isBlocked)}
                            >
                              {blockAction?.status === "loading" ? (
                                <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                              ) : isBlocked ? (
                                <ShieldOff className="h-3 w-3 mr-2" />
                              ) : (
                                <Ban className="h-3 w-3 mr-2" />
                              )}
                              {isBlocked ? "Unblock" : "Block"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}