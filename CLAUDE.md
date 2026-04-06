# PRD Reviewer — CLAUDE.md

## What this app does

A web app that lets users upload or paste a PRD (Product Requirements Document) and receive a structured AI-powered review across four dimensions: Design, Engineering, Product, and Security. Results include a score, verdict, analysis, and recommendations per category, plus an overall score and verdict. Users can download the full report as PDF or Word (.docx).

The app also includes a PRD Template reference view with sections filterable by document type (New PRD / Enhancement / Bug) and audience (All / Design / Engineering / Product).

---

## Architecture

```
prd-reviewer/
├── client/          # React 18 + Vite + Tailwind CSS (frontend)
└── server/          # Node.js + Express (backend API)
```

The client proxies `/api/*` requests to the server at `http://localhost:3001` (configured in `vite.config.js`). In production, all fetch calls use `VITE_API_URL` (see Environment variables). The server allows CORS from all origins (`origin: '*'`) to support Netlify → Render cross-origin requests.

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
All `fetch` calls use a module-level `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:10000'` then `` `${API_URL}/api/...` ``. In local dev, set to `http://localhost:3001`. In production (e.g. Netlify), set to the deployed Render server URL.

**The API key is never sent to the client.** It lives only in the server environment and is used server-side for all Anthropic API calls.

---

## Client structure (`client/src/`)

