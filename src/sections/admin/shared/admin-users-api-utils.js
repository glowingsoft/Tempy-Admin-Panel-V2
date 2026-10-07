import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = pickId(value._id, value.id);
      if (nested) return nested;
      continue;
    }
    return String(value);
  }
  return '';
}

export function resolveAdminUserRecordId(record = {}) {
  const raw = record?.raw && typeof record.raw === 'object' ? record.raw : record;
  const basic = raw?.basicInfo && typeof raw.basicInfo === 'object' ? raw.basicInfo : {};
  const nestedUser = raw?.user && typeof raw.user === 'object' ? raw.user : {};
  const nestedStaff = raw?.staff && typeof raw.staff === 'object' ? raw.staff : {};

  return pickId(basic._id, basic.id, nestedUser._id, nestedUser.id, nestedStaff._id, nestedStaff.id, record?.id, record?._id, raw?._id, raw?.id);
}

function coerceText(value, depth = 0) {
  if (value == null || value === '') return '';
  if (depth > 3) return '';

  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return '';

  if (typeof value === 'string') {
    const text = value.trim();
    return text === '[object Object]' ? '' : text;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => coerceText(entry, depth + 1))
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  if (typeof value !== 'object') return '';

  return (
    coerceText(value.fullName, depth + 1) ||
    coerceText(value.displayName, depth + 1) ||
    coerceText(value.name, depth + 1) ||
    [coerceText(value.firstName, depth + 1), coerceText(value.lastName, depth + 1)].filter(Boolean).join(' ').trim() ||
    [coerceText(value.first, depth + 1), coerceText(value.last, depth + 1)].filter(Boolean).join(' ').trim() ||
    coerceText(value.title, depth + 1) ||
    coerceText(value.label, depth + 1) ||
    coerceText(value.en, depth + 1) ||
    coerceText(value.basicInfo?.name, depth + 1) ||
    coerceText(value.email, depth + 1)
  );
}

function pickText(...values) {
  for (const value of values) {
    const text = coerceText(value);
    if (text) return text;
  }
  return '';
}

function formatLocation(location) {
  if (!location) return '';
  if (typeof location === 'string') return location.trim();
  if (typeof location !== 'object') return '';

  return pickText(location.fullAddress, location.address, [location.city, location.state, location.country].filter(Boolean).join(', '), location.city) || '';
}

function formatPhone(phone) {
  if (!phone) return '';
  if (typeof phone === 'string' || typeof phone === 'number') return String(phone).trim();
  if (typeof phone !== 'object') return '';
  const code = String(phone.code || phone.dialCode || '').trim();
  const number = String(phone.number || phone.phone || '').trim();
  if (!number) return '';
  return `${code}${number}`.trim();
}

function pickPhone(...values) {
  for (const value of values) {
    const text = formatPhone(value);
    if (text) return text;
  }
  return '';
}

function firstDefined(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string' && !value.trim()) continue;
    return value;
  }
  return undefined;
}

function resolveRawStatus(item = {}, basic = {}, account = {}, meta = {}) {
  const nestedUser = item.user && typeof item.user === 'object' ? item.user : {};
  const nestedAccount = (nestedUser.accountState && typeof nestedUser.accountState === 'object' ? nestedUser.accountState : null) || {};

  const suspended =
    account.suspended === true ||
    account.isSuspended === true ||
    item.suspended === true ||
    item.isSuspended === true ||
    basic.suspended === true ||
    nestedAccount.suspended === true ||
    nestedAccount.isSuspended === true ||
    nestedUser.suspended === true ||
    nestedUser.isSuspended === true;

  if (suspended) return 'suspended';

  return firstDefined(
    account.status,
    account.accountStatus,
    account.approvalStatus,
    account.userStatus,
    item.status,
    item.accountStatus,
    item.approvalStatus,
    item.userStatus,
    basic.status,
    meta.status,
    nestedAccount.status,
    nestedUser.status,
    account.isApproved === false || account.approved === false || item.isApproved === false || item.approved === false ? 'pending' : undefined,
    account.isActive === false || item.isActive === false || basic.isActive === false ? 'inactive' : undefined,
    account.isApproved === true || account.approved === true || item.isApproved === true ? 'active' : undefined
  );
}

