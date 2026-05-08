import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  ChevronRight, AlertTriangle, Zap, Clock, RotateCcw,
  Send, Skull, Globe, Dices, TrendingUp, Landmark, ShoppingBag,
} from "lucide-react";
import { useListTransactions } from "@workspace/api-client-react";

const MERCHANTS = [
  { id: "m1",  name: "Amazon Marketplace",  category: "E-Commerce",  country: "US", city: "Seattle"       },
  { id: "m2",  name: "TechGadgets Online",   category: "Electronics", country: "US", city: "San Francisco" },
  { id: "m3",  name: "FoodDelivery Express", category: "Food",        country: "US", city: "New York"      },
  { id: "m4",  name: "LuxuryGoods Direct",   category: "Retail",      country: "RO", city: "Bucharest"     },
  { id: "m5",  name: "Crypto Exchange Pro",  category: "Finance",     country: "NG", city: "Lagos"         },
  { id: "m6",  name: "QuickCash ATM",        category: "ATM/Cash",    country: "UA", city: "Kyiv"          },
  { id: "m7",  name: "TradeHub Global",      category: "Finance",     country: "SG", city: "Singapore"     },
  { id: "m8",  name: "OffshoreGaming Ltd",   category: "Gambling",    country: "BR", city: "São Paulo"     },
  { id: "m9",  name: "Netflix",              category: "Streaming",   country: "US", city: "Los Angeles"   },
  { id: "m10", name: "Airbnb",               category: "Travel",      country: "US", city: "San Francisco" },
];

const USERS = [
  { id: "user-sim-001", name: "Marcus Chen",   card: "CARD-MC4291" },
  { id: "user-sim-002", name: "Priya Sharma",  card: "CARD-PS8812" },
  { id: "user-sim-003", name: "Alex Rivera",   card: "CARD-AR3371" },
  { id: "user-sim-004", name: "Sarah Johnson", card: "CARD-SJ9902" },
  { id: "user-sim-005", name: "David Park",    card: "CARD-DP1148" },
];

type Scenario = {
  id: string;
  label: string;
  description: string;
  tags: string[];
  icon: React.ElementType;
  iconColor: string;
  borderColor: string;
  userId: string;
  merchantId: string;
  amount: string;
  currency: string;
  expectedOutcome: "blocked" | "flagged";
};

const FRAUD_SCENARIOS: Scenario[] = [
  {
    id: "crypto-drain",
    label: "Crypto Drain",
    description: "High-value transfer to Nigerian crypto exchange — triggers geo + amount + finance rules.",
    tags: ["GEO_HIGH_RISK_COUNTRY", "HIGH_AMOUNT_THRESHOLD", "SUSPICIOUS_FINANCE_MERCHANT"],
    icon: Skull,
    iconColor: "text-destructive",
    borderColor: "border-destructive/40",
    userId: "user-sim-002",
    merchantId: "m5",
    amount: "12500",
    currency: "USD",
    expectedOutcome: "blocked",
  },
  {
    id: "offshore-gambling",
    label: "Offshore Gambling",
    description: "Large stake at Brazilian gambling site — triggers gambling + geo + amount rules.",
    tags: ["GAMBLING_MERCHANT", "GEO_HIGH_RISK_COUNTRY", "HIGH_AMOUNT_THRESHOLD"],
    icon: Dices,
    iconColor: "text-destructive",
    borderColor: "border-destructive/40",
    userId: "user-sim-001",
    merchantId: "m8",
    amount: "8750",
    currency: "USD",
    expectedOutcome: "blocked",
  },
  {
    id: "atm-cash-out",
    label: "ATM Cash-Out",
    description: "Rapid cash withdrawal at a Ukrainian ATM — high-risk country flag.",
    tags: ["GEO_HIGH_RISK_COUNTRY"],
    icon: Landmark,
    iconColor: "text-orange-500",
    borderColor: "border-orange-500/40",
    userId: "user-sim-004",
    merchantId: "m6",
    amount: "3000",
    currency: "USD",
    expectedOutcome: "flagged",
  },
  {
    id: "luxury-takeover",
    label: "Account Takeover",
    description: "Stolen credentials used for luxury purchase in Romania — geo + high amount.",
    tags: ["GEO_HIGH_RISK_COUNTRY", "HIGH_AMOUNT_THRESHOLD"],
    icon: ShoppingBag,
    iconColor: "text-destructive",
    borderColor: "border-destructive/40",
    userId: "user-sim-005",
    merchantId: "m4",
    amount: "15000",
    currency: "USD",
    expectedOutcome: "blocked",
  },
  {
    id: "trade-launder",
    label: "Trade-Based Laundering",
    description: "Just-under-reporting threshold transfer to offshore trade hub.",
    tags: ["HIGH_AMOUNT_THRESHOLD", "SUSPICIOUS_FINANCE_MERCHANT"],
    icon: TrendingUp,
    iconColor: "text-orange-500",
    borderColor: "border-orange-500/40",
    userId: "user-sim-003",
    merchantId: "m7",
    amount: "9500",
    currency: "USD",
    expectedOutcome: "flagged",
  },
  {
    id: "geo-anomaly",
    label: "Impossible Travel",
    description: "Transaction from Lagos minutes after a New York charge — geo velocity breach.",
    tags: ["GEO_HIGH_RISK_COUNTRY"],
    icon: Globe,
    iconColor: "text-orange-500",
    borderColor: "border-orange-500/40",
    userId: "user-sim-001",
    merchantId: "m5",
    amount: "450",
    currency: "USD",
    expectedOutcome: "flagged",
  },
];

