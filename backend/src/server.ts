import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env';
import { initDb, isDbConnected } from './config/db';
import { seedDatabase } from './config/seed';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

export const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", ENV.FRONTEND_URL],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or matching frontend
      if (!origin || origin === ENV.FRONTEND_URL || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local development demonstration
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Request Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Global API rate limiting
app.use('/api', apiLimiter);

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'SecureVault Backend API',
    version: '1.0.0',
    environment: ENV.NODE_ENV,
    database: isDbConnected() ? 'connected' : 'disconnected',
  });
});

// Demo Seeding Endpoint (guarantees demo credentials exist in production)
app.all(['/api/seed', '/api/auth/seed-demo'], async (req: Request, res: Response) => {
  try {
    await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Demo account and sample credentials successfully seeded.',
      data: {
        email: 'demo@example.com',
        password: 'DemoPassword123!',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Seeding failed: ' + err.message });
  }
});

// Master REST API routes
app.use('/api', routes);

// Serve static frontend in production (Single-Service Unified Deployment)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req: Request, res: Response) => {
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({
        success: false,
        message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
      });
    }
  });
} else {
  // 404 Route Handler for API-only mode
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: `API endpoint '${req.method} ${req.originalUrl}' not found.`,
    });
  });
}

// Centralized Error Handler
app.use(errorHandler);

// Start server if not running in test mode
if (process.env.NODE_ENV !== 'test') {
  const startServer = async () => {
    await initDb();
    if (isDbConnected()) {
      await seedDatabase().catch((err) => console.warn('Auto-seed warning:', err.message));
    }
    app.listen(ENV.PORT, () => {
      console.log(`====================================================`);
      console.log(`  SecureVault Backend API Server is running!`);
      console.log(`  Port: ${ENV.PORT}`);
      console.log(`  Environment: ${ENV.NODE_ENV}`);
      console.log(`  Health: http://localhost:${ENV.PORT}/api/health`);
      console.log(`====================================================`);
    });
  };

  startServer().catch((err) => {
    console.error('Fatal initialization error:', err);
    process.exit(1);
  });
}
