<script setup lang="ts">
</script>

<template>
  <main :class="$style.home">
    <h1 :class="$style.title">HackStoga 2026</h1>
    <p :class="$style.subtitle">Let's build something.</p>
  </main>
</template>

<style module>
.home {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: var(--spacing-md);
}

.title {
  font-size: 3rem;
  font-weight: 700;
  color: var(--color-primary);
}

.subtitle {
  font-size: 1.25rem;
  color: var(--color-text);
  opacity: 0.7;
}
</style>
