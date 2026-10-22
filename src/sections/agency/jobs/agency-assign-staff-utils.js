import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';


export const ASSIGN_DAY_WINDOW = 14;

export const SHIFT_LEGEND = [
  { label: 'Accepted/Upcoming', color: 'info.main' },
  { label: 'Completed successfully', color: 'success.main' },
  { label: 'Needs to be filled', color: 'grey.400', bordered: true },
  { label: 'Needs replacement', color: 'error.main' },
  { label: 'Staff did not appear', color: 'warning.main' },
  { label: 'Pending shift requests', color: 'warning.light', bordered: true },
];

export function getAssignStaffDayCellSx(type, { readOnly = false } = {}) {
  const base = {
    disabled: {
      bgcolor: 'action.disabledBackground',
      border: '1px solid',
      borderColor: 'divider',
      cursor: 'default',
    },
    available: {
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      cursor: readOnly ? 'default' : 'pointer',
    },
    assigned: {
      bgcolor: 'success.lighter',
      border: '2px solid',
      borderColor: 'success.main',
      cursor: readOnly ? 'default' : 'pointer',
    },
    other: {
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'text.disabled',
      cursor: 'default',
    },
    conflict: {
      bgcolor: 'warning.lighter',
      border: '1px solid',
      borderColor: 'warning.main',
      cursor: 'default',
    },
    busy: {
      bgcolor: 'action.hover',
      border: '1px solid',
      borderColor: 'text.disabled',
      cursor: 'default',
    },
  };
  return base[type] || base.disabled;
}

export function getAssignCalendarCellSx(status) {
  const map = {
    empty: {
      bgcolor: 'action.disabledBackground',
      border: '1px solid',
      borderColor: 'divider',
    },
    assigned: {
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
    },
    upcoming: {
      bgcolor: 'info.lighter',
      border: '2px solid',
      borderColor: 'info.main',
    },
    completed: {
      bgcolor: 'success.lighter',
      border: '2px solid',
      borderColor: 'success.main',
    },
    replacement: {
      bgcolor: 'error.lighter',
      border: '2px solid',
      borderColor: 'error.main',
    },
    noshow: {
      bgcolor: 'warning.lighter',
      border: '2px solid',
      borderColor: 'warning.main',
    },
    pending: {
      bgcolor: 'warning.lighter',
      border: '2px solid',
      borderColor: 'warning.light',
    },
  };
  return map[status] || map.empty;
}

const CELL_STATUS_LABELS = {
  upcoming: 'Upcoming Shift',
  completed: 'Completed Shift',
  assigned: 'Assigned Shift',
  replacement: 'Needs Replacement',
  pending: 'Pending Request',
  noshow: 'Staff Did Not Appear',
  empty: 'Unassigned',
};

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || '').trim());
}

function pickId(...candidates) {
  for (const candidate of candidates) {
    if (candidate == null || candidate === '') continue;
    if (typeof candidate === 'object') {
      const nested = pickId(candidate._id, candidate.id, candidate.staffId, candidate.workerId);
      if (nested) return nested;
      continue;
    }
    const text = String(candidate).trim();
    if (text) return text;
  }
  return '';
}

