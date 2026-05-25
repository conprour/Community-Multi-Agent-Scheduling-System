<template>
  <section class="panel card-panel right-panel">
    <header class="panel-header">
      <div>
        <p class="eyebrow">派单确认</p>
        <h2>标准工单与协办信息</h2>
      </div>
      <el-tag :type="store.useMockData ? 'warning' : 'success'" effect="dark">
        {{ store.useMockData ? 'Mock 输出' : '接口输出' }}
      </el-tag>
    </header>

    <template v-if="store.response">
      <article class="service-card primary-card">
        <div class="service-card-topline">
          <span>工单编号</span>
          <strong>{{ store.response.service_order.order_id }}</strong>
        </div>
        <div class="service-badges">
          <span class="service-badge badge-accent">{{ store.response.service_order.status }}</span>
          <span class="service-badge">{{ store.response.routing_decision.service_sla }}</span>
          <span class="service-badge">{{ store.response.routing_decision.responsible_role }}</span>
        </div>
      </article>

      <article class="service-card">
        <h3>建议主办部门</h3>
        <p class="service-main">{{ store.response.routing_decision.responsible_unit }}</p>
        <p class="service-secondary">预计 {{ store.response.routing_decision.eta_minutes }} 分钟内完成核查派单</p>
      </article>

      <article class="service-card">
        <h3>诉求地点</h3>
        <p class="service-main">{{ store.response.service_order.service_location }}</p>
        <p class="service-secondary">缺少商户门牌时，建议先由坐席补充信息后再正式派发。</p>
      </article>

      <article class="service-card grid-card">
        <div>
          <h3>建议处置流程</h3>
          <ul>
            <li v-for="action in store.response.service_order.service_actions" :key="action">{{ action }}</li>
          </ul>
        </div>
        <div>
          <h3>群众反馈话术</h3>
          <ul>
            <li v-for="advice in store.response.demand_package.temporary_guidance" :key="advice">{{ advice }}</li>
          </ul>
        </div>
      </article>

      <article class="service-card grid-card compact-grid">
        <div>
          <h3>派单理由</h3>
          <ul>
            <li v-for="reason in store.response.routing_decision.rationale" :key="reason">{{ reason }}</li>
          </ul>
        </div>
        <div>
          <h3>协办与审计备注</h3>
          <ul>
            <li v-for="note in combinedNotes" :key="note">{{ note }}</li>
          </ul>
        </div>
      </article>
    </template>

    <article v-else class="service-card empty-card">
      <h3>等待生成标准工单</h3>
      <p>提交左侧案例后，这里会展示工单编号、主办部门、协办部门、派单理由和人工确认提示。</p>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useEmergencyStore } from '@/stores/emergency';

const store = useEmergencyStore();

const combinedNotes = computed(() => {
  if (!store.response) {
    return [];
  }

  return [
    ...store.response.service_order.notes,
    ...store.response.routing_decision.backup_units.map((unit) => `协同待命：${unit}`),
  ];
});
</script>

<style scoped>
.right-panel {
  display: grid;
  gap: 16px;
}

.service-card {
  border-radius: 20px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(210, 223, 230, 0.84);
}

.primary-card {
  background: linear-gradient(180deg, rgba(255, 212, 183, 0.8), rgba(255, 250, 246, 0.96));
  border-color: rgba(247, 180, 128, 0.52);
}

.service-card-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: rgba(73, 95, 105, 0.82);
  font-size: 13px;
}

.service-card-topline strong {
  color: #223a44;
}

.service-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.service-badge {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  background: rgba(237, 244, 247, 0.92);
  color: #244451;
}

.badge-accent {
  background: rgba(255, 126, 82, 0.24);
}

.service-card h3 {
  margin: 0;
  font-size: 14px;
  color: rgba(64, 86, 96, 0.82);
}

.service-main {
  margin: 10px 0 0;
  font-size: 20px;
  font-weight: 600;
  color: #183641;
}

.service-secondary {
  margin: 8px 0 0;
  color: rgba(70, 94, 105, 0.78);
  line-height: 1.7;
}

.grid-card {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.compact-grid {
  gap: 14px;
}

.service-card ul {
  margin: 12px 0 0;
  padding-left: 18px;
  line-height: 1.75;
  color: rgba(61, 84, 95, 0.82);
}

.empty-card p {
  margin: 10px 0 0;
  line-height: 1.7;
  color: rgba(74, 99, 109, 0.76);
}

@media (max-width: 1200px) {
  .grid-card {
    grid-template-columns: 1fr;
  }
}
</style>
