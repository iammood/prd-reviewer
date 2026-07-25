# Project Architecture (Plain English)

## What this app does

It's a website where you upload or paste a PRD (a product requirements document — the doc product teams write to describe a feature before building it). The app sends that document to an AI (Claude), which reads it and grades it across three areas: **Product, Design, and Engineering**. (When the feature calls for it — for example it has user accounts, collects personal data, or handles payments — the Product review also checks that access, privacy, and any applicable compliance needs are covered. For features that don't touch those things, it's left alone.) You get a score and a verdict for each area, plus an overall score and verdict, and a list of suggested fixes. You can then download the full report as a PDF or Word doc, or walk through a guided "fix it" flow that helps you patch the issues one by one.

There's also a separate reference section in the app — a library of "what a good PRD section looks like," organized by document type (new feature / enhancement / bug fix) and by audience (design / engineering / product / everyone).

---

## The two halves of the app

The project is split into two completely separate programs that talk to each other over the network:

1. **`client/`** — this is what you see in your browser. It's built with React (a tool for building interactive web pages), Vite (a build tool that makes development fast), and Tailwind CSS (a styling system). Its only job is to show the interface, collect your input, and display results — it does no AI work itself.

2. **`server/`** — this is the backend, built with Node.js and Express. It's the only part of the app that's allowed to talk to Claude (the AI). It receives files, reads the text out of them, builds a prompt, sends it to Claude, checks that Claude's answer is well-formed, and sends the result back to the browser.

This separation matters for one big reason: the AI requires a secret API key to use, and that key must **never** be visible to anyone using the website. By keeping all AI calls on the server, the key stays hidden on a machine only the developers control, not in the browser where anyone could inspect it.

When you're developing locally, both halves run at the same time on different "ports" (think of a port as a numbered door on your computer) — the browser app on one door, the server on another — and the browser app is configured to forward any API requests through to the server automatically.

When the app is deployed for real users, the browser app is hosted on one service (Netlify) and the server on another (Render), and they're configured to allow cross-site requests between them, with the server's address stored as a setting rather than hard-coded.

---

## How a review actually happens, step by step

1. You drop a file (or paste text) into the input panel on the left.
2. If you uploaded a file, the browser app immediately sends it to the server's "extract" endpoint — this just pulls the plain text out of the document (handling Word docs, PDFs, Markdown, and plain text differently depending on format) and hands it back, with no AI involved yet. That text fills the textbox so you can see/edit it before submitting.
3. When you hit "Review PRD," the browser sends the file again, this time to the "review" endpoint.
4. The server figures out the file type, extracts the text (again, format-aware), and builds a structured prompt instructing Claude to act as a reviewer and judge the document across the three categories.
5. The server sends that prompt to Claude and waits for a response.
6. Claude's reply is expected to come back as structured data (scores, statuses, summaries, recommendations per category). The server double-checks this data matches the expected shape before trusting it — if Claude's answer doesn't fit the expected structure, the server rejects it rather than passing garbage to the browser.
7. The server computes an overall score as a weighted average (Product matters most at 40%, then Design and Engineering at 30% each), and decides an overall verdict: any single serious problem ("blocker") in any category fails the whole review; otherwise a high overall score passes, and anything in between is a conditional pass.
8. All of this — scores, verdicts, summaries, recommendations, and the original extracted text — goes back to the browser, which renders the results dashboard.

There's a third, smaller AI-backed endpoint: "fix," which takes a single issue and asks a faster/cheaper version of Claude to draft 2–3 sentences of suggested PRD wording to resolve it. This powers the step-by-step "Fix Mode" flow.

---

## How the interface is organized

- A **landing page** appears first, explaining the product, with a fake/simulated demo that doesn't call the real server.
- After you click through, you land in the **main workspace**: a two-column layout. The left column is always your input area; the right column shows whatever's relevant — an empty state, a loading/processing animation, an error message, or the results dashboard, depending on what's happening.
- There's a tab switcher at the top letting you flip between "Review PRD" (the main flow) and "PRD Template" (the static reference library), without losing your place.
- The **results dashboard** shows three cards (one per category), each clickable to open a detail popup with the full issue, why it matters, and the suggested fix.
- From the results, you can either download the full report (PDF/Word, includes all scores and AI commentary) or enter **Fix Mode**, a guided carousel that walks you through each problem one at a time, lets you draft a fix (manually or via the AI "fix" endpoint), and ends with a before/after score comparison and the option to download a *clean* updated PRD document — one with no scores or review commentary, just the improved document itself.

These two kinds of downloads (the analysis report vs. the clean updated document) are intentionally kept as separate code paths so they never get mixed up — one is meant for the reviewer, the other for shipping as an actual document.

---

## Other notable structural choices

- **Light/dark mode** is a simple toggle that remembers your choice and applies consistent, paired color classes everywhere (a fixed handful of text shades, not an open-ended palette) so the look stays consistent across the app.
- **Heavy libraries** used only for generating PDF/Word downloads are loaded on-demand (only when you actually click "download"), not bundled into the app from the start — this keeps the initial page load fast.
- **Pasted text** is treated identically to an uploaded file internally — it's wrapped into a fake "file" before being sent to the server, so there's only one code path to maintain for "got some PRD text, now process it," whether it came from a file or a paste box.
- The **template/reference library** (the "what good PRD sections look like" content) is just static data sitting in the browser app — no server or AI involved, it's pure reference material you can filter and browse.
