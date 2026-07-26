# PRD Reviewer — CLAUDE.md

## What this app does

A web app that lets users upload or paste a PRD (Product Requirements Document) and receive a structured AI-powered review across three dimensions: Product, Design, and Engineering. When a feature calls for it — user accounts, personal or sensitive data, payments, or a regulated area — the Product review also checks access, privacy, and compliance; features that involve none of these are not flagged for it. Results include a score, verdict, analysis, and recommendations per category, plus an overall score and verdict. Users can download the full report as PDF or Word (.docx).

The app also includes a PRD Template reference view with sections filterable by document type (New PRD / Enhancement / Bug) and audience (All / Design / Engineering / Product).

---

## Architecture

```
prd-reviewer/
├── client/          # React 18 + Vite + Tailwind CSS (frontend)
└── server/          # Node.js + Express (backend API)
```

The client proxies `/api/*` requests to the server at `http://localhost:3001` (configured in `vite.config.js`). In production, all fetch calls use `VITE_API_URL` (see Environment variables). The server intentionally allows CORS from all origins (`origin: '*'`) to support the Netlify → Pxxl App cross-origin setup — the API has no user accounts or session cookies, so there are no per-user credentials to protect. (Because the endpoints are unauthenticated, adding rate limiting or origin restrictions would be a sensible future hardening step if abuse ever becomes a concern.)

The server deploys to **Pxxl App** (migrated from Render). Deployment config lives in `server/pxxl.toml` — sets `startCommand`, a no-op `buildCommand` (the server has no build step), and `port`. The Pxxl project's **Base Directory** setting must be `server` so it finds that file. `ANTHROPIC_API_KEY` is set as a Pxxl dashboard secret, never committed.

