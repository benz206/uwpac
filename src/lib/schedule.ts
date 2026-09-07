export interface ScheduleBlock {
  day: number;
  start: number;
  end: number;
  label?: string;
}

const DAY_TO_INDEX: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const QUEST_DAY_TOKENS: [string, number[]][] = [
  ["TTh", [2, 4]],
  ["TuTh", [2, 4]],
  ["MWF", [1, 3, 5]],
  ["MW", [1, 3]],
  ["WF", [3, 5]],
  ["Th", [4]],
  ["Tu", [2]],
  ["Mo", [1]],
  ["We", [3]],
  ["Fr", [5]],
  ["Sa", [6]],
  ["Su", [0]],
  ["M", [1]],
  ["T", [2]],
  ["W", [3]],
  ["F", [5]],
];

const COMPONENTS = new Set(["LEC", "TST", "TUT", "LAB", "SEM", "PRA", "WRK"]);
const COURSE_TITLE = /^([A-Za-z&]+\s+\d+[A-Z]?)\s+-\s+.+/;
const DATE_LINE = /^\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*\d{1,2}\/\d{1,2}\/\d{4}/;
const QUEST_RANGE = /^(.+?)\s+(\d{1,2}:\d{2}\s*(?:AM|PM))\s*-\s*(\d{1,2}:\d{2}\s*(?:AM|PM))$/i;
const SIMPLE_RANGE = /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})(?:\s+(.+))?$/;

function parse24h(text: string): number | null {
  const [h, m = 0] = text.split(":").map(Number);
  return Number.isNaN(h) || Number.isNaN(m) ? null : h + m / 60;
}

function parse12h(text: string): number | null {
  const m = text.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h + Number(m[2]) / 60;
}

function expandQuestDays(text: string): number[] {
  const days = new Set<number>();
  let i = 0;
  while (i < text.length) {
    const token = QUEST_DAY_TOKENS.find(([tok]) => text.startsWith(tok, i));
    if (token) {
      token[1].forEach((d) => days.add(d));
      i += token[0].length;
    } else {
      i += 1;
    }
  }
  return [...days].sort((a, b) => a - b);
}

function parseQuestCell(cell: string, label?: string): ScheduleBlock[] {
  const upper = cell.toUpperCase();
  if (!cell || upper === "TBA" || upper.includes("ONL")) return [];
  const m = cell.match(QUEST_RANGE);
  if (!m) return [];
  const start = parse12h(m[2]);
  const end = parse12h(m[3]);
  if (start == null || end == null || end <= start) return [];
  return expandQuestDays(m[1].trim()).map((day) => ({ day, start, end, label }));
}

function isWithdrawn(lines: string[], from: number) {
  for (let j = from + 1; j < lines.length && j < from + 50; j++) {
    if (lines[j].startsWith("Class Nbr") || COURSE_TITLE.test(lines[j])) return false;
    if (/\bWithdrawn\b/i.test(lines[j])) return true;
  }
  return false;
}

function parseQuest(text: string): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];

  for (const line of text.split(/\r?\n/)) {
    if (!line.includes("\t") || line.startsWith("Class Nbr")) continue;
    const parts = line.split("\t").map((p) => p.trim()).filter(Boolean);
    const compIdx = parts.findIndex((p) => COMPONENTS.has(p));
    if (compIdx >= 0 && compIdx + 1 < parts.length) {
      blocks.push(...parseQuestCell(parts[compIdx + 1], parts[compIdx]));
    }
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  let course: string | undefined;
  let skip = false;
  for (let i = 0; i < lines.length; i++) {
    const title = lines[i].match(COURSE_TITLE);
    if (title) {
      course = title[1].replace(/\s+/g, " ");
      skip = isWithdrawn(lines, i);
      continue;
    }
    if (!/^\d{4}$/.test(lines[i]) || i + 3 >= lines.length) continue;
    const component = lines[i + 2];
    if (!/^\d{3}$/.test(lines[i + 1]) || !COMPONENTS.has(component)) continue;
    let j = i + 4;
    while (j < lines.length && !DATE_LINE.test(lines[j])) j++;
    if (j >= lines.length) continue;
    if (!skip) {
      const label = [course, component].filter(Boolean).join(" ");
      blocks.push(...parseQuestCell(lines[i + 3], label));
    }
    i = j;
  }

  return dedupe(blocks);
}

function parseSimple(text: string): ScheduleBlock[] {
  const blocks: ScheduleBlock[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const [dayToken] = line.split(/\s+/);
    const day = DAY_TO_INDEX[dayToken?.toLowerCase() ?? ""];
    if (day == null) continue;
    const m = line.slice(dayToken.length).trim().match(SIMPLE_RANGE);
    if (!m) continue;
    const start = parse24h(m[1]);
    const end = parse24h(m[2]);
    if (start == null || end == null || end <= start) continue;
    blocks.push({ day, start, end, label: m[3]?.trim() || undefined });
  }
  return blocks;
}

function dedupe(blocks: ScheduleBlock[]) {
  const seen = new Set<string>();
  return blocks.filter((b) => {
    const key = `${b.day}|${b.start}|${b.end}|${b.label ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function looksLikeQuest(text: string) {
  return (
    text.includes("Class Nbr") ||
    text.includes("Days & Times") ||
    /\n\d{4}\s*\n\s*\d{3}\s*\n\s*(LEC|TST|TUT|LAB|SEM|PRA)\s*\n/.test(text) ||
    /\t(LEC|TST|TUT|LAB|SEM|PRA)\t/i.test(text)
  );
}

export function parseSchedule(text: string): ScheduleBlock[] {
  if (!text.trim()) return [];
  if (looksLikeQuest(text)) {
    const quest = parseQuest(text);
    if (quest.length) return quest;
  }
  return parseSimple(text);
}

export function formatHour24(decimal: number) {
  const total = Math.round(decimal * 60);
  const hh = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function serializeSchedule(blocks: ScheduleBlock[]) {
  return [...blocks]
    .sort((a, b) => a.day - b.day || a.start - b.start)
    .map((b) =>
      [`${DAY_NAMES[b.day]} ${formatHour24(b.start)}-${formatHour24(b.end)}`, b.label]
        .filter(Boolean)
        .join(" "),
    )
    .join("\n");
}
