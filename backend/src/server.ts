import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.ts';
import { taskController } from './controllers/task.controller.ts';
import { messagingService } from './services/messaging.service.ts';
import authRoutes from './routes/auth.routes.ts';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Routes Mapping
 * IMPORTANT: Static routes like DELETE /tasks must be defined BEFORE 
 * parameterized routes like DELETE /tasks/:id to avoid matching conflicts.
 */

// Authentication routes
app.use('/api/auth', authRoutes);


// Task routes
app.get('/tasks', (req, res) => taskController.getAll(req, res));
app.post('/tasks', (req, res) => taskController.create(req, res));
app.delete('/tasks', (req, res) => taskController.deleteAll(req, res));
app.get('/tasks/:id', (req, res) => taskController.getById(req, res));
app.delete('/tasks/:id', (req, res) => taskController.delete(req, res));
app.patch('/tasks/:id', (req, res) => taskController.update(req, res));

/**
 * Start the Express server and initialize dependencies.
 */
app.listen(PORT, async () => {
    await messagingService.init();
    console.log(`Server running at http://localhost:${PORT}/tasks`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    console.log('Endpoints ready: GET, POST, DELETE, PATCH /tasks');
});