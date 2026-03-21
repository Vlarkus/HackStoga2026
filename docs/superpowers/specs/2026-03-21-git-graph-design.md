# Git Node Graph Visualizer — Design Spec

**Date:** 2026-03-21
**Status:** Approved

## Overview

A pure-SVG git graph visualizer rendered inside the existing draggable/resizable `GIT NODES` Panel. It displays a left-to-right commit tree with three node types: past commits, the current active commit, and predicted future commits. Data is mocked statically for this iteration.

## Data Model

```ts
type NodeType = 'commit' | 'current' | 'future'

interface GraphNode {
  id: string
  label: string       // short commit message
  hash: string        // e.g. "a3f9b2"
  type: NodeType
  parents: string[]   // parent node IDs (enables branching)
  lane: number        // vertical lane (0 = main, 1+ = branches below main)
  column: number      // horizontal depth from root (0-indexed)
}
```

- **column** = explicit depth value set in mock data (0 = leftmost). Not computed from traversal — the mock data provides it directly.
- **lane** = row index. Lane 0 is the main branch (center). Lane 1, 2 … are branches below lane 0 (all branches go downward — no upward fanout).
- Mock data is a `const` array in `GitGraph.vue`, easy to replace with a store later.

### Mock Data Example

```ts
const MOCK_NODES: GraphNode[] = [
  { id: 'a', label: 'initial commit',  hash: 'a1b2c3', type: 'commit',  parents: [],    lane: 0, column: 0 },
  { id: 'b', label: 'add router',      hash: 'b4d5e6', type: 'commit',  parents: ['a'], lane: 0, column: 1 },
  { id: 'c', label: 'global css',      hash: 'c7f8a9', type: 'current', parents: ['b'], lane: 0, column: 2 },
  { id: 'd', label: 'add graph view',  hash: 'd0e1f2', type: 'future',  parents: ['c'], lane: 0, column: 3 },
  { id: 'e', label: 'add dark mode',   hash: 'e3f4a5', type: 'future',  parents: ['c'], lane: 1, column: 3 },
  { id: 'f', label: 'add animations',  hash: 'f6b7c8', type: 'future',  parents: ['d'], lane: 0, column: 4 },
]
```

This encodes: main branch (lane 0) a→b→c→d→f, with a diverging future branch (lane 1) c→e.

## Layout

- `useGraphLayout` composable takes `GraphNode[]` and returns `Map<string, { x: number, y: number }>`
- `x = PADDING_LEFT + node.column * STEP_X`
- `y = PADDING_TOP + node.lane * STEP_Y`
- Constants: `STEP_X = 90`, `STEP_Y = 60`, `PADDING_LEFT = 40`, `PADDING_TOP = 40`
- Computed SVG dimensions: `viewBoxWidth = PADDING_LEFT + (maxColumn + 1) * STEP_X + PADDING_LEFT`, `viewBoxHeight = PADDING_TOP + (maxLane + 1) * STEP_Y + PADDING_TOP`

## SVG Viewport

- The `<svg>` element uses `width="100%" height="100%"` with a dynamic `viewBox` computed from layout bounds.
- `viewBox="0 0 {viewBoxWidth} {viewBoxHeight}"` — content is always fully visible; SVG scales to fill the panel.
- `preserveAspectRatio="xMinYMid meet"` so the graph anchors left and centers vertically.

## Visual Treatment

| Node type | Fill | Glow | Opacity | Edge style |
|-----------|------|------|---------|------------|
| `commit` (past) | `--color-commit` (mustard) | none | 1.0 | solid |
| `current` | `--color-commit` | CSS `filter: drop-shadow(0 0 6px var(--clr-mustard))` on the `<g>` | 1.0 | solid |
| `future` | `--color-branch` (aqua) | none | 0.5 | dashed (`stroke-dasharray="6 4"`) |

- Node radius: `r=8` for past/future, `r=10` for current
- Current node has a second outer circle (`r=14`, no fill, stroke `--color-commit`, opacity 0.4) as a ring indicator
- Edges are cubic bezier `<path>` elements rendered before nodes (behind layer)
  - Same-lane: `M x1,y1 C midX,y1 midX,y2 x2,y2` where midX = (x1+x2)/2
  - Cross-lane: same bezier formula — the control points naturally produce a smooth curve
- Edge stroke: `--color-commit` for solid edges, `--color-branch` for dashed edges

## Labels

- **Commit message**: `<text>` element, `dy="22"` below circle center, `text-anchor="middle"`, `font-family="Space Mono"`, `font-size="10"`, `fill="var(--color-text-muted)"`
- **Hash chip**: `<text>` element, `dy="-16"` above circle center, `text-anchor="middle"`, `font-family="Space Mono"`, `font-size="9"`, `fill="var(--clr-mustard)"`. A `<rect>` behind it (`fill="rgba(254,215,102,0.1)"`, `rx="3"`) mimics the `.hash` chip. No `<foreignObject>` needed.

## Component Structure

```
frontend/src/components/
  GitGraph.vue            ← new component
frontend/src/composables/ ← directory must be created
  useGraphLayout.ts       ← new composable
```

### `useGraphLayout.ts`
- Input: `GraphNode[]`
- Output: `{ positions: Map<string, { x: number, y: number }>, viewBoxWidth: number, viewBoxHeight: number }`
- Pure function, no side effects

### `GitGraph.vue`
- Contains `MOCK_NODES` as a top-level `const`
- Calls `useGraphLayout` to get positions and viewBox dimensions
- Template renders inside `<svg>`:
  1. `<path>` edges (one per parent relationship)
  2. `<circle>` nodes
  3. `<text>` + `<rect>` labels
- Edge and node style derived from node `type`

### `HomeView.vue` change
- Replace the placeholder `<p>` inside the GIT NODES panel slot with `<GitGraph />`

## Out of Scope

- Panning / zooming (panel is already resizable)
- Click interactions / selection
- Real data wiring
- Backend integration
