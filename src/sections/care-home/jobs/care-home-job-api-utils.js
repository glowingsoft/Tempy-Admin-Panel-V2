import { format, isValid, parseISO } from 'date-fns';

import { fToNow } from 'src/utils/format-time';

import { getAgencyBranchMongoId, isMongoObjectId } from 'src/sections/branches/agency-branch-utils';
import { INVALID_BRANCH_COORDINATES_MESSAGE, isValidLngLat, parseCoordinates, readApiLate, readApiLong, toApiCoordinates } from 'src/sections/branches/geo-coordinates';
import { isApiReviewed, pickApiReview } from 'src/sections/reviews/reviews-api-utils';
import { pickApiToastMessage } from 'src/store/handleApiError';
import { pickStoredMediaValue } from 'src/store/Reducer/upload-api';
import { resolveJobApiStatus } from './care-home-job-utils';

export const JOB_RATE_SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'rate_desc', label: 'Rate: high to low' },
  { value: 'rate_asc', label: 'Rate: low to high' },
];

export const JOB_BIDS_FILTER_OPTIONS = [
  { value: '', label: 'Filled & unfilled' },
  { value: 'filled', label: 'Filled' },
  { value: 'unfilled', label: 'Unfilled' },
];

const JOB_SORT_VALUES = ['rate_asc', 'rate_desc'];
const JOB_BIDS_VALUES = ['filled', 'unfilled'];
const YMD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function applyJobListFilters(params, { startDate = '', endDate = '', jobRoles = [], sort = '', bids = '' } = {}) {
  if (YMD_PATTERN.test(String(startDate))) params.startDate = startDate;
  if (YMD_PATTERN.test(String(endDate))) params.endDate = endDate;

  const roleIds = (Array.isArray(jobRoles) ? jobRoles : String(jobRoles || '').split(',')).map((id) => String(id || '').trim()).filter(Boolean);
  if (roleIds.length) params.jobRoles = roleIds.join(',');

  if (JOB_SORT_VALUES.includes(sort)) params.sort = sort;
  if (JOB_BIDS_VALUES.includes(bids)) params.bids = bids;
  return params;
}

export function buildJobListParams({
  page = 0,
  limit = 50,
  status = '',
  keyword = '',
  horizon = '',
  dateFilter = '',
  branch = '',
  ...filters
} = {}) {
  const params = {
    page: page + 1,
    limit,
  };
  if (keyword) params.keyword = keyword;
  if (status && status !== 'all') params.status = status;
  const nextDateFilter = dateFilter || horizon;
  if (nextDateFilter && nextDateFilter !== 'all') params.dateFilter = nextDateFilter;
  const branchId = String(branch || '').trim();
  if (branchId && branchId !== 'all') params.branch = branchId;
  return applyJobListFilters(params, filters);
}

export function buildJobBidListParams({
  page = 0,
  limit = 100,
  status = '',
  keyword = '',
  job = '',
  date = '',
  dateFilter = '',
  branch = '',
} = {}) {
  const params = {
    page: page + 1,
    limit,
  };
  if (keyword) params.keyword = keyword;
  if (status && status !== 'all') params.status = status;
  if (job && job !== 'all') params.job = job;
  const nextDateFilter = dateFilter || date;
  if (nextDateFilter && nextDateFilter !== 'all' && nextDateFilter !== 'uncovered') {
    params.dateFilter = nextDateFilter;
  }
  const branchId = String(branch || '').trim();
  if (branchId && branchId !== 'all') params.branch = branchId;
  return params;
}

export function getCreatedJobIdFromApiPayload(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const nested = payload.data && typeof payload.data === 'object' ? payload.data : null;
  const candidates = [payload._id, payload.id, nested?._id, nested?.id, nested?.job?._id, nested?.job?.id];
  for (const value of candidates) {
    const id = String(value || '').trim();
    if (id && isMongoObjectId(id)) return id;
  }
  return '';
}

/**
 * Backend sometimes returns an error status after the job was actually saved
 * (e.g. post-create cache invalidation). Only treat that as success when the
 * payload still includes a real job id — never on cache/message text alone.
 */
export function isJobCreateSoftError(err) {
  if (!err) return false;
  return Boolean(
    getCreatedJobIdFromApiPayload(err?.data) || getCreatedJobIdFromApiPayload(err?.data?.data)
  );
}

