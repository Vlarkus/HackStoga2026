<script setup lang="ts">
import { useProjectStore } from '../stores/useProjectStore'

const store = useProjectStore()
</script>

<template>
  <div :class="$style.root">
    <div
      :class="$style.content"
      v-html="store.previewCommit?.content"
    />
    <div :class="$style.footer" v-if="store.previewCommit">
<span :class="$style.hash">{{ store.previewCommit.hash }}</span>
      <button :class="$style.adoptBtn" @click="store.adoptPreview()">
        ADOPT
      </button>
    </div>
  </div>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  height: 100%;
  user-select: text;
}

.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-3);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text);
}

/* Reset global typography overrides */
.content :global(p) {
  max-width: none;
  margin: 0 0 var(--space-2);
}

.content :global(h1) {
  font-size: var(--text-xl);
  margin: var(--space-3) 0 var(--space-2);
}

.content :global(h2) {
  font-size: var(--text-lg);
  margin: var(--space-3) 0 var(--space-2);
}

.footer {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-float);
  flex-shrink: 0;
}

.label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  flex: 1;
}

.hash {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-branch);
  background: rgba(var(--clr-aqua-rgb), 0.08);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(var(--clr-aqua-rgb), 0.2);
}

.adoptBtn {
  padding: var(--space-1) var(--space-3);
  background: rgba(var(--clr-mustard-rgb), 0.08);
  border: 1px solid var(--color-commit);
  border-radius: var(--radius-sm);
  color: var(--color-commit);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background var(--duration-fast);
}

.adoptBtn:hover {
  background: rgba(var(--clr-mustard-rgb), 0.15);
}
</style>
