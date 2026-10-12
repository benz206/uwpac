import { loadLive } from "@/lib/data";
import { FACILITY_BY_ID } from "@/lib/facilities";
import { occupancyPct } from "@/lib/analysis";

export async function GET() {
  const { fetchedAt, readings } = await loadLive();
  return Response.json({
    fetchedAt,
    facilities: readings.map((r) => ({
      id: r.facility,
      name: FACILITY_BY_ID[r.facility].name,
      count: r.count,
      max: r.max,
      pct: occupancyPct(r.count, r.max),
    })),
  });
}
