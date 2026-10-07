import { getDeviceType } from 'src/utils/getDeviceType';

import { getDeviceId } from './care-home-register-utils';

// ----------------------------------------------------------------------

export const ROLE_TO_API_USER_TYPE = {
  admin: 'admin',
  hospital_nhs: 'hospital',
  local_authority: 'localAuthority',
  care_home: 'careHome',
  individual_home_care: 'user',
  agency: 'agency',
  home_care_company: 'homeCareCompany',
  staff_member: 'nurse',
};

export const API_USER_TYPE_PERMISSION = {
  admin: 1,
  careHome: 2,
  agency: 3,
  hospital: 4,
  localAuthority: 5,
  user: 6,
  homeCareCompany: 7,
  nurse: 8,
};

export const API_USER_TYPE_TO_ACCOUNT_TYPE = {
  admin: 'admin',
  hospital: 'hospital_nhs',
  localAuthority: 'local_authority',
  careHome: 'care_home',
  user: 'individual_home_care',
  agency: 'agency',
  homeCareCompany: 'home_care_company',
  nurse: 'staff_member',
};

// ----------------------------------------------------------------------

export function mapDeviceTypeForApi() {
  const type = getDeviceType();

  if (type === 'mobile' || type === 'tablet') {
    return /Android/i.test(navigator.userAgent) ? 'android' : 'ios';
  }

  // Desktop / browser admin & web dashboards
  return 'web';
}

/** Shared login body for POST /auth/login */
export function buildLoginPayload({ email, password, userType }) {
  const payload = {
    email: String(email || '')
      .trim()
      .toLowerCase(),
    password,
    deviceType: mapDeviceTypeForApi(),
    deviceId: getDeviceId(),
    // Browser IANA zone (e.g. Europe/London in UK) — not a fixed city
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  };

  if (userType) {
    payload.userType = userType;
  }

  return payload;
}

/** @deprecated Use buildLoginPayload */
export function buildCareHomeLoginPayload({ email, password }) {
  return buildLoginPayload({ email, password, userType: 'careHome' });
}

export function normalizeLoginResponse(response, { fallbackUserType = 'careHome' } = {}) {
  const data = response?.data ?? response;
  const token =
    data?.token ?? data?.accessToken ?? response?.token ?? response?.accessToken;

  const userType =
    data?.accountState?.userType ?? data?.userType ?? response?.userType ?? fallbackUserType;

  const accountType = API_USER_TYPE_TO_ACCOUNT_TYPE[userType];

  const permission =
    data?.permission ??
    API_USER_TYPE_PERMISSION[userType] ??
    API_USER_TYPE_PERMISSION[fallbackUserType];

  return {
    ...data,
    token,
    permission,
    accountState: {
      ...data?.accountState,
      userType,
      ...(accountType && { accountType }),
    },
  };
}

/**
 * POST /auth/check-email-exists → data.exists
 * Returns true | false | null (null = could not determine / soft-fail)
 */
export function parseEmailExistsResponse(response) {
  const data = response?.data ?? response;
  if (typeof data?.exists === 'boolean') return data.exists;
  if (typeof data?.data?.exists === 'boolean') return data.data.exists;
  if (typeof response?.exists === 'boolean') return response.exists;
  return null;
}
