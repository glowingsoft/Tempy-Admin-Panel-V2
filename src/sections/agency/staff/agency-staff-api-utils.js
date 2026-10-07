import dayjs from 'dayjs';
import { parsePhoneNumber } from 'react-phone-number-input';

import { toApiUploadedFileName } from 'src/store/Reducer/upload-api';
import { isValidLngLat, parseCoordinates, toApiCoordinates } from 'src/sections/branches/geo-coordinates';
import { deriveCityFromLabel } from 'src/sections/tempy-home/standalone-address-input';

function getFileName(file) {
  return toApiUploadedFileName(file, '');
}

function normalizeSpecialities(...values) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => String(value || '').trim())
    .filter((value, index, list) => value && list.indexOf(value) === index);
}

function formatDob(value) {
  if (!value) return undefined;

  const parsed = dayjs(value);
  if (parsed.isValid()) return parsed.format('YYYY-MM-DD');
  if (typeof value === 'string') return value.slice(0, 10);

  return undefined;
}

function buildAgencyStaffLocation(data) {
  const lng = Number(data.longitude);
  const lat = Number(data.latitude);
  const location = {
    fullAddress: String(data.fullAddress || data.location || '').trim(),
  };

  if (isValidLngLat(lng, lat) && !(lng === 0 && lat === 0)) {
    location.coordinates = toApiCoordinates(lat, lng);
  }

  const city = String(data.city || '').trim() || deriveCityFromLabel(data.locationSearch || data.location || data.fullAddress || '');
  if (city) location.city = city;
  if (data.country?.trim()) location.country = data.country.trim();
  if (data.state?.trim()) location.state = data.state.trim();
  if (data.postalCode != null && String(data.postalCode).trim()) {
    location.postalCode = String(data.postalCode).trim();
  }

  return location;
}

/** True when form has a resolved map point from the location picker / geocode. */
export function staffFormHasValidCoordinates(data = {}) {
  const lng = Number(data.longitude);
  const lat = Number(data.latitude);
  return isValidLngLat(lng, lat) && !(lng === 0 && lat === 0);
}

function pickTaxNumber(...candidates) {
  for (const value of candidates) {
    if (value == null || value === '') continue;
    return String(value).trim();
  }
  return '';
}

/** Keep tax number as string so NI / alphanumeric values are not lost. */
function resolveTaxNumber(value) {
  const raw = String(value ?? '').trim();
  return raw || undefined;
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

function formatLocationLabel(location) {
  if (!location) return '';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    return location.fullAddress || [location.city, location.state, location.country].filter(Boolean).join(', ') || location.title || '';
  }
  return '';
}

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(String(value || '')) || String(value || '').startsWith('blob:');
}

function isImageFileName(value) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(value || ''));
}

function resolveMediaUrl(value) {
  if (!value) return '';

  if (typeof value === 'object') {
    return resolveMediaUrl(value.fileUrl || value.url || value.preview || value.file || '');
  }

  const raw = String(value || '').trim();
  if (!raw || raw === 'default.png') return '';
  if (isLikelyUrl(raw) || raw.startsWith('/') || raw.startsWith('blob:')) return raw;

  const assetBase = String(import.meta.env.VITE_ASSET_URL || import.meta.env.VITE_BASE_URL || '').replace(/\/$/, '');
  if (!assetBase) return raw;

  return `${assetBase}/${raw.replace(/^\//, '')}`;
}

function resolveProfileIconUrl(...candidates) {
  for (const value of candidates) {
    const url = resolveMediaUrl(value);
    if (url) return url;
  }
  return '';
}

