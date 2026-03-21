<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router'
import SidebarIcon from './icons/SidebarIcon.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useAuthStore } from '../stores/useAuthStore'

const { collapsed, expand, collapse } = useSidebarState()
const auth = useAuthStore()
const router = useRouter()

const navMain = [
  { to: '/workspace', icon: 'workspace', label: 'Workspace' },
  { to: '/projects', icon: 'history', label: 'Projects' },
  { to: '/api', icon: 'api', label: 'API' },
  { to: '/cli', icon: 'cli', label: 'CLI' },
]

const navBottom = [
  { to: '/settings', icon: 'settings', label: 'Settings' },
  { to: '/account', icon: 'account', label: 'Account' },
]

function handleLogout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <aside
    :class="[$style.sidebar, collapsed ? $style.collapsed : $style.expanded]"
    @mouseenter="expand"
    @mouseleave="collapse"
  >
    <!-- Logo -->
    <div :class="$style.logoWrap">
      <span v-if="collapsed" :class="$style.logoShort">FC</span>
      <span v-else :class="$style.logoFull">FUTURE<span :class="$style.logoAccent">COMMIT</span></span>
    </div>

    <!-- New Project -->
    <div :class="$style.newProjectWrap">
      <RouterLink to="/workspace" :class="$style.newProjectBtn">
        <span :class="$style.newProjectIcon">+</span>
        <span :class="[$style.navLabel, collapsed && $style.navLabelHidden]">New Project</span>
      </RouterLink>
    </div>

    <!-- Main nav -->
    <nav :class="$style.nav">
      <RouterLink
        v-for="item in navMain"
        :key="item.to"
        :to="item.to"
        v-slot="{ isExactActive }"
        custom
      >
        <RouterLink :to="item.to" :class="[$style.navItem, isExactActive && $style.navItemActive]">
          <span :class="$style.navIcon"><SidebarIcon :name="item.icon" /></span>
          <span :class="[$style.navLabel, collapsed && $style.navLabelHidden]">{{ item.label }}</span>
        </RouterLink>
      </RouterLink>
    </nav>

    <hr :class="$style.divider" />

    <!-- Bottom nav -->
    <nav :class="$style.navBottom">
      <RouterLink
        v-for="item in navBottom"
        :key="item.to"
        :to="item.to"
        v-slot="{ isExactActive }"
        custom
      >
        <RouterLink :to="item.to" :class="[$style.navItem, isExactActive && $style.navItemActive]">
          <span :class="$style.navIcon"><SidebarIcon :name="item.icon" /></span>
          <span :class="[$style.navLabel, collapsed && $style.navLabelHidden]">{{ item.label }}</span>
        </RouterLink>
      </RouterLink>
    </nav>

    <!-- Footer actions -->
    <div :class="$style.footer">
      <button :class="$style.navItem" @click="handleLogout">
        <span :class="$style.navIcon"><SidebarIcon name="logout" /></span>
        <span :class="[$style.navLabel, collapsed && $style.navLabelHidden]">Logout</span>
      </button>
    </div>
  </aside>
</template>

<style module>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100dvh;
  background: var(--color-bg-raised);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 200;
  transition: width var(--duration-slow) var(--ease-out);
}

.collapsed {
  width: var(--sidebar-width-collapsed);
}

.expanded {
  width: var(--sidebar-width);
}

.logoWrap {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-4);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.logoShort {
  font-family: var(--font-display);
  font-size: var(--text-md);
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--color-commit);
}

.logoFull {
  font-family: var(--font-display);
  font-size: var(--text-sm);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.logoAccent {
  color: var(--color-commit);
}

.newProjectWrap {
  padding: var(--space-3) var(--space-3);
  flex-shrink: 0;
}

.newProjectBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--color-commit);
  color: var(--clr-evergreen, #041b15);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              box-shadow var(--duration-fast) var(--ease-out);
  white-space: nowrap;
  overflow: hidden;
}

.newProjectBtn:hover {
  background: var(--color-commit-dim);
  box-shadow: var(--glow-commit);
  color: var(--clr-evergreen, #041b15);
}

.newProjectIcon {
  font-size: var(--text-md);
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1;
}

.nav {
  display: flex;
  flex-direction: column;
  padding: var(--space-3) 0;
  flex: 1;
}

.navBottom {
  display: flex;
  flex-direction: column;
  padding: var(--space-3) 0;
}

.divider {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 0 var(--space-3);
}

.navItem {
  display: flex;
  align-items: center;
  height: 48px;
  gap: var(--space-3);
  padding: 0 var(--space-5);
  color: var(--color-text-muted);
  text-decoration: none;
  background: none;
  border: none;
  border-left: 3px solid transparent;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
}

.navItem:hover {
  background: rgba(157, 217, 210, 0.06);
}

.navItemActive {
  border-left-color: var(--color-commit);
  color: var(--color-text);
}

.navIcon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.collapseIcon {
  transition: transform var(--duration-slow) var(--ease-out);
}

.collapseIconRotated {
  transform: rotate(180deg);
}

.navLabel {
  overflow: hidden;
  transition: opacity var(--duration-base) var(--ease-out),
              width var(--duration-base) var(--ease-out);
}

.navLabelHidden {
  opacity: 0;
  width: 0;
}

.footer {
  display: flex;
  flex-direction: column;
  padding: var(--space-3) 0;
  border-top: 1px solid var(--color-border);
  flex-shrink: 0;
}
</style>
