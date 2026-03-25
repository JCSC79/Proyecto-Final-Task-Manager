import { Router } from 'express';
import { taskController } from '../controllers/task.controller.ts';
import { authenticate } from '../middlewares/auth.middleware.ts';
import { isAdmin } from '../middlewares/admin.middleware.ts';

const router = Router();

// Global Middleware: All task routes require authentication
router.use(authenticate);

router.get('/', (req, res) => taskController.getAll(req, res));
router.post('/', (req, res) => taskController.create(req, res));
router.delete('/cleanup', (req, res) => taskController.deleteAll(req, res));
router.get('/:id', (req, res) => taskController.getById(req, res));
router.patch('/:id', (req, res) => taskController.update(req, res));
router.delete('/:id', (req, res) => taskController.delete(req, res));

/** * ADMIN PRIVILEGED ROUTE
 * Only accessible if isAdmin middleware passes
 */
router.delete('/purge', isAdmin, (req, res) => {
    res.status(501).json({ message: "Global purge not yet implemented" });
});
export default router;