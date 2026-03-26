import knex from 'knex';
import { createRequire } from 'module';
import type { IUser } from '../models/user.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

/**
 * Data Access Object for Users.
 * Encapsulates all PostgreSQL interactions for the users table.
 */
class UserDAO {
    
    /**
     * Finds a user by their unique email. 
     * Essential for the Login process.
     */
    async getByEmail(email: string): Promise<IUser | undefined> {
        return await db<IUser>('users').where({ email }).first();
    }

    /**
     * Finds a user by their unique ID.
     */
    async getById(id: string): Promise<IUser | undefined> {
        return await db<IUser>('users').where({ id }).first();
    }

    /**
     * Persists a new user in the database.
     */
    async create(user: IUser): Promise<IUser> {
        await db<IUser>('users').insert(user);
        return user;
    }

    /**
     * Updates an existing user's data.
     * Essential for profile editing.
     */
    async update(id: string, data: Partial<IUser>): Promise<IUser | undefined> {
        const [updatedUser] = await db<IUser>('users')
            .where({ id })
            .update(data)
            .returning('*');
        return updatedUser;
    }

    /**
     * Admin: Retrieve all users.
     */
    async getAll(): Promise<IUser[]> {
        return await db<IUser>('users').select('*');
    }

    /**
     * Admin: Delete user by ID.
     */
    async delete(id: string): Promise<boolean> {
        const deletedRows = await db<IUser>('users').where({ id }).del();
        return deletedRows > 0;
    }
}

export const userDAO = new UserDAO();