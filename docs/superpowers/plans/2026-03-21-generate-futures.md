# Generate Futures Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core pitch feature — a Pinia store connecting the git graph to the MAIN editor, with a Generate Futures button that produces mock branching continuations the user can preview and adopt.

**Architecture:** A Pinia store (`useProjectStore`) is the single source of truth for all commits and UI state. GitGraph and MainEditor both read from the store reactively. GenerateBar appends mock future commits after a 400ms delay. BranchViewer shows the selected future; ADOPT promotes it to active. All positioned absolutely in HomeView's canvas.

**Tech Stack:** Vue 3 + TypeScript, Pinia v2, Tiptap v2 (existing), interact.js (existing), Vite

**Note:** No test framework configured — manual browser verification used.

---

### Task 1: Install Pinia and register it

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/main.ts`

- [ ] **Step 1: Install Pinia**

```bash
cd frontend
npm install pinia@^2
```

Expected: `pinia` appears in `dependencies` in `package.json`.

- [ ] **Step 2: Register Pinia in main.ts**

Replace `frontend/src/main.ts` with:

```typescript
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './assets/global.css';
import App from './App.vue';
import router from './router';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/main.ts
git commit -m "feat: install and register pinia"
```

---

### Task 2: Create `useProjectStore`

**Files:**
- Create: `frontend/src/stores/useProjectStore.ts`

- [ ] **Step 1: Create the stores directory and file**

Create `frontend/src/stores/useProjectStore.ts`:

```typescript
import { defineStore } from 'pinia'

export type CommitType = 'commit' | 'current' | 'future'

export interface Commit {
  id: string
  label: string
  hash: string
  content: string
  type: CommitType
  parents: string[]
  lane: number
  column: number
}

const MOCK_POOL: Array<{ label: string; text: string }> = [
  {
    label: 'far, far away',
    text: 'Far, far away — the signal led him to the edge of the mapped universe, where the stars thinned to nothing.',
  },
  {
    label: 'right next door',
    text: "Right next door — the signal was coming from his neighbor's basement. The light under the door had been on for three days.",
  },
  {
    label: 'quite a bit away',
    text: 'Quite a bit away — three days through asteroid fields stood between Kael and the source. He packed light.',
  },
  {
    label: 'from the past',
    text: 'From the past — the timestamp read 400 years ago. Whatever sent it had been waiting a long time.',
  },
  {
    label: 'a warning',
    text: 'A warning — the same four words, repeating. DO NOT COME HERE.',
  },
  {
    label: 'an invitation',
    text: 'An invitation — just coordinates. Nothing else. Just coordinates and a single blinking cursor.',
  },
]

// Module-level index so repeated generate calls cycle through different pool entries
let poolIndex = 0

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const SEED_COMMITS: Commit[] = [
  {
    id: 'a',
    label: 'initial draft',
    hash: 'a1b2c3',
    type: 'commit',
    parents: [],
    lane: 0,
    column: 0,
    content: '<p>Once upon a time in a galaxy...</p>',
  },
  {
    id: 'b',
    label: 'expanded opening',
    hash: 'b4d5e6',
    type: 'commit',
    parents: ['a'],
    lane: 0,
    column: 1,
    content: '<p>Once upon a time in a galaxy, there lived a young inventor named Kael.</p>',
  },
  {
    id: 'c',
    label: 'added tension',
    hash: 'c7f8a9',
    type: 'current',
    parents: ['b'],
    lane: 0,
    column: 2,
    content:
      '<p>Once upon a time in a galaxy, there lived a young inventor named Kael. One morning, he discovered a signal no one else could hear.</p>',
  },
]

