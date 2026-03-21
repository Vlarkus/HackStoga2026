<template>
  <div class="overlay" :class="{ active: active, fading: fading }">
    <!-- Phase 1: glitch noise blocks -->
    <div class="glitch-layer" :class="{ on: phase >= 1 }">
      <canvas ref="glitchCanvas" class="glitch-canvas" />
    </div>

    <!-- Phase 2: hex character rain -->
    <canvas ref="rainCanvas" class="rain-canvas" :class="{ on: phase >= 2 }" :style="{ opacity: rainOpacity }" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{ active: boolean }>();
const router = useRouter();
const phase = ref(0);
const fading = ref(false);
const glitchCanvas = ref<HTMLCanvasElement | null>(null);
const rainCanvas = ref<HTMLCanvasElement | null>(null);

let glitchRaf = 0;
let rainRaf = 0;
let rainOpacity = ref(1);
const timers: ReturnType<typeof setTimeout>[] = [];

// ── Glitch noise ──────────────────────────────────────────────────────────────
function runGlitch() {
  const canvas = glitchCanvas.value;
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d')!;
  const COLORS = ['#041b15', '#0a2e23', '#9dd9d2', '#fed766', '#ff6b35', '#041b15', '#041b15'];

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const count = 18 + Math.floor(Math.random() * 24);
    for (let i = 0; i < count; i++) {
      const w = 20 + Math.random() * 220;
      const h = 2  + Math.random() * 28;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillStyle = COLORS[Math.floor(Math.random() * COLORS.length)];
      ctx.globalAlpha = 0.4 + Math.random() * 0.6;
      ctx.fillRect(x, y, w, h);
    }
    ctx.globalAlpha = 1;
    glitchRaf = requestAnimationFrame(frame);
  }
  frame();
}

function stopGlitch() {
  cancelAnimationFrame(glitchRaf);
  const canvas = glitchCanvas.value;
  if (canvas) canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
}

// ── Hex rain ──────────────────────────────────────────────────────────────────
const HEX = '0123456789ABCDEF';
interface Drop { x: number; y: number; speed: number; trail: number }

function runRain() {
  const canvas = rainCanvas.value;
  if (!canvas) return;
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d')!;

  const FONT_SIZE = 13;
  const COLS = Math.floor(canvas.width / FONT_SIZE);
  const drops: Drop[] = Array.from({ length: COLS }, (_, i) => ({
    x: i * FONT_SIZE,
    y: -Math.random() * canvas.height,
    speed: 0.8 + Math.random() * 2.2,
    trail: 6 + Math.floor(Math.random() * 14),
  }));

  function frame() {
    ctx.fillStyle = 'rgba(4, 27, 21, 0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `bold ${FONT_SIZE}px "Space Mono", monospace`;

    for (const drop of drops) {
      for (let t = drop.trail; t >= 0; t--) {
        const cy = drop.y - t * FONT_SIZE;
        if (cy < 0 || cy > canvas.height) continue;
        if (t === 0) {
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#9dd9d2';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = `rgba(157, 217, 210, ${(1 - t / drop.trail) * 0.85})`;
          ctx.shadowBlur = 0;
        }
        ctx.fillText(HEX[Math.floor(Math.random() * HEX.length)], drop.x, cy);
      }
      ctx.shadowBlur = 0;
      drop.y += drop.speed * FONT_SIZE * 0.5;
      if (drop.y - drop.trail * FONT_SIZE > canvas.height) {
        drop.y = -FONT_SIZE;
        drop.speed = 0.8 + Math.random() * 2.2;
      }
    }

    rainRaf = requestAnimationFrame(frame);
  }
  frame();
}

function fadeOutRain(duration: number): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();
    function step(now: number) {
      const t = Math.min((now - start) / duration, 1);
      rainOpacity.value = 1 - t;
      if (t < 1) requestAnimationFrame(step);
      else resolve();
    }
    requestAnimationFrame(step);
  });
}

function stopRain() {
  cancelAnimationFrame(rainRaf);
}

function reset() {
  phase.value = 0;
  fading.value = false;
  rainOpacity.value = 1;
  stopGlitch();
  stopRain();
  timers.forEach(clearTimeout);
  timers.length = 0;
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
watch(() => props.active, (val) => {
  if (!val) { reset(); return; }

  phase.value = 1;
  runGlitch();

  // Glitch → rain
  timers.push(setTimeout(() => {
    stopGlitch();
    rainOpacity.value = 1;
    phase.value = 2;
    runRain();
  }, 400));

  // Rain fades out over 600ms, then navigate, then overlay fades to reveal app
  timers.push(setTimeout(async () => {
    await fadeOutRain(600);   // rain smoothly disappears → dark screen
    stopRain();
    router.push('/app');      // app loads behind dark overlay
    await new Promise(r => setTimeout(r, 200)); // tiny buffer for route render
    fading.value = true;      // dark overlay fades out → app revealed
  }, 1700));

  // Cleanup after overlay fade completes (1000ms transition)
  timers.push(setTimeout(() => {
    reset();
  }, 1400 + 600 + 200 + 1000 + 100));
});

onUnmounted(() => {
  stopGlitch();
  stopRain();
  timers.forEach(clearTimeout);
});
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0;
  background: var(--clr-evergreen);
  transition: opacity 60ms;
}
.overlay.active {
  pointer-events: all;
  opacity: 1;
}
.overlay.fading {
  opacity: 0;
  transition: opacity 1000ms cubic-bezier(0.65, 0, 0.35, 1);
  pointer-events: none;
}

.glitch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.glitch-layer {
  position: absolute;
  inset: 0;
  opacity: 0;
}
.glitch-layer.on { opacity: 1; }

.rain-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 150ms;
}
.rain-canvas.on { opacity: 1; }
</style>
