import { DAY_NAMES, TIMEZONE } from "./facilities";

export const FIRST_HOUR = 6;
export const LAST_HOUR = 23;
export const HOURS = Array.from(
  { length: LAST_HOUR - FIRST_HOUR + 1 },
  (_, i) => FIRST_HOUR + i,
);

export type Grid<T> = T[][];

export interface LocalTime {
  day: number;
  hour: number;
  minute: number;
}

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIMEZONE,
  weekday: "short",
  hour: "numeric",
  minute: "numeric",
  hour12: false,
});

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function toLocal(date: Date): LocalTime {
  const parts = partsFormatter.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: SHORT_DAYS.indexOf(get("weekday")),
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
  };
}

const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE });

export function localDate(date: Date) {
  return dateFormatter.format(date);
}

export function shiftDate(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function weekdayOf(isoDate: string) {
  return new Date(`${isoDate}T12:00:00Z`).getUTCDay();
}

export function occupancyPct(count: number, max: number) {
  if (max <= 0) return 0;
  return Math.min(100, Math.round((count / max) * 100));
}

export type Crowd = {
  label: string;
  tone: "quiet" | "light" | "moderate" | "busy" | "packed";
};

export function crowdLevel(pct: number): Crowd {
  if (pct < 25) return { label: "Very quiet", tone: "quiet" };
  if (pct < 45) return { label: "Light", tone: "light" };
  if (pct < 60) return { label: "Moderate", tone: "moderate" };
  if (pct < 80) return { label: "Busy", tone: "busy" };
  return { label: "Packed", tone: "packed" };
}

export function hourLabel(hour: number) {
  const h = hour % 24;
  const suffix = h < 12 ? "am" : "pm";
  return `${h % 12 === 0 ? 12 : h % 12}${suffix}`;
}

export function dayName(day: number) {
  return DAY_NAMES[day];
}

export function emptyGrid<T>(fill: T): Grid<T> {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => fill));
}
