import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { downloadFile } from '../controllers/file.controller.js';

export const fileRoutes = Router();

fileRoutes.get('/:id/download', authenticate, requireRole(Role.ADMIN), downloadFile);
