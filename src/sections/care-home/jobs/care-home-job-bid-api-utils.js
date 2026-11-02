import { format, isValid, parseISO } from 'date-fns';

import { fToNow } from 'src/utils/format-time';


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

function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = value._id || value.id;
      if (nested != null && nested !== '') return String(nested);
      continue;
    }
    return String(value);
  }
  return '';
}

export const BID_API_STATUSES = ['pending', 'accepted', 'rejected', 'deleted', 'withdraw', 'cancelledByWorker', 'cancelledByEmployer', 'cancelledByUser'];

/** Map any bid status (incl. aliases) to the backend Bid enum. */
export function resolveBidApiStatus(status) {
  const raw = String(status || '').trim();
  if (!raw) return '';

  const lower = raw.toLowerCase();
  const match = BID_API_STATUSES.find((value) => value.toLowerCase() === lower);
  if (match) return match;

  if (lower === 'declined' || lower === 'decline' || lower === 'reject') return 'rejected';
  if (lower === 'withdrawn') return 'withdraw';
  if (lower === 'active' || lower === 'approved' || lower === 'accept') return 'accepted';
  if (lower === 'inactive') return 'rejected';
  if (lower === 'completed' || lower === 'complete' || lower === 'completeed' || lower === 'done') {
    return 'pending';
  }

  return '';
}

function normalizeBidStatus(status) {
  return resolveBidApiStatus(status) || 'pending';
}

export function keepJobBidsForStatus(bids = [], requestedStatus) {
  const requested = resolveBidApiStatus(requestedStatus);

  return bids.filter((bid) => {
    if (!bid?.id) return false;
    if (!requested) {
      const api = String(bid.apiStatus || bid.apiStatus || bid.status || '').toLowerCase();
      return api !== 'deleted' && api !== 'delete';
    }
    return resolveBidApiStatus(bid.apiStatus || bid.apiStatus || bid.status) === requested;
  });
}

/**
 * UI status → PUT body status
 * accept → accepted (Bid enum; `active` is rejected by mongoose)
 * decline/reject → rejected (Postman: PUT web/care-home/job/bids/:id { "status": "rejected" })
 */
export function toCareHomeBidApiStatus(uiStatus) {
  return resolveBidApiStatus(uiStatus) || 'pending';
}

function resolvePartnerType(userType) {
  const raw = String(userType || '')
    .trim()
    .toLowerCase();
  if (raw === 'agency') return 'agency';
  if (raw === 'nurse' || raw === 'individual' || raw === 'worker') return 'individual';
  return raw || 'agency';
}

function normalizeSpecialities(...values) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => {
      if (value && typeof value === 'object') {
        return value.title || value.name || value.label || value.speciality || value.specialty || '';
      }
      return value;
    })
    .map((value) => String(value || '').trim())
    .filter((value, index, list) => value && list.indexOf(value) === index);
}

/** Prefer the first non-empty yyyy-MM-dd (or parseable) date among candidates. */
function firstDateKey(...values) {
  for (const value of values) {
    const key = toDateKey(value);
    if (key) return key;
  }
  return '';
}

/**
 * Bid payloads sometimes omit `shift.date` (empty object / id-only ref) while the
 * date still lives on snapshot schedules or top-level fields. Recover it so the
 * UI does not treat the bid as undated and drop it from date filters.
 */
function resolveBidShiftFields(item = {}, snapshot = {}) {
  const shiftObj =
    item.shift && typeof item.shift === 'object' && !Array.isArray(item.shift) ? item.shift : null;
  const snapshotShift =
    snapshot.shift && typeof snapshot.shift === 'object' && !Array.isArray(snapshot.shift)
      ? snapshot.shift
      : null;
  const scheduleLists = [
    Array.isArray(item.shift) ? item.shift : null,
    Array.isArray(snapshot.shift) ? snapshot.shift : null,
    Array.isArray(snapshot.shifts) ? snapshot.shifts : null,
    Array.isArray(item.shifts) ? item.shifts : null,
    Array.isArray(snapshot.schedules) ? snapshot.schedules : null,
    Array.isArray(item.schedules) ? item.schedules : null,
  ].filter(Boolean);

  let scheduleShift = null;
  for (const list of scheduleLists) {
    scheduleShift = list.find((entry) => entry && typeof entry === 'object') || null;
    if (scheduleShift) break;
  }

  const shift = shiftObj || snapshotShift || scheduleShift || {};

  const shiftDate = firstDateKey(
    shift.date,
    shift.startDate,
    shift.shiftDate,
    item.date,
    item.shiftDate,
    item.scheduleDate,
    snapshot.date,
    snapshot.shiftDate,
    scheduleShift?.date
  );

  return {
    shift,
    shiftId: pickId(shift._id, shift.id, item.shiftId, scheduleShift?._id, scheduleShift?.id),
    shiftDate,
    startTime: String(shift.startTime || scheduleShift?.startTime || item.startTime || '').trim(),
    endTime: String(shift.endTime || scheduleShift?.endTime || item.endTime || '').trim(),
  };
}

/**
 * Map GET `/web/care-home/job/bids` item → Job Bids card shape.
 * Keeps all useful API fields so the existing UI can render without removals.
 */
