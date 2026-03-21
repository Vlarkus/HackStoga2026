<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'

const props = defineProps<{
  sourceId: string
  targetId: string
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useProjectStore()
const source = computed(() => store.commits.find(c => c.id === props.sourceId))
const target = computed(() => store.commits.find(c => c.id === props.targetId))

function handleMerge() {
  store.mergeInto(props.sourceId, props.targetId)
  emit('close')
}
</script>

<template>
  <div :class="$style.overlay" @click.self="emit('close')">
    <div :class="$style.modal">
      <h3 :class="$style.title">MERGE BRANCHES</h3>

      <div :class="$style.columns">
        <div :class="$style.column">
          <div :class="$style.columnHeader">
            <span :class="$style.columnLabel">SOURCE</span>
            <span :class="$style.branchName">{{ source?.label ?? '—' }}</span>
          </div>
          <div :class="$style.columnContent" v-html="source?.content ?? ''" />
        </div>

        <div :class="$style.divider">
          <span :class="$style.arrow">&rarr;</span>
        </div>

        <div :class="$style.column">
          <div :class="$style.columnHeader">
            <span :class="$style.columnLabel">TARGET</span>
            <span :class="$style.branchName">{{ target?.label ?? '—' }}</span>
          </div>
          <div :class="$style.columnContent" v-html="target?.content ?? ''" />
        </div>
      </div>

      <div :class="$style.actions">
        <button :class="$style.cancelBtn" @click="emit('close')">CANCEL</button>
        <button :class="$style.mergeBtn" @click="handleMerge">APPROVE MERGE</button>
      </div>
    </div>
  </div>
</template>

<style module>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.modal {
  width: 680px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-float);
  overflow: hidden;
}

.title {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--clr-green-bright);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-float);
  margin: 0;
}

.columns {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.columnHeader {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-float);
}

.columnLabel {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}

.branchName {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--clr-green-bright);
  background: rgba(157, 217, 210, 0.08);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(157, 217, 210, 0.2);
}

.columnContent {
  flex: 1;
  padding: var(--space-4);
  overflow-y: auto;
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text);
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  flex-shrink: 0;
  border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border);
  background: var(--color-bg-float);
}

.arrow {
  font-size: var(--text-lg);
  color: var(--clr-green-bright);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-float);
}

.cancelBtn {
  padding: var(--space-2) var(--space-4);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: color var(--duration-fast), border-color var(--duration-fast);
}

.cancelBtn:hover {
  color: var(--color-text);
  border-color: var(--color-text-muted);
}

.mergeBtn {
  padding: var(--space-2) var(--space-4);
  background: rgba(157, 217, 210, 0.08);
  border: 1px solid var(--clr-green-bright);
  border-radius: var(--radius-sm);
  color: var(--clr-green-bright);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background var(--duration-fast);
}

.mergeBtn:hover {
  background: rgba(157, 217, 210, 0.15);
}
</style>
