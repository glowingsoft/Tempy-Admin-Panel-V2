import { getStaffSpecialtyLabel } from 'src/_mock/_staff';
import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = value._id || value.id;
      if (nested) return String(nested);
      continue;
    }
    return String(value);
  }
  return '';
}

function pickText(...values) {
  for (const value of values) {
    if (value == null || typeof value === 'object') continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
}

function asList(value) {
  if (Array.isArray(value)) return value;
  if (value == null || value === '') return [];
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [value];
}

function collectSpecialties(...sources) {
  const values = [];

  sources.forEach((source) => {
    asList(source).forEach((entry) => {
      if (entry && typeof entry === 'object') {
        const text = pickText(entry.label, entry.name, entry.value, entry.speciality, entry.specialty);
        if (text) values.push(text);
        return;
      }

      const text = pickText(entry);
      if (text) values.push(text);
    });
  });

  return [...new Set(values)];
}

function formatAddress(value) {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value !== 'object') return '';

  return [value.address, value.line1, value.street, value.city, value.state, value.country, value.postalCode, value.postcode]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(', ');
}

export function extractStaffRequestsList(response) {
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.requests)) return raw.requests;
  if (Array.isArray(response)) return response;
  return [];
}

export function normalizeStaffRequestStatus(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (['accepted', 'accept', 'approved', 'active'].includes(raw)) return 'accepted';
  if (['rejected', 'reject', 'declined'].includes(raw)) return 'rejected';
  if (['pending', 'unread', 'new', 'requested'].includes(raw)) return 'pending';
  return raw || 'pending';
}

export function mapStaffRequestFromApi(item = {}) {
  const agency =
    item.agency && typeof item.agency === 'object'
      ? item.agency
      : item.employer && typeof item.employer === 'object'
        ? item.employer
        : item.homeCareCompany && typeof item.homeCareCompany === 'object'
          ? item.homeCareCompany
          : {};

  const id = pickId(item._id, item.id, item.requestId, item.staffRequestId);
  const status = normalizeStaffRequestStatus(item.status || item.state || item.action);
  const agencyName = pickText(
    agency.name,
    agency.companyName,
    item.agencyName,
    item.employerName,
    item.companyName,
    'Agency'
  );
  const specialties = collectSpecialties(
    item.speciality,
    item.specialty,
    item.specialities,
    agency.speciality,
    agency.specialty,
    agency.specialities
  );
  const specialtyLabel = specialties.map((value) => getStaffSpecialtyLabel(value)).filter(Boolean).join(', ');
  const email = pickText(agency.email, item.email, item.agencyEmail);
  const phone = pickText(agency.phone, agency.phoneNumber, agency.mobile, item.phone, item.phoneNumber);
  const companyName = pickText(agency.companyName, agency.businessName, item.companyName);
  const address = formatAddress(agency.address || agency.location || item.address || item.location);
  const profileIcon = [
    agency.profileIcon,
    agency.profileIconUrl,
    agency.avatar,
    agency.avatarUrl,
    item.profileIcon,
    item.avatarUrl,
  ].find((value) => value != null && value !== '');

  return {
    id,
    agencyId: pickId(agency._id, agency.id, item.agencyId),
    agencyName,
    email,
    phone,
    companyName: companyName && companyName !== agencyName ? companyName : '',
    address,
    avatarUrl: resolveProfileAssetUrl(profileIcon),
    specialty: specialtyLabel,
    specialtyLabel,
    ratePerHour: item.ratePerHour ?? item.rate ?? agency.ratePerHour ?? null,
    platformPercent: item.platformPercent ?? agency.platformPercent ?? null,
    status,
    canRespond: status === 'pending',
    canAccept: status === 'pending',
    createdAt: item.createdAt || item.created_at || item.date || '',
    message: pickText(
      item.message,
      item.note,
      item.description,
      `${agencyName} invited you to join their staff.`
    ),
  };
}

export function buildStaffRequestRespondPayload(action = 'accept') {
  const normalized = String(action || 'accept').trim().toLowerCase();
  return { action: normalized === 'reject' ? 'reject' : 'accept' };
}

export function buildStaffRequestAcceptPayload() {
  return buildStaffRequestRespondPayload('accept');
}
