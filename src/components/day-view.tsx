"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";
import { ACTUAL, DayChart, PREDICTED, type DayPoint } from "@/components/day-chart";
import { NumberTicker } from "@/components/motion/number-ticker";
import { ChartLegend } from "@/components/spectrumui/charts/chart-kit";
import { WeekStrip, type WeekDay } from "@/components/week-strip";
import { FIRST_HOUR, hourLabel, HOURS, occupancyPct, toLocal, weekdayOf } from "@/lib/analysis";
import { FACILITIES, isSlotOpen, type Facility, type FacilityId } from "@/lib/facilities";
import type { Reading, Summary } from "@/lib/summary";
import { pickAggregate } from "@/lib/typical";

interface Props {
  date: string;
  today: string;
  nowHour: number | null;
  readings: Reading[];
  week: WeekDay[];
  summary: Summary | null;
  initialExpanded: FacilityId | null;
}

function Stat({ label, value, detail }: { label: string; value: number | null; detail: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <p className="truncate text-[11.5px] text-muted-foreground">{label}</p>
      <p className="text-[22px] font-medium leading-none tracking-tight">
        {value == null ? "—" : <NumberTicker value={value} suffix="%" />}
      </p>
      <p className="truncate text-[11.5px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function DayCard({
  facility,
  date,
  today,
  nowHour,
  readings,
  summary,
  expanded,
  onToggle,
}: Omit<Props, "initialExpanded" | "week"> & { facility: Facility; expanded: boolean; onToggle: () => void }) {
  const isPast = date < today;
  const predictedLabel = isPast ? "Typical" : "Predicted";
  const weekday = weekdayOf(date);

  const actual = readings.flatMap((r) => {
    const value = r.o[facility.id];
    const local = toLocal(new Date(r.t));
    if (!value || local.hour < FIRST_HOUR || !isSlotOpen(facility.id, weekday, local.hour)) return [];
    return [{ x: local.hour + local.minute / 60, actual: occupancyPct(value[0], value[1]) }];
  });

  const aggregate = summary ? pickAggregate(summary.facilities[facility.id]).aggregate : null;
  const predicted = HOURS.flatMap((hour) => {
    const avg = aggregate?.avg[weekday][hour];
    if (avg == null || !isSlotOpen(facility.id, weekday, hour)) return [];
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
    <article
      className={`flex flex-col gap-4 rounded-lg border bg-card p-4 ${
        expanded ? "order-first sm:col-span-2 lg:col-span-3" : ""
      }`}
    >
      <button type="button" onClick={onToggle} className="group flex items-start justify-between gap-3 text-left">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-medium tracking-tight">{facility.shortName}</h2>
          <p className="truncate text-[12.5px] text-muted-foreground">{facility.name}</p>
        </div>
        {expanded ? (
          <Minimize2 aria-label="Collapse" className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
        ) : (
          <Maximize2 aria-label="Expand" className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
        )}
      </button>

      <div className={`grid gap-3 ${date > today ? "grid-cols-2" : "grid-cols-3"}`}>
        {date > today ? null : (
          <Stat
            label={date === today ? "Peak so far" : "Peak"}
            value={peak?.actual ?? null}
            detail={peak ? `at ${hourLabel(Math.floor(peak.x))}` : "No readings"}
          />
        )}
        <Stat
          label={isPast ? "Quietest" : "Best time"}
          value={quietest ? ("actual" in quietest ? quietest.actual : quietest.predicted) : null}
          detail={
            quietest
              ? `${isPast ? "at" : "around"} ${hourLabel(Math.floor(quietest.x))}`
              : date === today
                ? "Closed rest of day"
                : "No data"
          }
        />
        <Stat
          label={isPast ? "Typical peak" : "Predicted peak"}
          value={predictedPeak?.predicted ?? null}
          detail={predictedPeak ? `around ${hourLabel(Math.floor(predictedPeak.x))}` : "No history yet"}
        />
      </div>

      <DayChart data={data} predictedLabel={predictedLabel} nowHour={nowHour} compact={!expanded} />
    </article>
  );
}

export function DayView({ date, today, nowHour, readings, week, summary, initialExpanded }: Props) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const predictedLabel = date < today ? "Typical" : "Predicted";

  function toggle(id: FacilityId) {
    const next = expanded === id ? null : id;
    setExpanded(next);
    window.history.replaceState(null, "", next ? `?date=${date}&f=${next}` : `?date=${date}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <WeekStrip date={date} today={today} week={week} summary={summary} facility={expanded} />
      <ChartLegend
        className="mt-4 mb-0 justify-start"
        items={[
          { label: "Actual", color: ACTUAL },
          { label: predictedLabel, color: PREDICTED },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FACILITIES.map((f) => (
          <DayCard
            key={f.id}
            facility={f}
            date={date}
            today={today}
            nowHour={nowHour}
            readings={readings}
            summary={summary}
            expanded={expanded === f.id}
            onToggle={() => toggle(f.id)}
          />
        ))}
      </div>
      <p className="text-[12px] text-muted-foreground">
        {predictedLabel} is the average for a {new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" })} at each hour
        {summary ? ` over the last ${summary.recentDays} days where there's enough data, otherwise across all history` : ""}.
        {readings.length ? ` ${readings.length} readings this day.` : ""}
      </p>
    </div>
  );
}
