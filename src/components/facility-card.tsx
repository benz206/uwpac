import { crowdLevel, hourLabel, HOURS } from "@/lib/analysis";
import type { Facility } from "@/lib/facilities";

interface Props {
  facility: Facility;
  count: number;
  max: number;
  pct: number;
  typicalNow: number | null;
  typicalToday: (number | null)[];
  currentHour: number;
}

const TONE_TEXT = {
  quiet: "text-quiet",
  light: "text-light",
  moderate: "text-moderate",
  busy: "text-busy",
  packed: "text-packed",
};

const TONE_BG = {
  quiet: "bg-quiet",
  light: "bg-light",
  moderate: "bg-moderate",
  busy: "bg-busy",
  packed: "bg-packed",
};

function comparison(pct: number, typical: number | null) {
  if (typical == null) return "No history for this hour yet";
  const diff = pct - typical;
  if (Math.abs(diff) < 8) return `About usual (~${typical}%)`;
  return diff < 0 ? `Quieter than usual (~${typical}%)` : `Busier than usual (~${typical}%)`;
}

export function FacilityCard({ facility, count, max, pct, typicalNow, typicalToday, currentHour }: Props) {
  const level = crowdLevel(pct);
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold leading-tight">{facility.shortName}</h2>
          <p className="text-xs text-muted">{facility.name}</p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TONE_TEXT[level.tone]} bg-current/10`}>
          {level.label}
        </span>
      </div>

      <div className="flex items-end gap-3">
        <span className={`text-5xl font-semibold tabular-nums tracking-tight ${TONE_TEXT[level.tone]}`}>
          {pct}%
        </span>
        <span className="pb-1.5 text-sm text-muted tabular-nums">
          {count} / {max}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div className={`h-full rounded-full ${TONE_BG[level.tone]}`} style={{ width: `${pct}%` }} />
      </div>

      <div>
        <p className="mb-2 text-xs text-muted">{comparison(pct, typicalNow)}</p>
        <div className="flex h-10 items-end gap-px" aria-label="Typical occupancy today by hour">
          {HOURS.map((hour, i) => {
            const value = typicalToday[i];
            const isNow = hour === currentHour;
            return (
              <div
                key={hour}
                title={value == null ? `${hourLabel(hour)}: no data` : `${hourLabel(hour)}: ~${value}%`}
                className={`flex-1 rounded-sm ${
                  isNow ? TONE_BG[crowdLevel(value ?? 0).tone] : "bg-muted/25"
                }`}
                style={{ height: `${Math.max(6, value ?? 0)}%` }}
              />
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span>{hourLabel(HOURS[0])}</span>
          <span>{hourLabel(HOURS[HOURS.length - 1])}</span>
        </div>
      </div>
    </article>
  );
}
