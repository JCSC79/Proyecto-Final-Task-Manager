import express from 'express';
import type { Request, Response } from 'express';
import { taskService } from './services/task.service.ts';

const app = express();
const PORT = 3000;

/**
 * Middleware to parse JSON bodies. 
 * This allows the server to understand the data we send in POST or PATCH.
 */
app.use(express.json());

/**
 * GET /tasks
 * Returns all tasks from our in-memory storage.
 */
app.get('/tasks', (req: Request, res: Response) => {
    res.json(taskService.getAllTasks());
});

/**
 * POST /tasks
 * Receives title and description to create a new task.
 */
app.post('/tasks', (req: Request, res: Response) => {
    const { title, description } = req.body;
    
    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    const newTask = taskService.createTask(title, description);
    res.status(201).json(newTask);
});

/**
 * GET /tasks/:id
 * Finds a specific task using the ID from the URL.
 */
app.get('/tasks/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    
    // Validamos que el ID existe y es un string para calmar a TS
    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    const task = taskService.getTaskById(id);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
});

/**
 * DELETE /tasks/:id
 * Deletes a task. Returns 204 (No Content) if successful.
 */
app.delete('/tasks/:id', (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== 'string') {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    const deleted = taskService.deleteTask(id);
    if (!deleted) {
        return res.status(404).json({ message: 'Task not found' });
    }
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Endpoints ready: GET, POST, DELETE /tasks');
});