/** Normalize API/doc values → `{ name, preview, url }[]` for UI. */
export function normalizeDocumentList(files = []) {
  const list = Array.isArray(files) ? files : files ? [files] : [];

  return list
    .map((file, index) => {
      if (!file) return null;

      if (typeof file === 'string') {
        const name = file.split('/').pop() || file;
        const url = resolveMediaUrl(file);
        const preview = isLikelyUrl(url) && isImageFileName(name) ? url : '';
        return { name, preview, url };
      }

      if (file instanceof File) {
        const preview = URL.createObjectURL(file);
        return { name: file.name, preview, url: preview };
      }

      if (typeof file === 'object') {
        const name = file.name || file.fileName || file.originalName || (typeof file.url === 'string' ? file.url.split('/').pop() : '') || `document-${index + 1}`;
        const url = resolveMediaUrl(file.url || file.path || file.preview || name);
        const preview = file.preview && !String(file.preview).startsWith('blob:') ? resolveMediaUrl(file.preview) : isLikelyUrl(url) && isImageFileName(url || name) ? url : '';
        return { name, preview, url: isLikelyUrl(url) || url.startsWith('/') ? url : preview || '' };
      }

      return null;
    })
    .filter(Boolean);
}

/**
 * Map API document fields → UI `documents` shape.
 * Create body uses: governmentIdentity / degree / certification
 */
export function mapAgencyStaffDocuments(item = {}, staff = {}) {
  const nestedDocs = item.documents || staff.documents || {};

  return {
    governmentId: normalizeDocumentList(item.governmentIdentity || staff.governmentIdentity || nestedDocs.governmentId || nestedDocs.governmentIdentity || []),
    nursingDegree: normalizeDocumentList(item.degree || staff.degree || nestedDocs.nursingDegree || nestedDocs.degree || []),
    certifications: normalizeDocumentList(
      item.certification || item.certifications || staff.certification || staff.certifications || nestedDocs.certifications || nestedDocs.certification || []
    ),
  };
}

function buildDocumentPayloadFields(data) {
  const governmentIdentity = (data.governmentId || []).map(getFileName).filter(Boolean);
  const degree = (data.nursingDegree || []).map(getFileName).filter(Boolean);
  const certification = (data.certifications || []).map(getFileName).filter(Boolean);

  return {
    ...(governmentIdentity.length ? { governmentIdentity } : {}),
    ...(degree.length ? { degree } : {}),
    ...(certification.length ? { certification } : {}),
  };
}

/** Build UI documents object from Add/Edit form values (keeps local previews). */
export function buildDocumentsFromFormData(data = {}) {
  return {
    governmentId: normalizeDocumentList(data.governmentId),
    nursingDegree: normalizeDocumentList(data.nursingDegree),
    certifications: normalizeDocumentList(data.certifications),
  };
}

export function extractAgencyStaffIdFromResponse(response) {
  const raw = response?.data || response || {};
  // Prefer agency-staff membership id; do not fall back to nested nurse id here.
  return String(raw._id || raw.id || raw.agencyStaffId || '');
}

function pickMongoId(...candidates) {
  for (const value of candidates) {
    if (value == null || value === '') continue;
    if (typeof value === 'string' || typeof value === 'number') {
      const id = String(value).trim();
      if (id && id !== '[object Object]') return id;
      continue;
    }
    if (typeof value === 'object') {
      const nested = pickMongoId(value._id, value.id, value.$oid);
      if (nested) return nested;
    }
  }
  return '';
}

function normalizeStaffRef(staffField) {
  if (!staffField) return {};
  if (typeof staffField === 'string' || typeof staffField === 'number') {
    const id = String(staffField);
    return { _id: id, id };
  }
  if (typeof staffField === 'object') return staffField;
  return {};
}

/**
 * Accepts flexible phone formats for agency staff:
 * - 03004785384
 * - +923004785384
 * - 923004785384
 * - 3004785384
 */
