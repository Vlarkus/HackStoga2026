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
  lane: number        // vertical lane (0 = main, 1+ = branches)
}
```

- **column** = depth from root (x-axis position)
- **lane** = row index (y-axis position)
- Mock data is a `const` array in `GitGraph.vue`, easy to replace with a store later

## Layout

- Left-to-right flow: each column step adds a fixed `STEP_X` offset
- Lane 0 is the center row (main branch); lanes 1, 2 … fan outward
- `useGraphLayout` composable takes the node array and returns a `Map<id, {x, y}>` of computed pixel positions
- Future nodes sit to the right of the current node

## Visual Treatment

| Node type | Circle fill | Stroke | Opacity | Edge style |
|-----------|-------------|--------|---------|------------|
| `commit` (past) | `--color-commit` (mustard) | none | 1.0 | solid |
| `current` | `--color-commit` + glow ring | `--glow-commit` | 1.0 | solid |
| `future` | `--color-branch` (aqua) | `--color-branch` | 0.5 | dashed |

- Edges are cubic bezier `<path>` elements drawn before nodes (behind layer)
- Same-lane connections: straight horizontal lines
- Cross-lane connections: smooth bezier curve
- Node labels (commit message) rendered below circle in `--font-mono` `--text-xs`
- Hash chips rendered above circle using the `.hash` global CSS class

## Component Structure

```
frontend/src/components/
  GitGraph.vue          ← new component
frontend/src/composables/
  useGraphLayout.ts     ← new composable
```

### `useGraphLayout.ts`
- Input: `GraphNode[]`
- Output: `Map<string, { x: number, y: number }>`
- Pure function, no side effects

### `GitGraph.vue`
- Contains mock `GraphNode[]` as a top-level `const`
- Calls `useGraphLayout` to get positions
- Template: `<svg width="100%" height="100%">` with edges then nodes then labels
- No panning/zooming in this iteration

### `HomeView.vue` change
- Replace the placeholder `<p>` inside the GIT NODES panel slot with `<GitGraph />`

## Out of Scope

- Panning / zooming (panel is already resizable)
- Click interactions / selection
- Real data wiring
- Backend integration
