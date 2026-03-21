<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '../components/AppSidebar.vue'
import { useSidebarState } from '../composables/useSidebarState'

const { collapsed } = useSidebarState()
</script>

<template>
  <div :class="$style.layout">
    <AppSidebar />
    <main :class="[$style.content, collapsed ? $style.contentCollapsed : $style.contentExpanded]">
      <RouterView />
    </main>
  </div>
</template>

<style module>
.layout {
  min-height: 100dvh;
}

.content {
  min-height: 100dvh;
  transition: margin-left var(--duration-slow) var(--ease-out);
}

.contentCollapsed {
  margin-left: var(--sidebar-width-collapsed);
}

.contentExpanded {
  margin-left: var(--sidebar-width);
}
</style>
