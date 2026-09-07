import type { FacilitySummary, Aggregate } from "./summary";

const MIN_RECENT_SAMPLES = 150;

export function pickAggregate(summary: FacilitySummary): { aggregate: Aggregate; range: "recent" | "all" } {
  const recentSamples = summary.recent.n.flat().reduce((a, b) => a + b, 0);
  return recentSamples >= MIN_RECENT_SAMPLES
    ? { aggregate: summary.recent, range: "recent" }
    : { aggregate: summary.all, range: "all" };
}
