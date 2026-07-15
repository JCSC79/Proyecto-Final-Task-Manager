import api from './axiosInstance';
import type { IUserWithStats } from '../types/admin';

/** Returns all users with their task statistics. */
export const fetchAdminUsers = async (): Promise<IUserWithStats[]> => {
  const res = await api.get<IUserWithStats[]>('/api/admin/users');
  return res.data;
};

/** Promotes or demotes a user. */
export const updateUserRole = async (
  userId: string,
  role: 'ADMIN' | 'USER'
): Promise<{ message: string; user: IUserWithStats }> => {
  const res = await api.patch<{ message: string; user: IUserWithStats }>(
    `/api/admin/users/${userId}/role`,
    { role }
  );
  return res.data;
};

/** Blocks or unblocks a user. */
export const blockUser = async (
  userId: string,
  blocked: boolean
): Promise<{ message: string; user: IUserWithStats }> => {
  const res = await api.patch<{ message: string; user: IUserWithStats }>(
    `/api/admin/users/${userId}/block`,
    { blocked }
  );
  return res.data;
};

/** Permanently deletes a user (CASCADE in DB). */
export const deleteUser = async (userId: string): Promise<void> => {
  await api.delete(`/api/admin/users/${userId}`);
};

export interface LeadTimeEntry {
  category: string;
  avgDays: number;
  resolved: number;
}

export interface WorkloadEntry {
  userId: string;
  name: string | null;
  email: string;
  activeTasks: number;
}

export interface AdminAnalytics {
  leadTimes: LeadTimeEntry[];
  workload: WorkloadEntry[];
}

export const fetchAdminAnalytics = async (range: '7' | '30' | '90' | 'all' = 'all'): Promise<AdminAnalytics> => {
  const res = await api.get<AdminAnalytics>('/api/admin/analytics', { params: { range } });
  return res.data;
};
