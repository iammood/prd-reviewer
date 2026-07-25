# Changelog

All notable changes to PRD Reviewer are documented here.

---

## [Unreleased] — 2026-06-20

### Changed
- Migrated server hosting from Render to Pxxl App — added `server/pxxl.toml` declaring `startCommand`, a no-op `buildCommand` (no build step exists for this plain Express app), and `port`
- `CLAUDE.md` updated to reference Pxxl App instead of Render throughout

---

## [Unreleased] — 2026-04-07

### Added
- Global Express error handler in `server/src/index.js` — catches multer errors (e.g. file too large) and any unhandled exceptions, returns consistent JSON error responses instead of crashing
- Inline `›` chevron next to category card title — fades from opacity-40 to opacity-80 on hover as a drill-down affordance
- Smooth modal open/close animation — scale + fade transition (300ms ease-out) on `CategoryModal`; delays parent unmount so the exit animation plays
- Full light/dark theming on `CategoryModal` — was hardcoded dark; now uses paired Tailwind classes (`bg-white dark:bg-[#0B1220]`, backdrop `bg-black/30 dark:bg-black/60`, all text pairs)
- Hover/active interaction on category cards — lift (`-translate-y-1`), scale-up (1.02x), shadow, and active press-down (0.98x) at 200ms ease-out / 100ms snap
- Same hover/active scale effect applied to Fix Issues and Download buttons in `OverallBanner`
- Same hover/active scale effect applied to Copy button in `CategoryModal`

### Changed
- `extract.js` file size limit raised from 5MB → 20MB
- `req.file?.` optional chaining replaced with direct access (null guard already above)

### Removed
- Floating `↗` arrow SVG from category cards (was overlapping the status badge visually)

---

## [0.4.0] — 2026-04-07

### Added
- `/api/extract` endpoint now detects file type by MIME type with filename extension as fallback, handling browser inconsistencies in reported MIME types
- Debug logging throughout extract route (`ROUTE HIT`, `FILE RECEIVED`, `MIME TYPE`, `FILE SIZE`, parse length) for production diagnostics
- `localhost:10000` fallback for `VITE_API_URL` so the client works against the Render default port without a `.env` file

### Fixed
- **PDF parsing broken on all files** — `pdf-parse` was upgraded to v2 which changed from a function export to a class-based API; downgraded back to v1.1.4 to restore the CommonJS function export
- `pdf-parse` v2 `pdf is not a function` error — intermediate fix attempt before final downgrade
- Extract endpoint returning non-JSON HTML error pages — added proper JSON responses for all error paths
- DOCX files failing extraction — broadened MIME type detection to include `wordprocessingml` substring match
- Extract error handling and JSON parsing hardened — client now reads response as text first, then parses, with detailed logging on failure

---

## [0.3.0] — 2026-04-06

### Added
- `/api/extract` endpoint — accepts `.pdf`, `.docx`, `.md`, `.txt` uploads, returns extracted plain text without making an AI call; used by `InputPanel` to auto-populate the textarea on file drop
- Root health route (`GET /`) returning `PRD Reviewer API is running`
- `/api/health` endpoint returning `{ ok: true }`
- `express.json()` middleware for JSON request body parsing

### Changed
- CORS opened to all origins (`origin: '*'`) to support Netlify → Render cross-origin requests
- Server default port changed from 3001 → 10000 to match Render's standard port assignment
- `API_URL` constant centralised across all client fetch calls using `import.meta.env.VITE_API_URL`
- `.gitignore` updated to cover `client/.env` and prevent future env file accidents

### Fixed
- `server/.env` untracked after API key was accidentally committed — file removed from git history tracking
- `statusHelpers` imports updated to `.jsx` extension after file was renamed

---

## [0.2.0] — 2026-04-06

### Changed
- Full UI redesign: two-column workspace layout (`w-2/5` input / `flex-1` results), 2-column category card grid, collapsible `CategoryModal` detail view
- Typography system: Mona Sans font loaded via Google Fonts, applied globally via Tailwind `fontFamily.sans`
- Text colour scale established: `dark:text-white` (primary), `dark:text-gray-300` (labels), `dark:text-gray-400` (secondary), `dark:text-gray-500` (muted) — `gray-100` and `gray-200` variants eliminated
- `CategoryCard` simplified to compact clickable card with `ScoreBar slim` — no accordion
- `InputPanel` replaces `UploadZone` as the unified left-panel input component with drag-drop, file upload strip, textarea, and Review PRD CTA
- Processing view inlined into `App.jsx` with animated step list, progress bar, and phase-aware timing (normal → fast → completing)
- `OverallBanner` redesigned: verdict pill + score header, Key Issues cards, Next Step text, Fix Issues + Download actions

### Fixed
- `cleanMarkdown` missing export causing build failure

---

## [0.1.0] — 2026-04-02

### Added
- Initial project scaffold — React 18 + Vite + Tailwind CSS client, Node.js + Express server
- `POST /api/review` — accepts `.docx`, `.pdf`, `.md`, `.txt` uploads; parses file, calls Claude (`claude-opus-4-6`), validates JSON response with Zod, returns scored review across Design, Engineering, Product, Security
- `POST /api/fix` — accepts issue context, returns 2–3 sentences of AI-drafted PRD amendment text using `claude-haiku-4-5-20251001`
- Overall score computed as weighted average (Design 25%, Engineering 30%, Product 25%, Security 20%)
- Verdict logic: any blocker → `NOT READY TO BUILD`; score ≥ 75 → `READY TO BUILD`; else → `CONDITIONAL APPROVAL`
- `FixMode` — step-by-step issue resolution flow with carousel navigation, AI Fix button, completion screen with before/after score comparison
- Download reports as PDF or DOCX (review report and updated PRD variants)
- Dark/light mode toggle persisted in `localStorage`
- PRD Template reference view with sections filterable by document type and audience
- Landing page with hero, pain/solution framing, how-it-works, sample review, and inline simulated demo
