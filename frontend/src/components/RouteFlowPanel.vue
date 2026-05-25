<template>
  <section class="panel card-panel route-panel" :class="{ highlighted: store.flowStage === 'routing' }">
    <header class="panel-header">
      <div>
        <p class="eyebrow">智能调度可视区</p>
        <h2>诉求路由 Agent</h2>
      </div>
      <span class="status-badge" ref="badgeRef">{{ store.stageLabel }}</span>
    </header>

    <div class="route-map" ref="shellRef">
      <VueFlow :nodes="nodes" :edges="edges" fit-view class="flow-canvas" @node-click="handleNodeClick" />
    </div>

    <section class="route-explain" ref="bubbleRef">
      <div>
        <span>当前需求</span>
        <strong>{{ store.selectedCase.title }}</strong>
      </div>
      <p>{{ decisionText }}</p>
    </section>

    <section class="dispatch-strip">
      <article :class="{ active: stageRank >= 1 }">
        <span>01</span>
        <strong>需求端案例</strong>
        <p>点击左侧节点切换诉求样例。</p>
      </article>
      <article :class="{ active: stageRank >= 2 }">
        <span>02</span>
        <strong>Agent 分析</strong>
        <p>从对话、图像或语音中抽取风险。</p>
      </article>
      <article :class="{ active: stageRank >= 3 }">
        <span>03</span>
        <strong>供给侧派发</strong>
        <p>生成责任单位、工单和服务信息。</p>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { MarkerType, Position, VueFlow, type Edge, type Node } from '@vue-flow/core';
import gsap from 'gsap';
import { computed, nextTick, ref, watch } from 'vue';

import { useEmergencyStore } from '@/stores/emergency';

const store = useEmergencyStore();
const badgeRef = ref<HTMLElement | null>(null);
const bubbleRef = ref<HTMLElement | null>(null);
const shellRef = ref<HTMLElement | null>(null);

const stageRank = computed(() => {
  if (store.flowStage === 'completed') {
    return 3;
  }
  if (store.flowStage === 'routing') {
    return 2;
  }
  if (store.flowStage === 'feedback') {
    return 1;
  }
  return 0;
});

const nodes = computed<Node[]>(() => {
  const demandNodes = store.demandCases.map((caseItem, index) => ({
    id: `demand-${caseItem.id}`,
    label: `${caseItem.source}\n${caseItem.communityName}`,
    position: { x: 0, y: 34 + index * 92 },
    sourcePosition: Position.Right,
    class: caseItem.id === store.selectedCaseId ? 'demand-node active' : 'demand-node',
    data: { label: `${caseItem.source}\n${caseItem.communityName}` },
  }));

  const supplyNodeList = store.supplyNodes.map((supply, index) => ({
    id: `supply-${supply.id}`,
    label: `${supply.title}\n${supply.unit}`,
    position: { x: 640, y: 34 + index * 92 },
    targetPosition: Position.Left,
    class: supply.id === store.activeSupplyId && store.routeActivated ? 'supply-node active' : 'supply-node',
    data: { label: `${supply.title}\n${supply.unit}` },
  }));

  return [
    ...demandNodes,
    {
      id: 'route-agent',
      label: '诉求路由\nAgent',
      position: { x: 318, y: 172 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      class: store.routeActivated ? 'agent-node active' : 'agent-node',
      data: { label: '诉求路由\nAgent' },
    },
    ...supplyNodeList,
  ];
});

const edges = computed<Edge[]>(() => {
  const demandEdges = store.demandCases.map((caseItem) =>
    createEdge(
      `edge-${caseItem.id}-agent`,
      `demand-${caseItem.id}`,
      'route-agent',
      caseItem.id === store.selectedCaseId && store.routeActivated,
    ),
  );

  const supplyEdges = store.supplyNodes.map((supply) =>
    createEdge(
      `edge-agent-${supply.id}`,
      'route-agent',
      `supply-${supply.id}`,
      supply.id === store.activeSupplyId && store.routeActivated,
    ),
  );

  return [...demandEdges, ...supplyEdges];
});

const decisionText = computed(() => {
  if (store.flowStage === 'completed' && store.response) {
    return `已派发至 ${store.response.routing_decision.responsible_unit}，${store.response.routing_decision.service_sla}。`;
  }
  if (store.flowStage === 'routing') {
    return 'Agent 正在将左侧需求节点连接到右侧供给节点，生成工单和服务建议。';
  }
  if (store.flowStage === 'feedback') {
    return '受理反馈已生成，下一步将进入诉求路由 Agent。';
  }
  if (store.flowStage === 'clarifying') {
    return '客服正在等待居民确认或继续更新信息，路由暂不启动。';
  }
  if (store.flowStage === 'intake') {
    return '客服正在整理当前诉求，并生成确认话术。';
  }
  return '点击任一居民节点会把一句话诉求预填到左侧发送框。';
});

watch(
  () => [store.flowStage, store.selectedCaseId],
  async () => {
    await nextTick();
    if (badgeRef.value) {
      gsap.fromTo(badgeRef.value, { opacity: 0.2, y: 8 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' });
    }
    if (bubbleRef.value) {
      gsap.fromTo(bubbleRef.value, { opacity: 0.25, y: 12 }, { opacity: 1, y: 0, duration: 0.38, ease: 'power2.out' });
    }
    if (shellRef.value) {
      gsap.fromTo(shellRef.value, { scale: 0.99 }, { scale: 1, duration: 0.28, ease: 'power2.out' });
    }
  },
  { immediate: true },
);

function handleNodeClick(event: { node: Node }) {
  const nodeId = event.node.id;
  if (nodeId.startsWith('demand-')) {
    store.selectDemandCase(nodeId.replace('demand-', ''));
  }
}

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
.route-panel {
  display: grid;
  gap: 16px;
  transition: border-color 0.24s ease, box-shadow 0.24s ease, transform 0.24s ease;
}

.route-panel.highlighted {
  border-color: rgba(235, 127, 56, 0.62);
  box-shadow: 0 0 0 3px rgba(235, 127, 56, 0.12), 0 24px 42px rgba(235, 127, 56, 0.12);
  transform: translateY(-1px);
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

.route-map {
  min-height: 520px;
  border-radius: 24px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 248, 240, 0.95), rgba(239, 247, 248, 0.98) 48%, rgba(255, 251, 246, 0.95)),
    radial-gradient(circle at center, rgba(238, 132, 65, 0.2), transparent 28%);
  border: 1px solid rgba(211, 225, 231, 0.9);
}

.flow-canvas {
  height: 520px;
}

.route-explain {
  display: grid;
  gap: 8px;
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 243, 232, 0.94), rgba(241, 247, 248, 0.96));
  border: 1px solid rgba(210, 223, 230, 0.95);
}

