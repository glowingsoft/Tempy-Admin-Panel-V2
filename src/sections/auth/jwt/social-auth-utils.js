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

function hasSocialLocation(data) {
  if (!data || typeof data !== 'object') return false;

  const address = String(data.address || data.fullAddress || '').trim();
  const city = String(data.city || '').trim();
  const country = String(data.country || '').trim();
  const postalCode = String(data.postalCode || '').trim();
  const coordinates = Array.isArray(data.coordinates) ? data.coordinates : [];
  const hasCoordinates = coordinates.length === 2 && coordinates.some((value) => Number(value));

  return Boolean(address || city || country || postalCode || hasCoordinates);
}

/** Same location shape as email registration. Blank [0, 0] is omitted so login does not overwrite a saved address. */
export function buildSocialAuthLocation(data = {}) {
  const coordinates =
    Array.isArray(data.coordinates) && data.coordinates.length === 2
      ? data.coordinates.map((value) => Number(value) || 0)
      : [0, 0];

  const location = {
    type: 'Point',
    coordinates,
    fullAddress: String(data.address || data.fullAddress || '').trim(),
  };

  const city = String(data.city || '').trim();
  const country = String(data.country || '').trim();
  const postalCode = String(data.postalCode || '').trim();

  if (city) location.city = city;
  if (country) location.country = country;
  if (postalCode) location.postalCode = postalCode;

  return location;
}

/**
 * Payload for POST /auth/social-auth
 * Body: provider, socialId, name, email, deviceType, userType, location, deviceId, timezone [, profileIcon]
 */
export function buildSocialAuthPayload({ provider, profile, role, userType, location, purpose }) {
  const resolvedUserType = userType || ROLE_TO_API_USER_TYPE[role] || '';
  const isLogin = purpose === 'login';

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

  // Login must not send another account's userType or a blank map point.
  // Old Google accounts 500 when those fields are applied on top of their saved record.
  if (!isLogin && resolvedUserType) {
    payload.userType = resolvedUserType;
  }

  if (!isLogin && hasSocialLocation(location)) {
    payload.location = buildSocialAuthLocation(location);
  }

  if (!isLogin && profile.profileIcon) {
    payload.profileIcon = profile.profileIcon;
  }

  return payload;
}