export const useProjectStore = defineStore('project', {
  state: () => ({
    commits: [...SEED_COMMITS] as Commit[],
    activeCommitId: 'c' as string,
    previewCommitId: null as string | null,
    isGenerating: false,
  }),

  getters: {
    activeCommit: (state): Commit =>
      state.commits.find(c => c.id === state.activeCommitId)!,

    previewCommit: (state): Commit | null =>
      state.previewCommitId
        ? (state.commits.find(c => c.id === state.previewCommitId) ?? null)
        : null,

    graphNodes: (state): Commit[] => state.commits,
  },

  actions: {
    setActive(id: string) {
      this.activeCommitId = id
      this.previewCommitId = null
    },

    setPreview(id: string) {
      this.previewCommitId = id
    },

    clearPreview() {
      this.previewCommitId = null
    },

    async generateFutures(count: number) {
      this.isGenerating = true
      await delay(400)

      const currentCommit = this.commits.find(c => c.type === 'current')!
      const maxLane = Math.max(...this.commits.map(c => c.lane))
      const newColumn = currentCommit.column + 1

      for (let i = 0; i < count; i++) {
        const poolItem = MOCK_POOL[poolIndex % MOCK_POOL.length]
        poolIndex++

        this.commits.push({
          id: `future-${Date.now()}-${i}`,
          label: poolItem.label,
          hash: Math.random().toString(16).slice(2, 8),
          type: 'future',
          parents: [currentCommit.id],
          lane: maxLane + 1 + i,
          column: newColumn,
          content: currentCommit.content + '<p>' + poolItem.text + '</p>',
        })
      }

      this.isGenerating = false
    },

    adoptPreview() {
      if (!this.previewCommitId) return
      const adoptedId = this.previewCommitId

      // Remove all futures except the adopted one
      this.commits = this.commits.filter(
        c => c.type !== 'future' || c.id === adoptedId,
      )

      // Demote old current → commit
      const oldCurrent = this.commits.find(c => c.type === 'current')
      if (oldCurrent) oldCurrent.type = 'commit'

      // Promote adopted → current
      const adopted = this.commits.find(c => c.id === adoptedId)
      if (adopted) adopted.type = 'current'

      this.activeCommitId = adoptedId
      this.previewCommitId = null
    },
  },
})
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/useProjectStore.ts
git commit -m "feat: add useProjectStore with seed data and mock generation"
```

---

### Task 3: Create `GenerateBar.vue`

**Files:**
- Create: `frontend/src/components/GenerateBar.vue`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/GenerateBar.vue`:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'

const store = useProjectStore()
const count = ref(3)

function decrement() {
  if (count.value > 1) count.value--
}
function increment() {
  if (count.value < 4) count.value++
}
</script>

<template>
  <div :class="$style.bar">
    <div :class="$style.counter">
      <button
        :class="$style.counterBtn"
        :disabled="count <= 1 || store.isGenerating"
        @click="decrement"
      >−</button>
      <span :class="$style.countDisplay">{{ count }}</span>
      <button
        :class="$style.counterBtn"
        :disabled="count >= 4 || store.isGenerating"
        @click="increment"
      >+</button>
    </div>

    <button
      :class="[$style.generateBtn, { [$style.generating]: store.isGenerating }]"
      :disabled="store.isGenerating"
      @click="store.generateFutures(count)"
    >
      <span :class="{ [$style.spin]: store.isGenerating }">◈</span>
      {{ store.isGenerating ? 'GENERATING…' : 'GENERATE' }}
    </button>
  </div>
</template>

<style module>
.bar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: 36px;
  padding: 0 var(--space-4);
  background: var(--color-bg-float);
  border-top: 1px solid var(--color-border);
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  font-family: var(--font-mono);
}

.counter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.counterBtn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  cursor: pointer;
  line-height: 1;
  transition: color var(--duration-fast), border-color var(--duration-fast);
}

.counterBtn:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-branch);
}

.counterBtn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.countDisplay {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text);
  min-width: 12px;
  text-align: center;
}

.generateBtn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-4);
  background: rgba(157, 217, 210, 0.08);
  border: 1px solid var(--color-branch);
  border-radius: var(--radius-sm);
  color: var(--color-branch);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background var(--duration-fast), opacity var(--duration-fast);
}

.generateBtn:hover:not(:disabled) {
  background: rgba(157, 217, 210, 0.15);
}

.generateBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.generating {
  opacity: 0.7;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  display: inline-block;
  animation: spin 1s linear infinite;
}
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/GenerateBar.vue
git commit -m "feat: add GenerateBar component"
```

---

### Task 4: Create `BranchViewer.vue`

**Files:**
- Create: `frontend/src/components/BranchViewer.vue`

BranchViewer is the Panel body content only — Panel wrapping and positioning is done in HomeView (same pattern as MainEditor).

- [ ] **Step 1: Create the component**

Create `frontend/src/components/BranchViewer.vue`:

```vue
<script setup lang="ts">
import { useProjectStore } from '../stores/useProjectStore'

