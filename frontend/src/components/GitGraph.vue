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
  const placeholder: Commit = {
    id: '__generating__',
    label: '…',
    hash: '……',
    type: 'future',
    parents: [activeCommit.id],
    lane: activeCommit.lane + 1,
    column: activeCommit.column + 1,
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
  if (dragDist.value > 5) return // Ignore click if we panned
  if (node.id === '__generating__') return
  if (node.type === 'future') {
    store.setPreview(node.id)
  } else {
    store.setActive(node.id)
  }
}

// ── Viewport ─────────────────────────────────────────────────────────────────

const wrapEl     = ref<HTMLDivElement | null>(null)
const svgEl      = ref<SVGSVGElement  | null>(null)
const ready      = ref(false)

const vb = ref({ x: 0, y: 0, w: 1, h: 1 })
const viewBoxStr = computed(() => `${vb.value.x} ${vb.value.y} ${vb.value.w} ${vb.value.h}`)

const FOCUS_ZOOM = 1.4  // zoom level when centered on active node
let resizeObs: ResizeObserver | undefined

function centerOn(x: number, y: number, z: number) {
  if (!svgEl.value) return
  const { width, height } = svgEl.value.getBoundingClientRect()
  const vw = width  / z
  const vh = height / z
  vb.value = {
    x: x - vw / 2,
    y: y - vh / 2,
    w: vw,
    h: vh
  }
}

function focusActive() {
  if (!svgEl.value) return
  const pos = layout.value.positions.get(store.activeCommitId)
  if (!pos) return
  centerOn(pos.x, pos.y, FOCUS_ZOOM)
  ready.value = true
}

function zoomIn()  {
  const centerX = vb.value.x + vb.value.w / 2
  const centerY = vb.value.y + vb.value.h / 2
  const factor = 0.8
  const newW = vb.value.w * factor
  const newH = vb.value.h * factor
  vb.value.x = centerX - newW / 2
  vb.value.y = centerY - newH / 2
  vb.value.w = newW
  vb.value.h = newH
}
function zoomOut() {
  const centerX = vb.value.x + vb.value.w / 2
  const centerY = vb.value.y + vb.value.h / 2
  const factor = 1.2
  const newW = vb.value.w * factor
  const newH = vb.value.h * factor
  vb.value.x = centerX - newW / 2
  vb.value.y = centerY - newH / 2
  vb.value.w = newW
  vb.value.h = newH
}

// ── Panning & Wheel Zoom ─────────────────────────────────────────────────────

const isDragging = ref(false)
const dragDist = ref(0)
const lastMouse = { x: 0, y: 0 }

function handleMouseDown(e: MouseEvent) {
  if (e.button !== 0) return // Only left click
  isDragging.value = true
  dragDist.value = 0
  lastMouse.x = e.clientX
  lastMouse.y = e.clientY
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !svgEl.value) return
  
  const dx = e.clientX - lastMouse.x
  const dy = e.clientY - lastMouse.y
  
  dragDist.value += Math.sqrt(dx * dx + dy * dy)
  
  const { width, height } = svgEl.value.getBoundingClientRect()
  const scaleX = vb.value.w / width
  const scaleY = vb.value.h / height
  
  vb.value.x -= dx * scaleX
  vb.value.y -= dy * scaleY
  
  lastMouse.x = e.clientX
  lastMouse.y = e.clientY
}

function handleMouseUp() {
  isDragging.value = false
}

function handleWheel(e: WheelEvent) {
  if (!svgEl.value) return
  e.preventDefault()

  const { width, height, left, top } = svgEl.value.getBoundingClientRect()
  
  // Mouse position in SVG coordinates
  const mouseX = vb.value.x + (e.clientX - left) * (vb.value.w / width)
  const mouseY = vb.value.y + (e.clientY - top) * (vb.value.h / height)

  const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9
  
  const newW = vb.value.w * zoomFactor
  const newH = vb.value.h * zoomFactor
  
  // Keep mouse position fixed in SVG coordinates
  vb.value.x = mouseX - (e.clientX - left) * (newW / width)
  vb.value.y = mouseY - (e.clientY - top) * (newH / height)
  vb.value.w = newW
  vb.value.h = newH
}

onMounted(() => {
  resizeObs = new ResizeObserver(focusActive)
  resizeObs.observe(wrapEl.value!)
  nextTick(focusActive)
  
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  resizeObs?.disconnect()
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})

watch(() => store.activeCommitId, () => nextTick(focusActive))
watch(displayNodes, () => nextTick(focusActive), { immediate: false })

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
      :style="{ 
        display: 'block', 
        overflow: 'visible',
        cursor: isDragging ? 'grabbing' : 'grab'
      }"
      @mousedown="handleMouseDown"
      @wheel="handleWheel"
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
          fill="rgba(var(--clr-mustard-rgb), 0.07)"
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
          :fill="node.type === 'future' ? 'rgba(var(--clr-aqua-rgb), 0.12)' : 'rgba(var(--clr-mustard-rgb), 0.1)'"
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

      </g>
    </svg>

    <!-- Zoom controls overlay -->
    <div :class="$style.controls">
      <button @click="zoomIn">+</button>
      <button @click="zoomOut">−</button>
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
