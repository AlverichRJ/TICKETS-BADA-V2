import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import { updateUserSchema } from '../schemas/user.schema.js';
import * as controller from '../controllers/user.controller.js';

export const userRoutes = Router();

userRoutes.use(authenticate, requireRole(Role.ADMIN));
userRoutes.get('/', asyncHandler(controller.index));
userRoutes.patch('/:id', validateBody(updateUserSchema), asyncHandler(controller.update));
