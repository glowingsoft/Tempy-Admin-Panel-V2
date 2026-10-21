import { format, isValid, parseISO } from 'date-fns';

import { fToNow } from 'src/utils/format-time';
import { formatShiftRowLabel } from 'src/components/jobs/job-date-filters';
import {
  normalizeLatLng,
  parseCoordinates,
  readApiLate,
  readApiLong,
} from 'src/sections/branches/geo-coordinates';
import { pickStoredMediaValue } from 'src/store/Reducer/upload-api';

export const SUPPLIER_JOB_STATUS_TABS = [
  { value: 'all', label: 'All', color: 'default' },
  { value: 'active', label: 'Active', color: 'info' },
  { value: 'inactive', label: 'Inactive', color: 'error' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'deleted', label: 'Deleted', color: 'default' },
];

export function parseJobsCount(raw = {}) {
  const source = raw?.JobsCount && typeof raw.JobsCount === 'object' ? raw.JobsCount : raw?.jobsCount && typeof raw.jobsCount === 'object' ? raw.jobsCount : raw || {};

  const keyMap = {
    total: 'all',
    all: 'all',
    active: 'active',
    inactive: 'inactive',
    completed: 'completed',
    deleted: 'deleted',
    urgent: 'next24Hours',
    next24h: 'next24Hours',
    next24hours: 'next24Hours',
    thisweek: 'thisWeek',
    nextweek: 'nextWeek',
  };

  const parsed = {};
  Object.entries(source).forEach(([key, value]) => {
    const normalized = String(key)
      .toLowerCase()
      .replace(/[_-\s]/g, '');
    if (normalized === 'pending') {
      parsed.inactive = (parsed.inactive || 0) + (Number(value) || 0);
      return;
    }
    const mapped = keyMap[normalized] || String(key).toLowerCase();
    parsed[mapped] = Number(value) || 0;
  });
  return parsed;
}

export function getSupplierJobApiStatus(job) {
  const raw = String(job?.apiStatus || '').toLowerCase();
  if (raw === 'delete') return 'deleted';
  if (raw === 'pending' || raw === 'draft') return 'inactive';
  if (['active', 'inactive', 'deleted', 'completed'].includes(raw)) return raw;
  return raw || 'active';
}

export function keepSupplierJobsForStatus(jobs = [], requestedStatus = '') {
  const requested = String(requestedStatus || '').toLowerCase();
  return jobs.filter((job) => {
    if (!job?.id) return false;
    const api = String(job.apiStatus || job.status || '').toLowerCase();
    if (!requested || requested === 'all') {
      return api !== 'deleted' && api !== 'delete' && job.status !== 'deleted';
    }
    if (requested === 'deleted') return api === 'deleted' || api === 'delete' || job.status === 'deleted';
    return api === requested;
  });
}


