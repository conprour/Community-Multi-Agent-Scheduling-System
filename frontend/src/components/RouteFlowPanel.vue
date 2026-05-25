<template>
  <section class="panel card-panel route-panel">
    <header class="panel-header">
      <div>
        <p class="eyebrow">责任链路由</p>
        <h2>智能调度可视区</h2>
      </div>
      <span class="status-badge" ref="badgeRef">{{ store.stageLabel }}</span>
    </header>

    <div class="flow-shell" ref="shellRef">
      <VueFlow :nodes="nodes" :edges="edges" fit-view class="flow-canvas" />
    </div>

    <div class="route-bubble" ref="bubbleRef">
      <strong>{{ decisionTitle }}</strong>
      <p>{{ decisionText }}</p>
    </div>

    <div class="flow-steps">
      <article v-for="step in steps" :key="step.key" class="flow-step" :class="step.state">
        <span>{{ step.index }}</span>
        <div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
      </article>
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
const bubbleRef = ref<HTMLElement | null>(null);
const shellRef = ref<HTMLElement | null>(null);

const stageRank = computed(() => {
  if (store.flowStage === 'completed') {
    return 3;
  }
  if (store.flowStage === 'routing') {
    return 2;
  }
  if (store.flowStage === 'intake') {
    return 1;
  }
  return 0;
});

