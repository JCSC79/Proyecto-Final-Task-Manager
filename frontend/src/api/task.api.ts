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

/** POST /api/tasks/:id/assignees/:userId — assign a project member to a task (project OWNER only) */
export const assignUser = async (taskId: string, userId: string): Promise<void> => {
  await api.post(`/api/tasks/${taskId}/assignees/${userId}`);
};

/** DELETE /api/tasks/:id/assignees/:userId — unassign a project member from a task (project OWNER only) */
export const unassignUser = async (taskId: string, userId: string): Promise<void> => {
  await api.delete(`/api/tasks/${taskId}/assignees/${userId}`);
};
