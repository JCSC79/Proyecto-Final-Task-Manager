import { Router } from 'express';
import { projectController } from '../controllers/project.controller.ts';

const router = Router();

// GET /api/projects
router.get('/', (req, res) => projectController.getAll(req, res));

export default router;