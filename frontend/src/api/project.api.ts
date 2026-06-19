import api from './axiosInstance';
import type { IProject } from '../types/project';

export interface ProjectMember {
  userId: string;
  name: string | null;
  email: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
}

export const getProjects = async (): Promise<IProject[]> => {
  const response = await api.get<IProject[]>('/api/projects');
  return response.data;
};

export const createProject = async (name: string, color?: string): Promise<IProject> => {
  const response = await api.post<IProject>('/api/projects', { name, ...(color ? { color } : {}) });
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/api/projects/${id}`);
};

export const joinProject = async (id: string): Promise<void> => {
  await api.post(`/api/projects/${id}/join`);
};

export const leaveProject = async (id: string): Promise<void> => {
  await api.delete(`/api/projects/${id}/leave`);
};

export const renameProject = async (id: string, name: string): Promise<IProject> => {
  const response = await api.patch<IProject>(`/api/projects/${id}`, { name });
  return response.data;
};

export const getProjectMembers = async (id: string): Promise<ProjectMember[]> => {
  const response = await api.get<ProjectMember[]>(`/api/projects/${id}/members`);
  return response.data;
};

export const addProjectMember = async (id: string, email: string): Promise<void> => {
  await api.post(`/api/projects/${id}/members`, { email });
};

export const removeProjectMember = async (id: string, userId: string): Promise<void> => {
  await api.delete(`/api/projects/${id}/members/${userId}`);
};

export const updateProjectSettings = async (
  id: string,
  settings: { isPublic?: boolean; color?: string; description?: string | null }
): Promise<void> => {
  await api.patch(`/api/projects/${id}/settings`, settings);
};
