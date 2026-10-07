import { format, isValid, parseISO } from 'date-fns';

import { fToNow } from 'src/utils/format-time';
import { formatShiftRowLabel } from 'src/components/jobs/job-date-filters';
import { computeHourlyRate } from './bids-actions';

// ----------------------------------------------------------------------

function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = value._id || value.id || value.$oid;
      if (nested == null || nested === '') continue;
      if (typeof nested === 'object') {
        const deep = nested._id || nested.id || nested.$oid;
        if (deep != null && deep !== '') return String(deep);
        continue;
      }
      return String(nested);
    }
    return String(value);
  }
  return '';
}

/** Pick bid document id from raw API item (shallow). */
export function pickBidDocumentId(item = {}) {
  if (!item || typeof item !== 'object') return '';
  return pickId(item._id, item.id, item.bidId, item.bid_id);
}

/**
 * Unwrap POST/GET payloads that nest the bid doc under data / bid / result / etc.
 * Returns the first object that has a real document id.
 */
export function unwrapBidDocument(response) {
  if (!response || typeof response !== 'object') return null;

  const queue = [response];
  const seen = new Set();

  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== 'object' || seen.has(cur)) continue;
    seen.add(cur);

    if (!Array.isArray(cur)) {
      const id = pickBidDocumentId(cur);
      if (id) return cur;
    }

    const nestedKeys = ['data', 'bid', 'result', 'record', 'doc', 'item', 'payload'];
    for (const key of nestedKeys) {
      const val = cur[key];
      if (val && typeof val === 'object') queue.push(val);
    }

    if (Array.isArray(cur)) {
      for (const item of cur) {
        if (item && typeof item === 'object') queue.push(item);
      }
    }
    if (Array.isArray(cur.data)) {
      for (const item of cur.data) {
        if (item && typeof item === 'object') queue.push(item);
      }
    }
    if (Array.isArray(cur.bids)) {
      for (const item of cur.bids) {
        if (item && typeof item === 'object') queue.push(item);
      }
    }
  }

  // Fallback: plain data object even without id (for mapping fields)
  if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
    return response.data;
  }
  return response;
}

/** Pick shift id from raw API item. */
export function pickBidShiftId(item = {}) {
  if (!item || typeof item !== 'object') return '';
  const shift = item.shift;
  if (shift && typeof shift === 'object') {
    return pickId(shift._id, shift.id);
  }
  return pickId(item.shiftId, item.shift_id, shift);
}

