# GitGraph — Zoom/Pan & Geometric Nodes

**Date:** 2026-03-21
**Status:** Approved

## Overview

Two improvements to `frontend/src/components/GitGraph.vue`:

1. **Dynamic zoom/pan** inside the GitGraph panel via SVG `viewBox` manipulation.
2. **Geometric node shapes** differentiating commit types (hexagon, diamond, circle).

No new npm dependencies. All changes are confined to `GitGraph.vue`.
`useGraphLayout.ts` is not modified.

---

## Component Structure Change

`GitGraph.vue` currently renders a bare `<svg>` as its root element. It must be
refactored to have a new root `<div>` wrapping the `<svg>` and a controls overlay:

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
  >
    ...nodes and edges...
  </svg>
  <div :class="$style.controls">
    <button @click="zoomIn">+</button>
    <button @click="zoomOut">−</button>
    <button @click="autoFit">⊡</button>
  </div>
</div>
```

`preserveAspectRatio="none"` replaces the existing `"xMinYMid meet"`.

The wrapper starts hidden (`visibility: hidden`) via the `.graphWrap` base style.
The `.ready` class sets `visibility: visible`. `ready` is a `ref<boolean>(false)`
set to `true` inside `autoFit()` after the first successful fit, eliminating the
one-frame stretch flash that would occur with `preserveAspectRatio="none"` and a
placeholder viewBox.

---

## Zoom/Pan

### Template refs and state

All declarations below are at the top level of `<script setup>` — they are
per-instance by definition (Vue's `<script setup>` runs as a setup function for
each component instance, so there is no cross-instance sharing).

```ts
const wrapEl     = ref<HTMLDivElement | null>(null)  // ref="wrapEl" on root <div>
const svgEl      = ref<SVGSVGElement  | null>(null)  // ref="svgEl"  on <svg>
const ready      = ref(false)                        // controls visibility

const panX       = ref(0)               // left edge of viewBox in SVG content units
const panY       = ref(0)               // top edge  of viewBox in SVG content units
const zoom       = ref(1)               // scale factor; clamped to [0.1, 5.0]
const viewBoxStr = ref('0 0 1 1')       // :viewBox binding; overwritten by autoFit

// Drag state — plain variables (not refs) since they don't need reactivity.
// Per-instance because they live in <script setup> scope.
let isDragging = false
let lastX      = 0
let lastY      = 0
```

### `recomputeViewBox()`

```ts
function recomputeViewBox() {
  if (!svgEl.value) return
  const { width, height } = svgEl.value.getBoundingClientRect()
  viewBoxStr.value =
    `${panX.value} ${panY.value} ${width / zoom.value} ${height / zoom.value}`
}
```

Called imperatively after every mutation of `panX`, `panY`, or `zoom`.

### `onMounted` — combined setup

A single `onMounted` handles all setup. This component targets browser-only
environments (no SSR); `onMounted` is always called before `onUnmounted`.
`resizeObs` is typed as `ResizeObserver | undefined` and guarded in cleanup:

```ts
let resizeObs: ResizeObserver | undefined

onMounted(() => {
  // Template refs (svgEl, wrapEl) are guaranteed non-null here — Vue sets them
  // before onMounted fires. Using `!` is safe; `?.` is used elsewhere only for
  // event handlers that could theoretically fire during hot-reload teardown.

  // 1. Wheel listener (must be passive:false to allow preventDefault)
  svgEl.value!.addEventListener('wheel', onWheel, { passive: false })

  // 2. ResizeObserver — preserves current pan/zoom on resize (no re-autofit)
  resizeObs = new ResizeObserver(() => recomputeViewBox())
  resizeObs.observe(wrapEl.value!)

  // 3. Initial fit (deferred one tick so SVG has a rendered size)
  nextTick(autoFit)
})

