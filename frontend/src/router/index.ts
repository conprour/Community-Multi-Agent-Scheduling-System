import { createRouter, createWebHistory } from 'vue-router';

import EmergencyDashboardPage from '@/pages/EmergencyDashboardPage.vue';
import GovernmentWorkOrderPage from '@/pages/GovernmentWorkOrderPage.vue';
import ManagementAnalysisPage from '@/pages/ManagementAnalysisPage.vue';
import ManagementDashboardPage from '@/pages/ManagementDashboardPage.vue';

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
    {
      path: '/management',
      name: 'management-analysis',
      component: ManagementAnalysisPage,
    },
    {
      path: '/management/dashboard',
      name: 'management-dashboard',
      component: ManagementDashboardPage,
    },
  ],
});

export default router;
