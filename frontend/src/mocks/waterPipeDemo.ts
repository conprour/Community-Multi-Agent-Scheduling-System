import type { EmergencyFlowResponse, EmergencyReportCreate } from '@/types/emergency';

export function createWaterPipeDemoPayload(): EmergencyReportCreate {
  return {
    reporter_name: '李女士',
    community_name: '知春里社区 A 区',
    contact: '13800000000',
    location: '中关村街道知春里社区 A 区底商',
    description: '我们小区楼下餐馆油烟太大，晚上还很吵，找物业没人管。',
    input_type: 'text',
    tags: ['油烟扰民', '夜间噪声', '物业协调'],
    attachments: [],
  };
}

export function buildMockResponse(payload: EmergencyReportCreate): EmergencyFlowResponse {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const communityName = payload.community_name || '本小区';
  const scenario = detectMockScenario(payload);
  const missingFields = detectMockMissingFields(payload, scenario);
  const descriptionPreview = payload.description.length > 28 ? `${payload.description.slice(0, 28)}...` : payload.description;

  return {
    request_id: `req-${stamp}-mock01`,
    created_at: now.toISOString(),
    demand_package: {
      summary: `已识别为${scenario.category}，核心描述：${descriptionPreview}`,
      category: scenario.category,
      location: payload.location,
      urgency: scenario.urgency,
      impact_scope: scenario.impactScope,
      risks: scenario.risks,
      requires_immediate_visit: scenario.requiresImmediateVisit,
      missing_fields: missingFields,
      suggested_questions: scenario.suggestedQuestions,
      temporary_guidance: scenario.temporaryGuidance,
    },
    routing_decision: {
      scenario_code: scenario.code,
      responsible_unit: scenario.responsibleUnit.replace('XX小区', communityName),
      responsible_role: scenario.responsibleRole,
      backup_units: scenario.backupUnits.map((item) => item.replace('XX小区', communityName)),
      eta_minutes: scenario.etaMinutes,
      service_sla: scenario.serviceSla,
      rationale: scenario.rationale.map((item) => item.replace('XX小区', communityName)),
    },
    service_order: {
      order_id: `order-${stamp}-mock01`,
      status: '待派发',
      service_location: payload.location,
      service_actions: scenario.serviceActions,
      notes: ['监督审计提示：不允许全自动派单，需要人工确认地址信息', '当前为本地 mock 结果，可继续联调后端接口'],
    },
  };
}

function detectMockScenario(payload: EmergencyReportCreate) {
  const combinedText = `${payload.location} ${payload.description} ${payload.tags.join(' ')}`;
  if (['水管', '漏水', '爆了', '积水', '跑水', '渗水', '电梯里'].some((token) => combinedText.includes(token))) {
    return {
      code: 'water_pipe_burst',
      category: '给排水故障',
      urgency: 'high' as const,
      impactScope: '楼栋公共区域及周边住户',
      risks: ['可能影响电梯井和公共电路', '积水区域存在滑倒风险', '需要尽快关闭阀门控制外溢'],
      requiresImmediateVisit: true,
      suggestedQuestions: ['请补充漏水点是否仍在持续外溢。', '积水是否已经蔓延到电梯口或配电区域？'],
      temporaryGuidance: ['远离插座、电梯口和明显积水区域。', '若知道阀门位置，可先尝试关闭就近阀门。'],
      responsibleUnit: 'XX小区物业工程维修组',
      responsibleRole: '值班维修员',
      backupUnits: ['社区值班人员', '电工待命'],
      etaMinutes: 20,
      serviceSla: '20 分钟内到场',
      rationale: ['问题属于楼栋公共区域的给排水故障。', '存在积水扩散风险，需要优先派发给值班维修组。'],
      serviceActions: ['到场后先检查主阀或分支阀门', '确认漏水点是否属于公共管道', '必要时设置警示区域，避免居民靠近积水带'],
    };
  }
  if (['停电', '断电', '照明', '灯坏', '电力'].some((token) => combinedText.includes(token))) {
    return {
      code: 'power_failure',
      category: '公共照明故障',
      urgency: 'medium' as const,
      impactScope: '楼道公共空间',
      risks: ['夜间通行视线受影响', '老年住户上下楼存在安全风险'],
      requiresImmediateVisit: true,
      suggestedQuestions: ['请补充具体楼栋和停电持续时间。'],
      temporaryGuidance: ['请先避免在无照明楼道中独自通行。'],
      responsibleUnit: 'XX小区物业电工班',
      responsibleRole: '值班电工',
      backupUnits: ['社区值班人员'],
      etaMinutes: 30,
      serviceSla: '30 分钟内到场',
      rationale: ['问题属于公共照明故障，责任主体为物业电工班。'],
      serviceActions: ['检查总闸和楼层照明线路', '必要时更换损坏灯具或保险'],
    };
  }
  return {
    code: 'restaurant_fume_noise',
    category: '餐饮油烟 / 噪声扰民 / 物业协调',
    urgency: 'medium' as const,
    impactScope: '底商周边住户与夜间休息环境',
    risks: ['同一片区近 7 日存在相似投诉', '涉及城管、生态环境、市场监管、社区多方协同', '夜间噪声与油烟持续影响满意度'],
    requiresImmediateVisit: false,
    suggestedQuestions: ['请补充餐馆名称、门牌号和主要扰民时段。'],
    temporaryGuidance: ['建议保留油烟、噪声发生时段的照片或录音。', '坐席可先生成预工单，待地址补充后进入正式派单。'],
    responsibleUnit: 'XX小区属地街道综合执法队',
    responsibleRole: '接诉即办调度员',
    backupUnits: ['生态环境部门', '市场监管所', 'XX小区居委会', '物业公司'],
    etaMinutes: 120,
    serviceSla: '2 小时内完成核查派单',
    rationale: ['诉求同时命中餐饮油烟、夜间噪声和物业协调失败', '建议由属地街道牵头，多部门联合核查', '缺少具体商户信息，需坐席人工确认后派单'],
    serviceActions: ['联系投诉人补充餐馆名称、门牌号和扰民时段', '安排夜间现场核查油烟净化设施和噪声情况', '同步市场监管核查经营资质并要求物业配合提供商户信息'],
  };
}

function detectMockMissingFields(payload: EmergencyReportCreate, scenario: ReturnType<typeof detectMockScenario>) {
  if (scenario.code !== 'restaurant_fume_noise') {
    return payload.location ? [] : ['楼栋或楼层信息'];
  }
  const combinedText = `${payload.location} ${payload.description}`;
  const hasBusinessDetail = ['号', '门牌', '店名', '名称'].some((token) => combinedText.includes(token));
  const hasNamedShop = /[\u4e00-\u9fa5A-Za-z0-9#-]{2,18}(?:小厨|餐厅|饭店|烧烤|面馆|火锅店|便利店|超市)/.test(combinedText);
  return hasBusinessDetail || hasNamedShop ? [] : ['餐馆名称或门牌号'];
}
