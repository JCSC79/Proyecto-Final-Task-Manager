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
    /**
     * Finds a user by their unique email address.
     * Crucial for the Authentication process.
     */
    async getByEmail(email: string): Promise<IUser | undefined> {
        return await db<IUser>('users').where({ email }).first();
    }

    /**
     * Retrieves a user by their UUID.
     */
    async getById(id: string): Promise<IUser | undefined> {
        return await db<IUser>('users').where({ id }).first();
    }

    /**
     * Creates a new user record in the database.
     */
    async create(user: IUser): Promise<IUser> {
        await db<IUser>('users').insert(user);
        return user;
    }
}

export const userDAO = new UserDAO();