const store = useProjectStore()
</script>

<template>
  <div :class="$style.root">
    <div
      :class="$style.content"
      v-html="store.previewCommit?.content"
    />
    <div :class="$style.footer" v-if="store.previewCommit">
      <span :class="$style.label">{{ store.previewCommit.label }}</span>
      <span :class="$style.hash">{{ store.previewCommit.hash }}</span>
      <button :class="$style.adoptBtn" @click="store.adoptPreview()">
        ADOPT
      </button>
    </div>
  </div>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: text;
}

.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-3);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text);
}

/* Reset global typography overrides */
.content :global(p) {
  max-width: none;
  margin: 0 0 var(--space-2);
}

.content :global(h1) {
  font-size: var(--text-xl);
  margin: var(--space-3) 0 var(--space-2);
}

.content :global(h2) {
  font-size: var(--text-lg);
  margin: var(--space-3) 0 var(--space-2);
}

.footer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-float);
  flex-shrink: 0;
}

.label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  flex: 1;
}

.hash {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-branch);
  background: rgba(157, 217, 210, 0.08);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(157, 217, 210, 0.2);
}

.adoptBtn {
  padding: var(--space-1) var(--space-3);
  background: rgba(254, 215, 102, 0.08);
  border: 1px solid var(--color-commit);
  border-radius: var(--radius-sm);
  color: var(--color-commit);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background var(--duration-fast);
}

.adoptBtn:hover {
  background: rgba(254, 215, 102, 0.15);
}
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/BranchViewer.vue
git commit -m "feat: add BranchViewer component"
```

---

### Task 5: Update `GitGraph.vue`

**Files:**
- Modify: `frontend/src/components/GitGraph.vue`

- [ ] **Step 1: Rewrite GitGraph.vue**

Replace the entire contents of `frontend/src/components/GitGraph.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { computeGraphLayout } from '../composables/useGraphLayout'
import { useProjectStore } from '../stores/useProjectStore'
import type { Commit } from '../stores/useProjectStore'

const store = useProjectStore()

// Placeholder node shown while generating — pulsing dot at next column
const displayNodes = computed((): Commit[] => {
  if (!store.isGenerating) return store.graphNodes
  const maxColumn = Math.max(...store.graphNodes.map(n => n.column))
  const current = store.graphNodes.find(n => n.type === 'current')!
  const placeholder: Commit = {
    id: '__generating__',
    label: '…',
    hash: '……',
    type: 'future',
    parents: [current.id],
    lane: Math.max(...store.graphNodes.map(n => n.lane)) + 1,
    column: maxColumn + 1,
    content: '',
  }
  return [...store.graphNodes, placeholder]
})

const layout = computed(() => computeGraphLayout(displayNodes.value))

const edges = computed(() => {
  const { positions } = layout.value
  const result: Array<{ id: string; d: string; type: Commit['type'] }> = []

  for (const node of displayNodes.value) {
    const to = positions.get(node.id)
    if (!to) continue
    for (const parentId of node.parents) {
      const from = positions.get(parentId)
      if (!from) continue
      const midX = (from.x + to.x) / 2
      result.push({
        id: `${parentId}-${node.id}`,
        d: `M ${from.x},${from.y} C ${midX},${from.y} ${midX},${to.y} ${to.x},${to.y}`,
        type: node.type,
      })
    }
  }
  return result
})

function hashChipRect(hash: string) {
  const w = hash.length * 5.5 + 8
  return { w, h: 13, dx: -w / 2 }
}

const NODE_R: Record<string, number> = { commit: 8, current: 10, future: 8 }

function handleNodeClick(node: Commit) {
  if (node.id === '__generating__') return
  if (node.type === 'future') {
    store.setPreview(node.id)
  } else {
    store.setActive(node.id)
  }
}
</script>

