# Migration Plan: Render → Pxxl App

This document audits the current Render-based deployment of the PRD Reviewer server and lays out what's needed to migrate it to Pxxl App. (The client is hosted separately on Netlify and is out of scope unless noted — see "Client considerations" at the end.)

---

## 1. Audit findings

### 1.1 What's actually deployed today

There is **no infrastructure-as-code in this repo** — no `render.yaml`, `Procfile`, `Dockerfile`, or `.toml` config. All Render settings (build command, start command, env vars, port) live in Render's dashboard, outside version control. This audit reverse-engineers those settings from `server/package.json` and `server/src/index.js`.

### 1.2 Build command

```
npm install
```

There is no build step — the server is plain CommonJS Node.js, run directly. No `engines` field is set in `server/package.json`, so Render is currently using its own default Node version (not pinned by the repo).

### 1.3 Start command

```
npm start
```

Which runs (`server/package.json` → `scripts.start`):
```
node src/index.js
```

### 1.4 Port binding

`server/src/index.js:15`:
```js
const PORT = process.env.PORT || 10000;
```

The server reads `PORT` from the environment and falls back to `10000` if unset. `10000` is Render's conventional default port — this fallback exists specifically to match Render's behavior (per CHANGELOG history, the default was deliberately changed from `3001` to `10000` for this reason).

**Migration note:** Pxxl App will inject its own `PORT` value (platforms typically do). Since the code already reads `process.env.PORT` dynamically, no code change is needed — but don't assume the fallback of `10000` is meaningful on Pxxl; confirm Pxxl actually sets `PORT`, or set it explicitly as an env var if not.

### 1.5 Environment variables

| Variable | Required? | Used in | Purpose |
|---|---|---|---|
| `ANTHROPIC_API_KEY` | **Required — server exits on startup if missing** | `server/src/index.js:8`, `server/src/routes/review.js:33`, `server/src/routes/fix.js:13`, `server/src/routes/generatePrd.js:13` | Claude API key. Server-side only; never sent to the client. |
| `PORT` | Optional (defaults to `10000`) | `server/src/index.js:15` | Port the Express server binds to. Platform-supplied on most hosts. |

No other server-side env vars are read (`grep` confirms only `ANTHROPIC_API_KEY` and `PORT` appear in `server/src`). `server/.env.example` only lists:
```
PORT=3001
ANTHROPIC_API_KEY=sk-ant-...
```
(Note: the example file's `PORT=3001` reflects local dev, not the Render default of `10000` — keep this in mind, it's a stale example value, not a deployment instruction.)

**One unused dependency:** `openai` is listed in `server/package.json` dependencies and there's an `aiRouter.js` that can route to an OpenAI service, but per `CLAUDE.md`, `provider` is always `'anthropic'` in practice — no `OPENAI_API_KEY` is configured or required anywhere. Don't carry over an OpenAI key unless that routing is actually activated.

### 1.6 CORS / cross-origin configuration

`server/src/index.js:18-20`:
```js
app.use(cors({ origin: '*' }));
```

CORS is wide open (`*`) to support the current Netlify (client) → Render (server) split-host setup. This is unrelated to *which* host runs the server — it can be carried over as-is to Pxxl, or tightened to the client's actual production domain during migration (recommended, see §3).

### 1.7 Deployment dependencies (runtime)

From `server/package.json`:

| Package | Role | Migration risk |
|---|---|---|
| `express` | HTTP server framework | None |
| `cors` | CORS middleware | None |
| `dotenv` | Loads `.env` in local dev (`require('dotenv').config()` at top of `index.js`) | None — harmless no-op if Pxxl injects env vars directly without a `.env` file present |
| `multer` | Multipart file upload parsing | None |
| `mammoth` | `.docx` text extraction | None |
| `pdf-parse` v1.1.4 | `.pdf` text extraction | **Known fragile dependency** — was previously upgraded to v2 (class-based API) which broke all PDF parsing in production; had to be pinned back to v1.1.4 for its CommonJS function export. **Do not let Pxxl's install process silently bump this** — verify the lockfile is respected, or pin exactly. |
| `@anthropic-ai/sdk` | Calls Claude | None, but confirm outbound HTTPS to Anthropic's API isn't blocked by Pxxl's network/firewall rules |
| `openai` | Unused in practice (see §1.5) | Could be removed to slim the deploy, but not migration-blocking |
| `zod` | Validates Claude's JSON response shape | None |

Dev-only: `nodemon` (not used in production start command — no risk).

### 1.8 Node.js version

