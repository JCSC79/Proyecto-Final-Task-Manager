import express from 'express';
import type { Request, Response } from 'express';
/**
 * In Node 24, we explicitly use .ts extensions and 'import type' 
 * to handle TypeScript's native type stripping correctly.
 */
import { taskService } from './services/task.service.ts';

const app = express();
const PORT = 3000;

/**
 * Main route: Creates a task and returns the current list.
 * This demonstrates the connection between the Express server 
 * and the TaskService logic.
 */
app.get('/', (req: Request, res: Response) => {
    // 1. Create a dynamic task using our service
    taskService.createTask(
        'Complete Phase 1', 
        'Strict typing and project structure successfully implemented'
    );
    
    // 2. Retrieve all tasks from memory
    const currentTasks = taskService.getAllTasks();
    
    // 3. Send the list as a JSON response
    res.json(currentTasks);
});

/**
 * Start the Express server
 */
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Task Service is active and managing data in memory.');
});