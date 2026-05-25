import axios from 'axios';

import type { EmergencyFlowResponse, EmergencyReportCreate, UploadAttachmentsResponse } from '@/types/emergency';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000',
  timeout: 8000,
});

export async function submitEmergency(payload: EmergencyReportCreate): Promise<EmergencyFlowResponse> {
  const { data } = await apiClient.post<EmergencyFlowResponse>('/api/intake/submit', payload, { timeout: 20000 });
  return data;
}

export async function analyzeEmergency(payload: EmergencyReportCreate): Promise<EmergencyFlowResponse> {
  const { data } = await apiClient.post<EmergencyFlowResponse>('/api/intake/analyze', payload, { timeout: 20000 });
  return data;
}

export async function uploadAttachments(files: File[]): Promise<UploadAttachmentsResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const { data } = await apiClient.post<UploadAttachmentsResponse>('/api/uploads', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 20000,
  });

  return data;
}
