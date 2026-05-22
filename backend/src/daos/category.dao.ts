import knex from 'knex';
import { createRequire } from 'module';
import type { ICategory } from '../models/category.model.ts';

const require = createRequire(import.meta.url);
const config = require('../../knexfile.cjs');
const db = knex(config.development);

/**
 * CategoryDAO — read-only access to the categories reference table.
 *
 * Categories are seeded at startup and are not created or deleted through the API. This DAO exposes a single method used by the categories 
 * endpoint and (indirectly) by the task JOIN queries in TaskDAO.
 */
class CategoryDAO {
    /**
     * Returns all categories ordered alphabetically.
     * Result includes createdAt because this is the full row, not an embed.
     */
    async getAll(): Promise<ICategory[]> {
        return await db<ICategory>('categories').select('*').orderBy('name', 'asc');
    }
}

export const categoryDAO = new CategoryDAO();
