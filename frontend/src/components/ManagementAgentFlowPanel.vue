<template>
  <section class="panel card-panel management-flow">
    <header class="panel-header">
      <div>
        <p class="eyebrow">管理分析 Agent</p>
        <h2>问题 - 模拟 - 分析 - 结果</h2>
      </div>
      <span class="status-badge">{{ store.stageLabel }}</span>
    </header>

    <div class="flow-map">
      <VueFlow :nodes="nodes" :edges="edges" fit-view class="flow-canvas" />
    </div>

    <section class="step-list">
      <article v-for="(step, index) in displaySteps" :key="step.title" :class="{ active: store.stageIndex >= index + 1 }">
        <span>{{ String(index + 1).padStart(2, '0') }}</span>
        <div>
          <strong>{{ step.title }}</strong>
          <p>{{ step.output_summary }}</p>
        </div>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { MarkerType, Position, VueFlow, type Edge, type Node } from '@vue-flow/core';
import { computed } from 'vue';

import { useManagementStore } from '@/stores/management';

const store = useManagementStore();

const displaySteps = computed(() => {
  if (store.result) {
    return store.result.agent_steps;
  }

  return [
    {
      title: '问题理解 Agent',
      output_summary: '提取管理问题中的主题、对象、区域、资源关键词。',
    },
    {
      title: '诉求模拟 Agent',
      output_summary: '后端 AI/规则生成 50 条匿名群众诉求数据。',
    },
    {
      title: '时空聚合 Agent',
      output_summary: '读取诉求的时间、社区、坐标、类别和严重程度。',
    },
    {
      title: '资源建议 Agent',
      output_summary: '输出对问题的回答、资源配置建议和看板摘要。',
    },
  ];
});

const nodeClass = (rank: number) => (store.stageIndex >= rank ? 'agent-step-node active' : 'agent-step-node');

const nodes = computed<Node[]>(() => [
  {
    id: 'question',
    label: '部门问题',
    position: { x: 0, y: 150 },
    sourcePosition: Position.Right,
    class: nodeClass(1),
    data: { label: '部门问题' },
  },
  {
    id: 'extract',
    label: '问题理解\nAgent',
    position: { x: 230, y: 70 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    class: nodeClass(1),
    data: { label: '问题理解\nAgent' },
  },
  {
    id: 'simulate',
    label: '50 条诉求\n模拟生成',
    position: { x: 470, y: 70 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    class: nodeClass(2),
    data: { label: '50 条诉求\n模拟生成' },
  },
  {
    id: 'analysis',
    label: '时空聚合\n读取分析',
    position: { x: 470, y: 230 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    class: nodeClass(3),
    data: { label: '时空聚合\n读取分析' },
  },
  {
    id: 'answer',
    label: '答案与看板',
    position: { x: 720, y: 150 },
    targetPosition: Position.Left,
    class: nodeClass(4),
    data: { label: '答案与看板' },
  },
]);

const edges = computed<Edge[]>(() => [
  createEdge('q-e', 'question', 'extract', store.stageIndex >= 1),
  createEdge('e-s', 'extract', 'simulate', store.stageIndex >= 2),
  createEdge('s-a', 'simulate', 'analysis', store.stageIndex >= 3),
  createEdge('a-r', 'analysis', 'answer', store.stageIndex >= 4),
]);

function createEdge(id: string, source: string, target: string, active: boolean): Edge {
  return {
    id,
    source,
    target,
    animated: active,
    markerEnd: MarkerType.ArrowClosed,
    style: {
      stroke: active ? '#e9752f' : 'rgba(126, 154, 166, 0.34)',
      strokeWidth: active ? '3' : '1.8',
    },
  };
}
</script>

<style scoped>
.management-flow {
  display: grid;
  gap: 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(242, 141, 78, 0.16);
  color: #d56722;
  font-size: 12px;
}

.flow-map {
  min-height: 380px;
  border-radius: 24px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 248, 240, 0.95), rgba(239, 247, 248, 0.98) 48%, rgba(255, 251, 246, 0.95)),
    radial-gradient(circle at center, rgba(238, 132, 65, 0.2), transparent 28%);
  border: 1px solid rgba(211, 225, 231, 0.9);
}

.flow-canvas {
  height: 380px;
}

.step-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.step-list article {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(213, 225, 231, 0.86);
}

.step-list article.active {
  border-color: rgba(235, 127, 56, 0.46);
  box-shadow: inset 0 0 0 1px rgba(235, 127, 56, 0.12);
}

.step-list span {
  color: #df6f2b;
  font-size: 12px;
}

.step-list strong {
  color: #17313d;
}

.step-list p {
  margin: 6px 0 0;
  color: rgba(61, 87, 99, 0.74);
  line-height: 1.6;
  font-size: 13px;
}

:deep(.vue-flow__node) {
  white-space: pre-line;
  width: 168px;
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 20px;
  border: 1px solid rgba(213, 225, 231, 0.98);
  background: rgba(255, 255, 255, 0.94);
  color: #16323b;
  padding: 12px 14px;
  font-weight: 700;
  line-height: 1.45;
}

:deep(.vue-flow__node.active) {
  border-color: rgba(235, 127, 56, 0.62);
  box-shadow: 0 16px 30px rgba(235, 127, 56, 0.14);
}

@media (max-width: 1100px) {
  .step-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .step-list {
    grid-template-columns: 1fr;
  }
}
</style>
