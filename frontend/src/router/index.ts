import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import GitPlayground from '../views/GitPlayground.vue';
import LandingView from '../views/LandingView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/app',
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