export function getDistanceKm(from, to) {
  if (
    from?.latitude == null ||
    from?.longitude == null ||
    to?.latitude == null ||
    to?.longitude == null
  ) {
    return null;
  }

  const earthRadiusKm = 6371;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function formatDistanceKm(km) {
  if (km == null || Number.isNaN(km)) return null;
  return `${Number(km).toFixed(2)} km`;
}

export function withStaffDistances(staffList = [], jobLocation) {
  return [...staffList]
    .map((staff) => {
      const distanceKm = getDistanceKm(jobLocation, staff);
      return {
        ...staff,
        distanceKm,
        distanceLabel: formatDistanceKm(distanceKm),
      };
    })
    .sort((a, b) => {
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

export function findStaffById(staffList, id) {
  if (id == null || id === '') return null;
  const key = String(id);
  return (
    (staffList || []).find(
      (member) =>
        String(member.id) === key ||
        String(member.staffId || '') === key ||
        String(member.workerId || '') === key
    ) || null
  );
}

export function getShiftStatusLabel(cell) {
  if (!cell?.status) return 'Shift';
  return CELL_STATUS_LABELS[cell.status] || 'Shift';
}

export function getShiftStatusColor(statusLabel) {
  switch (statusLabel) {
    case 'Needs Replacement':
      return 'error.main';
    case 'Pending Request':
      return 'warning.light';
    case 'Staff Did Not Appear':
      return 'warning.main';
    case 'Upcoming Shift':
      return 'info.main';
    case 'Completed Shift':
    case 'Assigned Shift':
      return 'success.main';
    default:
      return 'success.main';
  }
}

export function resolveAssignViewMode(job) {
  if (job?.assignViewMode === 'calendar' || job?.assignViewMode === 'agency') {
    return job.assignViewMode;
  }
  return 'calendar';
}

export function resolveAssignScreenMode(job) {
  return job?.actionType === 'viewStaff' ? 'viewStaff' : 'assignStaff';
}

export function formatDayRangeLabel(days) {
  if (!days?.length) return '';
  const first = days[0];
  const last = days[days.length - 1];
  return `${format(first, 'MMM dd')} - ${format(last, 'd MMM')}`;
}

function parseDateSafe(value) {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? parseISO(value) : value;
    return Number.isNaN(parsed?.getTime?.()) ? null : parsed;
  } catch {
    return null;
  }
}

export function getAssignPeriodStart(job) {
  const shiftDates = (job?.shiftRows || [])
    .map((row) => row?.date)
    .filter(Boolean)
    .map(parseDateSafe)
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  if (shiftDates[0]) {
    return new Date(shiftDates[0].getFullYear(), shiftDates[0].getMonth(), 1);
  }

  if (job?.assignShift?.date) {
    const anchor = parseDateSafe(job.assignShift.date);
    if (anchor) return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  }

  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
}

export function getDaysForJob(job, offset = 0) {
  const periodStart = getAssignPeriodStart(job);
  const start = addDays(periodStart, offset * ASSIGN_DAY_WINDOW);
  const end = addDays(start, ASSIGN_DAY_WINDOW - 1);
  return eachDayOfInterval({ start, end });
}

function normalizeBookingStatus(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '');
}

function mapCellStatus({ bookingStatus, bookingId, workerId }) {
  const status = normalizeBookingStatus(bookingStatus);
  if (status === 'cancelledbyworker' || status === 'cancelled') return 'replacement';
  if (status === 'completed') return 'completed';
  if (status === 'noshow' || status === 'didnotappear') return 'noshow';
  if (status === 'pending') return 'pending';
  if (status === 'inprogress' || status === 'active') return 'upcoming';
  if (bookingId || workerId) return 'assigned';
  return 'empty';
}

function readWorkerFromBooking(booking) {
  if (!booking || typeof booking !== 'object') return '';
  return pickId(
    booking.worker,
    booking.staff,
    booking.nurse,
    booking.user,
    booking.workerId,
    booking.staffId,
    booking.nurseId
  );
}

export function readAssignedWorkerId(job, shiftRow = null) {
  const raw = job?.raw && typeof job.raw === 'object' ? job.raw : {};
  const myBooking = raw.myBooking && typeof raw.myBooking === 'object' ? raw.myBooking : null;
  const booking = raw.booking && typeof raw.booking === 'object' ? raw.booking : null;
  const shiftBooking =
    shiftRow?.bookingAttendance ||
    (shiftRow?.bookingId ? { _id: shiftRow.bookingId } : null);

  const fromMyBooking = myBooking
    ? (() => {
        const shiftId = pickId(myBooking.shift);
        if (shiftRow?.id && shiftId && shiftId !== String(shiftRow.id)) return '';
        return readWorkerFromBooking(myBooking);
      })()
    : '';

  if (fromMyBooking) return fromMyBooking;

  const fromBooking = readWorkerFromBooking(booking);
  if (fromBooking) return fromBooking;

  const assigned = Array.isArray(job?.assignedStaff) ? job.assignedStaff[0] : null;
  return pickId(assigned, assigned?.id, assigned?.staffId, shiftBooking);
}

export function readAcceptedBidId(job) {
  const raw = job?.raw && typeof job.raw === 'object' ? job.raw : {};
  const candidates = [raw.myBid, raw.acceptedBid, raw.bid, job?.bid].filter(
    (item) => item && typeof item === 'object'
  );

  for (const bid of candidates) {
    const status = String(bid.status || '').toLowerCase();
    const id = pickId(bid._id, bid.id);
    if (!isMongoObjectId(id)) continue;
    if (!status || status === 'accepted') return id;
  }

  return '';
}

function buildCellsFromShiftRow(row, job) {
  const cells = {};
  const dateKey = String(row?.date || '').trim();
  if (!dateKey) return cells;

  const bookingId = String(row?.bookingId || job?.bookingId || '').trim();
  const bookingStatus = row?.bookingStatus || job?.bookingStatus || '';
  const workerId = readAssignedWorkerId(job, row);

  cells[dateKey] = {
    status: mapCellStatus({ bookingStatus, bookingId, workerId }),
    staffId: workerId || null,
    bookingId: bookingId || '',
  };

  return cells;
}

function formatShiftTimeLabel(row) {
  if (row?.startTime && row?.endTime) return `${row.startTime}-${row.endTime}`;
  return row?.label || row?.id || 'Shift';
}


export function getCategoriesForJob(job) {
  if (!job?.id) return [];

  const categoryId = String(job.jobTypeId || job.role || job.title || 'job')
    .toLowerCase()
    .replace(/\s+/g, '-');
  const title = job.jobTypeTitle || job.role || job.title || 'Job';
  const shiftRows = (Array.isArray(job.shiftRows) ? job.shiftRows : []).map((row) => ({
    id: String(row.id || row._id || ''),
    label: formatShiftTimeLabel(row),
    date: row.date || '',
    startTime: row.startTime || '',
    endTime: row.endTime || '',
    bookingId: row.bookingId || '',
    bookingStatus: row.bookingStatus || '',
    hourlyRate: row.hourlyRate ?? job.hourlyRate ?? 0,
    totalPay: row.totalPay ?? job.totalPay ?? 0,
    breakMin: row.breakMin ?? job.breakMin ?? 0,
    cells: buildCellsFromShiftRow(row, job),
  }));

  return [
    {
      id: categoryId || 'job',
      title,
      jobs: [
        {
          id: String(job.id),
          description: job.description || job.title || '',
          address: job.address || '',
          latitude: job.latitude ?? null,
          longitude: job.longitude ?? null,
          image: job.image || '',
          requestDate: job.shiftDate || shiftRows[0]?.date || '',
          shiftRows,
        },
      ],
    },
  ];
}

export function getShiftConfig(job) {
  const categories = getCategoriesForJob(job);
  const category = categories[0];
  if (!category) return null;

  if (job?.assignShifts?.shiftIds?.length) {
    return { categoryId: category.id, shiftIds: job.assignShifts.shiftIds.map(String) };
  }
  if (job?.assignShift?.shiftId) {
    return { categoryId: category.id, shiftIds: [String(job.assignShift.shiftId)] };
  }

  return {
    categoryId: category.id,
    shiftIds: category.jobs[0]?.shiftRows?.map((row) => row.id).filter(Boolean) || [],
  };
}

function durationLabel(row) {
  if (!row?.startTime || !row?.endTime) return '—';
  return `${row.startTime} – ${row.endTime}`;
}

export function getInitialSelectedCell(job) {
  const categories = getCategoriesForJob(job);
  const category = categories[0];
  const jobItem = category?.jobs?.[0];
  const row = jobItem?.shiftRows?.[0];
  if (!row) {
    return {
      categoryId: category?.id || '',
      jobId: job?.id || '',
      shiftId: '',
      date: '',
      label: job?.schedule || 'Shift',
      duration: '—',
      break: job?.breakMin ? `${job.breakMin}m` : '—',
      totalCost: job?.totalPay || 0,
      hourlyRate: job?.hourlyRate || 0,
      earning: job?.totalPay || 0,
      status: 'Shift',
      assignedStaffId: readAssignedWorkerId(job) || null,
    };
  }

  const date = row.date || '';
  const cell = row.cells?.[date];

  return {
    categoryId: category.id,
    jobId: jobItem.id,
    shiftId: row.id,
    date,
    label: row.label || job?.schedule || 'Shift',
    duration: durationLabel(row),
    break: row.breakMin ? `${row.breakMin}m` : job?.breakMin ? `${job.breakMin}m` : '—',
    totalCost: row.totalPay || job?.totalPay || 0,
    hourlyRate: row.hourlyRate || job?.hourlyRate || 0,
    earning: row.totalPay || job?.totalPay || 0,
    status: getShiftStatusLabel(cell),
    assignedStaffId: cell?.staffId || readAssignedWorkerId(job, row) || null,
  };
}

export function buildInitialShiftSelection(categories, activeJob) {
  const selection = {};

  categories.forEach((category) => {
    category.jobs.forEach((jobItem) => {
      const key = `${category.id}-${jobItem.id}`;
      if (activeJob?.id === jobItem.id && activeJob?.assignShift?.shiftId) {
        selection[key] = activeJob.assignShift.shiftId;
      } else if (activeJob?.id === jobItem.id && activeJob?.assignShifts?.shiftIds?.[0]) {
        selection[key] = activeJob.assignShifts.shiftIds[0];
      } else {
        selection[key] = jobItem.shiftRows[0]?.id;
      }
    });
  });

  return selection;
}

export function formatShiftLabel(dateStr, shiftId, shiftRows = []) {
  const row = (shiftRows || []).find((item) => String(item.id) === String(shiftId));
  if (row?.label) {
    if (dateStr) {
      try {
        return `${format(parseISO(dateStr), 'EEE MMM d')}, ${row.label}`;
      } catch {
        return row.label;
      }
    }
    return row.label;
  }

  if (!dateStr) return String(shiftId || 'Shift');
  try {
    return `${format(parseISO(dateStr), 'EEE MMM d')}, ${shiftId}`;
  } catch {
    return String(shiftId || 'Shift');
  }
}
