<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'
import { ArrowUp } from 'lucide-vue-next'

const store = useProjectStore()
const branches = ref(3)
const prompt = ref('')
const isFocused = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

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

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

watch(prompt, () => nextTick(autoResize))

watch(() => store.activeCommitId, () => {
  prompt.value = ''
})
</script>

<template>
  <div :class="$style.wrap">
    <div :class="[$style.box, isFocused && $style.boxFocused, store.isGenerating && $style.boxLoading]">
      <textarea
        ref="textareaRef"
        v-model="prompt"
        :class="$style.textarea"
        placeholder="steer the future…"
        :disabled="store.isGenerating"
        spellcheck="false"
        autocomplete="off"
        rows="1"
        @focus="isFocused = true"
        @blur="isFocused = false"
        @keydown.enter.exact.prevent="generate"
        @input="autoResize"
      />

      <div :class="$style.actions">
        <div :class="$style.branchChip">
          <span :class="$style.branchLabel">branches: {{ branches }}</span>
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

        <button
          :class="[$style.generateBtn, store.isGenerating && $style.generating]"
          :disabled="store.isGenerating"
          @click="generate"
        >
          <span :class="{ [$style.spin]: store.isGenerating }">◈</span>
          {{ store.isGenerating ? 'GENERATING…' : 'GENERATE' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style module>
.wrap {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-float);
  border-top: 1px solid var(--color-border);
}

.box {
  border: 1px solid var(--color-border-mid);
  border-radius: var(--radius-lg);
  background: var(--color-bg-raised);
  box-shadow: var(--shadow-card);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: border-color var(--duration-fast), box-shadow var(--duration-fast);
}

.boxFocused {
  border-color: var(--color-branch);
  box-shadow: var(--glow-branch);
}

.boxLoading {
  opacity: 0.7;
}

.textarea {
  width: 100%;
  min-height: 36px;
  max-height: 200px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text);
  line-height: 1.5;
  padding: 0;
  caret-color: var(--color-branch);
  overflow-y: auto;
}

.textarea::placeholder {
  color: var(--color-text-muted);
  opacity: 0.55;
}

.textarea:disabled {
  cursor: not-allowed;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.branchChip {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.branchLabel {
  font-family: var(--font-mono);
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
  border: 1px solid var(--color-border-mid);
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

.generateBtn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 28px;
  padding: 0 var(--space-4);
  background: rgba(var(--clr-aqua-rgb), 0.08);
  border: 1px solid var(--color-branch);
  border-radius: var(--radius-full);
  color: var(--color-branch);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background var(--duration-fast), opacity var(--duration-fast);
  white-space: nowrap;
}

.generateBtn:hover:not(:disabled) {
  background: rgba(var(--clr-aqua-rgb), 0.15);
}

.generateBtn:disabled {
  opacity: 0.5;
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
