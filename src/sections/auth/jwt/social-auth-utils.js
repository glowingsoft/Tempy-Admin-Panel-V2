import { getDeviceType } from 'src/utils/getDeviceType';

import { getDeviceId } from './care-home-register-utils';
import { ROLE_TO_API_USER_TYPE } from './auth-api-utils';

// ----------------------------------------------------------------------

export const SOCIAL_AUTH_PROVIDERS = ['google', 'facebook', 'apple'];

export function splitFullName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}

export function mapGoogleProfile(userInfo = {}) {
  const { firstName, lastName } = userInfo.given_name
    ? {
        firstName: userInfo.given_name,
        lastName: userInfo.family_name || '',
      }
    : splitFullName(userInfo.name);

  return {
    socialId: userInfo.sub || userInfo.id || '',
    email: userInfo.email || '',
    firstName,
    lastName,
    name: userInfo.name || [firstName, lastName].filter(Boolean).join(' '),
    profileIcon: userInfo.picture || undefined,
  };
}

export function mapFacebookProfile(userInfo = {}) {
  const firstName = userInfo.first_name || '';
  const lastName = userInfo.last_name || '';

  return {
    socialId: userInfo.id || '',
    email: userInfo.email || '',
    firstName,
    lastName,
    name: userInfo.name || [firstName, lastName].filter(Boolean).join(' '),
    profileIcon: userInfo.picture?.data?.url || undefined,
  };
}

/** deviceType for social-auth: android | ios | web */
export function mapSocialDeviceType() {
  const type = getDeviceType();

  if (type === 'desktop') {
    return 'web';
  }

  if (type === 'mobile' || type === 'tablet') {
    return /Android/i.test(navigator.userAgent) ? 'android' : 'ios';
  }

  return 'web';
}

/**
 * Payload for POST /auth/social-auth
 * Body: provider, socialId, name, email, deviceType, userType, deviceId, timezone [, profileIcon]
 */
export function buildSocialAuthPayload({ provider, profile, role, userType }) {
  const resolvedUserType = userType || ROLE_TO_API_USER_TYPE[role] || '';

  const name =
    profile.name ||
    [profile.firstName, profile.lastName].filter(Boolean).join(' ') ||
    'User';

  const payload = {
    provider,
    socialId: profile.socialId,
    name,
    email: String(profile.email || '')
      .trim()
      .toLowerCase(),
    deviceType: mapSocialDeviceType(),
    deviceId: getDeviceId(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  if (resolvedUserType) {
    payload.userType = resolvedUserType;
  }

  if (profile.profileIcon) {
    payload.profileIcon = profile.profileIcon;
  }

  return payload;
}
