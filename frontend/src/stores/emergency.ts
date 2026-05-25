import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';

import { submitEmergency, uploadAttachments } from '@/api/emergency';
import { buildMockResponse } from '@/mocks/waterPipeDemo';
import type { EmergencyFlowResponse, EmergencyReportCreate, FlowStage } from '@/types/emergency';

export interface DemandCase {
  id: string;
  title: string;
  brief: string;
  source: string;
  location: string;
  description: string;
  tags: string[];
  supplyId: string;
}

export interface SupplyNode {
  id: string;
  title: string;
  unit: string;
}

const demandCases: DemandCase[] = [
  {
    id: 'water-pipe',
    title: '水管爆裂',
    brief: '楼道积水，可能影响电梯井和公共电路。',
    source: '2栋居民',
    location: '2栋3单元4楼电梯口',
    description: '2栋3单元4楼水管爆了，地上全是水，怕漏到电梯里。',
    tags: ['漏水', '紧急', '公共区域'],
    supplyId: 'repair-team',
  },
  {
    id: 'power-light',
    title: '楼道停电',
    brief: '夜间楼道无照明，老人上下楼有安全风险。',
    source: '5栋居民',
    location: '5栋2单元6楼楼道',
    description: '5栋2单元6楼楼道灯全灭了，晚上老人上下楼看不清。',
    tags: ['停电', '夜间', '公共区域'],
    supplyId: 'electrician',
  },
  {
    id: 'elevator-risk',
    title: '电梯异常',
    brief: '电梯门反复开合，居民担心被困或夹伤。',
    source: '1栋居民',
    location: '1栋1单元电梯口',
    description: '1栋1单元电梯门一直反复开合，有老人不敢进，担心夹人。',
    tags: ['电梯', '紧急', '安全风险'],
    supplyId: 'elevator-team',
  },
  {
    id: 'corridor-blocked',
    title: '通道堵塞',
    brief: '楼道堆物堵住消防通道，需要社区核实协调。',
    source: '7栋居民',
    location: '7栋1单元3楼楼道',
    description: '7栋1单元3楼楼道堆了很多杂物，消防通道被堵住了。',
    tags: ['消防通道', '公共区域', '安全风险'],
    supplyId: 'community-desk',
  },
];

const supplyNodes: SupplyNode[] = [
  { id: 'repair-team', title: '维修组', unit: '物业工程维修组' },
  { id: 'electrician', title: '电工班', unit: '物业电工班' },
  { id: 'elevator-team', title: '电梯维保', unit: '电梯维保单位' },
  { id: 'community-desk', title: '社区受理台', unit: '社区值班人员' },
];

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

function buildPayload(caseItem: DemandCase): EmergencyReportCreate {
  return {
    reporter_name: '匿名居民',
    contact: null,
    location: caseItem.location,
    description: caseItem.description,
    input_type: 'text',
    tags: [...caseItem.tags],
    attachments: [],
  };
}