type FormValues = { userId: string; merchantId: string; amount: string; currency: string };

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
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  const [selUserId, setSelUserId] = useState("");
  const [selMerchantId, setSelMerchantId] = useState("");

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<FormValues>({
    defaultValues: { currency: "USD" },
  });

  const qc = useQueryClient();
  const { data: txHistory, isLoading: historyLoading } = useListTransactions({ limit: 25 });

  const mutation = useMutation({
    mutationFn: submitTransaction,
    onSuccess: (data) => {
      setResult(data);
      qc.invalidateQueries({ queryKey: ["listTransactions"] });
    },
  });

  const merchant = MERCHANTS.find((m) => m.id === selMerchantId);
  const user = USERS.find((u) => u.id === selUserId);

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

  const fireScenario = (s: Scenario) => {
    setActiveScenario(s.id);
    setResult(null);
    setSelUserId(s.userId);
    setSelMerchantId(s.merchantId);
    setValue("userId", s.userId);
    setValue("merchantId", s.merchantId);
    setValue("amount", s.amount);
    setValue("currency", s.currency);

    const u = USERS.find((u) => u.id === s.userId)!;
    const m = MERCHANTS.find((m) => m.id === s.merchantId)!;

    mutation.mutate({
      cardId: u.card,
      userId: u.id,
      merchantId: m.id,
      merchantName: m.name,
      amount: parseFloat(s.amount),
      currency: s.currency,
      location: { country: m.country, city: m.city, lat: 0, lng: 0 },
    });
  };

  const handleReset = () => {
    reset();
    setSelUserId("");
    setSelMerchantId("");
    setResult(null);
    setActiveScenario(null);
    mutation.reset();
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transaction Submission</h1>
        <p className="text-muted-foreground font-mono text-sm mt-1">
          Submit transactions through the fraud engine — use scenarios to instantly trigger fraud detection.
        </p>
      </div>

      {/* ── Fraud Scenarios ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-destructive" />
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Fraud Scenarios — one-click simulation
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FRAUD_SCENARIOS.map((s) => {
            const Icon = s.icon;
            const isActive = activeScenario === s.id && mutation.isPending;
            return (
              <button
                key={s.id}
                onClick={() => fireScenario(s)}
                disabled={mutation.isPending}
                className={`text-left p-4 rounded-lg border bg-card/50 backdrop-blur transition-all duration-200
                  hover:bg-card hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
                  ${activeScenario === s.id ? s.borderColor + " bg-card/80" : "border-border/40 hover:" + s.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 p-1.5 rounded-md bg-card border border-border/60`}>
                    {isActive ? (
                      <span className={`w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin block ${s.iconColor}`} />
                    ) : (
                      <Icon className={`w-4 h-4 ${s.iconColor}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground">{s.label}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono uppercase px-1.5 py-0 ${
                          s.expectedOutcome === "blocked"
                            ? "border-destructive/50 text-destructive"
                            : "border-amber-500/50 text-amber-500"
                        }`}
                      >
                        {s.expectedOutcome === "blocked" ? <Ban className="w-2 h-2 mr-1 inline" /> : <AlertTriangle className="w-2 h-2 mr-1 inline" />}
                        {s.expectedOutcome}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{s.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {s.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[9px] font-mono bg-secondary/60 text-muted-foreground px-1.5 py-0.5 rounded">
                          {t}
                        </span>
                      ))}
                      {s.tags.length > 2 && (
                        <span className="text-[9px] font-mono text-muted-foreground">+{s.tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1 bg-border/40" />
        <span className="text-xs font-mono text-muted-foreground uppercase">or build manually</span>
        <Separator className="flex-1 bg-border/40" />
      </div>

      {/* ── Manual Form + Result ─────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 border-border/40 bg-card/50 backdrop-blur">
          <CardHeader className="border-b border-border/40">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Custom Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase text-muted-foreground">Cardholder</Label>
                <Select value={selUserId} onValueChange={(v) => { setSelUserId(v); setValue("userId", v); }}>
                  <SelectTrigger className="bg-background border-border/60">
                    <SelectValue placeholder="Select cardholder…" />
                  </SelectTrigger>
                  <SelectContent>
                    {USERS.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span>{u.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">{u.card}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {user && <p className="text-xs text-muted-foreground font-mono pl-1">Card: {user.card}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase text-muted-foreground">Merchant</Label>
                <Select value={selMerchantId} onValueChange={(v) => { setSelMerchantId(v); setValue("merchantId", v); }}>
                  <SelectTrigger className="bg-background border-border/60">
                    <SelectValue placeholder="Select merchant…" />
                  </SelectTrigger>
                  <SelectContent>
                    {MERCHANTS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        <span>{m.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground font-mono">{m.category} · {m.country}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {merchant && (
                  <div className="flex items-center gap-2 pl-1">
                    <span className="text-xs text-muted-foreground font-mono">{merchant.category} · {merchant.city}</span>
                    <RiskCountryBadge country={merchant.country} />
                  </div>
                )}
              </div>

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
                {errors.amount && <p className="text-xs text-destructive font-mono">{errors.amount.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono uppercase text-muted-foreground">Quick amounts</Label>
                <div className="grid grid-cols-4 gap-2">
                  {["50", "500", "5000", "12000"].map((a) => (
                    <Button key={a} type="button" variant="outline" size="sm"
                      className="font-mono text-xs border-border/60 hover:border-primary/60 hover:bg-primary/5"
                      onClick={() => setValue("amount", a)}>
                      ${Number(a).toLocaleString()}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator className="bg-border/40" />

              <div className="flex gap-2">
                <Button type="submit"
                  className="flex-1 font-mono uppercase tracking-wider"
                  disabled={mutation.isPending || !selUserId || !selMerchantId}>
                  {mutation.isPending && !activeScenario ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Scoring…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2"><Send className="w-4 h-4" />Submit</span>
                  )}
                </Button>
                <Button type="button" variant="outline" size="icon" className="border-border/60" onClick={handleReset} title="Reset">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>

              {mutation.isError && (
                <p className="text-xs text-destructive font-mono bg-destructive/10 p-2 rounded border border-destructive/20">
                  {(mutation.error as Error).message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Result */}
        <div className="xl:col-span-3">
          {!result && !mutation.isPending && (
            <Card className="border-border/40 bg-card/30 backdrop-blur h-full min-h-[420px] flex items-center justify-center">
              <div className="text-center space-y-3 text-muted-foreground p-8">
                <ShieldCheck className="w-14 h-14 mx-auto opacity-15" />
                <p className="font-mono text-sm">Click a fraud scenario or submit a custom transaction</p>
                <p className="font-mono text-xs opacity-60">The engine runs 6 rules + ML scoring in real-time</p>
              </div>
            </Card>
          )}

          {mutation.isPending && (
            <Card className="border-border/40 bg-card/30 backdrop-blur min-h-[420px] flex items-center justify-center">
              <div className="text-center space-y-5 p-8">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                  <div className="absolute inset-0 rounded-full border-2 border-primary/10 animate-ping" style={{ animationDelay: "0.3s" }} />
                  <div className="absolute inset-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <ShieldCheck className="absolute inset-0 m-auto w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-mono text-sm text-foreground">Analysing transaction…</p>
                  <p className="font-mono text-xs text-muted-foreground mt-1">
                    {activeScenario
                      ? `Running scenario: ${FRAUD_SCENARIOS.find(s => s.id === activeScenario)?.label}`
                      : "Running fraud detection rules + ML scoring"}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {result && <ScoringResultCard result={result} />}
        </div>
      </div>

      {/* ── Transaction History ──────────────────────────────────── */}
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
                      {Array(8).fill(0).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>)}
                    </TableRow>
                  ))
                : txHistory?.data.map((tx) => (
                    <TableRow key={tx.id} className="border-border/40 hover:bg-accent/10 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">{tx.id.substring(0, 8)}</TableCell>
                      <TableCell className="font-mono text-xs">{tx.cardId}</TableCell>
                      <TableCell className="font-medium text-sm">{tx.merchantName}</TableCell>
                      <TableCell className="font-mono">${tx.amount.toFixed(2)}</TableCell>
                      <TableCell><RiskScoreBadge score={tx.riskScore} /></TableCell>
                      <TableCell><StatusBadge status={tx.status} /></TableCell>
                      <TableCell className="text-xs max-w-[180px]">
                        {tx.triggeredRules.length > 0 ? (
                          <span className="text-amber-500 font-mono text-[10px]">
                            {tx.triggeredRules[0]}{tx.triggeredRules.length > 1 ? ` +${tx.triggeredRules.length - 1}` : ""}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[10px] font-mono">—</span>
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

/* ── Sub-components ──────────────────────────────────────────────── */

function ScoringResultCard({ result }: { result: ScoringResult }) {
  const isBlocked = result.decision === "blocked";
  const isFlagged = result.decision === "flagged";

  const cfgMap: Record<string, { icon: React.ElementType; label: string; color: string; bg: string; border: string; glow: string }> = {
    blocked: {
      icon: Ban, label: "BLOCKED", color: "text-destructive",
      bg: "bg-destructive/10", border: "border-destructive/30",
      glow: "shadow-[0_0_35px_-5px_rgba(220,38,38,0.35)]",
    },
    flagged: {
      icon: AlertTriangle, label: "FLAGGED FOR REVIEW", color: "text-amber-500",
      bg: "bg-amber-500/10", border: "border-amber-500/30",
      glow: "shadow-[0_0_35px_-5px_rgba(245,158,11,0.25)]",
    },
    approved: {
      icon: ShieldCheck, label: "APPROVED", color: "text-emerald-500",
      bg: "bg-emerald-500/10", border: "border-emerald-500/30",
      glow: "shadow-[0_0_35px_-5px_rgba(16,185,129,0.2)]",
    },
    allow: {
      icon: ShieldCheck, label: "ALLOWED", color: "text-emerald-500",
      bg: "bg-emerald-500/10", border: "border-emerald-500/30",
      glow: "shadow-[0_0_35px_-5px_rgba(16,185,129,0.2)]",
    },
    challenge_2fa: {
      icon: AlertTriangle, label: "2FA CHALLENGE", color: "text-amber-500",
      bg: "bg-amber-500/10", border: "border-amber-500/30",
      glow: "shadow-[0_0_35px_-5px_rgba(245,158,11,0.25)]",
    },
  };
  const cfg = cfgMap[result.decision] ?? {
    icon: ShieldCheck, label: result.decision?.toUpperCase() ?? "PROCESSED", color: "text-muted-foreground",
    bg: "bg-muted/20", border: "border-border/40", glow: "",
  };

  const DecisionIcon = cfg.icon;
  const scoreColor = result.riskScore >= 80 ? "text-destructive" : result.riskScore >= 50 ? "text-amber-500" : "text-emerald-500";
  const barColor  = result.riskScore >= 80 ? "bg-destructive"    : result.riskScore >= 50 ? "bg-amber-500"    : "bg-emerald-500";
  const arcColor  = result.riskScore >= 80 ? "hsl(var(--destructive))" : result.riskScore >= 50 ? "#f59e0b" : "#10b981";

  return (
    <Card className={`border ${cfg.border} ${cfg.bg} ${cfg.glow} backdrop-blur`}>
      <CardHeader className={`border-b border-border/40 ${cfg.bg}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-full border ${cfg.border} ${cfg.bg}`}>
            <DecisionIcon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <CardTitle className={`text-xl font-bold font-mono ${cfg.color}`}>{cfg.label}</CardTitle>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              TXN: {result.transactionId.substring(0, 20).toUpperCase()}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <Zap className="w-3 h-3" />{result.responseTimeMs.toFixed(0)}ms
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Gauge + bar */}
        <div className="flex items-center gap-8">
          <div className="relative w-40 h-22 flex-shrink-0">
            <svg viewBox="0 0 120 65" className="w-full">
              <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" />
              <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={arcColor}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(result.riskScore / 100) * 157} 157`}
                className="transition-all duration-1000" />
              <text x="60" y="56" textAnchor="middle" fontSize="22" fontWeight="bold" fill={arcColor}>
                {result.riskScore}
              </text>
              <text x="60" y="63" textAnchor="middle" fontSize="7" fill="hsl(var(--muted-foreground))">
                RISK SCORE
              </text>
            </svg>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-mono">Risk Level</span>
              <span className={`font-mono font-bold uppercase ${scoreColor}`}>{result.riskLevel}</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                style={{ width: `${result.riskScore}%` }} />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>0 Safe</span><span>50 Med</span><span>100 Critical</span>
            </div>

            <div className="pt-1 grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-card/60 border border-border/40">
                <div className="text-muted-foreground text-[10px] uppercase">Rules Hit</div>
                <div className="font-bold text-foreground mt-0.5">{result.triggeredRules.length}</div>
              </div>
              <div className="p-2 rounded bg-card/60 border border-border/40">
                <div className="text-muted-foreground text-[10px] uppercase">Response</div>
                <div className="font-bold text-foreground mt-0.5">{result.responseTimeMs.toFixed(0)}ms</div>
              </div>
            </div>
          </div>
        </div>

        {/* Triggered rules */}
        {result.triggeredRules.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider">
              Rules Triggered ({result.triggeredRules.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {result.triggeredRules.map((rule) => (
                <Badge key={rule} variant="outline"
                  className="font-mono text-[10px] border-amber-500/40 text-amber-400 bg-amber-500/5 px-2 py-1">
                  <AlertTriangle className="w-2.5 h-2.5 mr-1.5" />{rule}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        {Array.isArray(result.explanation) && result.explanation.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase text-muted-foreground tracking-wider">Engine Explanation</p>
            <ul className="space-y-1.5 border border-border/30 rounded-md p-3 bg-card/40">
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
          <div className="p-3 rounded-md border border-destructive/25 bg-destructive/8 text-xs font-mono text-destructive flex items-start gap-2">
            <Ban className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Transaction blocked. Card activity logged for investigator review.
          </div>
        )}
        {isFlagged && (
          <div className="p-3 rounded-md border border-amber-500/25 bg-amber-500/8 text-xs font-mono text-amber-400 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Flagged for manual review. Temporary hold applied pending investigator approval.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RiskScoreBadge({ score }: { score: number }) {
  return (
    <Badge variant="outline" className={`font-mono text-xs ${
      score >= 80 ? "border-destructive text-destructive" :
      score >= 50 ? "border-amber-500 text-amber-500" :
      "border-emerald-500 text-emerald-500"
    }`}>{score}</Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={status === "blocked" ? "destructive" : status === "flagged" ? "default" : "secondary"}
      className="uppercase text-[10px] font-mono">
      {status}
    </Badge>
  );
}

function RiskCountryBadge({ country }: { country: string }) {
  const HIGH_RISK = ["NG", "RO", "UA", "BR", "CO", "VE", "KP"];
  if (!HIGH_RISK.includes(country)) return null;
  return (
    <Badge variant="outline" className="font-mono text-[9px] border-destructive/40 text-destructive bg-destructive/5 px-1.5 py-0">
      <AlertTriangle className="w-2.5 h-2.5 mr-1" />High-risk country
    </Badge>
  );
}
