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
      <VueFlow
        :nodes="nodes"
        :edges="edges"
        :fit-view-options="fitViewOptions"
        :min-zoom="0.45"
        :max-zoom="1.45"
        fit-view
        fit-view-on-init
        class="flow-canvas"
        @node-click="handleNodeClick"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { MarkerType, Position, VueFlow, type Edge, type Node } from '@vue-flow/core';
import gsap from 'gsap';
import { computed, nextTick, ref, watch } from 'vue';

import { useEmergencyStore } from '@/stores/emergency';

const store = useEmergencyStore();
const badgeRef = ref<HTMLElement | null>(null);
const shellRef = ref<HTMLElement | null>(null);
const fitViewOptions = { padding: 0.015, minZoom: 0.72, maxZoom: 1.08 };

const nodes = computed<Node[]>(() => {
  const demandNodes = store.demandCases.map((caseItem, index) => ({
    id: `demand-${caseItem.id}`,
    label: `${caseItem.source}\n${caseItem.communityName}`,
    position: { x: 4, y: 22 + index * 72 },
    sourcePosition: Position.Right,
    class: caseItem.id === store.selectedCaseId ? 'demand-node active' : 'demand-node',
    data: { label: `${caseItem.source}\n${caseItem.communityName}` },
  }));

  const supplyNodeList = store.supplyNodes.map((supply, index) => ({
    id: `supply-${supply.id}`,
    label: `${supply.title}\n${supply.unit}`,
    position: { x: 482, y: 8 + index * 64 },
    targetPosition: Position.Left,
    class: supply.id === store.activeSupplyId && store.routeActivated ? 'supply-node active' : 'supply-node',
    data: { label: `${supply.title}\n${supply.unit}` },
  }));

  return [
    ...demandNodes,
    {
      id: 'route-agent',
      label: '诉求路由\nAgent',
      position: { x: 224, y: 154 },
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

watch(
  () => [store.flowStage, store.selectedCaseId],
  async () => {
    await nextTick();
    if (badgeRef.value) {
      gsap.fromTo(badgeRef.value, { opacity: 0.2, y: 8 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' });
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
  gap: 10px;
  transition: border-color 0.24s ease, box-shadow 0.24s ease, transform 0.24s ease;
}

.route-panel.highlighted {
  border-color: rgba(235, 127, 56, 0.92);
  box-shadow: 0 0 0 6px rgba(235, 127, 56, 0.18), 0 28px 50px rgba(235, 127, 56, 0.18);
  transform: translateY(-2px);
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
  height: clamp(520px, 68vh, 640px);
  min-height: 520px;
  border-radius: 20px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(255, 248, 240, 0.95), rgba(239, 247, 248, 0.98) 48%, rgba(255, 251, 246, 0.95)),
    radial-gradient(circle at center, rgba(238, 132, 65, 0.2), transparent 28%);
  border: 1px solid rgba(211, 225, 231, 0.9);
}

.flow-canvas {
  width: 100%;
  height: 100%;
}


:deep(.vue-flow__node) {
  white-space: pre-line;
  width: 164px;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: 16px;
  border: 1px solid rgba(213, 225, 231, 0.98);
  background: rgba(255, 255, 255, 0.94);
  color: #16323b;
  box-shadow: none;
  padding: 10px 12px;
  font-weight: 600;
  line-height: 1.45;
  cursor: pointer;
}

:deep(.vue-flow__node.agent-node) {
  width: 214px;
  min-height: 132px;
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 211, 181, 0.96), rgba(255, 248, 242, 0.98));
  border-color: rgba(235, 127, 56, 0.42);
  font-size: 20px;
}

:deep(.vue-flow__node.active) {
  border-color: rgba(235, 127, 56, 0.92);
  box-shadow: 0 0 0 4px rgba(235, 127, 56, 0.14), 0 18px 34px rgba(235, 127, 56, 0.2);
}

:deep(.vue-flow__node.supply-node.active) {
  border-color: rgba(31, 138, 151, 0.48);
  box-shadow: 0 16px 30px rgba(31, 138, 151, 0.12);
}

</style>