<template>
  <main class="home-shell">
    <section class="home-hero">
      <div class="home-copy">
        <p class="eyebrow">问办通</p>
        <h1>社会民生诉求的智能协同调度入口</h1>
        <p>
          面向群众诉求快速回应与政府资源合理分配，提供群众提交和管理部门分析两条入口，
          让问题进入系统后可以被理解、分派、聚合和辅助决策。
        </p>
      </div>

      <div class="flow-visual" aria-hidden="true">
        <span class="flow-dot citizen-dot">群众</span>
        <span class="flow-line"></span>
        <span class="flow-core">Agent</span>
        <span class="flow-line"></span>
        <span class="flow-dot government-dot">部门</span>
      </div>
    </section>

    <section class="entry-grid" aria-label="系统入口">
      <RouterLink class="entry-card citizen-entry" to="/citizen">
        <span class="entry-icon">诉</span>
        <p class="eyebrow">群众入口</p>
        <h2>提交民生诉求</h2>
        <p>群众描述问题、补充图片或语音信息，系统辅助形成清晰诉求并进入处理流程。</p>
        <strong>进入群众输入界面</strong>
      </RouterLink>

      <RouterLink class="entry-card management-entry" to="/management">
        <span class="entry-icon">管</span>
        <p class="eyebrow">政府管理部门入口</p>
        <h2>提出治理问题</h2>
        <p>管理人员提出公共服务问题，系统检索相关群众诉求并生成资源配置分析看板。</p>
        <strong>进入部门分析界面</strong>
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.home-shell {
  min-height: 100vh;
  padding: 28px;
}

.home-hero {
  min-height: 42vh;
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(360px, 0.92fr);
  gap: 28px;
  align-items: stretch;
  padding: 34px;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 250, 243, 0.98), rgba(239, 248, 249, 0.94)),
    radial-gradient(circle at 74% 18%, rgba(242, 138, 69, 0.18), transparent 24%);
  border: 1px solid rgba(210, 225, 231, 0.9);
  box-shadow: 0 28px 48px rgba(92, 121, 134, 0.14);
}

.home-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 780px;
}

.home-copy h1,
.home-copy p {
  margin: 0;
}

.home-copy h1 {
  margin-top: 10px;
  font-size: 46px;
  line-height: 1.12;
  letter-spacing: 0;
  color: #15313d;
}

.home-copy p:not(.eyebrow) {
  margin-top: 18px;
  color: rgba(56, 80, 92, 0.78);
  line-height: 1.85;
  font-size: 17px;
}

.flow-visual {
  position: relative;
  min-height: 280px;
  display: grid;
  grid-template-columns: 1fr 0.62fr 1fr 0.62fr 1fr;
  align-items: center;
  padding: 28px;
  overflow: hidden;
  border-radius: 24px;
  background:
    linear-gradient(120deg, rgba(255, 255, 255, 0.74), rgba(236, 246, 246, 0.78)),
    repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(99, 140, 152, 0.08) 33px),
    repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(99, 140, 152, 0.08) 41px);
  border: 1px solid rgba(205, 222, 229, 0.92);
}

.flow-dot,
.flow-core {
  min-height: 88px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #17313d;
  font-weight: 800;
  box-shadow: 0 18px 34px rgba(92, 121, 134, 0.16);
}

.flow-dot {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(220, 232, 236, 0.94);
}

.flow-core {
  color: #fff;
  background: linear-gradient(135deg, #f28a45, #dc6730);
}

.flow-line {
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(242, 138, 69, 0.2), rgba(60, 143, 160, 0.58));
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
  margin-top: 24px;
}

.entry-card {
  position: relative;
  min-height: 280px;
  display: grid;
  align-content: start;
  gap: 14px;
  padding: 28px;
  overflow: hidden;
  border-radius: 28px;
  color: inherit;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 24px 42px rgba(92, 121, 134, 0.12);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.entry-card:hover {
  transform: translateY(-3px);
  border-color: rgba(235, 127, 56, 0.44);
  box-shadow: 0 30px 52px rgba(92, 121, 134, 0.18);
}

.entry-card h2,
.entry-card p {
  margin: 0;
}

.entry-card h2 {
  font-size: 28px;
  color: #17313d;
}

.entry-card p:not(.eyebrow) {
  max-width: 560px;
  color: rgba(58, 83, 95, 0.78);
  line-height: 1.75;
}

.entry-card strong {
  width: fit-content;
  margin-top: 10px;
  padding: 10px 16px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #f28a45, #dc6730);
  font-size: 14px;
}

.entry-icon {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #3c8fa0, #246f7e);
  font-weight: 800;
}

.management-entry .entry-icon {
  background: linear-gradient(135deg, #f28a45, #dc6730);
}

@media (max-width: 980px) {
  .home-hero,
  .entry-grid {
    grid-template-columns: 1fr;
  }

  .home-copy h1 {
    font-size: 36px;
  }
}

@media (max-width: 640px) {
  .home-shell {
    padding: 16px;
  }

  .home-hero,
  .entry-card {
    padding: 22px;
    border-radius: 24px;
  }

  .home-copy h1 {
    font-size: 30px;
  }
}
</style>
