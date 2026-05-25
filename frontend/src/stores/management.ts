import { defineStore } from 'pinia';
import { computed, reactive, ref } from 'vue';

import { analyzeManagementQuestion } from '@/api/management';
import type { ManagementAnalysisResult, ManagementQueryCreate } from '@/types/management';

export type ManagementStage = 'idle' | 'extract' | 'simulate' | 'analyze' | 'answer' | 'completed';

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export const useManagementStore = defineStore('management', () => {
  const form = reactive<ManagementQueryCreate>({
    question: '夏天中暑情况增多，我应该如何分配医疗资源？',
    area: '中关村街道',
    horizon_days: 14,
  });
  const result = ref<ManagementAnalysisResult | null>(null);
  const stage = ref<ManagementStage>('idle');
  const submitting = ref(false);
  const notice = ref('输入部门管理问题后，系统会检索 50 条相关群众诉求并展示分析过程。');

  const stageIndex = computed(() => {
    const order: ManagementStage[] = ['idle', 'extract', 'simulate', 'analyze', 'answer', 'completed'];
    return order.indexOf(stage.value);
  });

  const stageLabel = computed(() => {
    if (stage.value === 'extract') {
      return '问题理解 Agent 正在提取关键词';
    }
    if (stage.value === 'simulate') {
      return '诉求检索 Agent 正在汇总 50 条数据';
    }
    if (stage.value === 'analyze') {
      return '时空聚合 Agent 正在读取并分析';
    }
    if (stage.value === 'answer') {
      return '资源建议 Agent 正在生成答案';
    }
    if (stage.value === 'completed') {
      return '分析完成，可进入数据看板';
    }
    return '等待部门管理问题';
  });

  async function analyzeCurrentQuestion() {
    const question = form.question.trim();
    if (!question) {
      notice.value = '请先输入一个公共服务管理问题。';
      return;
    }

    submitting.value = true;
    result.value = null;
    stage.value = 'extract';
    notice.value = '正在理解管理问题，提取主题、对象和资源关键词。';

    let response: ManagementAnalysisResult;
    try {
      const request = { ...form, question };
      await delay(420);
      stage.value = 'simulate';
      notice.value = '正在检索并汇总 50 条相关群众诉求。';
      response = await analyzeManagementQuestion(request);
    } catch {
      response = buildLocalFallback(question, form.area);
      notice.value = '后端暂不可用，已使用本地检索样例展示分析过程。';
    }

    await delay(560);
    stage.value = 'analyze';
    await delay(620);
    stage.value = 'answer';
    await delay(520);
    result.value = response;
    stage.value = 'completed';
    submitting.value = false;
  }

  function resetQuestion() {
    form.question = '夏天中暑情况增多，我应该如何分配医疗资源？';
    form.area = '中关村街道';
    form.horizon_days = 14;
    result.value = null;
    stage.value = 'idle';
    submitting.value = false;
    notice.value = '已恢复默认管理问题。';
  }

  return {
    form,
    result,
    stage,
    stageIndex,
    stageLabel,
    submitting,
    notice,
    analyzeCurrentQuestion,
    resetQuestion,
  };
});

function buildLocalFallback(question: string, area: string): ManagementAnalysisResult {
  const now = new Date();
  const communities = ['知春里社区', '科源社区', '双榆树北里', '中关村东里', '海淀南路社区'];
  const records = Array.from({ length: 50 }, (_, index) => {
    const community = communities[index % communities.length];
    const high = index % 5 === 0;
    return {
      case_id: `LOCAL-${index + 1}`,
      created_at: new Date(now.getTime() - index * 6 * 60 * 60 * 1000).toISOString(),
      district: area,
      community,
      location_label: `${community}服务点`,
      latitude: 39.97 + (index % 5) * 0.006,
      longitude: 116.31 + (index % 5) * 0.007,
      category: ['中暑求助', '高温不适', '独居老人巡访', '户外劳动保障', '降温物资咨询'][index % 5],
      severity: (high ? 'high' : index % 2 === 0 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      population_group: ['独居老人', '户外工作者', '慢病居民', '儿童', '普通居民'][index % 5],
      description: `${community}居民反映夏季高温健康风险，需要医疗和避暑资源支持。`,
      requested_resource: ['社区卫生站', '流动医疗点', '避暑纳凉点', '急救转运', '防暑物资'][index % 5],
      status: ['待受理', '已派单', '处理中', '已办结'][index % 4] as '待受理' | '已派单' | '处理中' | '已办结',
    };
  });

  return {
    analysis_id: `local-${Date.now()}`,
    created_at: now.toISOString(),
    original_question: question,
    normalized_question: `围绕“夏季中暑与高温健康风险”分析 ${area} 的公共服务资源配置。`,
    topic: '夏季中暑与高温健康风险',
    extracted_keywords: ['夏天', '中暑', '医疗资源', '重点人群'],
    simulated_count: 50,
    records,
    agent_steps: [
      {
        key: 'question_extract',
        title: '问题理解 Agent',
        input_summary: question,
        output_summary: '识别主题：夏季中暑与高温健康风险。',
        evidence: ['夏天', '中暑', '医疗资源'],
        confidence: 0.9,
      },
      {
        key: 'data_simulation',
        title: '诉求检索 Agent',
        input_summary: `区域：${area}`,
        output_summary: '已检索汇总 50 条相关群众诉求。',
        evidence: ['覆盖 5 个社区', '高风险 10 条'],
        confidence: 0.86,
      },
      {
        key: 'spacetime_analysis',
        title: '时空聚合 Agent',
        input_summary: '读取相关诉求时间和社区字段。',
        output_summary: '发现知春里社区和科源社区需求较集中。',
        evidence: ['知春里社区 10 件', '科源社区 10 件'],
        confidence: 0.88,
      },
      {
        key: 'policy_answer',
        title: '资源建议 Agent',
        input_summary: '综合高风险比例和资源需求。',
        output_summary: '建议设置流动医疗点和避暑纳凉点。',
        evidence: ['高风险 10 条', '医疗点需求集中'],
        confidence: 0.85,
      },
    ],
    time_series: ['05-19', '05-20', '05-21', '05-22', '05-23', '05-24', '05-25'].map((label, index) => ({
      label,
      count: 4 + index,
      high_severity: index % 3,
    })),
    category_metrics: [
      { label: '中暑求助', count: 14, ratio: 28 },
      { label: '高温不适', count: 12, ratio: 24 },
      { label: '独居老人巡访', count: 10, ratio: 20 },
      { label: '户外劳动保障', count: 8, ratio: 16 },
      { label: '降温物资咨询', count: 6, ratio: 12 },
    ],
    region_insights: communities.map((name, index) => ({
      name,
      count: 10,
      high_severity: index + 1,
      top_category: ['中暑求助', '高温不适', '独居老人巡访', '户外劳动保障', '降温物资咨询'][index],
      recommended_action: `在${name}补充社区卫生站和避暑纳凉点资源。`,
      latitude: 39.97 + index * 0.006,
      longitude: 116.31 + index * 0.007,
    })),
    answer: `针对“${question}”，建议在高风险社区优先设置流动医疗点，并把独居老人和户外工作者列为重点巡访对象。`,
    recommendations: ['增设流动医疗点', '开放避暑纳凉点', '建立重点人群巡访清单', '高温时段增加急救转运待命'],
  };
}
