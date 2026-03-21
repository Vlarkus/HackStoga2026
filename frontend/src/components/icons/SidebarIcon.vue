<script setup lang="ts">
defineProps<{
  name: string
  size?: number
}>()
</script>

<template>
  <svg
    :width="size ?? 20"
    :height="size ?? 20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- workspace: 2x2 grid -->
    <template v-if="name === 'workspace'">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </template>

    <!-- history: clock -->
    <template v-else-if="name === 'history'">
      <circle cx="10" cy="10" r="8" />
      <polyline points="10,5 10,10 13.5,13.5" />
    </template>

    <!-- api: code brackets -->
    <template v-else-if="name === 'api'">
      <polyline points="6,4 2,10 6,16" />
      <polyline points="14,4 18,10 14,16" />
      <line x1="12" y1="3" x2="8" y2="17" />
    </template>

    <!-- cli: terminal -->
    <template v-else-if="name === 'cli'">
      <polyline points="4,7 8,10 4,13" />
      <line x1="10" y1="14" x2="16" y2="14" />
      <rect x="1" y="3" width="18" height="14" rx="2" />
    </template>

    <!-- settings: gear -->
    <template v-else-if="name === 'settings'">
      <circle cx="10" cy="10" r="3" />
      <path d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M16 4l-1.4 1.4M5.4 14.6L4 16M16 16l-1.4-1.4M5.4 5.4L4 4" />
    </template>

    <!-- account: user circle -->
    <template v-else-if="name === 'account'">
      <circle cx="10" cy="8" r="3.5" />
      <path d="M3 17.5c0-3 3.1-5.5 7-5.5s7 2.5 7 5.5" />
    </template>

    <!-- collapse: chevron left -->
    <template v-else-if="name === 'collapse'">
      <polyline points="13,4 7,10 13,16" />
    </template>

    <!-- logout: arrow right from bracket -->
    <template v-else-if="name === 'logout'">
      <path d="M8 17H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
      <polyline points="13,7 17,10 13,13" />
      <line x1="17" y1="10" x2="7" y2="10" />
    </template>
  </svg>
</template>
