import { addDays, eachDayOfInterval, format, parseISO } from 'date-fns';

import { _mock } from './_mock';

// ----------------------------------------------------------------------

export const ASSIGN_AGENCIES = [
  { id: 'careplus', label: 'CarePlus Agency' },
  { id: 'prime', label: 'Prime Health Services' },
  { id: 'jaosh', label: 'Jaosh Care Agency' },
];

export const ASSIGN_AGENCY_DATA = {
  careplus: {
    stats: { hours: '2510h', cost: '$24,905', shifts: '280' },
  },
  prime: {
    stats: { hours: '1820h', cost: '$18,200', shifts: '195' },
  },
  jaosh: {
    stats: { hours: '3100h', cost: '$31,400', shifts: '342' },
  },
};

export const ASSIGN_STATS = ASSIGN_AGENCY_DATA.careplus.stats;

export function getStatsForAgency(_agencyId) {
  // Do not invent demo hours/cost/shifts — show empty until a real stats API is wired.
  return { hours: '—', cost: '—', shifts: '—' };
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

/** Haversine distance in km between two lat/lng points */
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
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function formatDistanceKm(km) {
  if (km == null || Number.isNaN(km)) return null;
  return `${Number(km).toFixed(2)} km`;
}

export function withStaffDistances(staffList = ASSIGN_STAFF, jobLocation) {
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

export const ASSIGN_JOB_META = {
  address: '742 Evergreen Terrace, Springfield, IL 62704',
  latitude: 39.7817,
  longitude: -89.6501,
  gender: 'Female',
  postedBy: {
    name: 'John Doe',
    avatarUrl: _mock.image.avatar(2),
  },
  rating: 4.5,
  reviewCount: 55,
  totalPay: 160,
  hourlyRate: 20,
  postedDate: 'Wed May 6, 09:00 AM - 05:00 PM',
};

export const ASSIGN_STAFF = [
  {
    id: 1,
    name: 'Emily Ana',
    hours: '22h/60h this week',
    rating: 4.7,
    reviews: 22,
    avatarUrl: _mock.image.avatar(12),
    initials: 'EA',
    rowBg: '#eef5fc',
    latitude: 39.7902,
    longitude: -89.6441,
  },
  {
    id: 2,
    name: 'John Mark',
    hours: '38h/60h this week',
    rating: 4.5,
    reviews: 15,
    avatarUrl: _mock.image.avatar(13),
    initials: 'JM',
    rowBg: '#f3f6f9',
    latitude: 39.8015,
    longitude: -89.6728,
  },
  {
    id: 3,
    name: 'Simy Faup',
    hours: '45h/60h this week',
    rating: 4.3,
    reviews: 28,
    avatarUrl: _mock.image.avatar(14),
    initials: 'SF',
    rowBg: '#eef5fc',
    latitude: 39.7689,
    longitude: -89.6412,
  },
  {
    id: 4,
    name: 'Raksy Jesy',
    hours: '52h/60h this week',
    rating: 4.6,
    reviews: 19,
    avatarUrl: _mock.image.avatar(15),
    initials: 'RJ',
    rowBg: '#f3f6f9',
    latitude: 39.8124,
    longitude: -89.6985,
  },
];

/** Staff booked on another job/category — white cell with shift + job name */
export const STAFF_OTHER_ASSIGNMENTS = {
  2: {
    '2025-06-04': { shiftLabel: '09a-05p', categoryTitle: 'Senior Care Days' },
    '2025-06-06': { shiftLabel: '09a-05p', categoryTitle: 'Senior Care Days' },
  },
  3: {
    '2025-06-07': { shiftLabel: '09a-05p', categoryTitle: 'Senior Care Days' },
  },
};

/** Staff double-booked — "+1 Category" cell */
export const STAFF_CONFLICTS = {
  1: { '2025-06-08': 'Child Care' },
  4: { '2025-06-10': 'Nurse' },
};

export const SHIFT_LEGEND = [
  { label: 'Accepted/Upcoming', color: '#2196f3' },
  { label: 'Completed successfully', color: '#4caf50' },
  { label: 'Needs to be filled', color: '#bdbdbd' },
  { label: 'Needs replacement', color: '#f44336' },
  { label: 'Staff did not appear', color: '#ff9800' },
  { label: 'Pending shift requests', color: '#ffeb3b' },
];

const PERIOD_START = new Date(2025, 5, 1);

export const ASSIGN_DAY_WINDOW = 14;

export const ASSIGN_DAYS = eachDayOfInterval({
  start: PERIOD_START,
  end: addDays(PERIOD_START, ASSIGN_DAY_WINDOW - 1),
});

export function getAssignPeriodStart(job) {
  if (job?.assignPeriodStart) {
    return typeof job.assignPeriodStart === 'string'
      ? parseISO(job.assignPeriodStart)
      : job.assignPeriodStart;
  }

  if (job?.assignShift?.date) {
    const anchor = parseISO(job.assignShift.date);
    return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  }

  return PERIOD_START;
}

export function getDaysForJob(job, offset = 0) {
  const periodStart = getAssignPeriodStart(job);
  const start = addDays(periodStart, offset * ASSIGN_DAY_WINDOW);
  const end = addDays(start, ASSIGN_DAY_WINDOW - 1);

  return eachDayOfInterval({ start, end });
}

export function formatDayRangeLabel(days) {
  if (!days?.length) return '';

  const first = days[0];
  const last = days[days.length - 1];

  return `${format(first, 'MMM dd')} - ${format(last, 'd MMM')}`;
}

function buildCells(shiftKey, rowSeed) {
  const cells = {};

  ASSIGN_DAYS.forEach((day, index) => {
    const key = format(day, 'yyyy-MM-dd');
    const dayNum = index + 1;

    if ((shiftKey === '02p-06p' || shiftKey === '03a-06p') && dayNum === 9) {
      cells[key] = { status: 'empty' };
      return;
    }

    if (dayNum % 11 === 0) {
      cells[key] = { status: 'replacement', staffId: 1 };
      return;
    }

    if (dayNum % 9 === 0) {
      cells[key] = { status: 'noshow', staffId: 2 };
      return;
    }

    if (dayNum % 7 === 0) {
      cells[key] = { status: 'pending', staffId: 3 };
      return;
    }

    if (dayNum % 5 === rowSeed) {
      cells[key] = { status: 'empty' };
      return;
    }

    if (dayNum % 4 === 0) {
      cells[key] = { status: 'completed', staffId: 1 };
      return;
    }

    if (dayNum === 6 || dayNum === 8) {
      cells[key] = { status: 'upcoming', staffId: 1 };
      return;
    }

    cells[key] = { status: 'assigned', staffId: ((index + rowSeed) % 3) + 1 };
  });

  return cells;
}

function formatShiftLabel(dateStr, shiftId) {
  const date = parseISO(dateStr);
  const dayLabel = format(date, 'EEE MMM d');
  if (shiftId === '09a-05p') return `${dayLabel}, 09:00 AM - 05:00 PM`;
  if (shiftId === '02p-06p' || shiftId === '03a-06p') return `${dayLabel}, 02:00 PM - 06:00 PM`;
  if (shiftId === '10p-06a') return `${dayLabel}, 10:00 PM - 06:00 AM`;
  return `${dayLabel}, ${shiftId}`;
}

function filterJobShifts(jobItem, shiftIds) {
  if (!shiftIds?.length) return jobItem;

  return {
    ...jobItem,
    shiftRows: jobItem.shiftRows.filter((row) => shiftIds.includes(row.id)),
  };
}

function normalizeCategoryJobs(category) {
  if (category.jobs?.length) return category;

  return {
    ...category,
    jobs: [
      {
        id: category.jobId,
        description: category.description,
        shiftRows: category.shiftRows || [],
      },
    ],
  };
}

export const ASSIGN_JOB_CATEGORIES = [
  {
    id: 'senior-care-days',
    title: 'Senior Care Days',
    jobs: [
      {
        id: '4x93f',
        description:
          'Looking for a registered nurse for post-operative home care. Patient requires medication management and vital monitoring.',
        address: '742 Evergreen Terrace, Springfield, IL 62704',
        latitude: 39.7817,
        longitude: -89.6501,
        requestDate: '04-06-2026',
        shiftRows: [
          { id: '09a-05p', label: '09a-05p', cells: buildCells('09a-05p', 1) },
          { id: '03a-06p', label: '03a-06p', cells: buildCells('03a-06p', 2) },
        ],
      },
      {
        id: '5b10n',
        description: 'Looking for day care specialists.',
        address: '1600 Pennsylvania Ave NW, Washington, DC 20500',
        latitude: 38.8977,
        longitude: -77.0365,
        requestDate: '06-06-2026',
        shiftRows: [
          { id: '09a-05p', label: '09a-05p', cells: buildCells('5b10n-09', 2) },
          { id: '02p-06p', label: '02p-06p', cells: buildCells('5b10n-02', 3) },
        ],
      },
    ],
  },
  {
    id: 'senior-care-nights',
    title: 'Senior Care Nights',
    jobs: [
      {
        id: '4x93f',
        description:
          'Looking for a registered nurse for post-operative home care. Patient requires medication management and vital monitoring.',
        address: '742 Evergreen Terrace, Springfield, IL 62704',
        latitude: 39.7817,
        longitude: -89.6501,
        shiftRows: [{ id: '10p-06a', label: '10p-06a', cells: buildCells('10p-06a', 3) }],
      },
    ],
  },
  {
    id: 'nurse',
    title: 'Nurse',
    jobs: [
      {
        id: '4xi82f',
        description:
          'Looking for a registered nurse for post-operative home care. Patient requires medication management and vital monitoring.',
        shiftRows: [{ id: '09a-05p', label: '09a-05p', cells: buildCells('09a-05p-n', 1) }],
      },
    ],
  },
  {
    id: 'child-care',
    title: 'Child Care',
    jobs: [
      {
        id: '4xcc1',
        description:
          'Looking for a registered nurse for post-operative home care. Patient requires medication management and vital monitoring.',
        shiftRows: [{ id: '09a-05p', label: '09a-05p', cells: buildCells('09a-05p-c', 2) }],
      },
    ],
  },
].map(normalizeCategoryJobs);

export function getDefaultSelectedCell() {
  return {
    categoryId: 'senior-care-days',
    shiftId: '02p-06p',
    date: '2025-06-09',
    label: 'Tue Jun 9, 02:00 PM - 06:00 PM',
    duration: '4h',
    break: '30m',
    totalCost: 60,
    hourlyRate: 20,
    earning: 160,
    status: 'Upcoming Shift',
  };
}

export function getStaffById(id) {
  return ASSIGN_STAFF.find((member) => member.id === id) || ASSIGN_STAFF[0];
}

function filterCategoryShifts(category, shiftIds, activeJobId) {
  return {
    ...category,
    jobs: category.jobs.map((jobItem) =>
      activeJobId && jobItem.id !== activeJobId ? jobItem : filterJobShifts(jobItem, shiftIds)
    ),
  };
}

/**
 * Saari categories + multiple jobs per category.
 * Sirf active job (button se jo aaya) ki rows filter hoti hain:
 * - assignShift  → 1 row
 * - assignShifts → 2+ rows
 */
export function getCategoriesForJob(job) {
  let categories = ASSIGN_JOB_CATEGORIES;

  if (job?.assignShifts) {
    const { categoryId, shiftIds } = job.assignShifts;
    categories = categories.map((category) =>
      category.id === categoryId ? filterCategoryShifts(category, shiftIds, job.id) : category
    );
  } else if (job?.assignShift) {
    const { categoryId, shiftId } = job.assignShift;
    categories = categories.map((category) =>
      category.id === categoryId ? filterCategoryShifts(category, [shiftId], job.id) : category
    );
  }

  return categories.map((category) => ({
    ...category,
    jobs: category.jobs.map((jobItem) => ({
      ...jobItem,
      image: jobItem.id === job?.id ? job?.image || jobItem.image || '' : jobItem.image || '',
      address: jobItem.address || job?.address || ASSIGN_JOB_META.address,
      latitude: jobItem.latitude ?? job?.latitude ?? ASSIGN_JOB_META.latitude,
      longitude: jobItem.longitude ?? job?.longitude ?? ASSIGN_JOB_META.longitude,
    })),
  }));
}

export function getShiftConfig(job) {
  if (job?.assignShifts) {
    return { categoryId: job.assignShifts.categoryId, shiftIds: job.assignShifts.shiftIds };
  }
  if (job?.assignShift) {
    return { categoryId: job.assignShift.categoryId, shiftIds: [job.assignShift.shiftId] };
  }
  return null;
}

/**
 * Kaunsa UI dikhe:
 * - 'calendar' → shift rows × days, grey + popover (pehla view, single job focus)
 * - 'agency'   → shift pills + staff grid (naya view, multiple jobs)
 */
export function resolveAssignViewMode(job) {
  if (job?.assignViewMode === 'calendar' || job?.assignViewMode === 'agency') {
    return job.assignViewMode;
  }
  return 'calendar';
}

export function resolveAssignScreenMode(job) {
  return job?.actionType === 'viewStaff' ? 'viewStaff' : 'assignStaff';
}

export function getAssignedStaffIds(job) {
  return job?.assignedStaff?.map((member) => member.id).filter(Boolean) ?? [];
}

export function getInitialSelectedCell(job) {
  const config = getShiftConfig(job);

  if (!config) return getDefaultSelectedCell();

  const { categoryId, shiftIds } = config;
  const shiftId = shiftIds[0];
  const date = job?.assignShift?.date || '2025-06-09';
  const category = ASSIGN_JOB_CATEGORIES.find((item) => item.id === categoryId);
  const jobItem = category?.jobs.find((item) => item.id === job?.id) || category?.jobs[0];
  const row = jobItem?.shiftRows.find((item) => item.id === shiftId);
  const cell = row?.cells[date];
  const label = formatShiftLabel(date, shiftId);

  return {
    categoryId,
    jobId: jobItem?.id,
    shiftId,
    date,
    label,
    duration: shiftId === '02p-06p' || shiftId === '03a-06p' ? '4h' : '8h',
    break: '30m',
    totalCost: shiftId === '02p-06p' || shiftId === '03a-06p' ? 60 : 120,
    hourlyRate: job?.hourlyRate || 20,
    earning: job?.totalPay || 160,
    status: cell?.status === 'upcoming' ? 'Upcoming Shift' : 'Shift',
    assignedStaffId: cell?.staffId || 1,
  };
}
