# Generate Futures — Design Spec
**Date:** 2026-03-21
**Status:** Approved

## Summary

Add the core pitch feature: a Pinia-backed project state that connects the MAIN editor and GitGraph panel, plus a "Generate Futures" UX that appends mock future commit branches to the graph. Clicking a future node opens a read-only Branch Viewer panel. Adopting a branch promotes it to the active commit and loads it into MAIN.

## Architecture

### New files
- `frontend/src/stores/useProjectStore.ts` — Pinia store; single source of truth for all commits and UI state
- `frontend/src/components/GenerateBar.vue` — counter + Generate button, docked below GIT NODES panel
- `frontend/src/components/BranchViewer.vue` — read-only panel showing a previewed future commit

### Modified files
- `frontend/src/components/GitGraph.vue` — reads nodes from store instead of hardcoded MOCK_NODES; handles node click
- `frontend/src/components/MainEditor.vue` — reads initial content from store; watches `activeCommitId` to update editor
- `frontend/src/views/HomeView.vue` — adds GenerateBar below GIT NODES, adds BranchViewer panel (conditionally rendered)
- `frontend/src/main.ts` — registers Pinia

### Unchanged
- `frontend/src/components/Panel.vue`
- `frontend/src/composables/useEditorPersistence.ts`
- `frontend/src/composables/useGraphLayout.ts` — `Commit` is structurally identical to `GraphNode` (same fields); TypeScript's structural typing means `Commit[]` satisfies `GraphNode[]` without any changes to this file

## Dependencies

Add to `frontend/package.json`:
- `pinia@^2`

Register Pinia in `frontend/src/main.ts` via `app.use(createPinia())`.

## Data Model

```typescript
type CommitType = 'commit' | 'current' | 'future'

interface Commit {
  id: string
  label: string
  hash: string
  content: string        // HTML string
  type: CommitType
  parents: string[]
  lane: number
  column: number
}
```

`Commit` has the same fields as `GraphNode` from `useGraphLayout.ts`. `useGraphLayout.ts` is unchanged — `Commit[]` is structurally compatible with `GraphNode[]` in TypeScript. `GraphNode` remains exported and used as the parameter type for `computeGraphLayout`; `GitGraph.vue` passes `store.graphNodes` (typed as `Commit[]`) which satisfies `GraphNode[]` structurally.

## Store: `useProjectStore`

```typescript
state: {
  commits: Commit[]        // all commits including future
  activeCommitId: string   // loaded in MAIN
  previewCommitId: string | null  // loaded in BranchViewer; null = viewer hidden
  isGenerating: boolean
}

getters:
  activeCommit: Commit       // commits.find(activeCommitId)
  previewCommit: Commit | null
  graphNodes: Commit[]       // all commits (alias for GitGraph consumption)

actions:
  setActive(id: string)      // sets activeCommitId, clears previewCommitId
  setPreview(id: string)     // sets previewCommitId
  clearPreview()             // sets previewCommitId = null
  generateFutures(count: number): Promise<void>
  adoptPreview()             // promotes previewCommit to current, old current → 'commit', removes all other future commits from the store, sets activeCommitId, clears previewCommitId
```

### `generateFutures(count)` logic

1. Sets `isGenerating = true`
2. Awaits 400ms (`setTimeout` wrapped in Promise)
3. Picks `count` items from the mock pool (cycling with an index offset to vary repeated calls)
4. Computes `column` and `lane` for new nodes:
   - All new futures branch from the current commit's column + 1
   - Each new future gets its own lane (starting from `maxLane + 1` for the first, incrementing)
5. Appends new `Commit` objects with `type: 'future'` to `commits`
6. Sets `isGenerating = false`

### Mock content pool (6 entries, cycling)

All continuations are full `<p>` tags appended to the current commit's content:

```
1. "Far, far away — the signal led him to the edge of the mapped universe, where the stars thinned to nothing."
2. "Right next door — the signal was coming from his neighbor's basement. The light under the door had been on for three days."
3. "Quite a bit away — three days through asteroid fields stood between Kael and the source. He packed light."
4. "From the past — the timestamp read 400 years ago. Whatever sent it had been waiting a long time."
5. "A warning — the same four words, repeating. DO NOT COME HERE."
6. "An invitation — just coordinates. Nothing else. Just coordinates and a single blinking cursor."
```

Each future commit's `content` = `activeCommit.content + '<p>' + pool[i] + '</p>'`

Each future commit's `label` = short version of the continuation (e.g. "far, far away", "right next door")

Each future commit's `hash` = 6-char pseudo-random hex string generated at runtime (`Math.random().toString(16).slice(2, 8)`)

### Seed data (initial store state)

```
commits: [
  { id:'a', label:'initial draft',   hash:'a1b2c3', type:'commit',  parents:[],    lane:0, column:0,
    content: '<p>Once upon a time in a galaxy...</p>' },
  { id:'b', label:'expanded opening', hash:'b4d5e6', type:'commit',  parents:['a'], lane:0, column:1,
    content: '<p>Once upon a time in a galaxy, there lived a young inventor named Kael.</p>' },
  { id:'c', label:'added tension',    hash:'c7f8a9', type:'current', parents:['b'], lane:0, column:2,
    content: '<p>Once upon a time in a galaxy, there lived a young inventor named Kael. One morning, he discovered a signal no one else could hear.</p>' },
]
activeCommitId: 'c'
previewCommitId: null
isGenerating: false
```

