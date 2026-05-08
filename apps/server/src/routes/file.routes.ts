import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { downloadFile } from '../controllers/file.controller.js';

export const fileRoutes = Router();

fileRoutes.get('/:id/download', authenticate, downloadFile);
