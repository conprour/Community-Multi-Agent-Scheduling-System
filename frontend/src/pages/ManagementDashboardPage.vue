<template>
  <main class="dashboard-shell">
    <section class="page-hero management-hero">
      <div>
        <p class="eyebrow">管理分析数据看板</p>
        <h1>{{ result?.topic ?? '等待分析结果' }}</h1>
        <p>{{ result?.answer ?? '请先在管理分析端提交问题，系统会生成 50 条模拟群众诉求并汇总成时空和图表看板。' }}</p>
      </div>
      <RouterLink class="nav-link" to="/management">返回分析过程</RouterLink>
    </section>

    <template v-if="result">
      <section class="metric-grid">
        <article class="metric-card">
          <span>模拟诉求</span>
          <strong>{{ result.simulated_count }}</strong>
          <small>匿名群众诉求</small>
        </article>
        <article class="metric-card">
          <span>覆盖社区</span>
          <strong>{{ result.region_insights.length }}</strong>
          <small>{{ result.original_question }}</small>
        </article>
        <article class="metric-card">
          <span>高风险</span>
          <strong>{{ highSeverityCount }}</strong>
          <small>需优先处理</small>
        </article>
        <article class="metric-card">
          <span>关键词</span>
          <strong>{{ result.extracted_keywords.length }}</strong>
          <small>{{ result.extracted_keywords.join(' / ') }}</small>
        </article>
      </section>

      <section class="dashboard-two-col">
        <section class="chart-panel card-panel">
          <p class="eyebrow">时间趋势</p>
          <h2>诉求量与高风险变化</h2>
          <div class="time-bars">
            <article v-for="point in result.time_series" :key="point.label">
              <div class="bar-wrap">
                <span class="bar-total" :style="{ height: `${Math.max(point.count * 10, 12)}px` }"></span>
                <span class="bar-high" :style="{ height: `${Math.max(point.high_severity * 14, 4)}px` }"></span>
              </div>
              <strong>{{ point.count }}</strong>
              <small>{{ point.label }}</small>
            </article>
          </div>
        </section>

        <section class="chart-panel card-panel">
          <p class="eyebrow">类别图表</p>
          <h2>问题类别占比</h2>
          <div class="category-list">
            <article v-for="item in result.category_metrics" :key="item.label">
              <div>
                <span>{{ item.label }}</span>
                <strong>{{ item.count }} 件 / {{ item.ratio }}%</strong>
              </div>
              <div class="bar-track">
                <span :style="{ width: `${item.ratio}%` }"></span>
              </div>
            </article>
          </div>
        </section>
      </section>

      <section class="spacetime-panel card-panel">
        <div class="panel-title">
          <div>
            <p class="eyebrow">时空分布</p>
            <h2>不同地区标注信息</h2>
          </div>
          <span>经纬度为演示模拟点位</span>
        </div>
        <div class="region-map">
          <article
            v-for="region in result.region_insights"
            :key="region.name"
            class="region-marker"
            :style="{ left: `${regionLeft(region.longitude)}%`, top: `${regionTop(region.latitude)}%` }"
          >
            <strong>{{ region.name }}</strong>
            <span>{{ region.count }} 件 / 高风险 {{ region.high_severity }}</span>
          </article>
        </div>
        <div class="region-list">
          <article v-for="region in result.region_insights" :key="region.name">
            <div>
              <strong>{{ region.name }}</strong>
              <span>{{ region.top_category }}</span>
            </div>
            <p>{{ region.recommended_action }}</p>
          </article>
        </div>
      </section>

      <section class="answer-panel card-panel">
        <p class="eyebrow">对问题的回答</p>
        <h2>{{ result.normalized_question }}</h2>
        <p>{{ result.answer }}</p>
        <ul>
          <li v-for="item in result.recommendations" :key="item">{{ item }}</li>
        </ul>
      </section>
    </template>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useManagementStore } from '@/stores/management';

