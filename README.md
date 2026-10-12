# UW PAC

How busy are the University of Waterloo PAC and CIF gyms? Live occupancy, a weekly heatmap, and the quietest free hours around your Quest class schedule.

Built with Bun, Next.js (App Router), TypeScript and Tailwind. Deploys to Vercel; history lives in Redis, written by a Vercel Cron job.

## How it works

- `src/lib/scrape.ts` fetches `https://warrior.uwaterloo.ca/FacilityOccupancy` and parses each `.occupancy-card` (`canvas.occupancy-chart` carries `data-occupancy`, `.max-occupancy strong` carries capacity). No HTML parser dependency.
- `vercel.json` schedules `GET /api/scrape` every 15 minutes. It adds the reading to the `readings` sorted set in Redis (scored by timestamp) and rebuilds the `summary` key (per-facility 7×24 averages for all time and the last 28 days). The route requires `Authorization: Bearer $CRON_SECRET`, which Vercel Cron sends automatically.
- Pages read `summary` from Redis and revalidate every 5 minutes.
- Live readings are fetched on demand and cached for 60 seconds. `GET /api/live` returns them as JSON.

## Data format

Each member of the `readings` sorted set is one scrape, UTC timestamp, `[count, max]` per facility:

```json
{"t":"2026-09-07T14:04:02Z","o":{"cif":[9,100],"pac-free-weights":[50,75],"warrior-zone":[14,60],"pac-cardio":[12,50],"pac-machines":[45,40],"pac-functional":[12,25]}}
```

`data/readings/*.jsonl` holds the history from before the move to Redis (March and April were converted from the SQLite history in [pauligwe/PACked](https://github.com/pauligwe/PACked)). `bun scripts/import-history.ts` loads it into Redis; it is safe to re-run.

## Run locally

```bash
bun install
vercel env pull .env.local   # REDIS_URL and CRON_SECRET
bun run dev                  # http://localhost:3000
curl -H "Authorization: Bearer $CRON_SECRET" localhost:3000/api/scrape   # take one reading
```

## Deploy

1. Import the repo on Vercel. Framework preset: Next.js, install command `bun install`.
2. Connect a Redis database to the project so `REDIS_URL` is set, and add a `CRON_SECRET` environment variable (any random string).
3. Run `bun scripts/import-history.ts` with `REDIS_URL` set to load the existing history.
4. Cron jobs every 15 minutes need the Vercel Pro plan; Hobby only allows daily.
