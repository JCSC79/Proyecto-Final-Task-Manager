import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.ts';

const categoryRouter = Router();

// GET /api/categories — list all task type categories (requires auth, set in server.ts)
categoryRouter.get('/', (req, res) => categoryController.getAll(req, res));

export default categoryRouter;
