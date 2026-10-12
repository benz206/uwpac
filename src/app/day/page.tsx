import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { DayView } from "@/components/day-view";
import { localDate, shiftDate, toLocal } from "@/lib/analysis";
import { loadDay, loadSummary } from "@/lib/data";
import { FACILITIES, isFacilityId } from "@/lib/facilities";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function DayPage({ searchParams }: PageProps<"/day">) {
  const params = await searchParams;
  const now = new Date();
  const today = localDate(now);
  const date = typeof params.date === "string" && DATE_RE.test(params.date) ? params.date : today;
  const facility = typeof params.f === "string" && isFacilityId(params.f) ? params.f : FACILITIES[0].id;
  const local = toLocal(now);

  const [readings, summary] = await Promise.all([date > today ? [] : loadDay(date), loadSummary()]);

  const navLink = (offset: number, label: string, Icon: typeof ChevronLeft) => (
    <Link
      href={`/day?date=${shiftDate(date, offset)}&f=${facility}`}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-full border border-black/8 bg-white/60 text-muted-foreground transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/[0.03]"
    >
      <Icon className="size-4" />
    </Link>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">{formatDate(date)}</h1>
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
              href={`/day?f=${facility}`}
              className="rounded-full border border-black/8 bg-white/60 px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground dark:border-white/10 dark:bg-white/[0.03]"
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
        summary={summary}
        initialFacility={facility}
      />
    </div>
  );
}
