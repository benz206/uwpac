import { readFile } from "node:fs/promises";
import path from "node:path";
import { fetchLive, type LiveReading } from "./scrape";
import { parseReadings, type Reading, type Summary } from "./summary";

const LIVE_TTL = 60;
const HISTORY_TTL = 300;

function remoteBase() {
  if (process.env.DATA_BASE_URL) return process.env.DATA_BASE_URL;
  const owner = process.env.VERCEL_GIT_REPO_OWNER;
  const repo = process.env.VERCEL_GIT_REPO_SLUG;
  const ref = process.env.VERCEL_GIT_COMMIT_REF ?? "main";
  if (owner && repo) {
    return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/data`;
  }
  return null;
}

async function loadDataFile(relative: string): Promise<string | null> {
  const base = remoteBase();
  if (base) {
    const res = await fetch(`${base}/${relative}`, {
      next: { revalidate: HISTORY_TTL },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to load ${relative}: ${res.status}`);
    return res.text();
  }
  try {
    return await readFile(path.join(process.cwd(), "data", relative), "utf8");
  } catch {
    return null;
  }
}

export async function loadSummary(): Promise<Summary | null> {
  const text = await loadDataFile("summary.json");
  return text ? (JSON.parse(text) as Summary) : null;
}

export async function loadMonth(yearMonth: string): Promise<Reading[]> {
  const text = await loadDataFile(`readings/${yearMonth}.jsonl`);
  return text ? parseReadings(text) : [];
}

export interface LiveSnapshot {
  fetchedAt: string;
  readings: LiveReading[];
}

export async function loadLive(): Promise<LiveSnapshot> {
  const readings = await fetchLive({ next: { revalidate: LIVE_TTL } });
  return { fetchedAt: new Date().toISOString(), readings };
}
