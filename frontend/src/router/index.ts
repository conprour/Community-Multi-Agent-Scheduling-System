import { createRouter, createWebHistory } from 'vue-router';

import EmergencyDashboardPage from '@/pages/EmergencyDashboardPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: EmergencyDashboardPage,
    },
  ],
});

export default router;