export function parseFlexiblePhoneForApi(phoneValue) {
  const raw = String(phoneValue || '').trim();
  if (!raw) return { code: '', number: '' };

  const digits = raw.replace(/\D/g, '');

  // Local PK: 03XXXXXXXXX
  if (/^0\d{10}$/.test(digits)) {
    return { code: '+92', number: digits.slice(1) };
  }

  // 92XXXXXXXXXX without +
  if (/^92\d{10}$/.test(digits)) {
    return { code: '+92', number: digits.slice(2) };
  }

  // 3XXXXXXXXX (10 digits, common PK mobile without 0)
  if (/^3\d{9}$/.test(digits)) {
    return { code: '+92', number: digits };
  }

  const candidates = [raw.startsWith('+') ? raw : null, digits ? `+${digits}` : null].filter(Boolean);

  for (const candidate of candidates) {
    const parsed = parsePhoneNumber(candidate);
    if (parsed) {
      return {
        code: `+${parsed.countryCallingCode}`,
        number: parsed.nationalNumber,
      };
    }
  }

  if (digits.length >= 10) {
    return { code: '+92', number: digits.replace(/^0+/, '') || digits };
  }

  return { code: '', number: digits };
}

export function isValidFlexiblePhone(phoneValue) {
  const parsed = parseFlexiblePhoneForApi(phoneValue);
  return Boolean(parsed.code && parsed.number && String(parsed.number).replace(/\D/g, '').length >= 10);
}

export function extractAgencyNursesList(response) {
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.nurses)) return raw.nurses;
  if (Array.isArray(raw?.users)) return raw.users;
  if (Array.isArray(response)) return response;
  if (raw && typeof raw === 'object' && (raw._id || raw.id || raw.email)) return [raw];
  return [];
}

export function isNurseAccountUserType(userType) {
  const raw = String(userType || '')
    .trim()
    .toLowerCase();
  if (!raw) return true;
  return ['nurse', 'staff_member', 'staff', 'worker'].includes(raw);
}

/** Map GET `/web/agency/staff/nurses` item → autocomplete option.
 * POST `/web/agency/staff` needs the nurse *user* id in `staff` — not a wrapper/membership id.
 */
export function mapAgencyNurseFromApi(item = {}) {
  const nested = normalizeStaffRef(item.staff || item.user || item.nurse || item.worker);
  const source = item.name || item.email ? item : { ...nested, ...item };
  const locationSource = source.location || nested.location || item.location;
  const phone = formatPhoneLabel(source.phoneNumber || source.phone || nested.phoneNumber || nested.phone || item.phoneNumber);
  const location = formatLocationLabel(locationSource);
  const coords = Array.isArray(locationSource?.coordinates) ? locationSource.coordinates : [0, 0];
  const userType = String(
    nested.accountState?.userType || source.accountState?.userType || item.accountState?.userType || nested.userType || source.userType || item.userType || ''
  ).toLowerCase();

  const looksLikeUserDoc = Boolean(item.email || item.accountState?.userType);
  const id = looksLikeUserDoc
    ? pickMongoId(item._id, item.id, item.userId, nested._id, nested.id)
    : pickMongoId(item.userId, item.staffId, item.nurseId, item.workerId, nested._id, nested.id, item._id, item.id);

  return {
    id,
    _id: id,
    name: source.name || nested.name || item.name || '',
    email: source.email || nested.email || item.email || '',
    phone,
    gender: source.gender || nested.gender || '',
    location,
    city: locationSource?.city || '',
    state: locationSource?.state || '',
    country: locationSource?.country || '',
    postalCode: locationSource?.postalCode != null ? String(locationSource.postalCode) : '',
    longitude: parseCoordinates(coords)?.longitude || 0,
    latitude: parseCoordinates(coords)?.latitude || 0,
    taxNumber: source.taxNumber != null && source.taxNumber !== '' ? String(source.taxNumber) : nested.taxNumber != null && nested.taxNumber !== '' ? String(nested.taxNumber) : '',
    specialities: normalizeSpecialities(
      source.specialities,
      source.specialties,
      source.speciality,
      source.specialty,
      nested.specialities,
      nested.specialties,
      nested.speciality,
      nested.specialty,
      'generalNurse'
    ),
    ratePerHour: Number(source.ratePerHour ?? nested.ratePerHour ?? 12) || 12,
    platformPercent: Number(source.platformPercent ?? nested.platformPercent ?? 10) || 10,
    avatarUrl: resolveProfileIconUrl(source.profileIcon, source.avatarUrl, nested.profileIcon),
    status: source.accountState?.status || nested.accountState?.status || source.status || 'pending',
    userType: userType || 'nurse',
    dob: source.dob || nested.dob || '',
    documents: mapAgencyStaffDocuments(source, nested),
  };
}

