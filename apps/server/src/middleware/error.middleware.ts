import type { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/http.js';

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ ok: false, error: error.message });
  }

  console.error(error);
  return res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
};
