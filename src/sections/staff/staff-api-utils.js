import { createStaffRecord, normalizeStaffSpecialty } from 'src/_mock/_staff';

// ----------------------------------------------------------------------

/**
 * Map dashboard accountType → API_ROUTES staff list keys.
 * Keep per-dashboard so paths can diverge (care-home vs hospital, etc.).
 */
export const STAFF_ROUTE_KEYS_BY_ACCOUNT = {
  care_home: 'CARE_HOME_STAFF',
  careHome: 'CARE_HOME_STAFF',
  hospital_nhs: 'HOSPITAL_STAFF',
  hospital: 'HOSPITAL_STAFF',
  local_authority: 'LOCAL_AUTHORITY_STAFF',
  localAuthority: 'LOCAL_AUTHORITY_STAFF',
  agency: 'AGENCY_STAFF',
  home_care_company: 'HOME_CARE_COMPANY_STAFF',
  homeCareCompany: 'HOME_CARE_COMPANY_STAFF',
  user: 'USER_STAFF',
  individual_home_care: 'USER_STAFF',
  individualHomeCare: 'USER_STAFF',
};

export function resolveStaffAccountKey(user) {
  const accountType = user?.accountState?.accountType || user?.accountType || user?.userType || '';
  const permission = Number(user?.permission);

  if (STAFF_ROUTE_KEYS_BY_ACCOUNT[accountType]) return accountType;

  if (permission === 2) return 'care_home';
  if (permission === 3) return 'agency';
  if (permission === 4) return 'hospital_nhs';
  if (permission === 5) return 'local_authority';
  if (permission === 6) return 'user';
  if (permission === 7) return 'home_care_company';

  return accountType || '';
}

/** Roles with a GET /web/{role}/staff list for compliance / staff pages. */
export function canFetchDashboardStaff(user) {
  const accountKey = resolveStaffAccountKey(user);
  return Boolean(accountKey && STAFF_ROUTE_KEYS_BY_ACCOUNT[accountKey]);
}

function formatDateLabel(value) {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 10);
  } catch {
    return String(value);
  }
}

function pickFirst(...values) {
  return values.find((value) => value != null && value !== '') ?? '';
}

function formatUserTypeLabel(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeSpecialities(...values) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => String(value || '').trim())
    .filter((value, index, list) => value && list.indexOf(value) === index);
}

/**
 * Map GET `/web/care-home/staff` / `/web/hospital/staff` (and `/available`) item → UI row.
 * Supports nested `{ worker }` and flat staff/user documents.
 */
export function mapDashboardStaffToUi(item = {}) {
  const worker = item.worker && typeof item.worker === 'object' ? item.worker : item.user && typeof item.user === 'object' ? item.user : item;
  const account = worker.accountState || item.accountState || {};
  const location = worker.location || item.location || {};

  const id = String(pickFirst(worker._id, worker.id, item._id, item.id) || '');

  const name = pickFirst(worker.name, item.name);
  const email = pickFirst(worker.email, item.email);
  const phone = pickFirst(worker.phoneNumber, worker.phone, item.phoneNumber, item.phone);

  const userType = pickFirst(account.userType, worker.userType, item.userType, 'nurse');
  const specialities = normalizeSpecialities(
    worker.specialities,
    worker.specialties,
    worker.speciality,
    worker.specialty,
    item.specialities,
    item.specialties,
    item.speciality,
    item.specialty,
    userType,
    'generalNurse'
  ).map(normalizeStaffSpecialty);

  const status = String(pickFirst(account.status, item.status, 'active')).toLowerCase();
  const addedOn = formatDateLabel(item.createdAt || worker.createdAt);
  const latestShiftDate = formatDateLabel(item.latestShiftDate);

  const address = pickFirst(location.fullAddress, [location.city, location.state, location.country].filter(Boolean).join(', '));

  const qualificationSource = worker.qualifications || item.qualifications || [];
  const qualifications = (Array.isArray(qualificationSource) ? qualificationSource : [])
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      const title = String(entry?.title || entry?.name || entry?.qualification || '').trim();
      const files = entry?.files || entry?.documents || entry?.certificates || [];
      const hasCertificate = Boolean(
        entry?.hasCertificate || entry?.verified || entry?.certificateUploaded || entry?.file || entry?.url || (Array.isArray(files) && files.length > 0)
      );
      return title && hasCertificate ? title : '';
    })
    .filter(Boolean);

  return createStaffRecord({
    id: id || `tmp-${Math.random().toString(36).slice(2, 8)}`,
    name,
    email,
    phone,
    gender: pickFirst(worker.gender, item.gender),
    location: address,
    specialities,
    specialty: specialities[0] || 'generalNurse',
    role: formatUserTypeLabel(userType),
    userType,
    ratePerHour: Number(worker.ratePerHour ?? worker.hourlyRate ?? item.ratePerHour ?? 0) || 0,
    platformPercent: Number(worker.platformPercent ?? item.platformPercent ?? 10) || 10,
    addedOn: addedOn || new Date().toISOString().slice(0, 10),
    joinedOn: addedOn || new Date().toISOString().slice(0, 10),
    latestShiftDate: latestShiftDate || '—',
    bookingCount: Number(item.bookingCount ?? 0) || 0,
    status: status === 'inactive' || status === 'suspended' || status === 'rejected' ? 'inactive' : 'active',
    avatarUrl: pickFirst(worker.profileIcon, item.profileIcon, item.avatarUrl),
    rating: Number(worker.averageRating ?? item.averageRating ?? 0) || 0,
    reviewCount: Number(worker.totalReviews ?? item.totalReviews ?? 0) || 0,
    hoursWorked: Number(worker.totalHoursWorked ?? item.workStats?.totalHoursWorked ?? item.totalHoursWorked ?? 0) || 0,
    hoursAllowed: Number(worker.hoursAllowed ?? item.workStats?.hoursAllowed ?? item.hoursAllowed ?? 60) || 60,
    isFavorite: Boolean(worker.isFavorite ?? item.isFavorite ?? false),
    locations: address ? [{ id: '1', label: 'Primary', address }] : [],
    qualifications,
    complianceStatus: pickFirst(item.complianceStatus, worker.complianceStatus, item.checkStatus, worker.checkStatus),
  });
}

export function extractStaffListPayload(response) {
  if (Array.isArray(response)) {
    return { data: response, meta: { totalRecords: response.length } };
  }

  const data = Array.isArray(response?.data) ? response.data : Array.isArray(response?.staff) ? response.staff : Array.isArray(response?.results) ? response.results : [];

  const meta = response?.meta || {};

  return {
    data,
    meta,
    total_length: meta.totalRecords ?? meta.total ?? data.length,
  };
}