/** Map GET `/web/agency/staff` list item → UI row / edit form.
 * Edit/PUT uses document `_id` (agency-staff membership id).
 * Nested `staff._id` is the linked nurse user id (not used for PUT).
 */
export function mapAgencyStaffFromApi(item = {}) {
  const staff = normalizeStaffRef(item.staff);
  // List document `_id` — PUT/DELETE `/web/agency/staff/:id`
  const membershipId = pickMongoId(item._id, item.id, item.agencyStaffId);
  // Linked nurse profile id (nested staff)
  const nurseId = pickMongoId(staff._id, staff.id, typeof item.staff === 'string' ? item.staff : '', item.staffId, item.nurseId, item.workerId, item.worker);
  const id = membershipId || nurseId;

  const phone = formatPhoneLabel(item.phoneNumber || staff.phoneNumber || staff.phone);
  const status = String(item.status || staff.accountState?.status || 'pending').toLowerCase();
  const normalizedStatus = status === 'accept' || status === 'approved' || status === 'accepted' ? 'active' : status;
  const specialities = normalizeSpecialities(
    item.specialities,
    item.specialties,
    item.speciality,
    item.specialty,
    staff.specialities,
    staff.specialties,
    staff.speciality,
    staff.specialty,
    'generalNurse'
  );
  const createdAt = item.createdAt || '';
  const addedOn = typeof createdAt === 'string' && createdAt.length >= 10 ? createdAt.slice(0, 10) : formatDob(createdAt) || '—';

  const branch = item.branch || staff.branch || null;
  const branchId =
    pickMongoId(
      typeof branch === 'object' ? branch?._id : branch,
      typeof branch === 'object' ? branch?.id : '',
      typeof branch === 'object' ? branch?.branchId : '',
      item.branchId,
      staff.branchId
    ) || '';

  const branchLocation = typeof branch === 'object' && branch?.location && typeof branch.location === 'object' ? branch.location : null;

  const branchLocationLabel =
    branchLocation?.fullAddress || [branchLocation?.city, branchLocation?.state, branchLocation?.country].filter(Boolean).join(', ') || branchLocation?.name || '';

  const branchName = (typeof branch === 'object' && (branch?.name || branch?.branchName)) || item.branchName || staff.branchName || '';

  // Staff personal address only — never fall back to branch.location (that is the site, e.g. Lahore).
  const locationSource =
    (item.location && typeof item.location === 'object' ? item.location : null) ||
    (staff.location && typeof staff.location === 'object' ? staff.location : null) ||
    (typeof item.location === 'string' ? { fullAddress: item.location } : null) ||
    (typeof staff.location === 'string' ? { fullAddress: staff.location } : null) ||
    (item.address && typeof item.address === 'object' ? item.address : null) ||
    (staff.address && typeof staff.address === 'object' ? staff.address : null) ||
    null;
  const location = formatLocationLabel(locationSource);
  const coords = Array.isArray(locationSource?.coordinates) ? locationSource.coordinates : [0, 0];

  return {
    id,
    _id: id,
    membershipId: membershipId || id,
    staffId: nurseId || '',
    name: item.name || staff.name || '',
    email: item.email || staff.email || '',
    phone,
    phoneNumber: item.phoneNumber || staff.phoneNumber || null,
    gender: item.gender || staff.gender || '',
    dob: item.dob || staff.dob || '',
    specialities,
    specialty: specialities[0] || 'generalNurse',
    ratePerHour: Number(item.ratePerHour ?? 0) || 0,
    platformPercent: Number(item.platformPercent ?? 10) || 10,
    status: normalizedStatus,
    addedOn,
    createdAt,
    avatarUrl: resolveProfileIconUrl(staff.profileIcon, item.profileIcon, item.avatarUrl),
    rating: Number(staff.averageRating ?? item.averageRating ?? 0) || 0,
    reviewCount: Number(staff.totalReviews ?? item.totalReviews ?? 0) || 0,
    isFavorite: Boolean(item.isFavorite),
    bookingCount: Number(item.workStats?.totalBookings ?? 0) || 0,
    totalHoursWorked: Number(item.workStats?.totalHoursWorked ?? 0) || 0,
    hoursAllowed: Number(item.workStats?.hoursAllowed ?? 0) || 0,
    weeklyHours: Number(staff.weeklyHours ?? 0) || 0,
    verificationStatus: staff.verificationStatus || null,
    userType: staff.accountState?.userType || 'nurse',
    documents: mapAgencyStaffDocuments(item, staff),
    location,
    city: (typeof locationSource === 'object' && locationSource?.city) || item.city || staff.city || '',
    state: (typeof locationSource === 'object' && locationSource?.state) || item.state || staff.state || '',
    country: (typeof locationSource === 'object' && locationSource?.country) || item.country || staff.country || '',
    postalCode:
      (typeof locationSource === 'object' && locationSource?.postalCode != null ? String(locationSource.postalCode) : '') ||
      (item.postalCode != null ? String(item.postalCode) : '') ||
      '',
    longitude: parseCoordinates(coords)?.longitude || 0,
    latitude: parseCoordinates(coords)?.latitude || 0,
    taxNumber: pickTaxNumber(
      item.taxNumber,
      staff.taxNumber,
      item.staff?.taxNumber,
      item.user?.taxNumber,
      staff.user?.taxNumber,
      item.nationalInsurance,
      staff.nationalInsurance,
      item.niNumber,
      staff.niNumber,
      item.tax_number,
      staff.tax_number
    ),
    joinedOn: addedOn,
    branch: String(branchId || ''),
    branchName: branchName ? (branchLocationLabel ? `${branchName} — ${branchLocationLabel}` : branchName) : branchLocationLabel || '',
  };
}

