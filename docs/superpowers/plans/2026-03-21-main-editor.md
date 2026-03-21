# MAIN Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the NOTES panel placeholder with a Tiptap WYSIWYG rich text editor that auto-saves to localStorage.

**Architecture:** A new `useEditorPersistence` composable handles localStorage load/save with a hand-rolled debounce. A new `MainEditor.vue` component initializes Tiptap with StarterKit, renders a minimal toolbar (Bold/Italic/H1/H2/Bullets), and fills the Panel's resizable body. HomeView.vue wires it in and renames the panel.

**Tech Stack:** Vue 3 + TypeScript, Tiptap v2 (`@tiptap/vue-3`, `@tiptap/starter-kit`), Vite, interact.js (existing)

**Note:** No test framework is configured in this project. TDD steps are omitted; manual browser verification is used instead.

---

### Task 1: Install Tiptap dependencies

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json` (auto-updated)

- [ ] **Step 1: Install packages**

```bash
cd frontend
npm install @tiptap/vue-3@^2 @tiptap/starter-kit@^2
```

Expected: Both packages appear under `dependencies` in `package.json`. No errors.

- [ ] **Step 2: Verify install**

```bash
ls node_modules/@tiptap/vue-3 && ls node_modules/@tiptap/starter-kit
```

Expected: Both directories exist.

- [ ] **Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: add tiptap v2 dependencies"
```

---

### Task 2: Create `useEditorPersistence` composable

**Files:**
- Create: `frontend/src/composables/useEditorPersistence.ts`

- [ ] **Step 1: Create the composables directory and file**

Create `frontend/src/composables/useEditorPersistence.ts` with this exact content:

```typescript
const STORAGE_KEY = 'main-editor-content';

export function useEditorPersistence() {
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let pendingHtml: string | null = null;

  function load(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  function save(html: string): void {
    pendingHtml = html;
    if (timerId !== null) clearTimeout(timerId);
    timerId = setTimeout(() => {
      timerId = null;
      const toWrite = pendingHtml;
      pendingHtml = null;
      if (toWrite === null) return;
      try {
        localStorage.setItem(STORAGE_KEY, toWrite);
      } catch {
        // Silently ignore SecurityError / QuotaExceededError
      }
    }, 500);
  }

  function flush(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
    if (pendingHtml !== null) {
      try {
        localStorage.setItem(STORAGE_KEY, pendingHtml);
      } catch {
        // Silently ignore
      }
      pendingHtml = null;
    }
  }

  return { load, save, flush };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/composables/useEditorPersistence.ts
git commit -m "feat: add useEditorPersistence composable"
```

---

### Task 3: Create `MainEditor.vue` component

**Files:**
- Create: `frontend/src/components/MainEditor.vue`

- [ ] **Step 1: Create the component**

Create `frontend/src/components/MainEditor.vue` with this exact content:

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

<template>
  <div :class="$style.root">
    <div v-if="editor" :class="$style.toolbar">
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('bold') }]"
        @mousedown.prevent="editor.chain().focus().toggleBold().run()"
        title="Bold"
      >B</button>
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('italic') }]"
        @mousedown.prevent="editor.chain().focus().toggleItalic().run()"
        title="Italic"
      ><em>I</em></button>
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('heading', { level: 1 }) }]"
        @mousedown.prevent="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        title="Heading 1"
      >H1</button>
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('heading', { level: 2 }) }]"
        @mousedown.prevent="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        title="Heading 2"
      >H2</button>
      <button
        :class="[$style.btn, { [$style.active]: editor.isActive('bulletList') }]"
        @mousedown.prevent="editor.chain().focus().toggleBulletList().run()"
        title="Bullet list"
      >&#8226;&#8212;</button>
    </div>
    <EditorContent :editor="editor" :class="$style.editorWrap" />
  </div>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: text;
}

.toolbar {
  display: flex;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-2);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-float);
  flex-shrink: 0;
}

.btn {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  line-height: 1;
  transition: color var(--duration-base), border-color var(--duration-base),
              background var(--duration-base);
}

.btn:hover {
  color: var(--color-text);
  border-color: var(--color-border);
}

.active {
  color: var(--color-commit);
  border-color: var(--color-commit);
  background: rgba(254, 215, 102, 0.08);
}

.editorWrap {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  cursor: text;
}

