import { Router } from 'express';
import { taskController } from '../controllers/task.controller.ts';

/*
 * Assignee routes — mounted at /api/tasks/:id/assignees in server.ts.
 * Handles assigning / unassigning project members to a specific task.
 * Only the project OWNER may assign or unassign (enforced in the controller).
 * Protected by the JWT middleware applied upstream in server.ts.
*/
export const taskAssigneeRouter = Router({ mergeParams: true });

// POST /api/tasks/:id/assignees/:userId — assign a project member to the task
taskAssigneeRouter.post('/:userId', (req, res) => taskController.assignUser(req, res));

// DELETE /api/tasks/:id/assignees/:userId — unassign a project member from the task
taskAssigneeRouter.delete('/:userId', (req, res) => taskController.unassignUser(req, res));