function pickNumber(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return null;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function getDistanceKm(from, to) {
  if (from?.latitude == null || from?.longitude == null || to?.latitude == null || to?.longitude == null) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}


export function extractLatLng(source, { allowZero = true } = {}) {
  if (!source || typeof source !== 'object') return null;

  const candidates = [source, source.location, source.basicInfo, source.basicInfo?.location, source.user, source.user?.location, source.data, source.data?.location].filter(
    Boolean
  );

  for (const node of candidates) {
    const parsed = parseCoordinates(node.coordinates);
    if (!parsed) continue;
    if (!allowZero && parsed.latitude === 0 && parsed.longitude === 0) continue;
    return { latitude: parsed.latitude, longitude: parsed.longitude };
  }

  for (const node of candidates) {
    const latDirect = pickNumber(readApiLate(node));
    const lngDirect = pickNumber(readApiLong(node));
    if (latDirect == null || lngDirect == null) continue;

    const normalized = normalizeLatLng(latDirect, lngDirect);
    if (!normalized) continue;
    if (!allowZero && normalized.latitude === 0 && normalized.longitude === 0) continue;
    return normalized;
  }

  return null;
}

export function getAgencyUserLatLng(user) {
  return extractLatLng(user, { allowZero: false });
}

export function formatDistanceAway(km) {
  const num = Number(km);
  if (km == null || km === '' || Number.isNaN(num)) return '';
  const text = Number.isInteger(num) ? num.toFixed(1) : String(Math.round(num * 100) / 100);
  return `${text} km away`;
}

function isUsablePoint(point) {
  if (!point) return false;
  const { latitude: lat, longitude: lng } = point;
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  return true;
}


export function getJobDistanceLabel(jobOrApiItem, origin) {
  const jobPoint =
    extractLatLng(jobOrApiItem, { allowZero: true }) ||
    (jobOrApiItem?.latitude != null && jobOrApiItem?.longitude != null
      ? {
          latitude: Number(jobOrApiItem.latitude),
          longitude: Number(jobOrApiItem.longitude),
        }
      : null);

  if (!isUsablePoint(jobPoint)) return '';

  const from = (isUsablePoint(origin) ? origin : null) || extractLatLng(jobOrApiItem?.branch, { allowZero: true });

  if (!isUsablePoint(from)) return '';

  if (from.latitude === jobPoint.latitude && from.longitude === jobPoint.longitude) {
    return formatDistanceAway(0);
  }

  return formatDistanceAway(getDistanceKm(from, jobPoint));
}

export function applyJobDistances(jobs = [], origin) {
  if (!isUsablePoint(origin)) return jobs;

  return jobs.map((job) => {
    const label = getJobDistanceLabel(job, origin);
    if (!label) return job;
    return { ...job, distance: label };
  });
}


const ZONED_INSTANT = /^\d{4}-\d{2}-\d{2}T[^Z]*[+-]\d{2}:?\d{2}$/;

function toDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string' && ZONED_INSTANT.test(value.trim())) return value.trim().slice(0, 10);
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

function mapPosterType(userType) {
  const type = String(userType || '').toLowerCase();
  if (!type) return undefined;
  if (type === 'carehome' || type === 'care_home' || type === 'hospital' || type === 'localauthority') {
    return 'care_home';
  }
  return type;
}

function mapBreakType(shift) {
  if (!shift || shift.isBreak == null) return '';
  return shift.isBreak ? 'Paid' : 'Unpaid';
}

function toMinutes(hhmm) {
  const [hours, minutes] = String(hhmm || '')
    .split(':')
    .map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}


function shiftInstants(shift) {
  const raw = typeof shift.date === 'string' ? shift.date.trim() : '';
  if (!ZONED_INSTANT.test(raw)) return { startsAt: null, endsAt: null };
  const startsAt = parseISO(raw).getTime();
  if (!Number.isFinite(startsAt)) return { startsAt: null, endsAt: null };

  const start = toMinutes(shift.startTime);
  const end = toMinutes(shift.endTime);
  if (start == null || end == null) return { startsAt, endsAt: null };
  const length = end > start ? end - start : end - start + 24 * 60;
  return { startsAt, endsAt: startsAt + length * 60000 };
}

function isTrueFlag(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

export function readHasAgreedRate(source) {
  if (!source || typeof source !== 'object') return false;
  return Object.entries(source).some(([key, value]) => {
    const name = key.toLowerCase().replace(/[_-]/g, '');
    return (name === 'hasagreedrate' || name === 'hasagreed' || name === 'isagreed' || name === 'isagreedrate') && isTrueFlag(value);
  });
}

function mapShiftRow(shift = {}) {
  const shiftDate = toDateKey(shift.date);
  const startTime = shift.startTime || '';
  const endTime = shift.endTime || '';
  const { startsAt, endsAt } = shiftInstants(shift);

  return {
    id: String(shift._id || shift.id || `${shiftDate}-${startTime}`),
    date: shiftDate,
    startTime,
    endTime,
    startsAt,
    endsAt,
    status: String(shift.status || '').toLowerCase(),
    isBreak: Boolean(shift.isBreak),
    breakMin: Number(shift.breakMin) || 0,
    breakType: mapBreakType(shift),
    isBiddingAllowed: shift.isBiddingAllowed !== false && shift.canBid !== false,
    hasAgreedRate: readHasAgreedRate(shift),
    allowedPersons: pickNumber(shift.allowedPersons),
    bookingId: String(shift.bookingId || shift.acceptedBookingId || shift.booking?._id || shift.booking?.id || (typeof shift.booking === 'string' ? shift.booking : '') || ''),
    bookingStatus: normalizeBookingStatus(shift.bookingStatus || shift.booking?.status),
    bookingAttendance: shift.booking?.attendance || shift.attendance || null,
    hourlyRate: pickNumber(shift.hourlyRate, shift.ratePerHour, shift.rate),
    totalPay: pickNumber(shift.totalPay, shift.totalPrice, shift.pay),
    label:
      shiftDate && startTime && endTime
        ? formatShiftRowLabel(shiftDate, startTime, endTime)
        : [shiftDate, startTime && endTime ? `${startTime} - ${endTime}` : ''].filter(Boolean).join(' · '),
  };
}

function refId(value) {
  return readPartyId(value);
}

export function readPartyId(value, depth = 0) {
  if (depth > 4 || value == null || value === '') return '';
  if (typeof value !== 'object') {
    const text = String(value).trim();
    return /^[a-fA-F0-9]{24}$/.test(text) ? text : '';
  }

  const direct = [value._id, value.id, value.userId]
    .map((item) => readPartyId(item, depth + 1))
    .find(Boolean);
  if (direct) return direct;

  if (value.basicInfo && typeof value.basicInfo === 'object') {
    const nested = readPartyId(value.basicInfo, depth + 1);
    if (nested) return nested;
  }

  if (value.user && value.user !== value) {
    const nested = readPartyId(value.user, depth + 1);
    if (nested) return nested;
  }

  return '';
}

function readKeyedPartyId(source, names) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return '';
  const wanted = new Set(names);
  for (const [key, value] of Object.entries(source)) {
    const name = key.toLowerCase().replace(/[_-]/g, '');
    if (!wanted.has(name)) continue;
    const id = readPartyId(value);
    if (id) return id;
  }
  return '';
}

export function readJobCustomerId(job = {}) {
  if (!job || typeof job !== 'object') return '';
  const raw = job.raw && typeof job.raw === 'object' ? job.raw : job;
  return (
    readPartyId(job.postedBy?.id) ||
    readPartyId(job.customerId) ||
    readKeyedPartyId(raw, ['user', 'customer', 'createdby', 'jobcreator', 'employer', 'owner', 'poster', 'client', 'userid', 'customerid']) ||
    readKeyedPartyId(job, ['user', 'customer', 'createdby', 'jobcreator', 'employer', 'owner', 'poster', 'client', 'userid', 'customerid']) ||
    ''
  );
}

export function readJobRoleId(job = {}) {
  if (!job || typeof job !== 'object') return '';
  const raw = job.raw && typeof job.raw === 'object' ? job.raw : job;
  return (
    readPartyId(job.jobTypeId) ||
    readPartyId(job.typeId) ||
    readPartyId(job.jobType) ||
    readKeyedPartyId(raw, ['type', 'jobtype', 'jobrole', 'typeid', 'jobroleid', 'role']) ||
    readKeyedPartyId(job, ['type', 'jobtype', 'jobrole', 'typeid', 'jobroleid']) ||
    ''
  );
}


function applyShiftOwnership(item, shiftRows) {
  const hasOwnership = 'myBooking' in item || 'myBid' in item;
  if (!hasOwnership) return shiftRows;

  const myBooking = item.myBooking && typeof item.myBooking === 'object' ? item.myBooking : null;
  const myBid = item.myBid && typeof item.myBid === 'object' ? item.myBid : null;
  const onRow = (ref, row) => {
    const shiftId = refId(ref?.shift);
    return !shiftId || shiftId === row.id;
  };

  return shiftRows.map((row) => {
    const bookingHere = myBooking && onRow(myBooking, row) ? myBooking : null;
    const bidAcceptedHere = myBid && onRow(myBid, row) && String(myBid.status || '').toLowerCase() === 'accepted';

    return {
      ...row,
      mine: Boolean(bookingHere || bidAcceptedHere),
      bookingId: row.bookingId || refId(bookingHere),
      bookingStatus: row.bookingStatus || normalizeBookingStatus(bookingHere?.status),
      bookingAttendance: row.bookingAttendance || bookingHere?.attendance || null,
    };
  });
}

export function resolveShiftRowTabStatus(apiJobStatus, row = {}) {
  const base = mapShiftTabStatus(apiJobStatus, row.status);
  if (row.mine === false && base === 'active') return 'new';
  if (row.mine === true && base === 'new') return 'active';
  return base;
}

export function mapShiftTabStatus(apiJobStatus, shiftStatus) {
  const apiStatus = String(apiJobStatus || '').toLowerCase();
  if (apiStatus === 'deleted' || apiStatus === 'delete') return 'deleted';
  if (apiStatus === 'inactive' || apiStatus === 'completed' || apiStatus === 'previous') {
    return 'previous';
  }

  const status = String(shiftStatus || '').toLowerCase();
  if (status === 'booked' || status === 'assigned' || status === 'accepted') return 'active';
  if (status === 'completed' || status === 'cancelled' || status === 'canceled') return 'previous';
  return 'new';
}

function pickRawDistance(source = {}) {
  if (!source || typeof source !== 'object') return undefined;

  const named = ['distance', 'distanceKm', 'distanceInKm', 'distanceInKM', 'distanceINKM', 'distance_km', 'km', 'distanceAway'];
  for (const key of named) {
    if (source[key] != null && source[key] !== '') return source[key];
  }

  const matched = Object.keys(source).find((key) => {
    const normalized = key.toLowerCase().replace(/_/g, '');
    return normalized === 'distanceinkm' || normalized === 'distancekm' || normalized === 'distance';
  });
  if (matched && source[matched] != null && source[matched] !== '') return source[matched];
  return undefined;
}

function pickDistanceLabel(item = {}, location = {}) {
  const raw = pickRawDistance(item) ?? pickRawDistance(location);
  if (raw == null || raw === '') return '';

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/km|mi|away/i.test(trimmed)) return trimmed;
    const num = Number(trimmed);
    if (!Number.isNaN(num)) return formatDistanceAway(num);
    return trimmed;
  }

  return formatDistanceAway(raw);
}

