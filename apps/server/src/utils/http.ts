import type { Response } from 'express';

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function sendOk<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data });
}
