import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';

import { submitEmergency, uploadAttachments } from '@/api/emergency';
import { buildMockResponse, createWaterPipeDemoPayload } from '@/mocks/waterPipeDemo';
import type { EmergencyFlowResponse, EmergencyReportCreate, FlowStage } from '@/types/emergency';


function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}


export const useEmergencyStore = defineStore('emergency', () => {
  const form = reactive<EmergencyReportCreate>(createWaterPipeDemoPayload());
  const response = ref<EmergencyFlowResponse | null>(null);
  const flowStage = ref<FlowStage>('idle');
  const submitting = ref(false);
  const useMockData = ref(false);
  const pendingFiles = ref<File[]>([]);
  const notice = ref('主案例已预置为“水管爆了怎么办”，可直接提交体验完整流转。');
  const hasPendingFiles = computed(() => pendingFiles.value.length > 0);

  const stageLabel = computed(() => {
    if (flowStage.value === 'intake') {
      return '诉求接受 Agent 正在提取需求信息';
    }
    if (flowStage.value === 'routing') {
      return '诉求排序与发放 Agent 正在匹配责任单位';
    }
    if (flowStage.value === 'completed') {
      return '工单和服务信息已生成';
    }
    return '等待居民报事';
  });

  async function submitCurrentReport() {
    submitting.value = true;
    response.value = null;
    useMockData.value = false;
    notice.value = '开始处理当前急事，请稍候。';
    flowStage.value = 'intake';

    let result: EmergencyFlowResponse;
    try {
      let attachments = [...form.attachments];
      if (pendingFiles.value.length > 0) {
        const uploaded = await uploadAttachments(pendingFiles.value);
        attachments = uploaded.attachments;
      }
      result = await submitEmergency({ ...form, tags: [...form.tags], attachments });
      notice.value = pendingFiles.value.length > 0 ? '已上传附件并连接后端接口，展示实时返回结果。' : '已连接后端接口，展示实时返回结果。';
    } catch {
      result = buildMockResponse(form);
      useMockData.value = true;
      notice.value = '当前未连接后端，已自动回退到本地 mock 结果。';
    }

    await delay(320);
    flowStage.value = 'routing';
    await delay(380);
    response.value = result;
    flowStage.value = 'completed';
    submitting.value = false;
  }

  function resetDemo() {
    Object.assign(form, createWaterPipeDemoPayload());
    form.attachments = [];
    response.value = null;
    flowStage.value = 'idle';
    useMockData.value = false;
    pendingFiles.value = [];
    notice.value = '主案例已恢复为默认样例，可继续调整后再次提交。';
  }

  function setPendingFiles(files: File[]) {
    pendingFiles.value = files;
    if (files.length > 0) {
      notice.value = `已选择 ${files.length} 个附件，提交后会先上传再进入急事解析。`;
    }
  }

  function removePendingFile(index: number) {
    pendingFiles.value = pendingFiles.value.filter((_, fileIndex) => fileIndex !== index);
  }

  return {
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
    resetDemo,
    setPendingFiles,
    removePendingFile,
  };
});
