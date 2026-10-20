import { crowdLevel, occupancyPct } from "@/lib/analysis";
import { loadLive } from "@/lib/data";
import { FACILITIES, TIMEZONE } from "@/lib/facilities";
import { INK, MUTED, ogResponse, RULE, TONE_HEX } from "@/lib/og";

export async function GET() {
  const live = await loadLive();
  const byId = new Map(live.readings.map((r) => [r.facility, r]));
  const time = new Date(live.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TIMEZONE });

  return ogResponse({
    tag: `Live · ${time}`,
    title: "How busy is the gym right now?",
    children: (
      <div style={{ display: "flex", flexWrap: "wrap", width: "100%", gap: 20 }}>
        {FACILITIES.map((f) => {
          const reading = byId.get(f.id);
          const pct = reading ? occupancyPct(reading.count, reading.max) : null;
          const crowd = pct == null ? null : crowdLevel(pct);
          return (
            <div
              key={f.id}
              style={{ display: "flex", flexDirection: "column", width: 344, background: "#fff", border: `1px solid ${RULE}`, borderRadius: 10, padding: "18px 22px", gap: 10 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 24 }}>{f.shortName}</div>
                <div style={{ fontSize: 20, color: crowd ? TONE_HEX[crowd.tone] : MUTED }}>{crowd?.label ?? "Closed"}</div>
              </div>
              <div style={{ fontSize: 52, letterSpacing: -2, lineHeight: 1, color: pct == null ? MUTED : INK }}>
                {pct == null ? "—" : `${pct}%`}
              </div>
              <div style={{ display: "flex", height: 6, borderRadius: 3, background: RULE }}>
                {crowd ? <div style={{ width: `${pct}%`, height: 6, borderRadius: 3, background: TONE_HEX[crowd.tone] }} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    ),
  });
}
