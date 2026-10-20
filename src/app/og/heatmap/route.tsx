import { HEAT_STEPS, heatStep, HOURS } from "@/lib/analysis";
import { loadSummary } from "@/lib/data";
import { FACILITIES, isSlotOpen } from "@/lib/facilities";
import { MUTED, ogResponse, RULE } from "@/lib/og";
import { pickAggregate } from "@/lib/typical";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export async function GET() {
  const summary = await loadSummary();

  return ogResponse({
    tag: "Weekly heatmap",
    title: "When is the gym quiet?",
    children: (
      <div style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
        {FACILITIES.map((f) => {
          const aggregate = summary ? pickAggregate(summary.facilities[f.id]).aggregate : null;
          return (
            <div key={f.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 18, color: MUTED }}>{f.shortName}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {HOURS.map((hour) => (
                  <div key={hour} style={{ display: "flex", gap: 2 }}>
                    {DAY_ORDER.map((day) => {
                      const pct = aggregate?.avg[day][hour];
                      const open = isSlotOpen(f.id, day, hour);
                      return (
                        <div
                          key={day}
                          style={{
                            width: 21,
                            height: 13,
                            borderRadius: 3,
                            background: open && pct != null ? HEAT_STEPS[heatStep(pct)] : RULE,
                            opacity: open ? 1 : 0.5,
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    ),
  });
}
