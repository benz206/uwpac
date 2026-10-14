import { Heatmap } from "@/components/heatmap";
import { loadSummary } from "@/lib/data";

export default async function HeatmapPage() {
  const summary = await loadSummary();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Weekly heatmap</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Average occupancy by day and hour for every area. Hover a cell for details.
        </p>
      </div>
      {summary ? (
        <Heatmap summary={summary} />
      ) : (
        <p className="rounded-2xl border border-black/8 bg-white/60 p-6 text-[13px] text-muted-foreground dark:border-white/10 dark:bg-white/[0.02]">
          No history yet. The scraper writes data/summary.json once it has run.
        </p>
      )}
    </div>
  );
}
