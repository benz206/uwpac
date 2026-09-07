# UW PAC

How busy are the University of Waterloo PAC and CIF gyms? Live occupancy, a weekly heatmap, and the quietest free hours around your Quest class schedule.

Built with Bun, Next.js (App Router), TypeScript and Tailwind. Deploys to Vercel with no database: history lives as plain files in this repo, written by a GitHub Actions cron.

## How it works

- `src/lib/scrape.ts` fetches `https://warrior.uwaterloo.ca/FacilityOccupancy` and parses each `.occupancy-card` (`canvas.occupancy-chart` carries `data-occupancy`, `.max-occupancy strong` carries capacity). No HTML parser dependency.
- `.github/workflows/scrape.yml` runs `scripts/scrape.ts` every 15 minutes. It appends one line to `data/readings/YYYY-MM.jsonl`, rebuilds `data/summary.json` (per-facility 7×24 averages for all time and the last 28 days), and commits.
- The app reads `data/` at runtime from `raw.githubusercontent.com` (Vercel provides the repo owner/name env vars automatically) and caches it for 5 minutes. Locally it reads the files from disk.
- `vercel.json` skips the Vercel build when a commit only touches `data/`, so data commits do not burn build minutes.
- Live readings are fetched on demand and cached for 60 seconds. `GET /api/live` returns them as JSON.

## Data format

`data/readings/2026-09.jsonl`, one scrape per line, UTC timestamp, `[count, max]` per facility:

```json
{"t":"2026-09-07T14:04:02Z","o":{"cif":[9,100],"pac-free-weights":[50,75],"warrior-zone":[14,60],"pac-cardio":[12,50],"pac-machines":[45,40],"pac-functional":[12,25]}}
```

`data/readings/2026-03.jsonl` and `2026-04.jsonl` were converted from the SQLite history in [pauligwe/PACked](https://github.com/pauligwe/PACked).

## Run locally

```bash
bun install
bun run dev          # http://localhost:3000
bun scripts/scrape.ts   # take one reading and rebuild data/summary.json
```

## Deploy

1. Push this repo to GitHub. In the repo settings under Actions → General, make sure workflow permissions are "Read and write" so the cron can commit.
2. Import the repo on Vercel. Framework preset: Next.js, install command `bun install`. No environment variables are needed.
3. Trigger the "Scrape occupancy" workflow once from the Actions tab to confirm it commits.

To point the app at a different data location set `DATA_BASE_URL` (a URL that serves `summary.json` and `readings/*.jsonl`).
