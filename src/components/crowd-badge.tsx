import { Activity, CircleCheck, Flame, TriangleAlert, Users } from "lucide-react";
import type { Crowd } from "@/lib/analysis";

const STYLES = {
  quiet: {
    icon: CircleCheck,
    className:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-300/25",
  },
  light: {
    icon: Users,
    className:
      "bg-lime-50 text-lime-700 ring-lime-600/20 dark:bg-lime-400/10 dark:text-lime-300 dark:ring-lime-300/25",
  },
  moderate: {
    icon: Activity,
    className:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-300/25",
  },
  busy: {
    icon: TriangleAlert,
    className:
      "bg-orange-50 text-orange-700 ring-orange-600/20 dark:bg-orange-400/10 dark:text-orange-300 dark:ring-orange-300/25",
  },
  packed: {
    icon: Flame,
    className:
      "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-300/25",
  },
};

export function CrowdBadge({ crowd }: { crowd: Crowd }) {
  const { icon: Icon, className } = STYLES[crowd.tone];
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium leading-none ring-1 ring-inset ${className}`}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      {crowd.label}
    </span>
  );
}
