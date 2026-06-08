import api from './axiosInstance';
import type { ITag } from '../types/task';

export interface ITagWithTaskCount extends ITag {
  taskCount: number;
}

/** GET /api/projects/:id/tags — all tags for a project with usage counts */
export const getTagsByProject = async (projectId: string): Promise<ITagWithTaskCount[]> => {
  const res = await api.get<ITagWithTaskCount[]>(`/api/projects/${projectId}/tags`);
  return res.data;
};

/** POST /api/projects/:id/tags — create a new tag in the project */
export const createTag = async (projectId: string, name: string, color?: string): Promise<ITag> => {
  const res = await api.post<ITag>(`/api/projects/${projectId}/tags`, { name, color });
  return res.data;
};

/** DELETE /api/projects/:id/tags/:tagId — OWNER only */
export const deleteTag = async (projectId: string, tagId: string): Promise<void> => {
  await api.delete(`/api/projects/${projectId}/tags/${tagId}`);
};

/** POST /api/tasks/:id/tags/:tagId — assign a tag to a task */
export const assignTag = async (taskId: string, tagId: string): Promise<void> => {
  await api.post(`/api/tasks/${taskId}/tags/${tagId}`);
};

/** DELETE /api/tasks/:id/tags/:tagId — remove a tag from a task */
export const unassignTag = async (taskId: string, tagId: string): Promise<void> => {
  await api.delete(`/api/tasks/${taskId}/tags/${tagId}`);
};
