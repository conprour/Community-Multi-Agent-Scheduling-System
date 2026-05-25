import type { EmergencyFlowResponse, EmergencyReportCreate } from '@/types/emergency';

export function createWaterPipeDemoPayload(): EmergencyReportCreate {
  return {
    reporter_name: '李女士',
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

  return {
    request_id: `req-${stamp}-mock01`,
    created_at: now.toISOString(),
    demand_package: {
      summary: `已识别为餐饮油烟与夜间噪声复合诉求，核心描述：${payload.description.slice(0, 24)}...`,
      category: '餐饮油烟 / 噪声扰民 / 物业协调',
      location: payload.location,
      urgency: 'medium',
      impact_scope: '底商周边住户与夜间休息环境',
      risks: ['同一片区近 7 日存在相似投诉', '涉及城管、生态环境、市场监管、社区多方协同', '夜间噪声与油烟持续影响满意度'],
      requires_immediate_visit: false,
      missing_fields: payload.contact ? ['餐馆名称或门牌号'] : ['联系方式', '餐馆名称或门牌号'],
      suggested_questions: ['请补充餐馆名称、门牌号和主要扰民时段。'],
      temporary_guidance: ['建议保留油烟、噪声发生时段的照片或录音。', '坐席可先生成预工单，待地址补充后进入正式派单。'],
    },
    routing_decision: {
      scenario_code: 'restaurant_fume_noise',
      responsible_unit: '属地街道综合执法队',
      responsible_role: '接诉即办调度员',
      backup_units: ['生态环境部门', '市场监管所', '知春里社区居委会', '物业公司'],
      eta_minutes: 120,
      service_sla: '2 小时内完成核查派单',
      rationale: ['诉求同时命中餐饮油烟、夜间噪声和物业协调失败', '建议由属地街道牵头，多部门联合核查', '缺少具体商户信息，需坐席人工确认后派单'],
    },
    service_order: {
      order_id: `order-${stamp}-mock01`,
      status: '待派发',
      service_location: payload.location,
      service_actions: ['联系投诉人补充餐馆名称、门牌号和扰民时段', '安排夜间现场核查油烟净化设施和噪声情况', '同步市场监管核查经营资质并要求物业配合提供商户信息'],
      notes: ['监督审计 Agent 判定：不允许全自动派单，需要人工确认地址信息', '当前为本地 mock 结果，可继续联调后端接口'],
    },
  };
}
