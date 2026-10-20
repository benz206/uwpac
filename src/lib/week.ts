import { HOURS, occupancyPct, shiftDate, toLocal, weekdayOf } from "./analysis";
import { isSlotOpen, type FacilityId } from "./facilities";
import type { Reading, Summary } from "./summary";
import { pickAggregate } from "./typical";

export interface DayTrend {
  actual: (number | null)[];
  typical: (number | null)[];
  avg: number | null;
  peak: number | null;
  typicalAvg: number | null;
  typicalPeak: number | null;
}

export function weekStart(isoDate: string) {
  return shiftDate(isoDate, -((weekdayOf(isoDate) + 6) % 7));
}

function mean(values: number[]) {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;
}

function max(values: (number | null)[]) {
  const present = values.filter((v) => v != null);
  return present.length ? Math.max(...present) : null;
}

export function dayTrend(date: string, readings: Reading[], facilities: FacilityId[], summary: Summary | null): DayTrend {
  const weekday = weekdayOf(date);
  const buckets = new Map<string, number[]>();
  for (const r of readings) {
    const { hour } = toLocal(new Date(r.t));
    for (const f of facilities) {
      const value = r.o[f];
      if (!value || !isSlotOpen(f, weekday, hour)) continue;
      const key = `${f}:${hour}`;
      buckets.set(key, [...(buckets.get(key) ?? []), occupancyPct(value[0], value[1])]);
    }
  }

  const aggregates = facilities.map((f) => (summary ? pickAggregate(summary.facilities[f]).aggregate : null));
  const actual = HOURS.map((hour) =>
    mean(facilities.flatMap((f) => mean(buckets.get(`${f}:${hour}`) ?? []) ?? [])),
  );
  const typical = HOURS.map((hour) =>
    mean(facilities.flatMap((f, i) => (isSlotOpen(f, weekday, hour) ? (aggregates[i]?.avg[weekday][hour] ?? []) : []))),
  );

  const hasActual = actual.some((v) => v != null);
  const comparable = typical.filter((v, i): v is number => v != null && (!hasActual || actual[i] != null));
  return {
    actual,
    typical,
    avg: mean(actual.filter((v) => v != null)),
    peak: max(actual),
    typicalAvg: mean(comparable),
    typicalPeak: max(typical),
  };
}