.route-explain div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  color: rgba(67, 91, 103, 0.76);
  font-size: 13px;
}

.route-explain strong {
  color: #17313d;
}

.route-explain p {
  margin: 0;
  color: rgba(52, 76, 88, 0.84);
  line-height: 1.7;
}

.dispatch-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.dispatch-strip article {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(213, 225, 231, 0.86);
}

.dispatch-strip article.active {
  border-color: rgba(235, 127, 56, 0.46);
  box-shadow: inset 0 0 0 1px rgba(235, 127, 56, 0.12);
}

.dispatch-strip span,
.dispatch-strip strong {
  display: block;
}

.dispatch-strip span {
  color: #df6f2b;
  font-size: 12px;
}

.dispatch-strip strong {
  margin-top: 6px;
  color: #17313d;
}

.dispatch-strip p {
  margin: 6px 0 0;
  color: rgba(61, 87, 99, 0.74);
  line-height: 1.6;
  font-size: 13px;
}

:deep(.vue-flow__node) {
  white-space: pre-line;
  width: 178px;
  min-height: 66px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 18px;
  border: 1px solid rgba(213, 225, 231, 0.98);
  background: rgba(255, 255, 255, 0.94);
  color: #16323b;
  box-shadow: none;
  padding: 12px 14px;
  font-weight: 600;
  line-height: 1.45;
  cursor: pointer;
}

:deep(.vue-flow__node.agent-node) {
  width: 190px;
  min-height: 120px;
  border-radius: 26px;
  background: linear-gradient(180deg, rgba(255, 211, 181, 0.96), rgba(255, 248, 242, 0.98));
  border-color: rgba(235, 127, 56, 0.42);
  font-size: 18px;
}

:deep(.vue-flow__node.active) {
  border-color: rgba(235, 127, 56, 0.62);
  box-shadow: 0 16px 30px rgba(235, 127, 56, 0.14);
}

:deep(.vue-flow__node.supply-node.active) {
  border-color: rgba(31, 138, 151, 0.48);
  box-shadow: 0 16px 30px rgba(31, 138, 151, 0.12);
}

@media (max-width: 900px) {
  .dispatch-strip {
    grid-template-columns: 1fr;
  }
}
</style>