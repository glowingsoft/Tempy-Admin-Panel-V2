import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

import { parseCoordinates, readApiLate, readApiLong, toApiCoordinates } from 'src/sections/branches/geo-coordinates';
import { normalizeBookingStatus } from 'src/sections/agency/jobs/agency-job-api-utils';

/** Staff-member check-in / check-out — PUT + GET logs only (no booking list). */

function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = value._id || value.id || value.$oid;
      if (nested && typeof nested === 'object') {
        const deep = nested._id || nested.id || nested.$oid;
        if (deep) return String(deep);
        continue;
      }
      if (nested) return String(nested);
      continue;
    }
    return String(value);
  }
  return '';
}

function normalizeLabel(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function extractNurseBookingsList(payload, depth = 0) {
  if (!payload || depth > 5) return [];
  if (Array.isArray(payload)) {
    return payload.filter((item) => item && typeof item === 'object');
  }
  if (typeof payload !== 'object') return [];

  if (payload._id && (payload.job || payload.shift || payload.worker || payload.bid || payload.bookingId)) {
    return [payload];
  }

  const keys = ['data', 'bookings', 'booking', 'docs', 'items', 'results', 'records', 'rows', 'list'];
  for (const key of keys) {
    const found = extractNurseBookingsList(payload[key], depth + 1);
    if (found.length) return found;
  }
  return [];
}

export function isMongoBookingId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || '').trim());
}

/**
 * Prefer real booking fields only (no job/shift fallback).
 */
export function pickBookingIdOnly(job) {
  const raw = job?.raw && typeof job.raw === 'object' ? job.raw : {};
  const id = pickId(
    job?.bookingId,
    job?.acceptedBookingId,
    job?.latestBookingId,
    job?.currentBookingId,
    job?.booking,
    job?.bookings?.[0],
    job?.acceptedBid?.bookingId,
    job?.acceptedBid?.booking,
    job?.bid?.bookingId,
    job?.bid?.booking,
    job?.shiftRows?.[0]?.bookingId,
    job?.shiftRows?.[0]?.acceptedBookingId,
    job?.shiftRows?.[0]?.booking,
    raw.bookingId,
    raw.acceptedBookingId,
    raw.latestBookingId,
    raw.currentBookingId,
    raw.booking,
    raw.bookings?.[0],
    raw.acceptedBid?.bookingId,
    raw.acceptedBid?.booking,
    raw.bid?.bookingId,
    raw.bid?.booking
  );
  return isMongoBookingId(id) ? id : '';
}

export function mapNurseBookingFromApi(item = {}) {
  const id = pickId(item._id, item.id, item.bookingId, item.booking);
  const job = item.job && typeof item.job === 'object' ? item.job : {};
  const shift = item.shift && typeof item.shift === 'object' ? item.shift : {};
  const bid = item.bid && typeof item.bid === 'object' ? item.bid : {};
  const jobType = job.type && typeof job.type === 'object' ? job.type : {};
  const location = (job.location && typeof job.location === 'object' ? job.location : null) || (shift.location && typeof shift.location === 'object' ? shift.location : null) || {};

  const dateRaw = shift.date || item.date || item.shiftDate || item.startDate || '';
  let shiftDate = '';
  if (dateRaw) {
    try {
      const d = typeof dateRaw === 'string' && dateRaw.length >= 10 ? dateRaw.slice(0, 10) : '';
      shiftDate = d || String(dateRaw).slice(0, 10);
    } catch {
      shiftDate = String(dateRaw).slice(0, 10);
    }
  }

  const startTime = String(shift.startTime || item.startTime || '').slice(0, 5);
  const endTime = String(shift.endTime || item.endTime || '').slice(0, 5);
  const worker = item.worker && typeof item.worker === 'object' ? item.worker : {};
  const workerId = pickId(item.worker, item.workerId, worker._id, worker.id, item.user, item.userId);

  return {
    id: isMongoBookingId(id) ? id : '',
    jobId: pickId(job._id, job.id, item.jobId, item.job, item.jobRef),
    shiftId: pickId(shift._id, shift.id, item.shiftId, item.shift),
    bidId: pickId(bid._id, bid.id, item.bidId, item.bid),
    workerId,
    title: String(job.name || job.title || jobType.title || item.jobTitle || item.title || item.name || '').trim(),
    shiftDate,
    shiftStartTime: startTime,
    shiftEndTime: endTime,
    address: String(location.fullAddress || item.address || item.location || '').trim(),
    status: String(item.status || shift.status || 'accepted').toLowerCase(),
    // Raw `attendance` block — proof pictures / signatures for the attendance dialog.
    attendance: item.attendance && typeof item.attendance === 'object' ? item.attendance : null,
    raw: item,
  };
}

