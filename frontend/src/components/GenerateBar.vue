<script setup lang="ts">
import { ref } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'
import { DEFAULT_SYSTEM_PROMPT } from '../ai'

const store = useProjectStore()
const branches = ref(3)
const depth = ref(2)
const userPrompt = ref('')

function decBranches() { if (branches.value > 1) branches.value-- }
function incBranches() { if (branches.value < 4) branches.value++ }
function decDepth() { if (depth.value > 1) depth.value-- }
function incDepth() { if (depth.value < 5) depth.value++ }

function generate() {
  store.generateFutures({
    branches: branches.value,
    depth: depth.value,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    userPrompt: userPrompt.value || 'Continue the text in an interesting direction',
  })
}
</script>

<template>
  <div :class="$style.bar">
    <!-- User prompt -->
    <textarea
      :class="$style.promptInput"
      v-model="userPrompt"
      placeholder="Direction for AI generation..."
      :disabled="store.isGenerating"
      rows="1"
    />

    <!-- Branch counter -->
    <label :class="$style.label">Branches</label>
    <div :class="$style.counter">
      <button :class="$style.counterBtn" :disabled="branches <= 1 || store.isGenerating" @click="decBranches">−</button>
      <span :class="$style.countDisplay">{{ branches }}</span>
      <button :class="$style.counterBtn" :disabled="branches >= 4 || store.isGenerating" @click="incBranches">+</button>
    </div>

    <!-- Depth counter -->
    <label :class="$style.label">Depth</label>
    <div :class="$style.counter">
      <button :class="$style.counterBtn" :disabled="depth <= 1 || store.isGenerating" @click="decDepth">−</button>
      <span :class="$style.countDisplay">{{ depth }}</span>
      <button :class="$style.counterBtn" :disabled="depth >= 5 || store.isGenerating" @click="incDepth">+</button>
    </div>

    <!-- Generate button -->
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
  gap: var(--space-4);
  height: 36px;
  padding: 0 var(--space-4);
  background: var(--color-bg-float);
  font-family: var(--font-mono);
}

.label {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  white-space: nowrap;
}

.promptInput {
  flex: 1;
  min-width: 120px;
  max-width: 300px;
  padding: var(--space-1) var(--space-2);
  background: var(--color-bg-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  resize: none;
  outline: none;
  transition: border-color var(--duration-fast);
}

.promptInput:focus {
  border-color: var(--color-branch);
}

.promptInput:disabled {
  opacity: 0.5;
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
