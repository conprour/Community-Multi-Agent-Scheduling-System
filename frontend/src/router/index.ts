import { createRouter, createWebHistory } from 'vue-router';

import EmergencyDashboardPage from '@/pages/EmergencyDashboardPage.vue';
import GovernmentWorkOrderPage from '@/pages/GovernmentWorkOrderPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'citizen-submit',
      component: EmergencyDashboardPage,
    },
    {
      path: '/government',
      name: 'government-work-order',
      component: GovernmentWorkOrderPage,
    },
  ],
});

export default router;