/** Prefer API success text; never surface soft/cache error wording as success. */
export function pickJobSuccessToast(payload, fallback = '') {
  const message = pickApiToastMessage(payload, '');
  if (!message) return fallback;

  const lower = message.toLowerCase();
  if (
    lower.includes('cache') ||
    lower.includes('invalidate') ||
    lower.includes('correct data') ||
    lower.includes('fail') ||
    lower.includes('error')
  ) {
    return fallback;
  }

  return message;
}

const JOB_API_ERROR_MESSAGES = {
  requiremandate: 'Set up a direct debit on Payments before posting a job.',
  direct_debit_mandate_required:
    'There is no usable direct debit, so the booking was not created. The customer needs to set one up on Payments.',
  payment_failed: 'The direct debit could not be collected, so the booking was not kept.',
  invalid_rate: 'Please enter a rate above 0.',
  only_job_creator_can_edit_rate_or_shift_time: 'Only the person who posted this job can change its rate or shift times.',
  cannot_edit_rate_or_shift_time_job_not_pending: 'The rate and shift times can no longer be changed because a shift on this job is already booked or completed.',
  cannot_edit_rate_or_shift_time_job_has_bids: 'The rate and shift times can no longer be changed because this job already has bids.',
  invalid_date_format: 'Please pick a valid date.',
  start_date_must_be_before_end_date: 'The start date must be on or before the end date.',
  invalid_job_roles: 'One of the selected job types is no longer available.',
  invalid_job_sort: 'That sort option is not supported.',
  invalid_bids_filter: 'That filled / unfilled filter is not supported.',
};

export function getJobApiErrorMessage(err) {
  const candidates = [err?.data?.code, err?.data?.error, err?.data?.message, err?.message];
  for (const value of candidates) {
    if (typeof value !== 'string') continue;
    const mapped = JOB_API_ERROR_MESSAGES[value.trim().toLowerCase()];
    if (mapped) return mapped;
  }
  return null;
}

export function toJobRate(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Math.round(num * 100) / 100;
}

function toDateKey(value) {
  if (!value) return '';
  try {
    const date = typeof value === 'string' ? parseISO(value) : new Date(value);
    if (!isValid(date)) return String(value).slice(0, 10);
    return format(date, 'yyyy-MM-dd');
  } catch {
    return String(value).slice(0, 10);
  }
}

function formatPostedAt(value) {
  if (!value) return '';
  try {
    return fToNow(value) || '';
  } catch {
    return '';
  }
}

function normalizeGender(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  if (raw === 'male' || raw === 'm') return 'male';
  if (raw === 'female' || raw === 'f') return 'female';
  if (raw === 'other' || raw === 'others' || raw === 'o') return 'other';
  return '';
}

export function toApiGender(value) {
  const normalized = normalizeGender(value);
  if (normalized === 'male') return 'Male';
  if (normalized === 'female') return 'Female';
  if (normalized === 'other') return 'Other';
  throw new Error('This gender value is not supported');
}

function normalizeJobStatus(status) {
  return resolveJobApiStatus(status) || 'active';
}

export function keepJobsForStatus(jobs = [], requestedStatus) {
  const requested = resolveJobApiStatus(requestedStatus);

  return jobs.filter((job) => {
    if (!job?.id) return false;
    if (!requested) {
      const api = String(job.apiStatus || job.status || '').toLowerCase();
      return api !== 'deleted' && api !== 'delete';
    }

    const mapped = resolveJobApiStatus(job.apiStatus || job.status);
    if (!mapped) return true;
    return mapped === requested;
  });
}

function pickPositiveNumber(...values) {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num) && num > 0) return num;
  }
  return 0;
}

function pickJobImage(item = {}) {
  const own = pickStoredMediaValue(item.image);
  if (!own || /^default\.(png|jpg|jpeg|webp)$/i.test(String(own).split('/').pop() || '')) return '';

  const type = item.type && typeof item.type === 'object' ? item.type : {};
  const typeImage = pickStoredMediaValue(type.image || type.icon || type.photo || type.picture);
  if (typeImage && own === typeImage) return '';

  return own;
}

function pickHourlyRate(item = {}) {
  return pickPositiveNumber(
    item.hourlyRate,
    item.ratePerHour,
    item.rate,
    item.pricePerHour,
    item.perHour,
    item.offeredRate,
    item.rateOffered
  );
}

