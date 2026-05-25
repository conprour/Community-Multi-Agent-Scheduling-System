<template>
  <section class="governance-panel">
    <header class="governance-header">
      <div>
        <p class="eyebrow">政府部门数据看板</p>
        <h2>接诉即办运行汇总</h2>
      </div>
      <div class="report-status">
        <span>数据口径</span>
        <strong>{{ store.response ? '已纳入最新诉求' : '演示数据待更新' }}</strong>
      </div>
    </header>

    <div class="overview-grid">
      <article v-for="metric in overviewMetrics" :key="metric.label" class="overview-card">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <small>{{ metric.detail }}</small>
      </article>
    </div>

    <div class="insight-grid">
      <section class="chart-block">
        <div class="block-title">
          <h3>诉求类别占比</h3>
          <span>近 7 日</span>
        </div>
        <div class="bar-list">
          <article v-for="item in categoryShare" :key="item.label" class="bar-row">
            <div>
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}%</strong>
            </div>
            <div class="bar-track">
              <span :style="{ width: `${item.value}%`, background: item.color }"></span>
            </div>
          </article>
        </div>
      </section>

      <section class="chart-block">
        <div class="block-title">
          <h3>热点区域</h3>
          <span>街道/社区聚类</span>
        </div>
        <div class="hotspot-list">
          <article v-for="area in hotspots" :key="area.name" class="hotspot-item">
            <div>
              <strong>{{ area.name }}</strong>
              <span>{{ area.topic }}</span>
            </div>
            <em>{{ area.count }} 件</em>
          </article>
        </div>
      </section>

      <section class="chart-block">
        <div class="block-title">
          <h3>部门负载</h3>
          <span>待处理工单</span>
        </div>
        <div class="department-list">
          <article v-for="dept in departmentLoad" :key="dept.name" class="department-row">
            <div>
              <span>{{ dept.name }}</span>
              <strong>{{ dept.pending }}</strong>
            </div>
            <el-progress :percentage="dept.load" :stroke-width="8" :show-text="false" />
          </article>
        </div>
      </section>

      <section class="chart-block risk-block">
        <div class="block-title">
          <h3>重复与超时风险</h3>
          <span>督办预警</span>
        </div>
        <div class="risk-list">
          <article v-for="risk in riskAlerts" :key="risk.title" class="risk-item" :class="risk.level">
            <span>{{ risk.levelLabel }}</span>
            <div>
              <strong>{{ risk.title }}</strong>
              <p>{{ risk.detail }}</p>
            </div>
          </article>
        </div>
      </section>
    </div>

    <section class="summary-band">
      <div>
        <p class="eyebrow">部门协同建议</p>
        <h3>{{ summaryTitle }}</h3>
        <p>{{ summaryText }}</p>
      </div>
      <ul>
        <li v-for="action in governanceActions" :key="action">{{ action }}</li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useEmergencyStore } from '@/stores/emergency';

const store = useEmergencyStore();

const overviewMetrics = computed(() => [
  {
    label: '今日受理',
    value: store.response ? '128' : '127',
    detail: store.response ? '较演示前 +1 件' : '合成历史工单',
  },
  {
    label: '已转派',
    value: '96',
    detail: '首派准确率 87%',
  },
  {
    label: '待坐席确认',
    value: store.response ? '18' : '17',
    detail: '跨部门或缺字段',
  },
  {
    label: '超时预警',
    value: '9',
    detail: '红色 2 / 黄色 7',
  },
]);

const categoryShare = [
  { label: '噪声扰民', value: 28, color: '#ea6b3f' },
  { label: '餐饮油烟', value: 24, color: '#347f8f' },
  { label: '物业管理', value: 18, color: '#8d6ad8' },
  { label: '道路市政', value: 14, color: '#d3a33c' },
  { label: '医保民政', value: 9, color: '#4d77b9' },
  { label: '教育咨询', value: 7, color: '#5f8f61' },
];

const hotspots = [
  { name: '知春里社区 A 区', topic: '底商油烟与夜间噪声', count: 19 },
  { name: '海淀南路商圈', topic: '占道经营与餐饮扰民', count: 15 },
  { name: '双榆树北里', topic: '物业响应慢与重复维修', count: 12 },
  { name: '中关村东路沿线', topic: '道路破损与施工噪声', count: 10 },
];

const departmentLoad = [
  { name: '属地街道综合执法队', pending: 31, load: 78 },
  { name: '生态环境部门', pending: 18, load: 62 },
  { name: '市场监管所', pending: 14, load: 54 },
  { name: '社区居委会', pending: 23, load: 68 },
];

