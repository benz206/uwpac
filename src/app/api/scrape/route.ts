import { addReadings, rebuildSummary } from "@/lib/data";
import { fetchLive } from "@/lib/scrape";
import type { Reading } from "@/lib/summary";

export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const live = await fetchLive({ cache: "no-store" });
  if (live.length === 0) {
    return new Response("Parsed zero facilities; upstream HTML may have changed.", { status: 502 });
  }

  const reading: Reading = {
    t: now.toISOString().replace(/\.\d{3}Z$/, "Z"),
    o: Object.fromEntries(live.map((r) => [r.facility, [r.count, r.max]])),
  };
  await addReadings([reading]);
  const summary = await rebuildSummary(now);

  return Response.json({ reading, totalReadings: summary.totalReadings });
}
