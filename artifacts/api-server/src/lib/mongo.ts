import { MongoClient } from "mongodb";
import { logger } from "./logger";

const MONGODB_URL = process.env.MONGODB_URL;

if (!MONGODB_URL) {
  throw new Error("MONGODB_URL environment variable is required");
}

let client: MongoClient | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (client) return client;
  client = new MongoClient(MONGODB_URL!);
  await client.connect();
  logger.info("Connected to MongoDB");
  return client;
}

export async function getMongoDb(dbName = "fraud_detection") {
  const c = await getMongoClient();
  return c.db(dbName);
}