onUnmounted(() => {
  svgEl.value?.removeEventListener('wheel', onWheel)
  resizeObs?.disconnect()
  isDragging = false   // reset drag state in case component unmounts mid-drag
})
```

**Resize behavior:** `ResizeObserver` calls only `recomputeViewBox()`, preserving
the current `panX`/`panY`/`zoom`. It does not call `autoFit()` on resize — the
user's current zoom level and pan position are kept when the panel is resized.

### Wheel zoom (zoom-to-cursor)

```ts
function onWheel(event: WheelEvent) {
  event.preventDefault()
  const rect     = svgEl.value!.getBoundingClientRect()
  const mouseX   = event.clientX - rect.left
  const mouseY   = event.clientY - rect.top
  const delta    = event.deltaY < 0 ? 1.2 : 1 / 1.2
  const newZoom  = Math.min(5, Math.max(0.1, zoom.value * delta))

  // viewBoxWidth = renderedWidth / zoom, so 1 pixel = 1/zoom SVG units.
  // SVG coord under cursor = panX + mouseX/zoom.
  // Keep that coord fixed after zoom: panX_new + mouseX/newZoom = panX + mouseX/zoom.
  panX.value += mouseX * (1 / zoom.value - 1 / newZoom)
  panY.value += mouseY * (1 / zoom.value - 1 / newZoom)
  zoom.value  = newZoom
  recomputeViewBox()
}
```

### Drag-to-pan

Pointer events are on the `<svg>`. `setPointerCapture` ensures drag continues if
the pointer leaves the SVG boundary.

```ts
function onPointerDown(e: PointerEvent) {
  isDragging = true
  lastX = e.clientX
  lastY = e.clientY
  // svgEl is non-null while event handlers are active (between mount and unmount)
  svgEl.value?.setPointerCapture(e.pointerId)
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging) return
  // 1 pixel = 1/zoom SVG units. Dragging right (positive dx) decreases panX
  // (left edge of viewBox moves left → content follows the pointer rightward).
  panX.value -= (e.clientX - lastX) / zoom.value
  panY.value -= (e.clientY - lastY) / zoom.value
  lastX = e.clientX
  lastY = e.clientY
  recomputeViewBox()
}

function onPointerUp(e: PointerEvent) {
  isDragging = false
  svgEl.value?.releasePointerCapture(e.pointerId)  // null-safe
}

// pointercancel fires when the browser cancels capture (system gesture, etc.)
// Must reset isDragging to avoid phantom pan on next move event.
function onPointerCancel(_e: PointerEvent) {
  isDragging = false
}
```

### Zoom buttons (zoom-to-center)

```ts
function zoomIn()  { zoomToward(zoom.value * 1.2) }
function zoomOut() { zoomToward(zoom.value / 1.2) }

function zoomToward(newZoom: number) {
  newZoom = Math.min(5, Math.max(0.1, newZoom))
  if (!svgEl.value) return
  const { width, height } = svgEl.value.getBoundingClientRect()
  // Anchor to viewport center using the same zoom-to-point formula as onWheel
  panX.value += (width  / 2) * (1 / zoom.value - 1 / newZoom)
  panY.value += (height / 2) * (1 / zoom.value - 1 / newZoom)
  zoom.value  = newZoom
  recomputeViewBox()
}
```

### Auto-fit (`autoFit()`)

`layout.value.positions` is a `Map<string, { x: number; y: number }>` returned
by `computeGraphLayout` in `useGraphLayout.ts`. `autoFit()` iterates its values
directly — no changes to `useGraphLayout.ts` are required.

```ts
function autoFit() {
  if (!svgEl.value) return
  const positions = [...layout.value.positions.values()]
  if (positions.length === 0) return

  const PAD     = 60
  const minX    = Math.min(...positions.map(p => p.x)) - PAD
  const minY    = Math.min(...positions.map(p => p.y)) - PAD
  const maxX    = Math.max(...positions.map(p => p.x)) + PAD
  const maxY    = Math.max(...positions.map(p => p.y)) + PAD
  const contentW = maxX - minX
  const contentH = maxY - minY

  const { width, height } = svgEl.value.getBoundingClientRect()
  const fitZoom = Math.min(5, Math.max(0.1, Math.min(width / contentW, height / contentH)))

  // Center content: adjust pan so content is centered in the viewport
  panX.value = minX - (width  / fitZoom - contentW) / 2
  panY.value = minY - (height / fitZoom - contentH) / 2
  zoom.value = fitZoom

  recomputeViewBox()
  ready.value = true   // reveal SVG after first fit (removes visibility:hidden)
}
```

`layout` and `displayNodes` are existing `computed` values already in
`GitGraph.vue`. This spec does not add them.

**Coordinate assumption:** All node positions from `useGraphLayout.ts` are
absolute SVG content-space values (e.g., `PADDING_X + column * STEP_X`). No
percentage-based or viewBox-relative coordinates exist inside the `<svg>`, so
`preserveAspectRatio="none"` does not distort any existing content.

**Update ordering:** `zoom.value = fitZoom` must be assigned immediately before
`recomputeViewBox()`. Do not reorder — `recomputeViewBox` reads `zoom.value` to
compute viewBox dimensions.

**Empty graph case:** If `positions.length === 0` at mount, `autoFit` returns
early and `ready` stays `false` (SVG remains hidden). The `watch(displayNodes,
…)` watcher triggers `autoFit` again when nodes arrive, setting `ready = true`
and revealing the SVG.

### When autoFit runs

```ts
watch(displayNodes, () => nextTick(autoFit), { immediate: false })
// onMounted call is in the combined onMounted block above
```

`immediate: false` prevents a double call on mount.

### CSS

```css
.graphWrap {
  position: relative;
  width: 100%;
  height: 100%;
  visibility: hidden;   /* hidden until first autoFit */
}

