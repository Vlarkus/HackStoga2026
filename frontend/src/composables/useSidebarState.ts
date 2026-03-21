import { ref } from 'vue'

const collapsed = ref(localStorage.getItem('fc-sidebar-collapsed') !== 'false')

export function useSidebarState() {
  function toggle() {
    collapsed.value = !collapsed.value
    localStorage.setItem('fc-sidebar-collapsed', String(collapsed.value))
  }

  return { collapsed, toggle }
}