function normalizeStatus(status) {
  if (status === true || status === 1) return 'active';
  if (status === false || status === 0) return 'inactive';

  const raw = String(status || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  if (!raw) {
    return 'pending';
  }

  if (raw === 'suspended' || raw === 'suspend') {
    return 'suspended';
  }

  if (raw === 'inactive' || raw === 'disabled' || raw === 'blocked' || raw === 'rejected' || raw === 'banned') {
    return 'inactive';
  }

  if (
    raw === 'pending' ||
    raw === 'awaiting' ||
    raw === 'under_review' ||
    raw === 'in_review' ||
    raw === 'not_approved' ||
    raw === 'unapproved' ||
    raw === 'waiting' ||
    raw === 'waiting_approval' ||
    raw === 'awaiting_approval'
  ) {
    return 'pending';
  }

  if (raw === 'active' || raw === 'approved' || raw === 'enabled' || raw === 'verified') {
    return 'active';
  }

  return 'pending';
}

export const ADMIN_MENU_USER_TYPE = {
  careHomes: 'careHome',
  agencies: 'agency',
  hospitals: 'hospital',
  localAuthority: 'localAuthority',
  individualHomeCare: 'user',
  homeCareCompanies: 'homeCareCompany',
  staffMembers: 'nurse',
};

export const ADMIN_USERS_TABLE_HEAD = [
  { id: 'name', label: 'Name', minWidth: 180 },
  { id: 'email', label: 'Email', minWidth: 200 },
  { id: 'phone', label: 'Phone', minWidth: 130 },
  { id: 'location', label: 'Location', minWidth: 140 },
  { id: 'status', label: 'Status', minWidth: 110 },
  { id: 'action', label: 'Action', minWidth: 100, align: 'right' },
];

export const ADMIN_CUSTOMER_TABLE_HEAD = [
  { id: 'name', label: 'Name', minWidth: 180 },
  { id: 'email', label: 'Email', minWidth: 200 },
  { id: 'phone', label: 'Phone', minWidth: 130 },
  { id: 'location', label: 'Location', minWidth: 140 },
  { id: 'spendings', label: 'Spendings', minWidth: 120, align: 'center' },
  { id: 'jobsPosted', label: 'Jobs posted', minWidth: 120, align: 'center' },
  { id: 'bookings', label: 'Bookings', minWidth: 110, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 110 },
  { id: 'action', label: 'Action', minWidth: 100, align: 'right' },
];

export const ADMIN_SUPPLIER_TABLE_HEAD = [
  { id: 'name', label: 'Name', minWidth: 180 },
  { id: 'email', label: 'Email', minWidth: 200 },
  { id: 'phone', label: 'Phone', minWidth: 130 },
  { id: 'location', label: 'Location', minWidth: 140 },
  { id: 'earnings', label: 'Earnings', minWidth: 120, align: 'center' },
  { id: 'rating', label: 'Rating', minWidth: 90, align: 'center' },
  { id: 'bookings', label: 'Bookings', minWidth: 110, align: 'center' },
  { id: 'completedJobs', label: 'Completed jobs', minWidth: 130, align: 'center' },
  { id: 'activeShifts', label: 'Active shifts', minWidth: 120, align: 'center' },
  { id: 'status', label: 'Status', minWidth: 110 },
  { id: 'action', label: 'Action', minWidth: 100, align: 'right' },
];

function pickNumber(...values) {
  for (const value of values) {
    if (value === undefined || value === null || value === '') continue;
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        if (!value.length) continue;
        if (value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))) {
          return value[0];
        }
        return value.length;
      }
      const nested = pickNumber(value.total, value.count, value.value, value.amount, value.sum, value.spendings, value.earnings, value.bookings);
      if (nested != null) return nested;
      continue;
    }
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

export function extractAdminUsersList(response) {
  const raw = response?.data ?? response;
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.docs)) return raw.docs;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  if (Array.isArray(raw?.users)) return raw.users;
  if (Array.isArray(response)) return response;
  return [];
}

function firstAddressLocation(addresses) {
  if (!Array.isArray(addresses)) return '';
  for (const address of addresses) {
    const text = formatLocation(address?.location || address);
    if (text) return text;
  }
  return '';
}

function resolveBlueTick(value) {
  if (value && typeof value === 'object') return Boolean(value.isActive);
  return Boolean(value);
}

function toUrlList(value) {
  return (Array.isArray(value) ? value : [value]).map((entry) => resolveProfileAssetUrl(entry)).filter(Boolean);
}

/** Nurse credential uploads (read-only on the admin side). */
export function extractAdminCredentials(item = {}) {
  return [
    { key: 'governmentIdentity', label: 'Government ID', urls: toUrlList(item.governmentIdentity) },
    { key: 'degree', label: 'Degree', urls: toUrlList(item.degree) },
    { key: 'certification', label: 'Certification', urls: toUrlList(item.certification) },
    { key: 'validationDocument', label: 'Verification document', urls: toUrlList(item.validationDocument) },
  ].filter((group) => group.urls.length);
}

