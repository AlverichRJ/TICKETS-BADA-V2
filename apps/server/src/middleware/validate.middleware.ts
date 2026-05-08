import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return _res.status(400).json({ ok: false, error: 'Datos inválidos.', details: parsed.error.flatten() });
    }
    req.body = parsed.data;
    return next();
  };
}