| Path | Purpose |
|---|---|
| `components/LandingPage.jsx` | Marketing landing page shown on first load. Sections: Hero, Pain, Solution, How it works, Output preview, Before/After, Sample review, Inline demo (simulated, no backend), Final CTA. `onEnter` prop callback sets `showLanding=false` in App.jsx to reveal the main app. Inline demo uses `MOCK_RESULT` data and a 1.8s timeout to simulate a review. |
| `App.jsx` | Root component. Renders `<LandingPage onEnter={...}>` when `showLanding=true` (default). After `onEnter` is called, renders the **full-width workspace layout** (`h-screen flex flex-col overflow-hidden`, `max-w-[1280px]`). **Two-column layout**: left panel (`w-2/5`, border-r) + right panel (`flex-1`). **Tab nav** in header: `Review PRD` \| `PRD Template` with `layoutId="nav-pill"` animated pill (tabs disabled during processing). Manages `tab` (`'review'`\|`'template'`), review flow (`idle`\|`loading`\|`done`\|`error`), `uiReady` (bool), `source` (string for ProcessingView filename), and template state (`tmplType`, `tmplAudience`, `selectedId`). **`uiReady` gates switch from ProcessingView to ReviewDashboard** — set via `onComplete` from ProcessingView. `showProcessing = status==='loading' \|\| (status==='done' && !uiReady)`. `showResults = status==='done' && uiReady`. **ProcessingView is inlined in App.jsx** (not in UploadZone). Left panel: `InputPanel` (review tab) or `TemplateSidebar` (template tab). Right panel: EmptyState \| ProcessingView \| ErrorState \| `ReviewDashboard` (review tab) or `TemplateDetail` (template tab). All CTA buttons use `<Button>` component. |
| `hooks/useReview.js` | Handles the `/api/review` POST request. `submit(fileOrText)` accepts a `File` object or a plain string (paste). |
| `hooks/useTheme.js` | Dark/light mode toggle. Persists preference in `localStorage` under `prd_reviewer_theme`. Applies `dark` class to `<html>`. |
| `components/Button.jsx` | **Reusable button component.** Variants: `primary` (indigo filled), `secondary` (dark filled), `outline` (gray bordered), `indigo-outline` (indigo bordered), `ghost` (transparent hover). Sizes: `sm` (`h-9 px-3.5`), `md` (`h-12 px-5`, default), `lg` (`h-14 px-7`). Props: `variant`, `size`, `loading` (shows spinner), `fullWidth`, `icon` (before children), `iconAfter` (after children). Always `rounded-2xl`. All CTA buttons across the app use this component. |
| `components/InputPanel.jsx` | Unified input panel for the left workspace column. Single drag-drop container (no segmented control). Top strip: "Drop a file or click to upload" trigger (shows spinner + "Extracting text…" while parsing). Textarea fills the middle. Bottom: `<Button variant="primary" fullWidth>` "Review PRD" CTA. **Auto-extract for all file types**: `.md` via `FileReader.readAsText()`; `.docx`/`.pdf` via `POST /api/extract` → populates textarea (no immediate submit). `loading` and `extracting` states both disable the CTA. `onSourceChange` informs App.jsx of filename/source. Props: `{ onSubmit, loading, onSourceChange }`. |
| `components/UploadZone.jsx` | Superseded by `InputPanel.jsx` + inlined ProcessingView in App.jsx. File is kept but unused. |
| `components/ReviewDashboard.jsx` | Results view. No own max-width — App.jsx right panel handles layout. `px-6 py-6` padding. **Category order: `['design', 'engineering', 'product', 'security']` — all 4 shown**. Cards rendered in a **2-column grid** (`grid grid-cols-1 sm:grid-cols-2 gap-3`). Owns `openModal` (string\|null, category key) and `showWip` (bool). Clicking a card sets `openModal` → renders `<CategoryModal>`. WIP modal uses scale+fade entry animation. No "Review another PRD" button — left panel always visible. Props: `{ result, onReset }`. |
| `components/OverallBanner.jsx` | Compact review header. Top row: verdict pill badge (no icon, text only) + score. Sections: **Key Issues** (each category as a card with label left + status badge right + description, `gap-2` stack), **Next Step**, **Actions** (`<Button primary>` Fix Issues + `<Button outline>` Download dropdown). Download dropdown: `AnimatePresence` scale+fade (`scale: 0.95→1, y: -6→0`, ease `[0.16,1,0.3,1]`, 180ms), `rounded-2xl` panel. **No footer** — left panel always shows input. Props: `{ overall, categories, result, onFixMode }`. |
| `components/CategoryCard.jsx` | Compact, fully-clickable dashboard card (no accordion). Renders as a single `<Button size="raw">`. Shows: title (left) + status pill (right), large score%, slim `<ScoreBar slim />`. Clicking calls `onClick` → parent opens `CategoryModal`. **Status display labels**: `good`→**Strong**, `caution`→**Needs improvement**, `blocker`→**Missing**. Props: `{ categoryKey, data, onClick }`. |
| `components/CategoryModal.jsx` | Modal showing full category detail. Fixed `inset-0 z-50`, `bg-black/50 backdrop-blur-sm` overlay, closes on backdrop click or Escape. Content: `max-w-2xl bg-gray-900 border border-white/10 rounded-2xl`. Header: category title + Copy button + X close. Body: **Issue** / **Why It Matters** / **Suggested Fix**. Copy button writes plain text (stripped markdown) to clipboard via `navigator.clipboard.writeText()`; shows "Copied!" for 2s. Props: `{ categoryKey, data, onClose }`. |
| `components/DownloadMenu.jsx` | Standalone download dropdown (PDF/DOCX). No longer rendered in ReviewDashboard — download is now inlined in OverallBanner. |
| `components/MissingEssentials.jsx` | Not currently used — removed from `ReviewDashboard`. Recommendations are surfaced inside each `CategoryCard` detail view instead. |
| `components/FixMode.jsx` | Step-by-step issue resolution flow. Page title: **"Improve Your PRD"**; back button: "Back to Review". Accepts optional `categoryKey` to scope to one category; without it shows all caution/blocker steps sorted blockers-first. Each step shows: Key Issue, Why It Matters, Suggested Fix (indigo highlight box), editable textarea, and an **✨ AI Fix button** that calls `POST /api/fix` to generate a draft response. Navigation is **Previous / Next carousel** (no Skip). Clickable step dots allow jumping to any step. Step slide animations use `direction` (1=forward, -1=backward) + `slideKey` (incremented each nav) state — the step card's `key={slideKey}` triggers re-mount, applying `.slide-from-right` or `.slide-from-left` CSS class. `jumpTo(i)` sets direction from relative index before updating `stepIndex`. Final screen (CompletionScreen): shows original vs estimated score bars, verdict badge, Preview modal (requires `prdText` in result), **"Updated PRD (Ready to Use)"** section with Download PDF/DOCX (uses `downloadUpdatedPrdPdf`/`downloadUpdatedPrdDocx` — not the review report downloads), and session summary list. Score estimation is client-side (not a real re-run). Props: `{ result, categoryKey?, onClose }`. **Updated PRD downloads are gated here — not available on the review screen.** |
| `components/PrdTemplate.jsx` | **Two named exports** (no default export): `TemplateSidebar` + `TemplateDetail`. `TemplateSidebar` renders type segmented control + audience pills + clickable section list; props: `{ type, audience, selectedId, onTypeChange, onAudienceChange, onSelect }`. `TemplateDetail` renders selected section title, description, and numbered items with examples; props: `{ id }`. Template state (`tmplType`, `tmplAudience`, `selectedId`) is managed in App.jsx and passed down. |
| `components/LoadingSpinner.jsx` | Animated spinner with cycling step labels. No longer used — processing state is now inlined in App.jsx. |
| `components/TrafficLight.jsx` | Coloured status dot: green (good), amber (caution), red (blocker). |
| `components/ScoreBar.jsx` | Animated horizontal progress bar coloured by status. Accepts `slim` prop (default `false`): when `true`, renders a `h-1` bar with no score label — used inside `CategoryCard` headers. |
| `data/templateSections.js` | All PRD template sections. Each section has `types`, `audiences`, `items` (with `text` and `example`). |
| `utils/statusHelpers.jsx` | Tailwind class maps for statuses and verdicts. Also exports `CATEGORY_META` and four text utilities: `cleanMarkdown(text)` → plain string, strips `**`/`*`/`##`; `renderText(text)` → JSX, converts `**bold**` to `<strong>`; `parseParagraphs(text)` → string array, splits summary lines; `formatSection(section)` → plain string block with title, score, issue, impact, and numbered recommendations — for PDF/DOCX/clipboard use. |
| `utils/downloadReport.js` | Four named exports: `downloadReviewPdf(result)` and `downloadReviewDocx(result)` produce the full analysis report (scores, verdicts, recommendations); `downloadUpdatedPrdPdf(result)` and `downloadUpdatedPrdDocx(result)` produce a clean PRD document with no scores or review language — uses `result.prdText` and optionally `result.amendments` (from Fix Mode). Legacy aliases `downloadPdf` / `downloadDocx` remain for backwards compat. All libraries lazy-loaded via dynamic `import()`. |

