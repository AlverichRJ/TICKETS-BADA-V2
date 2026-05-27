import { router } from '../_core/trpc.js';
import { authRouter } from './auth.js';
import { inventoryRouter } from './inventory.js';
import { ticketsRouter } from './tickets.js';
import { usersRouter } from './users.js';

export const appRouter = router({
  auth: authRouter,
  tickets: ticketsRouter,
  inventory: inventoryRouter,
  users: usersRouter
});

export type AppRouter = typeof appRouter;
