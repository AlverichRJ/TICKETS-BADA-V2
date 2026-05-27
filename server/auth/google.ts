import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../config.js';
import { upsertGoogleUser } from '../services/users.js';

passport.use(new GoogleStrategy({
  clientID: env.googleClientId,
  clientSecret: env.googleClientSecret,
  callbackURL: env.googleCallbackUrl
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails?.[0]?.value;
    if (!email) return done(new Error('Google no devolvió correo electrónico.'));
    const user = await upsertGoogleUser({
      googleId: profile.id,
      email,
      name: profile.displayName || email,
      avatarUrl: profile.photos?.[0]?.value ?? null
    });
    return done(null, user as Express.User);
  } catch (error) {
    return done(error as Error);
  }
}));

export { passport };
