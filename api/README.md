# FORMULA E100 Leaderboard API

Backend-only leaderboard service for the FORMULA E100 browser game.

This Worker source lives in the main game repository under `api/`. The static GitHub Pages game does not execute files from this folder; the browser game must call the deployed Worker HTTPS URL.

Current deployed Worker base URL used by the frontend config:

```text
https://formula-e100-leaderboard-api.formulae100.workers.dev
```

## Architecture

```text
GitHub Pages game
        |
        | HTTPS JSON requests
        v
Cloudflare Worker API
        |
        | env.DB D1 binding
        v
Cloudflare D1 database
```

This project uses Cloudflare Workers, Cloudflare D1, JavaScript ES modules, Wrangler, prepared SQL statements, and JSON responses.

## Important Deployment Placeholders

The existing game files did not contain a discoverable GitHub Pages production origin. Before deployment, replace this placeholder in `wrangler.jsonc`:

```text
__REPLACE_WITH_FORMULA_E100_GITHUB_PAGES_ORIGIN__
```

with the exact GitHub Pages origin, such as:

```text
https://USERNAME.github.io
```

Also replace:

```text
REPLACE_WITH_D1_DATABASE_ID_FROM_WRANGLER_D1_CREATE
```

with the database ID printed by Cloudflare after `npx wrangler d1 create formula-e100-leaderboard`.

The current `api/wrangler.jsonc` already contains the existing D1 database ID:

```text
9c40819d-ea3d-4b89-8fcf-7d6e3641f407
```

## Configuration

Required D1 binding:

```text
DB
```

Required non-secret variable:

```text
ALLOWED_ORIGINS
```

Use a comma-separated list of exact origins:

```text
https://USERNAME.github.io,http://localhost:5173,http://127.0.0.1:5173
```

Required Worker secret:

```text
IP_HASH_SALT
```

Set it with:

```bash
npx wrangler secret put IP_HASH_SALT
```

For local development, place a temporary development value in `.dev.vars`:

```text
IP_HASH_SALT=local-development-random-string
```

Do not commit `.dev.vars`.

## Qualification Rules

Each difficulty has an independent leaderboard.

| Difficulty | Threshold | Minimum qualifying integer |
| --- | ---: | ---: |
| easy | score > 5000 | 5001 |
| hard | score > 2000 | 2001 |
| realism | score > 1000 | 1001 |

The comparison is strict greater-than. A score equal to the threshold does not qualify.

Each board stores at most 25 submitted entries. Public responses return only the top 10.

A completed run qualifies only when:

1. It exceeds the difficulty threshold.
2. The board has fewer than 25 entries, or the score is strictly greater than the current 25th-place score.

When a board is full, tying the 25th-place score does not displace it.

## Ranking And Ties

All leaderboard operations use this ordering:

1. Score descending
2. Creation time ascending
3. Numeric record ID ascending

Earlier equal scores keep the higher rank.

## Initials

Initials are uppercased before validation.

Accepted format:

```js
/^[A-Z0-9]{3}$/
```

Examples:

```text
AAA
RKV
A7X
007
```

Rejected examples:

```text
AB
ABCD
A_B
A A
🙂🙂🙂
```

## Endpoints

Every response is JSON. Writes and errors use `Cache-Control: no-store`.

### GET `/api/health`

Performs a lightweight D1 query.

Response:

```json
{
  "ok": true,
  "service": "formula-e100-leaderboard",
  "database": "connected"
}
```

### GET `/api/leaderboard?difficulty=easy`

Valid difficulties:

```text
easy
hard
realism
```

Returns the top 10 for that difficulty only.

Response:

```json
{
  "ok": true,
  "difficulty": "realism",
  "threshold": 1000,
  "entries": [
    {
      "rank": 1,
      "initials": "RKV",
      "score": 12840,
      "createdAt": "2026-07-27 12:00:00"
    }
  ]
}
```

Public leaderboard responses use:

```text
Cache-Control: public, max-age=15
```

