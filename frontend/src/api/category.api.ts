import api from './axiosInstance';
import type { ICategory } from '../types/task';

export const getCategories = async (): Promise<ICategory[]> => {
  const res = await api.get<ICategory[]>('/api/categories');
  return res.data;
};
