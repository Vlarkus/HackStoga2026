<script setup lang="ts">
import PageShell from '../components/PageShell.vue'

const usage = [
  { label: 'API Calls', used: '1,247', total: '5,000', percent: 25, color: 'var(--color-commit)' },
  { label: 'Storage', used: '128 MB', total: '1 GB', percent: 12.8, color: 'var(--color-branch)' },
  { label: 'Projects', used: '3', total: '10', percent: 30, color: 'var(--color-commit)' },
]
</script>

<template>
  <PageShell title="Account & Usage" subtitle="Manage your profile and track usage">
    <!-- Profile -->
    <div class="card" :class="$style.profileCard">
      <div :class="$style.avatar">JD</div>
      <div :class="$style.profileInfo">
        <h5 :class="$style.profileName">Jane Doe</h5>
        <span :class="$style.profileEmail">jane.doe@example.com</span>
      </div>
      <button class="btn btn--ghost" :class="$style.editBtn">Edit Profile</button>
    </div>

    <!-- Usage -->
    <div class="card">
      <h5 :class="$style.sectionTitle">Usage</h5>
      <div :class="$style.metrics">
        <div v-for="(metric, i) in usage" :key="i" :class="$style.metric">
          <div :class="$style.metricHeader">
            <span :class="$style.metricLabel">{{ metric.label }}</span>
            <span :class="$style.metricValue">{{ metric.used }} / {{ metric.total }}</span>
          </div>
          <div :class="$style.progressTrack">
            <div
              :class="$style.progressFill"
              :style="{ width: metric.percent + '%', background: metric.color }"
            />
          </div>
        </div>
      </div>
    </div>
  </PageShell>
</template>

<style module>
.profileCard {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--color-bg-float);
  border: 2px solid var(--color-branch);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--text-lg);
  color: var(--color-branch);
  flex-shrink: 0;
}

.profileInfo {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.profileName {
  font-size: var(--text-md);
}

.profileEmail {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.editBtn {
  flex-shrink: 0;
}

.sectionTitle {
  margin-bottom: var(--space-6);
  color: var(--color-branch);
  font-size: var(--text-md);
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.metric {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.metricHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metricLabel {
  font-size: var(--text-sm);
  color: var(--color-text);
}

.metricValue {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
}

.progressTrack {
  width: 100%;
  height: 6px;
  background: var(--color-bg);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progressFill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--ease-out);
}
</style>
