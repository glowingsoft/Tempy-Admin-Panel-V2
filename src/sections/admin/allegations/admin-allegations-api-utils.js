import { isAllegationFeedType } from './admin-allegations-constants';

function asText(value) {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value).trim();
  return '';
}

function personName(value) {
  if (!value || typeof value !== 'object') return asText(value);
  return asText(
    value.name ||
      value.fullName ||
      value.basicInfo?.name ||
      [value.firstName, value.lastName].filter(Boolean).join(' ')
  );
}

function personEmail(value) {
  if (!value || typeof value !== 'object') return '';
  return asText(value.email || value.basicInfo?.email);
}

function accountLabel(item, worker) {
  const raw = asText(
    item.userType ||
      item.accountType ||
      item.subjectType ||
      item.roleType ||
      worker?.userType ||
      worker?.role ||
      item.role
  ).toLowerCase();
  const labels = {
    nurse: 'Nurse',
    staff: 'Nurse',
    staff_member: 'Nurse',
    agency: 'Agency',
    home_care_company: 'Home care company',
    employer: 'Employer',
    customer: 'Customer',
    care_home: 'Customer',
    hospital: 'Customer',
    hospital_nhs: 'Customer',
    local_authority: 'Customer',
    individual_home_care: 'Customer',
  };
  if (labels[raw]) return labels[raw];
  if (!raw) return '';
  return raw.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeFeedType(value) {
  const raw = asText(value).toLowerCase().replace(/[\s-]+/g, '_');
  if (!raw) return '';
  if (isAllegationFeedType(raw)) return raw;
  if (raw === 'suspension' || raw === 'suspended' || raw === 'suspended_users' || raw === 'suspensions') {
    return 'suspended_user';
  }
  if (raw === 'cancellation' || raw === 'cancellation_strikes' || raw === 'late_cancellation') {
    return 'cancellation_strike';
  }
  if (raw === 'abandoned' || raw === 'abandoned_shifts') return 'abandoned_shift';
  if (raw === 'reported' || raw === 'reported_users' || raw === 'reports') return 'reported_user';
  return '';
}

function isWorkerSuspended(item, worker) {
  const accountStatus = asText(
    item.workerStatus || worker?.accountState?.status || worker?.status || item.accountState?.status
  ).toLowerCase();
  const type = asText(item.type || item.allegationType).toLowerCase();
  return (
    item.suspended === true ||
    item.workerSuspended === true ||
    accountStatus === 'suspended' ||
    type === 'suspended_user'
  );
}

function pickId(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return asText(value._id || value.id);
}

export function mapAllegationShift(shift = {}) {
  if (typeof shift === 'string' || typeof shift === 'number') {
    const id = String(shift);
    return {
      id,
      ref: id,
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      role: '',
      status: 'needs_reallocation',
      replacementWorkerId: '',
      replacementWorkerName: '',
      needsRepublish: false,
    };
  }
  if (!shift || typeof shift !== 'object') return { id: '', status: '', needsRepublish: false };
  const replacement = shift.replacement || shift.replacementWorker || null;
  const nested = shift.shift && typeof shift.shift === 'object' ? shift.shift : null;
  const booking = shift.booking && typeof shift.booking === 'object' ? shift.booking : null;
  const bookingShift = booking?.shift && typeof booking.shift === 'object' ? booking.shift : null;
  const bookingId = pickId(shift.bookingId || booking?._id || booking?.id);
  const explicitShiftId = pickId(shift.shiftId || shift.shift_id || nested?.shiftId || booking?.shiftId || bookingShift);
  const nestedShiftId = pickId(nested);
  const shiftRef =
    typeof shift.shift === 'string' || typeof shift.shift === 'number'
      ? String(shift.shift)
      : typeof booking?.shift === 'string' || typeof booking?.shift === 'number'
        ? String(booking.shift)
        : '';
  const ownId = pickId(shift._id || shift.id);
  const shiftId =
    [explicitShiftId, nestedShiftId, shiftRef, ownId].find((value) => value && value !== bookingId) ||
    explicitShiftId ||
    nestedShiftId ||
    shiftRef ||
    ownId ||
    '';
  const needsRepublish =
    shift.needsRepublish === true ||
    shift.canReallocate === false ||
    shift.requiresRepublish === true ||
    shift.action === 'republish' ||
    shift.wonDirectly === true ||
    shift.directAward === true;
  const status = normalizeShiftStatus(shift.status || nested?.status || booking?.status);

  return {
    id: shiftId,
    ref:
      asText(shift.ref || shift.reference || shift.bookingRef || nested?.ref || booking?.reference) ||
      pickId(shift._id || shift.id || nested || booking),
    date: shift.date || shift.shiftDate || shift.startDate || shift.startsAt || nested?.date || booking?.date || '',
    startTime: asText(shift.startTime || nested?.startTime || booking?.startTime),
    endTime: asText(shift.endTime || nested?.endTime || booking?.endTime),
    location: asText(shift.location || shift.address || shift.branch?.name || nested?.location || booking?.location),
    role: asText(shift.role || shift.jobType?.title || shift.jobTitle || shift.type || nested?.role),
    status,
    replacementWorkerId: pickId(shift.replacementWorkerId || replacement),
    replacementWorkerName: personName(shift.replacementWorkerName || replacement),
    needsRepublish,
    raw: shift,
  };
}

function normalizeShiftStatus(status) {
  const value = asText(status).toLowerCase().replace(/[\s-]+/g, '_');
  if (!value || value === 'stopped' || value === 'pending' || value === 'needsreallocation') return 'needs_reallocation';
  if (value === 'cancelled_by_worker' || value === 'cancelledbyworker') return 'needs_reallocation';
  if (value === 'republished' || value === 're_published') return 'republished';
  if (value === 'reallocated' || value === 're_allocated') return 'reallocated';
  return value;
}

export function collectShifts(item) {
  const candidates = [
    item?.affectedShifts,
    item?.shifts,
    item?.stoppedShifts,
    item?.bookings,
    item?.affectedBookings,
    item?.stoppedBookings,
    item?.data?.affectedShifts,
    item?.data?.shifts,
  ];
  const found = candidates.find((value) => Array.isArray(value) || (value && typeof value === 'object'));
  if (Array.isArray(found)) return found;
  if (found && typeof found === 'object') {
    return found.docs || found.items || found.rows || found.list || [];
  }
  return [];
}

export function mapAllegationFromApi(item = {}) {
  if (!item || typeof item !== 'object') {
    return {
      id: '',
      workerId: '',
      workerName: '',
      workerEmail: '',
      employerName: '',
      accountLabel: '',
      feedType: '',
      reportCount: 0,
      allegationType: '',
      description: '',
      status: '',
      workerSuspended: false,
      createdAt: '',
      updatedAt: '',
      affectedShifts: [],
    };
  }

  const worker = item.worker || item.nurse || item.staff || item.user || null;
  const shifts = collectShifts(item);
  const feedType =
    [item.feedType, item.category, item.listType, item.source, item.kind, item.type]
      .map(normalizeFeedType)
      .find(Boolean) || '';

  return {
    id: pickId(item) || pickId(item.allegationId),
    workerId: pickId(item.workerId || item.userId || worker),
    workerName: personName(item.workerName || item.userName || item.name || worker) || 'User',
    workerEmail: asText(item.workerEmail || item.email) || personEmail(worker),
    employerName: asText(item.employerName || item.employer?.name),
    accountLabel: accountLabel(item, worker),
    feedType,
    reportCount: Number(item.reportCount ?? item.reports ?? 0) || 0,
    allegationType: asText(item.allegationType || (feedType ? '' : item.type)),
    description: asText(item.description || item.reason || item.message || item.note),
    status: asText(item.status || 'open'),
    workerSuspended: isWorkerSuspended(item, worker),
    createdAt: item.createdAt || item.raisedAt || '',
    updatedAt: item.updatedAt || '',
    affectedShifts: Array.isArray(shifts) ? shifts.map(mapAllegationShift).filter((shift) => shift.id) : [],
    raw: item,
  };
}

export function extractAllegationList(response) {
  const data = response?.data;
  const candidates = [
    data,
    data?.data,
    data?.allegations,
    data?.docs,
    data?.items,
    data?.list,
    data?.rows,
    data?.results,
    data?.records,
    response?.allegations,
    response?.results,
    response?.records,
  ];
  return candidates.find(Array.isArray) || [];
}

const SUMMARY_LABELS = {
  suspended_user: 'Suspended users',
  cancellation_strike: 'Cancellation strikes',
  abandoned_shift: 'Abandoned shifts',
  reported_user: 'Reported users',
  open: 'Open allegations',
  under_review: 'Under review',
  underReview: 'Under review',
  resolved: 'Resolved',
  withdrawn: 'Withdrawn',
};

function summaryLabel(key) {
  if (SUMMARY_LABELS[key]) return SUMMARY_LABELS[key];
  return String(key || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function readCount(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
    for (const key of keys) {
      const value = source[key];
      if (value != null && value !== '' && Number.isFinite(Number(value))) return Number(value);
    }
  }
  return null;
}

/** Counts for the four cards, taken from the list response when it sends them, otherwise from its rows. */
export function countAllegationCards(response, rows = []) {
  const data = response?.data;
  const sources = [response?.counts, response?.summary, response?.meta?.counts, response?.meta, data?.counts, data?.summary];
  const list = Array.isArray(rows) ? rows : [];

  const openFromRows = list.filter((row) => row.status === 'open').length;
  const underReviewFromRows = list.filter((row) => row.status === 'under_review').length;
  const suspendedWorkersFromRows = new Set(
    list.filter((row) => row.workerSuspended).map((row) => row.workerId || row.id)
  ).size;
  const pendingShiftsFromRows = list.reduce((total, row) => {
    const shifts = Array.isArray(row.affectedShifts) ? row.affectedShifts : [];
    return (
      total +
      shifts.filter((shift) => shift.status === 'needs_reallocation' || shift.status === 'stopped').length
    );
  }, 0);

  return {
    open: readCount(sources, ['open', 'openCount', 'openAllegations']) ?? openFromRows,
    underReview:
      readCount(sources, ['underReview', 'under_review', 'underReviewCount']) ?? underReviewFromRows,
    suspendedWorkers:
      readCount(sources, ['suspendedWorkers', 'suspended', 'suspended_user', 'suspendedCount']) ??
      suspendedWorkersFromRows,
    pendingShifts:
      readCount(sources, ['pendingShifts', 'needsReallocation', 'needs_reallocation', 'shiftsNeedingAction']) ??
      pendingShiftsFromRows,
  };
}

/** Turn a counts object on the list response into cards. */
export function collectSummaryCards(source) {
  if (!source) return [];

  if (Array.isArray(source)) {
    return source
      .map((item, index) => {
        if (item == null || typeof item !== 'object') return null;
        const key = asText(item.type || item.key || item.status || item.name) || String(index);
        const total = Number(item.count ?? item.total ?? item.value ?? 0);
        return { key, label: asText(item.label) || summaryLabel(key), total: Number.isFinite(total) ? total : 0 };
      })
      .filter(Boolean);
  }

  if (typeof source !== 'object') return [];

  return Object.entries(source)
    .filter(([, value]) => typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))))
    .map(([key, value]) => ({ key, label: summaryLabel(key), total: Number(value) }));
}

