<template>
  <main class="dashboard-shell">
    <section class="dashboard-grid">
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