/* Make the ProseMirror div fill the wrapper and be focusable */
.editorWrap :global(.ProseMirror) {
  height: 100%;
  padding: var(--space-3) var(--space-3);
  outline: none;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text);
}

/* Reset global typography overrides that break the editor */
.editorWrap :global(p) {
  max-width: none;
  margin: 0 0 var(--space-2);
}

.editorWrap :global(h1) {
  font-size: var(--text-xl);
  margin: var(--space-3) 0 var(--space-2);
}

.editorWrap :global(h2) {
  font-size: var(--text-lg);
  margin: var(--space-3) 0 var(--space-2);
}

.editorWrap :global(ul) {
  padding-left: var(--space-5);
  margin: 0 0 var(--space-2);
}

.editorWrap :global(li) {
  margin-bottom: var(--space-1);
}

/* Placeholder text when editor is empty */
.editorWrap :global(.ProseMirror p.is-editor-empty:first-child::before) {
  content: 'Start writing…';
  color: var(--color-text-muted);
  pointer-events: none;
  float: left;
  height: 0;
}
</style>
```

**Key details:**
- Toolbar buttons use `@mousedown.prevent` (not `@click`) so the editor doesn't lose focus when clicking toolbar
- `EditorContent` is Tiptap's Vue component that renders the ProseMirror DOM
- CSS module scoping: global ProseMirror styles are injected with `:global()` inside the module scope
- `useEditor` returns a `ShallowRef<Editor | undefined>` — check `editor.value` guards against the brief undefined state

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Open the browser. The NOTES panel should still show (HomeView not updated yet). No console errors.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/MainEditor.vue
git commit -m "feat: add MainEditor component with Tiptap and toolbar"
```

---

### Task 4: Wire MainEditor into HomeView

**Files:**
- Modify: `frontend/src/views/HomeView.vue`

- [ ] **Step 1: Update HomeView.vue**

Replace the NOTES panel block in `frontend/src/views/HomeView.vue`. The file currently reads:

```vue
<script setup lang="ts">
import Taskbar from '../components/Taskbar.vue';
import Panel from '../components/Panel.vue';
</script>

<template>
  <div :class="$style.workspace">
    <Taskbar />
    <div :class="$style.canvas">

      <Panel title="NOTES" accent="commit" :x="20" :y="20" :width="260" :height="580">
        <template #badge><span class="hash">doc</span></template>
        <p class="text-muted text-sm">Doc / notes panel</p>
      </Panel>

      <Panel title="GIT NODES" accent="branch" :x="300" :y="20" :width="720" :height="220">
        <template #badge><span class="badge badge--branch">LIVE</span></template>
        <p class="text-muted text-sm">Git graph visualization</p>
      </Panel>

    </div>
  </div>
</template>
```

Replace with:

```vue
<script setup lang="ts">
import Taskbar from '../components/Taskbar.vue';
import Panel from '../components/Panel.vue';
import MainEditor from '../components/MainEditor.vue';
</script>

<template>
  <div :class="$style.workspace">
    <Taskbar />
    <div :class="$style.canvas">

      <Panel title="MAIN" accent="commit" :x="20" :y="20" :width="260" :height="580">
        <template #badge><span class="hash">doc</span></template>
        <MainEditor />
      </Panel>

      <Panel title="GIT NODES" accent="branch" :x="300" :y="20" :width="720" :height="220">
        <template #badge><span class="badge badge--branch">LIVE</span></template>
        <p class="text-muted text-sm">Git graph visualization</p>
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
</style>
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx vue-tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Manual browser verification**

```bash
npm run dev
```

Open `http://localhost:5173`. Verify:
- [ ] Panel title reads "MAIN" (not "NOTES")
- [ ] Toolbar shows B / I / H1 / H2 / bullet buttons
- [ ] Clicking in the editor and typing works
- [ ] Bold/Italic/H1/H2/bullet buttons activate (highlight in mustard) when toggled
- [ ] Heading text renders at readable size (not 64px/48px)
- [ ] Paragraph text is not capped at ~65 characters wide when panel is wide
- [ ] Typing and then refreshing the page restores the content
- [ ] Panel can still be dragged and resized normally
- [ ] No console errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/HomeView.vue
git commit -m "feat: wire MainEditor into MAIN panel, rename from NOTES"
```
