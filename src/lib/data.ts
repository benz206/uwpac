import postgres from "postgres";
import { fetchLive, type LiveReading } from "./scrape";
import { buildSummary, type Reading, type Summary } from "./summary";

const LIVE_TTL = 60;

const sql = postgres(process.env.DATABASE_URL!);

export async function createTables() {
  await sql`create table if not exists readings (t timestamptz primary key, o jsonb not null)`;
  await sql`create table if not exists summary (id int primary key, data jsonb not null)`;
}

export async function loadSummary(): Promise<Summary | null> {
  const [row] = await sql<{ data: Summary }[]>`select data from summary where id = 1`;
  return row?.data ?? null;
}

export async function addReadings(readings: Reading[]) {
  await sql`
    insert into readings (t, o)
    select t, o from jsonb_to_recordset(${sql.json(readings as unknown as postgres.JSONValue)}) as r(t timestamptz, o jsonb)
    on conflict (t) do nothing
  `;
}

export async function rebuildSummary(now = new Date()): Promise<Summary> {
  const rows = await sql<{ t: Date; o: Reading["o"] }[]>`select t, o from readings order by t`;
  const summary = buildSummary(
    rows.map((r) => ({ t: r.t.toISOString(), o: r.o })),
    now,
  );
  await sql`
    insert into summary (id, data) values (1, ${sql.json(summary as unknown as postgres.JSONValue)})
    on conflict (id) do update set data = excluded.data
  `;
  return summary;
}

export async function closeDb() {
  await sql.end();
}

export interface LiveSnapshot {
  fetchedAt: string;
  readings: LiveReading[];
}

export async function loadLive(): Promise<LiveSnapshot> {
  const readings = await fetchLive({ next: { revalidate: LIVE_TTL } });
  return { fetchedAt: new Date().toISOString(), readings };
}
