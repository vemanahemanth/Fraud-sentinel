import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard, ShieldCheck, ShieldAlert, Ban,
  ChevronRight, AlertTriangle, Zap, Clock, RotateCcw, Send,
} from "lucide-react";
import { useListTransactions } from "@workspace/api-client-react";

const MERCHANTS = [
  { id: "m1", name: "Amazon Marketplace", category: "E-Commerce", country: "US", city: "Seattle" },
  { id: "m2", name: "TechGadgets Online", category: "Electronics", country: "US", city: "San Francisco" },
  { id: "m3", name: "FoodDelivery Express", category: "Food", country: "US", city: "New York" },
  { id: "m4", name: "LuxuryGoods Direct", category: "Retail", country: "RO", city: "Bucharest" },
  { id: "m5", name: "Crypto Exchange Pro", category: "Finance", country: "NG", city: "Lagos" },
  { id: "m6", name: "QuickCash ATM", category: "ATM/Cash", country: "UA", city: "Kyiv" },
  { id: "m7", name: "TradeHub Global", category: "Finance", country: "SG", city: "Singapore" },
  { id: "m8", name: "OffshoreGaming Ltd", category: "Gambling", country: "BR", city: "São Paulo" },
  { id: "m9", name: "Netflix", category: "Streaming", country: "US", city: "Los Angeles" },
  { id: "m10", name: "Airbnb", category: "Travel", country: "US", city: "San Francisco" },
];

const USERS = [
  { id: "user-sim-001", name: "Marcus Chen", card: "CARD-MC4291" },
  { id: "user-sim-002", name: "Priya Sharma", card: "CARD-PS8812" },
  { id: "user-sim-003", name: "Alex Rivera", card: "CARD-AR3371" },
  { id: "user-sim-004", name: "Sarah Johnson", card: "CARD-SJ9902" },
  { id: "user-sim-005", name: "David Park", card: "CARD-DP1148" },
];

type FormValues = {
  userId: string;
  merchantId: string;
  amount: string;
  currency: string;
};

type ScoringResult = {
  transactionId: string;
  decision: "approved" | "flagged" | "blocked";
  riskScore: number;
  riskLevel: string;
  responseTimeMs: number;
  triggeredRules: string[];
  explanation: string[];
};

async function submitTransaction(body: object): Promise<ScoringResult> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return res.json();
}

