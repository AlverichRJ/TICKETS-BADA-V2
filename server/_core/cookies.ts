import type { CookieOptions } from 'express';
import { env } from '../config.js';

export const sessionCookieName = 'tickets_session';

export function getSessionCookieOptions(): CookieOptions {
  const isHttps = env.publicAppUrl.startsWith('https://');
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7
  };
}
