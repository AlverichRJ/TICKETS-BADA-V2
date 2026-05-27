import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config.js';
import { getSessionCookieOptions, sessionCookieName } from '../_core/cookies.js';

export type SessionPayload = {
  sub: string;
  email: string;
  role: 'admin' | 'user';
};

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, env.sessionSecret, { expiresIn: '7d' });
}

export function verifySession(token?: string): SessionPayload | null {
  if (!token) return null;
  try {
    return jwt.verify(token, env.sessionSecret) as SessionPayload;
  } catch {
    return null;
  }
}

export function setSessionCookie(res: Response, payload: SessionPayload): void {
  res.cookie(sessionCookieName, signSession(payload), getSessionCookieOptions());
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(sessionCookieName, { path: '/' });
}
