"use client";

import { useState } from "react";
import { DayChart, type DayPoint } from "@/components/day-chart";
import { NumberTicker } from "@/components/motion/number-ticker";
import { Segmented } from "@/components/segmented";
import { FIRST_HOUR, hourLabel, HOURS, occupancyPct, toLocal, weekdayOf } from "@/lib/analysis";
import { FACILITIES, isSlotOpen, type FacilityId } from "@/lib/facilities";
import type { Reading, Summary } from "@/lib/summary";
import { pickAggregate } from "@/lib/typical";

interface Props {
  date: string;
  today: string;
  nowHour: number | null;
  readings: Reading[];
  summary: Summary | null;
  initialFacility: FacilityId;
}

function Stat({ label, value, detail }: { label: string; value: number | null; detail: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-black/8 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
      <p className="text-[12.5px] text-muted-foreground">{label}</p>
      <p className="text-[27px] font-medium leading-none tracking-tight">
        {value == null ? "—" : <NumberTicker value={value} suffix="%" />}
      </p>
      <p className="text-[12.5px] text-muted-foreground">{detail}</p>
    </div>
  );
}

export function DayView({ date, today, nowHour, readings, summary, initialFacility }: Props) {
  const [facility, setFacility] = useState(initialFacility);
  const isPast = date < today;
  const predictedLabel = isPast ? "Typical" : "Predicted";

  function selectFacility(id: FacilityId) {
    setFacility(id);
    window.history.replaceState(null, "", `?date=${date}&f=${id}`);
  }

  const weekday = weekdayOf(date);
  const actual = readings.flatMap((r) => {
    const value = r.o[facility];
    const local = toLocal(new Date(r.t));
    if (!value || local.hour < FIRST_HOUR || !isSlotOpen(facility, weekday, local.hour)) return [];
    return [{ x: local.hour + local.minute / 60, actual: occupancyPct(value[0], value[1]) }];
  });

  const aggregate = summary ? pickAggregate(summary.facilities[facility]).aggregate : null;
  const predicted = HOURS.flatMap((hour) => {
    const avg = aggregate?.avg[weekday][hour];
    if (avg == null || !isSlotOpen(facility, weekday, hour)) return [];
    return [{ x: hour + 0.5, predicted: avg }];
  });

  const data: DayPoint[] = [...actual, ...predicted].sort((a, b) => a.x - b.x);

  const peak = actual.length
    ? actual.reduce((a, b) => (b.actual > a.actual ? b : a))
    : null;
  const upcoming = predicted.filter((p) => nowHour == null || p.x > nowHour);
  const quietest = isPast
    ? actual.length
      ? actual.reduce((a, b) => (b.actual < a.actual ? b : a))
      : null
    : upcoming.length
      ? upcoming.reduce((a, b) => (b.predicted < a.predicted ? b : a))
      : null;
  const predictedPeak = predicted.length
    ? predicted.reduce((a, b) => (b.predicted > a.predicted ? b : a))
    : null;

  return (
    <div className="flex flex-col gap-4">
      <Segmented
        id="day-facility"
        options={FACILITIES.map((f) => ({ value: f.id, label: f.shortName }))}
        value={facility}
        onChange={selectFacility}
      />

      <div className={`grid gap-3 ${peak ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {peak ? (
          <Stat
            label={date === today ? "Peak so far" : "Peak"}
            value={peak.actual}
            detail={`at ${hourLabel(Math.floor(peak.x))}`}
          />
        ) : null}
        <Stat
          label={isPast ? "Quietest" : "Best time to go"}
          value={quietest ? ("actual" in quietest ? quietest.actual : quietest.predicted) : null}
          detail={
            quietest
              ? `${isPast ? "at" : "around"} ${hourLabel(Math.floor(quietest.x))}`
              : date === today
                ? "Closed for the rest of today"
                : "No data"
          }
        />
        <Stat
          label={isPast ? "Typical peak" : "Predicted peak"}
          value={predictedPeak?.predicted ?? null}
          detail={predictedPeak ? `around ${hourLabel(Math.floor(predictedPeak.x))}` : "No history yet"}
        />
      </div>

      <div className="rounded-2xl border border-black/8 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
        <DayChart data={data} predictedLabel={predictedLabel} nowHour={nowHour} />
      </div>
      <p className="text-[12px] text-muted-foreground">
        {predictedLabel} is the average for a {new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })} at each hour
        {summary && aggregate === summary.facilities[facility].recent ? ` over the last ${summary.recentDays} days` : " across all history"}.
        {actual.length ? ` ${actual.length} readings this day.` : ""}
      </p>
    </div>
  );
}
