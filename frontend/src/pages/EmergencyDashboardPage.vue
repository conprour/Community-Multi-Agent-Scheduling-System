<template>
  <main class="dashboard-shell">
    <section class="page-hero citizen-hero">
      <div>
        <p class="eyebrow">群众诉求提交端</p>
        <h1>一句话提交社区诉求--需求处理全链路展示</h1>
        <p>
          群众只需要描述问题并确认客服复述，工单会在右侧生成并由工作人员确认。
        </p>
      </div>
      <div class="hero-links">
        <RouterLink class="nav-link" to="/">返回首页</RouterLink>
      </div>
    </section>

    <section class="submission-grid">
      <LeftReportPanel />
      <RouteFlowPanel />
      <RightServicePanel />
    </section>
  </main>
</template>

<script setup lang="ts">
import LeftReportPanel from '@/components/LeftReportPanel.vue';
import RightServicePanel from '@/components/RightServicePanel.vue';
import RouteFlowPanel from '@/components/RouteFlowPanel.vue';
</script>

<style scoped>
.submission-grid {
  display: grid;
  grid-template-columns: minmax(300px, 0.82fr) minmax(580px, 1.52fr) minmax(280px, 0.74fr);
  gap: 16px;
  align-items: start;
}

.hero-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.secondary-link {
  background: linear-gradient(135deg, #3c8fa0, #246f7e);
}

@media (max-width: 1280px) {
  .submission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
