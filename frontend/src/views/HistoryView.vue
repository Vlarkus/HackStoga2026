<script setup lang="ts">
import PageShell from '../components/PageShell.vue'

const sessions = [
  { name: 'Project Alpha — Sprint Planning', date: 'Mar 20, 2026', commits: 12, status: 'merged', badge: 'commit' },
  { name: 'Blog Post Draft v3', date: 'Mar 19, 2026', commits: 7, status: 'active', badge: 'branch' },
  { name: 'API Integration — Stripe Webhooks', date: 'Mar 18, 2026', commits: 23, status: 'merged', badge: 'commit' },
  { name: 'Landing Page Redesign', date: 'Mar 15, 2026', commits: 9, status: 'active', badge: 'branch' },
  { name: 'Database Migration — v2 Schema', date: 'Mar 12, 2026', commits: 31, status: 'merged', badge: 'commit' },
  { name: 'Onboarding Flow Prototype', date: 'Mar 10, 2026', commits: 5, status: 'draft', badge: 'branch' },
]
</script>

<template>
  <PageShell title="History" subtitle="Previous sessions and conversations">
    <div
      v-for="(session, i) in sessions"
      :key="i"
      class="card"
      :class="$style.item"
    >
      <div :class="$style.info">
        <span :class="$style.name">{{ session.name }}</span>
        <span :class="$style.meta">
          <span>{{ session.date }}</span>
          <span :class="$style.dot">·</span>
          <span>{{ session.commits }} commits</span>
        </span>
      </div>
      <span
        class="badge"
        :class="session.badge === 'commit' ? 'badge--commit' : 'badge--branch'"
      >
        {{ session.status }}
      </span>
    </div>
  </PageShell>
</template>

<style module>
.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: border-color var(--duration-base) var(--ease-out),
              box-shadow var(--duration-base) var(--ease-out);
}

.item:hover {
  border-color: var(--color-branch-dim, var(--color-branch));
  box-shadow: var(--glow-branch);
}

.info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-base);
}

.meta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.dot {
  margin-inline: var(--space-2);
}
</style>
