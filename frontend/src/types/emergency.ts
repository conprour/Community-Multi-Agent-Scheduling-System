export type EmergencyInputType = 'text' | 'audio' | 'image';
export type FlowStage = 'idle' | 'intake' | 'routing' | 'completed';

export interface AttachmentMeta {
  name: string;
  mime_type: string;
  stored_path?: string | null;
}

export interface EmergencyReportCreate {
  reporter_name: string;
  contact?: string | null;
  location: string;
  description: string;
  input_type: EmergencyInputType;
  tags: string[];
  attachments: AttachmentMeta[];
}

export interface DemandPackage {
  summary: string;
  category: string;
  location: string;
  urgency: 'low' | 'medium' | 'high';
  impact_scope: string;
  risks: string[];
  requires_immediate_visit: boolean;
  missing_fields: string[];
  suggested_questions: string[];
  temporary_guidance: string[];
}

export interface RoutingDecision {
  scenario_code: string;
  responsible_unit: string;
  responsible_role: string;
  backup_units: string[];
  eta_minutes: number;
  service_sla: string;
  rationale: string[];
}

export interface ServiceOrder {
  order_id: string;
  status: '待派发' | '已派发' | '处理中';
  service_location: string;
  service_actions: string[];
  notes: string[];
}

export interface EmergencyFlowResponse {
  request_id: string;
  created_at: string;
  demand_package: DemandPackage;
  routing_decision: RoutingDecision;
  service_order: ServiceOrder;
}

export interface UploadAttachmentsResponse {
  attachments: AttachmentMeta[];
}
