<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { computeGraphLayout } from '../composables/useGraphLayout'
import { useProjectStore } from '../stores/useProjectStore'
import type { Commit } from '../stores/useProjectStore'

const store = useProjectStore()

// ── Existing graph data ──────────────────────────────────────────────────────

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
  const w = hash.length * 6.5 + 12
  return { w, h: 16, dx: -w / 2 }
}

const NODE_R: Record<string, number> = { commit: 11, current: 13, future: 11 }

function handleNodeClick(node: Commit) {
  if (node.id === '__generating__') return
  if (node.type === 'future') {
    store.setPreview(node.id)
  } else {
    store.setActive(node.id)
  }
}

// ── Zoom / Pan ───────────────────────────────────────────────────────────────

const wrapEl     = ref<HTMLDivElement | null>(null)
const svgEl      = ref<SVGSVGElement  | null>(null)
const ready      = ref(false)

const panX       = ref(0)
const panY       = ref(0)
const zoom       = ref(1)
const viewBoxStr = ref('0 0 1 1')

// Drag state — plain variables (no reactivity needed)
let isDragging = false
let lastX      = 0
let lastY      = 0
let resizeObs: ResizeObserver | undefined

function recomputeViewBox() {
  if (!svgEl.value) return
  const { width, height } = svgEl.value.getBoundingClientRect()
  viewBoxStr.value =
    `${panX.value} ${panY.value} ${width / zoom.value} ${height / zoom.value}`
}

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

watch(displayNodes, () => nextTick(autoFit), { immediate: false })

// ── Node shape helper ────────────────────────────────────────────────────────

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6  // −30° → flat-top
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')
}
</script>

<template>
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
        :opacity="node.type === 'future' ? 0.5 : 1"
        :class="{ 'generating-pulse': node.id === '__generating__' }"
        style="cursor: pointer"
        @click="handleNodeClick(node)"
      >
        <!-- Selected ring: pulsing glow for current node -->
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

        <!-- Active branch point ring (mustard, dashed — shows where futures will branch from) -->
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

        <!-- Hash chip: background -->
        <rect
          v-if="node.id !== '__generating__'"
          :x="layout.positions.get(node.id)!.x + hashChipRect(node.hash).dx"
          :y="layout.positions.get(node.id)!.y - 30"
          :width="hashChipRect(node.hash).w"
          :height="hashChipRect(node.hash).h"
          rx="3"
          :fill="node.type === 'future' ? 'rgba(157,217,210,0.12)' : 'rgba(254,215,102,0.1)'"
        />

        <!-- Hash chip: text -->
        <text
          v-if="node.id !== '__generating__'"
          :x="layout.positions.get(node.id)!.x"
          :y="layout.positions.get(node.id)!.y - 17"
          text-anchor="middle"
          font-family="Space Mono, monospace"
          font-size="11"
          :fill="node.type === 'future' ? 'var(--color-branch)' : 'var(--clr-mustard)'"
          letter-spacing="0.05em"
        >{{ node.hash }}</text>

        <!-- Label below node -->
        <text
          :x="layout.positions.get(node.id)!.x"
          :y="layout.positions.get(node.id)!.y + 30"
          text-anchor="middle"
          font-family="Space Mono, monospace"
          font-size="12"
          fill="var(--color-text-muted)"
        >{{ node.label }}</text>
      </g>
    </svg>

    <!-- Zoom controls overlay -->
    <div :class="$style.controls">
      <button @click="zoomIn">+</button>
      <button @click="zoomOut">−</button>
      <button @click="autoFit">⊡</button>
    </div>
  </div>
</template>

<style>
@keyframes generating-pulse {
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 0.6; }
}

.generating-pulse {
  animation: generating-pulse 600ms ease-in-out infinite;
}

@keyframes current-pulse {
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 0.6; }
}

.current-ring {
  animation: current-pulse 2s ease-in-out infinite;
}
</style>

<style module>
.graphWrap {
  position: relative;
  width: 100%;
  height: 100%;
  visibility: hidden;
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
</style>
