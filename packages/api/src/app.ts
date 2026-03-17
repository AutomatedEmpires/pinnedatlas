import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import locationsRouter from './routes/locations';
import usersRouter from './routes/users';
import savedRouter from './routes/saved';
import reportsRouter from './routes/reports';
import adminRouter from './routes/admin';
import { errorHandler, notFound } from './middleware/errorHandler';

const app = express();

// ─── Security & parsing ───────────────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: [
      'http://localhost:5173', // Vite dev server
      'http://localhost:3000',
    ],
    credentials: true,
  }),
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ────────────────────────────────────────────────────────────

const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts, please try again later' },
});

app.use('/api', defaultLimiter);
app.use('/api/auth', authLimiter);

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/locations', locationsRouter);
app.use('/api', usersRouter);          // /api/auth/*, /api/users/*, /api/admin/users
app.use('/api/saved', savedRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/admin', adminRouter);

// ─── Error handling ───────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

export default app;
