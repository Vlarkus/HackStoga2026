<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageShell from '../components/PageShell.vue'

const router = useRouter()

const projects = [
  { name: 'Project Alpha', lastActive: 'Mar 20, 2026', branches: 4, status: 'active', badge: 'branch' },
  { name: 'Blog Post Draft v3', lastActive: 'Mar 19, 2026', branches: 2, status: 'active', badge: 'branch' },
  { name: 'API Integration — Stripe', lastActive: 'Mar 18, 2026', branches: 6, status: 'archived', badge: 'commit' },
  { name: 'Landing Page Redesign', lastActive: 'Mar 15, 2026', branches: 3, status: 'active', badge: 'branch' },
  { name: 'Database Migration — v2', lastActive: 'Mar 12, 2026', branches: 8, status: 'archived', badge: 'commit' },
  { name: 'Onboarding Flow Prototype', lastActive: 'Mar 10, 2026', branches: 1, status: 'draft', badge: 'branch' },
]

function openProject() {
  router.push('/workspace')
}

function newProject() {
  router.push('/workspace')
}
</script>

<template>
  <PageShell title="Projects" subtitle="Your workspaces and conversations">
    <button class="btn btn--primary" :class="$style.newBtn" @click="newProject">
      + New Project
    </button>

    <div
      v-for="(project, i) in projects"
      :key="i"
      class="card"
      :class="$style.item"
      @click="openProject"
    >
      <div :class="$style.info">
        <span :class="$style.name">{{ project.name }}</span>
        <span :class="$style.meta">
          <span>Last active {{ project.lastActive }}</span>
          <span :class="$style.dot">&middot;</span>
          <span>{{ project.branches }} branches</span>
        </span>
      </div>
      <span
        class="badge"
        :class="project.badge === 'commit' ? 'badge--commit' : 'badge--branch'"
      >
        {{ project.status }}
      </span>
    </div>
  </PageShell>
</template>

<style module>
.newBtn {
  width: 100%;
  padding: var(--space-4) var(--space-6);
  font-size: var(--text-base);
}

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
