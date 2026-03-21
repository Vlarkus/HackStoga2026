<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import interact from 'interactjs';

const props = withDefaults(defineProps<{
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  title: string;
  accent?: 'commit' | 'branch' | 'conflict';
}>(), {
  x: 0,
  y: 0,
  width: 400,
  height: 300,
  accent: 'branch',
});

const panelRef = ref<HTMLElement | null>(null);
const SNAP  = 10;
const MIN_W = 180;
const MIN_H = 80;

function getXY(el: HTMLElement) {
  return {
    x: parseFloat(el.getAttribute('data-x') || '0'),
    y: parseFloat(el.getAttribute('data-y') || '0'),
  };
}

function setXY(el: HTMLElement, x: number, y: number) {
  el.style.transform = `translate(${x}px, ${y}px)`;
  el.setAttribute('data-x', String(x));
  el.setAttribute('data-y', String(y));
}

const snapGrid = interact.modifiers.snap({
  targets: [interact.snappers.grid({ x: SNAP, y: SNAP })],
  range: Infinity,
  relativePoints: [{ x: 0, y: 0 }],
});

onMounted(() => {
  const el = panelRef.value;
  if (!el) return;

  interact(el)
    .draggable({
      allowFrom: '.drag-handle',
      modifiers: [snapGrid],
      listeners: {
        start: () => el.classList.add('is-dragging'),
        move(e) {
          const { x, y } = getXY(el);
          setXY(el, x + e.dx, y + e.dy);
        },
        end: () => el.classList.remove('is-dragging'),
      },
    })
    .resizable({
      edges: { top: true, left: true, bottom: true, right: true },
      margin: 10,
      modifiers: [
        interact.modifiers.restrictSize({ min: { width: MIN_W, height: MIN_H } }),
      ],
      listeners: {
        start: () => el.classList.add('is-resizing'),
        move(e) {
          const { x, y } = getXY(el);
          el.style.width  = `${e.rect.width}px`;
          el.style.height = `${e.rect.height}px`;
          setXY(el, x + e.deltaRect.left, y + e.deltaRect.top);
        },
        end: () => el.classList.remove('is-resizing'),
      },
    });
});

onUnmounted(() => {
  if (panelRef.value) interact(panelRef.value).unset();
});
</script>

<template>
  <div
    ref="panelRef"
    class="panel-root"
    :style="{ left: `${x}px`, top: `${y}px`, width: `${width}px`, height: `${height}px` }"
  >
    <div class="drag-handle panel-header">
      <span class="panel-title">{{ title }}</span>
      <slot name="badge" />
    </div>
    <div class="panel-body">
      <slot />
    </div>
    <div v-if="$slots.footer" class="panel-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style>
.panel-root {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  touch-action: none;
  user-select: none;
  transition: border-color var(--duration-base) var(--ease-out),
              box-shadow   var(--duration-base) var(--ease-out);
}

.panel-root.is-dragging {
  border-color: var(--clr-mustard);
  box-shadow: var(--glow-commit), var(--shadow-float);
  z-index: 50;
}

.panel-root.is-resizing {
  border-color: var(--clr-aqua);
  box-shadow: var(--glow-branch), var(--shadow-float);
  z-index: 50;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-float);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  cursor: grab;
  flex-shrink: 0;
}

.panel-header:active { cursor: grabbing; }

.panel-title {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
}

.panel-body {
  flex: 1;
  padding: var(--space-4);
  overflow: auto;
  min-height: 0;
}

.panel-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border);
}
</style>
