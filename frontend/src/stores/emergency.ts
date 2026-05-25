import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';

import { analyzeEmergency, detectConfirmationIntent, submitEmergency, uploadAttachments } from '@/api/emergency';
import { buildMockResponse } from '@/mocks/waterPipeDemo';
import type { AttachmentMeta, EmergencyFlowResponse, EmergencyReportCreate, FlowStage } from '@/types/emergency';

export interface DemandCase {
  id: string;
  title: string;
  brief: string;
  source: string;
  communityName: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  createdAt: string;
  attachments?: string[];
  variant?: 'normal' | 'question' | 'success';
}

const demandCases: DemandCase[] = [
  {
    id: 'restaurant-fume-noise',
    title: '油烟噪声扰民',
    brief: '底商餐馆油烟和夜间噪声影响居民，物业协调无效。',
    source: '周佳怡',
    communityName: '知春里社区 A 区',
    location: '中关村街道知春里社区 A 区底商',
    description: '我们小区楼下餐馆油烟太大，晚上还很吵，找物业没人管。',
    tags: ['油烟扰民', '夜间噪声', '物业协调'],
    supplyId: 'street-enforcement',
  },
  {
    id: 'water-pipe',
    title: '水管爆裂',
    brief: '楼道积水，可能影响电梯井和公共电路。',
    source: '林浩然',
    communityName: '翠湖家园',
    location: '2栋3单元4楼电梯口',
    description: '2栋3单元4楼水管爆了，地上全是水，怕漏到电梯里。',
    tags: ['漏水', '紧急', '公共区域'],
    supplyId: 'repair-team',
  },
  {
    id: 'power-light',
    title: '楼道停电',
    brief: '夜间楼道无照明，老人上下楼有安全风险。',
    source: '苏明哲',
    communityName: '双榆树北里',
    location: '5栋2单元6楼楼道',
    description: '5栋2单元6楼楼道灯全灭了，晚上老人上下楼看不清。',
    tags: ['停电', '夜间', '公共区域'],
    supplyId: 'electrician',
  },
  {
    id: 'elevator-risk',
    title: '电梯异常',
    brief: '电梯门反复开合，居民担心被困或夹伤。',
    source: '顾清妍',
    communityName: '海淀南路小区',
    location: '1栋1单元电梯口',
    description: '1栋1单元电梯门一直反复开合，有老人不敢进，担心夹人。',
    tags: ['电梯', '紧急', '安全风险'],
    supplyId: 'elevator-team',
  },
  {
    id: 'corridor-blocked',
    title: '通道堵塞',
    brief: '楼道堆物堵住消防通道，需要社区核实协调。',
    source: '方宇航',
    communityName: '中关村东里',
    location: '7栋1单元3楼楼道',
    description: '7栋1单元3楼楼道堆了很多杂物，消防通道被堵住了。',
    tags: ['消防通道', '公共区域', '安全风险'],
    supplyId: 'community-desk',
  },
];

const supplyNodes: SupplyNode[] = [
  { id: 'street-enforcement', title: '街道执法', unit: '属地街道综合执法队' },
  { id: 'environment-office', title: '生态环境', unit: '生态环境部门' },
  { id: 'market-office', title: '市场监管', unit: '市场监管所' },
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
    reporter_name: caseItem.source,
    community_name: caseItem.communityName,
    contact: null,
    location: caseItem.location,
    description: caseItem.description,
    input_type: 'text',
    tags: [...caseItem.tags],
    attachments: [],
  };
}

function createChatMessage(role: ChatMessage['role'], content: string, options: Pick<ChatMessage, 'attachments' | 'variant'> = {}): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...options,
  };
}

