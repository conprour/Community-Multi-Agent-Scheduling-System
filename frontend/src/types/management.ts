export interface ManagementQueryCreate {
  question: string;
  area: string;
  horizon_days: number;
}

export interface SimulatedAppeal {
  case_id: string;
  created_at: string;
  district: string;
  community: string;
  location_label: string;
  latitude: number;
  longitude: number;
  category: string;
  severity: 'low' | 'medium' | 'high';
  population_group: string;
  description: string;
  requested_resource: string;
  status: '待受理' | '已派单' | '处理中' | '已办结';
}

export interface ManagementAgentStep {
  key: string;
  title: string;
  input_summary: string;
  output_summary: string;
  evidence: string[];
  confidence: number;
}

export interface TimeSeriesPoint {
  label: string;
  count: number;
  high_severity: number;
}

export interface CategoryMetric {
  label: string;
  count: number;
  ratio: number;
}

export interface RegionInsight {
  name: string;
  count: number;
  high_severity: number;
  top_category: string;
  recommended_action: string;
  latitude: number;
  longitude: number;
}

export interface ManagementAnalysisResult {
  analysis_id: string;
  created_at: string;
  original_question: string;
  normalized_question: string;
  topic: string;
  extracted_keywords: string[];
  simulated_count: number;
  records: SimulatedAppeal[];
  agent_steps: ManagementAgentStep[];
  time_series: TimeSeriesPoint[];
  category_metrics: CategoryMetric[];
  region_insights: RegionInsight[];
  answer: string;
  recommendations: string[];
}
