import axios from 'axios';

import type { ManagementAnalysisResult, ManagementQueryCreate } from '@/types/management';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000',
  timeout: 45000,
});

export async function analyzeManagementQuestion(payload: ManagementQueryCreate): Promise<ManagementAnalysisResult> {
  const { data } = await apiClient.post<ManagementAnalysisResult>('/api/management/analyze', payload);
  return data;
}