/** True when value looks like a real server bid id (not a local placeholder / shift date key). */
export function isServerBidId(id) {
  if (id == null || id === '') return false;
  const s = String(id).trim();
  if (!s) return false;
  if (s.startsWith('local-') || s.startsWith('shift-bid-')) return false;
  // Synthetic shift keys like "2026-07-23-09:00" must NOT count as bid ids
  if (/^\d{4}-\d{2}-\d{2}/.test(s) || s.includes(':')) return false;
  // Mongo ObjectId
  if (/^[a-f\d]{24}$/i.test(s)) return true;
  // UUID
  if (/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(s)) return true;
  // Other opaque server ids (no spaces)
  return s.length >= 12 && !/\s/.test(s);
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

function formatSubmittedAt(value) {
  if (!value) return '';
  try {
    return fToNow(value) || '';
  } catch {
    return '';
  }
}

function mapShiftLabel(shift = {}) {
  const date = toDateKey(shift.date);
  const start = shift.startTime || '';
  const end = shift.endTime || '';
  if (date && start && end) return formatShiftRowLabel(date, start, end);
  return [date, start && end ? `${start} - ${end}` : ''].filter(Boolean).join(' · ') || '';
}

function estimateHours(shift = {}) {
  const start = String(shift.startTime || '');
  const end = String(shift.endTime || '');
  if (!/^\d{1,2}:\d{2}$/.test(start) || !/^\d{1,2}:\d{2}$/.test(end)) return 8;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  if (!Number.isFinite(mins) || mins <= 0) return 8;
  return Math.round((mins / 60) * 100) / 100;
}

/** Map GET `/web/agency/bids` item → Bids table/card shape. */
export function mapAgencyBidFromApi(item = {}) {
  const raw = unwrapBidDocument(item) || item || {};
  const job = raw.job && typeof raw.job === 'object' ? raw.job : {};
  const shift = raw.shift && typeof raw.shift === 'object' ? raw.shift : {};
  const snapshot = raw.snapshot && typeof raw.snapshot === 'object' ? raw.snapshot : {};
  const snapshotLocation =
    snapshot.location && typeof snapshot.location === 'object' ? snapshot.location : {};
  const user = job.user || raw.user || {};
  const jobCreator = raw.jobCreator && typeof raw.jobCreator === 'object' ? raw.jobCreator : {};
  const branch = job.branch || snapshot.branch || raw.branch || {};
  const location =
    (job.location && typeof job.location === 'object' ? job.location : null) || snapshotLocation || {};

  // Bidder who placed the offer — prefer Bid.user (not job.user / poster).
  const bidderRaw =
    raw.user ?? raw.worker ?? raw.bidder ?? raw.createdBy ?? raw.owner ?? item.user ?? null;
  const bidderObj = bidderRaw && typeof bidderRaw === 'object' ? bidderRaw : {};
  const bidderUserId = pickId(
    bidderObj._id,
    bidderObj.id,
    typeof bidderRaw === 'string' ? bidderRaw : '',
    raw.userId,
    raw.workerId,
    raw.bidderId,
    raw.createdById,
    item.userId
  );

  const id = pickBidDocumentId(raw) || pickBidDocumentId(item);
  const jobId = pickId(job._id, job.id, raw.jobId, raw.job, item.jobId, item.job);
  const shiftId =
    pickBidShiftId(raw) ||
    pickBidShiftId(item) ||
    pickId(shift._id, shift.id, raw.shiftId, raw.shift, item.shiftId, item.shift);

  const bidAmount = Number(raw.bid ?? raw.bidAmount ?? raw.amount ?? item.bid ?? 0) || 0;
  const hours = Number(raw.hours ?? item.hours) || estimateHours(shift);
  const hourlyRate =
    Number(raw.hourlyRate ?? item.hourlyRate) ||
    (bidAmount && hours ? computeHourlyRate(bidAmount, hours) : 0);

  const schedule = mapShiftLabel(shift) || raw.schedule || item.schedule || '';
  const startTime = String(shift.startTime || raw.startTime || item.startTime || '').slice(0, 5);
  const endTime = String(shift.endTime || raw.endTime || item.endTime || '').slice(0, 5);
  const careHome =
    jobCreator.name ||
    snapshot.name ||
    branch.name ||
    raw.careHome ||
    item.careHome ||
    item.careHomeName ||
    'Care home';

  const posterUserId = pickId(
    jobCreator._id,
    jobCreator.id,
    user._id,
    user.id,
    raw.posterUserId,
    item.posterUserId
  );
  const posterName = jobCreator.name || user.name || careHome;
  const posterEmail = jobCreator.email || user.email || '';
  const posterAvatarUrl = jobCreator.profileIcon || user.profileIcon || '';

  const jobTitle =
    snapshot.name || job.name || job.type?.title || raw.jobTitle || item.jobTitle || item.title || 'Job';
  const jobTypeTitle =
    (typeof job.type === 'object' && (job.type?.title || job.type?.name)) ||
    snapshot.jobType?.title ||
    snapshot.type?.title ||
    raw.jobTypeTitle ||
    item.jobTypeTitle ||
    '';
  const address =
    location.fullAddress ||
    [location.city, location.state, location.country].filter(Boolean).join(', ') ||
    branch.location?.fullAddress ||
    snapshotLocation.fullAddress ||
    raw.address ||
    item.address ||
    '';

  const status = normalizeAgencyBidStatus(raw.status || item.status || 'pending');
  const createdAt = raw.createdAt || raw.submittedAt || item.createdAt || '';

  return {
    id,
    _id: id,
    status,
    jobId,
    shiftId,
    jobRef: jobId ? `CH-J-${String(jobId).slice(-6).toUpperCase()}` : id,
    jobTitle,
    jobTypeTitle,
    careHome,
    bidderUserId,
    posterUserId,
    posterName,
    posterEmail,
    posterAvatarUrl,
    image: job.image || raw.image || item.image || '',
    schedule,
    scheduleDate: toDateKey(shift.date) || toDateKey(raw.scheduleDate || item.scheduleDate),
    startTime,
    endTime,
    address,
    location: address,
    bidAmount,
    originalBidAmount: Number(raw.originalBid ?? raw.originalBidAmount ?? item.originalBid) || bidAmount,
    hourlyRate,
    hours,
    notes: String(raw.note ?? raw.notes ?? item.note ?? item.notes ?? '').trim(),
    note: String(raw.note ?? raw.notes ?? item.note ?? item.notes ?? '').trim(),
    createdAt: createdAt ? String(createdAt) : '',
    submittedAt: formatSubmittedAt(createdAt) || raw.submittedAt || item.submittedAt || '',
    submittedDate: toDateKey(createdAt) || raw.submittedDate || item.submittedDate || '',
    updatedAt: formatSubmittedAt(raw.updatedAt || item.updatedAt) || raw.updatedAt || item.updatedAt || '',
    updatedDate: toDateKey(raw.updatedAt || item.updatedAt) || '',
    deadlineAt: raw.deadlineAt || raw.deadline || item.deadlineAt || item.deadline || null,
    hasAgreedRate: Boolean(raw.hasAgreedRate ?? item.hasAgreedRate),
    agreedHourlyRate:
      (raw.agreedHourlyRate ?? item.agreedHourlyRate) != null
        ? Number(raw.agreedHourlyRate ?? item.agreedHourlyRate)
        : undefined,
    reofferCount: Number(raw.reofferCount ?? item.reofferCount) || 0,
    acceptedAt: formatSubmittedAt(raw.acceptedAt || item.acceptedAt) || raw.acceptedAt || item.acceptedAt || '',
    declinedAt: formatSubmittedAt(raw.declinedAt || item.declinedAt) || raw.declinedAt || item.declinedAt || '',
    withdrawnAt:
      formatSubmittedAt(raw.withdrawnAt || item.withdrawnAt) || raw.withdrawnAt || item.withdrawnAt || '',
    bookingId: String(
      raw.bookingId ||
        raw.acceptedBookingId ||
        raw.latestBookingId ||
        raw.currentBookingId ||
        raw.booking?._id ||
        raw.booking?.id ||
        (typeof raw.booking === 'string' ? raw.booking : '') ||
        raw.bookings?.[0]?._id ||
        raw.bookings?.[0]?.id ||
        item.bookingId ||
        item.acceptedBookingId ||
        item.booking?._id ||
        item.booking?.id ||
        (typeof item.booking === 'string' ? item.booking : '') ||
        ''
    ),
    job: jobId,
    shift: shiftId,
    raw: item,
  };
}

/**
 * Resolve real bid _id for PUT/DELETE via GET bids list
 * (optionally filtered by shift/job).
 */
export async function resolveAgencyBidId({
  shiftId,
  jobId = '',
  token = '',
  baseUrl = import.meta.env.VITE_BASE_URL || '',
  bidsPath = '/web/agency/bids',
}) {
  const key = String(shiftId || '');
  if (!key) return '';

  const params = new URLSearchParams({ limit: '100' });
  if (key) params.set('shift', key);
  if (jobId) params.set('job', String(jobId));

  const res = await fetch(`${baseUrl}${bidsPath}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) return '';

  const json = await res.json();
  const list = extractAgencyBidsList(json);

  const exact = list.find((item) => {
    const s = pickBidShiftId(item);
    const j =
      typeof item.job === 'object'
        ? String(item.job?._id || item.job?.id || '')
        : String(item.jobId || item.job || '');
    if (s !== key) return false;
    if (jobId && j && j !== String(jobId)) return false;
    return Boolean(pickBidDocumentId(item));
  });

  if (exact) return pickBidDocumentId(exact);
  if (list.length === 1) return pickBidDocumentId(list[0]);

  for (const item of list) {
    if (pickBidShiftId(item) === key) {
      const docId = pickBidDocumentId(item);
      if (docId) return docId;
    }
  }

  return '';
}

export const AGENCY_BID_API_STATUSES = [
  'pending',
  'accepted',
  'rejected',
  'deleted',
  'withdraw',
  'cancelledByWorker',
  'cancelledByEmployer',
  'cancelledByUser',
];

/** Normalize API bid status to backend enum for UI + edit rules. */
export function normalizeAgencyBidStatus(status) {
  const raw = String(status || '').trim();
  if (!raw) return 'pending';
  const match = AGENCY_BID_API_STATUSES.find((value) => value.toLowerCase() === raw.toLowerCase());
  if (match) return match;
  const lower = raw.toLowerCase();
  if (lower === 'withdrawn') return 'withdraw';
  if (lower === 'declined' || lower === 'decline' || lower === 'reject') return 'rejected';
  if (lower === 'accept' || lower === 'awarded' || lower === 'hired') return 'accepted';
  return 'pending';
}

/** True when bid is still active (not withdrawn/declined) — Bid Now should POST again after withdraw. */
export function isActiveAgencyBid(bid) {
  if (!bid) return false;
  const status = normalizeAgencyBidStatus(bid.status);
  return ![
    'withdraw',
    'withdrawn',
    'rejected',
    'declined',
    'deleted',
    'cancelled',
    'canceled',
    'cancelledByWorker',
    'cancelledByEmployer',
    'cancelledByUser',
  ].includes(status);
}

/** After poster accepts, a booking exists — bidder must not delete; Check In must not stay if bid is gone. */
export function isAcceptedOrBookedBid(bid) {
  if (!bid) return false;
  if (String(bid.bookingId || '').trim()) return true;
  const status = normalizeAgencyBidStatus(bid.status);
  return status === 'accepted' || status === 'assigned' || status === 'booked';
}

/** True when bidder may still change the offer (poster has not declined/accepted). */
export function canEditAgencyBid(bid) {
  if (!bid) return false;
  if (isAcceptedOrBookedBid(bid)) return false;
  return normalizeAgencyBidStatus(bid.status) === 'pending';
}

/**
 * PUT /bids/:id { status: 'withdraw' } is allowed on a pending bid, or on an accepted bid
 * nobody is booked on yet (the backend then reopens the shift).
 */
export function canWithdrawAgencyBid(bid) {
  if (!bid) return false;
  const status = normalizeAgencyBidStatus(bid.status);
  if (status === 'pending') return true;
  return status === 'accepted' && !String(bid.bookingId || '').trim();
}

/** Accepted bid that can be used for POST /booking { bid, worker }. */
export function canAssignFromAgencyBid(bid) {
  if (!bid) return false;
  const id = String(bid.id || bid._id || '').trim();
  if (!/^[a-f\d]{24}$/i.test(id)) return false;
  if (String(bid.bookingId || '').trim()) return false;
  return normalizeAgencyBidStatus(bid.status) === 'accepted';
}

/**
 * Resolve bid for a Find Jobs card (shift map first, then same jobId fallback).
 * Avoids false "Bid unavailable" when shift id keys differ slightly.
 */
export function findAgencyBidForJobCard(bidsByShiftId, { shiftId = '', jobId = '' } = {}) {
  const shiftKey = String(shiftId || '').trim();
  if (shiftKey && bidsByShiftId?.get) {
    const direct = bidsByShiftId.get(shiftKey);
    if (direct) return direct;
  }

  const values =
    bidsByShiftId instanceof Map
      ? [...bidsByShiftId.values()]
      : Array.isArray(bidsByShiftId)
        ? bidsByShiftId
        : [];

  const jobKey = String(jobId || '').trim();
  if (!jobKey || !values.length) return null;

  const forJob = values.filter((bid) => String(bid?.jobId || bid?.job || '') === jobKey);
  if (!forJob.length) return null;

  const acceptedAssignable = forJob.find((bid) => canAssignFromAgencyBid(bid));
  if (acceptedAssignable) return acceptedAssignable;

  const withBooking = forJob.find((bid) => String(bid?.bookingId || '').trim());
  if (withBooking) return withBooking;

  const accepted = forJob.find((bid) => normalizeAgencyBidStatus(bid?.status) === 'accepted');
  if (accepted) return accepted;

  return forJob[0] || null;
}

/**
 * Active-tab button state from job + linked bid.
 * - reassign: the worker declined (booking cancelledByWorker) — bid stays accepted
 * - awaitingWorker: booking is pending until the worker accepts the offer
 * - assigned: any other API booking on job/shift/bid
 * - assignStaff: our bid is accepted and not yet booked
 * - bidUnavailable: should not stay on Active (filter out) — no accepted bid for us
 */
export function resolveAgencyAssignAction({ job, bid } = {}) {
  const bookingId = String(
    job?.bookingId ||
      job?.shiftRows?.[0]?.bookingId ||
      bid?.bookingId ||
      ''
  ).trim();
  const bookingStatus = job?.bookingStatus || job?.shiftRows?.[0]?.bookingStatus || '';
  const bidAccepted = normalizeAgencyBidStatus(bid?.status) === 'accepted';

  if (bookingStatus === 'cancelledByWorker' && bidAccepted) {
    return { actionType: 'reassign', bookingId: '', canOpenAssign: true };
  }

  // Never invent fake ids like "local-assigned" / "assigned"
  if (bookingId && bookingId !== 'local-assigned' && bookingId !== 'assigned') {
    const actionType = bookingStatus === 'pending' ? 'awaitingWorker' : 'assigned';
    return { actionType, bookingId, canOpenAssign: false };
  }

  if (canAssignFromAgencyBid(bid)) {
    return { actionType: 'assignStaff', bookingId: '', canOpenAssign: true };
  }

  return { actionType: 'bidUnavailable', bookingId: '', canOpenAssign: false };
}

/** True when bid row belongs to this shift (and optional job). */
export function bidMatchesShift(bid, shiftId, jobId = '') {
  if (!bid || !shiftId) return false;
  const key = String(shiftId);
  const bidShift = String(bid.shiftId || bid.shift || '');
  if (bidShift && bidShift === key) {
    if (!jobId) return true;
    const bidJob = String(bid.jobId || bid.job || '');
    return !bidJob || bidJob === String(jobId);
  }
  return false;
}

/**
 * Keep only bids placed by one of `userIds`.
 * `requireOwner` (admin impersonation): keep only rows with an explicit matching bidder id.
 */
export function filterBidsOwnedByUser(bids = [], userIdOrIds, { requireOwner = false } = {}) {
  const allowed = new Set(
    (Array.isArray(userIdOrIds) ? userIdOrIds : [userIdOrIds])
      .map((id) => String(id || '').trim())
      .filter(Boolean)
  );

  if (!Array.isArray(bids)) return [];
  if (!allowed.size) return requireOwner ? [] : bids;
  if (!bids.length) return bids;

  if (requireOwner) {
    return bids.filter((bid) => allowed.has(String(bid?.bidderUserId || '').trim()));
  }

  let anyHasOwner = false;
  const owned = [];

  for (const bid of bids) {
    const owner = String(bid?.bidderUserId || '').trim();
    if (!owner) continue;
    anyHasOwner = true;
    if (allowed.has(owner)) owned.push(bid);
  }

  return anyHasOwner ? owned : bids;
}

/** Normalize list payloads from GET /web/agency/bids */
export function extractAgencyBidsList(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.docs)) return response.data.docs;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data?.bids)) return response.data.bids;
  if (Array.isArray(response?.data?.records)) return response.data.records;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.bids)) return response.bids;
  if (Array.isArray(response?.result)) return response.result;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response)) return response;
  if (response?.data && typeof response.data === 'object' && (response.data._id || response.data.id)) {
    return [response.data];
  }
  return [];
}

/** Build a local bid row right after POST (so Edit/Delete work before GET refreshes). */
export function buildLocalBidFromCreate({ response, body, job, shiftRow }) {
  const raw = unwrapBidDocument(response) || {};
  const mapped = mapAgencyBidFromApi({
    ...raw,
    shift: raw.shift || body?.shift || shiftRow?.id || shiftRow?._id,
    job: raw.job || body?.job || job?.id || job?._id,
    bid: raw.bid ?? body?.bid,
    note: raw.note ?? body?.note ?? '',
    status: raw.status || 'pending',
    createdAt: raw.createdAt || new Date().toISOString(),
  });

  const serverId = pickBidDocumentId(raw) || mapped.id || '';

  return {
    ...mapped,
    id: serverId || '',
    _id: serverId || '',
    jobId: mapped.jobId || String(body?.job || job?.id || job?._id || ''),
    shiftId: mapped.shiftId || String(body?.shift || shiftRow?.id || shiftRow?._id || ''),
    job: mapped.jobId || String(body?.job || job?.id || job?._id || ''),
    shift: mapped.shiftId || String(body?.shift || shiftRow?.id || shiftRow?._id || ''),
    jobTitle: mapped.jobTitle !== 'Job' ? mapped.jobTitle : job?.title || 'Job',
    careHome:
      mapped.careHome !== 'Care home'
        ? mapped.careHome
        : job?.postedBy?.name || 'Care home',
    schedule: mapped.schedule || shiftRow?.label || job?.schedule || '',
    image: mapped.image || job?.image || '',
    bidAmount: mapped.bidAmount || Number(body?.bid) || 0,
    notes: mapped.notes || String(body?.note || ''),
    note: mapped.note || String(body?.note || ''),
    status: 'pending',
  };
}

/** Body for POST `/web/agency/bids` — { shift, job, bid, note } */
export function buildAgencyBidBody({ shiftId, jobId, bid, note = '' }) {
  return {
    shift: String(shiftId || ''),
    job: String(jobId || ''),
    bid: Number(bid),
    note: String(note || '').trim(),
  };
}

/**
 * Map PUT/POST success payload to local bid row.
 * Confirmed API shape:
 * {
 *   message: "Bid updated successfully",
 *   data: {
 *     _id,           // ← route id for PUT/DELETE /web/agency/bids/:id
 *     bid, note, status,
 *     job: "<jobId>",
 *     shift: { _id, date, startTime, endTime, ... }
 *   }
 * }
 */
export function mapAgencyBidMutationResponse(response, fallback = {}) {
  const mapped = buildLocalBidFromCreate({
    response,
    body: {
      shift: fallback.shiftId || fallback.shift,
      job: fallback.jobId || fallback.job,
      bid: fallback.bidAmount ?? fallback.bid,
      note: fallback.notes ?? fallback.note ?? '',
    },
    job: {
      id: fallback.jobId || fallback.job,
      title: fallback.jobTitle,
      image: fallback.image,
      postedBy: { name: fallback.careHome },
    },
    shiftRow: {
      id: fallback.shiftId || fallback.shift,
      label: fallback.schedule,
    },
  });

  const id = mapped.id || fallback.id || fallback._id || '';
  const shiftId = mapped.shiftId || fallback.shiftId || fallback.shift || '';
  const jobId = mapped.jobId || fallback.jobId || fallback.job || '';

  return {
    ...fallback,
    ...mapped,
    id,
    _id: id,
    shiftId,
    jobId,
    job: jobId,
    shift: shiftId,
    bidAmount: mapped.bidAmount || Number(fallback.bidAmount) || 0,
    notes: mapped.notes || fallback.notes || fallback.note || '',
    note: mapped.note || fallback.note || fallback.notes || '',
    status: mapped.status || fallback.status || 'pending',
  };
}
