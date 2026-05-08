import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../middleware/async.middleware.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../schemas/department.schema.js';
import * as controller from '../controllers/department.controller.js';

export const departmentRoutes = Router();

departmentRoutes.use(authenticate);
departmentRoutes.get('/', asyncHandler(controller.index));
departmentRoutes.post('/', requireRole(Role.ADMIN), validateBody(createDepartmentSchema), asyncHandler(controller.create));
departmentRoutes.patch('/:id', requireRole(Role.ADMIN), validateBody(updateDepartmentSchema), asyncHandler(controller.update));
