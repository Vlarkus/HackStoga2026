import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { noLayout: true },
    },
    {
      path: '/landing',
      name: 'landing',
      component: () => import('../views/LandingView.vue'),
      meta: { noLayout: true },
    },
    {
      path: '/',
      component: () => import('../layouts/AppLayout.vue'),
      children: [
        { path: '', redirect: '/workspace' },
        { path: 'workspace', name: 'workspace', component: () => import('../views/HomeView.vue') },
        { path: 'projects', name: 'projects', component: () => import('../views/ProjectsView.vue') },
        { path: 'settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
        { path: 'account', name: 'account', component: () => import('../views/AccountView.vue') },
        { path: 'api', name: 'api-docs', component: () => import('../views/ApiDocsView.vue') },
        { path: 'cli', name: 'cli-docs', component: () => import('../views/CliDocsView.vue') },
        { path: 'git-playground', name: 'git-playground', component: () => import('../views/GitPlayground.vue') },
      ],
    },
  ],
});

// Auth guard
router.beforeEach(async (to) => {
  const { useAuthStore } = await import('../stores/useAuthStore');
  const auth = useAuthStore();

  if (!to.meta.noLayout && !auth.isAuthenticated) {
    return { name: 'login' };
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'workspace' };
  }
});

export default router;
