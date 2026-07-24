# PRD Reviewer

An AI-powered tool that scores product requirement documents against a quality bar
and flags the gaps before they reach engineering.

**Live:** [prdreviewer.netlify.app](https://prdreviewer.netlify.app/)

Upload a PRD, and the app evaluates it across three lenses — **Design**,
**Engineering**, and **Product** — using Claude, then walks you through a
step-by-step **Fix Mode** to close the gaps it finds. Built as a personal project;
I use it to review my own specs before handoff.

<img width="1382" height="822" alt="Screenshot 2026-07-24 at 23 57 29" src="https://github.com/user-attachments/assets/dd02346a-3181-4cf9-b3f6-9b94d1ebca04" />


## Why I built it

PRDs kept reaching engineering with gaps nobody caught until build time — vague
success metrics, unscoped edge cases, missing states — and each gap meant a review
cycle that could have been avoided. So instead of writing a checklist I'd forget to
follow, I built a tool that applies the same standard every time and shows me where
a spec is weak before anyone else has to read it.

## What it does

- **Scores across three categories** — Design, Engineering, and Product — so a spec
  is judged the way the people who'll actually build it would judge it.
- **Reads the documents you already write** — accepts PDF and DOCX upload and
  extracts the text for evaluation.
- **Fix Mode** — rather than handing back a score and leaving you stuck, it walks
  through the gaps step by step so you can strengthen the spec in place.
- **Downloadable reports** — take the evaluation with you.
- **Light and dark mode**, and responsive down to phone width.

## How it's built

A two-package app — a React client and an Express server, deployed independently.

**Client**
- React 18 + Vite
- Tailwind CSS
- Deployed on Netlify

**Server**
- Node.js + Express
- Claude (Anthropic API) for the evaluation layer
- PDF/DOCX text extraction
- Deployed on Pxxl

All client API calls are routed through an environment variable, so the frontend
is never coupled to a specific server URL.

## Running it locally

The client and server are separate packages — install inside each subfolder, not
at the repo root.

```bash
# Server (terminal 1)
cd server
npm install
npm start

# Client (terminal 2)
cd client
npm install
npm run dev
```

The server needs an Anthropic API key to run. Create `server/.env`:

```
ANTHROPIC_API_KEY=your-key-here
```

Then open the client dev server URL that Vite prints.

## Status

Live and actively improved. Built and maintained by [Mo](https://github.com/iammood).
