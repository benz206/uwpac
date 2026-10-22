import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DayView } from "@/components/day-view";
import { formatDate, localDate, shiftDate, toLocal } from "@/lib/analysis";
import { loadSummary, loadWeek } from "@/lib/data";
import { FACILITY_BY_ID, isFacilityId } from "@/lib/facilities";
import { OG_BASE, ogImage } from "@/lib/site";
import { weekStart } from "@/lib/week";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function readParams(searchParams: PageProps<"/day">["searchParams"]) {
  const params = await searchParams;
  const today = localDate(new Date());
  const date = typeof params.date === "string" && DATE_RE.test(params.date) ? params.date : today;
  const facility = typeof params.f === "string" && isFacilityId(params.f) ? params.f : null;
  return { today, date, facility };
}

export async function generateMetadata({ searchParams }: PageProps<"/day">): Promise<Metadata> {
  const { today, date, facility } = await readParams(searchParams);
  const subject = facility ? FACILITY_BY_ID[facility].shortName : "PAC and CIF";
  const title = `${facility ? `${FACILITY_BY_ID[facility].shortName} · ` : ""}${formatDate(date, { weekday: "short", month: "short", day: "numeric" })}`;
  const description =
    date < today
      ? `How busy ${subject} was on ${formatDate(date)}, against a typical ${formatDate(date, { weekday: "long" })}.`
      : `When ${subject} will be busy and quiet on ${formatDate(date)}.`;
  const og = `/og/day?date=${date}${facility ? `&f=${facility}` : ""}`;
  return {
    title,
    description,
    openGraph: { ...OG_BASE, title, description, images: [ogImage(og, `Occupancy for ${subject} on ${formatDate(date)}`)] },
  };
}

export default function DayPage({ searchParams }: PageProps<"/day">) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <div className="h-[60px] w-80 max-w-full animate-pulse rounded-lg bg-muted" />
          <div className="h-[180px] animate-pulse rounded-lg bg-muted" />
          <div className="h-[460px] animate-pulse rounded-lg bg-muted" />
        </div>
      }
    >
      <DayContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DayContent({ searchParams }: Pick<PageProps<"/day">, "searchParams">) {
  const { today, date, facility } = await readParams(searchParams);
  const facilityParam = facility ? `&f=${facility}` : "";
  const local = toLocal(new Date());

  const start = weekStart(date);
  const weekDates = Array.from({ length: 7 }, (_, i) => shiftDate(start, i));
  const [weekReadings, summary] = await Promise.all([loadWeek(start, weekDates[6] < today), loadSummary()]);
  const week = weekDates.map((d) => ({ date: d, readings: weekReadings.filter((r) => localDate(new Date(r.t)) === d) }));
  const readings = week.find((d) => d.date === date)!.readings;

  const navLink = (offset: number, label: string, Icon: typeof ChevronLeft) => (
    <Link
      href={`/day?date=${shiftDate(date, offset)}${facilityParam}`}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-md border bg-card text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="size-4" />
    </Link>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-medium tracking-[-0.03em]">{formatDate(date)}</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {date < today
              ? "What it was actually like, against a typical day."
              : date === today
                ? "Today so far, and what to expect for the rest of the day."
                : "What to expect, based on past weeks."}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {navLink(-1, "Previous day", ChevronLeft)}
          {date !== today ? (
            <Link
              href={facility ? `/day?f=${facility}` : "/day"}
              className="flex h-8 items-center rounded-md border bg-card px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Today
            </Link>
          ) : null}
          {navLink(1, "Next day", ChevronRight)}
        </div>
      </div>

      <DayView
        key={date}
        date={date}
        today={today}
        nowHour={date === today ? local.hour + local.minute / 60 : null}
        readings={readings}
        week={week}
        summary={summary}
        initialExpanded={facility}
      />
    </div>
  );
}
