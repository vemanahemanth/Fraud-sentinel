import { db, transactionsTable, alertsTable } from "@workspace/db";
import { v4 as uuidv4 } from "uuid";
import { broadcast } from "./ws-server";
import { logger } from "./logger";

const MERCHANTS = [
  { id: "m1", name: "Amazon Marketplace", category: "E-Commerce", country: "US" },
  { id: "m2", name: "TechGadgets Online", category: "Electronics", country: "US" },
  { id: "m3", name: "FoodDelivery Express", category: "Food", country: "US" },
  { id: "m4", name: "LuxuryGoods Direct", category: "Retail", country: "RO" },
  { id: "m5", name: "Crypto Exchange Pro", category: "Finance", country: "NG" },
  { id: "m6", name: "QuickCash ATM", category: "ATM/Cash", country: "UA" },
  { id: "m7", name: "TradeHub Global", category: "Finance", country: "SG" },
  { id: "m8", name: "OffshoreGaming Ltd", category: "Gambling", country: "BR" },
  { id: "m9", name: "Netflix", category: "Streaming", country: "US" },
  { id: "m10", name: "Airbnb", category: "Travel", country: "US" },
];

const USER_IDS = [
  "user-sim-001", "user-sim-002", "user-sim-003",
  "user-sim-004", "user-sim-005",
];

const GEO: Record<string, { lat: number; lng: number; city: string }> = {
  US: { lat: 40.71, lng: -74.01, city: "New York" },
  NG: { lat: 6.52, lng: 3.38, city: "Lagos" },
  RO: { lat: 44.43, lng: 26.10, city: "Bucharest" },
  UA: { lat: 50.45, lng: 30.52, city: "Kyiv" },
  BR: { lat: -23.55, lng: -46.63, city: "São Paulo" },
  SG: { lat: 1.35, lng: 103.82, city: "Singapore" },
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function computeRisk(merchant: typeof MERCHANTS[0], amount: number): { score: number; level: string; status: string; rules: string[] } {
  let score = 5 + Math.floor(Math.random() * 20);
  const rules: string[] = [];

  if (["NG", "RO", "UA", "BR"].includes(merchant.country)) {
    score += 30;
    rules.push("GEO_HIGH_RISK_COUNTRY");
  }
  if (amount > 5000) {
    score += 25;
    rules.push("HIGH_AMOUNT_THRESHOLD");
  }
  if (merchant.category === "Gambling") {
    score += 35;
    rules.push("GAMBLING_MERCHANT");
  }
  if (merchant.category === "Finance" && merchant.country !== "SG") {
    score += 20;
    rules.push("SUSPICIOUS_FINANCE_MERCHANT");
  }
  if (Math.random() < 0.08) {
    score += 40;
    rules.push("ML_ANOMALY_DETECTED");
  }

  score = Math.min(score, 99);

  let level = "low";
  let status = "approved";

  if (score >= 80) { level = "critical"; status = Math.random() < 0.7 ? "blocked" : "flagged"; }
  else if (score >= 60) { level = "high"; status = Math.random() < 0.4 ? "flagged" : "approved"; }
  else if (score >= 40) { level = "medium"; }

  return { score, level, status, rules };
}

async function generateTransaction(): Promise<void> {
  const merchant = pick(MERCHANTS);
  const userId = pick(USER_IDS);
  const amount = parseFloat((Math.random() * 4800 + 5).toFixed(2));
  const { score, level, status, rules } = computeRisk(merchant, amount);
  const geo = GEO[merchant.country] ?? GEO["US"]!;

  const txId = uuidv4();
  const now = new Date();

  const tx = {
    id: txId,
    cardId: `CARD-${userId.slice(-3).toUpperCase()}X`,
    userId,
    merchantId: merchant.id,
    merchantName: merchant.name,
    amount,
    currency: "USD",
    status,
    riskScore: score,
    riskLevel: level,
    country: merchant.country,
    city: geo.city,
    lat: geo.lat + (Math.random() - 0.5) * 0.1,
    lng: geo.lng + (Math.random() - 0.5) * 0.1,
    triggeredRules: rules,
    responseTime: 12 + Math.random() * 50,
    createdAt: now,
  };

  try {
    await db.insert(transactionsTable).values(tx);

    broadcast({ type: "transaction", data: tx });

    if (score >= 70) {
      const alertId = uuidv4();
      const severityMap: Record<string, string> = { critical: "critical", high: "high", medium: "warning" };
      const severity = severityMap[level] ?? "warning";

      const alertTypeMap: Record<string, string> = {
        ML_ANOMALY_DETECTED: "ml_anomaly",
        GEO_HIGH_RISK_COUNTRY: "geo_anomaly",
        HIGH_AMOUNT_THRESHOLD: "amount_threshold",
        GAMBLING_MERCHANT: "pattern_match",
        SUSPICIOUS_FINANCE_MERCHANT: "pattern_match",
      };
      const alertType = alertTypeMap[rules[0] ?? ""] ?? "pattern_match";

      const titleMap: Record<string, string> = {
        ml_anomaly: `ML Anomaly detected — score ${score}/100`,
        geo_anomaly: `Geo Risk: transaction in ${geo.city} (${merchant.country})`,
        amount_threshold: `High amount $${amount.toFixed(0)} at ${merchant.name}`,
        pattern_match: `Suspicious pattern at ${merchant.name}`,
      };

      const alert = {
        id: alertId,
        transactionId: txId,
        userId,
        type: alertType,
        severity,
        status: "open",
        title: titleMap[alertType] ?? "Fraud alert triggered",
        description: `Rules triggered: ${rules.join(", ")}. Risk score: ${score}.`,
      };

      await db.insert(alertsTable).values(alert);
      broadcast({ type: "alert", data: alert });
    }
  } catch (err) {
    logger.warn({ err }, "Simulator insert failed");
  }
}

let simulatorInterval: ReturnType<typeof setInterval> | null = null;

export function startTransactionSimulator(): void {
  if (simulatorInterval) return;

  const tick = () => {
    generateTransaction().catch((err) => logger.warn({ err }, "Simulator tick failed"));
  };

  tick();

  simulatorInterval = setInterval(() => {
    const delay = 1500 + Math.random() * 3500;
    setTimeout(tick, delay);
  }, 4000);

  logger.info("Transaction simulator started");
}

export function stopTransactionSimulator(): void {
  if (simulatorInterval) {
    clearInterval(simulatorInterval);
    simulatorInterval = null;
  }
}
