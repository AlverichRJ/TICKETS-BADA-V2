import { z } from 'zod';
import { adminProcedure, protectedProcedure, router } from '../_core/trpc.js';
import { getAssignableUsers, listUsers, setUserActive, setUserRole } from '../services/users.js';

export const usersRouter = router({
  list: adminProcedure.query(() => listUsers()),
  assignable: protectedProcedure.query(() => getAssignableUsers()),
  setRole: adminProcedure.input(z.object({ userId: z.string(), role: z.enum(['admin', 'user']) })).mutation(({ input }) => setUserRole(input.userId, input.role)),
  setActive: adminProcedure.input(z.object({ userId: z.string(), isActive: z.boolean() })).mutation(({ input }) => setUserActive(input.userId, input.isActive))
});