/**
 * The nurse's own booking for the shift a card shows — matched on that exact shift (or the bid
 * behind it), never on the job or its title: a multi-shift job, or another job with the same
 * title, would otherwise lend its booking (status, attendance, Check In) to the wrong card.
 * Live bookings win over cancelled ones.
 */
export function findNurseBookingForShift(bookings = [], job, bid) {
  const list = (Array.isArray(bookings) ? bookings : []).filter((row) => row?.id);
  const jobId = String(job?.id || job?._id || job?.jobId || '').trim();
  const shiftId = String(job?.shiftRows?.[0]?.id || job?.shiftRows?.[0]?._id || job?.shiftId || '').trim();
  const bidId = String(bid?.id || bid?._id || '').trim();

  const sameJob = (row) => !jobId || !row.jobId || String(row.jobId) === jobId;
  const byLiveFirst = (rows) =>
    rows.find(
      (row) =>
        !String(row.status || '')
          .toLowerCase()
          .startsWith('cancel')
    ) ||
    rows[0] ||
    null;

  if (shiftId) {
    const match = byLiveFirst(list.filter((row) => row.shiftId && String(row.shiftId) === shiftId && sameJob(row)));
    if (match) return match;
  }
  if (bidId) {
    const match = byLiveFirst(list.filter((row) => row.bidId && String(row.bidId) === bidId));
    if (match) return match;
  }
  return null;
}

export function matchNurseBookingId(bookings = [], job, bid) {
  return findNurseBookingForShift(bookings, job, bid)?.id || '';
}

export function pickBookingIdFromBid(bid) {
  if (!bid) return '';
  return pickBookingIdOnly({
    bookingId: bid.bookingId,
    acceptedBookingId: bid.acceptedBookingId,
    booking: bid.booking,
    bookings: bid.bookings,
    raw: bid.raw,
  });
}

export function findStaffBidForJob(bids = [], job) {
  const list = Array.isArray(bids) ? bids : [];
  const jobId = String(job?.id || job?._id || '').trim();
  const shiftId = String(job?.shiftRows?.[0]?.id || job?.shiftRows?.[0]?._id || '').trim();
  const title = normalizeLabel(job?.title || job?.role || '');

  return (
    list.find((bid) => shiftId && String(bid?.shiftId || '') === shiftId) ||
    list.find((bid) => jobId && String(bid?.jobId || bid?.job || '') === jobId) ||
    list.find((bid) => title && normalizeLabel(bid?.jobTitle) === title) ||
    null
  );
}

/**
 * Id for PUT /app/nurse/booking/:id and GET /logs/:bookingId.
 */
export function getCheckInId(job) {
  return pickBookingIdOnly(job);
}

/** @deprecated use getCheckInId */
export function getBookingId(job) {
  return getCheckInId(job);
}

/** Pull booking _id from POST /web/.../booking response. */
export function extractBookingIdFromResponse(response) {
  const data = response?.data ?? response ?? {};
  const nested = data.data && typeof data.data === 'object' ? data.data : {};
  const id = pickId(
    data.bookingId,
    data.acceptedBookingId,
    data.booking?._id,
    data.booking?.id,
    nested.bookingId,
    nested.acceptedBookingId,
    nested.booking?._id,
    nested.booking?.id,
    nested._id,
    nested.id,
    data._id,
    data.id
  );
  return isMongoBookingId(id) ? id : '';
}

