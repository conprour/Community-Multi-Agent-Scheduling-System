<template>
  <section class="panel card-panel right-panel" :class="{ updated: store.workOrderUpdated, confirmed: store.workOrderConfirmed }">
    <header class="panel-header">
      <div>
        <p class="eyebrow">工作人员确认</p>
        <h2>工单派发</h2>
      </div>
      <el-tag :type="statusTagType" effect="dark">
        {{ statusText }}
      </el-tag>
    </header>

    <template v-if="store.response">
      <article class="dispatch-card primary-card">
        <div class="dispatch-topline">
          <span>工单编号</span>
          <strong>{{ store.response.service_order.order_id }}</strong>
        </div>
        <p class="dispatch-unit">{{ store.response.routing_decision.responsible_unit }}</p>
        <div class="dispatch-meta">
          <span>{{ store.response.service_order.status }}</span>
          <span>{{ store.response.routing_decision.service_sla }}</span>
        </div>
      </article>

      <article class="dispatch-card">
        <h3>诉求分析建议</h3>
        <p class="summary-text">{{ store.response.demand_package.summary }}</p>
        <ul>
          <li v-for="item in suggestionItems" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="dispatch-card compact-card">
        <h3>服务地点</h3>
        <p>{{ store.response.service_order.service_location }}</p>
      </article>

      <button type="button" class="confirm-order-btn" :disabled="store.workOrderConfirmed" @click="store.confirmWorkOrder()">
        {{ store.workOrderConfirmed ? '已确认工单' : '确认工单信息' }}
      </button>
    </template>

    <article v-else class="dispatch-card empty-card">
      <h3>等待生成工单</h3>
      <p>工作人员确认客服复述后，这里会生成派发单位和诉求分析建议。</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useEmergencyStore } from '@/stores/emergency';

const store = useEmergencyStore();

const statusText = computed(() => {
  if (store.workOrderConfirmed) {
    return '工作人员已确认';
  }
  if (store.useMockData) {
    return 'Mock 输出';
  }
  return store.response ? '待工作人员确认' : '等待生成';
});

const statusTagType = computed(() => {
  if (store.workOrderConfirmed) {
    return 'warning';
  }
  if (store.useMockData) {
    return 'warning';
  }
  return store.response ? 'primary' : 'info';
});

const suggestionItems = computed(() => {
  if (!store.response) {
    return [];
  }
  return [
    ...store.response.demand_package.risks.slice(0, 2),
    ...store.response.demand_package.temporary_guidance.slice(0, 2),
  ];
});
</script>

<style scoped>
.right-panel {
  display: grid;
  gap: 16px;
  transition: border-color 0.24s ease, box-shadow 0.24s ease, transform 0.24s ease;
}

.right-panel.updated {
  border-color: rgba(31, 138, 151, 0.72);
  box-shadow: 0 0 0 5px rgba(31, 138, 151, 0.16), 0 28px 48px rgba(31, 138, 151, 0.16);
  transform: translateY(-2px);
}

.right-panel.confirmed {
  border-color: rgba(235, 127, 56, 0.58);
}

.dispatch-card {
  border-radius: 20px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(210, 223, 230, 0.84);
}

.primary-card {
  background: linear-gradient(180deg, rgba(255, 212, 183, 0.86), rgba(255, 250, 246, 0.98));
  border-color: rgba(247, 180, 128, 0.58);
}

.dispatch-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(73, 95, 105, 0.82);
  font-size: 13px;
}

.dispatch-topline strong {
  color: #223a44;
}

.dispatch-unit {
  margin: 14px 0 0;
  color: #17313d;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
}

.dispatch-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.dispatch-meta span {
  padding: 7px 12px;
  border-radius: 999px;
  background: rgba(237, 244, 247, 0.92);
  color: #244451;
  font-size: 12px;
}

.dispatch-card h3,
.dispatch-card p {
  margin: 0;
}

.dispatch-card h3 {
  color: rgba(64, 86, 96, 0.82);
  font-size: 14px;
}

.summary-text,
.compact-card p,
.empty-card p {
  margin-top: 10px;
  color: rgba(52, 75, 87, 0.86);
  line-height: 1.75;
}

.dispatch-card ul {
  margin: 12px 0 0;
  padding-left: 18px;
  color: rgba(61, 84, 95, 0.82);
  line-height: 1.75;
}

.confirm-order-btn {
  justify-self: end;
  min-height: 36px;
  padding: 8px 18px;
  border: none;
  border-radius: 14px;
  color: #fff;
  background: linear-gradient(135deg, #f08c46, #df6827);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 12px 22px rgba(223, 104, 39, 0.18);
  transition: box-shadow 0.2s ease, filter 0.2s ease, transform 0.2s ease;
}

.confirm-order-btn:hover:not(:disabled) {
  filter: brightness(1.03);
  box-shadow: 0 15px 26px rgba(223, 104, 39, 0.24);
  transform: translateY(-1px);
}

.confirm-order-btn:disabled {
  cursor: default;
  color: rgba(207, 100, 30, 0.78);
  background: rgba(242, 141, 78, 0.15);
  box-shadow: none;
}
</style>
