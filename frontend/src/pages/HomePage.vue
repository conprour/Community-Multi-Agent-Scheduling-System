<template>
  <main class="home-shell">
    <section class="home-hero">
      <div class="home-copy">
        <p class="eyebrow">问办通</p>
        <h1>社会民生诉求的智能协同调度入口</h1>
        <p>
          将群众诉求快速回应与政府资源合理分配放在同一个闭环里：从问题提交、Agent 理解、
          协同派发到治理分析，帮助民生问题更快被看见、更准被处理。
        </p>
        <div class="hero-metrics" aria-label="系统能力摘要">
          <span><strong>2</strong> 类入口</span>
          <span><strong>50</strong> 条诉求检索</span>
          <span><strong>Agent</strong> 协同分析</span>
        </div>
      </div>

      <div class="flow-board" aria-hidden="true">
        <div class="board-topline">
          <span>民生问题流转</span>
          <i>实时协同</i>
        </div>
        <div class="clean-flow">
          <article class="process-step">
            <span>01</span>
            <strong>群众诉求</strong>
            <p>文本、图片、语音汇入</p>
          </article>
          <span class="flow-connector"></span>
          <article class="process-step agent-step">
            <span>02</span>
            <strong>Agent 协同</strong>
            <p>理解、分类、补全、路由</p>
          </article>
          <span class="flow-connector"></span>
          <article class="process-step">
            <span>03</span>
            <strong>部门调度</strong>
            <p>派单处置与资源分配</p>
          </article>
          <div class="signal-row">
            <span>快速回应</span>
            <span>合理分配</span>
            <span>数据看板</span>
          </div>
        </div>
      </div>
    </section>

    <section class="entry-grid" aria-label="系统入口">
      <RouterLink class="entry-card citizen-entry" to="/citizen">
        <span class="entry-icon">诉</span>
        <div>
          <p class="eyebrow">群众入口</p>
          <h2>提交民生诉求</h2>
        </div>
        <p>群众描述问题、补充图片或语音信息，系统辅助形成清晰诉求并进入处理流程。</p>
        <strong>进入群众输入界面</strong>
      </RouterLink>

      <RouterLink class="entry-card management-entry" to="/management">
        <span class="entry-icon">管</span>
        <div>
          <p class="eyebrow">政府管理部门入口</p>
          <h2>提出治理问题</h2>
        </div>
        <p>管理人员提出公共服务问题，系统检索相关群众诉求并生成资源配置分析看板。</p>
        <strong>进入部门分析界面</strong>
      </RouterLink>
    </section>
  </main>
</template>

<style scoped>
.home-shell {
  min-height: 100vh;
  padding: 24px;
}

.home-hero {
  min-height: 470px;
  display: grid;
  grid-template-columns: minmax(0, 0.94fr) minmax(420px, 1.06fr);
  gap: 24px;
  align-items: stretch;
  padding: 30px;
  border-radius: 30px;
  background:
    linear-gradient(135deg, rgba(255, 250, 244, 0.98), rgba(239, 248, 249, 0.94)),
    linear-gradient(90deg, rgba(242, 138, 69, 0.08), rgba(60, 143, 160, 0.1));
  border: 1px solid rgba(210, 225, 231, 0.92);
  box-shadow: 0 28px 48px rgba(92, 121, 134, 0.14);
}

.home-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 760px;
}

.home-copy h1,
.home-copy p {
  margin: 0;
}

.home-copy h1 {
  margin-top: 10px;
  font-size: 44px;
  line-height: 1.14;
  letter-spacing: 0;
  color: #15313d;
}

.home-copy p:not(.eyebrow) {
  margin-top: 18px;
  color: rgba(56, 80, 92, 0.78);
  line-height: 1.85;
  font-size: 17px;
}

.hero-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 26px;
}

.hero-metrics span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 13px;
  border-radius: 999px;
  color: rgba(49, 75, 87, 0.86);
  background: rgba(255, 255, 255, 0.68);
  border: 1px solid rgba(211, 225, 231, 0.9);
  font-size: 13px;
}

.hero-metrics strong {
  color: #dc6730;
}

