<script setup lang="ts">
import { computed } from 'vue'
import { computeGraphLayout } from '../composables/useGraphLayout'
import { useProjectStore } from '../stores/useProjectStore'
import type { Commit } from '../stores/useProjectStore'

const store = useProjectStore()

// Placeholder node shown while generating — pulsing dot at next column
const displayNodes = computed((): Commit[] => {
  if (!store.isGenerating) return store.graphNodes
  const activeCommit = store.graphNodes.find(n => n.id === store.activeCommitId)!
  const maxColumn = Math.max(...store.graphNodes.map(n => n.column))
  const placeholder: Commit = {
    id: '__generating__',
    label: '…',
    hash: '……',
    type: 'future',
    parents: [activeCommit.id],
    lane: Math.max(...store.graphNodes.map(n => n.lane)) + 1,
    column: maxColumn + 1,
    content: '',
  }
  return [...store.graphNodes, placeholder]
})

const layout = computed(() => computeGraphLayout(displayNodes.value))

const edges = computed(() => {
  const { positions } = layout.value
  const result: Array<{ id: string; d: string; type: Commit['type']; isMergeEdge: boolean }> = []

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
        isMergeEdge: node.parents.indexOf(parentId) > 0,
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
        :stroke="edge.isMergeEdge ? 'var(--clr-green-bright)' : (edge.type === 'future' ? 'var(--color-branch)' : 'var(--color-commit)')"
        :stroke-opacity="edge.isMergeEdge ? 0.8 : (edge.type === 'future' ? 0.4 : 0.6)"
        stroke-width="1.5"
        :stroke-dasharray="edge.type === 'future' ? '6 4' : 'none'"
      />
    </g>

    <!-- Nodes -->
    <g
      v-for="node in displayNodes"
      :key="node.id"
      :style="node.type === 'current' ? 'filter: drop-shadow(0 0 6px var(--clr-green))' : ''"
      :opacity="node.type === 'future' ? 0.5 : 1"
      :class="{ 'generating-pulse': node.id === '__generating__' }"
      style="cursor: pointer"
      @click="handleNodeClick(node)"
    >
      <!-- Outer ring: current committed state (mustard, always on current-type node) -->
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

      <!-- Active branch point ring (mustard, solid — shows where futures will branch from) -->
      <circle
        v-if="node.id === store.activeCommitId && node.type !== 'current'"
        :cx="layout.positions.get(node.id)!.x"
        :cy="layout.positions.get(node.id)!.y"
        r="14"
        fill="none"
        stroke="var(--color-commit)"
        stroke-opacity="0.9"
        stroke-width="2"
        stroke-dasharray="4 2"
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

      <!-- Merge node: diamond shape -->
      <rect
        v-if="node.parents.length > 1"
        :x="layout.positions.get(node.id)!.x - 8"
        :y="layout.positions.get(node.id)!.y - 8"
        width="16"
        height="16"
        :transform="`rotate(45 ${layout.positions.get(node.id)!.x} ${layout.positions.get(node.id)!.y})`"
        fill="var(--clr-green-bright)"
      />
      <!-- Main circle (non-merge nodes) -->
      <circle
        v-else
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
        :fill="node.type === 'future' ? 'rgba(168,230,176,0.12)' : 'rgba(126,203,139,0.1)'"
      />

      <!-- Hash chip: text -->
      <text
        v-if="node.id !== '__generating__'"
        :x="layout.positions.get(node.id)!.x"
        :y="layout.positions.get(node.id)!.y - 13"
        text-anchor="middle"
        font-family="Space Mono, monospace"
        font-size="9"
        :fill="node.type === 'future' ? 'var(--color-branch)' : 'var(--clr-green)'"
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
