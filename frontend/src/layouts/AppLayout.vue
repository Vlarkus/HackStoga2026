<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppSidebar from '../components/AppSidebar.vue'
import { useSidebarState } from '../composables/useSidebarState'

const _sidebar = useSidebarState()
</script>

<template>
  <div :class="$style.layout">
    <AppSidebar />
    <main :class="$style.content">
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
  margin-left: var(--sidebar-width-collapsed);
}
</style>