<template>
  <svg
    width="100%"
    height="100%"
    :viewBox="`0 0 ${layout.viewBoxWidth} ${layout.viewBoxHeight}`"
    preserveAspectRatio="xMinYMid meet"
    style="display: block; overflow: visible;"
  >
    <!-- Edges -->
    <g class="edges">
      <path
        v-for="edge in edges"
        :key="edge.id"
        :d="edge.d"
        fill="none"
        :stroke="edge.type === 'future' ? 'var(--color-branch)' : 'var(--color-commit)'"
        :stroke-opacity="edge.type === 'future' ? 0.4 : 0.6"
        stroke-width="1.5"
        :stroke-dasharray="edge.type === 'future' ? '6 4' : 'none'"
      />
    </g>

    <!-- Nodes -->
    <g
      v-for="node in displayNodes"
      :key="node.id"
      :style="node.type === 'current' ? 'filter: drop-shadow(0 0 6px var(--clr-mustard))' : ''"
      :opacity="node.type === 'future' ? 0.5 : 1"
      :class="{ 'generating-pulse': node.id === '__generating__' }"
      style="cursor: pointer"
      @click="handleNodeClick(node)"
    >
      <!-- Outer ring: current node (mustard) -->
      <circle
        v-if="node.type === 'current'"
        :cx="layout.positions.get(node.id)!.x"
        :cy="layout.positions.get(node.id)!.y"
        r="14"
        fill="none"
        stroke="var(--color-commit)"
        stroke-opacity="0.4"
        stroke-width="1.5"
      />

      <!-- Outer ring: previewed future node (aqua) -->
      <circle
        v-if="node.id === store.previewCommitId"
        :cx="layout.positions.get(node.id)!.x"
        :cy="layout.positions.get(node.id)!.y"
        r="14"
        fill="none"
        stroke="var(--color-branch)"
        stroke-opacity="0.6"
        stroke-width="1.5"
      />

      <!-- Main circle -->
      <circle
        :cx="layout.positions.get(node.id)!.x"
        :cy="layout.positions.get(node.id)!.y"
        :r="NODE_R[node.type]"
        :fill="node.type === 'future' ? 'var(--color-branch)' : 'var(--color-commit)'"
      />

      <!-- Hash chip: background -->
      <rect
        v-if="node.id !== '__generating__'"
        :x="layout.positions.get(node.id)!.x + hashChipRect(node.hash).dx"
        :y="layout.positions.get(node.id)!.y - 23"
        :width="hashChipRect(node.hash).w"
        :height="hashChipRect(node.hash).h"
        rx="3"
        :fill="node.type === 'future' ? 'rgba(157,217,210,0.12)' : 'rgba(254,215,102,0.1)'"
      />

      <!-- Hash chip: text -->
      <text
        v-if="node.id !== '__generating__'"
        :x="layout.positions.get(node.id)!.x"
        :y="layout.positions.get(node.id)!.y - 13"
        text-anchor="middle"
        font-family="Space Mono, monospace"
        font-size="9"
        :fill="node.type === 'future' ? 'var(--color-branch)' : 'var(--clr-mustard)'"
        letter-spacing="0.05em"
      >{{ node.hash }}</text>

      <!-- Label below node -->
      <text
        :x="layout.positions.get(node.id)!.x"
        :y="layout.positions.get(node.id)!.y + 22"
        text-anchor="middle"
        font-family="Space Mono, monospace"
        font-size="10"
        fill="var(--color-text-muted)"
      >{{ node.label }}</text>
    </g>
  </svg>
</template>

<style>
@keyframes generating-pulse {
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 0.6; }
}

