# Project: "Future-Commit" AI Version Control System (Demo MVP)

## Overview
A novel version control system built for creative prototyping and text generation. Instead of just tracking past changes, it predicts and generates "future commits." Users visually explore AI-generated branches, adjust directions via prompts, and merge/blend different branches to create a final document.

## Core Demo Features
* **Future Branching:** AI (Gemini 2.0 Flash) generates multiple upcoming commits/branches from the current text.
* **Branch Blending:** UI to adopt, merge, or discard AI-generated future branches into the main working path.
* **Modular UI:** Panel-based layout with:
  * A central rich text editor (TipTap).
  * An SVG commit graph visualizer showing past, current, and future commits.
  * A branch viewer for previewing future commit content.
  * A generate bar to trigger AI predictions.
* **In-Browser Git:** Full git operations (branch, commit, merge, diff) running client-side via isomorphic-git + lightning-fs (IndexedDB). Single document per project, with export/import support.

## Technical Architecture

### Monorepo Structure
```
HackStoga2026/
├── package.json              Root: concurrently runs frontend + backend
├── CLAUDE.md                 This file
├── frontend/                 Vue 3 + Vite + TypeScript
│   ├── src/
│   │   ├── ai.ts             Gemini API integration (reads VITE_GEMINI_API_KEY from .env)
│   │   ├── git/              In-browser git module (isomorphic-git + lightning-fs)
│   │   │   ├── config.ts     LightningFS instance, repo dir helpers
│   │   │   ├── types.ts      Shared interfaces
│   │   │   ├── index.ts      Barrel export
│   │   │   └── services/     repo, branch, commit, file, diff, merge, tree
│   │   ├── stores/
│   │   │   └── useProjectStore.ts   Pinia store: commits, branches, AI generation
│   │   ├── components/
│   │   │   ├── Taskbar.vue          Top bar with project status
│   │   │   ├── Panel.vue            Draggable panel container
│   │   │   ├── MainEditor.vue       TipTap rich text editor
│   │   │   ├── GitGraph.vue         SVG commit graph (main UI)
│   │   │   ├── CommitGraphViz.vue   SVG commit graph (playground)
│   │   │   ├── DiffView.vue         Line-level diff viewer
│   │   │   ├── GenerateBar.vue      AI future generation controls
│   │   │   └── BranchViewer.vue     Preview content of selected branch
│   │   ├── composables/
│   │   │   ├── useEditorPersistence.ts
│   │   │   └── useGraphLayout.ts
│   │   ├── views/
│   │   │   ├── HomeView.vue         Main app workspace
│   │   │   └── GitPlayground.vue    Testing sandbox for git module (/git)
│   │   ├── router/index.ts
│   │   └── main.ts           Buffer polyfill + Pinia + Router
│   └── .env                  VITE_GEMINI_API_KEY (not committed)
└── backend/                  Express + TypeScript
    └── src/
        ├── index.ts           Express server on port 3000, CORS for :5173
        └── routes/health.ts   GET /api/health
```

### Stack
* **Frontend:** Vue 3, Vite 5, TypeScript, Pinia, Vue Router, TipTap, CSS Modules
* **In-Browser Git:** isomorphic-git + @isomorphic-git/lightning-fs (IndexedDB)
* **AI:** Google Gemini 2.0 Flash via @google/generative-ai
* **Backend:** Express 4, TypeScript, ts-node-dev (currently health endpoint only)
* **Dev Tooling:** concurrently, vue-tsc

### Key Design Decisions
* **Git runs client-side** — no server-side git. All operations happen in the browser using IndexedDB for persistence.
* **Single document per project** — each project versions one `document.txt` file.
* **AI calls from frontend** — Gemini API key stored in `frontend/.env` as `VITE_GEMINI_API_KEY`. Falls back to mock data if key is missing.
* **CSS Modules + global design tokens** — dark evergreen theme with mustard/aqua accents defined in `global.css`.
* **No shared types package** — frontend and backend are independent TypeScript projects.

## Running the Project
```bash
npm run dev          # Starts both frontend (:5173) and backend (:3000)
```

Frontend proxies `/api/*` to backend via Vite config.

## Environment Variables
| Variable | Location | Purpose |
|---|---|---|
| `VITE_GEMINI_API_KEY` | `frontend/.env` | Google Gemini API key for AI generation |
