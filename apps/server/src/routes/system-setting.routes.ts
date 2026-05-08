import { Router } from 'express';
import { Role } from '@prisma/client';
import { asyncHandler } from '../middleware/async.middleware.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { uploadSystemLogo } from '../middleware/system-logo-upload.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { updateSystemSettingSchema } from '../schemas/system-setting.schema.js';
import * as controller from '../controllers/system-setting.controller.js';

export const systemSettingRoutes = Router();

systemSettingRoutes.get('/', asyncHandler(controller.show));
systemSettingRoutes.get('/logo', asyncHandler(controller.logo));
systemSettingRoutes.patch('/', authenticate, requireRole(Role.ADMIN), validateBody(updateSystemSettingSchema), asyncHandler(controller.update));
systemSettingRoutes.post('/logo', authenticate, requireRole(Role.ADMIN), uploadSystemLogo.single('logo'), asyncHandler(controller.uploadLogo));
