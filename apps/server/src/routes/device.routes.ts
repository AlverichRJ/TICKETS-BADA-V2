import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createDeviceSchema, updateDeviceSchema } from '../schemas/device.schema.js';
import { upload } from '../middleware/upload.middleware.js';
import * as deviceController from '../controllers/device.controller.js';
import * as fileController from '../controllers/file.controller.js';

export const deviceRoutes = Router();

deviceRoutes.use(authenticate);
deviceRoutes.get('/', deviceController.index);
deviceRoutes.post('/', requireRole(Role.ADMIN), validateBody(createDeviceSchema), deviceController.create);
deviceRoutes.patch('/:id', requireRole(Role.ADMIN), validateBody(updateDeviceSchema), deviceController.update);
deviceRoutes.post('/:deviceId/files', requireRole(Role.ADMIN), upload.single('file'), fileController.uploadDeviceFile);
