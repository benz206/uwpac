import { FACILITY_IDS, type FacilityId } from "./facilities";
import { emptyGrid, type Grid } from "./analysis";

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

export interface Bucket {
  facility: string;
  day: number;
  hour: number;
  recent: boolean;
  n: number;
  sum: number;
}

class Accumulator {
  sum = emptyGrid(0);
  n = emptyGrid(0);

  add(day: number, hour: number, sum: number, n: number) {
    this.sum[day][hour] += sum;
    this.n[day][hour] += n;
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

export function summaryFromBuckets(
  buckets: Bucket[],
  totalReadings: number,
  firstReading: string | null,
  now = new Date(),
): Summary {
  const acc = Object.fromEntries(
    FACILITY_IDS.map((id) => [
      id,
      { all: new Accumulator(), recent: new Accumulator() },
    ]),
  ) as Record<FacilityId, { all: Accumulator; recent: Accumulator }>;

  for (const b of buckets) {
    const facility = acc[b.facility as FacilityId];
    if (!facility) continue;
    facility.all.add(b.day, b.hour, b.sum, b.n);
    if (b.recent) facility.recent.add(b.day, b.hour, b.sum, b.n);
  }

  return {
    updatedAt: now.toISOString(),
    firstReading,
    totalReadings,
    recentDays: RECENT_DAYS,
    facilities: Object.fromEntries(
      FACILITY_IDS.map((id) => [
        id,
        { all: acc[id].all.finish(), recent: acc[id].recent.finish() },
      ]),
    ) as Record<FacilityId, FacilitySummary>,
  };
}
