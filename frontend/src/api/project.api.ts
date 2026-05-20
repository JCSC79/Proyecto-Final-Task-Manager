import api from './axiosInstance';
import type { IProject } from '../types/project';

export const getProjects = async (): Promise<IProject[]> => {
  const response = await api.get<IProject[]>('/api/projects');
  return response.data;
};

export const createProject = async (name: string): Promise<IProject> => {
  const response = await api.post<IProject>('/api/projects', { name });
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
