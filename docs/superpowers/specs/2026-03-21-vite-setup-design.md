# HackStoga 2026 — Vite + Vue Frontend & Express Backend Setup

**Date:** 2026-03-21
**Status:** Approved

## Overview

A monorepo (Option A — simple flat) with two sibling folders: `frontend/` (Vue 3 + Vite + TypeScript + CSS Modules) and `backend/` (Node.js + Express + TypeScript). A root `package.json` provides unified `dev` and `build` scripts. No CSS framework — styling is done entirely via CSS Modules and a single global CSS reset/variables file.

## Repository Structure

```
HackStoga2026/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── global.css       ← resets + CSS custom properties
│   │   ├── components/
│   │   ├── views/
│   │   ├── router/
│   │   │   └── index.ts         ← Vue Router configuration
│   │   ├── App.vue
│   │   └── main.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   └── index.ts             ← Express app entry point
│   ├── dist/                    ← tsc output (gitignored)
│   ├── tsconfig.json
│   └── package.json
├── package.json                 ← root, scripts only (no deps)
├── .gitignore
└── CLAUDE.md
```

## Frontend

- **Framework:** Vue 3 (Composition API) + Vite + TypeScript (`vue-ts` template base)
- **Styling:** CSS Modules via `<style module>` on all components; no CSS framework
- **Global CSS:** `src/assets/global.css` for box-sizing reset, margin reset, and CSS custom properties (colors, spacing, typography)
- **Routing:** Vue Router — router config lives in `src/router/index.ts`, page-level components in `src/views/`. Vue Router is included from the start since the project is expected to have multiple views.
- **Dev proxy:** `vite.config.ts` proxies `/api` → `http://localhost:3000` to avoid CORS during development
- **TypeScript:** `strict: true` in `tsconfig.json`

## Backend

- **Runtime:** Node.js + Express + TypeScript
- **Key packages:** `express`, `cors`, `@types/express`, `@types/node`, `@types/cors`, `ts-node-dev` (dev), `typescript`
- **Dev server:** `ts-node-dev` for hot reload during development (no manual compile step)
- **Build:** `tsc -p backend/tsconfig.json` (run from repo root) outputs to `backend/dist/`
- **Entry:** `src/index.ts` — initializes Express, applies middleware, mounts routes, listens on port `3000`
- **Routes:** `src/routes/` directory for organizing route modules
- **CORS:** Enabled for `http://localhost:5173` (Vite dev server) in development. Production CORS config is out of scope for this setup.
- **TypeScript:** `strict: true` in `tsconfig.json`

## Root Package

The root `package.json` contains only `devDependencies` (`concurrently`) and scripts:

- `npm run dev` — runs `concurrently "npm run dev --prefix frontend" "npm run dev --prefix backend"`
- `npm run build` — runs `npm run build --prefix frontend && tsc -p backend/tsconfig.json`

## Decisions

- No monorepo tooling (no workspaces, no Turborepo) — YAGNI for a hackathon
- No shared `types/` package — can be added later if needed
- CSS Modules chosen over Tailwind/Material for full design control with minimal setup
- Vue Router included from the start — the project is expected to have multiple views
- Production CORS configuration is explicitly out of scope for this initial setup
