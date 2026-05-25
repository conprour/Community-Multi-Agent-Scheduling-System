import type { EmergencyFlowResponse, EmergencyReportCreate } from '@/types/emergency';

export function createWaterPipeDemoPayload(): EmergencyReportCreate {
  return {
    reporter_name: '张阿姨',
    contact: '13800000000',
    location: '2栋3单元4楼电梯口',
    description: '2栋3单元4楼水管爆了，地上全是水，怕漏到电梯里。',
    input_type: 'text',
    tags: ['漏水', '紧急', '公共区域'],
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
      summary: `已识别为给排水故障，核心描述：${payload.description.slice(0, 24)}...`,
      category: '给排水故障',
      location: payload.location,
      urgency: 'high',
      impact_scope: '楼栋公共区域及周边住户',
      risks: ['可能影响电梯井和公共电路', '积水区域存在滑倒风险', '需要尽快关闭阀门控制外溢'],
      requires_immediate_visit: true,
      missing_fields: payload.contact ? [] : ['联系方式'],
      suggested_questions: ['积水是否已经蔓延到电梯口或配电区域？'],
      temporary_guidance: ['远离电梯口和插座附近的积水区域', '如知道阀门位置，可先尝试关闭就近阀门'],
    },
    routing_decision: {
      scenario_code: 'water_pipe_burst',
      responsible_unit: 'XX小区物业工程维修组',
      responsible_role: '值班维修员',
      backup_units: ['社区值班人员', '电工待命'],
      eta_minutes: 20,
      service_sla: '20 分钟内到场',
      rationale: ['问题属于楼栋公共区域的给排水故障', '存在积水扩散和电梯受影响风险，需优先派发维修组'],
    },
    service_order: {
      order_id: `order-${stamp}-mock01`,
      status: '待派发',
      service_location: payload.location,
      service_actions: ['到场后先检查主阀或分支阀门', '确认漏水点是否属于公共管道', '必要时设置警示区域'],
      notes: ['若发现渗入电梯井，立即升级为协同处理', '当前为本地 mock 结果，可继续联调后端接口'],
    },
  };
}
