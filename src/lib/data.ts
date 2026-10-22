import { cacheLife, cacheTag } from "next/cache";
import postgres from "postgres";
import { shiftDate } from "./analysis";
import { TIMEZONE } from "./facilities";
import { fetchLive, type LiveReading } from "./scrape";
import { RECENT_DAYS, summaryFromBuckets, type Bucket, type Reading, type Summary } from "./summary";

const sql = postgres(process.env.DATABASE_URL!);

async function withConnection<T>(run: (db: postgres.Sql) => Promise<T>): Promise<T> {
  const db = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    return await run(db);
  } finally {
    await db.end();
  }
}

export async function createTables() {
  await sql`create table if not exists readings (t timestamptz primary key, o jsonb not null)`;
  await sql`create table if not exists summary (id int primary key, data jsonb not null)`;
}

export async function loadSummary(): Promise<Summary | null> {
  "use cache: remote";
  cacheLife("scrape");
  cacheTag("summary");
  const [row] = await withConnection((db) => db<{ data: Summary }[]>`select data from summary where id = 1`);
  return row?.data ?? null;
}

export async function loadDay(isoDate: string, complete: boolean): Promise<Reading[]> {
  "use cache: remote";
  if (complete) cacheLife("max");
  else cacheLife("scrape");
  cacheTag(`day:${isoDate}`);
  const rows = await withConnection(
    (db) => db<{ t: Date; o: Reading["o"] }[]>`
      select t, o from readings
      where t >= (${isoDate}::date::timestamp at time zone ${TIMEZONE})
        and t < ((${isoDate}::date + 1)::timestamp at time zone ${TIMEZONE})
      order by t
    `,
  );
  return rows.map((r) => ({ t: r.t.toISOString(), o: r.o }));
}

export async function loadWeek(start: string, complete: boolean): Promise<Reading[]> {
  "use cache: remote";
  if (complete) cacheLife("max");
  else cacheLife("scrape");
  cacheTag(...Array.from({ length: 7 }, (_, i) => `day:${shiftDate(start, i)}`));
  const rows = await withConnection(
    (db) => db<{ t: Date; o: Reading["o"] }[]>`
      select t, o from readings
      where t >= (${start}::date::timestamp at time zone ${TIMEZONE})
        and t < ((${start}::date + 7)::timestamp at time zone ${TIMEZONE})
      order by t
    `,
  );
  return rows.map((r) => ({ t: r.t.toISOString(), o: r.o }));
}

export async function addReadings(readings: Reading[]) {
  await sql`
    insert into readings (t, o)
    select t, o from jsonb_to_recordset(${sql.json(readings as unknown as postgres.JSONValue)}) as r(t timestamptz, o jsonb)
    on conflict (t) do nothing
  `;
}

export async function rebuildSummary(now = new Date()): Promise<Summary> {
  const recentCutoff = new Date(now.getTime() - RECENT_DAYS * 86_400_000);
  const buckets = await sql<Bucket[]>`
    select
      key as facility,
      extract(dow from t at time zone ${TIMEZONE})::int as day,
      extract(hour from t at time zone ${TIMEZONE})::int as hour,
      t >= ${recentCutoff} as recent,
      count(*)::int as n,
      sum(case when (value->>1)::int <= 0 then 0
               else least(100, floor((value->>0)::float8 / (value->>1)::float8 * 100 + 0.5)) end) as sum
    from readings, jsonb_each(o)
    group by 1, 2, 3, 4
  `;
  const [{ total, first }] = await sql<{ total: number; first: Date | null }[]>`
    select count(*)::int as total, min(t) as first from readings
  `;
  const summary = summaryFromBuckets(buckets, total, first?.toISOString().replace(/\.\d{3}Z$/, "Z") ?? null, now);
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
  "use cache";
  cacheLife("live");
  const readings = await fetchLive();
  return { fetchedAt: new Date().toISOString(), readings };
}