/** Build POST `/web/agency/staff` body from form values. */
export function buildAgencyStaffPayload(data, { existingStaffId } = {}) {
  const branch = String(data.branch || data.branchId || '').trim();

  const common = {
    speciality: normalizeSpecialities(data.specialties, data.speciality, data.specialty, 'generalNurse'),
    ratePerHour: Number(data.ratePerHour) || 0,
    platformPercent: Number(data.platformPercent) || 10,
    status: 'pending',
    ...(branch ? { branch } : {}),
  };

  if (existingStaffId) {
    return {
      staff: String(existingStaffId),
      ...common,
      ...buildDocumentPayloadFields(data),
    };
  }

  const payload = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    profileIcon: getFileName(data.avatarUrl) || 'default.png',
    phoneNumber: parseFlexiblePhoneForApi(data.phoneNumber),
    password: data.password,
    userType: 'nurse',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    taxNumber: resolveTaxNumber(data.taxNumber),
    governmentIdentity: (data.governmentId || []).map(getFileName).filter(Boolean),
    degree: (data.nursingDegree || []).map(getFileName).filter(Boolean),
    certification: (data.certifications || []).map(getFileName).filter(Boolean),
    location: buildAgencyStaffLocation(data),
    dob: formatDob(data.dob) || '',
    gender: data.gender?.trim() || '',
    ...common,
  };

  return payload;
}

