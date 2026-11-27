import { parsePhoneNumber } from 'react-phone-number-input';

import { parseCoordinates, readApiLate, readApiLong, toApiCoordinates } from 'src/sections/branches/geo-coordinates';
import { extractAddressLine1 } from 'src/sections/branches/address-form-utils';
import { getDeviceId } from 'src/sections/auth/jwt/care-home-register-utils';
import { toApiUploadedFileName, resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';


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
  const raw = String(phoneValue || '').trim();
  const parsed = raw ? parsePhoneNumber(raw) || parsePhoneNumber(raw, 'GB') : null;

  if (parsed) {
    return {
      code: `+${parsed.countryCallingCode}`,
      number: parsed.nationalNumber,
    };
  }

  const digits = raw.replace(/\D/g, '');
  return {
    code: digits ? '+44' : '',
    number: digits.replace(/^0+/, '') || digits,
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

  const fullAddress = String(location.fullAddress || '').trim();
  const addressLine1 =
    String(location.addressLine1 || '').trim() ||
    extractAddressLine1(fullAddress) ||
    fullAddress;
  const addressLine2 = String(location.addressLine2 || '').trim();
  const postalCode =
    location.postalCode != null && location.postalCode !== ''
      ? String(location.postalCode)
      : '';

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
    fullAddress,
    addressLine1,
    addressLine2,
    city: location.city || '',
    state: location.state || '',
    country: location.country || '',
    postalCode,
    displayName: name,
    photoURL: profileIconUrl || profileIcon,
    address: addressLine1 || fullAddress,
    zipCode: postalCode,
    about: raw.about || data.about || raw.bio || data.bio || '',
    bio: raw.bio || data.bio || raw.about || data.about || '',
    paysBreaks: typeof raw.paysBreaks === 'boolean' ? raw.paysBreaks : data.paysBreaks,
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

  const addressLine1 = String(data.addressLine1 || data.address || '').trim();
  const addressLine2 = String(data.addressLine2 || '').trim();
  const city = String(data.city || '').trim();
  const state = String(data.state || '').trim();
  const postalCode = String(data.zipCode || data.postalCode || '').trim();
  const fullAddress =
    [addressLine1, addressLine2, city, state, postalCode, countryValue]
      .filter(Boolean)
      .join(', ') || String(data.fullAddress || '').trim();

  const payload = {
    profileIcon: getFileName(data.photoURL) || getFileName(data.profileIcon) || 'default.png',
    name: String(data.displayName || data.name || '').trim(),
    location: {
      coordinates: toApiCoordinates(data.latitude, data.longitude),
      fullAddress,
      addressLine1,
      addressLine2,
      country: countryValue,
      city,
      state,
      postalCode,
    },
  };

  if (data.phoneNumber?.trim?.() || (typeof data.phoneNumber === 'string' && data.phoneNumber.trim())) {
    payload.phoneNumber = parsePhoneForApi(data.phoneNumber);
  }

  if (typeof data.paysBreaks === 'boolean') {
    payload.paysBreaks = data.paysBreaks;
  }

  return payload;
}

export function buildLogoutPayload() {
  return { deviceId: getDeviceId() };
}
