import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import GitPlayground from '../views/GitPlayground.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/git',
      name: 'git-playground',
      component: GitPlayground,
    },
  ],
});

export default router;
