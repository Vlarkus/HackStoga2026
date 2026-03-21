<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div :class="$style.page">
    <header :class="$style.header">
      <h4 :class="$style.title">{{ title }}</h4>
      <p v-if="subtitle" :class="$style.subtitle">{{ subtitle }}</p>
    </header>
    <div :class="$style.body">
      <slot />
    </div>
  </div>
</template>

<style module>
.page {
  padding: var(--space-8);
  max-width: 960px;
  height: 100%;
  margin-inline: auto;
}

.header {
  margin-bottom: var(--space-8);
}

.title {
  font-family: var(--font-display);
  font-weight: 700;
}

.subtitle {
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  margin-top: var(--space-2);
}

.body {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
</style>
