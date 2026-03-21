<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/useAuthStore'

const email = ref('')
const password = ref('')
const auth = useAuthStore()
const router = useRouter()

function handleSubmit() {
  auth.login(email.value, password.value)
  router.push('/workspace')
}
</script>

<template>
  <div :class="$style.page">
    <form :class="$style.card" @submit.prevent="handleSubmit">
      <div :class="$style.logo">FUTURE<span :class="$style.logoAccent">COMMIT</span></div>
      <p :class="$style.subtitle">Sign in to your workspace</p>

      <label :class="$style.field">
        <span :class="$style.fieldLabel">Email</span>
        <input
          v-model="email"
          type="email"
          placeholder="you@example.com"
          required
          autocomplete="email"
        />
      </label>

      <label :class="$style.field">
        <span :class="$style.fieldLabel">Password</span>
        <input
          v-model="password"
          type="password"
          placeholder="••••••••"
          required
          autocomplete="current-password"
        />
      </label>

      <button type="submit" class="btn btn--primary" :class="$style.submit">
        SIGN IN
      </button>
    </form>
  </div>
</template>

<style module>
.page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  padding: var(--space-6);
}

.card {
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-10) var(--space-8);
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.logo {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-text-muted);
  text-align: center;
}

.logoAccent {
  color: var(--color-commit);
}

.subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-align: center;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.fieldLabel {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.field input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
}

.submit {
  width: 100%;
  margin-top: var(--space-2);
}
</style>