const nodes = computed<Node[]>(() => [
  {
    id: 'citizen',
    label: '居民报事',
    position: { x: 0, y: 130 },
    sourcePosition: Position.Right,
    class: stageRank.value >= 1 ? 'flow-node active' : 'flow-node',
    data: { label: '居民报事' },
  },
  {
    id: 'intake',
    label: '诉求接受 Agent',
    position: { x: 210, y: 130 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    class: stageRank.value >= 1 ? 'flow-node active intake' : 'flow-node intake',
    data: { label: '诉求接受 Agent' },
  },
  {
    id: 'routing',
    label: '排序与发放 Agent',
    position: { x: 460, y: 130 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    class: stageRank.value >= 2 ? 'flow-node active route' : 'flow-node route',
    data: { label: '排序与发放 Agent' },
  },
  {
    id: 'service',
    label: store.response?.routing_decision.responsible_unit ?? '责任单位',
    position: { x: 720, y: 130 },
    targetPosition: Position.Left,
    class: stageRank.value >= 3 ? 'flow-node active service' : 'flow-node service',
    data: { label: store.response?.routing_decision.responsible_unit ?? '责任单位' },
  },
]);

const edges = computed<Edge[]>(() => [
  createEdge('e1', 'citizen', 'intake', stageRank.value >= 1),
  createEdge('e2', 'intake', 'routing', stageRank.value >= 2),
  createEdge('e3', 'routing', 'service', stageRank.value >= 3),
]);

const steps = computed(() => {
  const states = [
    stageRank.value >= 1 ? 'done' : 'idle',
    stageRank.value >= 1 ? 'active' : 'idle',
    stageRank.value >= 2 ? 'active' : 'idle',
    stageRank.value >= 3 ? 'done' : 'idle',
  ];

  return [
    {
      key: 'step-report',
      index: '01',
      title: '报事已接收',
      description: '定位楼栋、楼层、风险和描述内容。',
      state: states[0],
    },
    {
      key: 'step-intake',
      index: '02',
      title: '需求结构化',
      description: '提取类别、紧急度、影响范围和缺失字段。',
      state: states[1],
    },
    {
      key: 'step-routing',
      index: '03',
      title: '责任匹配',
      description: '根据规则优先匹配责任单位和值班岗位。',
      state: states[2],
    },
    {
      key: 'step-service',
      index: '04',
      title: '生成服务安排',
      description: '输出预计到场时间、处理动作和协同要求。',
      state: states[3],
    },
  ];
});

const decisionTitle = computed(() => {
  if (store.flowStage === 'routing') {
    return '正在匹配责任单位';
  }
  if (store.flowStage === 'completed') {
    return '责任链路已生成';
  }
  if (store.flowStage === 'intake') {
    return '正在识别急事特征';
  }
  return '等待提交急事';
});

const decisionText = computed(() => {
  if (store.flowStage === 'routing') {
    return '系统正在根据问题类型、位置和风险等级筛选责任单位。';
  }
  if (store.flowStage === 'completed' && store.response) {
    return `已匹配：${store.response.routing_decision.responsible_unit}，${store.response.routing_decision.service_sla}。`;
  }
  if (store.flowStage === 'intake') {
    return '正在从文本、语音或图像输入中提取结构化需求信息。';
  }
  return '主案例已预置，可直接点击左侧按钮体验完整路由。';
});

watch(
  () => store.flowStage,
  async () => {
    await nextTick();
    if (badgeRef.value) {
      gsap.fromTo(badgeRef.value, { opacity: 0.2, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    }
    if (bubbleRef.value) {
      gsap.fromTo(bubbleRef.value, { opacity: 0.3, y: 12 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
    }
    if (shellRef.value) {
      gsap.fromTo(shellRef.value, { scale: 0.985 }, { scale: 1, duration: 0.3, ease: 'power2.out' });
    }
  },
  { immediate: true },
);

function createEdge(id: string, source: string, target: string, active: boolean): Edge {
  return {
    id,
    source,
    target,
    animated: active,
    markerEnd: MarkerType.ArrowClosed,
    style: {
      stroke: active ? '#ff8a34' : 'rgba(111, 139, 160, 0.45)',
      strokeWidth: active ? '3' : '2',
    },
  };
}
</script>

<style scoped>
.route-panel {
  display: grid;
  gap: 18px;
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

.flow-shell {
  min-height: 320px;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at top, rgba(255, 173, 120, 0.35), transparent 42%),
    linear-gradient(180deg, rgba(255, 251, 246, 0.96), rgba(238, 246, 247, 0.92));
  border: 1px solid rgba(212, 225, 230, 0.92);
}

.flow-canvas {
  height: 320px;
}

.route-bubble {
  padding: 16px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 243, 232, 0.94), rgba(241, 247, 248, 0.96));
  border: 1px solid rgba(210, 223, 230, 0.95);
}

.route-bubble strong {
  display: block;
  font-size: 15px;
  color: #203640;
}

.route-bubble p {
  margin: 8px 0 0;
  color: rgba(52, 76, 88, 0.82);
  line-height: 1.7;
}

.flow-steps {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.flow-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  background: rgba(252, 253, 253, 0.9);
  border: 1px solid rgba(214, 226, 230, 0.9);
}

.flow-step span {
  width: 42px;
  height: 42px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background: rgba(240, 246, 247, 0.92);
  color: rgba(65, 92, 103, 0.86);
  font-size: 12px;
}

.flow-step h3,
.flow-step p {
  margin: 0;
}

.flow-step h3 {
  font-size: 15px;
  color: #17303a;
}

.flow-step p {
  margin-top: 6px;
  color: rgba(63, 88, 99, 0.76);
  line-height: 1.6;
}

.flow-step.active {
  border-color: rgba(255, 145, 77, 0.34);
  box-shadow: inset 0 0 0 1px rgba(255, 145, 77, 0.14);
}

.flow-step.done span,
.flow-step.active span {
  background: linear-gradient(135deg, #ff9f55, #ff6e29);
  color: #fff;
}

:deep(.vue-flow__node) {
  width: 180px;
  border-radius: 18px;
  border: 1px solid rgba(213, 225, 231, 0.98);
  background: rgba(255, 255, 255, 0.94);
  color: #16323b;
  box-shadow: none;
  padding: 14px 16px;
  font-weight: 600;
}

:deep(.vue-flow__node.active) {
  border-color: rgba(255, 144, 77, 0.48);
  box-shadow: 0 16px 30px rgba(255, 128, 52, 0.14);
}

@media (max-width: 900px) {
  .flow-steps {
    grid-template-columns: 1fr;
  }
}
</style>
