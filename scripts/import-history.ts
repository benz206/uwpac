#!/usr/bin/env bun
// One-off: loads data/readings/*.jsonl into Redis and rebuilds the summary.
// Safe to re-run; identical readings are deduplicated.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { addReadings, closeRedis, rebuildSummary } from "../src/lib/data";
import { parseReadings } from "../src/lib/summary";

const READINGS_DIR = path.join(import.meta.dirname, "..", "data", "readings");

for (const file of (await readdir(READINGS_DIR)).sort()) {
  if (!file.endsWith(".jsonl")) continue;
  const readings = parseReadings(await readFile(path.join(READINGS_DIR, file), "utf8"));
  await addReadings(readings);
  console.log(`Imported ${readings.length} readings from ${file}`);
}

const summary = await rebuildSummary();
console.log(`Summary rebuilt from ${summary.totalReadings} readings.`);
await closeRedis();
