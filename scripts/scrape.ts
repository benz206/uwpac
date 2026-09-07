#!/usr/bin/env bun
// Scrapes the Warrior Facility Occupancy page once, appends the reading to
// data/readings/YYYY-MM.jsonl, and rebuilds data/summary.json.
import { mkdir, readdir, readFile, writeFile, appendFile } from "node:fs/promises";
import path from "node:path";
import { fetchLive } from "../src/lib/scrape";
import { buildSummary, parseReadings, type Reading } from "../src/lib/summary";

const DATA_DIR = path.join(import.meta.dirname, "..", "data");
const READINGS_DIR = path.join(DATA_DIR, "readings");

const now = new Date();
const readings = await fetchLive();
if (readings.length === 0) {
  console.error("Parsed zero facilities; upstream HTML may have changed.");
  process.exit(1);
}

const reading: Reading = {
  t: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
  o: Object.fromEntries(readings.map((r) => [r.facility, [r.count, r.max]])),
};

await mkdir(READINGS_DIR, { recursive: true });
const monthFile = path.join(READINGS_DIR, `${reading.t.slice(0, 7)}.jsonl`);
await appendFile(monthFile, JSON.stringify(reading) + "\n");
console.log("Appended", JSON.stringify(reading));

const all: Reading[] = [];
for (const file of (await readdir(READINGS_DIR)).sort()) {
  if (!file.endsWith(".jsonl")) continue;
  all.push(...parseReadings(await readFile(path.join(READINGS_DIR, file), "utf8")));
}
const summary = buildSummary(all, now);
await writeFile(path.join(DATA_DIR, "summary.json"), JSON.stringify(summary));
console.log(`Summary rebuilt from ${summary.totalReadings} readings.`);
