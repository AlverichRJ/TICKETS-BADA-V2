import { initTRPC, TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { getUserById } from '../services/users.js';
import { verifySession } from '../auth/session.js';
import { sessionCookieName } from './cookies.js';

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const session = verifySession(req.cookies?.[sessionCookieName]);
  const user = session ? await getUserById(session.sub) : null;
  return { req, res, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.user.isActive) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Sesión requerida.' });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Permiso de administrador requerido.' });
  }
  return next({ ctx });
});
