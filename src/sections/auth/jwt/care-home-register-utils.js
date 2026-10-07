import { parsePhoneNumber } from 'react-phone-number-input';
import dayjs from 'dayjs';

import { getDeviceType } from 'src/utils/getDeviceType';


export const CARE_HOME_API_TYPES = [
  'careHome',
  'admin',
  'employee',
  'agency',
  'hospital',
  'localAuthority',
  'nursingHome',
];

export const CARE_HOME_TYPE_OPTIONS = [
  { label: 'Residential Care Home', value: 'residentialCareHome' },
  { label: 'Nursing Home', value: 'nursingHome' },
  { label: 'Dementia Care Home', value: 'dementiaCareHome' },
  { label: 'Learning Disability Home', value: 'learningDisabilityHome' },
  { label: 'Mental Health Home', value: 'mentalHealthHome' },
];

/** Agency / home-care company business type — must match backend enum exactly. */
export const SUPPLIER_BUSINESS_TYPE_OPTIONS = [
  { label: 'Ltd', value: 'ltd' },
  { label: 'LLC', value: 'llc' },
  { label: 'Partnership', value: 'partnership' },
  { label: 'Sole Trader', value: 'soleTrader' },
];

const SUPPLIER_BUSINESS_TYPE_ALIASES = {
  ltd: 'ltd',
  llc: 'llc',
  partnership: 'partnership',
  soletrader: 'soleTrader',
  'sole trader': 'soleTrader',
};

export function resolveSupplierBusinessType(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const exact = SUPPLIER_BUSINESS_TYPE_OPTIONS.find((option) => option.value === raw);
  if (exact) return exact.value;

  const normalized = SUPPLIER_BUSINESS_TYPE_ALIASES[raw.toLowerCase()];
  return normalized || null;
}

export const SUPPORTED_CARE_HOME_API_TYPES = ['residentialCareHome'];

/** Home care company has no type picker — it always registers as a residential care home. */
export const HOME_CARE_COMPANY_API_TYPE = 'residentialCareHome';

const DEVICE_ID_KEY = 'tempy-device-id';

export function resolveCareHomeApiType(careHomeType) {
  const type = careHomeType?.trim();

  if (!type) return null;

  if (SUPPORTED_CARE_HOME_API_TYPES.includes(type)) {
    return type;
  }

  return null;
}

export function getCareHomeTypeError(careHomeType) {
  const option = CARE_HOME_TYPE_OPTIONS.find((item) => item.value === careHomeType);

  if (!option) {
    return 'Please select a care home type.';
  }

  return `"${option.label}" is not supported by the server yet. Please select Residential Care Home.`;
}

// ----------------------------------------------------------------------

function getFileName(file) {
  if (!file) return '';
  if (typeof file === 'string') return file;
  if (file instanceof File) return file.name;
  if (file?.name) return file.name;
  if (file?.path) return file.path;
  return '';
}

