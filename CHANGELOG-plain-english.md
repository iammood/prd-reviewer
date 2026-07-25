# Changelog (Plain English)

What was done in this project and how, written without technical jargon. Oldest to newest.

---

## Version 0.1.0 — First build

We built the app from scratch. The frontend uses React with Vite and Tailwind for styling; the backend uses Node.js with Express.

What it does:
- You can upload a PRD (Word doc, PDF, Markdown, or text file) and the app sends it to Claude (Anthropic's AI), which reviews it and scores it across four areas: Design, Engineering, Product, and Security.
- An overall score is calculated by weighting those four scores (Engineering counts most at 30%, then Design and Product at 25% each, Security at 20%).
- Based on the score, the app gives a verdict: any serious "blocker" issue means "Not Ready to Build," a high score means "Ready to Build," otherwise it's "Conditional Approval."
- There's a "Fix Mode" that walks you through each issue one at a time, with an AI button that drafts a fix for you, ending in a before/after score comparison.
- You can download the review as a PDF or Word doc.
- Added dark/light mode that remembers your preference.
- Added a reference library of PRD template sections you can filter by document type and audience.
- Added a landing page explaining the product with a fake/simulated demo.

## Version 0.2.0 — Redesign

We gave the app a visual overhaul without changing what it does.

- Switched to a two-column layout: inputs on the left, results on the right.
- Changed the font to Mona Sans and standardized which shade of gray/white text is used where, so the dark mode looks consistent.
- Simplified the result cards — they used to expand like an accordion, now they're simple clickable cards with a thin progress bar.
- Replaced the old upload component with a new unified one that handles drag-and-drop, file upload, and pasting text in one place.
- Moved the "processing" animation (the loading screen with steps) directly into the main app file, with a progress bar that speeds up over time.
- Redesigned the results summary banner with a clearer verdict, score, issues list, and action buttons.
- Fixed a bug where a missing piece of code (`cleanMarkdown`) was breaking the build entirely.

## Version 0.3.0 — Getting ready to deploy

This release was about making the app work when hosted online (Netlify for the frontend, Render for the backend), not just on a local machine.

- Added a new endpoint that just extracts text from an uploaded file (PDF/Word/Markdown/text) without asking the AI to review it yet — this lets the app auto-fill the text box right after you drop a file in.
- Added two simple "health check" routes so the hosting service can confirm the server is alive.
- Opened up CORS (cross-origin permissions) so the frontend, hosted on Netlify, is allowed to talk to the backend, hosted on Render — these live on different domains.
- Changed the server's default port to match what Render expects.
- Made sure every part of the frontend uses one single, central setting for the backend's URL, instead of having it scattered around.
- Updated `.gitignore` so secret environment files don't get accidentally saved to git again.
- Fixed a real incident: the server's `.env` file (which holds the secret API key) had been accidentally committed to git — it was removed from tracking.
- Fixed an import that broke after a file was renamed.

## Version 0.4.0 — Fixing broken file uploads

This release fixed a string of bugs, mostly around reading uploaded files correctly.

- Browsers don't always report a file's type consistently, so the text-extraction endpoint was changed to double-check the file type using both the browser's reported type and the filename's extension.
- Added detailed logging so we could diagnose upload problems happening in production.
- Added a fallback backend address so the app still works even without a `.env` file configured.
- The core fix: a library used for reading PDFs (`pdf-parse`) had been upgraded to a newer version that changed how it worked internally, which broke all PDF parsing. We downgraded it back to the older version that worked.
- Fixed the extraction endpoint sometimes returning an error page (HTML) instead of a proper error message (JSON), which confused the frontend.
- Fixed Word document (.docx) uploads failing because the file-type check was too strict.
- Made error handling more robust on the frontend so it reads server responses safely instead of assuming they're always valid JSON.

## Unreleased (most recent) — Polish and stability

This batch was about making the app feel smoother and more reliable, with no major new features.

- Added a safety net on the server: if something crashes or a file upload fails (e.g. file too large), the server now returns a proper error message instead of crashing entirely.
- Added small hover animations: a `›` arrow on cards that becomes more visible on hover, cards that lift and scale slightly when you hover/click them, and the same subtle effect on the Fix Issues, Download, and Copy buttons.
- Added a smooth fade/scale animation when opening and closing the detail popup (modal) for each category.
- Fixed the detail popup so it now properly supports both light and dark mode — it used to be stuck in dark mode regardless of the app's theme.
- Increased the maximum file size you're allowed to upload, from 5MB to 20MB.
- Removed a small arrow icon from cards that was visually overlapping with other elements.
- Cleaned up some leftover defensive code that was no longer needed.

## Unreleased (most recent) — Access & privacy folded into Product; Security tidied up

- The review used to have a separate "Security" area. That was retired earlier; this update finishes the job by folding access, privacy, and compliance into the **Product** review — but only when a document actually needs it. If a feature has logins, collects personal data, or takes payments, the Product review now checks those things are covered. If it doesn't touch any of that, nothing is raised and the score isn't affected.
- Added a matching "Access, Privacy & Compliance" section to the PRD template library (under Product), with a clear note to include it only when the feature calls for it.
- Removed the last mentions of "Security" from the landing page and a few unused screens.
- Tidied up the deployment process: the frontend is now published from your computer (build, upload a preview, then click publish), and the backend only redeploys when you push a dedicated release branch — so routine changes stop using up hosting build minutes.
- Fixed the plain-English architecture note, which still said there were four review areas (it's three).
