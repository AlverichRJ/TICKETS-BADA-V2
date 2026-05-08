import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createTicketSchema, updateTicketSchema } from '../schemas/ticket.schema.js';
import * as controller from '../controllers/ticket.controller.js';

export const ticketRoutes = Router();

ticketRoutes.use(authenticate);
ticketRoutes.get('/', controller.index);
ticketRoutes.post('/', validateBody(createTicketSchema), controller.create);
ticketRoutes.get('/:id', controller.show);
ticketRoutes.patch('/:id', requireRole(Role.ADMIN), validateBody(updateTicketSchema), controller.update);