/** Normalize UI status → API status (lowercase enum). */
export function resolveAgencyStaffStatusForApi(status) {
  const raw = String(status || 'pending')
    .trim()
    .toLowerCase();
  if (raw === 'active' || raw === 'inactive' || raw === 'pending' || raw === 'deleted' || raw === 'left') {
    return raw;
  }
  if (raw === 'accepted' || raw === 'accept' || raw === 'approved') return 'active';
  return 'pending';
}

/** Build PUT `/web/agency/staff/:id` body from form values. */
export function buildAgencyStaffUpdatePayload(data) {
  const payload = {
    // API requires `speciality` on update
    speciality: normalizeSpecialities(data.specialties, data.speciality, data.specialty, 'generalNurse'),
    ratePerHour: Number(data.ratePerHour) || 0,
    platformPercent: Number(data.platformPercent) || 0,
    // Backend mongoose enum: pending | inactive | active | deleted | left
    status: resolveAgencyStaffStatusForApi(data.status),
  };

  const branch = String(data.branch || data.branchId || '').trim();
  if (branch) payload.branch = branch;

  if (data.name?.trim()) payload.name = data.name.trim();

  if (data.phoneNumber?.trim()) {
    payload.phoneNumber = parseFlexiblePhoneForApi(data.phoneNumber);
  }

  const dob = formatDob(data.dob);
  if (dob) payload.dob = dob;

  if (data.gender?.trim()) payload.gender = data.gender.trim();

  // Same shape as create — only `location` (do not send `address`; backend may treat it as an id).
  const location = buildAgencyStaffLocation(data);
  if (location.fullAddress) {
    payload.location = location;
  }

  const taxNumber = resolveTaxNumber(data.taxNumber);
  if (taxNumber) payload.taxNumber = taxNumber;

  const profileIcon = getFileName(data.avatarUrl);
  if (profileIcon) payload.profileIcon = profileIcon;

  Object.assign(payload, buildDocumentPayloadFields(data));

  return payload;
}

function mapBookingToJobCard(booking = {}, index = 0, prefix = 'job') {
  const location =
    typeof booking.location === 'string' ? booking.location : booking.location?.fullAddress || booking.address?.fullAddress || booking.address || booking.branch?.name || '—';

  return {
    id: String(booking._id || booking.id || `${prefix}-${index}`),
    serviceType: booking.serviceType || booking.title || booking.jobTitle || booking.name || 'Booking',
    location,
    schedule: booking.schedule || booking.shift || booking.date || booking.timing || '',
    totalPay: Number(booking.totalPay ?? booking.amount ?? booking.pay ?? 0) || 0,
    hourlyRate: Number(booking.hourlyRate ?? booking.ratePerHour ?? 0) || 0,
  };
}

/**
 * Map GET `/web/agency/staff/:id` detail payload → Staff details modal shape.
 * Response shape (backend):
 * { basicInfo, documentation, staffDetails, address, reviews, bookings, stats }
 */