.flow-board {
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
  min-height: 410px;
  padding: 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(205, 222, 229, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.board-topline {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  color: #17313d;
  font-weight: 800;
}

.board-topline i {
  padding: 7px 10px;
  border-radius: 999px;
  color: #dc6730;
  background: rgba(242, 138, 69, 0.12);
  font-size: 12px;
  font-style: normal;
}

.clean-flow {
  min-height: 330px;
  display: grid;
  grid-template-columns: minmax(120px, 1fr) 42px minmax(120px, 1fr) 42px minmax(120px, 1fr);
  grid-template-rows: 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 24px;
  border-radius: 20px;
  background:
    linear-gradient(135deg, rgba(246, 251, 250, 0.96), rgba(230, 244, 245, 0.94));
  border: 1px solid rgba(214, 228, 233, 0.92);
}

.process-step {
  min-height: 168px;
  display: grid;
  align-content: center;
  gap: 10px;
  padding: 20px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(218, 231, 236, 0.95);
  box-shadow: 0 18px 30px rgba(92, 121, 134, 0.13);
}

.process-step span {
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  color: #246f7e;
  background: rgba(60, 143, 160, 0.12);
  font-size: 12px;
  font-weight: 800;
}

.process-step strong {
  color: #17313d;
  font-size: 20px;
}

.process-step p {
  margin: 0;
  color: rgba(56, 80, 92, 0.72);
  line-height: 1.6;
  font-size: 13px;
}

.agent-step {
  color: #fff;
  background: linear-gradient(135deg, #f28a45, #dc6730);
  border-color: rgba(242, 138, 69, 0.6);
}

.agent-step span {
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
}

.agent-step strong,
.agent-step p {
  color: #fff;
}

.flow-connector {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(60, 143, 160, 0.3), rgba(242, 138, 69, 0.55));
}

.signal-row {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 4px;
}

.signal-row span {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  border-radius: 999px;
  color: rgba(49, 75, 87, 0.86);
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(205, 222, 229, 0.86);
  font-size: 12px;
  font-weight: 700;
}

.entry-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.entry-card {
  position: relative;
  min-height: 216px;
  display: grid;
  grid-template-columns: auto 1fr;
  align-content: start;
  gap: 14px 16px;
  padding: 24px;
  overflow: hidden;
  border-radius: 26px;
  color: inherit;
  text-decoration: none;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 22px 38px rgba(92, 121, 134, 0.12);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.entry-card:hover {
  transform: translateY(-3px);
  border-color: rgba(235, 127, 56, 0.44);
  box-shadow: 0 28px 46px rgba(92, 121, 134, 0.18);
}

.entry-card h2,
.entry-card p {
  margin: 0;
}

.entry-card h2 {
  margin-top: 6px;
  font-size: 27px;
  color: #17313d;
}

.entry-card p:not(.eyebrow) {
  grid-column: 1 / -1;
  max-width: 620px;
  color: rgba(58, 83, 95, 0.78);
  line-height: 1.75;
}

.entry-card strong {
  grid-column: 1 / -1;
  width: fit-content;
  padding: 10px 16px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #f28a45, #dc6730);
  font-size: 14px;
}

.entry-icon {
  width: 54px;
  height: 54px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(135deg, #3c8fa0, #246f7e);
  font-weight: 800;
}

.management-entry .entry-icon,
.management-entry strong {
  background: linear-gradient(135deg, #f28a45, #dc6730);
}

.citizen-entry strong {
  background: linear-gradient(135deg, #3c8fa0, #246f7e);
}

@media (max-width: 1080px) {
  .home-hero,
  .entry-grid {
    grid-template-columns: 1fr;
  }

  .home-hero {
    min-height: auto;
  }

  .home-copy h1 {
    font-size: 36px;
  }

  .flow-board {
    min-height: 270px;
  }

  .clean-flow {
    min-height: 205px;
  }

  .entry-card {
    min-height: 190px;
  }

  .process-step {
    min-height: 112px;
  }

}

@media (max-width: 640px) {
  .home-shell {
    padding: 16px;
  }

  .home-hero,
  .entry-card {
    padding: 20px;
    border-radius: 24px;
  }

  .home-copy h1 {
    font-size: 30px;
  }

  .flow-board {
    min-height: 240px;
    padding: 14px;
  }

  .clean-flow {
    min-height: 174px;
    grid-template-columns: 1fr;
    grid-template-rows: none;
    gap: 12px;
    padding: 14px;
  }

  .process-step {
    min-height: 96px;
    padding: 16px;
  }

  .flow-connector {
    width: 3px;
    height: 22px;
    justify-self: center;
  }

  .entry-card {
    grid-template-columns: 1fr;
    min-height: 0;
  }
}
</style>
