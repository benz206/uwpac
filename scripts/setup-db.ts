#!/usr/bin/env bun
// One-off: creates the tables, loads data/readings/*.jsonl, and rebuilds the summary.
// Safe to re-run; readings already in the table are skipped.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { addReadings, closeDb, createTables, rebuildSummary } from "../src/lib/data";
import { parseReadings } from "../src/lib/summary";

const READINGS_DIR = path.join(import.meta.dirname, "..", "data", "readings");

await createTables();

for (const file of (await readdir(READINGS_DIR)).sort()) {
  if (!file.endsWith(".jsonl")) continue;
  const readings = parseReadings(await readFile(path.join(READINGS_DIR, file), "utf8"));
  await addReadings(readings);
  console.log(`Imported ${readings.length} readings from ${file}`);
}

const summary = await rebuildSummary();
console.log(`Summary rebuilt from ${summary.totalReadings} readings.`);
await closeDb();
