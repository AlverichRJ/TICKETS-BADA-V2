import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createDeviceSchema, returnDeviceSchema, updateDeviceSchema } from '../schemas/device.schema.js';
import { upload } from '../middleware/upload.middleware.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import * as deviceController from '../controllers/device.controller.js';
import * as fileController from '../controllers/file.controller.js';

export const deviceRoutes = Router();

deviceRoutes.use(authenticate);
deviceRoutes.get('/', asyncHandler(deviceController.index));
deviceRoutes.get('/delivery-history', asyncHandler(deviceController.deliveredHistory));
deviceRoutes.post('/', requireRole(Role.ADMIN), validateBody(createDeviceSchema), asyncHandler(deviceController.create));
deviceRoutes.patch('/:id/return', requireRole(Role.ADMIN), validateBody(returnDeviceSchema), asyncHandler(deviceController.markReturned));
deviceRoutes.patch('/:id', requireRole(Role.ADMIN), validateBody(updateDeviceSchema), asyncHandler(deviceController.update));
deviceRoutes.post('/:deviceId/files', requireRole(Role.ADMIN), upload.single('file'), asyncHandler(fileController.uploadDeviceFile));
