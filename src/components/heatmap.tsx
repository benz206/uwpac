"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { TextStates } from "@/components/spectrumui/text-states";
import { crowdLevel, dayName, hourLabel, HOURS } from "@/lib/analysis";
import { FACILITIES, isSlotOpen, type FacilityId } from "@/lib/facilities";
import type { Summary } from "@/lib/summary";
import { pickAggregate } from "@/lib/typical";

function heatColor(pct: number) {
  const hue = 150 - (125 * pct) / 100;
  return `oklch(0.72 0.17 ${hue} / ${0.22 + 0.7 * (pct / 100)})`;
}

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function Segmented<T extends string>({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-0.5 rounded-full border border-black/8 bg-white/60 p-0.5 text-[13px] dark:border-white/10 dark:bg-white/[0.03]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative rounded-full px-3 py-1.5 font-medium transition-colors ${
              active ? "text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active ? (
              <motion.span
                layoutId={id}
                className="absolute inset-0 rounded-full bg-foreground"
                transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
              />
            ) : null}
            <span className="relative">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function Heatmap({ summary }: { summary: Summary }) {
  const [facility, setFacility] = useState<FacilityId>(FACILITIES[0].id);
  const [range, setRange] = useState(() => pickAggregate(summary.facilities[FACILITIES[0].id]).range);
  const [hovered, setHovered] = useState<{ day: number; hour: number } | null>(null);
  const aggregate = summary.facilities[facility][range];
  const samples = aggregate.n.flat().reduce((a, b) => a + b, 0);

  function describe(day: number, hour: number) {
    if (!isSlotOpen(facility, day, hour)) return `${dayName(day)} ${hourLabel(hour)} · closed`;
    const pct = aggregate.avg[day][hour];
    if (pct == null) return `${dayName(day)} ${hourLabel(hour)} · no data yet`;
    return `${dayName(day)} ${hourLabel(hour)} · ${pct}% · ${crowdLevel(pct).label} · ${aggregate.n[day][hour]} readings`;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          id="heatmap-facility"
          options={FACILITIES.map((f) => ({ value: f.id, label: f.shortName }))}
          value={facility}
          onChange={setFacility}
        />
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

      <div className="rounded-2xl border border-black/8 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.02]">
        {samples === 0 ? (
          <p className="mb-3 text-[13px] text-muted-foreground">
            No readings in this range yet. Switch to all time or check back after the scraper has run for a while.
          </p>
        ) : null}

        <div className="overflow-x-auto">
          <table
            className="w-full min-w-[560px] table-fixed border-separate border-spacing-[3px] text-[11px]"
            onMouseLeave={() => setHovered(null)}
          >
            <thead>
              <tr>
                <th className="w-12" />
                {DAY_ORDER.map((d) => (
                  <th key={d} className="pb-1 font-medium text-muted-foreground">
                    {dayName(d).slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <th className="pr-2 text-right font-mono font-normal text-muted-foreground tabular-nums">
                    {hourLabel(hour)}
                  </th>
                  {DAY_ORDER.map((day) => {
                    const closed = !isSlotOpen(facility, day, hour);
                    const pct = aggregate.avg[day][hour];
                    const active = hovered?.day === day && hovered.hour === hour;
                    return (
                      <td
                        key={day}
                        aria-label={describe(day, hour)}
                        onMouseEnter={() => setHovered({ day, hour })}
                        className={`h-7 rounded-[5px] text-center font-mono tabular-nums transition-shadow ${
                          closed ? "cell-closed text-muted-foreground/60" : "text-foreground/80"
                        } ${active ? "ring-2 ring-foreground/70" : ""}`}
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

        <p className="mt-3 h-5 text-[12.5px] font-medium">
          <TextStates
            text={hovered ? describe(hovered.day, hovered.hour) : "Hover a cell for details"}
            className={hovered ? "" : "text-muted-foreground"}
          />
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-16 rounded-full"
            style={{ background: `linear-gradient(90deg, ${heatColor(0)}, ${heatColor(50)}, ${heatColor(100)})` }}
          />
          quiet → packed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="cell-closed inline-block size-2.5 rounded-[3px] ring-1 ring-black/10 dark:ring-white/15" /> closed
        </span>
        <span className="font-mono tabular-nums">{samples.toLocaleString()} readings in this view</span>
      </div>
    </div>
  );
}
