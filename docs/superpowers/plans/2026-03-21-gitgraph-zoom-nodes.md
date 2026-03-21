# GitGraph — Zoom/Pan & Geometric Nodes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mouse-wheel/drag zoom-pan with zoom buttons and auto-fit to the GitGraph SVG panel, and replace plain circles with hexagon (past), diamond (current), and circle (future) node shapes.

**Architecture:** All changes are in a single Vue SFC (`GitGraph.vue`). The SVG gets a new root `<div>` wrapper, an imperative `viewBox` string driven by `panX`/`panY`/`zoom` refs, and pointer/wheel event handlers. Node shapes are rendered via SVG `<polygon>`, `<rect rotate>`, and `<circle>` elements keyed by `node.type`.

**Tech Stack:** Vue 3 Composition API (`<script setup>`), SVG, CSS Modules, CSS animations, `ResizeObserver` (browser built-in).

**Dev server:** Run `npm run dev` from `HackStoga2026/` root. App runs on `http://localhost:5173`. The GitGraph is visible on the home route (`/`).

---

## File Map

| Action | File |
|--------|------|
| Modify | `frontend/src/components/GitGraph.vue` |

No other files change.

---

### Task 1: Add root wrapper `<div>` and template refs

**Files:**
- Modify: `frontend/src/components/GitGraph.vue`

Currently the component's template root is a bare `<svg>`. We wrap it in a `<div>` so the controls overlay can be positioned absolutely inside it, and add `ref` attributes for both elements.

- [ ] **Step 1: Open `GitGraph.vue` and locate the template**

  File: `frontend/src/components/GitGraph.vue`
  The template currently starts with:
  ```html
  <svg
    width="100%"
    height="100%"
    :viewBox="`0 0 ${layout.viewBoxWidth} ${layout.viewBoxHeight}`"
    preserveAspectRatio="xMinYMid meet"
    style="display: block; overflow: visible;"
  >
  ```

