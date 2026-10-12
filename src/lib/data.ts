import { createClient } from "redis";
import { fetchLive, type LiveReading } from "./scrape";
import { buildSummary, type Reading, type Summary } from "./summary";

const LIVE_TTL = 60;
const READINGS_KEY = "readings";
const SUMMARY_KEY = "summary";

function connect() {
  return createClient({ url: process.env.REDIS_URL }).connect();
}

let client: ReturnType<typeof connect> | null = null;

function redis() {
  client ??= connect();
  return client;
}

export async function loadSummary(): Promise<Summary | null> {
  const text = await (await redis()).get(SUMMARY_KEY);
  return text ? (JSON.parse(text) as Summary) : null;
}

export async function addReadings(readings: Reading[]) {
  await (await redis()).zAdd(
    READINGS_KEY,
    readings.map((r) => ({ score: Date.parse(r.t), value: JSON.stringify(r) })),
  );
}

export async function rebuildSummary(now = new Date()): Promise<Summary> {
  const db = await redis();
  const readings = (await db.zRange(READINGS_KEY, 0, -1)).map((line) => JSON.parse(line) as Reading);
  const summary = buildSummary(readings, now);
  await db.set(SUMMARY_KEY, JSON.stringify(summary));
  return summary;
}

export async function closeRedis() {
  if (client) await (await client).close();
}

export interface LiveSnapshot {
  fetchedAt: string;
  readings: LiveReading[];
}

export async function loadLive(): Promise<LiveSnapshot> {
  const readings = await fetchLive({ next: { revalidate: LIVE_TTL } });
  return { fetchedAt: new Date().toISOString(), readings };
}