function inferLocation(description: string, fallback: string) {
  if (description.includes('油烟') || description.includes('餐馆') || description.includes('物业') || description.includes('底商')) {
    return fallback;
  }
  const match = description.match(/[\u4e00-\u9fa5A-Za-z0-9#-]*\d+栋(?:\d+单元)?(?:\d+(?:楼|层))?(?:电梯口|楼道|门口|附近)?/);
  return match?.[0] ?? fallback;
}

function inferCommunityName(description: string, fallback: string) {
  const match = description.match(/[\u4e00-\u9fa5A-Za-z0-9#-]{2,18}(?:小区|家园|社区|公寓|花园|东里|北里|南里|西里)/);
  return match?.[0] ?? fallback;
}

function inferTags(description: string, fallbackTags: string[]) {
  if (['水管', '漏水', '爆了', '积水', '跑水', '渗水', '电梯里'].some((token) => description.includes(token))) {
    return ['漏水', '紧急', '公共区域'];
  }
  if (['停电', '断电', '照明', '灯坏', '电力'].some((token) => description.includes(token))) {
    return ['停电', '夜间', '公共区域'];
  }
  if (['电梯', '困人', '夹人', '反复开合'].some((token) => description.includes(token))) {
    return ['电梯', '紧急', '安全风险'];
  }
  if (['消防通道', '堵住', '堆物', '杂物'].some((token) => description.includes(token))) {
    return ['消防通道', '公共区域', '安全风险'];
  }
  if (['油烟', '餐馆', '餐饮', '噪声', '太吵', '扰民', '物业', '底商'].some((token) => description.includes(token))) {
    return ['油烟扰民', '夜间噪声', '物业协调'];
  }
  return fallbackTags;
}

function inferDemandCase(description: string) {
  if (['水管', '漏水', '爆了', '积水', '跑水', '渗水', '电梯里'].some((token) => description.includes(token))) {
    return demandCases.find((item) => item.id === 'water-pipe');
  }
  if (['停电', '断电', '照明', '灯坏', '电力'].some((token) => description.includes(token))) {
    return demandCases.find((item) => item.id === 'power-light');
  }
  if (['电梯', '困人', '夹人', '反复开合'].some((token) => description.includes(token))) {
    return demandCases.find((item) => item.id === 'elevator-risk');
  }
  if (['消防通道', '堵住', '堆物', '杂物'].some((token) => description.includes(token))) {
    return demandCases.find((item) => item.id === 'corridor-blocked');
  }
  if (['油烟', '餐馆', '餐饮', '噪声', '太吵', '扰民', '物业', '底商'].some((token) => description.includes(token))) {
    return demandCases.find((item) => item.id === 'restaurant-fume-noise');
  }
  return null;
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

function normalizeCommunityText(text: string, communityName: string) {
  return text.split('XX小区').join(communityName);
}

function buildConfirmationMessage(result: EmergencyFlowResponse, communityName: string) {
  const summary = normalizeCommunityText(result.demand_package.summary, communityName);
  const responsibleUnit = normalizeCommunityText(result.routing_decision.responsible_unit, communityName);
  return `你现在遇到的是“${summary}”。我将为你在${communityName}生成诉求工单，并派发给${responsibleUnit}处理。确认吗？`;
}

function inferConfirmationByRule(text: string): boolean | null {
  const normalizedText = text.trim().replace(/[\s，。！？!?,.；;：:、]+/g, '');
  if (!normalizedText) {
    return false;
  }
  if (/不确认|不是|不用|取消|等等|重新|修改|补充|先别|有误|错了/.test(normalizedText)) {
    return false;
  }
  if (/^(我)?(确认|确定|同意|认可|接受)(了|啦|的)?$/.test(normalizedText)) {
    return true;
  }
  if (/^(是|是的|对|对的|好的|可以|没问题|继续|提交|确认提交)$/.test(normalizedText)) {
    return true;
  }
  if (normalizedText.includes('确认') && /我|可以|已经|就这样|信息|工单/.test(normalizedText)) {
    return true;
  }
  return null;
}

export const useEmergencyStore = defineStore('emergency', () => {
  const selectedCaseId = ref(demandCases[0].id);
  const form = reactive<EmergencyReportCreate>(buildPayload(demandCases[0]));
  const response = ref<EmergencyFlowResponse | null>(null);
  const intakePreview = ref<EmergencyFlowResponse | null>(null);
  const flowStage = ref<FlowStage>('idle');
  const submitting = ref(false);
  const useMockData = ref(false);
  const pendingFiles = ref<File[]>([]);
  const draftMessage = ref('');
  const chatMessages = ref<ChatMessage[]>([]);
  const pendingPayload = ref<EmergencyReportCreate | null>(null);
  const workOrderConfirmed = ref(false);
  const workOrderConfirmationNotice = ref(false);
  const notice = ref('请在对话框补充或发送诉求，客服会先复述并等待确认。');

  const selectedCase = computed(() => demandCases.find((item) => item.id === selectedCaseId.value) ?? demandCases[0]);
  const hasPendingFiles = computed(() => pendingFiles.value.length > 0);
  const feedbackResult = computed(() => response.value ?? intakePreview.value);
  const chatHighlighted = computed(() => flowStage.value === 'intake' || flowStage.value === 'clarifying');
  const feedbackHighlighted = computed(() => flowStage.value === 'feedback');
  const workOrderUpdated = computed(() => Boolean(response.value && flowStage.value === 'completed'));
  const activeSupplyId = computed(() => {
    const scenarioCode = response.value?.routing_decision.scenario_code ?? intakePreview.value?.routing_decision.scenario_code;
    if (scenarioCode === 'restaurant_fume_noise') {
      return 'street-enforcement';
    }
    if (scenarioCode === 'power_failure') {
      return 'electrician';
    }
    if (scenarioCode === 'water_pipe_burst') {
      return 'repair-team';
    }
    return selectedCase.value.supplyId;
  });
  const routeActivated = computed(() => flowStage.value === 'routing' || flowStage.value === 'completed');

  const stageLabel = computed(() => {
    if (flowStage.value === 'intake') {
      return '客服正在整理诉求';
    }
    if (flowStage.value === 'clarifying') {
      return '等待工作人员确认';
    }
    if (flowStage.value === 'feedback') {
      return '受理反馈已生成';
    }
    if (flowStage.value === 'routing') {
      return '正在生成右侧工单';
    }
    if (flowStage.value === 'completed') {
      return '右侧工单已生成';
    }
    return '等待输入或选择案例';
  });

  seedConversation(demandCases[0]);

  async function submitCurrentReport() {
    const text = draftMessage.value.trim();
    const filesForMessage = [...pendingFiles.value];
    const isWaitingForConfirmation = flowStage.value === 'clarifying' && Boolean(intakePreview.value && pendingPayload.value);

    if (isWaitingForConfirmation && !text && filesForMessage.length === 0) {
      notice.value = '请回复“确认”，或继续补充需要修改的信息。';
      return;
    }

    if (isWaitingForConfirmation && filesForMessage.length === 0 && await resolveConfirmationIntent(text)) {
      chatMessages.value.push(createChatMessage('user', text));
      draftMessage.value = '';
      pendingFiles.value = [];
      await confirmCurrentIntake();
      return;
    }

    if (!text && filesForMessage.length === 0) {
      notice.value = '请先输入一段诉求，或上传一张现场图片。';
      return;
    }

    if (text || filesForMessage.length > 0) {
      chatMessages.value.push(
        createChatMessage('user', text || '上传了现场图片，请 Agent 结合图片判断。', {
          attachments: filesForMessage.map((file) => file.name),
        }),
      );
    }

    draftMessage.value = '';
    pendingFiles.value = [];
    submitting.value = true;
    response.value = null;
    intakePreview.value = null;
    pendingPayload.value = null;
    workOrderConfirmed.value = false;
    workOrderConfirmationNotice.value = false;
    useMockData.value = false;
    notice.value = '客服正在整理诉求并生成确认话术。';
    flowStage.value = 'intake';

    const description = collectConversationText();
    const inferredCase = inferDemandCase(description) ?? selectedCase.value;
    selectedCaseId.value = inferredCase.id;
    const inputType = inferInputType(filesForMessage, form.input_type);
    const location = inferLocation(description, inferredCase.location);
    const communityName = inferCommunityName(description, inferredCase.communityName);
    let attachments: AttachmentMeta[] = [...form.attachments];

    try {
      if (filesForMessage.length > 0) {
        const uploaded = await uploadAttachments(filesForMessage);
        attachments = uploaded.attachments;
      }

      const payload = buildCurrentPayload(description, inferredCase, location, communityName, inputType, attachments);
      const analysis = await analyzeEmergency(payload);
      Object.assign(form, payload);
      intakePreview.value = analysis;
      pendingPayload.value = payload;
      flowStage.value = 'clarifying';
      notice.value = '客服已整理当前诉求，请确认或继续补充信息。';
      chatMessages.value.push(createChatMessage('agent', buildConfirmationMessage(analysis, communityName), { variant: 'question' }));
    } catch {
      const payload = buildCurrentPayload(description, inferredCase, location, communityName, inputType, attachments);
      const fallback = buildMockResponse(payload);
      useMockData.value = true;
      intakePreview.value = fallback;
      pendingPayload.value = payload;
      flowStage.value = 'clarifying';
      notice.value = '后端暂不可用，已用本地规则整理确认话术。';
      chatMessages.value.push(createChatMessage('agent', buildConfirmationMessage(fallback, communityName), { variant: 'question' }));
    } finally {
      submitting.value = false;
    }
  }

  async function confirmCurrentIntake() {
    if (!pendingPayload.value || !intakePreview.value) {
      notice.value = '请先发送诉求，由客服整理后再确认。';
      return;
    }

    submitting.value = true;
    flowStage.value = 'feedback';
    notice.value = '已确认诉求，正在生成受理反馈。';
    chatMessages.value.push(createChatMessage('agent', '已确认，我将把诉求转入路由并生成右侧工单。', { variant: 'success' }));

    try {
      await delay(620);
      flowStage.value = 'routing';
      notice.value = '诉求路由 Agent 正在匹配政府侧承办与协办部门。';
      await delay(520);

      const finalResult = await submitEmergency(pendingPayload.value);
      response.value = finalResult;
      intakePreview.value = null;
      pendingPayload.value = null;
      flowStage.value = 'completed';
      notice.value = '工单已生成在右侧，请确认工单信息。';
    } catch {
      useMockData.value = true;
      response.value = intakePreview.value;
      intakePreview.value = null;
      pendingPayload.value = null;
      flowStage.value = 'completed';
      notice.value = '后端暂不可用，已使用当前受理结果生成右侧演示工单。';
    } finally {
      submitting.value = false;
    }
  }

  function selectDemandCase(caseId: string) {
    const nextCase = demandCases.find((item) => item.id === caseId);
    if (!nextCase) {
      return;
    }
    selectedCaseId.value = caseId;
    Object.assign(form, buildPayload(nextCase));
    response.value = null;
    intakePreview.value = null;
    pendingPayload.value = null;
    workOrderConfirmed.value = false;
    workOrderConfirmationNotice.value = false;
    flowStage.value = 'idle';
    useMockData.value = false;
    pendingFiles.value = [];
    seedConversation(nextCase);
    notice.value = `已切换到${nextCase.source}的诉求，可直接发送或先修改草稿。`;
  }

  function resetDemo() {
    selectDemandCase('restaurant-fume-noise');
    notice.value = '已恢复餐饮油烟与夜间噪声主案例。';
  }

  function setPendingFiles(files: File[]) {
    pendingFiles.value = files;
    if (files.length > 0) {
      form.input_type = inferInputType(files, form.input_type);
      notice.value = `已选择 ${files.length} 个现场材料，发送后由客服整理确认。`;
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
    draftMessage.value = `${draftMessage.value.trim()}${draftMessage.value.trim() ? '，' : ''}${cleanedText}`;
    notice.value = '已将实时语音识别内容写入对话框。';
  }

  function seedConversation(caseItem: DemandCase) {
    chatMessages.value = [];
    draftMessage.value = caseItem.description;
  }

  function confirmWorkOrder() {
    if (!response.value) {
      notice.value = '请先完成诉求受理并生成工单。';
      return;
    }
    workOrderConfirmed.value = true;
    workOrderConfirmationNotice.value = true;
    notice.value = '工作人员已确认工单。';
  }

  async function resolveConfirmationIntent(text: string) {
    const ruleResult = inferConfirmationByRule(text);
    if (ruleResult !== null) {
      return ruleResult;
    }

    try {
      notice.value = '正在快速判断确认意图。';
      const result = await detectConfirmationIntent(text);
      return result.confirmed;
    } catch {
      return false;
    }
  }

  function collectConversationText() {
    return chatMessages.value
      .filter((message) => message.role === 'user')
      .map((message) => message.content.trim())
      .filter(Boolean)
      .join('，');
  }

  function buildCurrentPayload(
    description: string,
    caseItem: DemandCase,
    location: string,
    communityName: string,
    inputType: EmergencyReportCreate['input_type'],
    attachments: AttachmentMeta[],
  ): EmergencyReportCreate {
    return {
      ...form,
      reporter_name: caseItem.source,
      community_name: communityName,
      contact: null,
      location,
      description,
      input_type: inputType,
      tags: inferTags(description, caseItem.tags),
      attachments,
    };
  }

  return {
    demandCases,
    supplyNodes,
    selectedCaseId,
    selectedCase,
    activeSupplyId,
    routeActivated,
    chatHighlighted,
    feedbackHighlighted,
    feedbackResult,
    workOrderUpdated,
    workOrderConfirmed,
    workOrderConfirmationNotice,
    form,
    response,
    intakePreview,
    flowStage,
    submitting,
    useMockData,
    pendingFiles,
    hasPendingFiles,
    draftMessage,
    chatMessages,
    notice,
    stageLabel,
    submitCurrentReport,
    selectDemandCase,
    resetDemo,
    setPendingFiles,
    removePendingFile,
    appendSpeechText,
    confirmWorkOrder,
  };
});
