<script setup lang="ts">
import { ref } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'

const store = useProjectStore()
const count = ref(3)

function decrement() {
  if (count.value > 1) count.value--
}
function increment() {
  if (count.value < 4) count.value++
}
</script>

<template>
  <div :class="$style.bar">
    <div :class="$style.counter">
      <button
        :class="$style.counterBtn"
        :disabled="count <= 1 || store.isGenerating"
        @click="decrement"
      >−</button>
      <span :class="$style.countDisplay">{{ count }}</span>
      <button
        :class="$style.counterBtn"
        :disabled="count >= 4 || store.isGenerating"
        @click="increment"
      >+</button>
    </div>

    <button
      :class="[$style.generateBtn, { [$style.generating]: store.isGenerating }]"
      :disabled="store.isGenerating"
      @click="store.generateFutures(count)"
    >
      <span :class="{ [$style.spin]: store.isGenerating }">◈</span>
      {{ store.isGenerating ? 'GENERATING…' : 'GENERATE' }}
    </button>
  </div>
</template>

<style module>
.bar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: 36px;
  padding: 0 var(--space-4);
  background: var(--color-bg-float);
  border-top: 1px solid var(--color-border);
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  font-family: var(--font-mono);
}

.counter {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.counterBtn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  cursor: pointer;
  line-height: 1;
  transition: color var(--duration-fast), border-color var(--duration-fast);
}

.counterBtn:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-branch);
}

.counterBtn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.countDisplay {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text);
  min-width: 12px;
  text-align: center;
}

.generateBtn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-4);
  background: rgba(157, 217, 210, 0.08);
  border: 1px solid var(--color-branch);
  border-radius: var(--radius-sm);
  color: var(--color-branch);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background var(--duration-fast), opacity var(--duration-fast);
}

.generateBtn:hover:not(:disabled) {
  background: rgba(157, 217, 210, 0.15);
}

.generateBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.generating {
  opacity: 0.7;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  display: inline-block;
  animation: spin 1s linear infinite;
}
</style>
