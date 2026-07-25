# Deployment

## Architecture

| Layer | Platform | URL |
|---|---|---|
| Client (React + Vite) | Netlify | Production Netlify URL |
| Server (Express API) | Pxxl App | `https://prd-reviewer.pxxl.run` |

The client is a static SPA deployed to Netlify. All API calls go to the Pxxl-hosted Express server via `VITE_API_URL`. The two services are fully independent — deploying one does not require deploying the other.

---

## Repository layout

```
/
  client/          # Netlify — deployed independently
  server/          # Pxxl — Base Directory set to "server" in Pxxl dashboard
    pxxl.toml
    src/index.js
```

---

## Environment variables

### Server (Pxxl dashboard secrets)

| Variable | Required | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | **Yes** | Server exits on startup if missing. Set in Pxxl dashboard, never committed. |

**Do not set `PORT`, `EXPOSE_PORT`, or `LISTEN_PORT` in the Pxxl dashboard.** Pxxl injects `PORT` automatically based on the `port` field in `pxxl.toml`. Manually setting `PORT` in the dashboard overrides `pxxl.toml` and causes a port mismatch between what the app listens on and what Pxxl's edge router expects — this manifests as `route_not_registered` on the public URL even when the container is healthy. See [Known issues](#known-issues).

### Client (Netlify environment)

| Variable | Required | Value |
|---|---|---|
| `VITE_API_URL` | **Yes** | `https://prd-reviewer.pxxl.run` |

---

## Pxxl configuration (`server/pxxl.toml`)

```toml
[build]
startCommand = "node src/index.js"
buildCommand = "echo \"No build step\""
port = 10000
```

Pxxl dashboard settings that must match:

| Setting | Value |
|---|---|
| Base Directory | `server` |
| PORT (dashboard env) | **Not set** — controlled by `pxxl.toml` only |

---

## How to deploy

### Server (Pxxl)

Pxxl deploys automatically on every push to `main`. To trigger a manual redeploy, use the Pxxl dashboard → your project → **Redeploy**.

To verify the deployment is live:

```bash
curl https://prd-reviewer.pxxl.run/health
# Expected: {"ok":true}

curl https://prd-reviewer.pxxl.run/
# Expected: PRD Reviewer API is running 🚀
```

### Client (Netlify)

**For frontend-only changes, deploy with the Netlify CLI.** This builds locally and uploads the prebuilt `dist/` folder as a **draft**, which you then publish manually from the Netlify UI. Continuous deployment is stopped on this site (`stop_builds: true`), so a git push builds nothing — the CLI is the only path.

One-time setup (per machine):

```bash
cd client
netlify login          # opens a browser; skip if already logged in
netlify link --id 852c5d82-dce4-4b67-9f62-cd952963ed07   # link to the prdreviewer site
```

To ship a frontend change:

```bash
cd client
npm run deploy:preview   # vite build → uploads a draft, prints a Draft URL
```

Then promote the draft to production in the Netlify UI:

**Deploys** → select the new draft deploy → **Publish deploy**.

> **Why not `--prod` from the CLI?** With `stop_builds: true`, Netlify halts the production deploy pipeline, so `netlify deploy --prod` returns `Forbidden`. Draft deploys are unaffected, so the flow is: draft via CLI → publish via UI. (If you'd rather deploy straight to prod from the CLI, unlink the Git repo in the dashboard and set `stop_builds: false` — then `--prod` works with no git auto-deploys.)

**Why the API URL is safe on a local build:** `client/.env.production` pins `VITE_API_URL=https://prd-reviewer.pxxl.run`. Vite loads it automatically for `vite build`, so a local CLI deploy points at the Pxxl server, not `localhost`. (On Netlify's own cloud builds, the dashboard env var still wins — real shell env vars outrank `.env` files in Vite — so both paths stay correct.)

Remember: committing frontend changes ships nothing on its own — run `npm run deploy:preview` and publish the draft.

If `VITE_API_URL` ever changes (e.g. the Pxxl server URL changes), update it in **both** `client/.env.production` (for CLI builds) and Netlify's environment settings (for any future cloud builds).

---

## Smoke test checklist

Run these after any server deployment:

- [ ] `GET /health` → `{"ok":true}`
- [ ] `GET /` → `PRD Reviewer API is running 🚀`
- [ ] `POST /api/extract` with a `.pdf` file → returns extracted text
- [ ] `POST /api/extract` with a `.docx` file → returns extracted text
- [ ] `POST /api/review` with a real PRD → returns scored JSON with all four categories
- [ ] `POST /api/fix` with a sample issue payload → returns `{ fixText: "..." }`

PDF and DOCX extraction are the historically fragile paths — always test both.

---

## Known issues

### `route_not_registered` on the public URL

**Symptom:** `curl https://prd-reviewer.pxxl.run` returns a Pxxl-generated HTML page with `Reason: route_not_registered`. The container is healthy (health check passes, `curl localhost:PORT/health` works inside the container), but external traffic never reaches Express.

**Root cause:** A `PORT`, `EXPOSE_PORT`, or `LISTEN_PORT` env var is set manually in the Pxxl dashboard, overriding the `port = 10000` field in `pxxl.toml`. This causes the app to listen on one port (the dashboard value) while Pxxl's edge router tries to forward traffic to a different port (from `pxxl.toml`). The route registration fails silently.

**Fix:**
1. Open the Pxxl dashboard → your project → Environment.
2. Delete any manually set `PORT`, `EXPOSE_PORT`, or `LISTEN_PORT` variables.
3. Trigger a manual redeploy.
4. Verify with `curl https://prd-reviewer.pxxl.run/health`.

### Server crashes on startup

**Symptom:** Deployment fails immediately; Pxxl shows the service as unhealthy.

**Most likely cause:** `ANTHROPIC_API_KEY` is not set in the Pxxl dashboard. The server calls `process.exit(1)` if the key is missing.

**Fix:** Add `ANTHROPIC_API_KEY` to Pxxl dashboard secrets and redeploy.

---

## Rollback

### Server

Pxxl does not have a one-click rollback UI. To roll back:

1. `git revert` the offending commit and push to `main` — Pxxl will auto-deploy the reverted code.
2. Or: in the Pxxl dashboard, find the last successful deployment and click **Redeploy** on that build (if Pxxl retains prior build artifacts).

### Client

Netlify keeps full deployment history. Go to Netlify dashboard → your site → **Deploys** → find the last working deploy → **Publish deploy**.
