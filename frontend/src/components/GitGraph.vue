<script setup lang="ts">
import { computed } from 'vue'
import { computeGraphLayout } from '../composables/useGraphLayout'
import type { GraphNode } from '../composables/useGraphLayout'

const MOCK_NODES: GraphNode[] = [
  { id: 'a', label: 'initial commit',  hash: 'a1b2c3', type: 'commit',  parents: [],    lane: 0, column: 0 },
  { id: 'b', label: 'add router',      hash: 'b4d5e6', type: 'commit',  parents: ['a'], lane: 0, column: 1 },
  { id: 'c', label: 'global css',      hash: 'c7f8a9', type: 'current', parents: ['b'], lane: 0, column: 2 },
  { id: 'd', label: 'add graph view',  hash: 'd0e1f2', type: 'future',  parents: ['c'], lane: 0, column: 3 },
  { id: 'e', label: 'dark mode',       hash: 'e3f4a5', type: 'future',  parents: ['c'], lane: 1, column: 3 },
  { id: 'f', label: 'animations',      hash: 'f6b7c8', type: 'future',  parents: ['d'], lane: 0, column: 4 },
]

const layout = computed(() => computeGraphLayout(MOCK_NODES))

// Build edge list: for each node, one edge per parent
const edges = computed(() => {
  const { positions } = layout.value
  const result: Array<{
    id: string
    d: string
    type: 'commit' | 'current' | 'future'
  }> = []

  for (const node of MOCK_NODES) {
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

// Hash chip: estimate width = chars * 5.5 + 8px padding
function hashChipRect(hash: string) {
  const w = hash.length * 5.5 + 8
  return { w, h: 13, dx: -w / 2 }
}

const NODE_R: Record<string, number> = { commit: 8, current: 10, future: 8 }
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
      v-for="node in MOCK_NODES"
      :key="node.id"
      :style="node.type === 'current' ? 'filter: drop-shadow(0 0 6px var(--clr-mustard))' : ''"
      :opacity="node.type === 'future' ? 0.5 : 1"
    >
      <!-- Outer ring for current node -->
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

      <!-- Main circle -->
      <circle
        :cx="layout.positions.get(node.id)!.x"
        :cy="layout.positions.get(node.id)!.y"
        :r="NODE_R[node.type]"
        :fill="node.type === 'future' ? 'var(--color-branch)' : 'var(--color-commit)'"
      />

      <!-- Hash chip: rect background -->
      <rect
        :x="layout.positions.get(node.id)!.x + hashChipRect(node.hash).dx"
        :y="layout.positions.get(node.id)!.y - 23"
        :width="hashChipRect(node.hash).w"
        :height="hashChipRect(node.hash).h"
        rx="3"
        :fill="node.type === 'future' ? 'rgba(157,217,210,0.12)' : 'rgba(254,215,102,0.1)'"
      />

      <!-- Hash chip: text -->
      <text
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
