import type { Request, Response } from 'express';
import { categoryDAO } from '../daos/category.dao.ts';

/**
 * CategoryController — exposes the global categories reference list.
 *
 * This controller is intentionally read-only: categories are managed via database seeds and are not created or mutated through the API.
 */
class CategoryController {
    /** GET /api/categories — returns all categories ordered by name. */
    async getAll(_req: Request, res: Response): Promise<void> {
        const categories = await categoryDAO.getAll();
        res.json(categories);
    }
}

export const categoryController = new CategoryController();
