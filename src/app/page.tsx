import { AutoRefresh } from "@/components/auto-refresh";
import { FacilityCard } from "@/components/facility-card";
import { HOURS, occupancyPct, toLocal } from "@/lib/analysis";
import { loadLive, loadSummary } from "@/lib/data";
import { FACILITIES, isSlotOpen } from "@/lib/facilities";
import { pickAggregate } from "@/lib/typical";

export const revalidate = 60;

export default async function LivePage() {
  const [live, summary] = await Promise.all([
    loadLive().catch((error: Error) => ({ error })),
    loadSummary(),
  ]);

  if ("error" in live) {
    return (
      <div className="rounded-2xl border border-black/8 bg-white/60 p-6 dark:border-white/10 dark:bg-white/[0.02]">
        <h1 className="text-[15px] font-medium">Couldn&apos;t reach the occupancy page</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{live.error.message}. Try again in a minute.</p>
      </div>
    );
  }

  const local = toLocal(new Date(live.fetchedAt));
  const byId = new Map(live.readings.map((r) => [r.facility, r]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Right now</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Live headcount per area, with how it usually looks at this hour.
          </p>
        </div>
        <AutoRefresh fetchedAt={live.fetchedAt} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FACILITIES.map((facility) => {
          const reading = byId.get(facility.id);
          if (!reading) return null;
          const facilitySummary = summary?.facilities[facility.id];
          const aggregate = facilitySummary ? pickAggregate(facilitySummary).aggregate : null;
          const typicalToday = HOURS.map((hour) =>
            aggregate && isSlotOpen(facility.id, local.day, hour) ? aggregate.avg[local.day][hour] : null,
          );
          return (
            <FacilityCard
              key={facility.id}
              facility={facility}
              count={reading.count}
              max={reading.max}
              pct={occupancyPct(reading.count, reading.max)}
              typicalNow={typicalToday[local.hour - HOURS[0]] ?? null}
              typicalToday={typicalToday}
              currentHour={local.hour}
            />
          );
        })}
      </div>
    </div>
  );
}
