<script setup lang="ts">
import PageShell from '../components/PageShell.vue'

const endpoints = [
  { method: 'POST', path: '/v1/predict', desc: 'Generate future branch predictions from document content.', badge: 'badge--commit' },
  { method: 'GET', path: '/v1/projects', desc: 'List all projects associated with the authenticated account.', badge: 'badge--branch' },
  { method: 'GET', path: '/v1/history', desc: 'Retrieve session history and commit timelines.', badge: 'badge--branch' },
  { method: 'POST', path: '/v1/adopt', desc: 'Adopt a predicted branch and merge it into the main timeline.', badge: 'badge--commit' },
]
</script>

<template>
  <PageShell title="API Reference" subtitle="Integrate FutureCommit into your workflow">
    <!-- Quick Start -->
    <div class="card">
      <h5 :class="$style.sectionTitle">Quick Start</h5>
      <p :class="$style.desc">Make your first prediction with a single request:</p>
      <pre :class="$style.codeBlock">curl -X POST https://api.futurecommit.dev/v1/predict \
  -H "Authorization: Bearer fc_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"content": "Your document text...", "branches": 3}'</pre>
    </div>

    <!-- Endpoints -->
    <h5 :class="$style.endpointsHeading">Endpoints</h5>
    <div
      v-for="(ep, i) in endpoints"
      :key="i"
      class="card"
      :class="$style.endpoint"
    >
      <div :class="$style.endpointHeader">
        <span class="badge" :class="ep.badge">{{ ep.method }}</span>
        <code :class="$style.path">{{ ep.path }}</code>
      </div>
      <p :class="$style.endpointDesc">{{ ep.desc }}</p>
    </div>
  </PageShell>
</template>

<style module>
.sectionTitle {
  margin-bottom: var(--space-4);
  color: var(--color-branch);
  font-size: var(--text-md);
}

.desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.codeBlock {
  font-size: var(--text-sm);
  line-height: 1.7;
  color: var(--color-commit);
}

.endpointsHeading {
  font-size: var(--text-md);
  color: var(--color-text);
  font-family: var(--font-display);
}

.endpoint {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: border-color var(--duration-base) var(--ease-out);
}

.endpoint:hover {
  border-color: var(--color-border-mid, var(--color-border));
}

.endpointHeader {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.path {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  color: var(--color-text);
}

.endpointDesc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>