function mapShiftToSchedule(shift = {}) {
  const workerRef = shift.worker || shift.assignedWorker || shift.nurse;
  const workerId = typeof workerRef === 'object' ? String(workerRef._id || workerRef.id || '').trim() : String(workerRef || shift.workerId || '').trim();

  return {
    id: String(shift._id || shift.id || `${toDateKey(shift.date)}-${shift.startTime || ''}`),
    date: toDateKey(shift.date),
    startTime: shift.startTime || '',
    endTime: shift.endTime || '',
    breakIncluded: Boolean(shift.isBreak),
    breakMins: Number(shift.breakMin) || 0,
    receivingBids: shift.isBiddingAllowed !== false,
    status: String(shift.status || '').toLowerCase(),
    allowedPersons: Number(shift.allowedPersons) || 0,
    isBiddingAllowed: shift.isBiddingAllowed !== false,
    bookingId: String(shift.bookingId || shift.booking?._id || shift.booking?.id || (typeof shift.booking === 'string' ? shift.booking : '') || '').trim(),
    workerId,
    hourlyRate: pickPositiveNumber(shift.hourlyRate, shift.ratePerHour, shift.rate, shift.perHour),
  };
}

function resolveTypeId(type) {
  if (!type) return '';
  if (typeof type === 'string') return type;
  if (typeof type === 'object') return String(type._id || type.id || '');
  return '';
}

function resolveTypeTitle(type, fallback = '') {
  if (type && typeof type === 'object') {
    return type.title || type.name || type.label || fallback;
  }
  return fallback;
}

export function mapCareHomeJobTypeFromApi(item = {}) {
  const id = String(item._id || item.id || '');
  const title = String(item.title || item.name || '').trim();
  const department = String(item.department || item.category || '').trim();
  const description = String(item.description || item.details || '').trim();

  return {
    id,
    _id: id,
    title,
    name: title,
    department,
    category: department,
    description,
    status: String(item.status || '').toLowerCase(),
    label: department ? `${department} · ${title}` : title || id,
    createdAt: item.createdAt || '',
    updatedAt: item.updatedAt || '',
    user: item.user || null,
  };
}

