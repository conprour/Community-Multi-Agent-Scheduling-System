<template>
  <main class="dashboard-shell">
    <section class="page-hero citizen-hero">
      <div>
        <p class="eyebrow">群众诉求提交端</p>
        <h1>一句话提交社区诉求</h1>
        <p>
          群众只需要描述问题、地点和联系方式。工单派发、部门协办和治理汇总只在政府工作台展示。
        </p>
      </div>
      <RouterLink class="nav-link" to="/government">政府工作台</RouterLink>
    </section>

    <section class="submission-grid">
      <LeftReportPanel />
      <RouteFlowPanel />
    </section>
  </main>
</template>

<script setup lang="ts">
import LeftReportPanel from '@/components/LeftReportPanel.vue';
import RouteFlowPanel from '@/components/RouteFlowPanel.vue';
</script>

<style scoped>
.submission-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.82fr) minmax(560px, 1.18fr);
  gap: 20px;
  align-items: start;
}

@media (max-width: 1280px) {
  .submission-grid {
    grid-template-columns: 1fr;
  }
}
</style>
