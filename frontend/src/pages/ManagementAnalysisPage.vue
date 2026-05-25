<template>
  <main class="dashboard-shell">
    <section class="page-hero management-hero">
      <div>
        <p class="eyebrow">部门管理分析端</p>
        <h1>提出问题，检索诉求并分析</h1>
        <p>
          部门管理人员输入公共服务问题，系统检索 50 条相关群众诉求，Agent 展示“问题理解 - 数据检索 - 时空分析 - 形成答案”的动态过程。
        </p>
      </div>
      <RouterLink class="nav-link" to="/">群众诉求链路</RouterLink>
    </section>

    <section class="management-grid">
      <section class="panel card-panel query-panel">
        <header class="panel-header">
          <div>
            <p class="eyebrow">管理问题</p>
            <h2>部门提问</h2>
          </div>
          <el-tag effect="light">检索 50 条诉求</el-tag>
        </header>

        <el-form label-position="top" class="query-form">
          <el-form-item label="分析问题">
            <el-input
              v-model="store.form.question"
              type="textarea"
              :rows="7"
              placeholder="例如：夏天中暑情况增多，我应该如何分配医疗资源？"
            />
          </el-form-item>
          <el-form-item label="分析区域">
            <el-input v-model="store.form.area" />
          </el-form-item>
          <el-form-item label="时间范围（天）">
            <el-input-number v-model="store.form.horizon_days" :min="1" :max="90" />
          </el-form-item>
        </el-form>

        <div class="panel-actions">
          <el-button type="primary" :loading="store.submitting" @click="store.analyzeCurrentQuestion()">
            开始分析
          </el-button>
          <el-button plain @click="store.resetQuestion()">恢复默认问题</el-button>
        </div>

        <section class="question-summary">
          <strong>{{ store.stageLabel }}</strong>
          <p>{{ store.notice }}</p>
          <template v-if="store.result">
            <div class="keyword-row">
              <span v-for="keyword in store.result.extracted_keywords" :key="keyword">{{ keyword }}</span>
            </div>
            <RouterLink class="dashboard-link" to="/management/dashboard">查看数据看板</RouterLink>
          </template>
        </section>
      </section>

      <ManagementAgentFlowPanel />
    </section>
  </main>
</template>

<script setup lang="ts">
import ManagementAgentFlowPanel from '@/components/ManagementAgentFlowPanel.vue';
import { useManagementStore } from '@/stores/management';

const store = useManagementStore();
</script>

<style scoped>
.management-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.82fr) minmax(560px, 1.18fr);
  gap: 20px;
  align-items: start;
}

.query-panel,
.query-form {
  display: grid;
  gap: 14px;
}

.panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.question-summary {
  display: grid;
  gap: 12px;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 243, 232, 0.94), rgba(241, 247, 248, 0.96));
  border: 1px solid rgba(210, 223, 230, 0.95);
}

.question-summary strong {
  color: #17313d;
}

.question-summary p {
  margin: 0;
  color: rgba(61, 87, 99, 0.78);
  line-height: 1.7;
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.keyword-row span {
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  color: #274958;
  font-size: 12px;
}

.dashboard-link {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #f28a45, #dc6730);
  text-decoration: none;
  font-size: 13px;
  font-weight: 600;
}

@media (max-width: 1280px) {
  .management-grid {
    grid-template-columns: 1fr;
  }
}
</style>
