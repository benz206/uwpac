import { CrowdBadge } from "@/components/crowd-badge";
import { HourlyChart } from "@/components/hourly-chart";
import { NumberTicker } from "@/components/motion/number-ticker";
import { crowdLevel } from "@/lib/analysis";
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

function comparison(pct: number, typical: number | null) {
  if (typical == null) return { text: "No history for this hour yet", tone: "text-muted-foreground" };
  const diff = pct - typical;
  if (Math.abs(diff) < 8) return { text: `About usual · ~${typical}%`, tone: "text-muted-foreground" };
  return diff < 0
    ? { text: `↓ Quieter than usual · ~${typical}%`, tone: "text-quiet" }
    : { text: `↑ Busier than usual · ~${typical}%`, tone: "text-packed" };
}

export function FacilityCard({ facility, count, max, pct, typicalNow, typicalToday, currentHour }: Props) {
  const crowd = crowdLevel(pct);
  const vsUsual = comparison(pct, typicalNow);
  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-black/8 bg-white/60 p-5 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-medium tracking-tight">{facility.shortName}</h2>
          <p className="truncate text-[12.5px] text-muted-foreground">{facility.name}</p>
        </div>
        <CrowdBadge crowd={crowd} />
      </div>

      <div>
        <div className="flex items-end justify-between gap-3">
          <NumberTicker
            value={pct}
            suffix="%"
            className="text-5xl font-medium leading-none tracking-tight"
          />
          <span className="pb-1 font-mono text-[12.5px] tabular-nums text-muted-foreground">
            {count} / {max}
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div
            className="h-full origin-left rounded-full transition-[width] duration-700"
            style={{ width: `${pct}%`, background: `var(--tone-${crowd.tone})` }}
          />
        </div>
        <p className={`mt-2 text-[12.5px] font-medium ${vsUsual.tone}`}>{vsUsual.text}</p>
      </div>

      <div className="border-t border-black/5 pt-4 dark:border-white/10">
        <p className="mb-2 text-[12px] text-muted-foreground">Typical today</p>
        <HourlyChart values={typicalToday} currentHour={currentHour} />
      </div>
    </article>
  );
}
