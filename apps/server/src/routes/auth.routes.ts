import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { googleCallback, logout, me } from '../controllers/auth.controller.js';
import { passport } from '../config/passport.js';

export const authRoutes = Router();

authRoutes.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
authRoutes.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/api/auth/failure' }), googleCallback);
authRoutes.get('/failure', (_req, res) => res.status(401).json({ ok: false, error: 'No fue posible autenticar con Google.' }));
authRoutes.get('/me', authenticate, me);
authRoutes.post('/logout', authenticate, logout);
