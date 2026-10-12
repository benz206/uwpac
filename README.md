# UW PAC

How busy are the University of Waterloo PAC and CIF gyms? Live occupancy, a per-day view of actual vs predicted crowds, and a weekly heatmap.

Built with Bun, Next.js (App Router), TypeScript, Tailwind and [Spectrum UI](https://ui.spectrumhq.in) (a shadcn registry; components live in `src/components/spectrumui` and `src/components/motion`). Deploys to Vercel; history lives in Postgres, written by a Vercel Cron job.

## How it works

- `src/lib/scrape.ts` fetches `https://warrior.uwaterloo.ca/FacilityOccupancy` and parses each `.occupancy-card` (`canvas.occupancy-chart` carries `data-occupancy`, `.max-occupancy strong` carries capacity). No HTML parser dependency.
- `vercel.json` schedules `GET /api/scrape` every 30 minutes. It inserts the reading into the `readings` table and rebuilds the single row in the `summary` table (per-facility 7×24 averages for all time and the last 28 days, aggregated in SQL). The route requires `Authorization: Bearer $CRON_SECRET`, which Vercel Cron sends automatically.
- `/day?date=YYYY-MM-DD&f=<facility>` plots that day's readings against the typical curve for its weekday; for today and future days the typical curve is the prediction.
- Caching uses Cache Components (`src/lib/data.ts`, profiles in `next.config.ts`). The summary and today's readings are cached until the next scrape, and the cron revalidates their tags after it writes. Completed days are cached indefinitely. Live readings are cached for 60 seconds; `GET /api/live` returns them as JSON.

## Data format

`readings` has one row per scrape: `t timestamptz` and `o jsonb` holding `[count, max]` per facility:

```json
{"t":"2026-09-07T14:04:02Z","o":{"cif":[9,100],"pac-free-weights":[50,75],"warrior-zone":[14,60],"pac-cardio":[12,50],"pac-machines":[45,40],"pac-functional":[12,25]}}
```

History before the move to Postgres was imported from the JSONL files this repo used to keep under `data/` (March and April were converted from the SQLite history in [pauligwe/PACked](https://github.com/pauligwe/PACked)).

## Run locally

```bash
bun install
vercel env pull .env.local   # DATABASE_URL and CRON_SECRET
bun run dev                  # http://localhost:3000
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/scrape   # take one reading
```

## Deploy

1. Import the repo on Vercel. Framework preset: Next.js, install command `bun install`.
2. Connect a Postgres database to the project so `DATABASE_URL` is set, and add a `CRON_SECRET` environment variable (any random string).
3. Run `bun scripts/setup-db.ts` with `DATABASE_URL` set to create the tables.
4. Cron jobs every 30 minutes need the Vercel Pro plan; Hobby only allows daily.