export function mapCareHomeJobFromApi(item = {}) {
  const id = String(item._id || item.id || '');
  const location = item.location || {};
  const user = item.user || {};
  const shifts = Array.isArray(item.shift) ? item.shift : [];
  const schedules = shifts.map(mapShiftToSchedule);
  const typeId = resolveTypeId(item.type);
  const typeTitle = resolveTypeTitle(item.type, '');

  const address = location.fullAddress || [location.city, location.state, location.country].filter(Boolean).join(', ') || '';

  const receivingBids = schedules.some((entry) => entry.receivingBids !== false);
  const branchId = String(
    item.branch?._id || item.branch?.id || item.branch || item.branchId || item.address?._id || item.address?.id || (typeof item.address === 'string' ? item.address : '') || ''
  );
  const contact = item.contactDetails && typeof item.contactDetails === 'object' ? item.contactDetails : {};
  const emergency = item.emergencyContact && typeof item.emergencyContact === 'object' ? item.emergencyContact : {};
  const primaryShift = shifts[0] || {};
  const workerRef = item.worker || item.assignedWorker || item.nurse;
  const workerId = typeof workerRef === 'object' ? String(workerRef._id || workerRef.id || '').trim() : String(workerRef || item.workerId || item.employee || '').trim();
  const bids = Array.isArray(item.bids) ? item.bids : [];
  const hasAcceptedBid =
    Number(item.acceptedBidsCount ?? item.acceptedBidCount ?? 0) > 0 ||
    Boolean(item.acceptedBid || item.latestAcceptedBid) ||
    bids.some((bid) => {
      const status = String(bid?.status || '').toLowerCase();
      return status === 'accepted' || status === 'accept' || status === 'approved';
    });
  const bookingId = String(
    item.bookingId ||
      item.acceptedBookingId ||
      item.latestBookingId ||
      item.booking?._id ||
      item.booking?.id ||
      (typeof item.booking === 'string' ? item.booking : '') ||
      item.bookings?.[0]?._id ||
      item.bookings?.[0]?.id ||
      item.acceptedBid?.bookingId ||
      item.acceptedBid?.booking?._id ||
      item.bid?.bookingId ||
      item.bid?.booking?._id ||
      primaryShift.bookingId ||
      primaryShift.booking?._id ||
      primaryShift.booking?.id ||
      ''
  ).trim();

  return {
    id,
    _id: id,
    title: String(item.title || item.name || typeTitle || '').trim() || 'Job',
    type: item.name || typeTitle || item.title || 'Job',
    name: item.name || '',
    raw: item,
    typeId,
    typeTitle,
    branchId,
    description: String(item.description || '').trim(),
    status: normalizeJobStatus(item.status),
    apiStatus: resolveJobApiStatus(item.status) || String(item.status || '').toLowerCase(),
    gender: normalizeGender(item.gender),
    image: pickJobImage(item),
    address,
    location,
    schedules,
    receivingBids,
    postedAt: formatPostedAt(item.createdAt),
    createdAt: item.createdAt || '',
    hourlyRate: pickHourlyRate(item, primaryShift),
    rate: toJobRate(item.rate),
    hasRateField: Object.prototype.hasOwnProperty.call(item, 'rate'),
    isFilled: Boolean(item.isFilled),
    canEditRateAndShiftTimes: item.canEditRateAndShiftTimes !== false,
    bidCount: Number(item.bidsCount ?? item.bidCount ?? 0) || 0,
    acceptedBidsCount: Number(item.acceptedBidsCount ?? item.acceptedBidCount ?? 0) || 0,
    hasAcceptedBid,
    averageRating: Number(item.averageRating ?? 0) || 0,
    totalReviews: Number(item.totalReviews ?? 0) || 0,
    distanceInKm: Number(item.distanceInKm ?? item.distance ?? 0) || 0,
    isSpecial: Boolean(item.isSpecial),
    assignedAgency: item.assignedAgency || item.agency?.name || '',
    agencyId: item.agencyId || item.agency?._id || item.agency?.id || '',
    bookingId: bookingId || item.bookingId || item.booking?._id || item.booking?.id || item.acceptedBookingId || '',
    requestFromAgency: Boolean(item.requestFromAgency),
    careNotes: String(item.notes || item.careNotes || '').trim(),
    instructions: String(item.instructions || '').trim(),
    contactName: String(contact.name || '').trim(),
    contactPhone: String(contact.phone || '').trim(),
    contactEmail: String(contact.email || '').trim(),
    emergencyName: String(emergency.name || '').trim(),
    emergencyPhone: String(emergency.phone || '').trim(),
    emergencyRelation: String(emergency.relationship || '').trim(),
    careDocuments: (Array.isArray(item.documents) ? item.documents : [])
      .map((doc, index) =>
        typeof doc === 'string' ? { name: doc.split('/').pop() || `Document ${index + 1}`, url: doc } : { name: doc?.name || '', url: doc?.url || doc?.fileUrl || '' }
      )
      .filter((doc) => doc.url || doc.name),
    review: pickApiReview(item),
    isReviewed: isApiReviewed(item),
    user: {
      id: String(user._id || user.id || ''),
      name: user.name || '',
      email: user.email || '',
      avatarUrl: user.profileIcon || '',
      userType: user.accountState?.userType || '',
    },
    worker: item.worker || null,
    workerId,
    employer: item.employer || null,
  };
}

/**
 *
 * @param {object} draft
 * @param {object|null} branch 
 * @param {{ includeStatus?: boolean, isUser?: boolean }} [options]
 */