export default function TransactionsPage() {
  const [result, setResult] = useState<ScoringResult | null>(null);
  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormValues>({
    defaultValues: { currency: "USD" },
  });

  const qc = useQueryClient();
  const { data: txHistory, isLoading: historyLoading } = useListTransactions({ limit: 20 });

  const mutation = useMutation({
    mutationFn: submitTransaction,
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["listTransactions"] });
    },
  });

  const selectedMerchantId = watch("merchantId");
  const selectedUserId = watch("userId");
  const merchant = MERCHANTS.find((m) => m.id === selectedMerchantId);
  const user = USERS.find((u) => u.id === selectedUserId);

  const onSubmit = (values: FormValues) => {
    if (!merchant || !user) return;
    setResult(null);
    mutation.mutate({
      cardId: user.card,
      userId: user.id,
      merchantId: merchant.id,
      merchantName: merchant.name,
      amount: parseFloat(values.amount),
      currency: values.currency,
      location: { country: merchant.country, city: merchant.city, lat: 0, lng: 0 },
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction Submission</h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">
          Submit a transaction through the fraud engine and inspect the real-time scoring decision.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Form */}
        <Card className="xl:col-span-2 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              New Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Cardholder */}
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase text-muted-foreground">Cardholder</Label>
                <Select onValueChange={(v) => setValue("userId", v)}>
                  <SelectTrigger className="bg-background border-border/60">
                    <SelectValue placeholder="Select cardholder…" />
                  </SelectTrigger>
                  <SelectContent>
                    {USERS.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex flex-col">
                          <span>{u.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">{u.card}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {user && (
                  <p className="text-xs text-muted-foreground font-mono pl-1">
                    Card: {user.card}
                  </p>
                )}
              </div>

              {/* Merchant */}
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase text-muted-foreground">Merchant</Label>
                <Select onValueChange={(v) => setValue("merchantId", v)}>
                  <SelectTrigger className="bg-background border-border/60">
                    <SelectValue placeholder="Select merchant…" />
                  </SelectTrigger>
                  <SelectContent>
                    {MERCHANTS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex flex-col">
                          <span>{m.name}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {m.category} · {m.city}, {m.country}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {merchant && (
                  <div className="flex items-center gap-2 pl-1">
                    <span className="text-xs text-muted-foreground font-mono">{merchant.category}</span>
                    <RiskCountryBadge country={merchant.country} />
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase text-muted-foreground">Amount</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      {...register("amount", {
                        required: "Amount is required",
                        min: { value: 0.01, message: "Must be > 0" },
                        pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Invalid amount" },
                      })}
                      placeholder="0.00"
                      className="pl-7 bg-background border-border/60 font-mono"
                    />
                  </div>
                  <Select onValueChange={(v) => setValue("currency", v)} defaultValue="USD">
                    <SelectTrigger className="w-24 bg-background border-border/60 font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                        <SelectItem key={c} value={c} className="font-mono">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {errors.amount && (
                  <p className="text-xs text-destructive font-mono">{errors.amount.message}</p>
                )}
              </div>

              {/* Quick amounts */}
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase text-muted-foreground">Quick amounts</Label>
                <div className="grid grid-cols-4 gap-2">
                  {["50", "500", "2500", "10000"].map((a) => (
                    <Button
                      key={a}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs border-border/60 hover:border-primary/60 hover:bg-primary/5"
                      onClick={() => setValue("amount", a)}
                    >
                      ${Number(a).toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1 font-mono uppercase tracking-wider"
                  disabled={mutation.isPending || !selectedUserId || !selectedMerchantId}
                >
                  {mutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Scoring…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Submit Transaction
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="border-border/60"
                  onClick={() => { reset(); setResult(null); mutation.reset(); }}
                  title="Reset"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {mutation.isError && (
                <p className="text-xs text-destructive font-mono bg-destructive/10 p-2 rounded border border-destructive/20">
                  Error: {(mutation.error as Error).message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Result panel */}
        <div className="xl:col-span-3 space-y-4">
          {!result && !mutation.isPending && (
            <Card className="border-border/40 bg-card/30 backdrop-blur h-full min-h-[320px] flex items-center justify-center">
              <div className="text-center space-y-3 text-muted-foreground p-8">
                <ShieldCheck className="w-12 h-12 mx-auto opacity-20" />
                <p className="font-mono text-sm">Submit a transaction to see the fraud engine decision</p>
              </div>
            </Card>
          )}

          {mutation.isPending && (
            <Card className="border-border/40 bg-card/30 backdrop-blur min-h-[320px] flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <ShieldCheck className="absolute inset-0 m-auto w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-mono text-sm text-foreground">Analysing transaction…</p>
                  <p className="font-mono text-xs text-muted-foreground">Running 6 fraud detection rules + ML scoring</p>
                </div>
              </div>
            </Card>
          )}

          {result && <ScoringResultCard result={result} />}
        </div>
      </div>

      {/* Transaction History */}
      <Card className="border-border/40 bg-card/50 backdrop-blur">
        <CardHeader className="border-b border-border/40">
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="font-mono text-xs">TXN ID</TableHead>
                <TableHead className="font-mono text-xs">CARD</TableHead>
                <TableHead className="font-mono text-xs">MERCHANT</TableHead>
                <TableHead className="font-mono text-xs">AMOUNT</TableHead>
                <TableHead className="font-mono text-xs">RISK</TableHead>
                <TableHead className="font-mono text-xs">STATUS</TableHead>
                <TableHead className="font-mono text-xs">RULES</TableHead>
                <TableHead className="font-mono text-xs text-right">TIME</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading
                ? Array(6).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border/40">
                    {Array(8).fill(0).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
                : txHistory?.data.map((tx) => (
                  <TableRow key={tx.id} className="border-border/40 hover:bg-accent/10 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">{tx.id.substring(0, 8)}</TableCell>
                    <TableCell className="font-mono text-xs">{tx.cardId}</TableCell>
                    <TableCell className="font-medium text-sm">{tx.merchantName}</TableCell>
                    <TableCell className="font-mono">${tx.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <RiskScoreBadge score={tx.riskScore} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {tx.triggeredRules.length > 0 ? (
                        <span className="text-amber-500 font-mono text-[10px]">
                          {tx.triggeredRules[0]}{tx.triggeredRules.length > 1 ? ` +${tx.triggeredRules.length - 1}` : ""}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px] font-mono">none</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground font-mono">
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

function ScoringResultCard({ result }: { result: ScoringResult }) {
  const isBlocked = result.decision === "blocked";
  const isFlagged = result.decision === "flagged";

  const decisionConfig = {
    blocked: {
      icon: Ban,
      label: "BLOCKED",
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/30",
      glow: "shadow-[0_0_30px_-5px_rgba(220,38,38,0.3)]",
    },
    flagged: {
      icon: AlertTriangle,
      label: "FLAGGED FOR REVIEW",
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      glow: "shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]",
    },
    approved: {
      icon: ShieldCheck,
      label: "APPROVED",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      glow: "shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]",
    },
  }[result.decision];

  const DecisionIcon = decisionConfig.icon;

  const scoreColor =
    result.riskScore >= 80 ? "text-destructive" :
    result.riskScore >= 50 ? "text-amber-500" :
    "text-emerald-500";

  const scoreArcDeg = (result.riskScore / 100) * 180;

  return (
    <Card className={`border ${decisionConfig.border} ${decisionConfig.bg} ${decisionConfig.glow} backdrop-blur`}>
      <CardHeader className={`border-b border-border/40 ${decisionConfig.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${decisionConfig.bg} border ${decisionConfig.border}`}>
            <DecisionIcon className={`w-5 h-5 ${decisionConfig.color}`} />
          </div>
          <div>
            <CardTitle className={`text-lg font-bold font-mono ${decisionConfig.color}`}>
              {decisionConfig.label}
            </CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              TXN: {result.transactionId.substring(0, 16).toUpperCase()}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xs text-muted-foreground font-mono flex items-center gap-1 justify-end">
              <Zap className="w-3 h-3" /> {result.responseTimeMs.toFixed(0)}ms
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Score gauge */}
        <div className="flex items-center gap-8">
          <div className="relative w-36 h-20 flex-shrink-0">
            <svg viewBox="0 0 120 60" className="w-full">
              <path d="M10 55 A50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" />
              <path
                d="M10 55 A50 50 0 0 1 110 55"
                fill="none"
                stroke={result.riskScore >= 80 ? "hsl(var(--destructive))" : result.riskScore >= 50 ? "#f59e0b" : "#10b981"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(result.riskScore / 100) * 157} 157`}
                className="transition-all duration-1000"
              />
              <text x="60" y="52" textAnchor="middle" className={`font-bold ${scoreColor}`} fontSize="20" fill="currentColor">
                {result.riskScore}
              </text>
            </svg>
            <div className="absolute bottom-0 w-full text-center">
              <span className="text-[10px] text-muted-foreground font-mono uppercase">Risk Score</span>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-mono">Risk Level</span>
              <span className={`font-mono font-bold uppercase ${scoreColor}`}>{result.riskLevel}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  result.riskScore >= 80 ? "bg-destructive" : result.riskScore >= 50 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${result.riskScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>0 — Safe</span>
              <span>50 — Medium</span>
              <span>100 — Critical</span>
            </div>
          </div>
        </div>

        {/* Triggered rules */}
        {result.triggeredRules.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase text-muted-foreground">Rules Triggered ({result.triggeredRules.length})</p>
            <div className="flex flex-wrap gap-2">
              {result.triggeredRules.map((rule) => (
                <Badge key={rule} variant="outline" className="font-mono text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/5">
                  <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                  {rule}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        {result.explanation.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase text-muted-foreground">Fraud Engine Explanation</p>
            <ul className="space-y-1.5">
              {result.explanation.map((line, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <ChevronRight className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-muted-foreground font-mono leading-relaxed">{line}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isBlocked && (
          <div className="p-3 rounded border border-destructive/20 bg-destructive/5 text-xs font-mono text-destructive">
            Transaction has been blocked and not processed. Card activity recorded for review.
          </div>
        )}
        {isFlagged && (
          <div className="p-3 rounded border border-amber-500/20 bg-amber-500/5 text-xs font-mono text-amber-400">
            Transaction flagged for manual review. Temporary hold applied pending investigator approval.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiskScoreBadge({ score }: { score: number }) {
  return (
    <Badge
      variant="outline"
      className={`font-mono text-xs ${
        score >= 80 ? "border-destructive text-destructive" :
        score >= 50 ? "border-amber-500 text-amber-500" :
        "border-emerald-500 text-emerald-500"
      }`}
    >
      {score}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant={status === "blocked" ? "destructive" : status === "flagged" ? "default" : "secondary"}
      className="uppercase text-[10px] font-mono"
    >
      {status}
    </Badge>
  );
}

function RiskCountryBadge({ country }: { country: string }) {
  const HIGH_RISK = ["NG", "RO", "UA", "BR", "CO", "VE", "KP"];
  if (!HIGH_RISK.includes(country)) return null;
  return (
    <Badge variant="outline" className="font-mono text-[10px] border-destructive/40 text-destructive bg-destructive/5">
      <AlertTriangle className="w-2.5 h-2.5 mr-1" />
      High-risk country
    </Badge>
  );
}
