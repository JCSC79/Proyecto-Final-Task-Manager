import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.ts';
import { taskController } from './controllers/task.controller.ts';
import { messagingService } from './services/messaging.service.ts';
import authRoutes from './routes/auth.routes.ts';
import adminRoutes from './routes/admin.routes.ts';
import projectRoutes from './routes/project.routes.ts'; // NEW: Added projects routing
import { authenticateToken } from './middlewares/auth.middleware.ts';
import { requireAdmin } from './middlewares/admin.middleware.ts';

const app = express();
const PORT = 3000;

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
});

const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registration attempts. Please try again later.' },
});

// SECURITY FIX: Reinstated strict CORS for HttpOnly credentials support
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// LOGGER: Reinstated request logging
app.use((req, _res, next) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// HEALTH CHECK: Reinstated for monitoring
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. PUBLIC ROUTES
app.use('/api/auth/login', loginRateLimiter);
app.use('/api/auth/register', registerRateLimiter);
app.use('/api/auth', authRoutes);

// 2. PROTECTED ROUTES
// TASKS
app.use('/api/tasks', authenticateToken); 

app.get('/api/tasks', (req, res) => taskController.getAll(req, res));
app.post('/api/tasks', (req, res) => taskController.create(req, res));
app.delete('/api/tasks', (req, res) => taskController.deleteAll(req, res));
app.get('/api/tasks/:id', (req, res) => taskController.getById(req, res));
app.delete('/api/tasks/:id', (req, res) => taskController.delete(req, res));
app.patch('/api/tasks/:id', (req, res) => taskController.update(req, res));

// PROJECTS
// Secured project routes added below tasks
app.use('/api/projects', authenticateToken, projectRoutes);

// 3. ADMIN ROUTES
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);

/**
 * SERVER STARTUP
 */
const server = app.listen(PORT, async () => {
    await messagingService.init();
    console.log(`[OK] Server running at http://localhost:${PORT}`);
    console.log(`[SECURE] Tasks & Projects routes are now protected by JWT middleware`);
    console.log(`[DOCS] Swagger available at http://localhost:${PORT}/api-docs`);
});

/**
 * GRACEFUL SHUTDOWN: Reinstated for clean process termination
 */
const shutdown = () => {
    console.log('[*] Shutting down gracefully...');
    server.close(() => {
        console.log('[OK] HTTP server closed.');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export { app, server };