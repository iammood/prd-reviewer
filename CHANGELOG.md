# Changelog

All notable changes to PRD Reviewer are documented here.

---

## [Unreleased] — 2026-07-26

### Changed
- Results reveal animation: the review dashboard now staggers in (overall banner → category cards → suggestions) when a review lands — a compositor-only, reduced-motion-aware reveal reusing the app's existing easing curve (`client/src/components/ReviewDashboard.jsx`). Guided by the `emilkowalski/skill` animation skills' restraint-first Gate (add motion only where it earns its place)
- Device back/forward gesture support: the app integrates with the browser History API (no URL routing) so the phone back-swipe and browser Back/Forward navigate between views — Landing ↔ App, and (on mobile) template list ↔ section detail — instead of leaving the site. Forward restores the exact prior view; the logo jumps straight home from any depth. (`client/src/App.jsx`)
- Mobile template navigation: tapping a section opens a full-screen detail view with a "← Back to sections" button (master-detail pattern) instead of rendering below the list — fixes the discoverability problem where the detail was buried under the whole list. Desktop keeps the side-by-side split. Also applied `ibelick/ui-skills` interaction standards app-wide: `prefers-reduced-motion` support via framer-motion `MotionConfig`, `h-dvh`/`min-h-dvh` instead of `h-screen`, and compositor-only (`opacity`/`transform`) detail transitions
- Mobile responsiveness: the two-pane workspace now stacks into a single column below 768px (`md:` breakpoints throughout — no JS viewport checks). Review mode shows the input card then the review/empty state beneath it; Template mode shows filters + section list then the selected section below. Header wraps the mode switcher to its own row on narrow screens; textarea gets a ~340px min-height on phones; touch targets ≥44px; 16px page padding; no horizontal scroll (verified at 375/390/414/768/1280). Desktop layout unchanged. (`App.jsx`, `InputPanel.jsx`, `ReviewDashboard.jsx`, `PrdTemplate.jsx`)
- The header "PRD Reviewer" title is now a clickable button that returns to the landing page (`client/src/App.jsx`)
- Rebranded the logo mark + social image: new favicon set (`favicon.svg`, `favicon.ico`, `favicon-16/32.png`, `apple-touch-icon.png`, `android-chrome-192/512.png`) and new `og-image` (svg source + 80 KB jpg). Added `favicon.ico` for legacy browsers; bumped `og:image`/`twitter:image` to `?v=2` to force fresh social unfurls of the new design
- Upgraded the review model from `claude-opus-4-6` to `claude-opus-4-8` (`server/src/services/anthropicService.js`) — clean model-ID swap, no other request params used
- Deploy workflow: client deploys via the Netlify CLI (draft upload + manual publish; continuous deployment stopped); server deploys only from the dedicated `server-release` branch so `main` pushes no longer spend Pxxl build minutes. Added `client/.env.production`, `client/netlify.toml`, and a `deploy:preview` npm script (`DEPLOYMENT.md`, `CLAUDE.md`)
- Clarified `server/.env.example` — `PORT=3001` is the local dev value; Pxxl injects `PORT` in production
- GitHub repo moved to `iammood/prd-reviewer`; gitignored `.claude/settings.local.json` (machine-local)

### Added
- Site metadata + favicon: `client/index.html` now carries a description, canonical URL, `theme-color`, and Open Graph + Twitter Card tags for rich link previews. New `client/public/` assets: `favicon.svg` (document + review-check mark), `og-image.svg` (1200×630 social card), and `site.webmanifest`
- PNG raster set for full compatibility: `favicon-16/32.png`, `apple-touch-icon.png` (180), `android-chrome-192/512.png` for icons, plus `og-image.jpg` (1200×630, ~80 KB JPEG — small enough for social scrapers to fetch within their timeouts, where the 712 KB PNG was at risk of timing out); HTML links the PNG icon fallbacks and points the social image at the JPEG; manifest gains PNG icons
- Product review now conditionally evaluates access, privacy, and compliance — only for PRDs that clearly need it (user accounts, personal/sensitive data, payments, or regulated areas). PRDs that involve none of these are neither flagged nor penalised (`server/src/utils/promptBuilder.js`)
- New PRD template section "Access, Privacy & Compliance" (Product audience), phrased to be filled in only when applicable (`client/src/data/templateSections.js`)
- Design-interaction skills: installed `ibelick/ui-skills` (`.agents/skills/` + `.claude/skills/`) — `baseline-ui`, `create-design-md`, `fixing-accessibility`, `fixing-metadata`, `fixing-motion-performance`
- Animation skills: installed `emilkowalski/skill` (`.agents/skills/`) — `animation-vocabulary`, `find-animation-opportunities`, `improve-animations`, `review-animations`, `apple-design`, `emil-design-eng`, `pick-ui-library`; `skills-lock.json` tracks installed skills

### Removed
- Remaining "Security" review-category references removed from the landing page and from unused components (`LandingPage.jsx`, `LoadingSpinner.jsx`, `UploadZone.jsx`, `MissingEssentials.jsx`) — access/privacy/compliance now lives inside the Product category
- Deleted stray `prd-reviewer:CLAUDE.md` (salvaged its still-accurate rules into root `CLAUDE.md`); removed stray root-level `favicons/` + `og-image.png` duplicates

### Fixed
- `site.webmanifest` now served as `application/manifest+json` (was `application/octet-stream`) via a `[[headers]]` rule in `client/netlify.toml`
- `ARCHITECTURE-plain-english.md`: corrected to three categories (was four incl. Security) and accurate scoring weights (Product 40%, Design/Engineering 30% each)

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
