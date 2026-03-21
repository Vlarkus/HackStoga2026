# HackStoga 2026 Monorepo Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a flat monorepo with a Vue 3 + Vite + TypeScript + CSS Modules frontend and a Node.js + Express + TypeScript backend, wired together with a single root `package.json` for unified dev/build scripts.

**Architecture:** Two sibling folders (`frontend/`, `backend/`) under the repo root. The root `package.json` uses `concurrently` to start both servers with one command. The Vite dev server proxies `/api` requests to the Express server on port 3000, eliminating CORS friction during development.

**Tech Stack:** Vue 3 (Composition API), Vite, Vue Router, TypeScript (strict), CSS Modules, Node.js, Express, cors, ts-node-dev, concurrently

---

## File Map

### Root
- Create: `package.json` — root scripts + concurrently devDependency
- Create: `.gitignore` — node_modules, dist, .env

### Backend
- Create: `backend/package.json` — express, cors, ts-node-dev, typescript, @types/*
- Create: `backend/tsconfig.json` — strict TS config, outDir: dist
- Create: `backend/src/index.ts` — Express app, CORS, port 3000
- Create: `backend/src/routes/health.ts` — GET /api/health → { status: "ok" }

### Frontend
- Create: `frontend/package.json` — vue, vue-router, vite, @vitejs/plugin-vue, typescript, vue-tsc
- Create: `frontend/tsconfig.json` — strict TS config for Vue
- Create: `frontend/tsconfig.node.json` — TS config for vite.config.ts
- Create: `frontend/vite.config.ts` — @vitejs/plugin-vue, /api proxy → localhost:3000
- Create: `frontend/index.html` — Vite entry HTML
- Create: `frontend/src/main.ts` — mount Vue app with router
- Create: `frontend/src/App.vue` — root component with `<RouterView />`
- Create: `frontend/src/router/index.ts` — Vue Router, history mode, HomeView route
- Create: `frontend/src/views/HomeView.vue` — placeholder home page with CSS Module
- Create: `frontend/src/assets/global.css` — box-sizing reset, CSS custom properties

---

## Task 1: Root scaffolding

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root `.gitignore`**

```
node_modules/
dist/
.env
.DS_Store
```

Save to: `HackStoga2026/.gitignore`

- [ ] **Step 2: Create root `package.json`**

```json
{
  "name": "hackstoga2026",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev --prefix frontend\" \"npm run dev --prefix backend\"",
    "build": "npm run build --prefix frontend && tsc -p backend/tsconfig.json"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

Save to: `HackStoga2026/package.json`

- [ ] **Step 3: Install root dependencies**

Run from repo root:
```bash
npm install
```

Expected: `node_modules/` created at repo root, `concurrently` installed.

- [ ] **Step 4: Commit**

```bash
git add .gitignore package.json package-lock.json
git commit -m "chore: add root package.json and .gitignore"
```

---

## Task 2: Backend — package.json and tsconfig

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`

- [ ] **Step 1: Create `backend/package.json`**

```json
{
  "name": "hackstoga2026-backend",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.19.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

Save to: `HackStoga2026/backend/package.json`

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

Save to: `HackStoga2026/backend/tsconfig.json`

- [ ] **Step 3: Install backend dependencies**

Run from repo root:
```bash
npm install --prefix backend
```

Expected: `backend/node_modules/` created.

- [ ] **Step 4: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/tsconfig.json
git commit -m "chore: add backend package.json and tsconfig"
```

---

## Task 3: Backend — Express entry point and health route

**Files:**
- Create: `backend/src/index.ts`
- Create: `backend/src/routes/health.ts`

- [ ] **Step 1: Create `backend/src/routes/health.ts`**

```typescript
import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default router;
```

Save to: `HackStoga2026/backend/src/routes/health.ts`

- [ ] **Step 2: Create `backend/src/index.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import healthRouter from './routes/health';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

app.use('/api', healthRouter);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
```

Save to: `HackStoga2026/backend/src/index.ts`

- [ ] **Step 3: Verify backend starts**

Run from repo root:
```bash
npm run dev --prefix backend
```

Expected output: `Backend running on http://localhost:3000`

Open browser or run: `curl http://localhost:3000/api/health`
Expected: `{"status":"ok"}`

Stop the server (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add backend/src/
git commit -m "feat: add Express backend with health route"
```

---

## Task 4: Frontend — package.json, tsconfig, vite.config

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`

- [ ] **Step 1: Create `frontend/package.json`**

```json
{
  "name": "hackstoga2026-frontend",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.27",
    "vue-router": "^4.3.3"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.5",
    "typescript": "^5.4.5",
    "vite": "^5.3.1",
    "vue-tsc": "^2.0.21"
  }
}
```

Save to: `HackStoga2026/frontend/package.json`

- [ ] **Step 2: Create `frontend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "noEmit": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Save to: `HackStoga2026/frontend/tsconfig.json`

- [ ] **Step 3: Create `frontend/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["vite.config.ts"]
}
```

Save to: `HackStoga2026/frontend/tsconfig.node.json`

- [ ] **Step 4: Create `frontend/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Save to: `HackStoga2026/frontend/vite.config.ts`

- [ ] **Step 5: Create `frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HackStoga 2026</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Save to: `HackStoga2026/frontend/index.html`

- [ ] **Step 6: Install frontend dependencies**

Run from repo root:
```bash
npm install --prefix frontend
```

Expected: `frontend/node_modules/` created.

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/tsconfig.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/index.html
git commit -m "chore: add frontend Vite + Vue + TS config"
```

---

## Task 5: Frontend — Vue app source files

**Files:**
- Create: `frontend/src/assets/global.css`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/App.vue`
- Create: `frontend/src/views/HomeView.vue`
- Create: `frontend/src/main.ts`

- [ ] **Step 1: Create `frontend/src/assets/global.css`**

```css
*, *::before, *::after {
  box-sizing: border-box;
}

* {
  margin: 0;
}

:root {
  --color-background: #ffffff;
  --color-text: #1a1a1a;
  --color-primary: #646cff;
  --color-primary-hover: #535bf2;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 2rem;
  --font-sans: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

Save to: `HackStoga2026/frontend/src/assets/global.css`

- [ ] **Step 2: Create `frontend/src/router/index.ts`**

```typescript
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
  ],
});

export default router;
```

Save to: `HackStoga2026/frontend/src/router/index.ts`

- [ ] **Step 3: Create `frontend/src/views/HomeView.vue`**

```vue
<script setup lang="ts">
</script>

<template>
  <main :class="$style.home">
    <h1 :class="$style.title">HackStoga 2026</h1>
    <p :class="$style.subtitle">Let's build something.</p>
  </main>
</template>

<style module>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: var(--spacing-md);
}

.title {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-primary);
}

.subtitle {
  font-size: 1.25rem;
  color: var(--color-text);
  opacity: 0.7;
}
</style>
```

Save to: `HackStoga2026/frontend/src/views/HomeView.vue`

- [ ] **Step 4: Create `frontend/src/App.vue`**

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <RouterView />
</template>
```

Save to: `HackStoga2026/frontend/src/App.vue`

- [ ] **Step 5: Create `frontend/src/main.ts`**

```typescript
import { createApp } from 'vue';
import './assets/global.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(router);
app.mount('#app');
```

Save to: `HackStoga2026/frontend/src/main.ts`

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: add Vue app with router, home view, and CSS Modules"
```

---

## Task 6: End-to-end smoke test

**Goal:** Verify the full stack runs together with `npm run dev` from the repo root.

- [ ] **Step 1: Run the full dev stack**

Run from repo root:
```bash
npm run dev
```

Expected: Two servers start concurrently:
- `VITE v5.x  ready in Xms  ➜  Local: http://localhost:5173/`
- `Backend running on http://localhost:3000`

- [ ] **Step 2: Verify frontend loads**

Open `http://localhost:5173` in a browser.
Expected: Page displays "HackStoga 2026" heading and "Let's build something." subtitle.

- [ ] **Step 3: Verify API proxy works**

Open browser DevTools → Console, run:
```javascript
fetch('/api/health').then(r => r.json()).then(console.log)
```
Expected: `{status: 'ok'}` logged in console (proxied to backend, no CORS error).

- [ ] **Step 4: Stop servers and update `.gitignore` to exclude all `node_modules` and `dist`**

Ensure `.gitignore` at repo root contains:
```
node_modules/
dist/
.env
.DS_Store
```

This single root `.gitignore` covers all subdirectory `node_modules/` and `dist/` folders via glob.

- [ ] **Step 5: Final commit**

```bash
git add .gitignore
git commit -m "chore: verify full stack smoke test passes"
```
