import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  PUBLIC_APP_URL: z.string().url().default('http://localhost:4000'),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID es requerido'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET es requerido'),
  GOOGLE_CALLBACK_URL: z.string().url(),
  SESSION_SECRET: z.string().min(24, 'SESSION_SECRET debe tener al menos 24 caracteres'),
  BOOTSTRAP_ADMIN_EMAILS: z.string().optional().default(''),
  UPLOAD_DIR: z.string().optional().default('/var/www/tickets-bada/uploads')
});

const parsed = envSchema.parse(process.env);

export const env = {
  nodeEnv: parsed.NODE_ENV,
  port: parsed.PORT,
  publicAppUrl: parsed.PUBLIC_APP_URL.replace(/\/$/, ''),
  corsOrigin: parsed.CORS_ORIGIN.replace(/\/$/, ''),
  databaseUrl: parsed.DATABASE_URL,
  googleClientId: parsed.GOOGLE_CLIENT_ID,
  googleClientSecret: parsed.GOOGLE_CLIENT_SECRET,
  googleCallbackUrl: parsed.GOOGLE_CALLBACK_URL,
  sessionSecret: parsed.SESSION_SECRET,
  bootstrapAdminEmails: parsed.BOOTSTRAP_ADMIN_EMAILS.split(',').map((email) => email.trim().toLowerCase()).filter(Boolean),
  uploadDir: parsed.UPLOAD_DIR
};