.generating-pulse {
  animation: generating-pulse 600ms ease-in-out infinite;
}
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/GitGraph.vue
git commit -m "feat: connect GitGraph to store with click handlers and preview ring"
```

---

### Task 6: Update `MainEditor.vue`

**Files:**
- Modify: `frontend/src/components/MainEditor.vue`

The editor now gets its initial content from the store, and watches `activeCommitId` to reload content when the user clicks a past commit in the graph.

- [ ] **Step 1: Update MainEditor.vue**

Replace the entire `<script setup>` block in `frontend/src/components/MainEditor.vue`. The template and styles stay exactly the same — only the script changes.

Current script (lines 1–18):
```vue
<script setup lang="ts">
import { onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { useEditorPersistence } from '../composables/useEditorPersistence';

const { load, save, flush } = useEditorPersistence();

const editor = useEditor({
  content: load(),
  extensions: [StarterKit],
  onUpdate({ editor }) {
    save(editor.getHTML());
  },
});

onBeforeUnmount(() => {
  flush();
  editor.value?.destroy();
});
</script>
```

Replace with:
```vue
<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { useEditorPersistence } from '../composables/useEditorPersistence';
import { useProjectStore } from '../stores/useProjectStore';

const store = useProjectStore();
const { save, flush } = useEditorPersistence();

const editor = useEditor({
  content: store.activeCommit.content,
  extensions: [StarterKit],
  onUpdate({ editor }) {
    save(editor.getHTML());
  },
});

// When user clicks a past/current commit node, reload editor content
watch(
  () => store.activeCommitId,
  () => {
    if (editor.value) {
      editor.value.commands.setContent(store.activeCommit.content);
    }
  },
);

onBeforeUnmount(() => {
  flush();
  editor.value?.destroy();
});
</script>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/MainEditor.vue
git commit -m "feat: connect MainEditor to project store"
```

---

### Task 7: Wire everything into `HomeView.vue`

**Files:**
- Modify: `frontend/src/views/HomeView.vue`

- [ ] **Step 1: Update HomeView.vue**

Replace the entire file with:

```vue
<script setup lang="ts">
import { useProjectStore } from '../stores/useProjectStore';
import Taskbar from '../components/Taskbar.vue';
import Panel from '../components/Panel.vue';
import MainEditor from '../components/MainEditor.vue';
import GitGraph from '../components/GitGraph.vue';
import GenerateBar from '../components/GenerateBar.vue';
import BranchViewer from '../components/BranchViewer.vue';

const store = useProjectStore();
</script>

<template>
  <div :class="$style.workspace">
    <Taskbar />
    <div :class="$style.canvas">

      <!-- MAIN editor panel -->
      <Panel title="MAIN" accent="commit" :x="20" :y="20" :width="260" :height="580">
        <template #badge><span class="hash">doc</span></template>
        <MainEditor />
      </Panel>

      <!-- Git graph panel -->
      <Panel title="GIT NODES" accent="branch" :x="300" :y="20" :width="720" :height="220">
        <template #badge><span class="badge badge--branch">LIVE</span></template>
        <GitGraph />
      </Panel>

      <!-- Generate bar: docked flush below GIT NODES -->
      <div :class="$style.generateBarWrap">
        <GenerateBar />
      </div>

      <!-- Branch viewer: shown when a future node is selected -->
      <Panel
        v-if="store.previewCommitId"
        title="BRANCH ◈ VIEWER"
        accent="branch"
        :x="300"
        :y="280"
        :width="460"
        :height="320"
      >
        <template #badge>
          <button :class="$style.closeBtn" @click="store.clearPreview()">×</button>
        </template>
        <BranchViewer />
      </Panel>

    </div>
  </div>
</template>

<style module>
.workspace {
  min-height: 100dvh;
  background: var(--color-bg);
}

.canvas {
  position: relative;
  height: calc(100dvh - 48px);
  margin-top: 48px;
  overflow: hidden;
}

/* Positioned flush below GIT NODES panel (y:20 + h:220 + 5px border gap = 245) */
.generateBarWrap {
  position: absolute;
  left: 300px;
  top: 245px;
  width: 720px;
}

.closeBtn {
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: var(--text-base);
  cursor: pointer;
  padding: 0 var(--space-1);
  line-height: 1;
  transition: color var(--duration-fast);
}

.closeBtn:hover {
  color: var(--color-text);
}
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Build to confirm no bundler errors**

```bash
npm run build
```

Expected: Build succeeds, no errors.

- [ ] **Step 4: Manual browser verification**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- [ ] MAIN panel shows the seed story text ("Once upon a time...")
- [ ] GIT NODES shows 3 commit nodes (a, b, c) with c highlighted as current
- [ ] GenerateBar appears below GIT NODES with `−`, `3`, `+`, `◈ GENERATE`
- [ ] Counter increments/decrements between 1 and 4
- [ ] Clicking GENERATE shows spinner briefly (~400ms), then 3 future nodes appear on the graph
- [ ] Clicking a future node opens the BRANCH ◈ VIEWER panel with the continuation text
- [ ] Clicking a different future node switches the viewer content
- [ ] `×` button closes the viewer
- [ ] Clicking ADOPT: viewer closes, adopted branch becomes current in graph, MAIN editor updates with continuation
- [ ] Clicking a past commit node loads that commit's text into MAIN
- [ ] Panels can still be dragged and resized
- [ ] No console errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/HomeView.vue
git commit -m "feat: wire generate futures — store, graph, viewer, generate bar"
```
