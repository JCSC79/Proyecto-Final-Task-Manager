import knex from 'knex';
import { createRequire } from 'module';
import type { IUser } from '../models/user.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

/**
 * UserDAO - Handles all database interactions for the User entity.
 */
class UserDAO {
    async getByEmail(email: string): Promise<IUser | undefined> {
        return await db<IUser>('users').where({ email }).first();
    }

    async getById(id: string): Promise<IUser | undefined> {
        return await db<IUser>('users').where({ id }).first();
    }

    async create(user: IUser): Promise<IUser> {
        await db<IUser>('users').insert(user);
        return user;
    }

    /**
     * Returns all users without the password field (safe for admin panel).
     */
    async getAll(): Promise<Omit<IUser, 'password'>[]> {
        return await db<IUser>('users').select('id', 'email', 'role', 'name', 'avatar_url', 'createdAt');
    }

    /**
     * Updates the role of a user. Returns the updated user or undefined if not found.
     */
    async updateRole(id: string, role: 'ADMIN' | 'USER'): Promise<Omit<IUser, 'password'> | undefined> {
        const updated = await db<IUser>('users').where({ id }).update({ role });
        if (updated === 0) {
            return undefined;
        }
        return await db<IUser>('users').where({ id }).select('id', 'email', 'role', 'name', 'avatar_url', 'createdAt').first();
    }

    async updateName(id: string, name: string): Promise<Omit<IUser, 'password'> | undefined> {
        const updated = await db<IUser>('users').where({ id }).update({ name });
        if (updated === 0) {
            return undefined;
        }
        return await db<IUser>('users').where({ id }).select('id', 'email', 'role', 'name', 'avatar_url', 'createdAt').first();
    }
}

export const userDAO = new UserDAO();
