"use client";

import { useState } from "react";
import { Segmented } from "@/components/segmented";
import { TextStates } from "@/components/spectrumui/text-states";
import { crowdLevel, dayName, HEAT_STEPS, heatStep, hourLabel, HOURS } from "@/lib/analysis";
import { FACILITIES, isSlotOpen, type Facility } from "@/lib/facilities";
import type { Aggregate, Summary } from "@/lib/summary";
import { pickAggregate } from "@/lib/typical";

function heatStyle(pct: number) {
  const step = heatStep(pct);
  return { background: `var(--heat-${step})`, color: `var(--heat-ink-${step})` };
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function FacilityHeatmap({ facility, aggregate }: { facility: Facility; aggregate: Aggregate }) {
  const [hovered, setHovered] = useState<{ day: number; hour: number } | null>(null);
  const samples = aggregate.n.flat().reduce((a, b) => a + b, 0);

  function describe(day: number, hour: number) {
    if (!isSlotOpen(facility.id, day, hour)) return `${dayName(day)} ${hourLabel(hour)} · closed`;
    const pct = aggregate.avg[day][hour];
    if (pct == null) return `${dayName(day)} ${hourLabel(hour)} · no data yet`;
    return `${dayName(day)} ${hourLabel(hour)} · ${pct}% · ${crowdLevel(pct).label} · ${aggregate.n[day][hour]} readings`;
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="min-w-0">
        <h2 className="truncate text-[15px] font-medium tracking-tight">{facility.shortName}</h2>
        <p className="truncate text-[12.5px] text-muted-foreground">{facility.name}</p>
      </div>

      {samples === 0 ? (
        <p className="text-[12.5px] text-muted-foreground">No readings in this range yet.</p>
      ) : null}

      <table
        className="w-full table-fixed border-separate border-spacing-[2px] text-[10px]"
        onMouseLeave={() => setHovered(null)}
      >
        <thead>
          <tr>
            <th className="w-9" />
            {DAY_ORDER.map((d) => (
              <th key={d} className="pb-1 font-medium text-muted-foreground">
                {dayName(d).slice(0, 1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((hour) => (
            <tr key={hour}>
              <th className="pr-1.5 text-right font-mono font-normal text-muted-foreground tabular-nums">
                {hourLabel(hour)}
              </th>
              {DAY_ORDER.map((day) => {
                const closed = !isSlotOpen(facility.id, day, hour);
                const pct = aggregate.avg[day][hour];
                const active = hovered?.day === day && hovered.hour === hour;
                return (
                  <td
                    key={day}
                    aria-label={describe(day, hour)}
                    onMouseEnter={() => setHovered({ day, hour })}
                    className={`h-5 rounded-[3px] text-center font-mono tabular-nums transition-shadow ${
                      closed ? "cell-closed text-muted-foreground/60" : ""
                    } ${active ? "ring-2 ring-foreground" : ""}`}
                    style={!closed && pct != null ? heatStyle(pct) : undefined}
                  >
                    {!closed && pct != null ? pct : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="h-4 truncate text-[12px] font-medium">
        <TextStates
          text={hovered ? describe(hovered.day, hovered.hour) : "Hover a cell for details"}
          className={hovered ? "" : "text-muted-foreground"}
        />
      </p>
    </article>
  );
}

export function Heatmap({ summary }: { summary: Summary }) {
  const [range, setRange] = useState(() => pickAggregate(summary.facilities[FACILITIES[0].id]).range);
  const samples = FACILITIES.reduce(
    (total, f) => total + summary.facilities[f.id][range].n.flat().reduce((a, b) => a + b, 0),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        <Segmented
          id="heatmap-range"
          options={[
            { value: "recent" as const, label: `Last ${summary.recentDays} days` },
            { value: "all" as const, label: "All time" },
          ]}
          value={range}
          onChange={setRange}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FACILITIES.map((f) => (
          <FacilityHeatmap key={f.id} facility={f} aggregate={summary.facilities[f.id][range]} />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="flex">
            {HEAT_STEPS.map((_, step) => (
              <span key={step} className="h-2.5 w-2.5 first:rounded-l-[3px] last:rounded-r-[3px]" style={{ background: `var(--heat-${step})` }} />
            ))}
          </span>
          quiet → packed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="cell-closed inline-block size-2.5 rounded-[3px] ring-1 ring-border" /> closed
        </span>
        <span className="font-mono tabular-nums">{samples.toLocaleString()} readings in this view</span>
      </div>
    </div>
  );
}