.graphWrap.ready {
  visibility: visible;
}

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

---

## Node Shapes

### Existing `NODE_R` constant (unchanged)

```ts
const NODE_R: Record<string, number> = { commit: 11, current: 13, future: 11 }
```

### Shape mapping

| Type | Shape | SVG element | Size |
|---|---|---|---|
| `commit` | Hexagon (flat-top) | `<polygon>` | circumradius = 11 |
| `current` | Diamond | `<rect>` rotated 45° | circumradius = 13; side = `13√2 ≈ 18.38` |
| `future` | Circle | `<circle>` | radius = 11 |

Fill colors unchanged: `--color-commit` (mustard) for `commit`/`current`,
`--color-branch` (aqua) for `future`.

### Hexagon helper

Produces a **flat-top** hexagon (flat edge at top and bottom, vertices at sides):

```ts
function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6  // −30° → flat-top orientation
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}
```

Template usage: `:points="hexPoints(pos.x, pos.y, NODE_R['commit'])"`.

### Diamond

A square rotated 45°. Given circumradius `r = 13` (tip-to-center), side length
= `r√2` (since the half-diagonal of a square with side `s` = `s√2/2`, so
`s√2/2 = r` → `s = r√2`). After rotation by 45° around `(pos.x, pos.y)`, each
tip is exactly `r = 13` SVG units from center — verified by the half-diagonal
formula.

```html
<rect
  :x="pos.x - NODE_R['current'] * Math.SQRT2 / 2"
  :y="pos.y - NODE_R['current'] * Math.SQRT2 / 2"
  :width="NODE_R['current'] * Math.SQRT2"
  :height="NODE_R['current'] * Math.SQRT2"
  :transform="`rotate(45, ${pos.x}, ${pos.y})`"
  fill="var(--color-commit)"
/>
```

The outer glow ring uses `r = NODE_R['current'] + 7` (the existing formula from
the current code, evaluated as `13 + 7 = 20`). Ring radius 20 clears all four
diamond tips at distance 13 from center (20 > 13). The `+ 7` offset is a
hardcoded aesthetic value; if `NODE_R['current']` changes, this expression
automatically recalculates the ring radius proportionally.

### Glow ring on `current`

The existing outer ring `<circle>` is kept. Its inline `opacity` attribute is
removed and replaced with the class `current-ring`, defined in the **non-scoped
`<style>`** block (same block as `generating-pulse`) — not in the CSS Modules
`<style module>` block, since it needs to apply to SVG child elements directly:

```css
/* in <style> (non-scoped, non-module) */
@keyframes current-pulse {
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 0.6; }
}

.current-ring {
  animation: current-pulse 2s ease-in-out infinite;
}
```

Applied to the outer ring `<circle>` only via `class="current-ring"` — not to
the node `<g>` group. Distinct from `generating-pulse` (600 ms, applied to the
whole placeholder group).

### Generating placeholder

`__generating__` remains a `<circle>` with the existing `generating-pulse`
animation. No shape change.

---

## Files Changed

| File | Change |
|---|---|
| `frontend/src/components/GitGraph.vue` | New root wrapper div + refs; `ready`/`panX`/`panY`/`zoom`/`viewBoxStr` state; `recomputeViewBox`; combined `onMounted`; ResizeObserver; imperative wheel listener (`passive:false`); drag + cancel handlers; `zoomIn`/`zoomOut`/`zoomToward`/`autoFit`; controls overlay; geometric node shapes; `current-pulse` animation in non-scoped `<style>` |
| `frontend/src/composables/useGraphLayout.ts` | No changes |

---

## Out of Scope

- Zoom/pan on `CommitGraphViz.vue` (GitPlayground view).
- Touch / pinch-to-zoom.
- Persisting zoom/pan state across sessions.
