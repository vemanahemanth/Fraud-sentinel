import { db, rulesTable, transactionsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { getMongoDb } from "./mongo";
import { cacheGet, cacheSet } from "./redis";
import { v4 as uuidv4 } from "uuid";

export interface ScoringContext {
  cardId: string;
  userId: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  currency: string;
  location?: { country: string; city: string; lat: number; lng: number };
  deviceFingerprint?: string;
}

export interface ScoringResult {
  transactionId: string;
  decision: "approved" | "blocked" | "flagged" | "challenge_2fa";
  riskScore: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  responseTimeMs: number;
  triggeredRules: string[];
  explanation: string;
}

function computeRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score < 25) return "low";
  if (score < 50) return "medium";
  if (score < 75) return "high";
  return "critical";
}

function computeDecision(score: number, triggeredRules: string[]): "approved" | "blocked" | "flagged" | "challenge_2fa" {
  if (score >= 85) return "blocked";
  if (score >= 70) return "flagged";
  if (score >= 50) return "challenge_2fa";
  return "approved";
}

export async function scoreTransaction(ctx: ScoringContext): Promise<ScoringResult> {
  const start = Date.now();
  const transactionId = uuidv4();
  const triggeredRules: string[] = [];
  let riskScore = 0;

  // Cache key for user velocity
  const velocityCacheKey = `velocity:${ctx.userId}`;
  let userVelocity = await cacheGet<number>(velocityCacheKey) ?? 0;

  // Rule 1: Amount threshold
  if (ctx.amount > 5000) {
    riskScore += 30;
    triggeredRules.push("HIGH_AMOUNT_THRESHOLD");
  } else if (ctx.amount > 1000) {
    riskScore += 10;
  }

  // Rule 2: Velocity check
  userVelocity += 1;
  await cacheSet(velocityCacheKey, userVelocity, 3600);
  if (userVelocity > 10) {
    riskScore += 35;
    triggeredRules.push("VELOCITY_BREACH");
  } else if (userVelocity > 5) {
    riskScore += 15;
    triggeredRules.push("ELEVATED_VELOCITY");
  }

  // Rule 3: Geo anomaly (high-risk countries)
  const highRiskCountries = ["NG", "RO", "UA", "BR", "CO"];
  if (ctx.location && highRiskCountries.includes(ctx.location.country)) {
    riskScore += 20;
    triggeredRules.push("GEO_HIGH_RISK_COUNTRY");
  }

  // Rule 4: Device fingerprint missing
  if (!ctx.deviceFingerprint) {
    riskScore += 10;
    triggeredRules.push("NO_DEVICE_FINGERPRINT");
  }

  // Rule 5: ML anomaly score (simulated isolation forest)
  const anomalyScore = Math.random() * 0.4; // would be real ML in prod
  if (anomalyScore > 0.3) {
    riskScore += 25;
    triggeredRules.push("ML_ANOMALY_DETECTED");
  }

  // Cap at 100
  riskScore = Math.min(100, riskScore);

  const riskLevel = computeRiskLevel(riskScore);
  const decision = computeDecision(riskScore, triggeredRules);
  const responseTimeMs = Date.now() - start;

  const explanation = triggeredRules.length > 0
    ? `Risk factors: ${triggeredRules.join(", ")}. Score: ${riskScore.toFixed(1)}`
    : `Transaction within normal parameters. Score: ${riskScore.toFixed(1)}`;

  // Async: store transaction details in MongoDB
  try {
    const mdb = await getMongoDb();
    await mdb.collection("transaction_details").insertOne({
      transactionId,
      ctx,
      riskScore,
      riskLevel,
      decision,
      triggeredRules,
      anomalyScore,
      createdAt: new Date(),
    });
  } catch (_e) {
    // Non-critical: MongoDB write failure doesn't block the response
  }

  return { transactionId, decision, riskScore, riskLevel, responseTimeMs, triggeredRules, explanation };
}
