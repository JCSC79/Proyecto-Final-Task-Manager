import { userDAO } from '../daos/user.dao.ts';
import { taskDAO } from '../daos/task.dao.ts';
import type { IUser } from '../models/user.model.ts';
import type { ITask } from '../models/task.model.ts';
import { Result } from '../utils/result.ts';

export interface ITaskAdmin extends ITask {
  userEmail?: string;
}

export class AdminService {
  async getAllUsers(): Promise<Result<IUser[]>> {
    const users = await userDAO.getAll();
    return Result.ok(users.map((u) => {
      const { password, ...safe } = u as IUser;
      return safe as IUser;
    }));
  }

  async updateUserRole(userId: string, role: 'ADMIN' | 'USER'): Promise<Result<IUser>> {
    const existing = await userDAO.getById(userId);
    if (!existing) {
      return Result.fail<IUser>('User not found');
    }

    const updated = await userDAO.update(userId, { role });
    if (!updated) {
      return Result.fail<IUser>('Failed to update user role');
    }

    const { password, ...safe } = updated as IUser;
    return Result.ok(safe as IUser);
  }

  async deleteUser(userId: string): Promise<Result<boolean>> {
    const existed = await userDAO.getById(userId);
    if (!existed) {
      return Result.fail<boolean>('User not found');
    }

    const deleted = await userDAO.delete(userId);
    if (!deleted) {
      return Result.fail<boolean>('Failed to delete user');
    }

    // optional: delete tasks of deleted user
    await taskDAO.deleteAll(userId);

    return Result.ok(true);
  }

  async getTasks(userId?: string): Promise<Result<ITaskAdmin[]>> {
    const tasks = await taskDAO.getAllAdmin(userId);
    return Result.ok(tasks);
  }

  async deleteTask(taskId: string): Promise<Result<boolean>> {
    const success = await taskDAO.deleteAny(taskId);
    if (!success) {
      return Result.fail<boolean>('Task not found');
    }
    return Result.ok(true);
  }
}

export const adminService = new AdminService();