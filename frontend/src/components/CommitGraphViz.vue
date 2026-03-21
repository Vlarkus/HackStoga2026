<script setup lang="ts">
import { computed } from 'vue'
import type { CommitGraph, GraphNode } from '../git'

const props = defineProps<{ graph: CommitGraph }>()
const emit = defineEmits<{ (e: 'select-commit', oid: string): void }>()

// ── Layout constants ──
const NODE_R = 8
const ROW_H = 48
const LANE_W = 28
const PAD_LEFT = 24
const LABEL_X_OFFSET = 12

// Assign each branch a stable colour
const COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
]

const branchColor = computed(() => {
  const map: Record<string, string> = {}
  props.graph.branches.forEach((b, i) => {
    map[b.name] = COLORS[i % COLORS.length]
  })
  return map
})

// ── Compute lane assignments ──
// Each branch head sits in its own lane. Commits reachable from multiple
// branches pick the lane of their *first* listed branch (the one that
// owns them most naturally — usually the one whose HEAD is closest).

interface LayoutNode {
  node: GraphNode
  lane: number
  y: number
  color: string
  isHead: boolean
  branchLabels: string[]
}

const layout = computed(() => {
  const { nodes, branches, head } = props.graph
  if (nodes.length === 0) return { rows: [] as LayoutNode[], lanes: 0, svgH: 0, svgW: 0 }

  // Branch name → lane index
  const branchLane: Record<string, number> = {}
  branches.forEach((b, i) => { branchLane[b.name] = i })

  // Which branch tip OIDs
  const tipOids = new Set(branches.map(b => b.oid))

  const rows: LayoutNode[] = nodes.map((node, i) => {
    // Pick lane: use the first branch that references this commit
    const primaryBranch = node.branches[0] ?? branches[0]?.name ?? 'main'
    const lane = branchLane[primaryBranch] ?? 0
    const color = branchColor.value[primaryBranch] ?? COLORS[0]

    // Show branch labels only on tip commits
    const branchLabels = tipOids.has(node.oid)
      ? node.branches
      : []

    return {
      node,
      lane,
      y: i * ROW_H + ROW_H / 2,
      color,
      isHead: node.oid === head,
      branchLabels,
    }
  })

  const lanes = branches.length || 1
  const svgH = nodes.length * ROW_H + 8
  const svgW = Math.max(lanes * LANE_W + PAD_LEFT + 340, 400)

  return { rows, lanes, svgH, svgW }
})

// ── Build edge paths (parent → child lines) ──
const edges = computed(() => {
  const { rows } = layout.value
  if (rows.length === 0) return []

  const oidToRow = new Map<string, LayoutNode>()
  rows.forEach(r => oidToRow.set(r.node.oid, r))

  const result: { path: string; color: string }[] = []

  for (const row of rows) {
    for (const parentOid of row.node.parents) {
      const parent = oidToRow.get(parentOid)
      if (!parent) continue

      const x1 = PAD_LEFT + row.lane * LANE_W
      const y1 = row.y
      const x2 = PAD_LEFT + parent.lane * LANE_W
      const y2 = parent.y

      let path: string
      if (x1 === x2) {
        // Straight vertical line
        path = `M ${x1} ${y1} L ${x2} ${y2}`
      } else {
        // Curved connector
        const midY = (y1 + y2) / 2
        path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`
      }

      result.push({ path, color: row.color })
    }
  }

  return result
})

function cx(lane: number) {
  return PAD_LEFT + lane * LANE_W
}
</script>

<template>
  <div :class="$style.wrap">
    <!-- Branch legend -->
    <div :class="$style.legend">
      <span
        v-for="b in graph.branches"
        :key="b.name"
        :class="[$style.legendItem, b.current && $style.current]"
        :style="{ '--bc': branchColor[b.name] }"
      >
        <span :class="$style.dot" />
        {{ b.name }}
      </span>
    </div>

    <!-- SVG graph -->
    <svg
      :width="layout.svgW"
      :height="layout.svgH"
      :class="$style.svg"
    >
      <!-- Edges -->
      <path
        v-for="(e, i) in edges"
        :key="'e' + i"
        :d="e.path"
        :stroke="e.color"
        stroke-width="2"
        fill="none"
        stroke-linecap="round"
        opacity="0.5"
      />

      <!-- Nodes + labels -->
      <g
        v-for="row in layout.rows"
        :key="row.node.oid"
        :class="$style.nodeGroup"
        @click="emit('select-commit', row.node.oid)"
      >
        <!-- Head ring -->
        <circle
          v-if="row.isHead"
          :cx="cx(row.lane)"
          :cy="row.y"
          :r="NODE_R + 4"
          fill="none"
          :stroke="row.color"
          stroke-width="2"
          opacity="0.4"
        />

        <!-- Commit dot -->
        <circle
          :cx="cx(row.lane)"
          :cy="row.y"
          :r="NODE_R"
          :fill="row.color"
          stroke="white"
          stroke-width="2"
        />

        <!-- Merge indicator -->
        <circle
          v-if="row.node.parents.length > 1"
          :cx="cx(row.lane)"
          :cy="row.y"
          :r="3"
          fill="white"
        />

        <!-- Branch labels (on tip commits) -->
        <g v-for="(label, li) in row.branchLabels" :key="label">
          <rect
            :x="cx(layout.lanes - 1) + LANE_W + LABEL_X_OFFSET + li * 72"
            :y="row.y - 10"
            :width="64"
            height="20"
            rx="4"
            :fill="branchColor[label] ?? '#94a3b8'"
            opacity="0.15"
          />
          <text
            :x="cx(layout.lanes - 1) + LANE_W + LABEL_X_OFFSET + li * 72 + 32"
            :y="row.y + 4"
            text-anchor="middle"
            :fill="branchColor[label] ?? '#94a3b8'"
            font-size="11"
            font-weight="600"
            font-family="system-ui, sans-serif"
          >{{ label }}</text>
        </g>

        <!-- OID + message -->
        <text
          :x="cx(layout.lanes - 1) + LANE_W + LABEL_X_OFFSET + Math.max(row.branchLabels.length, 0) * 72 + (row.branchLabels.length ? 8 : 0)"
          :y="row.y + 4"
          font-size="12"
          font-family="'SF Mono', 'Fira Code', monospace"
          fill="#6366f1"
        >{{ row.node.oid.slice(0, 7) }}</text>

        <text
          :x="cx(layout.lanes - 1) + LANE_W + LABEL_X_OFFSET + Math.max(row.branchLabels.length, 0) * 72 + (row.branchLabels.length ? 8 : 0) + 62"
          :y="row.y + 4"
          font-size="12"
          font-family="system-ui, sans-serif"
          fill="#334155"
        >{{ row.node.message.split('\n')[0].slice(0, 40) }}</text>
      </g>
    </svg>
  </div>
</template>

<style module>
.wrap {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 420px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafbfc;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  position: sticky;
  top: 0;
  z-index: 1;
}

.legendItem {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: #475569;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: #f1f5f9;
}

.legendItem.current {
  font-weight: 600;
  background: #e0e7ff;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bc);
}

.svg {
  display: block;
  padding: 4px 0;
}

.nodeGroup {
  cursor: pointer;
}
.nodeGroup:hover circle {
  filter: brightness(1.15);
}
</style>