### POST `/api/runs/start`

Request:

```json
{
  "difficulty": "realism",
  "buildVersion": "beta-x"
}
```

Response:

```json
{
  "ok": true,
  "runId": "server-generated-uuid",
  "difficulty": "realism",
  "startedAt": 1785150000
}
```

The run ID is always generated server-side using `crypto.randomUUID()`.

### POST `/api/runs/finish`

Request:

```json
{
  "runId": "server-generated-uuid",
  "difficulty": "realism",
  "score": 12840,
  "distanceMetres": 2540.5,
  "sugarcaneCount": 92,
  "fullSpeedScore": 1100,
  "highestTier": 4,
  "runDurationSeconds": 185.4,
  "buildVersion": "beta-x"
}
```

The server recalculates:

```js
Math.floor(distanceMetres + sugarcaneCount * 100 + fullSpeedScore)
```

It also validates:

- Score is an integer.
- Numeric values are finite and non-negative.
- Full-speed score is no more than `runDurationSeconds * 8 + 2`.
- Distance is below a generous 250 km/h plausibility bound.
- Sugarcane count is below a generous spawn plausibility bound.
- Highest tier matches cumulative sugarcane thresholds: 10, 20, 30.
- Claimed duration is between 3 seconds and 6 hours.
- Claimed duration does not exceed server elapsed time by more than a small tolerance.

Qualified response:

```json
{
  "ok": true,
  "qualifies": true,
  "estimatedRank": 7,
  "runId": "server-generated-uuid",
  "nameEntryRequired": true
}
```

Not qualified response:

```json
{
  "ok": true,
  "qualifies": false,
  "reason": "below_threshold"
}
```

or:

```json
{
  "ok": true,
  "qualifies": false,
  "reason": "outside_top_25"
}
```

### POST `/api/scores`

Request:

```json
{
  "runId": "server-generated-uuid",
  "initials": "RKV"
}
```

The name-entry window is 10 minutes after the run finishes.

The Worker rechecks threshold and top-25 position at submission time. If the board changed and the run no longer qualifies:

```json
{
  "ok": false,
  "error": "leaderboard_changed"
}
```

Successful response:

```json
{
  "ok": true,
  "accepted": true,
  "rank": 7,
  "difficulty": "realism",
  "entry": {
    "initials": "RKV",
    "score": 12840
  },
  "leaderboard": [
    {
      "rank": 1,
      "initials": "AAA",
      "score": 15000,
      "createdAt": "2026-07-27 12:00:00"
    }
  ]
}
```

## CORS

The Worker uses exact-origin CORS.

For an allowed origin:

```text
Access-Control-Allow-Origin: <exact requesting origin>
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
Vary: Origin
```

Disallowed browser origins receive `403`.

The Worker does not use `Access-Control-Allow-Origin: *`.

## Rate Limiting

Rate limits use `CF-Connecting-IP` where available. The raw IP address is never stored.

The stored key is:

```text
SHA-256(IP_HASH_SALT + raw client IP)
```

Limits:

| Action | Limit |
| --- | ---: |
| run start | 60 per hour per IP hash |
| run finish | 30 per hour per IP hash |
| score submission | 10 per hour per IP hash |

When `CF-Connecting-IP` is unavailable locally, the Worker uses a local-development fallback string before hashing.

## Data Retention

During write requests the Worker performs lightweight cleanup:

- Delete unfinished, unsubmitted runs older than 7 days.
- Delete finished run-validation records older than 30 days.
- Keep public score rows independently.
- Delete rate-limit buckets older than 2 days.

The public `scores` table is pruned to 25 records per difficulty after each accepted score.

## Local Setup

Install dependencies:

```bash
cd api
npm install
```

Authenticate Wrangler:

```bash
cd api
npx wrangler login
```

Create the D1 database:

```bash
cd api
npx wrangler d1 create formula-e100-leaderboard
```

Copy the returned `database_id` into `wrangler.jsonc`.