export function buildCareHomeJobPayload(draft = {}, branch = null, options = {}) {
  const locationSource =
    (branch?.location && typeof branch.location === 'object' ? branch.location : null) || (draft.location && typeof draft.location === 'object' ? draft.location : {}) || {};
  const coords = Array.isArray(locationSource.coordinates) ? locationSource.coordinates : [];
  const parsed = parseCoordinates(coords);
  const longitude = parsed?.longitude;
  const latitude = parsed?.latitude;

  if (!isValidLngLat(longitude, latitude)) {
    throw new Error(INVALID_BRANCH_COORDINATES_MESSAGE);
  }

  const text = (value) => String(value ?? '').trim();

  const locationId = text(draft.branchId) || getAgencyBranchMongoId(branch) || text(branch?.id);

  const location = {
    type: 'Point',
    coordinates: toApiCoordinates(latitude, longitude),
    title: text(locationSource.title || locationSource.name || locationSource.locationName),
    fullAddress: text(locationSource.fullAddress) || text(draft.address) || text(branch?.name),
  };
  ['city', 'state', 'country', 'postalCode'].forEach((key) => {
    const value = text(locationSource[key]);
    if (value) location[key] = value;
  });

  const body = {
    name: text(draft.name || draft.typeTitle || draft.type),
    type: text(draft.typeId),
    location,
    shift: (draft.schedules || []).map((entry) => {
      const breakMin = entry.breakIncluded !== false ? Number(entry.breakMins) || 0 : 0;
      const shift = {
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        isBreak: breakMin > 0,
        breakMin,
        allowedPersons: Number(entry.allowedPersons) > 0 ? Number(entry.allowedPersons) : 1,
        isBiddingAllowed: entry.receivingBids !== false,
      };

      const shiftId = text(entry.id || entry._id);
      if (isMongoObjectId(shiftId)) {
        shift._id = shiftId;
      }

      return shift;
    }),
    description: text(draft.description),
    gender: toApiGender(draft.gender),
    instructions: text(draft.instructions),
    notes: text(draft.notes || draft.careNotes),
    contactDetails: {
      name: text(draft.contactName),
      phone: text(draft.contactPhone),
      email: text(draft.contactEmail),
    },
    emergencyContact: {
      name: text(draft.emergencyName),
      phone: text(draft.emergencyPhone),
      relationship: text(draft.emergencyRelation || draft.emergencyRelationship),
    },
  };

  const rate = toJobRate(draft.hourlyRate);
  if (!draft.id) {
    if (rate != null) body.rate = rate;
  } else if (draft.canEditRateAndShiftTimes !== false) {
    body.rate = rate;
  }

  if (options.isUser) {
    body.address = locationId;
  } else {
    body.branch = locationId;
  }

  const image = typeof draft.image === 'string' ? draft.image.trim() : '';
  if (image) body.image = image;

  if (Array.isArray(draft.careDocuments) && draft.careDocuments.length) {
    body.documents = draft.careDocuments.map((doc) => ({ name: text(doc?.name), url: text(doc?.url || doc?.fileUrl) })).filter((doc) => doc.name || doc.url);
  }

  const workerId = text(draft.workerId || draft.worker);
  const employerId = text(draft.employerId || draft.employer || draft.employeeId || draft.employee);
  if (workerId) body.worker = workerId;
  if (employerId) body.employer = employerId;

  if (options.includeStatus && draft.status) {
    body.status = resolveJobApiStatus(draft.status) || 'active';
  }

  return body;
}

export function getCareHomeBranchLatLng(branch) {
  if (!branch || typeof branch !== 'object') return null;
  const parsed = parseCoordinates(branch.location?.coordinates);
  if (!parsed) return null;
  if (parsed.latitude === 0 && parsed.longitude === 0) return null;
  return { latitude: parsed.latitude, longitude: parsed.longitude };
}

export function getFirstCareHomeBranchLatLng(branches = []) {
  for (const branch of branches) {
    const origin = getCareHomeBranchLatLng(branch);
    if (origin) return origin;
  }
  return null;
}

export function getCareHomeUserLatLng(user) {
  if (!user || typeof user !== 'object') return null;

  const candidates = [user.location, user.basicInfo?.location, user.accountState?.location, user].filter(Boolean);

  for (const node of candidates) {
    const lat = Number(readApiLate(node));
    const lng = Number(readApiLong(node));
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && !(lat === 0 && lng === 0)) {
      return { latitude: lat, longitude: lng };
    }

    const parsed = parseCoordinates(node.coordinates);
    if (parsed && !(parsed.latitude === 0 && parsed.longitude === 0)) {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
  }

  return null;
}

