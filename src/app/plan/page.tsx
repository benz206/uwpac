import { Planner } from "@/components/planner";
import { loadSummary } from "@/lib/data";

export const revalidate = 300;

export default async function PlanPage() {
  const summary = await loadSummary();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Plan around your classes</h1>
        <p className="text-sm text-muted">
          Paste your Quest schedule and get the quietest free hours for the area you use.
        </p>
      </div>
      {summary ? (
        <Planner summary={summary} />
      ) : (
        <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted">No history yet.</p>
      )}
    </div>
  );
}
