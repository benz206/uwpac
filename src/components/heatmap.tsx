"use client";

import { useState } from "react";
import { crowdLevel, dayName, hourLabel, HOURS } from "@/lib/analysis";
import { FACILITIES, isSlotOpen, type FacilityId } from "@/lib/facilities";
import type { Summary } from "@/lib/summary";
import { pickAggregate } from "@/lib/typical";

export function heatColor(pct: number) {
  const hue = 130 - (130 * pct) / 100;
  return `hsl(${hue} 70% 45% / ${0.25 + 0.65 * (pct / 100)})`;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function FacilityPicker({ value, onChange }: { value: FacilityId; onChange: (id: FacilityId) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FACILITIES.map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`rounded-md border px-2.5 py-1 text-sm transition-colors ${
            f.id === value
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted hover:text-foreground"
          }`}
        >
          {f.shortName}
        </button>
      ))}
    </div>
  );
}

export function RangeToggle({
  value,
  onChange,
  recentDays,
}: {
  value: "recent" | "all";
  onChange: (v: "recent" | "all") => void;
  recentDays: number;
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5 text-xs">
      {(["recent", "all"] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded px-2 py-1 ${value === opt ? "bg-foreground text-background" : "text-muted"}`}
        >
          {opt === "recent" ? `Last ${recentDays} days` : "All time"}
        </button>
      ))}
    </div>
  );
}

export function Heatmap({ summary }: { summary: Summary }) {
  const [facility, setFacility] = useState<FacilityId>(FACILITIES[0].id);
  const [range, setRange] = useState(() => pickAggregate(summary.facilities[FACILITIES[0].id]).range);
  const aggregate = summary.facilities[facility][range];
  const samples = aggregate.n.flat().reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FacilityPicker value={facility} onChange={setFacility} />
        <RangeToggle value={range} onChange={setRange} recentDays={summary.recentDays} />
      </div>

      {samples === 0 ? (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
          No readings in this range yet. Switch to all time or check back after the scraper has run for a while.
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th className="w-12" />
              {DAY_ORDER.map((d) => (
                <th key={d} className="pb-1 font-medium text-muted">
                  {dayName(d).slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <th className="pr-2 text-right font-normal text-muted tabular-nums">{hourLabel(hour)}</th>
                {DAY_ORDER.map((day) => {
                  const closed = !isSlotOpen(facility, day, hour);
                  const pct = aggregate.avg[day][hour];
                  const n = aggregate.n[day][hour];
                  const title = closed
                    ? `${dayName(day)} ${hourLabel(hour)}: closed`
                    : pct == null
                      ? `${dayName(day)} ${hourLabel(hour)}: no data yet`
                      : `${dayName(day)} ${hourLabel(hour)}: ${pct}% · ${crowdLevel(pct).label} · ${n} readings`;
                  return (
                    <td
                      key={day}
                      title={title}
                      className={`h-7 rounded-sm text-center tabular-nums ${closed ? "cell-closed text-muted/60" : ""}`}
                      style={!closed && pct != null ? { background: heatColor(pct) } : undefined}
                    >
                      {!closed && pct != null ? pct : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-16 rounded-sm" style={{ background: "linear-gradient(90deg, hsl(130 70% 45%), hsl(65 70% 45%), hsl(0 70% 45%))" }} />
          quiet → packed
        </span>
        <span className="flex items-center gap-1">
          <span className="cell-closed inline-block size-3 rounded-sm border border-border" /> closed
        </span>
        <span>{samples.toLocaleString()} readings in this view</span>
      </div>
    </div>
  );
}
