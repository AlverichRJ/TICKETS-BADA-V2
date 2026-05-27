import { protectedProcedure, router } from '../_core/trpc.js';
import { clearSessionCookie } from '../auth/session.js';

export const authRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.user),
  logout: protectedProcedure.mutation(({ ctx }) => {
    clearSessionCookie(ctx.res);
    return { ok: true };
  })
});
