import api from './axiosInstance';
import type { AuditLog } from '../types/task';

export const getTaskHistory = async (taskId: string): Promise<AuditLog[]> => {
  const response = await api.get<AuditLog[]>(`/api/tasks/${taskId}/history`);
  return response.data;
};

export const downloadTasksPdf = async (lang: 'en' | 'es' = 'en'): Promise<void> => {
  const response = await api.get(`/api/tasks/export/pdf?lang=${lang}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tasks-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

export const downloadAdminPdf = async (lang: 'en' | 'es' = 'en'): Promise<void> => {
  const response = await api.get(`/api/admin/export/pdf?lang=${lang}`, { responseType: 'blob' });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `admin-report-${new Date().toISOString().slice(0, 10)}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
