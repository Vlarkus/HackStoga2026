import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import GitPlayground from '../views/GitPlayground.vue';
import HistoryView from '../views/HistoryView.vue';
import SettingsView from '../views/SettingsView.vue';
import AccountView from '../views/AccountView.vue';
import ApiDocsView from '../views/ApiDocsView.vue';
import CliDocsView from '../views/CliDocsView.vue';

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
    {
      path: '/history',
      name: 'history',
      component: HistoryView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/account',
      name: 'account',
      component: AccountView,
    },
    {
      path: '/docs/api',
      name: 'api-docs',
      component: ApiDocsView,
    },
    {
      path: '/docs/cli',
      name: 'cli-docs',
      component: CliDocsView,
    },
  ],
});

export default router;
