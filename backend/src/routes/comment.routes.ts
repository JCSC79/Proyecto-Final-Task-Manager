import { Router } from 'express';
import { commentController } from '../controllers/comment.controller.ts';

const router = Router({ mergeParams: true }); // mergeParams gives access to :id from parent

router.get('/', (req, res) => commentController.getByTask(req, res));
router.post('/', (req, res) => commentController.create(req, res));
router.delete('/:commentId', (req, res) => commentController.delete(req, res));

export default router;
