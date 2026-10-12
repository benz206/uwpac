#!/usr/bin/env bun
// One-off: creates the readings and summary tables if they do not exist.
import { closeDb, createTables } from "../src/lib/data";

await createTables();
console.log("Tables ready.");
await closeDb();