export function mapAdminUserFromApi(item = {}) {
  const basic = item.basicInfo && typeof item.basicInfo === 'object' ? item.basicInfo : {};
  const account = item.accountState && typeof item.accountState === 'object' ? item.accountState : {};
  const meta = item.metadata && typeof item.metadata === 'object' ? item.metadata : {};
  const nestedUser = item.user && typeof item.user === 'object' ? item.user : {};
  const nestedStaff = item.staff && typeof item.staff === 'object' ? item.staff : {};
  const stats = item.stats && typeof item.stats === 'object' ? item.stats : {};
  const ratingStats = item.ratingStats && typeof item.ratingStats === 'object' ? item.ratingStats : {};

  const id = resolveAdminUserRecordId(item);
  const name = pickText(basic.name, item.name, item.displayName, nestedUser.name, nestedStaff.name, '—');
  const email = pickText(basic.email, item.email, nestedUser.email, nestedStaff.email, account.email);
  const phone = pickPhone(basic.phoneNumber, item.phoneNumber, item.phone);
  const avatarUrl = resolveProfileAssetUrl(pickText(basic.profileIcon, item.profileIcon, item.avatarUrl, item.photoURL));
  const location = formatLocation(item.location || basic.location || account.location) || firstAddressLocation(item.addresses);
  const status = normalizeStatus(resolveRawStatus(item, basic, account, meta));

  return {
    id,
    name,
    email,
    phone,
    location,
    avatarUrl,
    status,
    registeredAt: meta.createdAt || item.createdAt || '',
    userType: account.userType || item.userType || '',
    bio: pickText(item.summary, item.bio, item.about, basic.bio, item.description),
    instructions: pickText(item.instructions, item.notes, item.careInstructions, basic.instructions),
    images: item.images || item.photos || [],
    documents: item.documents || item.files || [],
    staffCount: pickNumber(item.staffCount, Array.isArray(item.staff) ? item.staff.length : null),
    activeJobs: pickNumber(item.activeJobs, item.openJobs),
    revenue: item.revenue ?? null,
    spendings: pickNumber(item.spendings, item.spending, item.totalSpendings, item.totalSpending, meta.spendings, meta.spending, account.spendings),
    jobsPosted: pickNumber(stats.jobsPosted, item.jobsPosted, item.jobPosted, item.postedJobs, item.totalJobsPosted, item.jobsCount, meta.jobsPosted, account.jobsPosted),
    bookings: pickNumber(
      stats.totalBookings,
      stats.bookings,
      item.bookings,
      item.bookingCount,
      item.bookingsCount,
      item.totalBookings,
      item.totalBooking,
      item.filledShifts,
      meta.bookings,
      meta.bookingsCount,
      account.bookings
    ),
    // Suppliers
    earnings: pickNumber(item.earnings, item.earning, item.totalEarnings, item.totalEarning, meta.earnings, account.earnings),
    jobsApplied: pickNumber(item.jobsApplied, item.jobApplied, item.appliedJobs, item.totalJobsApplied, item.applicationsCount, meta.jobsApplied, account.jobsApplied),
    carersCount: item.carersCount ?? null,
    serviceAreas: item.serviceAreas ?? null,
    departments: item.departments ?? null,
    activeContracts: item.activeContracts ?? null,
    region: item.region ?? null,
    activePlacements: item.activePlacements ?? null,
    careType: item.careType ?? null,
    activeRequests: item.activeRequests ?? null,
    specialty: item.specialty ?? basic.specialty ?? null,
    rating: pickNumber(item.averageRating, ratingStats.averageRating, item.rating),
    totalReviews: pickNumber(item.totalReviews, ratingStats.totalReviews),
    completedJobs: pickNumber(stats.completedJobs, item.completedJobs),
    activeShifts: pickNumber(stats.activeShifts, item.activeShifts),
    // Nurse detail
    gender: pickText(item.gender, basic.gender),
    dob: pickText(item.dob, basic.dob),
    taxNumber: pickText(item.taxNumber),
    timezone: pickText(item.timezone),
    radius: pickNumber(item.radius),
    blueTick: resolveBlueTick(account.blueTick),
    verificationStatus: item.verificationStatus || account.verificationStatus || null,
    provideServicesTo: item.provideServicesTo && typeof item.provideServicesTo === 'object' ? item.provideServicesTo : null,
    jobRoles: Array.isArray(item.jobRoles) ? item.jobRoles : [],
    credentials: extractAdminCredentials(item),
    reviews: Array.isArray(item.reviews) ? item.reviews : [],
    branches: Array.isArray(item.branches) ? item.branches : [],
    addresses: Array.isArray(item.addresses) ? item.addresses : [],
    raw: item,
  };
}

export function buildAdminUserStatusPayload(status) {
  return {
    status: normalizeStatus(status),
  };
}
