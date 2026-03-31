import type { IUser } from './user';

export interface IUserStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

export interface IUserWithStats extends Omit<IUser, 'password'> {
  stats: IUserStats;
}
