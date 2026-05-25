<template>
  <main class="dashboard-shell">
    <section class="page-hero government-hero">
      <div>
        <p class="eyebrow">政府 / 部门工作台</p>
        <h1>工单派发与治理汇总</h1>
        <p>
          面向街道、社区和承办部门，集中查看标准工单、主协办建议、人工确认提示和部门数据看板。
        </p>
      </div>
      <RouterLink class="nav-link" to="/">群众提交端</RouterLink>
    </section>

    <section class="government-grid">
      <RightServicePanel />
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
import RightServicePanel from '@/components/RightServicePanel.vue';
import { useEmergencyStore } from '@/stores/emergency';

const store = useEmergencyStore();

const summaryTitle = computed(() => {
  if (!store.response) {
    return '等待群众端提交诉求';
  }
  return `${store.response.routing_decision.responsible_unit} 待确认`;
});

const summaryText = computed(() => {
  if (!store.response) {
    return '当前展示政府部门侧的合成看板数据。群众端提交后，标准工单、协办部门和缺字段提示会同步出现在这里。';
  }
  return `系统已生成 ${store.response.service_order.order_id}，建议由坐席补齐缺失字段后再进入正式派单。`;
});

const summaryItems = computed(() => {
  if (!store.response) {
    return [
      '群众提交端与政府处理端已拆分。',
      '工单、派单理由和治理汇总仅在政府工作台展示。',
      'multi-agent 协作层保留在后台链路，当前不作为页面模块展示。',
    ];
  }

  return [
    `主办部门：${store.response.routing_decision.responsible_unit}`,
    `协办部门：${store.response.routing_decision.backup_units.join('、')}`,
    `待补信息：${store.response.demand_package.missing_fields.join('、') || '无'}`,
  ];
});
</script>

<style scoped>
.government-grid {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr);
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
