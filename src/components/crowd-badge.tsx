import { Activity, CircleCheck, Flame, TriangleAlert, Users } from "lucide-react";
import type { Crowd } from "@/lib/analysis";

const STYLES = {
  quiet: { icon: CircleCheck, className: "bg-quiet/12 ring-quiet/30 [&>svg]:text-quiet" },
  light: { icon: Users, className: "bg-light/12 ring-light/30 [&>svg]:text-light" },
  moderate: { icon: Activity, className: "bg-moderate/15 ring-moderate/35 [&>svg]:text-moderate" },
  busy: { icon: TriangleAlert, className: "bg-busy/12 ring-busy/30 [&>svg]:text-busy" },
  packed: { icon: Flame, className: "bg-packed/12 ring-packed/30 [&>svg]:text-packed" },
};

export function CrowdBadge({ crowd }: { crowd: Crowd }) {
  const { icon: Icon, className } = STYLES[crowd.tone];
  return (
    <span
      className={`inline-flex shrink-0 select-none items-center gap-1.5 whitespace-nowrap rounded-[5px] px-2 py-1 text-[12px] font-medium leading-none text-foreground ring-1 ring-inset ${className}`}
    >
      <Icon className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
      {crowd.label}
    </span>
  );
}
