import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { passport } from './config/passport.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import { authRoutes } from './routes/auth.routes.js';
import { ticketRoutes } from './routes/ticket.routes.js';
import { deviceRoutes } from './routes/device.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { fileRoutes } from './routes/file.routes.js';
import { computerEquipmentRoutes } from './routes/computer-equipment.routes.js';
import { departmentRoutes } from './routes/department.routes.js';
import { systemSettingRoutes } from './routes/system-setting.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(','), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(passport.initialize());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500 }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'tickets-inventory-api' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', ticketRoutes);
  app.use('/api/devices', deviceRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/files', fileRoutes);
  app.use('/api/computer-equipment', computerEquipmentRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/system-settings', systemSettingRoutes);

  app.use(errorMiddleware);

  return app;
}
