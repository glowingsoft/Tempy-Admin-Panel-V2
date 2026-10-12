import { CONFIG } from 'src/config-global';

import { normalizeLoginResponse, ROLE_TO_API_USER_TYPE } from './auth-api-utils';
import { signInWithGoogle } from './google-oauth-utils';
import { signInWithFacebook } from './facebook-oauth-utils';
import { buildSocialAuthPayload } from './social-auth-utils';

// ----------------------------------------------------------------------

export function buildExampleSocialProfile(provider, { email, contactName } = {}) {
  const nameParts = contactName?.trim().split(/\s+/).filter(Boolean) || [];

  return {
    socialId: `example-${provider}-social-id`,
    email: email || 'cwtest1@gmail.com',
    firstName: nameParts[0] || 'Ali',
    lastName: nameParts.slice(1).join(' ') || 'Imran',
    name: contactName || 'Ali Imran',
  };
}

export async function resolveSocialProfile(provider) {
  if (provider === 'google') {
    return signInWithGoogle({ clientId: CONFIG.google.clientId });
  }

  if (provider === 'facebook') {
    return signInWithFacebook({ appId: CONFIG.facebook.appId });
  }

  throw new Error(`Unsupported social provider: ${provider}`);
}

export function buildSocialAuthRequest({ provider, profile, role, userType, location, purpose }) {
  return buildSocialAuthPayload({ provider, profile, role, userType, location, purpose });
}

/**
 * Google OAuth → POST /auth/social-auth (signup if new, login if existing).
 * Returns { profile, user } where user is normalized with token when present.
 *
 * If the API fails after Google profile is resolved, error.socialProfile is set
 * so the UI can still prefill the signup form.
 */
export async function authenticateWithGoogleSocial({
  socialAuthMutation,
  role,
  userType,
  location,
  purpose,
}) {
  const profile = await resolveSocialProfile('google');

  if (!profile.email) {
    throw new Error('Google account email not found.');
  }

  const resolvedUserType = userType || ROLE_TO_API_USER_TYPE[role] || '';
  const payload = buildSocialAuthRequest({
    provider: 'google',
    profile,
    role,
    userType: resolvedUserType,
    location,
    purpose,
  });

  try {
    const response = await socialAuthMutation(payload).unwrap();
    const user = normalizeLoginResponse(response, {
      fallbackUserType: resolvedUserType || 'careHome',
    });

    return { profile, user, payload };
  } catch (error) {
    // RTK errors are frozen, so copy the profile onto a new error instead of mutating them.
    const enriched = new Error(typeof error === 'string' ? error : 'Social auth failed');
    enriched.socialProfile = profile;
    enriched.cause = error;
    throw enriched;
  }
}