function pickUserLocationAddress(user, location = {}) {
  const cityLine = [
    location.city || user.city || user.basicInfo?.city,
    location.state || user.state || user.basicInfo?.state,
    location.country || user.country || user.basicInfo?.country,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');

  return (
    String(
      location.fullAddress ||
        location.address ||
        user.fullAddress ||
        user.address ||
        user.basicInfo?.fullAddress ||
        user.basicInfo?.address ||
        user.basicInfo?.location?.fullAddress ||
        ''
    ).trim() ||
    cityLine ||
    ''
  );
}

export function mergeUserWithProfile(user, profile) {
  if (!user && !profile) return null;
  if (!profile) return user || null;
  if (!user) return profile;

  const location =
    (profile.location && typeof profile.location === 'object' ? profile.location : null) ||
    (user.location && typeof user.location === 'object' ? user.location : null) ||
    (user.basicInfo?.location && typeof user.basicInfo.location === 'object' ? user.basicInfo.location : null) ||
    {};

  const fullAddress = pickUserLocationAddress(profile, location) || pickUserLocationAddress(user, location);

  return {
    ...user,
    ...profile,
    _id: user._id || user.id || profile._id || profile.id,
    id: user.id || user._id || profile.id || profile._id,
    fullAddress: fullAddress || user.fullAddress || profile.fullAddress || '',
    address: fullAddress || user.address || profile.address || '',
    city: profile.city || location.city || user.city || '',
    state: profile.state || location.state || user.state || '',
    country: profile.country || location.country || user.country || '',
    postalCode: profile.postalCode || location.postalCode || user.postalCode || '',
    longitude: readApiLong(profile) ?? readApiLong(location) ?? readApiLong(user),
    latitude: readApiLate(profile) ?? readApiLate(location) ?? readApiLate(user),
    location: {
      ...location,
      ...(fullAddress ? { fullAddress } : {}),
    },
    basicInfo: {
      ...(user.basicInfo || {}),
      ...(profile.raw?.basicInfo || {}),
      location: {
        ...location,
        ...(fullAddress ? { fullAddress } : {}),
      },
    },
  };
}

function hasUsableBranchCoords(branch) {
  const parsed = parseCoordinates(branch?.location?.coordinates);
  if (!parsed) return false;
  const { latitude: lat, longitude: lng } = parsed;
  return !(lng === 0 && lat === 0) && !(lng === 10 && lat === 10);
}

export function resolveUserJobLocationBranches({ user = null, profile = null, apiBranches = [] } = {}) {
  const merged = mergeUserWithProfile(user, profile);
  const fromProfile = buildUserHomeBranchFromProfile(merged);
  const active = (Array.isArray(apiBranches) ? apiBranches : []).filter(
    (branch) => branch && branch.status !== 'deleted' && branch.status !== 'delete' && (branch.status === 'active' || branch.isActive !== false || !branch.status)
  );

  if (active.length) {
    return active.map((branch, index) => {
      if (index !== 0 || !fromProfile) return branch;

      const branchAddress = String(branch.location?.fullAddress || branch.location?.address || '').trim();
      const profileAddress = String(fromProfile.location?.fullAddress || '').trim();
      const address = (branchAddress && branchAddress.toLowerCase() !== 'home' ? branchAddress : '') || profileAddress || branchAddress;

      const useProfileCoords = !hasUsableBranchCoords(branch) && hasUsableBranchCoords(fromProfile);
      const label = (branch.name && String(branch.name).trim().toLowerCase() !== 'home' ? branch.name : '') || address || branch.name || '';

      return {
        ...branch,
        name: label,
        location: {
          ...(fromProfile.location || {}),
          ...(branch.location || {}),
          ...(address ? { fullAddress: address, name: address, title: address, locationName: address } : {}),
          coordinates: useProfileCoords ? fromProfile.location.coordinates : branch.location?.coordinates || fromProfile.location?.coordinates,
        },
      };
    });
  }

  return fromProfile ? [fromProfile] : [];
}

/**
 * @param {object|null} user
 * @returns {object|null}
 */
export function buildUserHomeBranchFromProfile(user) {
  if (!user || typeof user !== 'object') return null;

  const id = String(user._id || user.id || '').trim();
  if (!id) return null;

  const location =
    (user.location && typeof user.location === 'object' ? user.location : null) ||
    (user.basicInfo?.location && typeof user.basicInfo.location === 'object' ? user.basicInfo.location : null) ||
    {};

  const parsed = parseCoordinates(location.coordinates);
  const lng = Number(parsed?.longitude ?? readApiLong(user) ?? readApiLong(location));
  const lat = Number(parsed?.latitude ?? readApiLate(user) ?? readApiLate(location));

  const fullAddress = pickUserLocationAddress(user, location);
  if (!fullAddress && !(Number.isFinite(lng) && Number.isFinite(lat))) {
    return null;
  }

  const displayName = fullAddress || [user.city, user.state, user.country].filter(Boolean).join(', ') || '';
  if (!displayName) return null;

  return {
    id,
    _id: id,
    name: displayName,
    status: 'active',
    isActive: true,
    location: {
      ...location,
      name: displayName,
      title: displayName,
      locationName: displayName,
      coordinates: toApiCoordinates(Number.isFinite(lat) ? lat : 10, Number.isFinite(lng) ? lng : 10),
      fullAddress: displayName,
      city: location.city || user.city || '',
      state: location.state || user.state || '',
      country: location.country || user.country || '',
      postalCode: location.postalCode || user.postalCode || user.zipCode || '',
    },
  };
}
