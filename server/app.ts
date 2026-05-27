import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import multer from 'multer';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { env } from './config.js';
import { passport } from './auth/google.js';
import { setSessionCookie, verifySession } from './auth/session.js';
import { sessionCookieName } from './_core/cookies.js';
import { createContext } from './_core/trpc.js';
import { appRouter } from './routers/index.js';
import { getUserById } from './services/users.js';
import { getFileAttachment, registerFileAttachment, type FileType } from './services/inventory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedUploadTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const allowedFileTypes = new Set<FileType>(['responsiva', 'ine', 'other']);

function ensureUploadDir() {
  fs.mkdirSync(env.uploadDir, { recursive: true });
}

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, env.uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedUploadTypes.has(file.mimetype)) {
      cb(new Error('Formato no permitido. Sube PDF, JPG, PNG o WEBP.'));
      return;
    }
    cb(null, true);
  }
});

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const session = verifySession(req.cookies?.[sessionCookieName]);
    if (!session) {
      res.status(401).json({ error: 'Sesión requerida.' });
      return;
    }
    const user = await getUserById(session.sub);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Sesión inválida.' });
      return;
    }
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Permiso de administrador requerido.' });
      return;
    }
    res.locals.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

async function requireAuthenticated(req: Request, res: Response, next: NextFunction) {
  try {
    const session = verifySession(req.cookies?.[sessionCookieName]);
    if (!session) {
      res.status(401).json({ error: 'Sesión requerida.' });
      return;
    }
    const user = await getUserById(session.sub);
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Sesión inválida.' });
      return;
    }
    res.locals.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(rateLimit({ windowMs: 60_000, limit: 240 }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  app.use(passport.initialize());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'tickets-bada', stack: 'express-trpc-drizzle-mysql' });
  });

  app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
  app.get('/api/auth/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth' }), (req, res) => {
    const user = req.user as { id: string; email: string; role: 'admin' | 'user' };
    setSessionCookie(res, { sub: user.id, email: user.email, role: user.role });
    res.redirect('/');
  });

  app.post('/api/files/upload', requireAdmin, upload.single('file'), async (req, res, next) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Archivo requerido.' });
        return;
      }
      const type = String(req.body.type || 'other') as FileType;
      if (!allowedFileTypes.has(type)) {
        fs.unlink(req.file.path, () => undefined);
        res.status(400).json({ error: 'Tipo de documento inválido.' });
        return;
      }
      const file = await registerFileAttachment({
        originalName: req.file.originalname,
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
        path: req.file.path,
        type,
        userId: req.body.userId || undefined,
        deviceId: req.body.deviceId || undefined,
        uploadedById: res.locals.user.id
      });
      res.status(201).json({ file });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/files/:id/download', requireAuthenticated, async (req, res, next) => {
    try {
      const file = await getFileAttachment(String(req.params.id));
      if (!file) {
        res.status(404).json({ error: 'Archivo no encontrado.' });
        return;
      }
      const resolvedUploadDir = path.resolve(env.uploadDir);
      const resolvedPath = path.resolve(file.path);
      if (!resolvedPath.startsWith(resolvedUploadDir)) {
        res.status(403).json({ error: 'Ruta de archivo no permitida.' });
        return;
      }
      res.download(resolvedPath, file.originalName);
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/trpc', createExpressMiddleware({ router: appRouter, createContext }));

  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return app;
}
