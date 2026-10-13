import { parsePhoneNumber } from 'react-phone-number-input';

import { parseCoordinates, readApiLate, readApiLong, toApiCoordinates } from 'src/sections/branches/geo-coordinates';
import { getDeviceId } from 'src/sections/auth/jwt/care-home-register-utils';
import { toApiUploadedFileName, resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

// ----------------------------------------------------------------------

function getFileName(file) {
  return toApiUploadedFileName(file, '');
}

function formatPhoneLabel(phone) {
  if (!phone) return '';
  if (typeof phone === 'string') return phone;
  if (typeof phone === 'object') {
    const code = phone.code || '';
    const number = phone.number || '';
    return `${code}${number}`.trim();
  }
  return '';
}

function parsePhoneForApi(phoneValue) {
  const parsed = parsePhoneNumber(phoneValue || '');

  if (parsed) {
    return {
      code: `+${parsed.countryCallingCode}`,
      number: parsed.nationalNumber,
    };
  }

  const digits = String(phoneValue || '').replace(/\D/g, '');
  return {
    code: '',
    number: digits,
  };
}

export function getProfileUserId(user) {
  return String(user?._id || user?.id || user?.basicInfo?._id || user?.basicInfo?.id || '').trim();
}

export function mapUserProfileFromApi(raw = {}) {
  const data = raw?.basicInfo || raw?.user || raw?.data || raw;
  const location =
    (data.location && typeof data.location === 'object' ? data.location : null) ||
    (raw.location && typeof raw.location === 'object' ? raw.location : null) ||
    {};

  const parsedCoords = parseCoordinates(location.coordinates) || { latitude: 0, longitude: 0 };
  const phone = data.phoneNumber || raw.phoneNumber;
  const id = String(data._id || data.id || raw._id || raw.id || '').trim();

  const name = data.name || data.displayName || raw.name || '';
  const email = data.email || raw.email || '';
  const profileIcon = data.profileIcon || data.photoURL || raw.profileIcon || null;
  const profileIconUrl = resolveProfileAssetUrl(profileIcon);

  const longitudeFromCoords = parsedCoords.longitude;
  const latitudeFromCoords = parsedCoords.latitude;
  const longitude = Number(readApiLong(location) ?? readApiLong(raw) ?? longitudeFromCoords) || 0;
  const latitude = Number(readApiLate(location) ?? readApiLate(raw) ?? latitudeFromCoords) || 0;

  return {
    id,
    _id: id,
    name,
    email,
    profileIcon,
    profileIconUrl,
    phoneNumber: phone,
    phoneLabel: formatPhoneLabel(phone),
    location,
    longitude,
    latitude,
    fullAddress: location.fullAddress || '',
    city: location.city || '',
    state: location.state || '',
    country: location.country || '',
    postalCode:
      location.postalCode != null && location.postalCode !== ''
        ? String(location.postalCode)
        : '',
    displayName: name,
    photoURL: profileIconUrl || profileIcon,
    address: location.fullAddress || '',
    zipCode:
      location.postalCode != null && location.postalCode !== ''
        ? String(location.postalCode)
        : '',
    about: raw.about || data.about || raw.bio || data.bio || '',
    bio: raw.bio || data.bio || raw.about || data.about || '',
    instructions: raw.instructions || raw.notes || data.instructions || '',
    images: Array.isArray(raw.images) ? raw.images : [],
    validationDocument: Array.isArray(raw.validationDocument) ? raw.validationDocument : [],
    raw,
  };
}

export function buildUpdateProfilePayload(data) {
  const countryValue =
    typeof data.country === 'object'
      ? data.country?.label || data.country?.code || ''
      : String(data.country || '').trim();

  const payload = {
    profileIcon: getFileName(data.photoURL) || getFileName(data.profileIcon) || 'default.png',
    name: String(data.displayName || data.name || '').trim(),
    location: {
      coordinates: toApiCoordinates(data.latitude, data.longitude),
      fullAddress: String(data.address || data.fullAddress || '').trim(),
      country: countryValue,
      city: String(data.city || '').trim(),
      state: String(data.state || '').trim(),
      postalCode: String(data.zipCode || data.postalCode || '').trim(),
    },
  };

  if (data.phoneNumber?.trim?.() || (typeof data.phoneNumber === 'string' && data.phoneNumber.trim())) {
    payload.phoneNumber = parsePhoneForApi(data.phoneNumber);
  }

  return payload;
}

export function buildLogoutPayload() {
  return { deviceId: getDeviceId() };
}