Create `.dev.vars`:

```text
IP_HASH_SALT=replace-with-local-random-string
```

Apply schema locally:

```bash
cd api
npx wrangler d1 execute formula-e100-leaderboard --local --file=./schema.sql
```

Run locally:

```bash
cd api
npx wrangler dev
```

Run tests:

```bash
cd api
npm test
```

Run syntax checks:

```bash
cd api
npm run check
```

## Remote Deployment

Apply schema remotely:

```bash
cd api
npx wrangler d1 execute formula-e100-leaderboard --remote --file=./schema.sql
```

Set the required secret:

```bash
cd api
npx wrangler secret put IP_HASH_SALT
```

Deploy:

```bash
cd api
npx wrangler deploy
```

Equivalent commands from the repository root:

```bash
npm --prefix api install
npm --prefix api test
npm --prefix api run dev
npm --prefix api run deploy
```

## Endpoint Smoke Tests

Replace the base URL with either local Wrangler dev or the deployed Worker URL.

Health:

```bash
curl -i https://YOUR-WORKER-URL/api/health
```

Leaderboard:

```bash
curl -i "https://YOUR-WORKER-URL/api/leaderboard?difficulty=realism"
```

Start run:

```bash
curl -i -X POST https://YOUR-WORKER-URL/api/runs/start \
  -H "Content-Type: application/json" \
  -d "{\"difficulty\":\"realism\",\"buildVersion\":\"beta-x\"}"
```

Finish run:

```bash
curl -i -X POST https://YOUR-WORKER-URL/api/runs/finish \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"RUN_ID\",\"difficulty\":\"realism\",\"score\":12840,\"distanceMetres\":2540,\"sugarcaneCount\":92,\"fullSpeedScore\":1100,\"highestTier\":4,\"runDurationSeconds\":185,\"buildVersion\":\"beta-x\"}"
```

Submit initials:

```bash
curl -i -X POST https://YOUR-WORKER-URL/api/scores \
  -H "Content-Type: application/json" \
  -d "{\"runId\":\"RUN_ID\",\"initials\":\"RKV\"}"
```

OPTIONS:

```bash
curl -i -X OPTIONS https://YOUR-WORKER-URL/api/leaderboard \
  -H "Origin: https://USERNAME.github.io" \
  -H "Access-Control-Request-Method: GET"
```

## Inspecting Leaderboard Rows

Local:

```bash
npx wrangler d1 execute formula-e100-leaderboard --local --command "SELECT difficulty, initials, score, created_at FROM scores ORDER BY difficulty, score DESC, created_at ASC, id ASC;"
```

Remote:

```bash
npx wrangler d1 execute formula-e100-leaderboard --remote --command "SELECT difficulty, initials, score, created_at FROM scores ORDER BY difficulty, score DESC, created_at ASC, id ASC;"
```

## Manually Delete An Abusive Score

Inspect first:

```bash
npx wrangler d1 execute formula-e100-leaderboard --remote --command "SELECT id, difficulty, initials, score, created_at FROM scores ORDER BY created_at DESC LIMIT 20;"
```

Delete by numeric score ID:

```bash
npx wrangler d1 execute formula-e100-leaderboard --remote --command "DELETE FROM scores WHERE id = 123;"
```

Prune again if needed:

```bash
npx wrangler d1 execute formula-e100-leaderboard --remote --command "DELETE FROM scores WHERE difficulty = 'realism' AND id NOT IN (SELECT id FROM scores WHERE difficulty = 'realism' ORDER BY score DESC, created_at ASC, id ASC LIMIT 25);"
```

## Anti-Cheat Limitations

This system blocks casual score fabrication but cannot make a browser game completely cheat-proof.

The server recalculates score, checks run timing, validates tier progression, applies plausibility limits, requires a server-issued run ID, and rate-limits submissions. A determined player can still manipulate browser code or automate realistic-looking requests. Stronger protection would require authoritative server-side gameplay simulation, which is outside this project.
