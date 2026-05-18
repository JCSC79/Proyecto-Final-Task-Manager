import { Router } from 'express';
import { projectController } from '../controllers/project.controller.ts';

const router = Router();

// GET  /api/projects — list all projects (org-wide) with membership info
router.get('/', (req, res) => projectController.getAll(req, res));

// POST /api/projects — create a new project (creator becomes OWNER)
router.post('/', (req, res) => projectController.create(req, res));

// DELETE /api/projects/:id — delete project (OWNER only, cascades to tasks/tags)
router.delete('/:id', (req, res) => projectController.delete(req, res));

// POST   /api/projects/:id/join — join a project as MEMBER
router.post('/:id/join', (req, res) => projectController.join(req, res));

// DELETE /api/projects/:id/leave  — leave a project (MEMBER only, OWNERs must delete)
router.delete('/:id/leave', (req, res) => projectController.leave(req, res));

// PATCH  /api/projects/:id — rename project (OWNER only)
router.patch('/:id', (req, res) => projectController.rename(req, res));

// GET    /api/projects/:id/members — list all members with roles
router.get('/:id/members', (req, res) => projectController.getMembers(req, res));

export default router;