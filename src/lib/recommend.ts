import { HOURS } from "./analysis";
import { isSlotOpen, type FacilityId } from "./facilities";
import type { ScheduleBlock } from "./schedule";
import type { Aggregate } from "./summary";

export interface Slot {
  day: number;
  hour: number;
  pct: number;
  samples: number;
}

export interface SlotOptions {
  facility: FacilityId;
  aggregate: Aggregate;
  blocks: ScheduleBlock[];
  earliest: number;
  latest: number;
}

export function isBlocked(blocks: ScheduleBlock[], day: number, hour: number) {
  return blocks.some((b) => b.day === day && b.start < hour + 1 && b.end > hour);
}

export function openSlots({ facility, aggregate, blocks, earliest, latest }: SlotOptions): Slot[] {
  const slots: Slot[] = [];
  for (let day = 0; day < 7; day++) {
    for (const hour of HOURS) {
      const pct = aggregate.avg[day][hour];
      if (pct == null) continue;
      if (hour < earliest || hour >= latest) continue;
      if (!isSlotOpen(facility, day, hour)) continue;
      if (isBlocked(blocks, day, hour)) continue;
      slots.push({ day, hour, pct, samples: aggregate.n[day][hour] });
    }
  }
  return slots.sort((a, b) => a.pct - b.pct || a.day - b.day || a.hour - b.hour);
}