/** Job pin for radius check — browser GPS is often far from the shift location. */
export function getJobCheckInPoint(job) {
  const parsed = parseCoordinates(job?.raw?.location?.coordinates || job?.location?.coordinates);
  const lat = Number(readApiLate(job) ?? readApiLate(job?.raw) ?? parsed?.latitude);
  const lng = Number(readApiLong(job) ?? readApiLong(job?.raw) ?? parsed?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
}

export function buildCheckInOutBody({ status, location, proofPicture, signature }) {
  const lat = Number(readApiLate(location));
  const lng = Number(readApiLong(location));
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const body = {
    status: String(status || '').toLowerCase() === 'checkout' ? 'checkout' : 'checkin',
  };

  if (hasCoords) {
    body.location = {
      type: 'Point',
      coordinates: toApiCoordinates(lat, lng),
    };
  }

  if (body.status === 'checkin' || body.status === 'checkout') {
    if (proofPicture) body.proofPicture = proofPicture;
    if (signature) body.signature = signature;
  }

  return body;
}

export function dataUrlToFile(dataUrl, filename = 'upload.jpg') {
  const raw = String(dataUrl || '');
  if (!raw.startsWith('data:')) return null;

  const [header, data] = raw.split(',');
  if (!data) return null;

  const mime = header.match(/data:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);

  const ext = mime.includes('png') ? 'png' : 'jpg';
  const name = filename.includes('.') ? filename : `${filename}.${ext}`;
  return new File([bytes], name, { type: mime });
}

export async function compressImageDataUrl(dataUrl, { maxEdge = 640, quality = 0.55 } = {}) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) return dataUrl;

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(image.width || 1, image.height || 1));
      const width = Math.max(1, Math.round((image.width || 1) * scale));
      const height = Math.max(1, Math.round((image.height || 1) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

function normalizeLogStatus(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_\s-]/g, '');
}

/** Accept ISO string or nested `{ createdAt }` from booking logs. */
function pickTimestamp(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number') {
    const asDate = new Date(value);
    return Number.isNaN(asDate.getTime()) ? null : value;
  }
  if (typeof value === 'object') {
    return (
      pickTimestamp(value.createdAt) ||
      pickTimestamp(value.time) ||
      pickTimestamp(value.timestamp) ||
      pickTimestamp(value.date) ||
      pickTimestamp(value.at) ||
      pickTimestamp(value.checkIn) ||
      pickTimestamp(value.checkOut) ||
      null
    );
  }
  return null;
}

/**
 * First usable image. The booking list sends what was stored (a full URL or a bare file key);
 * the logs endpoint turns an empty field into the `noimage.png` placeholder, which is no image.
 */
function pickUrl(...values) {
  for (const value of values) {
    const raw = typeof value === 'string' ? value.trim() : '';
    if (!raw || /(^|\/)noimage\.png(\?|$)/i.test(raw)) continue;
    const url = resolveProfileAssetUrl(raw);
    if (url && /^(https?:|data:|blob:|\/)/i.test(url)) return url;
  }
  return '';
}

export const EMPTY_ATTENDANCE = {
  checkInAt: null,
  checkOutAt: null,
  checkInProof: '',
  checkInSignature: '',
  checkOutProof: '',
  checkOutSignature: '',
  checkInPoint: null,
  checkOutPoint: null,
  checkOutReason: '',
  autoCheckedOut: false,
  bookingStatus: '',
};

/** API point `{ coordinates: [long, lat] }` → `{ lat, lng }`, or null. */
function pickPoint(value) {
  const parsed = parseCoordinates(value?.coordinates);
  if (parsed && !(parsed.latitude === 0 && parsed.longitude === 0)) {
    return { lat: parsed.latitude, lng: parsed.longitude };
  }

  const lat = Number(readApiLate(value));
  const lng = Number(readApiLong(value));
  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    return { lat, lng };
  }

  return null;
}

/** Booking `attendance` block → the flat shape the Active cards read. */
export function mapAttendanceBlock(attendance) {
  if (!attendance || typeof attendance !== 'object') return null;
  return {
    ...EMPTY_ATTENDANCE,
    checkInAt: pickTimestamp(attendance.checkIn) || pickTimestamp(attendance.checkInAt) || null,
    checkOutAt: pickTimestamp(attendance.checkOut) || pickTimestamp(attendance.checkOutAt) || null,
    checkInProof: pickUrl(attendance.proofPicture, attendance.checkInProofPicture, attendance.checkInProof),
    checkInSignature: pickUrl(attendance.signature, attendance.checkInSignature),
    checkOutProof: pickUrl(attendance.checkOutProofPicture, attendance.checkOutProof),
    checkOutSignature: pickUrl(attendance.checkOutSignature, attendance.checkOutSign),
    checkInPoint: pickPoint(attendance.checkInLocation),
    checkOutPoint: pickPoint(attendance.checkOutLocation),
    checkOutReason: String(attendance.checkOutReason || '').trim(),
    autoCheckedOut: Boolean(attendance.autoCheckedOut),
  };
}