**Deploy split** (full details in `DEPLOYMENT.md` + Working rules): the **client** deploys to Netlify via the CLI (`npm run deploy:preview` → publish the draft in the UI; continuous deployment is stopped, so a git push doesn't build the client). The **server** deploys to Pxxl only from the dedicated **`server-release`** branch — pushing `main` deploys nothing. Repo: `github.com/iammood/prd-reviewer`.

---

## Running locally

Both servers must be running simultaneously.

**Server** (port 3001):
```bash
cd server
npm install
npm run dev        # nodemon watches for changes
```

**Client** (port 5173):
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Environment variables

**Server** (`server/.env`):
```
PORT=3001
ANTHROPIC_API_KEY=sk-ant-...
```
The server exits on startup if `ANTHROPIC_API_KEY` is not set. Copy `server/.env.example` as a starting point.

**Client** (`client/.env`):
```
VITE_API_URL=http://localhost:3001
```
All `fetch` calls use a module-level `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'` then `` `${API_URL}/api/...` ``. In local dev, set to `http://localhost:3001`. In production (e.g. Netlify), set to the deployed Pxxl App server URL.

**The API key is never sent to the client.** It lives only in the server environment and is used server-side for all Anthropic API calls.

---

## Client structure (`client/src/`)

| Path | Purpose |
|---|---|
| `components/LandingPage.jsx` | Marketing landing page shown on first load. Sections: Hero, Pain, Solution, How it works, Output preview, Before/After, Sample review, Inline demo (simulated, no backend), Final CTA. `onEnter` prop callback sets `showLanding=false` in App.jsx to reveal the main app. Inline demo uses `MOCK_RESULT` data and a 1.8s timeout to simulate a review. |
| `App.jsx` | Root component. Inlines `ProcessingView` — a 6-step progress tracker: Uploading document → Reading document → Reviewing Product → Reviewing Design → Reviewing Engineering → Preparing report. Steps animate with fake timers until API returns, then fast-forward. On error, the failed step shows a red ✕ and a "Try again" button (inline — no separate ErrorState). `showProcessing = status==='loading' \|\| (status==='done' && !uiReady) \|\| status==='error'`. `ProcessingView` props: `source`, `apiDone`, `onComplete`, `error`, `failedAt` (server string: `'uploading'\|'reading'\|'reviewing'\|'preparing'\|null`), `onRetry`. `FAIL_STEP` maps server strings to STEPS indices. `showResults = status==='done' && uiReady`. Tab nav disabled during processing. **Navigation:** `showLanding` renders `LandingPage` first; `enterApp` reveals the workspace and the header title (a `<button>`) returns home. **Responsive:** desktop two-pane split, single stacked column on mobile (< 768px, `md:` breakpoints — no JS layout checks). **Mobile template nav is master-detail** (section list ↔ full-screen detail with a "Back to sections" button). **History-API back/forward (no URL routing):** `enterApp` and mobile section-opens `pushState` (with a `depthRef` depth counter); a `popstate` handler makes the device back-swipe / browser Back-Forward move Landing ↔ App ↔ section detail (and the logo jumps home via `history.go(-depth)`). App is wrapped in `<MotionConfig reducedMotion="user">`. |
| `hooks/useReview.js` | Handles `/api/review` POST. `submit(fileOrText)` stores input in `lastInputRef` for retry. Exposes `retry()` (re-calls `submit` with last input), `failedAt` (server `failedAt` string or `'uploading'` for network errors), and `reset()`. All fetch/JSON/HTTP failures go through `mapError` before setting `error` string. |
| `hooks/useTheme.js` | Dark/light mode toggle. Persists preference in `localStorage` under `prd_reviewer_theme`. Applies `dark` class to `<html>`. |
| `components/Button.jsx` | **Reusable button component.** Variants: `primary` (indigo filled), `secondary` (dark filled), `outline` (gray bordered), `indigo-outline` (indigo bordered), `ghost` (transparent hover). Sizes: `sm` (`h-9 px-3.5`), `md` (`h-12 px-5`, default), `lg` (`h-14 px-7`). Props: `variant`, `size`, `loading` (shows spinner), `fullWidth`, `icon` (before children), `iconAfter` (after children). Always `rounded-2xl`. All CTA buttons across the app use this component. |
| `components/InputPanel.jsx` | Unified input panel for the left workspace column. Single drag-drop container (no segmented control). Top strip: "Drop a file or click to upload" trigger (shows spinner + "Extracting text…" while parsing). Textarea fills the middle. Bottom: `<Button variant="primary" fullWidth>` "Review PRD" CTA. **Auto-extract for all file types**: `.md` via `FileReader.readAsText()`; `.docx`/`.pdf` via `POST /api/extract` → populates textarea (no immediate submit). `loading` and `extracting` states both disable the CTA. `onSourceChange` informs App.jsx of filename/source. Props: `{ onSubmit, loading, onSourceChange }`. |
| `components/SuggestionsPanel.jsx` | Renders after the category card grid in `ReviewDashboard`. Two cards: **Suggested Improvements** (5 coloured bullet lists — Strengths emerald, Weaknesses amber, Missing Information red, Quick Wins indigo, Highest Impact indigo — plus an Overall Recommendation paragraph) and **Claude Update Prompt** (generated client-side from review data via `buildClaudePrompt(result)`, copy button, monospace pre block). Returns `null` if `result.suggestions` is absent. No AI call — prompt is derived from existing review data. |
| `components/UploadZone.jsx` | Superseded by `InputPanel.jsx` + inlined ProcessingView in App.jsx. File is kept but unused. |
| `components/ReviewDashboard.jsx` | Results view. No own max-width — App.jsx right panel handles layout. `px-6 py-6` padding. **Category order: `['product', 'design', 'engineering']` — all 3 shown**. Cards rendered in a **2-column grid** (`grid grid-cols-1 sm:grid-cols-2 gap-3`). Owns `openModal` (string\|null, category key) and `showWip` (bool). Clicking a card sets `openModal` → renders `<CategoryModal>`. WIP modal uses scale+fade entry animation. No "Review another PRD" button — left panel always visible. Props: `{ result, onReset }`. |
| `components/OverallBanner.jsx` | Compact review header. Top row: verdict pill badge (no icon, text only) + score. Sections: **Key Issues** (each category as a card with label left + status badge right + description, `gap-2` stack), **Next Step**, **Actions** (`<Button primary>` Fix Issues + `<Button outline>` Download dropdown). Download dropdown: `AnimatePresence` scale+fade (`scale: 0.95→1, y: -6→0`, ease `[0.16,1,0.3,1]`, 180ms), `rounded-2xl` panel. **No footer** — left panel always shows input. Props: `{ overall, categories, result, onFixMode }`. |
| `components/CategoryCard.jsx` | Compact, fully-clickable dashboard card (no accordion). Renders as a single `<Button size="raw">`. Shows: title (left) + status pill (right), large score%, slim `<ScoreBar slim />`. Clicking calls `onClick` → parent opens `CategoryModal`. **Status display labels**: `good`→**Strong**, `caution`→**Needs improvement**, `blocker`→**Missing**. Props: `{ categoryKey, data, onClick }`. |
| `components/CategoryModal.jsx` | Modal showing full category detail. Backdrop: `bg-black/30 dark:bg-black/60 backdrop-blur-sm`. Content panel: `bg-white dark:bg-[#0B1220] border border-gray-200 dark:border-white/10 rounded-2xl max-w-2xl`. Smooth open/close animation: local `isOpen` state starts `false`, flips to `true` via `requestAnimationFrame` on mount; `handleClose` sets `isOpen=false` then calls `onClose` after 300ms. Backdrop fades via `transition-opacity duration-300`; panel scales+translates via `transform transition-all duration-300 ease-out`. Closes on backdrop click or Escape. Header: category title + Copy button (`Clipboard`/`Check` icons from lucide-react, 2s feedback) + X close. Body: **Issue** / **Why It Matters** / **Suggested Fix** — all text uses `text-gray-700 dark:text-gray-300`. Props: `{ categoryKey, data, onClose }`. |
| `components/DownloadMenu.jsx` | Standalone download dropdown (PDF/DOCX). No longer rendered in ReviewDashboard — download is now inlined in OverallBanner. |
| `components/MissingEssentials.jsx` | Not currently used — removed from `ReviewDashboard`. Recommendations are surfaced inside each `CategoryCard` detail view instead. |
| `components/FixMode.jsx` | Step-by-step issue resolution flow. Page title: **"Improve Your PRD"**; back button: "Back to Review". Accepts optional `categoryKey` to scope to one category; without it shows all caution/blocker steps sorted blockers-first. Each step shows: Key Issue, Why It Matters, Suggested Fix (indigo highlight box), editable textarea, and an **✨ AI Fix button** that calls `POST /api/fix` to generate a draft response. Navigation is **Previous / Next carousel** (no Skip). Clickable step dots allow jumping to any step. Step slide animations use `direction` (1=forward, -1=backward) + `slideKey` (incremented each nav) state — the step card's `key={slideKey}` triggers re-mount, applying `.slide-from-right` or `.slide-from-left` CSS class. `jumpTo(i)` sets direction from relative index before updating `stepIndex`. Final screen (CompletionScreen): shows original vs estimated score bars, verdict badge, Preview modal (requires `prdText` in result), **"Updated PRD (Ready to Use)"** section with Download PDF/DOCX (uses `downloadUpdatedPrdPdf`/`downloadUpdatedPrdDocx` — not the review report downloads), and session summary list. Score estimation is client-side (not a real re-run). Props: `{ result, categoryKey?, onClose }`. **Updated PRD downloads are gated here — not available on the review screen.** |
| `components/PrdTemplate.jsx` | **Two named exports** (no default export): `TemplateSidebar` + `TemplateDetail`. `TemplateSidebar` renders type segmented control + audience pills + clickable section list; props: `{ type, audience, selectedId, onTypeChange, onAudienceChange, onSelect }`. `TemplateDetail` renders selected section title, description, and numbered items with examples; props: `{ id }`. Template state (`tmplType`, `tmplAudience`, `selectedId`) is managed in App.jsx and passed down. On desktop both panes show at once; on mobile it's master-detail (sidebar and detail are mutually exclusive, `onSelect` opens the detail). Filters/section rows have ≥44px touch targets on mobile. |
| `components/LoadingSpinner.jsx` | Animated spinner with cycling step labels. No longer used — processing state is now inlined in App.jsx. |
| `components/TrafficLight.jsx` | Coloured status dot: green (good), amber (caution), red (blocker). |
| `components/ScoreBar.jsx` | Animated horizontal progress bar coloured by status. Accepts `slim` prop (default `false`): when `true`, renders a `h-1` bar with no score label — used inside `CategoryCard` headers. |
| `data/templateSections.js` | All PRD template sections. Each section has `types`, `audiences`, `items` (with `text` and `example`). |
| `utils/errorMapper.js` | **Centralised error → user message mapper.** `mapError({ err, status, serverMessage, context })` returns a human-friendly string. Never call `.message` on a caught error and show it directly — always go through this function. `context` is `'review'` (default), `'extract'`, or `'fix'`. Mapping rules: network/TypeError → connection message; SyntaxError → unavailable; 504 → timeout; 422+extract → can't read document; 5xx → unavailable; technical server strings (AI_SCHEMA_ERROR, 502, 520, etc.) → unavailable; fallback for extract → upload failed; fallback for review/fix → unknown. Used by `useReview.js`, `InputPanel.jsx`, and `FixMode.jsx`. |
| `utils/statusHelpers.jsx` | Tailwind class maps for statuses and verdicts. Also exports `CATEGORY_META` and four text utilities: `cleanMarkdown(text)` → plain string, strips `**`/`*`/`##`; `renderText(text)` → JSX, converts `**bold**` to `<strong>`; `parseParagraphs(text)` → string array, splits summary lines; `formatSection(section)` → plain string block with title, score, issue, impact, and numbered recommendations — for PDF/DOCX/clipboard use. |
| `utils/downloadReport.js` | Four named exports: `downloadReviewPdf(result)` and `downloadReviewDocx(result)` produce the full analysis report (scores, verdicts, recommendations); `downloadUpdatedPrdPdf(result)` and `downloadUpdatedPrdDocx(result)` produce a clean PRD document with no scores or review language — uses `result.prdText` and optionally `result.amendments` (from Fix Mode). Legacy aliases `downloadPdf` / `downloadDocx` remain for backwards compat. All libraries lazy-loaded via dynamic `import()`. |

---

## Server structure (`server/src/`)

| Path | Purpose |
|---|---|
| `index.js` | Express setup. Validates `ANTHROPIC_API_KEY` on startup. Mounts `/api/review`, `/api/fix`, `/api/extract`. Health checks at `GET /health` and `GET /api/health` (both return `{ ok: true }`). Serves on `PORT` (default `10000`). |
| `routes/review.js` | `POST /api/review`. Per-phase error handling — each stage (upload, reading, reviewing, preparing) has its own try/catch and returns `{ error, failedAt }` with the matching phase key. Multer errors are caught inline (not by global handler) so they also carry `failedAt: 'uploading'`. Does NOT return `prdText`. |
| `routes/fix.js` | `POST /api/fix`. Accepts JSON `{ categoryLabel, issue, whyItMatters, suggestedFix }`. Returns `{ fixText }` — 2–3 sentences of AI-generated PRD amendment text. Uses `claude-haiku-4-5-20251001` (fast/cheap). Has a 30s `Promise.race()` timeout. |
| `routes/extract.js` | `POST /api/extract`. Accepts multipart `file` field. Delegates to `pdfParser`/`docxParser` services (no inline parsing). Returns `{ success: true, text }` on success; `{ error: "Unable to read this document." }` (HTTP 422) on parse failure. Used by `InputPanel` for auto-paste on file upload. |
| `services/docxParser.js` | Extracts plain text from `.docx` using `mammoth`. Falls through to `buffer.toString('utf8')` for `.md`/`.txt` files. |
| `services/pdfParser.js` | Extracts plain text from `.pdf` using `pdfjs-dist` v3 legacy/CJS build (`pdfjs-dist/legacy/build/pdf.js`). `pdf-parse` was removed — it bundles an ancient pdf.js v1.10.100 that references `PDFJS` as a global and causes uncaught exceptions on Node.js v22+, crashing the process. `GlobalWorkerOptions.workerSrc` is set to `''` to disable browser workers in Node.js. Library is lazy-required inside the function so a broken install never crashes the module at load time. |
| `services/anthropicService.js` | Calls Claude (`claude-opus-4-8`, 8192 tokens). SDK `maxRetries` set to 0 — retries are managed manually. On 429/502/503 or `ANTHROPIC_TIMEOUT`: waits 2s and retries once. Each attempt has a 60s `Promise.race()` timeout (`ANTHROPIC_TIMEOUT` code). Max wall-clock per review: ~122s. Logs attempt count, duration, estimated input tokens, and actual `message.usage`. |
| `services/aiRouter.js` | Routes to `anthropicService` or `openaiService` based on `provider` param (always `'anthropic'` in practice). |
| `utils/promptBuilder.js` | Concise system prompt. Instructs Claude (as a Senior PM) to return `{ product, design, engineering }` — no Security category. Each category: score, status, summary (max 2 sentences), exactly 3 recommendations. Plain English only; bans jargon and acronyms. Special rules: missing Overview forces Product score ≤ 39 (blocker); the Product review also covers access, privacy & compliance, but **only when the feature needs it** (accounts, personal/sensitive data, payments, regulated areas) — never penalised otherwise. Language rules bar WCAG/SLA/p95/uptime%/concurrent-users/Given-When-Then/P0-P1-P2. Also returns a `suggestions` object (strengths, weaknesses, missingInformation, quickWins, highestImpact, overallRecommendation — 2–4 items each, 1 sentence, plain English). Optimised for minimal token usage. |
| `utils/validateResponse.js` | Extracts JSON from Claude's response, validates against a Zod schema. `CategorySchema`: score, status, summary, recommendations (exactly 3). `SuggestionsSchema`: strengths, weaknesses, missingInformation, quickWins, highestImpact (all `string[]`), overallRecommendation (`string`). `ReviewSchema` = 3 categories + `suggestions` (optional). `validateAndParse` returns `{ categories, suggestions }` — caller destructures both. |

---

## API

### `POST /api/review`

Multipart form fields:
- `file` — the PRD document (`.docx`, `.pdf`, `.md`, `.txt`)
- `provider` — always `'anthropic'`
- `anthropicKey` — ignored; server uses `ANTHROPIC_API_KEY` env var

Response (200):
```json
{
  "overall": { "score": 72, "verdict": "CONDITIONAL APPROVAL", "summary": "..." },
  "categories": {
    "product":     { "score": 75, "status": "good",    "summary": "...", "recommendations": ["...", "...", "..."] },
    "design":      { "score": 80, "status": "good",    "summary": "...", "recommendations": ["...", "...", "..."] },
    "engineering": { "score": 65, "status": "caution", "summary": "...", "recommendations": ["...", "...", "..."] }
  },
  "suggestions": {
    "strengths":             ["..."],
    "weaknesses":            ["..."],
    "missingInformation":    ["..."],
    "quickWins":             ["..."],
    "highestImpact":         ["..."],
    "overallRecommendation": "..."
  }
}
```

No `verdict` field per category. No `prdText` in response (frontend already has it from `/api/extract`).
Scoring: Product 40%, Design 30%, Engineering 30%.
Verdict: any `blocker` → NOT READY TO BUILD; score ≥ 75 → READY TO BUILD; else → CONDITIONAL APPROVAL.

Error responses include `failedAt` to tell the client exactly which step failed:
```json
{ "error": "...", "failedAt": "uploading" }
```
`failedAt` values: `"uploading"` | `"reading"` | `"reviewing"` | `"preparing"`. The client maps these to step indices in `ProcessingView` via `FAIL_STEP`.

### `POST /api/fix`

JSON body:
- `categoryLabel` — e.g. `"Design"`
- `issue` — the key issue sentence
- `whyItMatters` — first paragraph of summary
- `suggestedFix` — the recommendation text

Response (200):
```json
{ "fixText": "We will add a dedicated login/signup flow..." }
```

Uses `claude-haiku-4-5-20251001` for low latency. Returns 2–3 sentences of polished PRD amendment language.

---

## Theming

- Tailwind `darkMode: 'class'` — dark mode enabled by adding `dark` class to `<html>`.
- Default theme: dark.
- Preference stored in `localStorage` under `prd_reviewer_theme`.
- All components use paired light/dark Tailwind classes (e.g. `bg-white dark:bg-gray-900`).
- **Text color system (dark mode)**: Primary=`dark:text-white`, Labels=`dark:text-gray-300`, Secondary=`dark:text-gray-400`, Muted=`dark:text-gray-500`. Do not use `dark:text-gray-100` or `dark:text-gray-200` — they are replaced by this scale.
- **Font**: Mona Sans loaded via Google Fonts `@import` in `index.css` (`wght@200..900&display=swap`). No npm font package. Tailwind `fontFamily.sans` extended to `['"Mona Sans"', 'ui-sans-serif', 'system-ui']`. Applied globally via `font-family: 'Mona Sans', sans-serif` + `@apply font-sans` on `body` in `index.css`.
- Two `tailwind.config.js` files exist: `client/tailwind.config.js` (used by Vite/PostCSS, content path `./src/**/*.{js,ts,jsx,tsx}`) and a root-level `tailwind.config.js` (content path `./client/src/**/*.{js,ts,jsx,tsx}`). The client-level config is the active one for the build.

**Animation classes** (defined in `index.css`, not Tailwind plugins — use these, don't inline alternatives):
- `.accordion-panel` / `.accordion-open` — grid-template-rows height reveal for accordion cards. Wrap content in `.accordion-inner` (sets `overflow: hidden`). 250ms ease.
- `.slide-from-right` / `.slide-from-left` — fade + translateX step transitions (250ms). Apply to a keyed wrapper to re-trigger on step change.
- `.score-bar-fill` — width transition for score progress bars (800ms).

---

## Key conventions

- **No API key on the client.** The key is server-side only.
- **Pasted text** is wrapped into a synthetic `File` object (`pasted.md`) before being sent to the server — same code path as file uploads.
- **Download libraries** (`jspdf`, `docx`) are dynamically imported on first use to keep the initial bundle small.
- **Template sections** are plain data in `templateSections.js` — no server involvement. Each section has `types[]` and `audiences[]` arrays for filtering.
- **Text rendering** — all AI text goes through shared utilities in `statusHelpers.jsx`. Two functions, two contexts — never swap them:
  - `cleanMarkdown(text)` → returns a **plain string**. Use in PDF/DOCX generation, Fix Mode step data, any non-React context.
  - `renderText(text)` → returns **JSX** (React element array). Use only inside component render output. Breaks PDF if called there.
  - `parseParagraphs(text)` → splits summary text into clean string lines. Feed into either of the above.
- **Download separation** — "Review Report" downloads include scores/statuses/analysis; "Updated PRD" downloads are clean production documents using `prdText` + any Fix Mode amendments. Keep these two concerns strictly separate.
- **Responsive & motion** — mobile-first with Tailwind `md:` (768px) breakpoints; **no JS viewport checks for layout**. Desktop is two-pane, mobile is a single stacked column; template mode is master-detail on mobile. Use `h-dvh`/`min-h-dvh` (never `h-screen`). Motion is compositor-only (`opacity`/`transform`), ≤200ms, `ease-out`, and respects `prefers-reduced-motion` app-wide via `<MotionConfig reducedMotion="user">`. Design-interaction skills (`ibelick/ui-skills`: `baseline-ui`, `fixing-motion-performance`, …) live in `.agents/skills/`.
- **Static assets & metadata** — `client/index.html` carries SEO + Open Graph + Twitter meta (`og:image` uses a `?v=` cache-bust). `client/public/` holds the favicon set (`favicon.svg`/`.ico`/PNGs, `apple-touch-icon`, `android-chrome-*`), the social card (`og-image.svg` source + `og-image.jpg` — a 1200×630 JPEG kept small for social-scraper reliability), and `site.webmanifest`. `client/netlify.toml` sets the manifest MIME type + SPA fallback; `client/.env.production` pins the production `VITE_API_URL`.

---

## Working rules

- **Deploy only when asked.** Never deploy (client or server) as a side effect of other work — the owner triggers deploys explicitly. Client deploys are draft-first via the Netlify CLI (`npm run deploy:preview`) then published manually in the UI. **The server deploys only from the `server-release` branch, not `main`** — to ship server changes, merge `main` into `server-release` and push. Pushing `main` never deploys anything. See `DEPLOYMENT.md`.
- **Never reintroduce the Security review category.** PRDs are scored on Product, Design, and Engineering only. The category was removed on purpose and tends to creep back in via old prompts/schemas/UI. If you find Security remnants anywhere (prompt text, Zod schema, scoring weights, components, template), flag them for removal. (This is about the *review category* — the app's own security posture still matters.)
- **Backwards compatibility.** This is an actively developed app — keep changes rollback-safe so anything that breaks can be reverted cleanly.

### Definition of done (every change)

1. UI changes verified in **both light and dark mode** — paired Tailwind classes, no hardcoded colors.
2. **PDF and DOCX extraction re-tested** after any server change — historically the most fragile path (see `services/pdfParser.js`).
3. **Mobile responsive** — key views usable at phone width, no horizontal scroll.
4. **Every error path returns JSON**, never an HTML error page.
5. **`CHANGELOG.md` updated.**
6. **No secrets in tracked files.**
7. **Respect pinned dependency versions** — never bump deps as a side effect of unrelated work.
