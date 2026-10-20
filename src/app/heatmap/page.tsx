import type { Metadata } from "next";
import { Heatmap } from "@/components/heatmap";
import { loadSummary } from "@/lib/data";
import { OG_BASE, ogImage } from "@/lib/site";

const description = "Average occupancy by day and hour for every PAC and CIF area. Find the quiet times.";

export const metadata: Metadata = {
  title: "Weekly heatmap",
  description,
  openGraph: { ...OG_BASE, title: "Weekly heatmap", description, images: [ogImage("/og/heatmap", "Weekly occupancy heatmaps for every area")] },
};

export default async function HeatmapPage() {
  const summary = await loadSummary();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-4xl font-medium tracking-[-0.03em]">Weekly heatmap</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Average occupancy by day and hour for every area. Hover a cell for details.
        </p>
      </div>
      {summary ? (
        <Heatmap summary={summary} />
      ) : (
        <p className="rounded-lg border bg-card p-6 text-[13px] text-muted-foreground">
          No history yet. The scraper writes data/summary.json once it has run.
        </p>
      )}
    </div>
  );
}