/** Keep every value we already have — a later call often carries check-out fields only. */
export function mergeAttendance(previous, next) {
  const before = previous || EMPTY_ATTENDANCE;
  const after = next || EMPTY_ATTENDANCE;
  return {
    checkInAt: after.checkInAt || before.checkInAt || null,
    checkOutAt: after.checkOutAt || before.checkOutAt || null,
    checkInProof: after.checkInProof || before.checkInProof || '',
    checkInSignature: after.checkInSignature || before.checkInSignature || '',
    checkOutProof: after.checkOutProof || before.checkOutProof || '',
    checkOutSignature: after.checkOutSignature || before.checkOutSignature || '',
    checkInPoint: after.checkInPoint || before.checkInPoint || null,
    checkOutPoint: after.checkOutPoint || before.checkOutPoint || null,
    checkOutReason: after.checkOutReason || before.checkOutReason || '',
    autoCheckedOut: Boolean(after.autoCheckedOut || before.autoCheckedOut),
    bookingStatus: after.bookingStatus || before.bookingStatus || '',
  };
}

/** Anything worth opening the attendance dialog for. */
export function hasAttendanceRecord(attendance) {
  return Boolean(attendance?.checkInAt || attendance?.checkOutAt || hasAttendanceProof(attendance));
}

export function hasAttendanceProof(attendance) {
  return Boolean(attendance?.checkInProof || attendance?.checkInSignature || attendance?.checkOutProof || attendance?.checkOutSignature);
}

/**
 * PUT /app/nurse/booking/:id?checkinCheckout=true → attendance + the booking's new status.
 * The updated booking is the freshest source, so the card can flip without a page refresh.
 */
export function mapBookingUpdateResponse(response) {
  const root = response?.data ?? response ?? {};
  const booking = root.data && typeof root.data === 'object' ? root.data : root;
  return {
    ...(mapAttendanceBlock(booking.attendance) || EMPTY_ATTENDANCE),
    bookingStatus: normalizeBookingStatus(booking.status),
  };
}

/** GET /app/nurse/booking/logs/:bookingId → attendance times + proof / signature urls */
export function mapBookingLogs(response) {
  const raw = response?.data ?? response ?? {};
  const list = Array.isArray(raw) ? raw : Array.isArray(raw.logs) ? raw.logs : Array.isArray(raw.data) ? raw.data : [];

  let result = mergeAttendance(
    {
      ...EMPTY_ATTENDANCE,
      checkInAt: pickTimestamp(raw.checkInAt) || pickTimestamp(raw.checkinAt) || pickTimestamp(raw.checkIn) || null,
      checkOutAt: pickTimestamp(raw.checkOutAt) || pickTimestamp(raw.checkoutAt) || pickTimestamp(raw.checkOut) || null,
      bookingStatus: normalizeBookingStatus(raw.bookingStatus || raw.booking?.status),
    },
    mapAttendanceBlock(raw.attendance)
  );

  list.forEach((log) => {
    if (!log || typeof log !== 'object') return;

    const status = normalizeLogStatus(log.status || log.type || log.action);
    const at =
      pickTimestamp(log.createdAt) ||
      pickTimestamp(log.time) ||
      pickTimestamp(log.timestamp) ||
      pickTimestamp(log.date) ||
      pickTimestamp(log.checkIn) ||
      pickTimestamp(log.checkOut);

    const fromLog = mapAttendanceBlock(log.attendance) || { ...EMPTY_ATTENDANCE };

    if (status === 'checkin' || status === 'in' || status === 'checkedin') {
      fromLog.checkInAt = fromLog.checkInAt || at || null;
      fromLog.checkInProof = fromLog.checkInProof || pickUrl(log.proofPicture, log.picture, log.image);
      fromLog.checkInSignature = fromLog.checkInSignature || pickUrl(log.signature);
    }

    if (status === 'checkout' || status === 'out' || status === 'checkedout') {
      fromLog.checkOutAt = fromLog.checkOutAt || at || null;
      fromLog.checkOutProof = fromLog.checkOutProof || pickUrl(log.checkOutProofPicture, log.proofPicture, log.picture, log.image);
      fromLog.checkOutSignature = fromLog.checkOutSignature || pickUrl(log.checkOutSignature, log.signature);
    }

    // Earlier logs only fill gaps — what we already resolved stays.
    result = mergeAttendance(fromLog, result);
  });

  return result;
}