const riskAlerts = [
  {
    level: 'red',
    levelLabel: '红',
    title: '知春里社区底商重复投诉',
    detail: '近 7 日同地点同类型诉求 6 件，建议升级为重点治理事项。',
  },
  {
    level: 'yellow',
    levelLabel: '黄',
    title: '夜间核查资源不足',
    detail: '噪声类诉求集中在 21:00 后，需预留夜间联合核查窗口。',
  },
  {
    level: 'green',
    levelLabel: '绿',
    title: '医保咨询类可自动分流',
    detail: '低风险咨询命中规则稳定，可转便民服务中心优先办理。',
  },
];

const governanceActions = [
  '由街道牵头建立“餐饮油烟 + 夜间噪声”专项台账。',
  '对重复投诉商户安排城管、生态环境、市场监管联合核查。',
  '将缺少门牌号的诉求保留坐席确认，避免错误派单。',
  '每周输出热点社区、重复投诉和部门负载三类治理摘要。',
];

const summaryTitle = computed(() => {
  if (!store.response) {
    return '本周中关村街道餐饮扰民诉求持续走高';
  }

  return `${store.response.demand_package.location} 已进入热点聚类`;
});

const summaryText = computed(() => {
  if (!store.response) {
    return '近 7 日噪声扰民与餐饮油烟合计占比 52%，集中在底商密集社区。建议以街道为牵头单位，开展夜间餐饮扰民专项核查。';
  }

  return `系统已将本次“${store.response.demand_package.category}”诉求纳入治理看板，并关联到知春里社区底商重复投诉簇。建议先人工补齐商户门牌，再发起联合核查。`;
});
</script>

<style scoped>
.governance-panel {
  display: grid;
  gap: 18px;
}

.governance-header,
.summary-band {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: start;
  padding: 24px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(181, 204, 214, 0.48);
  box-shadow: 0 20px 38px rgba(92, 121, 134, 0.1);
}

.governance-header h2,
.summary-band h3 {
  margin: 6px 0 0;
  color: #17313d;
}

.governance-header h2 {
  font-size: 24px;
}

.report-status {
  display: grid;
  gap: 6px;
  min-width: 190px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #eef5f6;
  color: rgba(57, 83, 94, 0.82);
}

.report-status strong {
  color: #17313d;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.overview-card,
.chart-block {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(210, 223, 230, 0.84);
}

.overview-card {
  display: grid;
  gap: 8px;
  padding: 18px;
}

.overview-card span,
.overview-card small {
  color: rgba(61, 84, 95, 0.75);
}

.overview-card strong {
  font-size: 28px;
  color: #17313d;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.chart-block {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.block-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.block-title h3 {
  margin: 0;
  font-size: 16px;
  color: #17313d;
}

.block-title span {
  color: rgba(70, 94, 105, 0.7);
  font-size: 12px;
}

.bar-list,
.hotspot-list,
.department-list,
.risk-list {
  display: grid;
  gap: 12px;
}

.bar-row {
  display: grid;
  gap: 8px;
}

.bar-row div:first-child,
.department-row div,
.hotspot-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.bar-row span,
.department-row span,
.hotspot-item span,
.risk-item p {
  color: rgba(61, 84, 95, 0.76);
}

.bar-row strong,
.department-row strong,
.hotspot-item em {
  color: #17313d;
  font-style: normal;
}

.bar-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf3f4;
}

.bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
}

.hotspot-item {
  align-items: start;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(211, 224, 229, 0.72);
}

.hotspot-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.hotspot-item div,
.department-row {
  display: grid;
  gap: 4px;
}

.risk-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 16px;
  background: #f6faf9;
}

.risk-item > span {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}

.risk-item.red > span {
  background: #d95c42;
}

.risk-item.yellow > span {
  background: #d9a438;
}

.risk-item.green > span {
  background: #4f9460;
}

.risk-item strong,
.risk-item p {
  margin: 0;
}

.risk-item p {
  margin-top: 5px;
  line-height: 1.55;
}

.summary-band p {
  max-width: 780px;
  margin: 10px 0 0;
  color: rgba(61, 84, 95, 0.82);
  line-height: 1.8;
}

.summary-band ul {
  min-width: 320px;
  margin: 0;
  padding-left: 18px;
  color: rgba(61, 84, 95, 0.86);
  line-height: 1.9;
}

@media (max-width: 1280px) {
  .overview-grid,
  .insight-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .governance-header,
  .summary-band {
    flex-direction: column;
  }

  .overview-grid,
  .insight-grid {
    grid-template-columns: 1fr;
  }

  .report-status,
  .summary-band ul {
    min-width: 0;
    width: 100%;
  }
}
</style>
