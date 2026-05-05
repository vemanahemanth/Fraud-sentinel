import { db, usersTable, merchantsTable, transactionsTable, alertsTable, casesTable, caseNotesTable, rulesTable, sarTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { logger } from "./logger";

export async function seedIfEmpty() {
  const existing = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
  if (Number(existing[0]?.count ?? 0) > 0) return;

  logger.info("Seeding database with sample data...");

  const userIds = Array.from({ length: 10 }, () => uuidv4());
  await db.insert(usersTable).values([
    { id: userIds[0], name: "Marcus Chen", email: "marcus.chen@email.com", phone: "+1-555-0101", riskScore: 82, riskTier: "high", totalTransactions: 847, fraudulentTransactions: 12, totalSpend: 124500, cardCount: 3, lastActivityAt: new Date() },
    { id: userIds[1], name: "Priya Sharma", email: "priya.sharma@email.com", phone: "+1-555-0102", riskScore: 91, riskTier: "very_high", totalTransactions: 312, fraudulentTransactions: 28, totalSpend: 87200, cardCount: 2, lastActivityAt: new Date() },
    { id: userIds[2], name: "Alex Rivera", email: "alex.rivera@email.com", phone: "+1-555-0103", riskScore: 34, riskTier: "low", totalTransactions: 1203, fraudulentTransactions: 0, totalSpend: 45600, cardCount: 1, lastActivityAt: new Date() },
    { id: userIds[3], name: "Sarah Johnson", email: "sarah.j@email.com", phone: "+1-555-0104", riskScore: 67, riskTier: "medium", totalTransactions: 562, fraudulentTransactions: 3, totalSpend: 92300, cardCount: 4, lastActivityAt: new Date() },
    { id: userIds[4], name: "David Park", email: "d.park@email.com", phone: "+1-555-0105", riskScore: 78, riskTier: "high", totalTransactions: 234, fraudulentTransactions: 7, totalSpend: 55100, cardCount: 2, lastActivityAt: new Date() },
    { id: userIds[5], name: "Emma Williams", email: "emma.w@email.com", riskScore: 21, riskTier: "low", totalTransactions: 987, fraudulentTransactions: 0, totalSpend: 38900, cardCount: 2, lastActivityAt: new Date() },
    { id: userIds[6], name: "James Okafor", email: "j.okafor@email.com", riskScore: 95, riskTier: "very_high", totalTransactions: 89, fraudulentTransactions: 34, totalSpend: 210000, cardCount: 1, lastActivityAt: new Date() },
    { id: userIds[7], name: "Lisa Thompson", email: "l.thompson@email.com", riskScore: 44, riskTier: "medium", totalTransactions: 445, fraudulentTransactions: 1, totalSpend: 67800, cardCount: 3, lastActivityAt: new Date() },
    { id: userIds[8], name: "Ryan Zhao", email: "r.zhao@email.com", riskScore: 58, riskTier: "medium", totalTransactions: 671, fraudulentTransactions: 4, totalSpend: 112000, cardCount: 2, lastActivityAt: new Date() },
    { id: userIds[9], name: "Fatima Al-Hassan", email: "f.alhassan@email.com", riskScore: 88, riskTier: "high", totalTransactions: 178, fraudulentTransactions: 19, totalSpend: 340000, cardCount: 5, lastActivityAt: new Date() },
  ]);

  const merchantIds = Array.from({ length: 8 }, () => uuidv4());
  await db.insert(merchantsTable).values([
    { id: merchantIds[0], name: "TechGadgets Online", category: "Electronics", country: "US", status: "active", fraudRate: 0.02, totalTransactions: 15430 },
    { id: merchantIds[1], name: "Crypto Exchange Pro", category: "Finance", country: "NG", status: "blocked", fraudRate: 0.34, totalTransactions: 2341, blockedReason: "High fraud rate > 30%", blockedAt: new Date(Date.now() - 86400000 * 5) },
    { id: merchantIds[2], name: "LuxuryGoods Direct", category: "Retail", country: "RO", status: "flagged", fraudRate: 0.18, totalTransactions: 892 },
    { id: merchantIds[3], name: "Amazon Marketplace", category: "E-Commerce", country: "US", status: "active", fraudRate: 0.001, totalTransactions: 1250000 },
    { id: merchantIds[4], name: "QuickCash ATM", category: "ATM/Cash", country: "UA", status: "under_review", fraudRate: 0.22, totalTransactions: 4521 },
    { id: merchantIds[5], name: "FoodDelivery Express", category: "Food & Beverage", country: "US", status: "active", fraudRate: 0.005, totalTransactions: 89200 },
    { id: merchantIds[6], name: "OffshoreGaming Ltd", category: "Gambling", country: "BR", status: "blocked", fraudRate: 0.41, totalTransactions: 1892, blockedReason: "Gambling site with very high fraud rate", blockedAt: new Date(Date.now() - 86400000 * 12) },
    { id: merchantIds[7], name: "TradeHub Global", category: "Finance", country: "SG", status: "active", fraudRate: 0.03, totalTransactions: 28900 },
  ]);

  const txIds = Array.from({ length: 20 }, () => uuidv4());
  const statuses = ["approved", "blocked", "flagged", "approved", "approved", "blocked", "flagged", "approved"];
  const riskLevels = ["low", "critical", "high", "low", "low", "critical", "high", "medium"];
  
  for (let i = 0; i < 20; i++) {
    const si = i % statuses.length;
    const past = new Date(Date.now() - Math.random() * 86400000 * 7);
    await db.insert(transactionsTable).values({
      id: txIds[i],
      cardId: `CARD-${userIds[i % 10].slice(0, 8).toUpperCase()}`,
      userId: userIds[i % 10],
      merchantId: merchantIds[i % 8],
      merchantName: ["TechGadgets Online", "Crypto Exchange Pro", "LuxuryGoods Direct", "Amazon Marketplace", "QuickCash ATM", "FoodDelivery Express", "OffshoreGaming Ltd", "TradeHub Global"][i % 8],
      amount: [245.50, 12500.00, 3200.75, 89.99, 500.00, 34.20, 8750.00, 1200.00, 67.45, 4500.00, 23.99, 9800.00, 150.00, 2750.00, 45.60, 15000.00, 320.00, 875.50, 99.99, 6200.00][i],
      currency: "USD",
      status: statuses[si],
      riskScore: [15, 92, 78, 12, 8, 95, 71, 45, 23, 88, 5, 97, 18, 82, 11, 98, 34, 76, 29, 85][i],
      riskLevel: riskLevels[si],
      country: ["US", "NG", "RO", "US", "US", "UA", "BR", "SG", "US", "NG"][i % 10],
      city: ["New York", "Lagos", "Bucharest", "Los Angeles", "Chicago", "Kyiv", "São Paulo", "Singapore", "Houston", "Abuja"][i % 10],
      lat: [40.71, 6.52, 44.43, 34.05, 41.88, 50.45, -23.55, 1.35, 29.76, 9.07][i % 10],
      lng: [-74.01, 3.38, 26.10, -118.24, -87.63, 30.52, -46.63, 103.82, -95.37, 7.48][i % 10],
      triggeredRules: statuses[si] !== "approved" ? (["HIGH_AMOUNT_THRESHOLD", "GEO_HIGH_RISK_COUNTRY", "ML_ANOMALY_DETECTED"].slice(0, (i % 3) + 1)) : [],
      responseTime: 15 + Math.random() * 85,
      createdAt: past,
    });
  }

  const alertIds = Array.from({ length: 8 }, () => uuidv4());
  await db.insert(alertsTable).values([
    { id: alertIds[0], transactionId: txIds[1], userId: userIds[1], type: "ml_anomaly", severity: "critical", status: "open", title: "ML Anomaly: Extreme risk score 92/100", description: "Isolation Forest model flagged this transaction as highly anomalous. Pattern matches known card-not-present fraud." },
    { id: alertIds[1], transactionId: txIds[5], userId: userIds[5], type: "velocity_breach", severity: "high", status: "open", title: "Velocity Breach: 14 transactions in 1 hour", description: "User exceeded velocity threshold of 10 transactions per hour from the same device fingerprint." },
    { id: alertIds[2], transactionId: txIds[9], userId: userIds[9], type: "geo_anomaly", severity: "critical", status: "acknowledged", title: "Geo Anomaly: Impossible travel detected", description: "Transaction originated from Lagos, Nigeria — 2 hours after last transaction in New York. Physical travel impossible." },
    { id: alertIds[3], transactionId: txIds[15], userId: userIds[5], type: "amount_threshold", severity: "high", status: "open", title: "Amount Alert: $15,000 single transaction", description: "Transaction amount $15,000 exceeds user's 90th-percentile threshold of $2,400." },
    { id: alertIds[4], userId: userIds[6], type: "pattern_match", severity: "critical", status: "open", title: "Pattern Match: Account Takeover signature", description: "Multiple failed authentication attempts followed by successful login and immediate high-value transfer matches ATO pattern." },
    { id: alertIds[5], transactionId: txIds[2], type: "blocked_merchant", severity: "warning", status: "resolved", title: "Transaction at flagged merchant", description: "Transaction processed at LuxuryGoods Direct, which is under fraud investigation.", resolvedAt: new Date(Date.now() - 3600000) },
    { id: alertIds[6], userId: userIds[3], type: "device_mismatch", severity: "warning", status: "open", title: "Device Mismatch: New device fingerprint", description: "User Sarah Johnson accessed account from an unrecognized device for the first time." },
    { id: alertIds[7], transactionId: txIds[11], userId: userIds[6], type: "ml_anomaly", severity: "critical", status: "open", title: "Autoencoder: Reconstruction error 98th percentile", description: "Autoencoder model reconstruction error is in the 98th percentile for this user's spending profile." },
  ]);

  const ruleIds = Array.from({ length: 6 }, () => uuidv4());
  await db.insert(rulesTable).values([
    { id: ruleIds[0], name: "High Amount Threshold", description: "Flag transactions exceeding $5,000", type: "amount_threshold", enabled: true, priority: 1, action: "flag", conditions: { threshold: 5000, currency: "USD" }, triggeredCount: 342, falsePositiveRate: 0.12 },
    { id: ruleIds[1], name: "Velocity Rule - Hourly", description: "Block if more than 10 transactions in 1 hour", type: "velocity", enabled: true, priority: 2, action: "block", conditions: { maxCount: 10, windowMinutes: 60 }, triggeredCount: 89, falsePositiveRate: 0.05 },
    { id: ruleIds[2], name: "High-Risk Country Block", description: "Challenge 2FA for transactions from flagged countries", type: "geolocation", enabled: true, priority: 3, action: "challenge_2fa", conditions: { countries: ["NG", "RO", "UA", "BR", "CO"] }, triggeredCount: 1204, falsePositiveRate: 0.31 },
    { id: ruleIds[3], name: "New Device Fingerprint", description: "Flag transactions from unrecognized devices", type: "device", enabled: true, priority: 4, action: "flag", conditions: { newDeviceOnly: true }, triggeredCount: 567, falsePositiveRate: 0.24 },
    { id: ruleIds[4], name: "Blocked Merchant Blacklist", description: "Block all transactions at blocked merchants", type: "blacklist", enabled: true, priority: 1, action: "block", conditions: { listType: "merchants" }, triggeredCount: 2341, falsePositiveRate: 0.02 },
    { id: ruleIds[5], name: "Weekend Night Velocity", description: "Flag unusual activity between 1AM-5AM on weekends", type: "pattern", enabled: false, priority: 7, action: "flag", conditions: { hours: [1, 2, 3, 4, 5], days: [0, 6] }, triggeredCount: 128, falsePositiveRate: 0.38 },
  ]);

  const caseId1 = uuidv4();
  const caseId2 = uuidv4();
  await db.insert(casesTable).values([
    { id: caseId1, caseNumber: "CASE-FRD2024001", title: "Large-Scale Account Takeover Ring", description: "Coordinated account takeover attacks targeting high-net-worth customers. Multiple accounts compromised using credential stuffing.", status: "in_progress", priority: "urgent", fraudType: "Account Takeover", estimatedLoss: 847500, confirmedLoss: 312000, assigneeId: "inv-001", assigneeName: "Detective Sarah Mills", transactionIds: [txIds[1], txIds[9], txIds[15]], alertIds: [alertIds[0], alertIds[4]], createdAt: new Date(Date.now() - 86400000 * 14) },
    { id: caseId2, caseNumber: "CASE-FRD2024002", title: "International Card-Not-Present Fraud", description: "Organized fraud ring using stolen card data to make online purchases across multiple merchants. Transactions traced to Eastern Europe.", status: "pending_sar", priority: "high", fraudType: "Card Not Present", estimatedLoss: 234000, assigneeId: "inv-002", assigneeName: "Agent Mike Torres", transactionIds: [txIds[2], txIds[5], txIds[11]], alertIds: [alertIds[1], alertIds[2]], createdAt: new Date(Date.now() - 86400000 * 7) },
  ]);

  await db.insert(caseNotesTable).values([
    { id: uuidv4(), caseId: caseId1, authorId: "inv-001", authorName: "Sarah Mills", content: "Confirmed 3 accounts fully compromised. Working with Identity team to reset credentials. Customers notified.", createdAt: new Date(Date.now() - 86400000 * 10) },
    { id: uuidv4(), caseId: caseId1, authorId: "inv-001", authorName: "Sarah Mills", content: "IP analysis shows VPN cluster in Eastern Europe. Correlating with known fraud ring from Q3 2024 case.", createdAt: new Date(Date.now() - 86400000 * 5) },
    { id: uuidv4(), caseId: caseId2, authorId: "inv-002", authorName: "Mike Torres", content: "Merchant data from LuxuryGoods Direct obtained. 47 card numbers match compromised batch from November data breach.", createdAt: new Date(Date.now() - 86400000 * 3) },
  ]);

  const sarId = uuidv4();
  await db.insert(sarTable).values([
    { id: sarId, sarNumber: "SAR-2024-001892", caseId: caseId1, status: "submitted", subjectName: "James Okafor", subjectType: "individual", reportingOfficer: "Sarah Mills", filingInstitution: "First National Security Bank", suspiciousActivityType: "Account Takeover / Wire Fraud", description: "Subject James Okafor's account was used as a conduit for proceeds from coordinated account takeover attacks. $312,000 in fraudulent transfers identified over 14-day period.", amountInvolved: 312000, startDate: new Date(Date.now() - 86400000 * 14), endDate: new Date(Date.now() - 86400000 * 1), submittedAt: new Date(Date.now() - 86400000 * 2) },
  ]);

  logger.info("Seeding complete");
}
