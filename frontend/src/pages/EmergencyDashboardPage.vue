<template>
  <main class="dashboard-shell">
    <section class="hero-band">
      <div class="hero-content">
        <div>
          <p class="eyebrow">急事办调度中枢</p>
          <h1>把“小急事”做得更快</h1>
          <p class="hero-copy">
            第一版聚焦“水管爆了怎么办”，从居民报事、结构化提取、责任链路由到工单服务信息生成，先跑通一个真正可演示的闭环。
          </p>
        </div>

        <div class="hero-kpis">
          <article>
            <strong>3</strong>
            <span>输入模态</span>
          </article>
          <article>
            <strong>20 分钟</strong>
            <span>主案例预计到场</span>
          </article>
          <article>
            <strong>百炼增强</strong>
            <span>文本 / 图像 / 语音</span>
          </article>
        </div>
      </div>
    </section>

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

<style scoped>
.hero-content {
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(320px, 0.9fr);
  gap: 22px;
  padding: 28px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(121, 196, 205, 0.24), transparent 28%),
    linear-gradient(135deg, rgba(255, 250, 243, 0.96), rgba(241, 248, 249, 0.92));
  border: 1px solid rgba(210, 225, 231, 0.88);
  box-shadow: 0 30px 56px rgba(72, 108, 124, 0.12);
}

.hero-kpis {
  display: grid;
  gap: 14px;
}

.hero-kpis article {
  padding: 18px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(212, 224, 230, 0.9);
}

.hero-kpis strong,
.hero-kpis span {
  display: block;
}

.hero-kpis strong {
  color: #14323d;
  font-size: 26px;
  font-weight: 700;
}

.hero-kpis span {
  margin-top: 6px;
  color: rgba(61, 86, 97, 0.74);
}

@media (max-width: 1280px) {
  .hero-content {
    grid-template-columns: 1fr;
  }
}
</style>