function pickHourlyRate(item = {}, primaryShift = null) {
  return pickNumber(
    item.hourlyRate,
    item.ratePerHour,
    item.rate,
    item.pricePerHour,
    item.perHour,
    item.hourRate,
    item.payPerHour,
    item.type?.hourlyRate,
    item.type?.ratePerHour,
    primaryShift?.hourlyRate,
    primaryShift?.ratePerHour,
    primaryShift?.rate
  );
}

function appendUniqueAddressParts(base, parts = []) {
  const start = String(base || '').trim();
  const lower = start.toLowerCase();
  const extras = parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .filter((part) => !lower.includes(part.toLowerCase()));

  return [start, ...extras].filter(Boolean).join(', ');
}

export function formatJobDisplayAddress(location = {}, branch = {}) {
  const loc = location && typeof location === 'object' ? location : {};
  const branchLoc = branch?.location && typeof branch.location === 'object' ? branch.location : {};

  const street = loc.fullAddress || loc.address || loc.street || loc.streetAddress || branchLoc.fullAddress || branchLoc.address || '';

  return appendUniqueAddressParts(street, [
    loc.city || branchLoc.city,
    loc.state || loc.region || branchLoc.state,
    loc.postalCode || loc.zipCode || loc.zip || branchLoc.postalCode,
    loc.country || branchLoc.country,
  ]);
}

