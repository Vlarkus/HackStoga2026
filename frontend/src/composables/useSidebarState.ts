import { ref } from 'vue'

const collapsed = ref(true)

export function useSidebarState() {
  function expand() {
    collapsed.value = false
  }

  function collapse() {
    collapsed.value = true
  }

  return { collapsed, expand, collapse }
}
