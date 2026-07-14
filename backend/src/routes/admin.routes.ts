import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.ts';

const router = Router();

router.get('/users', (req, res) => adminController.getUsers(req, res));
router.get('/analytics', (req, res) => adminController.getAnalytics(req, res));
router.patch('/users/:id/role', (req, res) => adminController.updateUserRole(req, res));
router.patch('/users/:id/block', (req, res) => adminController.blockUser(req, res));
router.delete('/users/:id', (req, res) => adminController.deleteUser(req, res));
router.get('/export/pdf', (req, res) => adminController.exportPdf(req, res));

export default router;
