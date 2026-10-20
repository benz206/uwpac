import type { NextRequest } from "next/server";
import { formatDate, hourLabel, HOURS, localDate } from "@/lib/analysis";
import { loadDay, loadSummary } from "@/lib/data";
import { FACILITIES, FACILITY_BY_ID, isFacilityId } from "@/lib/facilities";
import { INK, MUTED, ogResponse, RULE } from "@/lib/og";
import { dayTrend } from "@/lib/week";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function extreme(values: (number | null)[], pick: (a: number, b: number) => boolean) {
  return values.reduce<{ pct: number; hour: number } | null>(
    (best, pct, i) => (pct != null && (!best || pick(pct, best.pct)) ? { pct, hour: HOURS[i] } : best),
    null,
  );
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, borderTop: `1px solid ${RULE}`, paddingTop: 12 }}>
      <div style={{ fontSize: 18, color: MUTED }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontSize: 38, letterSpacing: -1.5, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 18, color: MUTED }}>{detail}</div>
      </div>
    </div>
  );
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const today = localDate(new Date());
  const dateParam = params.get("date");
  const date = dateParam && DATE_RE.test(dateParam) ? dateParam : today;
  const fParam = params.get("f");
  const facility = fParam && isFacilityId(fParam) ? fParam : null;

  const [readings, summary] = await Promise.all([date > today ? [] : loadDay(date, date < today), loadSummary()]);
  const trend = dayTrend(date, readings, facility ? [facility] : FACILITIES.map((f) => f.id), summary);
  const hasActual = trend.actual.some((v) => v != null);
  const series = hasActual ? trend.actual : trend.typical;
  const peak = extreme(series, (a, b) => a > b);
  const quietest = extreme(series, (a, b) => a < b);
  const delta = trend.avg != null && trend.typicalAvg != null ? trend.avg - trend.typicalAvg : null;

  return ogResponse({
    tag: facility ? FACILITY_BY_ID[facility].shortName : "All areas",
    title: formatDate(date, { weekday: "long", month: "long", day: "numeric" }),
    subtitle: hasActual ? (date === today ? "Today so far, against a typical day" : "Actual against a typical day") : "Forecast from past weeks",
    children: (
      <div style={{ display: "flex", width: "100%", gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", flex: 1, alignItems: "flex-end", gap: 6 }}>
            {HOURS.map((hour, i) => (
              <div key={hour} style={{ display: "flex", flex: 1, height: "100%", alignItems: "flex-end", position: "relative" }}>
                <div style={{ width: "100%", height: `${trend.typical[i] ?? 0}%`, background: hasActual ? RULE : MUTED, borderRadius: "4px 4px 0 0" }} />
                {trend.actual[i] != null ? (
                  <div
                    style={{ position: "absolute", left: 4, right: 4, bottom: 0, height: `${trend.actual[i]}%`, background: INK, borderRadius: "3px 3px 0 0" }}
                  />
                ) : null}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", position: "relative", height: 22, fontSize: 18, color: MUTED, marginTop: 10 }}>
            {[6, 12, 18, 23].map((h) => (
              <div key={h} style={{ position: "absolute", left: `${((h - HOURS[0] + 0.5) / HOURS.length) * 100}%`, width: 60, marginLeft: -30, justifyContent: "center", display: "flex" }}>
                {hourLabel(h)}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: 320, gap: 16 }}>
          <Stat label={hasActual ? "Peak" : "Expected peak"} value={peak ? `${peak.pct}%` : "—"} detail={peak ? `at ${hourLabel(peak.hour)}` : "No data"} />
          <Stat label={hasActual ? "Quietest" : "Best time"} value={quietest ? `${quietest.pct}%` : "—"} detail={quietest ? `at ${hourLabel(quietest.hour)}` : "No data"} />
          {delta != null ? (
            <Stat
              label="Versus typical"
              value={Math.abs(delta) < 4 ? "About usual" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} pts`}
              detail={Math.abs(delta) < 4 ? `averaging ${trend.avg}%` : `${delta > 0 ? "busier" : "quieter"} · avg ${trend.avg}%`}
            />
          ) : null}
        </div>
      </div>
    ),
  });
}
