import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Role } from '@prisma/client';
import { env, adminEmails } from './env.js';
import { prisma } from './prisma.js';

const bootstrapAdminEmails = [...new Set([...adminEmails, 'suarez@badabun.com'])];

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(new Error('Google no devolvió un correo verificable.'));

        const name = profile.displayName || email.split('@')[0];
        const avatarUrl = profile.photos?.[0]?.value;
        const isBootstrapAdmin = bootstrapAdminEmails.includes(email);
        const role = isBootstrapAdmin ? Role.ADMIN : Role.USER;
        const lastLoginAt = new Date();

        const user = await prisma.user.upsert({
          where: { email },
          update: {
            googleId: profile.id,
            name,
            avatarUrl,
            ...(isBootstrapAdmin ? { role: Role.ADMIN } : {}),
            lastLoginAt,
            loginCount: { increment: 1 }
          },
          create: { email, googleId: profile.id, name, avatarUrl, role, lastLoginAt, loginCount: 1 }
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export { passport };
