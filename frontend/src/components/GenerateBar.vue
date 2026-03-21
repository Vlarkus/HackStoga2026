<script setup lang="ts">
import { ref, watch } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'

const store = useProjectStore()
const branches = ref(3)
const prompt = ref('')

function decrement() {
  if (branches.value > 1) branches.value--
}
function increment() {
  if (branches.value < 4) branches.value++
}

function generate() {
  const trimmed = prompt.value.trim()
  store.generateFutures(branches.value, trimmed || undefined)
}

// Clear steering prompt when the active commit changes (covers adoptPreview + setActive)
watch(() => store.activeCommitId, () => {
  prompt.value = ''
})
</script>

<template>
  <div :class="$style.bar">
    <div :class="$style.inputWrapper">
      <label :class="$style.floatingLabel">DIRECTION</label>
      <input
        v-model="prompt"
        :class="$style.promptInput"
        :disabled="store.isGenerating"
        placeholder="steer the future…"
        spellcheck="false"
        autocomplete="off"
      />
      <div :class="$style.chip">
        <span :class="$style.chipLabel">branches: {{ branches }}</span>
        <button
          :class="$style.chipBtn"
          :disabled="branches <= 1 || store.isGenerating"
          tabindex="-1"
          @click="decrement"
        >−</button>
        <button
          :class="$style.chipBtn"
          :disabled="branches >= 4 || store.isGenerating"
          tabindex="-1"
          @click="increment"
        >+</button>
      </div>
    </div>

    <button
      :class="[$style.generateBtn, { [$style.generating]: store.isGenerating }]"
      :disabled="store.isGenerating"
      @click="generate"
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
  gap: var(--space-3);
  height: 36px;
  padding: 0 var(--space-4);
  background: var(--color-bg-float);
  font-family: var(--font-mono);
}

/* Floating-label input wrapper */
.inputWrapper {
  position: relative;
  flex: 1;
  height: 28px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  transition: border-color var(--duration-fast);
}

.inputWrapper:focus-within {
  border-color: var(--color-branch);
}

.floatingLabel {
  position: absolute;
  top: 3px;
  left: 6px;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
  pointer-events: none;
  line-height: 1;
  opacity: 0.6;
}

.promptInput {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text);
  padding: 14px 120px 2px 6px; /* top pad pushes value below label; right pad clears chip */
  caret-color: var(--color-branch);
}

.promptInput::placeholder {
  color: var(--color-text-muted);
  opacity: 0.4;
}

.promptInput:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Branches chip — lives inside the right edge of the input wrapper */
.chip {
  position: absolute;
  right: 4px;
  display: flex;
  align-items: center;
  gap: var(--space-1);
  pointer-events: auto;
}

.chipLabel {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  white-space: nowrap;
  letter-spacing: 0.05em;
}

.chipBtn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: 10px;
  cursor: pointer;
  line-height: 1;
  transition: color var(--duration-fast), border-color var(--duration-fast);
}

.chipBtn:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-branch);
}

.chipBtn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Generate button — unchanged */
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
  white-space: nowrap;
  flex-shrink: 0;
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
