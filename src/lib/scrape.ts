import { FACILITY_BY_UPSTREAM_ID, type FacilityId } from "./facilities";

export const OCCUPANCY_URL = "https://warrior.uwaterloo.ca/FacilityOccupancy";

export interface LiveReading {
  facility: FacilityId;
  count: number;
  max: number;
}

const CANVAS_RE =
  /<canvas[^>]*id="occupancyChart-([0-9a-f-]{36})"[^>]*data-occupancy="(\d+)"/;
const MAX_RE = /class="max-occupancy[^"]*">[^<]*<strong>\s*(\d+)\s*<\/strong>/;

export function parseOccupancyHtml(html: string): LiveReading[] {
  const readings: LiveReading[] = [];
  for (const card of html.split('<div class="occupancy-card">').slice(1)) {
    const canvas = card.match(CANVAS_RE);
    const max = card.match(MAX_RE);
    if (!canvas || !max) continue;
    const facility = FACILITY_BY_UPSTREAM_ID[canvas[1]];
    if (!facility) continue;
    readings.push({
      facility: facility.id,
      count: Number(canvas[2]),
      max: Number(max[1]),
    });
  }
  return readings;
}

export async function fetchLive(init?: RequestInit): Promise<LiveReading[]> {
  const res = await fetch(OCCUPANCY_URL, {
    ...init,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:115.0) Gecko/20100101 Firefox/115.0",
      Accept: "text/html",
    },
  });
  if (!res.ok) throw new Error(`Upstream responded ${res.status}`);
  return parseOccupancyHtml(await res.text());
}
