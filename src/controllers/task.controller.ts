import type { Request, Response } from 'express';
import { taskService } from '../services/task.service.ts';

/**
 * Handles incoming HTTP requests and formats outgoing responses.
 */
class TaskController {
    /**
     * Retrieves all tasks.
     */
    getAll(req: Request, res: Response) {
        const tasks = taskService.getAllTasks();
        res.json(tasks);
    }

    /**
     * Validates input and creates a new task.
     */
    create(req: Request, res: Response) {
        const { title, description } = req.body;
        
        if (!title || !description) {
            return res.status(400).json({ message: 'Title and description are required' });
        }

        const newTask = taskService.createTask(title, description);
        res.status(201).json(newTask);
    }

    /**
     * Handles single task retrieval with ID validation.
     */
    getById(req: Request, res: Response) {
        const { id } = req.params;
        
        if (typeof id !== 'string') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const task = taskService.getTaskById(id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(task);
    }

    /**
     * Manages task deletion and returns appropriate status codes.
     */
    delete(req: Request, res: Response) {
        const { id } = req.params;

        if (typeof id !== 'string') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const deleted = taskService.deleteTask(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.status(204).send();
    }
    /**
     * Updates an existing task partially.
     */
    update(req: Request, res: Response) {
        const { id } = req.params;
        const updates = req.body; // Here comes the update data, which can be partial

        if (typeof id !== 'string') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const updatedTask = taskService.updateTask(id, updates);
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found' });
        }
        res.json(updatedTask);
    }
}

export const taskController = new TaskController();