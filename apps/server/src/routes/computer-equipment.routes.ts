import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import { createComputerEquipmentSchema } from '../schemas/computer-equipment.schema.js';
import * as computerEquipmentController from '../controllers/computer-equipment.controller.js';

export const computerEquipmentRoutes = Router();

computerEquipmentRoutes.use(authenticate);
computerEquipmentRoutes.get('/', asyncHandler(computerEquipmentController.index));
computerEquipmentRoutes.post(
  '/',
  requireRole(Role.ADMIN),
  validateBody(createComputerEquipmentSchema),
  asyncHandler(computerEquipmentController.create)
);
