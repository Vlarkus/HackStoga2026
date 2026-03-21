<script setup lang="ts">
</script>

<template>
  <header :class="$style.taskbar">
    <div :class="$style.brand">
      <img
        src="/images/forkcast-avatar-base.png"
        alt="ForkCast"
        :class="$style.avatar"
      />
      <span :class="$style.brandName">ForkCast</span>
    </div>
    <nav :class="$style.nav">
      <span :class="$style.navItem">Workspace</span>
    </nav>
  </header>
</template>

<style module>
.taskbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: var(--color-bg-raised);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  z-index: 1000;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.brandName {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-commit);
  letter-spacing: -0.02em;
}

.nav {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.navItem {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
</style>