export function mapCareHomeJobBidFromApi(item = {}) {
  const user = item.user && typeof item.user === 'object' ? item.user : {};
  const snapshot = item.snapshot && typeof item.snapshot === 'object' ? item.snapshot : {};
  const type = item.type && typeof item.type === 'object' ? item.type : {};
  const location = snapshot.location && typeof snapshot.location === 'object' ? snapshot.location : {};
  const workStats = item.workStats && typeof item.workStats === 'object' ? item.workStats : {};
  const { shift, shiftId, shiftDate, startTime, endTime } = resolveBidShiftFields(item, snapshot);

  const id = pickId(item._id, item.id);
  const jobId = pickId(item.job, snapshot._id, snapshot.id);

  const totalPrice = Number(item.bid ?? item.totalPrice ?? 0) || 0;
  const totalHours = Number(item.totalHours ?? 0) || 0;
  const hourlyRate = Number(item.perHour ?? item.hourlyRate ?? 0) || (totalHours > 0 ? totalPrice / totalHours : 0) || 0;

  const weeklyHours = Number(user.weeklyHours ?? 0) || 0;
  const jobType = type.title || type.name || snapshot.name || (typeof item.type === 'string' ? item.type : '') || 'Job';

  const userType = user.accountState?.userType || '';
  const partnerType = resolvePartnerType(userType);
  const status = normalizeBidStatus(item.status);
  const userId = pickId(user._id, user.id, item.userId);
  const specialities = normalizeSpecialities(
    user.specialities,
    user.specialties,
    user.speciality,
    user.specialty,
    item.specialities,
    item.specialties,
    item.speciality,
    item.specialty
  );

  const agreedHourlyRate = Number(item.agreedHourlyRate ?? item.agreedRate?.hourlyRate ?? item.agreedRate?.rate ?? item.agreedRate ?? user.agreedHourlyRate ?? 0);

  const hasAgreedRate = Boolean(
    item.hasAgreedRate === true || item.isAgreedRate === true || user.hasAgreedRate === true || (item.agreedRate && typeof item.agreedRate === 'object') || agreedHourlyRate > 0
  );

  const autoAssignEligible = Boolean(item.autoAssignEligible ?? item.autoAssign ?? item.agreedRate?.autoAssign ?? false);

  return {
    id,
    _id: id,
    name: user.name || 'Bidder',
    partnerName: user.name || '',
    partnerType,
    avatarUrl: user.profileIcon || item.image || '',
    email: user.email || '',
    userType,
    userId,
    specialities,
    jobId,
    jobType,
    jobName: snapshot.name || jobType,
    jobImage: snapshot.image || item.image || '',
    jobAddress: location.fullAddress || '',
    jobStatus: String(snapshot.status || '').toLowerCase(),
    jobGender: snapshot.gender || '',
    jobDescription: String(snapshot.description || '').trim(),
    shiftId,
    shiftDate,
    shiftStartTime: startTime,
    shiftEndTime: endTime,
    shiftTime: startTime && endTime ? `Shift: ${startTime} - ${endTime}` : startTime || endTime || '',
    shiftBreak: Boolean(shift.isBreak),
    shiftBreakMin: Number(shift.breakMin) || 0,
    shiftStatus: String(shift.status || '').toLowerCase(),
    bookingId: pickId(item.booking, item.bookingId, shift.booking, shift.bookingId),
    description: String(item.note || snapshot.description || '').trim(),
    note: String(item.note || '').trim(),
    rating: Number(user.averageRating ?? 0) || 0,
    reviews: Number(user.totalReviews ?? 0) || 0,
    totalPrice,
    hourlyRate,
    perHour: hourlyRate,
    totalHours,
    weeklyHours,
    weeklyHoursAvailable: weeklyHours ? `${weeklyHours}h / week` : '',
    workStats,
    workStats_: Array.isArray(item.workStats_) ? item.workStats_ : [],
    status,
    apiStatus: resolveBidApiStatus(item.status) || String(item.status || '').toLowerCase(),
    timeAgo: fToNow(item.createdAt) || '',
    createdAt: item.createdAt || '',
    updatedAt: item.updatedAt || '',
    image: item.image || snapshot.image || '',
    hasAgreedRate,
    agreedHourlyRate: agreedHourlyRate > 0 ? agreedHourlyRate : null,
    autoAssignEligible,
    isFavorite: Boolean(item.isFavorite ?? user.isFavorite ?? false),
    needsCoverage: false,
    user,
    jobCreator: item.jobCreator || null,
    snapshot,
    type,
    location,
  };
}

/** Build job filter/group rows from bids when jobs list is incomplete. */
export function buildJobsFromCareHomeBids(bids = []) {
  const byId = new Map();

  bids.forEach((bid) => {
    const jobId = String(bid.jobId || '');
    if (!jobId || byId.has(jobId)) return;

    byId.set(jobId, {
      id: jobId,
      type: bid.jobName || bid.jobType || 'Job',
      name: bid.jobName || bid.jobType || 'Job',
      address: bid.jobAddress || '',
      image: bid.jobImage || bid.image || '',
      status: bid.jobStatus || 'active',
      gender: bid.jobGender || '',
      description: bid.jobDescription || '',
    });
  });

  return Array.from(byId.values());
}
