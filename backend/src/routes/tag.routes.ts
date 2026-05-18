import { Router } from 'express';
import { tagController } from '../controllers/tag.controller.ts';

/*
 * Tag routes — two separate routers:
 *   projectTagRouter - mounted at /api/projects/:id/tags in server.ts handles project-level tag management (list, create, delete)
 *   taskTagRouter - mounted at /api/tasks/:id/tags in server.ts handles assigning / unassigning tags on a specific task
 * Both routers are protected by the JWT middleware applied upstream in server.ts.
*/

// Project tag routes
export const projectTagRouter = Router({ mergeParams: true });

// GET /api/projects/:id/tags — list all tags of a project
projectTagRouter.get('/', (req, res) => tagController.getAllByProject(req, res));

// POST /api/projects/:id/tags — create a new tag (members only)
projectTagRouter.post('/', (req, res) => tagController.create(req, res));

// DELETE /api/projects/:id/tags/:tagId — delete a tag (owner only)
projectTagRouter.delete('/:tagId', (req, res) => tagController.delete(req, res));

//  Task tag routes 
export const taskTagRouter = Router({ mergeParams: true });

// POST /api/tasks/:id/tags/:tagId — assign tag to task
taskTagRouter.post('/:tagId', (req, res) => tagController.assignToTask(req, res));

// DELETE /api/tasks/:id/tags/:tagId — unassign tag from task
taskTagRouter.delete('/:tagId', (req, res) => tagController.unassignFromTask(req, res));
