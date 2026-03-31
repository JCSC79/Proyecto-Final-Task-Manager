import api from './axiosInstance';
import type { IUser, LoginResponse } from '../types/user';

export const loginRequest = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/auth/login', { email, password });
  return response.data;
};

export const registerRequest = async (
  email: string,
  password: string,
  name?: string
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/auth/register', { email, password, name });
  return response.data;
};

export const updateMeRequest = async (name: string): Promise<{ user: IUser }> => {
  const response = await api.patch<{ user: IUser }>('/api/auth/me', { name });
  return response.data;
};

