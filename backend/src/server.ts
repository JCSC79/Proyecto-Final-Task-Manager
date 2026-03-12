import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.ts';
import { taskController } from './controllers/task.controller.ts';
import { messagingService } from './services/messaging.service.ts';

const app = express();
const PORT = 3000;

/**
 * Middleware to parse JSON bodies.
 */
app.use(express.json());

/**
 * LOGGER MIDDLEWARE
 * Logs to console: [Time] METHOD /route
 */
app.use((req, _res, next) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next(); // Mandatory! Otherwise, the request gets "stuck" here.
});

/**
 * Swagger Documentation Route
 * Serves the interactive API explorer.
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Routes
 * We delegate the logic to the TaskController methods.
 */
app.get('/tasks', (req, res) => taskController.getAll(req, res));
app.post('/tasks', (req, res) => taskController.create(req, res));
app.get('/tasks/:id', (req, res) => taskController.getById(req, res));
app.delete('/tasks/:id', (req, res) => taskController.delete(req, res));
app.patch('/tasks/:id', (req, res) => taskController.update(req, res));

/**
 * Start the Express server
 */
app.listen(PORT, async () => {
    // Initialize RabbitMQ connection
    await messagingService.init();
    
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    console.log('Endpoints ready: GET, POST, DELETE, PATCH /tasks');
});