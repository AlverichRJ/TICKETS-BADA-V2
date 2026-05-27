import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL es requerida para ejecutar migraciones Drizzle.');
}

export default defineConfig({
  schema: './db/schema.ts',
  out: '../drizzle',
  dialect: 'mysql',
  dbCredentials: {
    url: process.env.DATABASE_URL
  },
  verbose: true,
  strict: true
});
