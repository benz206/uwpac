import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatDate, shiftDate } from "@/lib/analysis";
import { FACILITIES, FACILITY_BY_ID, type FacilityId } from "@/lib/facilities";
import type { Reading, Summary } from "@/lib/summary";
import { dayTrend, weekStart, type DayTrend } from "@/lib/week";

export interface WeekDay {
  date: string;
  readings: Reading[];
}

interface Props {
  date: string;
  today: string;
  week: WeekDay[];
  summary: Summary | null;
  facility: FacilityId | null;
}

function sparkPath(values: (number | null)[], scale: number) {
  let d = "";
  let pen = false;
  values.forEach((v, i) => {
    if (v == null) {
      pen = false;
      return;
    }
    d += `${pen ? "L" : "M"}${i} ${100 - (v / scale) * 100} `;
    pen = true;
  });
  return d;
}

function deltaText(delta: number) {
  if (Math.abs(delta) < 4) return { text: "≈ usual", tone: "text-muted-foreground" };
  return delta > 0
    ? { text: `↑ ${delta} pts`, tone: "text-packed" }
    : { text: `↓ ${-delta} pts`, tone: "text-quiet" };
}

function Sparkline({ trend, scale }: { trend: DayTrend; scale: number }) {
  const width = trend.actual.length - 1;
  return (
    <svg viewBox={`0 0 ${width} 100`} preserveAspectRatio="none" aria-hidden className="h-8 w-full overflow-visible">
      <path d={sparkPath(trend.typical, scale)} fill="none" stroke="var(--muted-foreground)" strokeOpacity={0.6} strokeWidth={1.25} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      <path d={sparkPath(trend.actual, scale)} fill="none" stroke="var(--foreground)" strokeWidth={1.75} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function WeekStrip({ date, today, week, summary, facility }: Props) {
  const ids = facility ? [facility] : FACILITIES.map((f) => f.id);
  const days = week.map((d) => ({ ...d, trend: dayTrend(d.date, d.readings, ids, summary) }));
  const facilityParam = facility ? `&f=${facility}` : "";
  const scale = Math.max(40, ...days.flatMap((d) => [...d.trend.actual, ...d.trend.typical].filter((v) => v != null)));

  const measured = days.filter((d) => d.trend.avg != null && d.trend.typicalAvg != null);
  const weekAvg = measured.length ? Math.round(measured.reduce((a, d) => a + d.trend.avg!, 0) / measured.length) : null;
  const weekDelta = measured.length
    ? Math.round(measured.reduce((a, d) => a + d.trend.avg! - d.trend.typicalAvg!, 0) / measured.length)
    : null;
  const busiest = measured.length ? measured.reduce((a, b) => (b.trend.avg! > a.trend.avg! ? b : a)) : null;

  const first = week[0].date;
  const last = week[week.length - 1].date;
  const isThisWeek = weekStart(today) === first;

  const weekLink = (offset: number, label: string, Icon: typeof ChevronLeft) => (
    <Link
      href={`/day?date=${shiftDate(date, offset)}${facilityParam}`}
      aria-label={label}
      className="flex size-7 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="size-3.5" />
    </Link>
  );

  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-medium tracking-tight">
            Week of {formatDate(first, { month: "short", day: "numeric" })} – {formatDate(last, { month: "short", day: "numeric" })}
            <span className="text-muted-foreground"> · {facility ? FACILITY_BY_ID[facility].shortName : "All areas"}</span>
          </h2>
          <p className="text-[12.5px] text-muted-foreground">
            {weekAvg == null ? (
              "No readings this week yet. Showing what a typical week looks like."
            ) : (
              <>
                Averaging <span className="font-medium text-foreground tabular-nums">{weekAvg}%</span>
                {weekDelta != null ? (
                  <span className={`font-medium ${deltaText(weekDelta).tone}`}>
                    {" "}
                    · {Math.abs(weekDelta) < 4 ? "about usual" : `${Math.abs(weekDelta)} pts ${weekDelta > 0 ? "busier" : "quieter"} than usual`}
                  </span>
                ) : null}
                {busiest ? ` · Busiest ${formatDate(busiest.date, { weekday: "long" })}` : ""}
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {weekLink(-7, "Previous week", ChevronLeft)}
          {isThisWeek ? null : (
            <Link
              href={facility ? `/day?f=${facility}` : "/day"}
              className="flex h-7 items-center rounded-md border bg-card px-2.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              This week
            </Link>
          )}
          {weekLink(7, "Next week", ChevronRight)}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[680px] grid-cols-7 divide-x">
          {days.map(({ date: d, trend }) => {
            const selected = d === date;
            const future = d > today;
            const value = future ? trend.typicalAvg : trend.avg;
            const peak = future ? trend.typicalPeak : trend.peak;
            const delta = !future && trend.avg != null && trend.typicalAvg != null ? trend.avg - trend.typicalAvg : null;
            const label = `${formatDate(d)}: ${
              value == null ? "no data" : `${future ? "forecast" : "average"} ${value}%`
            }${delta != null ? `, ${delta >= 0 ? "+" : ""}${delta} vs typical` : ""}${peak != null ? `, peak ${peak}%` : ""}`;
            return (
              <Link
                key={d}
                href={`/day?date=${d}${facilityParam}`}
                aria-label={label}
                aria-current={selected ? "date" : undefined}
                title={label}
                className={`relative flex flex-col gap-2 px-3 pt-3 pb-2.5 transition-colors ${
                  selected ? "bg-accent/10" : "hover:bg-muted/60"
                }`}
              >
                {selected ? <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" /> : null}
                <div className="flex items-baseline justify-between gap-1 text-[11.5px]">
                  <span className={`font-medium uppercase tracking-wide ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                    {formatDate(d, { weekday: "short" })}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {d === today ? "Today" : formatDate(d, { day: "numeric" })}
                  </span>
                </div>
                <div>
                  <p className={`text-[22px] font-medium leading-none tracking-tight tabular-nums ${future ? "text-muted-foreground" : ""}`}>
                    {value == null ? "—" : `${future ? "~" : ""}${value}%`}
                  </p>
                  <p className={`mt-1 h-4 text-[11.5px] font-medium ${delta != null ? deltaText(delta).tone : "text-muted-foreground"}`}>
                    {delta != null ? deltaText(delta).text : future ? "Forecast" : d === today ? "No readings yet" : "No data"}
                  </p>
                </div>
                <Sparkline trend={trend} scale={scale} />
                <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  Peak {peak == null ? "—" : `${peak}%`}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
