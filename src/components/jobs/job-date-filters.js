import {
  addDays,
  addHours,
  endOfWeek,
  format,
  isValid,
  isWithinInterval,
  parse,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns';

export const JOB_DATE_FILTERS = [
  { value: 'all', label: 'Date order' },
  { value: 'next24Hours', label: 'Urgent · Next 24h' },
  { value: 'thisWeek', label: 'This week' },
  { value: 'nextWeek', label: 'Next week' },
];

export function toJobDateFilterParam(value) {
  if (!value || value === 'all') return '';
  if (value === 'urgent') return 'next24Hours';
  if (value === 'this-week') return 'thisWeek';
  if (value === 'next-week') return 'nextWeek';
  return value;
}

export function toDateKey(date) {
  return format(date, 'yyyy-MM-dd');
}

export function parseJobShiftDate(shiftDate) {
  if (!shiftDate) return null;
  if (shiftDate instanceof Date) {
    return isValid(shiftDate) ? startOfDay(shiftDate) : null;
  }

  const raw = String(shiftDate).trim();
  const ymd = parse(raw.slice(0, 10), 'yyyy-MM-dd', new Date());
  if (isValid(ymd)) return startOfDay(ymd);

  const iso = parseISO(raw);
  return isValid(iso) ? startOfDay(iso) : null;
}

export function parseJobShiftStart({ shiftDate, shiftStartTime } = {}) {
  if (!shiftDate) return null;
  try {
    const parsed = parse(
      `${shiftDate} ${shiftStartTime || '00:00'}`,
      'yyyy-MM-dd HH:mm',
      new Date()
    );
    return isValid(parsed) ? parsed : parseJobShiftDate(shiftDate);
  } catch {
    return parseJobShiftDate(shiftDate);
  }
}

export function getDateFilterRange(filter, from = new Date()) {
  const today = startOfDay(from);

  if (filter === 'urgent' || filter === 'next24Hours') {
    return { start: from, end: addHours(from, 24) };
  }

  if (filter === 'this-week' || filter === 'thisWeek') {
    return {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: endOfWeek(today, { weekStartsOn: 1 }),
    };
  }

  if (filter === 'next-week' || filter === 'nextWeek') {
    const nextWeekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
    return {
      start: nextWeekStart,
      end: endOfWeek(nextWeekStart, { weekStartsOn: 1 }),
    };
  }

  return null;
}

/**
 * @param {{ shiftDate?: string, shiftStartTime?: string }} item
 * @param {string} filter
 */
export function matchesJobDateFilter(item, filter, from = new Date()) {
  if (!filter || filter === 'all') return true;

  const range = getDateFilterRange(filter, from);
  if (!range) return true;

  const shiftDate = parseJobShiftDate(item?.shiftDate);
  if (!shiftDate) return false;

  if (filter === 'urgent' || filter === 'next24Hours') {
    const shiftStart = parseJobShiftStart(item);
    if (!shiftStart) {
      return isWithinInterval(shiftDate, {
        start: startOfDay(range.start),
        end: startOfDay(range.end),
      });
    }
    return shiftStart >= range.start && shiftStart <= range.end;
  }

  return isWithinInterval(shiftDate, {
    start: startOfDay(range.start),
    end: startOfDay(range.end),
  });
}

export function compareByShiftDate(a, b) {
  const dateA = parseJobShiftDate(a?.shiftDate)?.getTime() || Number.MAX_SAFE_INTEGER;
  const dateB = parseJobShiftDate(b?.shiftDate)?.getTime() || Number.MAX_SAFE_INTEGER;
  if (dateA !== dateB) return dateA - dateB;

  const timeA = a?.shiftStartTime || '99:99';
  const timeB = b?.shiftStartTime || '99:99';
  return timeA.localeCompare(timeB);
}

/** Find-jobs board: newest posted first, then earlier shift within the same post. */
export function compareJobsNewestFirst(a, b) {
  const createdA = Date.parse(a?.createdAt || a?.postedAt) || 0;
  const createdB = Date.parse(b?.createdAt || b?.postedAt) || 0;
  if (createdA !== createdB) return createdB - createdA;

  return compareByShiftDate(
    { shiftDate: a?.shiftDate, shiftStartTime: a?.shiftStartTime },
    { shiftDate: b?.shiftDate, shiftStartTime: b?.shiftStartTime }
  );
}

function formatClock(time) {
  if (!time) return '';
  try {
    const parsed = parse(time, 'HH:mm', new Date());
    return isValid(parsed) ? format(parsed, 'h:mm a') : time;
  } catch {
    return time;
  }
}

/** Clear date parts for job cards / calendar / map. */
export function getJobDateParts(job = {}) {
  const dateStr = job.shiftDate || job.shiftRows?.[0]?.date || '';
  const start = job.shiftStartTime || job.shiftRows?.[0]?.startTime || '';
  const end = job.shiftEndTime || job.shiftRows?.[0]?.endTime || '';
  const parsed = parseJobShiftDate(dateStr);
  const time = start && end ? `${formatClock(start)} – ${formatClock(end)}` : formatClock(start);

  if (!parsed) {
    return {
      weekday: '',
      day: '—',
      month: '',
      time,
      label: job.schedule || 'Date TBC',
      hasDate: false,
      iso: '',
    };
  }

  return {
    weekday: format(parsed, 'EEE'),
    day: format(parsed, 'd'),
    month: format(parsed, 'MMM'),
    time,
    label: `${format(parsed, 'EEE d MMM yyyy')}${time ? ` · ${time}` : ''}`,
    hasDate: true,
    iso: format(parsed, 'yyyy-MM-dd'),
  };
}

export function formatShiftRowLabel(shiftDate, startTime, endTime) {
  try {
    const day = parse(shiftDate, 'yyyy-MM-dd', new Date());
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    if (!isValid(day)) return `${shiftDate} - ${startTime} To ${endTime}`;
    return `${format(day, 'MMM d yyyy')} - ${isValid(start) ? format(start, 'hh a') : startTime} To ${
      isValid(end) ? format(end, 'hh a') : endTime
    }`;
  } catch {
    return `${shiftDate} - ${startTime} To ${endTime}`;
  }
}

export function buildRelativeShift({ hoursFromNow = 0, durationHours = 8 } = {}) {
  const start = addHours(new Date(), hoursFromNow);
  const end = addHours(start, durationHours);
  const shiftDate = toDateKey(start);
  const shiftStartTime = format(start, 'HH:mm');
  const shiftEndTime = format(end, 'HH:mm');

  return {
    shiftDate,
    shiftStartTime,
    shiftEndTime,
    shiftRows: [
      {
        id: 's1',
        date: shiftDate,
        startTime: shiftStartTime,
        endTime: shiftEndTime,
        label: formatShiftRowLabel(shiftDate, shiftStartTime, shiftEndTime),
      },
    ],
  };
}

export function buildRelativeShiftOnDay({ daysFromNow = 0, startTime = '09:00', endTime = '17:00' } = {}) {
  const day = addDays(startOfDay(new Date()), daysFromNow);
  const shiftDate = toDateKey(day);

  return {
    shiftDate,
    shiftStartTime: startTime,
    shiftEndTime: endTime,
    shiftRows: [
      {
        id: 's1',
        date: shiftDate,
        startTime,
        endTime,
        label: formatShiftRowLabel(shiftDate, startTime, endTime),
      },
    ],
  };
}