## Components

### `MainEditor.vue` changes

MAIN editor must read from the store instead of `useEditorPersistence`. On mount, initialize Tiptap `content` from `store.activeCommit.content`. When `activeCommitId` changes (user clicks a past/current node), update editor content via `editor.commands.setContent(newContent)`. On `onUpdate`, still save to `localStorage` as before (so content survives refresh during active session), but the store is the primary source on mount.

**Important:** `useEditorPersistence.load()` is no longer used as the Tiptap initial content source — instead `store.activeCommit.content` is used. `useEditorPersistence` is kept for autosave only.

### `GitGraph.vue` changes

- Replace `MOCK_NODES` with `store.graphNodes`
- Add `@click` handler on each node group:
  - `future` node → `store.setPreview(node.id)`
  - `commit` or `current` node → `store.setActive(node.id)`
- Add preview ring: nodes where `node.id === store.previewCommitId` get the same outer ring as `current` nodes, but using `--color-branch` stroke
- Generating animation: while `store.isGenerating`, show a pulsing placeholder node at `column = maxColumn + 1`, `lane = 0` with `opacity` cycling 0.2–0.6

### `GenerateBar.vue`

Thin bar component rendered below the GIT NODES Panel in HomeView (not inside the Panel slot — sits as a separate sibling element, visually flush).

```
[ − ]  [ 3 ]  [ + ]     [ ◈ GENERATE ]
```

- Counter: integer, clamped 1–4, defaults to 3
- `GENERATE` button: calls `store.generateFutures(count)`; disabled + shows spinner (`◈` rotating) while `store.isGenerating`
- Styling: `--color-bg-float` background, top border `--color-border`, `--color-branch` accent on GENERATE button

### `BranchViewer.vue`

Rendered as a `<Panel title="BRANCH ◈ VIEWER" accent="branch">` in HomeView, only when `store.previewCommitId !== null`.

Content:
- `v-html` rendering of `store.previewCommit.content` (read-only, no Tiptap)
- Scoped CSS resets same as MainEditor (p max-width, h1/h2 sizes)
- Bottom bar with: commit label, hash chip, and `[ ADOPT ]` button
- `ADOPT` calls `store.adoptPreview()`
- A close `×` button in the panel badge slot calls `store.clearPreview()`

### `HomeView.vue` changes

- Initial position/size: MAIN at `x:20, y:20, w:260, h:580` (unchanged)
- GIT NODES at `x:300, y:20, w:720, h:220` (unchanged)
- GenerateBar rendered directly below GIT NODES panel — absolutely positioned at `x:300, y:245` (just below GIT NODES bottom edge), `w:720`
- BranchViewer Panel rendered at `x:300, y:280, w:460, h:320` when `previewCommitId !== null`; `v-if="store.previewCommitId"`

## Data Flow

1. App loads → store initializes with seed → MAIN loads `store.activeCommit.content` → GitGraph renders 3 seed nodes
2. User clicks `GENERATE` (count = 3) → `isGenerating = true` → 400ms → 3 future nodes appended → `isGenerating = false` → GitGraph re-renders reactively
3. User clicks future node → `previewCommitId` set → BranchViewer panel appears with that commit's content
4. User clicks a different future node → `previewCommitId` swaps → BranchViewer updates
5. User clicks `ADOPT` → `adoptPreview()`: all other `future` commits removed from store, adopted future becomes `current`, old `current` becomes `commit`, `activeCommitId` updated, MAIN content updates, `previewCommitId` cleared, BranchViewer closes
6. User clicks a past commit node → `setActive(id)` → MAIN loads that commit's content

## Styling

- GenerateBar: `height: 36px`, `background: var(--color-bg-float)`, `border-top: 1px solid var(--color-border)`, monospace font
- Generate button accent: `--color-branch` (aqua) — forward-looking action
- BranchViewer ADOPT button: `--color-commit` (mustard) — confirming/accepting action
- Future node preview ring: `stroke: var(--color-branch)`, `stroke-opacity: 0.6`
- Generating placeholder node: `opacity` keyframe animation 0.2 ↔ 0.6, 600ms ease-in-out infinite

## Constraints

- `generateFutures` uses a module-level `let poolIndex = 0` that increments by `count` each call, so repeated generates cycle through different continuations
- `adoptPreview` must: (1) remove all `future` commits except the one being adopted, (2) set old `current` to `'commit'`, (3) set adopted commit to `'current'`, (4) set `activeCommitId`, (5) clear `previewCommitId`
- GitGraph must handle `store.graphNodes` being reactive (use `computed` or direct store access, not a local copy)
- BranchViewer `v-html` needs same CSS resets as MainEditor: `p { max-width: none }`, `h1/h2` font-size overrides
- GenerateBar is positioned absolutely in HomeView's canvas, not slotted into the GIT NODES Panel — this keeps Panel.vue unchanged
