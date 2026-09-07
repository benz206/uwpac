"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { crowdLevel, dayName, hourLabel, HOURS } from "@/lib/analysis";
import { FACILITIES, isSlotOpen, type FacilityId } from "@/lib/facilities";
import { isBlocked, openSlots } from "@/lib/recommend";
import { parseSchedule, serializeSchedule } from "@/lib/schedule";
import type { Summary } from "@/lib/summary";
import { pickAggregate } from "@/lib/typical";
import { FacilityPicker, heatColor, RangeToggle } from "./heatmap";

const STORAGE_KEY = "uwpac.schedule";
const TOP_N = 5;
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

const PLACEHOLDER = `Paste your Quest class schedule here (Quest → Class Schedule → select all → copy),
or type one block per line:
Monday 9:00-10:30 CS 246 LEC
Tuesday 13:00-14:20`;

const listeners = new Set<() => void>();

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

function useStoredText(): [string, (value: string) => void] {
  const text = useSyncExternalStore(subscribe, readStored, () => "");
  const setText = (value: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    listeners.forEach((listener) => listener());
  };
  return [text, setText];
}

export function Planner({ summary }: { summary: Summary }) {
  const [text, setText] = useStoredText();
  const [facility, setFacility] = useState<FacilityId>(FACILITIES[0].id);
  const [range, setRange] = useState(() => pickAggregate(summary.facilities[FACILITIES[0].id]).range);
  const [earliest, setEarliest] = useState(7);
  const [latest, setLatest] = useState(22);

  const blocks = useMemo(() => parseSchedule(text), [text]);
  const aggregate = summary.facilities[facility][range];
  const slots = useMemo(
    () => openSlots({ facility, aggregate, blocks, earliest, latest }),
    [facility, aggregate, blocks, earliest, latest],
  );
  const best = slots.slice(0, TOP_N);
  const bestKeys = new Set(best.map((s) => `${s.day}-${s.hour}`));

  const looksLikeQuest = text.includes("\t") || text.includes("Class Nbr");

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Your schedule</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={PLACEHOLDER}
            spellCheck={false}
            className="min-h-44 rounded-lg border border-border bg-card p-3 font-mono text-xs leading-relaxed outline-none focus:border-foreground"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>
            {blocks.length} block{blocks.length === 1 ? "" : "s"} found
          </span>
          {looksLikeQuest && blocks.length > 0 ? (
            <button
              type="button"
              onClick={() => setText(serializeSchedule(blocks))}
              className="rounded border border-border px-2 py-0.5 hover:text-foreground"
            >
              Tidy into one line per block
            </button>
          ) : null}
          {text ? (
            <button type="button" onClick={() => setText("")} className="rounded border border-border px-2 py-0.5 hover:text-foreground">
              Clear
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <span className="font-medium">Where</span>
          <FacilityPicker value={facility} onChange={setFacility} />
        </div>

        <div className="flex flex-wrap items-end gap-3 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Earliest</span>
            <HourSelect value={earliest} onChange={(v) => setEarliest(Math.min(v, latest - 1))} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Latest</span>
            <HourSelect value={latest} onChange={(v) => setLatest(Math.max(v, earliest + 1))} />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted">Based on</span>
            <RangeToggle value={range} onChange={setRange} recentDays={summary.recentDays} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium">Quietest open hours</h2>
          {best.length === 0 ? (
            <p className="text-sm text-muted">No data for this range and window yet.</p>
          ) : (
            <ol className="flex flex-col gap-1.5 text-sm">
              {best.map((s, i) => {
                const level = crowdLevel(s.pct);
                return (
                  <li key={`${s.day}-${s.hour}`} className="flex items-center gap-3">
                    <span className="w-4 text-xs text-muted tabular-nums">{i + 1}</span>
                    <span className="flex-1">
                      {dayName(s.day)} {hourLabel(s.hour)}–{hourLabel(s.hour + 1)}
                    </span>
                    <span className="text-xs text-muted">{level.label}</span>
                    <span className="w-10 text-right tabular-nums" style={{ color: heatColor(s.pct).replace(/ \/ [\d.]+\)/, ")") }}>
                      {s.pct}%
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-0.5 text-xs">
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
                  const key = `${day}-${hour}`;
                  const blocked = isBlocked(blocks, day, hour);
                  const closed = !isSlotOpen(facility, day, hour);
                  const outside = hour < earliest || hour >= latest;
                  const pct = aggregate.avg[day][hour];
                  const isBest = bestKeys.has(key);
                  const label = blocks.find((b) => b.day === day && b.start < hour + 1 && b.end > hour)?.label;
                  let className = "h-7 rounded-sm text-center tabular-nums";
                  let style: React.CSSProperties | undefined;
                  if (closed) className += " cell-closed";
                  else if (blocked) className += " bg-foreground/80 text-background";
                  else if (outside) className += " bg-muted/10 text-muted/50";
                  else if (pct != null) style = { background: heatColor(pct) };
                  if (isBest) className += " ring-2 ring-accent ring-inset font-semibold";
                  return (
                    <td
                      key={key}
                      className={className}
                      style={style}
                      title={
                        closed
                          ? "Closed"
                          : blocked
                            ? label ?? "Class"
                            : pct == null
                              ? "No data yet"
                              : `${pct}% · ${crowdLevel(pct).label}`
                      }
                    >
                      {blocked ? (label?.split(" ")[0] ?? "") : !closed && pct != null ? pct : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-muted">
          Dark cells are your classes. Gold outlines are the top {TOP_N} quietest hours inside your window.
        </p>
      </div>
    </div>
  );
}

function HourSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="rounded-md border border-border bg-card px-2 py-1.5 text-sm"
    >
      {[...HOURS, HOURS[HOURS.length - 1] + 1].map((h) => (
        <option key={h} value={h}>
          {hourLabel(h)}
        </option>
      ))}
    </select>
  );
}
