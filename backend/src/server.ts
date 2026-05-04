import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // Added cookie-parser for potential future use in session management or cookies handling
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.ts';
import { taskController } from './controllers/task.controller.ts';
import { messagingService } from './services/messaging.service.ts';
import authRoutes from './routes/auth.routes.ts';
import adminRoutes from './routes/admin.routes.ts';
import { authenticateToken } from './middlewares/auth.middleware.ts';
import { requireAdmin } from './middlewares/admin.middleware.ts';

const app = express();
const PORT = 3000;

const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
});

const registerRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many registration attempts. Please try again later.' },
});

// SECURITY FIX: Update CORS to allow credentials from the frontend origin
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser()); // Required to parse cookies from headers

app.use((req, _res, next) => {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// HEALTH CHECK
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});


// 1. PUBLIC ROUTES (No token required)
app.use('/api/auth/login', loginRateLimiter);
app.use('/api/auth/register', registerRateLimiter);
app.use('/api/auth', authRoutes);

// 2. PROTECTED ROUTES (Token required for all /tasks endpoints)
// This acts as a global guard for the task domain
app.use('/tasks', authenticateToken); 

app.get('/tasks', (req, res) => taskController.getAll(req, res));
app.post('/tasks', (req, res) => taskController.create(req, res));

// Bulk operations (Defined before parameterized routes)
app.delete('/tasks', (req, res) => taskController.deleteAll(req, res));

app.get('/tasks/:id', (req, res) => taskController.getById(req, res));
app.delete('/tasks/:id', (req, res) => taskController.delete(req, res));
app.patch('/tasks/:id', (req, res) => taskController.update(req, res));

// 3. ADMIN ROUTES (Token + Admin role required)
app.use('/api/admin', authenticateToken, requireAdmin, adminRoutes);

/**
 * SERVER STARTUP
 */
const server = app.listen(PORT, async () => {
    await messagingService.init();
    console.log(`[OK] Server running at http://localhost:${PORT}`);
    console.log(`[SECURE] Tasks routes are now protected by JWT middleware`);
    console.log(`[DOCS] Swagger available at http://localhost:${PORT}/api-docs`);
});

/**
 * GRACEFUL SHUTDOWN
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