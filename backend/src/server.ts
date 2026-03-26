import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.ts';
import { messagingService } from './services/messaging.service.ts';

// Import our new modular routes 
import authRoutes from './routes/auth.routes.ts';
import taskRoutes from './routes/task.routes.ts';
import adminRoutes from './routes/admin.routes.ts';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

/**
 * Request logger for traceability
 */
app.use((req, _res, next) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * API ROUTES
 * Modularized for better scalability and maintenance
 */
app.use('/auth', authRoutes);
app.use('/tasks', taskRoutes);
app.use('/admin', adminRoutes);

app.listen(PORT, async () => {
    // Async service initialization (RabbitMQ)
    await messagingService.init();
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API Docs: http://localhost:${PORT}/api-docs`);
});