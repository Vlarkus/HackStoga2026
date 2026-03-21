# GenerateBar Inline Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an always-visible, optional user-prompt input to `GenerateBar.vue` that steers AI future-commit generation, using a floating-label design with an integrated branch-count chip.

**Architecture:** Three files change — `ai.ts` gains an optional `userPrompt` param that injects direction into the Gemini prompt; `useProjectStore.ts` threads that param from the action through to the AI call; `GenerateBar.vue` is redesigned with a floating-label `<input>` that fills the bar, a `branches: N −/+` chip inside the input's right edge, and a watcher that clears the prompt when the active commit changes.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Pinia, TypeScript, CSS Modules, Gemini 2.0 Flash via `@google/generative-ai`

---

## File Map

- Modify: `frontend/src/ai.ts` — add optional `userPrompt?: string` param to `generateFuturePredictions`
- Modify: `frontend/src/stores/useProjectStore.ts` — add optional `userPrompt?: string` param to `generateFutures` action, pass through to `generateFuturePredictions`
- Modify: `frontend/src/components/GenerateBar.vue` — redesign with floating-label input, branches chip, prompt state, activeCommitId watcher

---

## Task 1: Extend `ai.ts` with optional user prompt

**Files:**
- Modify: `frontend/src/ai.ts`

- [ ] **Step 1: Add `userPrompt` param to `generateFuturePredictions`**

Open `frontend/src/ai.ts`. Change the function signature and prompt assembly:

```typescript
export async function generateFuturePredictions(
  text: string,
  count: number,
  userPrompt?: string,
): Promise<FuturePrediction[]> {
  const m = getModel()

  const directionLine = userPrompt?.trim()
    ? `\nThe user wants the futures to go in this direction: ${userPrompt.trim()}`
    : ''

  const prompt = `You are a creative writing assistant for a version-control app called "Future-Commit".
Given the following text, predict ${count} distinct and creative directions it could evolve next.
Each prediction should be a short continuation (1-3 sentences).
Give each one a brief label (2-4 words).${directionLine}

Text:
"""
${text}
"""

Respond ONLY with a JSON array, no markdown fences, no extra text:
[{"label": "short label", "content": "continuation text"}, ...]`

  const result = await m.generateContent(prompt)
  const raw = result.response.text().trim()

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  const parsed: FuturePrediction[] = JSON.parse(cleaned)
  return parsed.slice(0, count)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `HackStoga2026/`:
```bash
npx vue-tsc --noEmit --project frontend/tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/ai.ts
git commit -m "feat: add optional userPrompt param to generateFuturePredictions"
```

---

## Task 2: Thread `userPrompt` through the store action

**Files:**
- Modify: `frontend/src/stores/useProjectStore.ts`

- [ ] **Step 1: Add `userPrompt` param to `generateFutures`**

In `frontend/src/stores/useProjectStore.ts`, update the `generateFutures` action signature and the call to `generateFuturePredictions`:

```typescript
async generateFutures(count: number, userPrompt?: string) {
  this.isGenerating = true

  const activeCommit = this.commits.find(c => c.id === this.activeCommitId)!
  const maxLane = Math.max(...this.commits.map(c => c.lane))
  const maxColumn = Math.max(...this.commits.map(c => c.column))
  const newColumn = maxColumn + 1

  const plainText = activeCommit.content.replace(/<[^>]*>/g, ' ').trim()

  let predictions: Array<{ label: string; content: string }>

  try {
    predictions = await generateFuturePredictions(plainText, count, userPrompt)
  } catch {
    // Fallback to mock pool — userPrompt is ignored in fallback path
    await delay(400)
    predictions = []
    for (let i = 0; i < count; i++) {
      const poolItem = MOCK_POOL[poolIndex % MOCK_POOL.length]
      poolIndex++
      predictions.push({ label: poolItem.label, content: poolItem.text })
    }
  }

  for (let i = 0; i < predictions.length; i++) {
    const pred = predictions[i]
    this.commits.push({
      id: `future-${Date.now()}-${i}`,
      label: pred.label,
      hash: Math.random().toString(16).slice(2, 8),
      type: 'future',
      parents: [activeCommit.id],
      lane: maxLane + 1 + i,
      column: newColumn,
      content: activeCommit.content + '<p>' + pred.content + '</p>',
    })
  }

  this.isGenerating = false
},
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx vue-tsc --noEmit --project frontend/tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/useProjectStore.ts
git commit -m "feat: thread userPrompt through generateFutures store action"
```

---

## Task 3: Redesign `GenerateBar.vue` with floating-label prompt input

**Files:**
- Modify: `frontend/src/components/GenerateBar.vue`

- [ ] **Step 1: Replace the script block**

Replace the entire `<script setup>` block:

```vue
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
```

- [ ] **Step 2: Replace the template block**

```vue
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
```

- [ ] **Step 3: Replace the style block**

```vue
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
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx vue-tsc --noEmit --project frontend/tsconfig.json
```
Expected: no errors.

- [ ] **Step 5: Manual smoke test**

Run `npm run dev` from `HackStoga2026/`. Open `http://localhost:5173`.

Verify:
1. GenerateBar shows the floating `DIRECTION` label, the prompt input, and `branches: 3 − +` chip on the right edge of the input
2. `−` and `+` chip buttons change the number between 1 and 4
3. Typing in the input and clicking GENERATE — check network tab or console that the AI call includes the prompt direction
4. Click GENERATE with empty input — behavior matches before (deterministic fallback or API)
5. After adopting a future branch, the prompt input clears

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/GenerateBar.vue
git commit -m "feat: redesign GenerateBar with floating-label prompt input and branches chip"
```