function inferLocation(description: string, fallback: string) {
  const match = description.match(/[\u4e00-\u9fa5A-Za-z0-9#-]*\d+栋(?:\d+单元)?(?:\d+(?:楼|层))?(?:电梯口|楼道|门口|附近)?/);
  return match?.[0] ?? fallback;
}

function inferInputType(files: File[], currentType: EmergencyReportCreate['input_type']) {
  if (files.some((file) => file.type.startsWith('image/'))) {
    return 'image';
  }
  if (files.some((file) => file.type.startsWith('audio/'))) {
    return 'audio';
  }
  return currentType;
}

export const useEmergencyStore = defineStore('emergency', () => {
  const selectedCaseId = ref(demandCases[0].id);
  const form = reactive<EmergencyReportCreate>(buildPayload(demandCases[0]));
  const response = ref<EmergencyFlowResponse | null>(null);
  const flowStage = ref<FlowStage>('idle');
  const submitting = ref(false);
  const useMockData = ref(false);
  const pendingFiles = ref<File[]>([]);
  const notice = ref('点击中间左侧需求节点可切换案例，也可以直接在对话框里改写或补充。');

  const selectedCase = computed(() => demandCases.find((item) => item.id === selectedCaseId.value) ?? demandCases[0]);
  const hasPendingFiles = computed(() => pendingFiles.value.length > 0);
  const activeSupplyId = computed(() => {
    if (response.value?.routing_decision.scenario_code === 'power_failure') {
      return 'electrician';
    }
    if (response.value?.routing_decision.scenario_code === 'water_pipe_burst') {
      return 'repair-team';
    }
    return selectedCase.value.supplyId;
  });
  const routeActivated = computed(() => flowStage.value === 'routing' || flowStage.value === 'completed');

  const stageLabel = computed(() => {
    if (flowStage.value === 'intake') {
      return '诉求接受 Agent 正在分析';
    }
    if (flowStage.value === 'routing') {
      return '诉求路由 Agent 正在匹配供给';
    }
    if (flowStage.value === 'completed') {
      return '工单与服务信息已生成';
    }
    return '等待输入或选择案例';
  });

  async function submitCurrentReport() {
    const trimmedDescription = form.description.trim();
    if (!trimmedDescription && pendingFiles.value.length === 0) {
      notice.value = '请先输入一段诉求，或上传一张现场图片。';
      return;
    }

    submitting.value = true;
    response.value = null;
    useMockData.value = false;
    notice.value = '诉求接受 Agent 正在拆解问题、位置和风险。';
    flowStage.value = 'intake';

    let result: EmergencyFlowResponse;
    const description = trimmedDescription || '用户上传了现场图片，请结合图片判断社区急事类型。';
    const inputType = inferInputType(pendingFiles.value, form.input_type);
    const location = inferLocation(description, selectedCase.value.location);

    try {
      let attachments = [...form.attachments];
      if (pendingFiles.value.length > 0) {
        const uploaded = await uploadAttachments(pendingFiles.value);
        attachments = uploaded.attachments;
      }

      result = await submitEmergency({
        ...form,
        reporter_name: '匿名居民',
        contact: null,
        location,
        description,
        input_type: inputType,
        tags: [...form.tags],
        attachments,
      });
      notice.value = pendingFiles.value.length > 0 ? '已上传现场材料并完成后端分析。' : '已连接后端接口并完成诉求分析。';
    } catch {
      result = buildMockResponse({ ...form, location, description, input_type: inputType });
      useMockData.value = true;
      notice.value = '后端暂不可用，已用本地规则生成演示结果。';
    }

    await delay(360);
    flowStage.value = 'routing';
    await delay(480);
    response.value = result;
    flowStage.value = 'completed';
    submitting.value = false;
  }

  function selectDemandCase(caseId: string) {
    const nextCase = demandCases.find((item) => item.id === caseId);
    if (!nextCase) {
      return;
    }
    selectedCaseId.value = caseId;
    Object.assign(form, buildPayload(nextCase));
    response.value = null;
    flowStage.value = 'idle';
    useMockData.value = false;
    pendingFiles.value = [];
    notice.value = `已切换到“${nextCase.title}”案例，可直接编辑对话内容后重新分析。`;
  }

  function resetDemo() {
    selectDemandCase('water-pipe');
    notice.value = '已恢复水管爆裂主案例。';
  }

  function setPendingFiles(files: File[]) {
    pendingFiles.value = files;
    if (files.length > 0) {
      form.input_type = inferInputType(files, form.input_type);
      notice.value = `已选择 ${files.length} 个现场材料，点击发送后进入 Agent 分析。`;
    }
  }

  function removePendingFile(index: number) {
    pendingFiles.value = pendingFiles.value.filter((_, fileIndex) => fileIndex !== index);
  }

  function appendSpeechText(text: string) {
    const cleanedText = text.trim();
    if (!cleanedText) {
      return;
    }
    form.input_type = 'audio';
    form.description = `${form.description.trim()}${form.description.trim() ? '，' : ''}${cleanedText}`;
    notice.value = '已将实时语音识别内容写入对话框。';
  }

  return {
    demandCases,
    supplyNodes,
    selectedCaseId,
    selectedCase,
    activeSupplyId,
    routeActivated,
    form,
    response,
    flowStage,
    submitting,
    useMockData,
    pendingFiles,
    hasPendingFiles,
    notice,
    stageLabel,
    submitCurrentReport,
    selectDemandCase,
    resetDemo,
    setPendingFiles,
    removePendingFile,
    appendSpeechText,
  };
});