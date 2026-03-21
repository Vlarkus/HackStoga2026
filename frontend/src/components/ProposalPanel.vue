<script setup lang="ts">
import { computed } from 'vue'
import { useProjectStore } from '../stores/useProjectStore'

const store = useProjectStore()

const proposals = computed(() => store.proposals ?? [])

function sourceLabel(sourceId: string): string {
  const commit = store.commits.find(c => c.id === sourceId)
  return commit?.label ?? sourceId
}

function targetLabel(targetId: string): string {
  const commit = store.commits.find(c => c.id === targetId)
  return commit?.label ?? targetId
}
</script>

<template>
  <div :class="$style.root">
    <div v-if="proposals.length === 0" :class="$style.empty">
      No proposals yet
    </div>

    <div
      v-for="proposal in proposals"
      :key="proposal.id"
      :class="$style.card"
    >
      <div :class="$style.summary">{{ proposal.summary }}</div>
      <div :class="$style.meta">
        <span :class="$style.branch">{{ sourceLabel(proposal.sourceId) }}</span>
        <span :class="$style.arrow">&rarr;</span>
        <span :class="$style.branch">{{ targetLabel(proposal.targetId) }}</span>
      </div>
      <div :class="$style.footer">
        <span
          :class="[
            $style.badge,
            proposal.status === 'open' && $style.badgeOpen,
            proposal.status === 'approved' && $style.badgeApproved,
            proposal.status === 'rejected' && $style.badgeRejected,
          ]"
        >
          {{ proposal.status.toUpperCase() }}
        </span>
        <div v-if="proposal.status === 'open'" :class="$style.actions">
          <button :class="$style.approveBtn" @click="store.approveProposal(proposal.id)">
            APPROVE
          </button>
          <button :class="$style.rejectBtn" @click="store.rejectProposal(proposal.id)">
            REJECT
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style module>
.root {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
  overflow-y: auto;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.card {
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg-float);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.summary {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text);
  margin-bottom: var(--space-2);
  line-height: 1.5;
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.branch {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--clr-aqua);
  background: rgba(157, 217, 210, 0.08);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(157, 217, 210, 0.2);
}

.arrow {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.badge {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  border: 1px solid currentColor;
}

.badgeOpen {
  color: var(--clr-aqua);
  background: rgba(157, 217, 210, 0.08);
}

.badgeApproved {
  color: #4caf50;
  background: rgba(76, 175, 80, 0.08);
}

.badgeRejected {
  color: var(--clr-orange);
  background: rgba(255, 107, 53, 0.08);
}

.actions {
  display: flex;
  gap: var(--space-2);
}

.approveBtn {
  padding: var(--space-1) var(--space-3);
  background: rgba(76, 175, 80, 0.08);
  border: 1px solid #4caf50;
  border-radius: var(--radius-sm);
  color: #4caf50;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background var(--duration-fast);
}

.approveBtn:hover {
  background: rgba(76, 175, 80, 0.15);
}

.rejectBtn {
  padding: var(--space-1) var(--space-3);
  background: rgba(255, 107, 53, 0.08);
  border: 1px solid var(--clr-orange);
  border-radius: var(--radius-sm);
  color: var(--clr-orange);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: background var(--duration-fast);
}

.rejectBtn:hover {
  background: rgba(255, 107, 53, 0.15);
}
</style>
