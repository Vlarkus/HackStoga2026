import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(localStorage.getItem('fc-auth') === 'true')
  const user = ref<{ name: string; email: string } | null>(
    isAuthenticated.value
      ? JSON.parse(localStorage.getItem('fc-user') || 'null')
      : null
  )

  function login(email: string, _password: string) {
    const name = email.split('@')[0]
    user.value = { name, email }
    isAuthenticated.value = true
    localStorage.setItem('fc-auth', 'true')
    localStorage.setItem('fc-user', JSON.stringify(user.value))
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('fc-auth')
    localStorage.removeItem('fc-user')
  }

  return { isAuthenticated, user, login, logout }
})
