<script setup lang="ts">
import { useProjectStore } from '../stores/useProjectStore'

const store = useProjectStore()
</script>

<template>
  <header :class="$style.bar">
    <div :class="$style.left">
      <nav :class="$style.breadcrumb">
        <button :class="$style.crumb" :title="'Switch project'">
          {{ store.projectName }}
        </button>
        <span :class="$style.sep">/</span>
        <button :class="$style.crumb" :title="'Switch branch'">
          {{ store.branchName }}
        </button>
        <span :class="$style.sep">/</span>
        <span :class="$style.crumbFile">{{ store.fileName }}</span>
      </nav>
    </div>

    <div :class="$style.center">
      <span :class="$style.indicator">
        <span :class="$style.dot" />
        {{ store.activeCommit?.hash?.slice(0, 7) ?? '-------' }}
      </span>
      <span :class="$style.sep">/</span>
      <span :class="$style.label">{{ store.activeCommit?.label ?? 'untitled' }}</span>
    </div>

    <div :class="$style.right">
      <span :class="$style.meta">{{ store.commits.length }} nodes</span>
    </div>
  </header>
</template>

<style module>
.bar {
  position: sticky;
  top: 0;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-6);
  background: var(--color-bg-raised);
  border-bottom: 1px solid var(--color-border);
  z-index: 100;
}

.left, .center, .right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.crumb {
  background: none;
  border: none;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-branch);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}

.crumb:hover {
  background: rgba(157, 217, 210, 0.1);
  color: var(--color-text);
}

.crumbFile {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.indicator {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-commit);
  background: rgba(254, 215, 102, 0.08);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-commit);
  box-shadow: var(--glow-commit);
}

.sep {
  color: var(--color-text-faint);
  font-size: var(--text-xs);
}

.label {
  font-size: var(--text-sm);
  color: var(--color-text);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
</style>