export function mapReplacementWorker(item = {}) {
  const worker = item.worker || item.user || item;
  return {
    id: pickId(item.workerId || item.userId || worker),
    name: personName(item.name || worker) || 'Worker',
    role: asText(item.role || item.jobTitle || worker?.role),
  };
}

function looksLikeOtherStaff(person, suspendedId) {
  const worker = mapReplacementWorker(person);
  if (!worker.id || worker.id === suspendedId) return false;
  const type = asText(
    person.userType || person.role || person.accountType || person.supplierType || person.worker?.userType || person.user?.userType
  ).toLowerCase();
  if (type.includes('customer') || type.includes('employer') || type.includes('care_home') || type.includes('hospital')) return false;
  const status = asText(person.status || person.accountState?.status || person.user?.status).toLowerCase();
  if (status === 'suspended' || status === 'inactive') return false;
  if (person.isFree === false || person.available === false) return false;
  return Boolean(person.email || person.firstName || person.fullName || person.name || type.includes('nurse') || type.includes('staff'));
}

function collectPeople(node, depth, acc, seen) {
  if (!node || depth > 6 || seen.has(node)) return;
  if (typeof node !== 'object') return;
  seen.add(node);
  if (Array.isArray(node)) {
    node.forEach((item) => collectPeople(item, depth + 1, acc, seen));
    return;
  }
  if (node._id || node.id || node.workerId || node.userId || node.email) acc.push(node);
  Object.values(node).forEach((value) => {
    if (value && typeof value === 'object') collectPeople(value, depth + 1, acc, seen);
  });
}

/** Another active staff member on this allegation, not the suspended worker. */
export function pickReplacementWorker(allegation, shift) {
  const suspendedId = allegation?.workerId || '';
  const people = [];
  collectPeople({ allegation: allegation?.raw, shift: shift?.raw }, 0, people, new Set());
  const match = people.find((person) => looksLikeOtherStaff(person, suspendedId));
  return match ? mapReplacementWorker(match) : null;
}