Not pinned anywhere (no `engines` field, no `.nvmrc`, no `package.json` engines block). Whatever Render is currently using by default is implicit and unknown from the repo alone. **Action item:** check Render's dashboard for the actual Node version in use before migrating, and pin it explicitly (`engines.node` in `server/package.json`, or Pxxl's equivalent config) so Pxxl doesn't pick a different default that reintroduces the pdf.js/Node-version incompatibility the project already worked around once (CLAUDE.md notes `pdf-parse` was replaced specifically because an old bundled pdf.js was incompatible with Node v22+).

---

## 2. Migration steps

1. **Confirm Pxxl App's platform conventions** — find Pxxl's equivalent of `render.yaml`/dashboard settings: how it sets `PORT`, how env vars are injected, what Node version it defaults to, and whether it needs an explicit build command even when there's no build step (some platforms require `npm install` to be declared even for "no build" Node apps).

2. **Set environment variables on Pxxl:**
   - `ANTHROPIC_API_KEY` — copy the actual production key value from Render's dashboard (do **not** read it from the repo; it's gitignored and never committed).
   - `PORT` — only set if Pxxl doesn't auto-inject it; otherwise leave it to the platform and let the `process.env.PORT || 10000` fallback handle it.

3. **Pin the Node version** to whatever Render is currently running, to avoid a silent change in V8/Node behavior breaking `pdf-parse` or `pdfjs-dist` again. Check Render's dashboard or build logs for the current version, then add it to `server/package.json`:
   ```json
   "engines": { "node": "<exact-version-from-render>" }
   ```

4. **Set build/start commands on Pxxl:**
   - Build: `npm install` (run from `server/`, not the repo root — this is a monorepo with two independently-installed packages)
   - Start: `npm start` (equivalently `node src/index.js`)

5. **Verify the working directory / monorepo root.** Render presumably points its "root directory" setting at `server/`. Pxxl will need the equivalent setting — confirm Pxxl supports specifying a subdirectory as the deploy root, since `client/` and `server/` each have their own `package.json` and must not be installed/built together.

6. **Update CORS** (`server/src/index.js:18-20`) from `origin: '*'` to the client's actual production origin, if tightening security is in scope for this migration. Not required for functional parity, but worth doing while touching this file.

7. **Update the client's `VITE_API_URL`** (set in Netlify's environment, not in this repo) to point at the new Pxxl server URL once it's live. This is the single source of truth the client uses for every API call (`client/src/components/InputPanel.jsx:5`, `client/src/components/FixMode.jsx:6`, `client/src/hooks/useReview.js:3`) — no other client-side changes are needed.

8. **Smoke-test in this order** once deployed to Pxxl:
   - `GET /api/health` → `{ ok: true }`
   - `GET /` → `"PRD Reviewer API is running 🚀"`
   - `POST /api/extract` with a `.docx` and a `.pdf` file — this is the most fragile path historically (PDF/DOCX parsing has broken twice before)
   - `POST /api/review` end-to-end with a real PRD file, confirming Claude responds and the JSON validates
   - `POST /api/fix` with a sample issue payload

9. **Decommission Render** only after the above smoke tests pass and `VITE_API_URL` has been repointed and verified live in production — not before, to avoid an outage window.

---

## 3. Risks specific to this app

- **`pdf-parse` fragility** is the single highest-risk item in this migration. It's already failed twice in this project's history due to version/Node-compatibility mismatches. Treat the Node version pin (§2.3) as mandatory, not optional.
- **No infra-as-code** means this migration is manual and undocumented by default. Consider this an opportunity to write a `pxxl.toml` (or whatever Pxxl's equivalent is) into the repo so the *next* migration isn't another archaeology exercise.
- **Server exits hard on missing `ANTHROPIC_API_KEY`** (`index.js:8-11`) — if the env var isn't set correctly on Pxxl before first deploy, the service will crash-loop rather than serve a degraded response. Set it before the first deploy attempt, not after.
- **Monorepo root directory setting** is an easy thing to misconfigure on a new platform — installing from the repo root instead of `server/` would pull in nothing (there's no root `package.json` with dependencies) or silently fail.

---

## 4. Client considerations (not migrating, but coupled)

The client itself is not part of this migration (it stays on Netlify), but it has one hard dependency on the server's new location: `VITE_API_URL`, set in Netlify's build environment. This must be updated to the new Pxxl URL as part of cutover, and CORS on the server (§2.6) must allow whatever origin Netlify serves the client from. No other client code, build command, or env var is affected by this migration.