export function getDeviceId() {
  if (typeof window === 'undefined') return 'web-device';

  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

export function parsePhoneForApi(phoneValue) {
  const parsed = parsePhoneNumber(phoneValue || '');

  if (parsed) {
    return {
      code: `+${parsed.countryCallingCode}`,
      number: parsed.nationalNumber,
    };
  }

  const digits = (phoneValue || '').replace(/\D/g, '');

  return {
    code: '',
    number: digits,
  };
}

function formatDob(value) {
  if (!value) return undefined;

  const parsed = dayjs(value);

  if (parsed.isValid()) {
    return parsed.format('YYYY-MM-DD');
  }

  if (typeof value === 'string') {
    return value.slice(0, 10);
  }

  return undefined;
}

function buildLocation(data) {
  const location = {
    coordinates: [0, 0],
    fullAddress: data.address?.trim() || '',
  };

  if (data.city?.trim()) location.city = data.city.trim();
  if (data.country?.trim()) location.country = data.country.trim();
  if (data.postalCode?.trim()) location.postalCode = data.postalCode.trim();

  return location;
}

export function buildCareHomeRegisterPayload(data, { userType = 'careHome', socialAuth } = {}) {
  const phoneNumber = parsePhoneForApi(data.phoneNumber);
  const careHomeType = resolveCareHomeApiType(data.careHomeType);

  if (!careHomeType) {
    throw new Error(getCareHomeTypeError(data.careHomeType));
  }
  const validationDocument = (data.documents || []).map(getFileName).filter(Boolean);

  const payload = {
    name: data.contactName.trim(),
    email: data.email.trim().toLowerCase(),
    profileIcon: getFileName(data.companyLogo) || 'default.png',
    phoneNumber,
    password: data.password,
    deviceType: getDeviceType(),
    userType,
    deviceId: getDeviceId(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    companyName: data.companyName.trim(),
    type: careHomeType,
    registrationNumber: data.registrationNumber?.trim(),
    location: buildLocation(data),
  };

  if (validationDocument.length) payload.validationDocument = validationDocument;

  if (socialAuth?.provider) {
    payload.provider = socialAuth.provider;
    payload.socialId = socialAuth.socialId;
  }

  if (socialAuth?.profileIcon) {
    payload.profileIcon = socialAuth.profileIcon;
  }

  return payload;
}

export function buildIndividualHomeCareRegisterPayload(
  data,
  { userType = 'user', socialAuth } = {}
) {
  const phoneNumber = parsePhoneForApi(data.phoneNumber);
  const dob = formatDob(data.dob);
  const gender = data.gender?.trim();
  const taxNumber = data.taxNumber?.trim();
  const validationDocument = [
    ...(data.governmentId || []),
    ...(data.nursingDegree || []),
    ...(data.certifications || []),
  ]
    .map(getFileName)
    .filter(Boolean);

  const payload = {
    name: data.contactName.trim(),
    email: data.email.trim().toLowerCase(),
    profileIcon: getFileName(data.companyLogo) || 'default.png',
    phoneNumber,
    password: data.password,
    deviceType: getDeviceType(),
    userType,
    deviceId: getDeviceId(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: buildLocation(data),
  };

  if (dob) payload.dob = dob;
  if (gender) payload.gender = gender;
  if (taxNumber) payload.taxNumber = taxNumber;
  if (validationDocument.length) payload.validationDocument = validationDocument;

  if (socialAuth?.provider) {
    payload.provider = socialAuth.provider;
    payload.socialId = socialAuth.socialId;
  }

  if (socialAuth?.profileIcon) {
    payload.profileIcon = socialAuth.profileIcon;
  }

  return payload;
}

/** Individual staff member (nurse) registration — taxNumber is required by the API. */
export function buildNurseRegisterPayload(data, { userType = 'nurse', socialAuth } = {}) {
  const phoneNumber = parsePhoneForApi(data.phoneNumber);
  const dob = formatDob(data.dob);
  const gender = data.gender?.trim();
  const taxNumber = data.taxNumber?.trim();
  const validationDocument = [
    ...(data.governmentId || []),
    ...(data.nursingDegree || []),
    ...(data.certifications || []),
  ]
    .map(getFileName)
    .filter(Boolean);

  if (!taxNumber) {
    throw new Error('Tax number is required.');
  }

  const payload = {
    name: data.contactName.trim(),
    email: data.email.trim().toLowerCase(),
    profileIcon: getFileName(data.companyLogo) || 'default.png',
    phoneNumber,
    password: data.password,
    deviceType: getDeviceType(),
    userType,
    deviceId: getDeviceId(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: buildLocation(data),
    taxNumber,
  };

  if (dob) payload.dob = dob;
  if (gender) payload.gender = gender;
  if (validationDocument.length) payload.validationDocument = validationDocument;

  if (socialAuth?.provider) {
    payload.provider = socialAuth.provider;
    payload.socialId = socialAuth.socialId;
  }

  if (socialAuth?.profileIcon) {
    payload.profileIcon = socialAuth.profileIcon;
  }

  return payload;
}

export function buildSupplierRegisterPayload(data, { userType, socialAuth } = {}) {
  if (!userType) {
    throw new Error('A valid supplier role is required.');
  }

  const phoneNumber = parsePhoneForApi(data.phoneNumber);
  const registrationNumber = data.registrationNumber?.trim();
  const isAgency = userType === 'agency' || data.role === 'agency';
  const businessType = isAgency ? resolveSupplierBusinessType(data.businessType) : null;

  if (isAgency && !businessType) {
    throw new Error('A valid business type is required (ltd, llc, partnership, or soleTrader).');
  }

  if (!registrationNumber) {
    throw new Error('Registration number is required.');
  }

  const payload = {
    name: data.contactName.trim(),
    email: data.email.trim().toLowerCase(),
    profileIcon: getFileName(data.companyLogo) || 'default.png',
    phoneNumber,
    password: data.password,
    deviceType: getDeviceType(),
    userType,
    deviceId: getDeviceId(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    companyName: data.companyName.trim(),
    registrationNumber,
    location: buildLocation(data),
  };

  payload.type = businessType || HOME_CARE_COMPANY_API_TYPE;

  if (socialAuth?.provider) {
    payload.provider = socialAuth.provider;
    payload.socialId = socialAuth.socialId;
  }

  if (socialAuth?.profileIcon) {
    payload.profileIcon = socialAuth.profileIcon;
  }

  return payload;
}
