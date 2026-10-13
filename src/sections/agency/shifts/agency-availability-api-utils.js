import {
  format,
  isValid,
  parse,
  parseISO,
  eachDayOfInterval,
  startOfDay,
  startOfWeek,
  addDays,
} from 'date-fns';

import { isMongoObjectId } from 'src/sections/branches/agency-branch-utils';
import { parseCoordinates, readApiLate, readApiLong } from 'src/sections/branches/geo-coordinates';


function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = pickId(value._id, value.id, value.staffId, value.workerId);
      if (nested) return nested;
      continue;
    }
    return String(value);
  }
  return '';
}

function pickName(...values) {
  for (const value of values) {
    const text = String(value || '').trim();
    if (text) return text;
  }
  return '';
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

function toHHMM(value) {
  if (value == null || value === '') return '';
  const raw = String(value).trim();
  if (/^\d{1,2}:\d{2}/.test(raw)) {
    const [h, m] = raw.split(':');
    return `${String(Number(h)).padStart(2, '0')}:${String(m).slice(0, 2).padStart(2, '0')}`;
  }
  try {
    const date = parseISO(raw);
    if (isValid(date)) return format(date, 'HH:mm');
  } catch {
  }
  return '';
}

export function toAgencyAvailabilityIso(dateStr, timeStr = '00:00') {
  const dateKey = String(dateStr || '').trim();
  const timeKey = String(timeStr || '00:00').trim() || '00:00';
  if (!dateKey) return new Date().toISOString();

  const parsed = parse(`${dateKey} ${timeKey}`, 'yyyy-MM-dd HH:mm', new Date());
  if (!isValid(parsed)) {
    try {
      return new Date(`${dateKey}T${timeKey}:00`).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  return parsed.toISOString();
}

export function resolveAvailabilityDateTimes({
  date,
  startTime = '09:00',
  endTime = '18:00',
  startDateTime,
  endDateTime,
} = {}) {
  const startIso = startDateTime || toAgencyAvailabilityIso(date, startTime);
  let endIso = endDateTime || toAgencyAvailabilityIso(date, endTime);

  const startMs = Date.parse(startIso);
  const endMs = Date.parse(endIso);
  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs <= startMs) {
    const dateKey = String(date || toDateKey(startIso) || '').trim();
    if (dateKey) {
      const nextDay = format(addDays(parse(dateKey, 'yyyy-MM-dd', new Date()), 1), 'yyyy-MM-dd');
      endIso = toAgencyAvailabilityIso(nextDay, endTime || toHHMM(endDateTime) || '07:00');
    } else {
      endIso = new Date(startMs + 60 * 60 * 1000).toISOString();
    }
  }

  return { startDateTime: startIso, endDateTime: endIso };
}

export function getBranchCoordinates(branch) {
  const parsed = parseCoordinates(branch?.location?.coordinates);
  if (parsed) return [parsed.longitude, parsed.latitude];
  const lng = Number(readApiLong(branch));
  const lat = Number(readApiLate(branch));
  if (Number.isFinite(lng) && Number.isFinite(lat)) return [lng, lat];
  return [9.999, 9.999];
}

export function resolveAgencyAvailabilityStatus({ kind = 'available', formStatus = '' } = {}) {
  const raw = String(formStatus || kind || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

  // Backend mongoose enum (camelCase where applicable)
  if (raw === 'addleave' || raw === 'leave') return 'leave';
  if (raw === 'dayoff' || raw === 'notscheduled' || raw === 'unscheduled') return 'dayOff';
  if (raw === 'busy' || raw === 'unavailable' || raw === 'block') return 'busy';
  if (raw === 'oncall') return 'onCall';
  if (raw === 'sleepover') return 'sleepover';
  // Timed work / add-shift — same field backend requires on every create
  if (
    !raw ||
    raw === 'shift' ||
    raw === 'addshift' ||
    raw === 'available' ||
    raw === 'active' ||
    raw === 'scheduled' ||
    raw === 'working' ||
    raw === 'pending'
  ) {
    return 'available';
  }

  return raw;
}


export function buildAgencyAvailabilityPayload({
  status = 'available',
  date,
  startTime = '09:00',
  endTime = '18:00',
  startDateTime,
  endDateTime,
  staffId = '',
  typeId = '',
  notes = '',
} = {}) {
  const resolvedStatus = resolveAgencyAvailabilityStatus({ kind: status }) || 'available';
  const times = resolveAvailabilityDateTimes({
    date,
    startTime,
    endTime,
    startDateTime,
    endDateTime,
  });

  /** @type {Record<string, unknown>} */
  const body = {
    status: resolvedStatus,
    startDateTime: times.startDateTime,
    endDateTime: times.endDateTime,
  };

  const staff = String(staffId || '').trim();
  if (staff && isMongoObjectId(staff)) {
    body.user = staff;
    body.staff = staff;
    body.worker = staff;
  }

  const jobType = String(typeId || '').trim();
  if (jobType && isMongoObjectId(jobType)) {
    body.jobType = jobType;
  }

  const note = String(notes || '').trim();
  if (note) {
    body.notes = note;
    body.note = note;
  }

  if (!body.status) {
    body.status = 'available';
  }

  return body;
}

export function mapAgencyAvailabilityFromApi(item = {}) {
  const id = pickId(item._id, item.id);
  const statusRaw = item.status || item.kind || (typeof item.type === 'string' ? item.type : '');
  const status = String(statusRaw || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  const startDateTime = item.startDateTime || item.start || item.from || '';
  const endDateTime = item.endDateTime || item.end || item.to || '';
  const date = toDateKey(startDateTime || item.date);
  const startTime = toHHMM(startDateTime) || toHHMM(item.startTime) || '09:00';
  const endTime = toHHMM(endDateTime) || toHHMM(item.endTime) || '18:00';

  const staffId =
    pickId(
      item.staff,
      item.staffId,
      item.worker,
      item.workerId,
      item.employee,
      item.agencyStaff,
      item.agencyStaffId,
      item.membershipId,
      item.user
    ) || '';

  const staffName = pickName(
    item.staffName,
    item.workerName,
    item.staff?.name,
    item.staff?.basicInfo?.name,
    item.worker?.name,
    item.user?.name,
    item.employee?.name
  );

  const location =
    typeof item.location === 'string'
      ? item.location
      : item.location?.fullAddress || item.address || '';

  const typeId = pickId(
    typeof item.type === 'object' ? item.type : null,
    item.jobType,
    item.jobTypeId,
    typeof item.type === 'string' && isMongoObjectId(item.type) ? item.type : ''
  );
  const typeTitle =
    typeof item.type === 'object'
      ? item.type?.title || item.type?.name || ''
      : item.typeTitle || item.jobTypeTitle || '';

  const isLeave = status === 'leave' || Boolean(item.leave);
  const isDayOff =
    status === 'dayoff' ||
    status === 'notscheduled' ||
    status === 'unscheduled' ||
    Boolean(item.dayOff);
  const isBusy = status === 'busy' || status === 'unavailable' || Boolean(item.busy);
  const isOnCall = status === 'oncall' || Boolean(item.onCall);
  const isSleepover = status === 'sleepover' || Boolean(item.sleepover);
  const isBlock = isLeave || isDayOff || isBusy;

  return {
    id: id || `${staffId || 'row'}-${date}-${startTime}`,
    apiId: id,
    staffId,
    staffName,
    date,
    startTime: isBlock ? startTime || '00:00' : startTime,
    endTime: isBlock ? endTime || '23:59' : endTime,
    startDateTime,
    endDateTime,
    location,
    locationCoords: Array.isArray(item.location?.coordinates) ? item.location.coordinates : null,
    manualJobType: typeTitle || typeId || '',
    typeId,
    notes: item.notes || item.note || item.description || '',
    leave: isLeave,
    dayOff: isDayOff,
    busy: isBusy,
    onCall: isOnCall,
    sleepover: isSleepover,
    blocksAutoAccept: isBlock,
    apiStatus: status,
    displayLabel: item.title || item.leaveTitle || item.status || statusRaw,
    raw: item,
  };
}

function expandAvailabilityEntry(entry, { maxDays = 62 } = {}) {
  if (!entry?.date) return [];

  const start = entry.startDateTime
    ? parseISO(entry.startDateTime)
    : parse(entry.date, 'yyyy-MM-dd', new Date());
  const end = entry.endDateTime ? parseISO(entry.endDateTime) : start;
  if (!isValid(start)) return [entry];

  const endSafe = isValid(end) && end >= start ? end : start;
  const sameDay = format(start, 'yyyy-MM-dd') === format(endSafe, 'yyyy-MM-dd');
  const isMultiDayBlock =
    !sameDay && (entry.leave || entry.dayOff || entry.busy || entry.blocksAutoAccept);

  if (!isMultiDayBlock) {
    return [{ ...entry, date: format(start, 'yyyy-MM-dd') }];
  }

  try {
    const days = eachDayOfInterval({ start: startOfDay(start), end: startOfDay(endSafe) });
    return days.slice(0, maxDays).map((day) => ({
      ...entry,
      date: format(day, 'yyyy-MM-dd'),
      id: `${entry.apiId || entry.id}-${format(day, 'yyyy-MM-dd')}`,
    }));
  } catch {
    return [entry];
  }
}

export function flattenTeamsStaff(teams = []) {
  return (teams || []).flatMap((team) => team.staff || []);
}

/**
 * @deprecated Do not create a separate "Availability" team — blocks belong on calendar staff rows.
 * Kept for callers that only need staff list enrichment without orphans.
 */
export function mergeAvailabilityStaffIntoTeams(teams = [], availabilityList = []) {
  return (teams || []).map((team) => ({
    ...team,
    staff: [...(team.staff || [])],
  }));
}

export function availabilityListToShiftMap(
  list = [],
  {
    keepExisting = {},
    keepExisting: keepExistingAlias,
    staffList = [],
    onlyMatchedStaff = false,
    onlyMatchedStaff: onlyMatchedStaffAlias,
  } = {}
) {
  const next = { ...(keepExistingAlias || keepExisting || {}) };
  const matchStaffOnly = onlyMatchedStaffAlias ?? onlyMatchedStaff;

  const resolveStaffKey = (rawId) => {
    const id = String(rawId || '').trim();
    if (!id) return '';
    const match = (staffList || []).find((member) => {
      const candidates = [
        member.id,
        member.staffId,
        member.membershipId,
        member._id,
        member.raw?.workerId,
        member.raw?.staffId,
        member.raw?._id,
        member.raw?.worker?._id,
        member.raw?.worker?.id,
        member.raw?.user?._id,
        member.raw?.user?.id,
      ];
      return candidates.some((candidate) => {
        const value = String(candidate || '').trim();
        if (!value) return false;
        if (value === id) return true;
        if (value.includes('__') && value.endsWith(`__${id}`)) return true;
        if (id.includes('__') && id.endsWith(`__${value}`)) return true;
        return false;
      });
    });
    return match ? String(match.id) : matchStaffOnly ? '' : id;
  };

  const expanded = (list || []).flatMap((entry) => expandAvailabilityEntry(entry));

  expanded.forEach((entry) => {
    if (!entry?.date) return;
    const staffKey = resolveStaffKey(entry.staffId);
    if (!staffKey || staffKey === 'unassigned') return;

    const key = `${staffKey}-${entry.date}`;
    const normalized = {
      ...entry,
      id: entry.id || key,
      staffId: staffKey,
    };
    const existing = next[key];

    if (normalized.leave || normalized.dayOff || normalized.busy || normalized.onCall || normalized.sleepover || normalized.blocksAutoAccept) {
      next[key] = normalized;
      return;
    }

    if (!existing) {
      next[key] = normalized;
      return;
    }

    const asArray = Array.isArray(existing) ? existing : [existing];
    const filtered = asArray.filter(
      (item) => !(item.leave || item.dayOff || item.busy || item.blocksAutoAccept)
    );
    const withoutDup = filtered.filter(
      (item) => item.id !== normalized.id && item.apiId !== normalized.apiId
    );
    next[key] = [...withoutDup, normalized];
  });

  return next;
}

export function getAvailabilityWeekStart(list = [], fallback = new Date()) {
  const dates = (list || [])
    .map((item) => item.date || toDateKey(item.startDateTime))
    .filter(Boolean)
    .sort();
  if (!dates.length) return fallback;
  const first = parse(dates[0], 'yyyy-MM-dd', new Date());
  if (!isValid(first)) return fallback;
  return startOfWeek(first, { weekStartsOn: 0 });
}

const TEAM_COLORS = [
  '#e53935',
  '#212121',
  '#455a64',
  '#039be5',
  '#1565c0',
  '#00897b',
  '#0277bd',
  '#0d47a1',
  '#004d40',
  '#9e9e9e',
];

function badgeFromLabel(label = '') {
  const words = String(label)
    .replace(/[-–—]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return 'ST';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}


export function buildAgencyTeamsFromStaff(
  staffList = [],
  getSpecialtyLabel = (v) => v,
  availabilityList = []
) {
  const groups = new Map();
  const knownIds = new Set();

  (staffList || []).forEach((member) => {
    if (!member?.id) return;
    const status = String(member.status || '').toLowerCase();
    if (status === 'deleted' || status === 'delete') return;

    const specialtyKey = String(member.specialty || member.speciality || 'staff').trim() || 'staff';
    const specialtyLabel = getSpecialtyLabel(specialtyKey) || specialtyKey;

    if (!groups.has(specialtyKey)) {
      const index = groups.size;
      groups.set(specialtyKey, {
        id: `team-${specialtyKey}`,
        color: TEAM_COLORS[index % TEAM_COLORS.length],
        badge: badgeFromLabel(specialtyLabel),
        badgeColor: '#546e7a',
        label: specialtyLabel,
        staff: [],
      });
    }

    knownIds.add(String(member.id));
    if (member.staffId) knownIds.add(String(member.staffId));
    if (member.membershipId) knownIds.add(String(member.membershipId));

    groups.get(specialtyKey).staff.push({
      id: member.id,
      staffId: member.staffId || '',
      membershipId: member.membershipId || member.id,
      name: member.name || 'Staff',
      role: specialtyLabel,
      avatarUrl: member.avatarUrl || null,
      isVacant: false,
    });
  });

  const orphanStaff = [];
  let needsUnassigned = false;

  (availabilityList || []).forEach((entry) => {
    const id = String(entry.staffId || '').trim();
    if (!id) {
      needsUnassigned = true;
      return;
    }
    if (knownIds.has(id)) return;
    knownIds.add(id);
    orphanStaff.push({
      id,
      staffId: id,
      name: entry.staffName || `Staff ${id.slice(-4)}`,
      role: 'Staff',
      isVacant: false,
    });
  });

  if (orphanStaff.length) {
    groups.set('availability-orphan', {
      id: 'availability-orphan',
      color: '#039be5',
      badge: 'AV',
      badgeColor: '#0277bd',
      label: 'Availability',
      staff: orphanStaff,
    });
  }

  if (needsUnassigned && !knownIds.has('unassigned')) {
    groups.set('unassigned', {
      id: 'unassigned-availability',
      color: '#78909c',
      badge: 'UA',
      badgeColor: '#546e7a',
      label: 'Unassigned',
      staff: [
        {
          id: 'unassigned',
          staffId: '',
          name: 'Unassigned',
          role: 'Availability',
          isVacant: false,
        },
      ],
    });
  }

  return Array.from(groups.values());
}

export function buildAgencyTeamsFromAvailability(list = []) {
  const byId = new Map();

  (list || []).forEach((entry) => {
    const id = String(entry.staffId || '').trim();
    if (!id || byId.has(id)) return;
    byId.set(id, {
      id,
      staffId: id,
      name: entry.staffName || `Staff ${id.slice(-4)}`,
      role: 'Staff',
      isVacant: false,
    });
  });

  const hasUnassigned = (list || []).some((entry) => !String(entry.staffId || '').trim());
  if (hasUnassigned && !byId.has('unassigned')) {
    byId.set('unassigned', {
      id: 'unassigned',
      staffId: '',
      name: 'Unassigned',
      role: 'Availability',
      isVacant: false,
    });
  }

  const staff = Array.from(byId.values());
  if (!staff.length) return [];

  return [
    {
      id: 'availability-staff',
      color: '#039be5',
      badge: 'AV',
      badgeColor: '#0277bd',
      label: 'Availability',
      staff,
    },
  ];
}

export function mapAgencyBranchesToLocations(branches = []) {
  return (branches || [])
    .filter((branch) => branch && (branch.status === 'active' || branch.isActive !== false))
    .map((branch) => {
      const coords = getBranchCoordinates(branch);
      return {
        id: String(branch.id || branch._id || ''),
        label: branch.name || branch.branchName || 'Location',
        address: branch.location?.fullAddress || '',
        latitude: coords[1],
        longitude: coords[0],
        coordinates: coords,
        branch,
      };
    })
    .filter((loc) => loc.id);
}
