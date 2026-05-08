import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/http.js';

const brandingUploadDir = path.resolve(env.UPLOAD_DIR, 'system-branding');
fs.mkdirSync(brandingUploadDir, { recursive: true });

const allowedLogoMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, brandingUploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${crypto.randomUUID()}-${safeName}`);
  }
});

export const uploadSystemLogo = multer({
  storage,
  limits: { fileSize: Math.min(env.MAX_UPLOAD_MB, 5) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowedLogoMimeTypes.has(file.mimetype)) {
      return cb(new AppError(400, 'Tipo de imagen no permitido. Usa JPG, PNG o WEBP.'));
    }
    cb(null, true);
  }
});