export const BOOKING_STATUSES = ['pending', 'active', 'inProgress', 'completed', 'cancelledByWorker', 'cancelledByEmployer', 'cancelledByUser'];

export function normalizeBookingStatus(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase();
  return BOOKING_STATUSES.find((status) => status.toLowerCase() === raw) || '';
}

function pickBookingDoc(item = {}, shift = {}) {
  const candidates = [item.myBooking, item.booking, item.bookings?.[0], item.acceptedBid?.booking, item.bid?.booking, shift?.booking];
  return candidates.find((booking) => booking && typeof booking === 'object' && booking.attendance) || null;
}

function pickBookingStatus(item = {}, shift = {}) {
  const candidates = [
    item.myBooking?.status,
    item.bookingStatus,
    item.booking?.status,
    item.bookings?.[0]?.status,
    item.acceptedBid?.booking?.status,
    item.bid?.booking?.status,
    shift?.bookingStatus,
    shift?.booking?.status,
  ];
  return candidates.map(normalizeBookingStatus).find(Boolean) || '';
}

export function resolveSupplierBookingAction(bookingId, bookingStatus) {
  if (bookingStatus === 'cancelledByWorker') return 'reassign';
  if (!String(bookingId || '').trim()) return 'assignStaff';
  if (bookingStatus === 'pending') return 'awaitingWorker';
  return 'assigned';
}

