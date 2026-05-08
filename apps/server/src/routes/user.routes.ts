import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import * as controller from '../controllers/user.controller.js';

export const userRoutes = Router();

userRoutes.use(authenticate, requireRole(Role.ADMIN));
userRoutes.get('/', controller.index);
