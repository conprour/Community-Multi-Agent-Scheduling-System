import { createRouter, createWebHistory } from 'vue-router';

import EmergencyDashboardPage from '@/pages/EmergencyDashboardPage.vue';
import HomePage from '@/pages/HomePage.vue';
import ManagementAnalysisPage from '@/pages/ManagementAnalysisPage.vue';
import ManagementDashboardPage from '@/pages/ManagementDashboardPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/citizen',
      name: 'citizen-submit',
      component: EmergencyDashboardPage,
    },
    {
      path: '/government',
      redirect: '/management',
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
