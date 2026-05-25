<template>
  <main class="dashboard-shell">
    <section class="page-hero government-hero">
      <div>
        <p class="eyebrow">政府 / 部门工作台</p>
        <h1>治理汇总与部门态势</h1>
        <p>
          面向街道、社区和承办部门，集中查看部门负载、重复投诉、超时预警和治理建议。
        </p>
      </div>
      <RouterLink class="nav-link" to="/">群众提交端</RouterLink>
    </section>

    <section class="government-grid">
      <section class="department-summary card-panel">
        <p class="eyebrow">部门处置摘要</p>
        <h2>{{ summaryTitle }}</h2>
        <p>{{ summaryText }}</p>
        <ul>
          <li v-for="item in summaryItems" :key="item">{{ item }}</li>
        </ul>
      </section>
    </section>

    <GovernmentInsightPanel />
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import GovernmentInsightPanel from '@/components/GovernmentInsightPanel.vue';
import { useEmergencyStore } from '@/stores/emergency';

const store = useEmergencyStore();

const summaryTitle = computed(() => {
  if (!store.response) {
    return '等待群众端确认诉求';
  }
  return `${store.response.demand_package.category} 已进入治理汇总`;
});

const summaryText = computed(() => {
  if (!store.response) {
    return '当前展示政府部门侧的合成看板数据。群众端确认工单后，可在这里看到治理态势的联动摘要。';
  }
  return `群众端已确认“${store.response.demand_package.category}”诉求，部门侧只展示治理聚类、负载和风险摘要。`;
});

const summaryItems = computed(() => {
  if (!store.response) {
    return [
      '群众提交端与政府处理端已拆分。',
      '工单派发和用户确认保留在群众提交端右侧。',
      'multi-agent 协作层保留在后台链路，当前不作为页面模块展示。',
    ];
  }

  return [
    `关联小区：${store.selectedCase.communityName}`,
    `诉求类型：${store.response.demand_package.category}`,
    `治理提示：${store.response.demand_package.risks[0] || '暂无新增风险'}`,
  ];
});
</script>

<style scoped>
.government-grid {
  display: grid;
  grid-template-columns: minmax(520px, 1fr);
  gap: 20px;
  align-items: start;
}

.department-summary {
  display: grid;
  gap: 14px;
}

.department-summary h2,
.department-summary p {
  margin: 0;
}

.department-summary h2 {
  font-size: 24px;
  color: #17313d;
}

.department-summary p,
.department-summary ul {
  color: rgba(61, 84, 95, 0.82);
  line-height: 1.8;
}

.department-summary ul {
  margin: 0;
  padding-left: 18px;
}

:deep(.governance-panel) {
  margin-top: 22px;
}

@media (max-width: 1280px) {
  .government-grid {
    grid-template-columns: 1fr;
  }

}
</style>