- [ ] **Step 2: Replace the `<svg>` opening tag and wrap in a `<div>`**

  Replace the current template root so it becomes:
  ```html
  <div ref="wrapEl" :class="[$style.graphWrap, ready && $style.ready]">
    <svg
      ref="svgEl"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      :viewBox="viewBoxStr"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
      style="display: block; overflow: visible;"
    >
      <!-- existing edges and nodes go here unchanged -->
    </svg>
  </div>
  ```

  Key changes:
  - New root `<div ref="wrapEl">` with CSS module classes
  - `preserveAspectRatio="none"` (was `"xMinYMid meet"`)
  - `:viewBox="viewBoxStr"` (was a computed string — we'll drive it imperatively)
  - Pointer event handlers on the `<svg>`
  - Keep `style="display: block; overflow: visible;"` on the `<svg>`

- [ ] **Step 3: Add template refs and state to `<script setup>`**

  Add at the top of `<script setup>` (after existing imports):
  ```ts
  import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

  const wrapEl = ref<HTMLDivElement | null>(null)
  const svgEl  = ref<SVGSVGElement  | null>(null)
  const ready  = ref(false)

  const panX       = ref(0)
  const panY       = ref(0)
  const zoom       = ref(1)
  const viewBoxStr = ref('0 0 1 1')

  let isDragging = false
  let lastX      = 0
  let lastY      = 0
  let resizeObs: ResizeObserver | undefined
  ```

  > Note: `ref`, `computed`, `watch`, `onMounted`, `onUnmounted`, `nextTick` may already be partially imported — merge with existing imports rather than duplicating.

- [ ] **Step 4: Add `.graphWrap` and `.ready` to the CSS module block**

  In `<style>` at the bottom of the file, add to the existing `<style>` block (or create `<style module>` if none exists):
  ```css
  .graphWrap {
    position: relative;
    width: 100%;
    height: 100%;
    visibility: hidden;
  }

  .graphWrap.ready {
    visibility: visible;
  }
  ```

- [ ] **Step 5: Start the dev server and verify no crash**

  ```bash
  cd HackStoga2026
  npm run dev
  ```

  Open `http://localhost:5173`. The GitGraph panel should be blank (hidden, `ready` is still `false`) but the page should not throw any errors in the browser console. If there are TypeScript errors, fix them before continuing.

- [ ] **Step 6: Commit**

  ```bash
  git -C HackStoga2026 add frontend/src/components/GitGraph.vue
  git -C HackStoga2026 commit -m "refactor: wrap GitGraph svg in div, add template refs and viewBox state"
  ```

---

### Task 2: Add `recomputeViewBox` and `onMounted` setup

**Files:**
- Modify: `frontend/src/components/GitGraph.vue`

Wire up the viewBox computation, ResizeObserver, and wheel listener. After this task, the graph will be visible and the viewBox will update correctly on resize.

- [ ] **Step 1: Add `recomputeViewBox` function**

  Add to `<script setup>`:
  ```ts
  function recomputeViewBox() {
    if (!svgEl.value) return
    const { width, height } = svgEl.value.getBoundingClientRect()
    viewBoxStr.value =
      `${panX.value} ${panY.value} ${width / zoom.value} ${height / zoom.value}`
  }
  ```

- [ ] **Step 2: Add `autoFit` function**

  Add to `<script setup>` (this references `layout` which already exists as a computed):
  ```ts
  function autoFit() {
    if (!svgEl.value) return
    const positions = [...layout.value.positions.values()]
    if (positions.length === 0) return

    const PAD      = 60
    const minX     = Math.min(...positions.map(p => p.x)) - PAD
    const minY     = Math.min(...positions.map(p => p.y)) - PAD
    const maxX     = Math.max(...positions.map(p => p.x)) + PAD
    const maxY     = Math.max(...positions.map(p => p.y)) + PAD
    const contentW = maxX - minX
    const contentH = maxY - minY

    const { width, height } = svgEl.value.getBoundingClientRect()
    const fitZoom = Math.min(5, Math.max(0.1, Math.min(width / contentW, height / contentH)))

    panX.value = minX - (width  / fitZoom - contentW) / 2
    panY.value = minY - (height / fitZoom - contentH) / 2
    zoom.value = fitZoom   // must be set before recomputeViewBox

    recomputeViewBox()
    ready.value = true
  }
  ```

- [ ] **Step 3: Add `onWheel` handler**

  ```ts
  function onWheel(event: WheelEvent) {
    event.preventDefault()
    const rect    = svgEl.value!.getBoundingClientRect()
    const mouseX  = event.clientX - rect.left
    const mouseY  = event.clientY - rect.top
    const delta   = event.deltaY < 0 ? 1.2 : 1 / 1.2
    const newZoom = Math.min(5, Math.max(0.1, zoom.value * delta))

    panX.value += mouseX * (1 / zoom.value - 1 / newZoom)
    panY.value += mouseY * (1 / zoom.value - 1 / newZoom)
    zoom.value  = newZoom
    recomputeViewBox()
  }
  ```

- [ ] **Step 4: Add `onMounted` / `onUnmounted`**

  ```ts
  onMounted(() => {
    svgEl.value!.addEventListener('wheel', onWheel, { passive: false })
    resizeObs = new ResizeObserver(() => recomputeViewBox())
    resizeObs.observe(wrapEl.value!)
    nextTick(autoFit)
  })

  onUnmounted(() => {
    svgEl.value?.removeEventListener('wheel', onWheel)
    resizeObs?.disconnect()
    isDragging = false
  })
  ```

- [ ] **Step 5: Add `displayNodes` watcher**

  `displayNodes` is already defined in `GitGraph.vue` as a `computed`. Add:
  ```ts
  watch(displayNodes, () => nextTick(autoFit), { immediate: false })
  ```

- [ ] **Step 6: Verify in browser**

  Reload `http://localhost:5173`. The GitGraph panel should now show nodes (the `ready` class is applied after `autoFit` runs). The graph should be centered and fit within the panel. Mouse wheel over the graph should zoom in/out. Check the browser console for errors.

- [ ] **Step 7: Commit**

  ```bash
  git -C HackStoga2026 add frontend/src/components/GitGraph.vue
  git -C HackStoga2026 commit -m "feat: add viewBox zoom/pan and auto-fit to GitGraph"
  ```

---

### Task 3: Add drag-to-pan handlers

**Files:**
- Modify: `frontend/src/components/GitGraph.vue`

The pointer event handlers (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`) are already wired in the template from Task 1. Now implement them.

- [ ] **Step 1: Add pointer handler functions**

  ```ts
  function onPointerDown(e: PointerEvent) {
    isDragging = true
    lastX = e.clientX
    lastY = e.clientY
    svgEl.value?.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return
    panX.value -= (e.clientX - lastX) / zoom.value
    panY.value -= (e.clientY - lastY) / zoom.value
    lastX = e.clientX
    lastY = e.clientY
    recomputeViewBox()
  }

  function onPointerUp(e: PointerEvent) {
    isDragging = false
    svgEl.value?.releasePointerCapture(e.pointerId)
  }

  function onPointerCancel(_e: PointerEvent) {
    isDragging = false
  }
  ```

- [ ] **Step 2: Verify in browser**

  Reload `http://localhost:5173`. Click and drag inside the GitGraph panel — nodes should pan with the mouse. Release should stop panning. Drag to a point where nodes are off-screen, then mouse-wheel to zoom back out.

- [ ] **Step 3: Commit**

  ```bash
  git -C HackStoga2026 add frontend/src/components/GitGraph.vue
  git -C HackStoga2026 commit -m "feat: add drag-to-pan to GitGraph"
  ```

---

### Task 4: Add zoom buttons and controls overlay

**Files:**
- Modify: `frontend/src/components/GitGraph.vue`

Add the `+`, `−`, and `⊡` (fit) buttons as an absolutely-positioned overlay.

- [ ] **Step 1: Add `zoomIn`, `zoomOut`, `zoomToward` functions**

  ```ts
  function zoomToward(newZoom: number) {
    newZoom = Math.min(5, Math.max(0.1, newZoom))
    if (!svgEl.value) return
    const { width, height } = svgEl.value.getBoundingClientRect()
    panX.value += (width  / 2) * (1 / zoom.value - 1 / newZoom)
    panY.value += (height / 2) * (1 / zoom.value - 1 / newZoom)
    zoom.value  = newZoom
    recomputeViewBox()
  }

  function zoomIn()  { zoomToward(zoom.value * 1.2) }
  function zoomOut() { zoomToward(zoom.value / 1.2) }
  ```

- [ ] **Step 2: Add controls overlay to the template**

  Inside the root `<div>` wrapper (after the closing `</svg>` tag), add:
  ```html
  <div :class="$style.controls">
    <button @click="zoomIn">+</button>
    <button @click="zoomOut">−</button>
    <button @click="autoFit">⊡</button>
  </div>
  ```

- [ ] **Step 3: Add `.controls` CSS to the style block**

  ```css
  .controls {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .controls button {
    background: var(--color-bg-raised);
    border: 1px solid var(--color-border-mid);
    color: var(--color-branch);
    font-family: var(--font-mono);
    font-size: 14px;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
  }

  .controls button:hover {
    border-color: var(--color-branch);
    box-shadow: var(--glow-branch);
  }
  ```

- [ ] **Step 4: Verify in browser**

  Reload. The three buttons (`+`, `−`, `⊡`) should appear in the top-right corner of the graph panel. Clicking `+` zooms in toward center, `−` zooms out, `⊡` fits all nodes back into view.

- [ ] **Step 5: Commit**

  ```bash
  git -C HackStoga2026 add frontend/src/components/GitGraph.vue
  git -C HackStoga2026 commit -m "feat: add zoom buttons overlay to GitGraph"
  ```

---

### Task 5: Replace node shapes — hexagon, diamond, circle

**Files:**
- Modify: `frontend/src/components/GitGraph.vue`

This task replaces the plain `<circle>` nodes with geometric shapes keyed by `node.type`. The existing `NODE_R` object stays unchanged. All other node elements (hash chip rect/text, label text, rings) stay in place.

- [ ] **Step 1: Add the `hexPoints` helper function**

  Add to `<script setup>`:
  ```ts
  function hexPoints(cx: number, cy: number, r: number): string {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')
  }
  ```

- [ ] **Step 2: Locate the "Main circle" comment in the template**

  In the template, find the block that looks like:
  ```html
  <!-- Main circle -->
  <circle
    :cx="layout.positions.get(node.id)!.x"
    :cy="layout.positions.get(node.id)!.y"
    :r="NODE_R[node.type]"
    :fill="node.type === 'future' ? 'var(--color-branch)' : 'var(--color-commit)'"
  />
  ```

- [ ] **Step 3: Replace the main circle with type-keyed shapes**

  Replace the `<!-- Main circle -->` block with:
  ```html
  <!-- Main shape: hexagon (commit), diamond (current), circle (future) -->
  <polygon
    v-if="node.type === 'commit'"
    :points="hexPoints(layout.positions.get(node.id)!.x, layout.positions.get(node.id)!.y, NODE_R['commit'])"
    fill="var(--color-commit)"
  />
  <rect
    v-else-if="node.type === 'current'"
    :x="layout.positions.get(node.id)!.x - NODE_R['current'] * Math.SQRT2 / 2"
    :y="layout.positions.get(node.id)!.y - NODE_R['current'] * Math.SQRT2 / 2"
    :width="NODE_R['current'] * Math.SQRT2"
    :height="NODE_R['current'] * Math.SQRT2"
    :transform="`rotate(45, ${layout.positions.get(node.id)!.x}, ${layout.positions.get(node.id)!.y})`"
    fill="var(--color-commit)"
  />
  <circle
    v-else
    :cx="layout.positions.get(node.id)!.x"
    :cy="layout.positions.get(node.id)!.y"
    :r="NODE_R['future']"
    fill="var(--color-branch)"
  />
  ```

- [ ] **Step 4: Verify shapes in browser**

  Reload. The initial 3 seed commits should now show:
  - Commits `a` and `b` (type `commit`) → flat-top hexagons in mustard
  - Commit `c` (type `current`) → diamond in mustard
  - Generated future nodes (type `future`) → circles in aqua (unchanged shape)

  Click "Generate" in the app to produce future nodes and confirm they remain circles.

- [ ] **Step 5: Commit**

  ```bash
  git -C HackStoga2026 add frontend/src/components/GitGraph.vue
  git -C HackStoga2026 commit -m "feat: replace circle nodes with hexagon/diamond/circle shapes in GitGraph"
  ```

---

### Task 6: Add glow ring pulse animation to `current` node

**Files:**
- Modify: `frontend/src/components/GitGraph.vue`

The `current` node has an existing outer ring `<circle>`. Replace its inline `opacity` with a CSS animation class. The animation lives in the non-scoped `<style>` block (same block as `generating-pulse`).

- [ ] **Step 1: Locate the existing `current` outer ring in the template**

  Find:
  ```html
  <!-- Selected ring: single consolidated effect for current node -->
  <circle
    v-if="node.type === 'current'"
    :cx="layout.positions.get(node.id)!.x"
    :cy="layout.positions.get(node.id)!.y"
    :r="NODE_R['current'] + 7"
    fill="rgba(254,215,102,0.07)"
    stroke="var(--color-commit)"
    stroke-opacity="0.9"
    stroke-width="2"
  />
  ```

- [ ] **Step 2: Add `class="current-ring"` to the ring circle**

  Change to:
  ```html
  <circle
    v-if="node.type === 'current'"
    :cx="layout.positions.get(node.id)!.x"
    :cy="layout.positions.get(node.id)!.y"
    :r="NODE_R['current'] + 7"
    fill="rgba(254,215,102,0.07)"
    stroke="var(--color-commit)"
    stroke-opacity="0.9"
    stroke-width="2"
    class="current-ring"
  />
  ```

  Remove any `opacity` attribute that was previously on this element.

- [ ] **Step 3: Add `current-pulse` keyframes to the non-scoped `<style>` block**

  `GitGraph.vue` already has a non-scoped `<style>` block containing `generating-pulse`. Add to that same block:
  ```css
  @keyframes current-pulse {
    0%, 100% { opacity: 0.2; }
    50%       { opacity: 0.6; }
  }

  .current-ring {
    animation: current-pulse 2s ease-in-out infinite;
  }
  ```

- [ ] **Step 4: Verify in browser**

  Reload. The current commit's outer ring should pulse slowly (2 s cycle) between faint and more visible. The `generating-pulse` animation on the placeholder node should still work independently (600 ms cycle) — verify by clicking "Generate" and watching the placeholder node blink.

- [ ] **Step 5: Commit**

  ```bash
  git -C HackStoga2026 add frontend/src/components/GitGraph.vue
  git -C HackStoga2026 commit -m "feat: add pulsing glow ring to current node in GitGraph"
  ```

---

### Task 7: Final verification pass

**Files:** None modified.

- [ ] **Step 1: Full interaction smoke test**

  With the dev server running at `http://localhost:5173`, verify each of the following:

  | Check | Expected |
  |-------|----------|
  | Graph visible on load | Nodes centered and fitted in the panel |
  | Past commits (type `commit`) | Flat-top hexagons, mustard fill |
  | Current commit (type `current`) | Diamond, mustard fill, slow pulsing outer ring |
  | Mouse wheel over graph | Zooms toward cursor position |
  | Click and drag | Pans the graph; content follows pointer |
  | `+` button | Zooms in toward center |
  | `−` button | Zooms out from center |
  | `⊡` button | Resets and re-centers all nodes |
  | Click "Generate" → future nodes appear | Circles, aqua fill; placeholder blinks at 600 ms |
  | Future nodes adopted → become `commit` | Shape changes to hexagon |
  | Panel resize (drag panel edge if possible) | Graph viewBox recomputes, current pan/zoom preserved |
  | Browser console | No errors |

- [ ] **Step 2: TypeScript build check**

  ```bash
  cd HackStoga2026/frontend && npx vue-tsc --noEmit
  ```

  Expected: no errors. Fix any type errors before proceeding.

- [ ] **Step 3: Final commit if any fixes were needed**

  ```bash
  git -C HackStoga2026 add frontend/src/components/GitGraph.vue
  git -C HackStoga2026 commit -m "fix: address type errors and smoke test issues in GitGraph"
  ```

  Skip this step if no fixes were needed.