const store = useManagementStore();
const result = computed(() => store.result);
const highSeverityCount = computed(() => result.value?.records.filter((item) => item.severity === 'high').length ?? 0);

function regionLeft(longitude: number) {
  return Math.min(88, Math.max(8, (longitude - 116.28) * 900));
}

function regionTop(latitude: number) {
  return Math.min(82, Math.max(10, 88 - (latitude - 39.95) * 900));
}
</script>

<style scoped>
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card,
.chart-panel,
.spacetime-panel,
.answer-panel {
  border-radius: 22px;
}

.metric-card {
  display: grid;
  gap: 8px;
  padding: 18px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(210, 223, 230, 0.84);
}

.metric-card span,
.metric-card small {
  color: rgba(61, 84, 95, 0.75);
}

.metric-card strong {
  font-size: 28px;
  color: #17313d;
}

.dashboard-two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.chart-panel {
  display: grid;
  gap: 16px;
}

.chart-panel h2,
.spacetime-panel h2,
.answer-panel h2,
.answer-panel p {
  margin: 0;
}

.time-bars {
  min-height: 240px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(54px, 1fr));
  gap: 14px;
  align-items: end;
}

.time-bars article {
  display: grid;
  gap: 8px;
  justify-items: center;
}

.bar-wrap {
  height: 170px;
  display: flex;
  align-items: end;
  gap: 4px;
}

.bar-total,
.bar-high {
  width: 18px;
  display: block;
  border-radius: 999px 999px 4px 4px;
}

.bar-total {
  background: #4d9aad;
}

.bar-high {
  background: #e46b42;
}

.time-bars strong,
.time-bars small {
  color: rgba(61, 84, 95, 0.82);
}

.category-list {
  display: grid;
  gap: 14px;
}

.category-list article {
  display: grid;
  gap: 8px;
}

.category-list article > div:first-child {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.category-list span {
  color: rgba(61, 84, 95, 0.78);
}

.category-list strong {
  color: #17313d;
}

.bar-track {
  height: 9px;
  overflow: hidden;
  border-radius: 999px;
  background: #edf3f4;
}

.bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #e9752f, #4d9aad);
}

.spacetime-panel,
.answer-panel {
  display: grid;
  gap: 18px;
  margin-top: 20px;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: start;
}

.panel-title span {
  color: rgba(61, 84, 95, 0.7);
  font-size: 13px;
}

.region-map {
  position: relative;
  min-height: 360px;
  overflow: hidden;
  border-radius: 22px;
  background:
    linear-gradient(120deg, rgba(246, 250, 249, 0.95), rgba(225, 241, 243, 0.96)),
    repeating-linear-gradient(0deg, transparent, transparent 38px, rgba(120, 154, 166, 0.12) 39px),
    repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(120, 154, 166, 0.12) 49px);
  border: 1px solid rgba(210, 223, 230, 0.9);
}

.region-marker {
  position: absolute;
  width: 172px;
  transform: translate(-50%, -50%);
  padding: 10px 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(235, 127, 56, 0.34);
  box-shadow: 0 12px 22px rgba(92, 121, 134, 0.16);
}

.region-marker strong,
.region-marker span {
  display: block;
}

.region-marker strong {
  color: #17313d;
}

.region-marker span {
  margin-top: 4px;
  color: rgba(61, 84, 95, 0.74);
  font-size: 12px;
}

.region-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.region-list article {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(210, 223, 230, 0.74);
}

.region-list div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.region-list p,
.answer-panel p,
.answer-panel ul {
  margin: 0;
  color: rgba(61, 84, 95, 0.84);
  line-height: 1.8;
}

.answer-panel ul {
  padding-left: 18px;
}

@media (max-width: 1100px) {
  .metric-grid,
  .dashboard-two-col,
  .region-list {
    grid-template-columns: 1fr;
  }
}
</style>