---

## Server structure (`server/src/`)

| Path | Purpose |
|---|---|
| `index.js` | Express setup. Validates `ANTHROPIC_API_KEY` on startup. Mounts `/api/review`, `/api/fix`, `/api/extract`. Serves on `PORT` (default 3001). |
| `routes/review.js` | `POST /api/review`. Accepts multipart form with a `file` field. Routes `.docx`/`.pdf`/`.md`/`.txt` to the correct parser. Always uses Anthropic. Returns `prdText` (extracted plain text) in the response for use by Fix Mode. |
| `routes/fix.js` | `POST /api/fix`. Accepts JSON `{ categoryLabel, issue, whyItMatters, suggestedFix }`. Returns `{ fixText }` — 2–3 sentences of AI-generated PRD amendment text. Uses `claude-haiku-4-5-20251001` (fast/cheap). |
| `routes/extract.js` | `POST /api/extract`. Accepts multipart `file` field. Parses `.docx`/`.pdf`/`.md`/`.txt` using the same parsers as `/api/review`. Returns `{ text }` — no AI call, pure text extraction. Used by `InputPanel` for auto-paste on file upload. |
| `services/docxParser.js` | Extracts plain text from `.docx` using `mammoth`. Falls through to `buffer.toString('utf8')` for `.md`/`.txt` files. |
| `services/pdfParser.js` | Extracts plain text from `.pdf` using `pdf-parse`. |
| `services/anthropicService.js` | Calls Claude (`claude-opus-4-6`, 4096 tokens) with the constructed prompt. |
| `services/aiRouter.js` | Routes to `anthropicService` or `openaiService` based on `provider` param (always `'anthropic'` in practice). |
| `utils/promptBuilder.js` | Builds the system prompt and user message from PRD text. Instructs Claude to evaluate across Design, Engineering, Product, Security. |
| `utils/validateResponse.js` | Extracts JSON from Claude's response, validates against a Zod schema. Returns 422 if schema fails. |

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
    "design":      { "score": 80, "status": "good",    "verdict": "...", "summary": "...", "recommendations": ["..."] },
    "engineering": { "score": 65, "status": "caution", "verdict": "...", "summary": "...", "recommendations": ["..."] },
    "product":     { "score": 75, "status": "good",    "verdict": "...", "summary": "...", "recommendations": ["..."] },
    "security":    { "score": 55, "status": "caution", "verdict": "...", "summary": "...", "recommendations": ["..."] }
  }
}
```

Scoring: Design 25%, Engineering 30%, Product 25%, Security 20%.
Verdict: any `blocker` → NOT READY TO BUILD; score ≥ 75 → READY TO BUILD; else → CONDITIONAL APPROVAL.
Also returns `prdText` (string) — the raw extracted text of the uploaded document.

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