export function mapAgencyJobFromApi(item = {}, { origin } = {}) {
  const id = String(item._id || item.id || '');
  const location = item.location || {};
  const jobPoint = extractLatLng(item, { allowZero: true }) || { latitude: null, longitude: null };
  const user =
    (item.user && typeof item.user === 'object' ? item.user : null) ||
    (item.jobCreator && typeof item.jobCreator === 'object' ? item.jobCreator : null) ||
    (item.createdBy && typeof item.createdBy === 'object' ? item.createdBy : null) ||
    {};
  const jobType = item.type && typeof item.type === 'object' ? item.type : {};
  const typeTitle = (typeof item.type === 'string' && item.type.trim()) || String(jobType.title || jobType.name || item.jobTitle || item.title || '').trim();
  const customName = String(item.name || '').trim();
  const description = String(item.description || item.jobDescription || item.details || item.about || '').trim();
  const title = String(customName || typeTitle || '').trim() || 'Job';
  const jobTypeTitle = typeTitle && customName && customName !== typeTitle ? typeTitle : '';
  const role = jobTypeTitle || jobType.department || '';
  const branch = item.branch || {};
  const shifts = Array.isArray(item.shift) ? item.shift : [];
  const shiftRows = applyShiftOwnership(item, shifts.map(mapShiftRow));
  const primaryShift = shiftRows[0];
  const tabStatus = resolveShiftRowTabStatus(item.status, primaryShift);

  const hourlyRate = pickHourlyRate(item, primaryShift);
  const totalPay = pickNumber(item.totalPay, item.totalPrice, item.pay, primaryShift?.totalPay);

  const address = formatJobDisplayAddress(location, branch);

  const ratingObj = item.rating && typeof item.rating === 'object' ? item.rating : null;
  const rating = pickNumber(item.averageRating, ratingObj?.averageRating, user.averageRating, typeof item.rating === 'number' ? item.rating : null);
  const reviewCount = pickNumber(item.totalReviews, ratingObj?.totalReviews, user.totalReviews, item.reviewCount, item.reviewsCount);

  let distance = pickDistanceLabel(item, location);
  if (!distance) {
    distance = getJobDistanceLabel(
      {
        location,
        latitude: jobPoint.latitude,
        longitude: jobPoint.longitude,
        branch,
      },
      origin || null
    );
  }

  const bookingId = String(
    refId(item.myBooking) ||
      item.bookingId ||
      item.acceptedBookingId ||
      item.latestBookingId ||
      item.currentBookingId ||
      item.booking?._id ||
      item.booking?.id ||
      (typeof item.booking === 'string' ? item.booking : '') ||
      item.bookings?.[0]?._id ||
      item.bookings?.[0]?.id ||
      (typeof item.bookings?.[0] === 'string' ? item.bookings[0] : '') ||
      item.acceptedBid?.bookingId ||
      item.acceptedBid?.booking?._id ||
      item.acceptedBid?.booking?.id ||
      item.bid?.bookingId ||
      item.bid?.booking?._id ||
      primaryShift?.bookingId ||
      ''
  );

  const bookingStatus = pickBookingStatus(item, shifts[0]);
  const bookingDoc = pickBookingDoc(item, shifts[0]);
  const bookingAttendance = bookingDoc?.attendance || null;
  const assignedWorker =
    (bookingDoc?.worker && typeof bookingDoc.worker === 'object' ? bookingDoc.worker : null) ||
    (bookingDoc?.staff && typeof bookingDoc.staff === 'object' ? bookingDoc.staff : null) ||
    (bookingDoc?.nurse && typeof bookingDoc.nurse === 'object' ? bookingDoc.nurse : null) ||
    (item.myBooking?.worker && typeof item.myBooking.worker === 'object' ? item.myBooking.worker : null) ||
    null;
  const assignedStaff = assignedWorker
    ? [
        {
          id: String(assignedWorker._id || assignedWorker.id || '').trim(),
          name: String(assignedWorker.name || '').trim() || 'Staff',
          avatarUrl: assignedWorker.profileIcon || assignedWorker.avatarUrl || '',
        },
      ].filter((member) => member.id)
    : [];

  return {
    id,
    _id: id,
    status: tabStatus,
    apiStatus: String(item.status || '').toLowerCase(),
    bookingId,
    bookingStatus,
    bookingAttendance,
    title,
    role,
    jobTypeTitle,
    typeTitle,
    department: jobType.department || '',
    shiftType: shiftRows.length > 1 ? 'Multi Shift' : shiftRows.length === 1 ? 'Single Shift' : '',
    distance,
    latitude: jobPoint.latitude,
    longitude: jobPoint.longitude,
    hourlyRate,
    totalPay,
    breakType: mapBreakType(primaryShift || shifts[0]),
    breakMin: Number(primaryShift?.breakMin ?? item.breakMin) || 0,
    gender: item.gender || '',
    description,
    careNotes: String(item.careNotes || item.notes || '').trim(),
    instructions: String(item.instructions || item.specialInstructions || '').trim(),
    contactName: String(item.contactName || item.contactDetails?.name || item.clientContact?.name || '').trim(),
    contactPhone: String(item.contactPhone || item.contactDetails?.phone || item.clientContact?.phone || item.phone || '').trim(),
    contactEmail: String(item.contactEmail || item.contactDetails?.email || item.clientContact?.email || '').trim(),
    emergencyName: String(item.emergencyName || item.emergencyContact?.name || '').trim(),
    emergencyPhone: String(item.emergencyPhone || item.emergencyContact?.phone || '').trim(),
    emergencyRelation: String(item.emergencyRelation || item.emergencyContact?.relationship || '').trim(),
    careDocuments: Array.isArray(item.documents || item.careDocuments) ? item.documents || item.careDocuments : [],
    address,
    image: pickStoredMediaValue(item.image),
    postedAt: formatPostedAt(item.createdAt),
    createdAt: item.createdAt || '',
    postedBy: {
      id: String(
        refId(user) ||
          refId(item.user) ||
          refId(item.customer) ||
          refId(item.createdBy) ||
          refId(item.jobCreator) ||
          item.userId ||
          item.customerId ||
          ''
      ).trim(),
      name: user.name || branch.name || '',
      avatarUrl: user.profileIcon || '',
      type: mapPosterType(user.accountState?.userType),
      email: user.email || '',
      rating: rating ?? 0,
      reviewCount: reviewCount ?? 0,
    },
    rating: rating ?? 0,
    reviewCount: reviewCount ?? 0,
    bidsCount: Number(item.bidsCount ?? 0) || 0,
    isSpecial: Boolean(item.isSpecial),
    hasAgreedRate: readHasAgreedRate(item) || shifts.some((shift) => readHasAgreedRate(shift)),
    requestFromCareHome: Boolean(
      item.requestFromCareHome || item.isDirectRequest || item.directRequest || item.isRequest || item.isSpecial || String(item.requestType || '').toLowerCase() === 'direct'
    ),
    branch: branch?._id || branch?.name ? branch : null,
    jobType,
    customerId: readJobCustomerId(item),
    jobTypeId: readJobRoleId(item),
    shiftDate: primaryShift?.date || '',
    shiftStartTime: primaryShift?.startTime || '',
    shiftEndTime: primaryShift?.endTime || '',
    shiftRows,
    schedule: primaryShift?.label || '',
    schedules: shiftRows.map((row) => row.label).filter(Boolean),
    assignedStaff,
    actionType: tabStatus === 'active' ? resolveSupplierBookingAction(bookingId, bookingStatus) : undefined,
    raw: item,
  };
}
