import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';
import { isAdmin } from '../middlewares/admin.middleware.ts';

const router = Router();

router.use(authenticate);
router.use(isAdmin);

router.get('/users', (req, res) => adminController.listUsers(req, res));
router.patch('/users/:id/role', (req, res) => adminController.updateUserRole(req, res));
router.delete('/users/:id', (req, res) => adminController.deleteUser(req, res));

router.get('/tasks', (req, res) => adminController.listTasks(req, res));
router.delete('/tasks/:id', (req, res) => adminController.deleteTask(req, res));

export default router;