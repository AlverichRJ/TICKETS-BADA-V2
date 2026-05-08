import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Role } from '@prisma/client';
import { env, adminEmails } from './env.js';
import { prisma } from './prisma.js';

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
        const role = adminEmails.includes(email) ? Role.ADMIN : Role.USER;

        const user = await prisma.user.upsert({
          where: { email },
          update: { googleId: profile.id, name, avatarUrl, role },
          create: { email, googleId: profile.id, name, avatarUrl, role }
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export { passport };
