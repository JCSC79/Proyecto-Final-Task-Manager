/**
 * Frontend User type — mirrors the backend IUser but without sensitive fields.
 * The backend never sends 'password' in the response, so it's omitted here.
 */
export type UserRole = 'ADMIN' | 'USER';

export interface IUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatar_url?: string;
  createdAt: string; // ISO string when received from JSON
}

/** Shape of the /api/auth/login response */
export interface LoginResponse {
  message: string;
  token: string;
  user: IUser;
}
