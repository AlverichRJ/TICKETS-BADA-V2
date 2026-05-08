import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sendOk } from '../utils/http.js';

function signSession(user: any) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, env.JWT_SECRET, { expiresIn: '8h' });
}

export function googleCallback(req: Request, res: Response) {
  const user = req.user as any;
  const token = signSession(user);
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000
  });
  return res.redirect(`${env.PUBLIC_APP_URL}/auth/callback`);
}

export function me(req: Request, res: Response) {
  return sendOk(res, req.authUser);
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(env.COOKIE_NAME);
  return sendOk(res, { loggedOut: true });
}