export function mapAgencyStaffDetailFromApi(raw = {}, staffId = '') {
  const data = raw?.basicInfo || raw?.staffDetails ? raw : raw?.data || raw;
  const basic = data.basicInfo || {};
  const docs = data.documentation || {};
  const details = data.staffDetails || {};
  const stats = data.stats || {};
  const accountState = basic.acountState || basic.accountState || {};

  const phone = formatPhoneLabel(basic.phoneNumber || basic.phone);
  const joinedAt = details.joinedAt || details.createdAt || '';
  const joinedOn = typeof joinedAt === 'string' && joinedAt.length >= 10 ? joinedAt.slice(0, 10) : formatDob(joinedAt) || '—';

  const documents = {
    governmentId: normalizeDocumentList(docs.governmentIdentity || []),
    nursingDegree: normalizeDocumentList(docs.degree || []),
    certifications: normalizeDocumentList(docs.certification || docs.certifications || []),
  };

  const reviews = (Array.isArray(data.reviews) ? data.reviews : []).map((review, index) => {
    const mapped = {
      id: String(review._id || review.id || `review-${index}`),
      name: review.name || review.userName || review.reviewerName || review.user?.name || 'Reviewer',
      avatarUrl: review.avatarUrl || review.profileIcon || review.user?.profileIcon || null,
      postedAt:
        (typeof review.postedAt === 'string' && review.postedAt.slice(0, 10)) || (typeof review.createdAt === 'string' && review.createdAt.slice(0, 10)) || review.postedAt || '',
      comment: review.comment || review.review || review.message || '',
      rating: Number(review.rating ?? 0) || 0,
      reviewerId: String(review.user?._id || review.user?.id || review.userId || review.createdBy || ''),
      reviewType: String(review.reviewType || 'user').toLowerCase(),
      objectId: String(review.objectId || ''),
    };
    return mapped;
  });

  const bookings = data.bookings || {};
  const activeJobs = [...(Array.isArray(bookings.pending) ? bookings.pending : []), ...(Array.isArray(bookings.inProgress) ? bookings.inProgress : [])].map((booking, index) =>
    mapBookingToJobCard(booking, index, 'active')
  );

  const completedJobs = (Array.isArray(bookings.completed) ? bookings.completed : []).map((booking, index) => mapBookingToJobCard(booking, index, 'completed'));

  const addressList = Array.isArray(data.address) ? data.address : [];
  const primaryAddress = addressList[0] || null;
  const locationSource = primaryAddress || basic.location || details.location || data.location || null;
  const location = formatLocationLabel(locationSource);
  const coords = Array.isArray(locationSource?.coordinates) ? locationSource.coordinates : [0, 0];
  const branchName = primaryAddress?.name || primaryAddress?.branchName || primaryAddress?.fullAddress || (typeof primaryAddress === 'string' ? primaryAddress : '') || '';

  const id = String(staffId || basic._id || details._id || data._id || '');

  return {
    id,
    _id: id,
    membershipId: id,
    staffId: String(basic._id || details.staffId || ''),
    name: basic.name || '',
    email: basic.email || '',
    phone,
    phoneNumber: basic.phoneNumber || null,
    gender: basic.gender || '',
    dob: basic.dob || details.dob || '',
    taxNumber: pickTaxNumber(basic.taxNumber, details.taxNumber, data.taxNumber, basic.nationalInsurance, basic.niNumber),
    location,
    city: (typeof locationSource === 'object' && locationSource?.city) || '',
    state: (typeof locationSource === 'object' && locationSource?.state) || '',
    country: (typeof locationSource === 'object' && locationSource?.country) || '',
    postalCode: typeof locationSource === 'object' && locationSource?.postalCode != null ? String(locationSource.postalCode) : '',
    longitude: parseCoordinates(coords)?.longitude || 0,
    latitude: parseCoordinates(coords)?.latitude || 0,
    avatarUrl: resolveProfileIconUrl(basic.profileIcon, details.profileIcon, data.profileIcon),
    isFavorite: Boolean(basic.isFavorite),
    specialty: details.speciality || details.specialty || 'generalNurse',
    ratePerHour: Number(details.ratePerHour ?? 0) || 0,
    platformPercent: Number(details.platformPercent ?? 10) || 10,
    status: String(details.status || accountState.status || 'pending').toLowerCase(),
    joinedOn,
    addedOn: joinedOn,
    userType: accountState.userType || 'nurse',
    documents,
    reviews,
    jobs: {
      active: activeJobs,
      completed: completedJobs,
    },
    metrics: {
      monthEarning: Number(stats.thisMonthEarning ?? 0) || 0,
      pendingInvoices: Number(stats.pendingInvoices ?? 0) || 0,
      averageRating: Number(stats.averageRating ?? 0) || 0,
      noShows: Number(stats.noShows ?? 0) || 0,
      lateCheckins: Number(stats.lateCheckIns ?? stats.lateCheckins ?? 0) || 0,
    },
    branch: String(pickMongoId(details.branch, details.branchId, basic.branch, basic.branchId) || ''),
    branchName,
    addresses: addressList,
  };
}
