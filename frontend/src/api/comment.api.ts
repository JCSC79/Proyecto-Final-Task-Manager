import api from './axiosInstance';

export interface IComment {
  id: string;
  taskId: string;
  userId: string;
  body: string;
  createdAt?: string;
  authorName?: string | null;
  authorEmail?: string;
  authorAvatarUrl?: string | null;
}

export const getComments = async (taskId: string): Promise<IComment[]> => {
  const res = await api.get<IComment[]>(`/api/tasks/${taskId}/comments`);
  return res.data;
};

export const postComment = async (taskId: string, body: string): Promise<IComment> => {
  const res = await api.post<IComment>(`/api/tasks/${taskId}/comments`, { body });
  return res.data;
};

export const deleteComment = async (taskId: string, commentId: string): Promise<void> => {
  await api.delete(`/api/tasks/${taskId}/comments/${commentId}`);
};
