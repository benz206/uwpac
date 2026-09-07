import { Heatmap } from "@/components/heatmap";
import { loadSummary } from "@/lib/data";

export const revalidate = 300;

export default async function HeatmapPage() {
  const summary = await loadSummary();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Weekly heatmap</h1>
        <p className="text-sm text-muted">Average occupancy by day and hour. Hover a cell for details.</p>
      </div>
      {summary ? (
        <Heatmap summary={summary} />
      ) : (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted">
          No history yet. The scraper writes data/summary.json once it has run.
        </p>
      )}
    </div>
  );
}
