import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.ts';

const router = Router();

router.get('/users', (req, res) => adminController.getUsers(req, res));
router.patch('/users/:id/role', (req, res) => adminController.updateUserRole(req, res));

export default router;
