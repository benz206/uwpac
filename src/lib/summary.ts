import { FACILITY_IDS, type FacilityId } from "./facilities";
import { emptyGrid, occupancyPct, toLocal, type Grid } from "./analysis";

export interface Reading {
  t: string;
  o: Partial<Record<FacilityId, [number, number]>>;
}

export interface Aggregate {
  avg: Grid<number | null>;
  n: Grid<number>;
}

export interface FacilitySummary {
  all: Aggregate;
  recent: Aggregate;
}

export interface Summary {
  updatedAt: string;
  firstReading: string | null;
  totalReadings: number;
  recentDays: number;
  facilities: Record<FacilityId, FacilitySummary>;
}

export const RECENT_DAYS = 28;

export function parseReadings(jsonl: string): Reading[] {
  return jsonl
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as Reading);
}

class Accumulator {
  sum = emptyGrid(0);
  n = emptyGrid(0);

  add(day: number, hour: number, pct: number) {
    this.sum[day][hour] += pct;
    this.n[day][hour] += 1;
  }

  finish(): Aggregate {
    return {
      avg: this.sum.map((row, d) =>
        row.map((s, h) => (this.n[d][h] ? Math.round(s / this.n[d][h]) : null)),
      ),
      n: this.n,
    };
  }
}

export function buildSummary(readings: Reading[], now = new Date()): Summary {
  const recentCutoff = now.getTime() - RECENT_DAYS * 86_400_000;
  const acc = Object.fromEntries(
    FACILITY_IDS.map((id) => [
      id,
      { all: new Accumulator(), recent: new Accumulator() },
    ]),
  ) as Record<FacilityId, { all: Accumulator; recent: Accumulator }>;

  let first: string | null = null;
  for (const reading of readings) {
    const date = new Date(reading.t);
    if (!first || reading.t < first) first = reading.t;
    const { day, hour } = toLocal(date);
    const isRecent = date.getTime() >= recentCutoff;
    for (const id of FACILITY_IDS) {
      const value = reading.o[id];
      if (!value) continue;
      const pct = occupancyPct(value[0], value[1]);
      acc[id].all.add(day, hour, pct);
      if (isRecent) acc[id].recent.add(day, hour, pct);
    }
  }

  return {
    updatedAt: now.toISOString(),
    firstReading: first,
    totalReadings: readings.length,
    recentDays: RECENT_DAYS,
    facilities: Object.fromEntries(
      FACILITY_IDS.map((id) => [
        id,
        { all: acc[id].all.finish(), recent: acc[id].recent.finish() },
      ]),
    ) as Record<FacilityId, FacilitySummary>,
  };
}
