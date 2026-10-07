import { format, isValid, parseISO } from 'date-fns';

// ----------------------------------------------------------------------

/** Keep in sync with `src/components/weather/shift-weather-utils` WEATHER_TYPES */
const WEATHER_TYPES = {
  SUN: 'sun',
  CLOUD: 'cloud',
  PARTLY_CLOUDY: 'partly-cloudy',
  RAIN: 'rain',
};

const TEAM_COLORS = ['#e53935', '#212121', '#455a64', '#039be5', '#1565c0', '#00897b', '#0277bd', '#0d47a1', '#004d40', '#9e9e9e'];

/** WMO / Open-Meteo weatherCode → rota icon type */
export function mapWeatherCodeToType(code) {
  const n = Number(code);
  if (Number.isNaN(n)) return null;
  if (n === 0) return WEATHER_TYPES.SUN;
  if (n === 1 || n === 2) return WEATHER_TYPES.PARTLY_CLOUDY;
  if (n === 3 || n === 45 || n === 48) return WEATHER_TYPES.CLOUD;
  if ((n >= 51 && n <= 67) || (n >= 80 && n <= 82) || (n >= 95 && n <= 99)) {
    return WEATHER_TYPES.RAIN;
  }
  if (n >= 71 && n <= 86) return WEATHER_TYPES.CLOUD;
  return WEATHER_TYPES.PARTLY_CLOUDY;
}

function pickId(...values) {
  for (const value of values) {
    if (value == null || value === '') continue;
    if (typeof value === 'object') {
      const nested = value._id || value.id || value.workerId;
      if (nested != null && nested !== '') return String(nested);
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
    // ignore
  }
  return '';
}

function slugify(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function badgeFromLabel(label = '') {
  const words = String(label).replace(/[-–—]/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return 'TM';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

function mapDayWeather(weather, dateKey) {
  if (!weather || typeof weather !== 'object') return null;
  return {
    date: dateKey,
    temperature: Number(weather.temperature),
    humidityMax: Number(weather.humidityMax),
    humidityMin: Number(weather.humidityMin),
    uvIndex: Number(weather.uvIndex),
    wetBulb: Number(weather.wetBulb),
    weatherCode: Number(weather.weatherCode),
    sunrise: weather.sunrise || '',
    sunset: weather.sunset || '',
    type: mapWeatherCodeToType(weather.weatherCode),
    raw: weather,
  };
}

/**
 * Flatten worker.schedule date map → shift rows with date attached.
 * schedule: { "2026-07-21": { weather, shifts: [...], availability: [] } }
 */
function extractShiftList(worker = {}) {
  const schedule = worker.schedule;
  const collected = [];

  if (schedule && typeof schedule === 'object' && !Array.isArray(schedule)) {
    Object.entries(schedule).forEach(([dateKey, dayPayload]) => {
      const day = dayPayload && typeof dayPayload === 'object' ? dayPayload : {};
      const date = toDateKey(dateKey) || dateKey;
      const dayShifts = Array.isArray(day.shifts) ? day.shifts : [];
      const availability = (() => {
        if (Array.isArray(day.availability)) return day.availability;
        if (Array.isArray(day.availabilities)) return day.availabilities;
        if (day.availability && typeof day.availability === 'object') return [day.availability];
        return [];
      })();

      dayShifts.forEach((shift) => {
        collected.push({
          ...shift,
          date,
          weather: day.weather || null,
        });
      });

      availability.forEach((slot, index) => {
        if (!slot || typeof slot !== 'object') {
          collected.push({
            date,
            status: 'dayOff',
            kind: 'unavailable',
            dayOff: true,
            id: `avail-${date}-${index}`,
            weather: day.weather || null,
          });
          return;
        }
        // Keep API status (leave / busy / dayOff / onCall / sleepover) for mapCalendarShift
        collected.push({
          ...slot,
          date,
          status: slot.status || slot.kind || '',
          weather: day.weather || null,
        });
      });
    });
    return collected;
  }

  const nestedLists = [worker.shifts, worker.bookings, worker.schedules, Array.isArray(schedule) ? schedule : null];
  for (const list of nestedLists) {
    if (Array.isArray(list) && list.length) return list;
  }

  return collected;
}

function mapCalendarShift(raw = {}, worker = {}, staffId, teamBadge = '', teamLabel = '') {
  const date = toDateKey(raw.date || raw.day || raw.shiftDate || raw.startDate);
  if (!date || !staffId) return null;

  const startTime = toHHMM(raw.startTime || raw.start || raw.from || raw.shiftStart || raw.startDateTime);
  const endTime = toHHMM(raw.endTime || raw.end || raw.to || raw.shiftEnd || raw.endDateTime);
  const status = String(raw.status || raw.kind || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  const leaveType = String(raw.leaveType || (typeof raw.type === 'string' ? raw.type : '') || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  const isLeave = status === 'leave' || leaveType === 'leave' || leaveType === 'ssp' || leaveType === 'sick' || leaveType === 'holiday' || Boolean(raw.leave);

  const isBusy = status === 'busy' || Boolean(raw.busy);
  const isDayOff = status === 'dayoff' || status === 'unavailable' || status === 'notscheduled' || status === 'unscheduled' || Boolean(raw.dayOff);
  const isOnCall = status === 'oncall' || Boolean(raw.onCall);
  const isSleepover = status === 'sleepover' || Boolean(raw.sleepover);

  const id = pickId(raw.bookingId, raw._id, raw.id, raw.shiftId, raw.availabilityId) || `${staffId}-${date}-${startTime || status || 'shift'}`;

  const apiId = pickId(raw._id, raw.id, raw.availabilityId);
  const employerName = pickName(raw.employer?.name, raw.employerName);
  const displayName = pickName(raw.displayName, raw.workerName, worker.name, employerName);
  const jobId = pickId(raw.jobId, raw.job?._id, raw.job?.id, typeof raw.job === 'string' ? raw.job : '', raw.jobRef);
  const jobTitle = pickName(raw.jobTitle, raw.job?.title, raw.job?.name, raw.jobTypeTitle);

  if (isLeave) {
    return {
      id,
      apiId: apiId || undefined,
      staffId,
      date,
      kind: 'leave',
      leave: true,
      blocksAutoAccept: true,
      startTime: startTime || '00:00',
      endTime: endTime || '23:59',
      leaveTitle: raw.leaveTitle || raw.title || 'Leave',
      leaveSubtitle: raw.leaveSubtitle || raw.subtitle || '',
      leaveType: leaveType || 'holiday',
      notes: raw.notes || raw.note || '',
      displayLabel: raw.leaveTitle || raw.title || raw.status || 'Leave',
      displayName,
      weather: raw.weather || null,
    };
  }

  if (isBusy) {
    return {
      id,
      apiId: apiId || undefined,
      staffId,
      date,
      kind: 'busy',
      busy: true,
      blocksAutoAccept: true,
      startTime: startTime || '00:00',
      endTime: endTime || '23:59',
      notes: raw.notes || raw.note || '',
      displayLabel: raw.title || raw.status || 'Busy',
      displayName,
      weather: raw.weather || null,
    };
  }

  if (isDayOff || status === 'unavailable') {
    return {
      id,
      apiId: apiId || undefined,
      staffId,
      date,
      kind: 'unavailable',
      dayOff: true,
      blocksAutoAccept: true,
      faded: true,
      startTime: startTime || '00:00',
      endTime: endTime || '23:59',
      notes: raw.notes || raw.note || '',
      displayName,
      weather: raw.weather || null,
    };
  }

  if (isOnCall) {
    return {
      id,
      apiId: apiId || undefined,
      staffId,
      date,
      kind: 'onCall',
      onCall: true,
      startTime: startTime || '00:00',
      endTime: endTime || '23:59',
      notes: raw.notes || raw.note || '',
      displayName,
      weather: raw.weather || null,
    };
  }

  if (isSleepover) {
    return {
      id,
      apiId: apiId || undefined,
      staffId,
      date,
      kind: 'sleepover',
      sleepover: true,
      startTime: startTime || '22:00',
      endTime: endTime || '07:00',
      notes: raw.notes || raw.note || '',
      displayName,
      weather: raw.weather || null,
    };
  }

  // Free / available slots with no times — empty cell
  if ((status === 'available' || status === 'free') && !startTime && !endTime) {
    return null;
  }

  const assignedWorkerId =
    pickId(raw.workerId, raw.assignedWorkerId, raw.assignedTo, raw.worker?._id, raw.worker?.id, raw.assignedWorker?._id, raw.assignedWorker?.id) || undefined;
  const explicitBidding = raw.receivingBids ?? raw.isBiddingAllowed ?? raw.biddingAllowed ?? raw.allowBidding;
  const openForBids = explicitBidding != null ? Boolean(explicitBidding) : Boolean(jobId && !assignedWorkerId);

  return {
    id,
    staffId,
    date,
    kind: 'shift',
    jobId: jobId || undefined,
    jobTitle: jobTitle || undefined,
    roleCode: pickName(raw.jobType, raw.jobTypeTitle, raw.jobTitle, raw.type, raw.role, worker.role, teamLabel) || teamBadge || '',
    jobType: pickName(raw.jobType, raw.jobTypeTitle, raw.jobTitle, raw.type, raw.role, worker.role, teamLabel),
    startTime,
    endTime,
    displayName: displayName || 'Unassigned',
    hasBreak: Boolean(raw.hasBreak ?? raw.isBreak ?? Number(raw.breakMin || raw.breakMins) > 0),
    breakMins: Number(raw.breakMin ?? raw.breakMins ?? 0) || 0,
    staffCount: Number(raw.staffCount || raw.allowedPersons || 0) || undefined,
    location: raw.location?.fullAddress || (typeof raw.location === 'string' ? raw.location : '') || raw.branchName || '',
    verified: Boolean(raw.verified),
    warning: Boolean(raw.warning),
    shield: Boolean(raw.shield),
    onCall: Boolean(raw.onCall),
    sleepover: Boolean(raw.sleepover),
    allDay: Boolean(raw.allDay),
    status,
    isMyBooking: Boolean(raw.isMyBooking),
    // Only a real booking id — never fall back to the calendar row `_id` (that marked every shift "filled")
    bookingId: pickId(raw.bookingId, raw.booking?._id, raw.booking?.id) || undefined,
    workerId: assignedWorkerId,
    receivingBids: openForBids,
    isBiddingAllowed: openForBids,
    apiId: apiId || undefined,
    employer: raw.employer || null,
    user: raw.user || null,
    weather: raw.weather || null,
    raw,
  };
}

function isCalendarStatusBlock(shift) {
  return Boolean(shift?.leave || shift?.busy || shift?.dayOff || shift?.onCall || shift?.sleepover || shift?.blocksAutoAccept);
}

function extractAgencyFromWorkerSchedule(worker = {}) {
  const schedule = worker.schedule;
  if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) return null;

  for (const dayPayload of Object.values(schedule)) {
    const dayShifts = Array.isArray(dayPayload?.shifts) ? dayPayload.shifts : [];
    for (const shift of dayShifts) {
      const employer = shift?.employer;
      if (!employer || typeof employer !== 'object') continue;
      const userType = String(employer.accountState?.userType || employer.userType || '')
        .trim()
        .toLowerCase();
      if (userType !== 'agency') continue;
      const id = pickId(employer.id, employer._id);
      if (!id) continue;
      return { id, name: pickName(employer.name) };
    }
  }
  return null;
}

function mapCalendarWorker(worker = {}, index = 0) {
  const nested = worker.worker && typeof worker.worker === 'object' ? worker.worker : worker.user && typeof worker.user === 'object' ? worker.user : {};

  // Explicit null workerId (API "Unknown") must not fall through to other ids incorrectly
  const rawWorkerId = worker.workerId;
  const id =
    rawWorkerId != null && rawWorkerId !== ''
      ? String(rawWorkerId)
      : pickId(worker._id, worker.id, nested._id, nested.id, nested.workerId, worker.userId, worker.staffId) || `worker-${index}`;

  const name =
    pickName(worker.workerName, worker.name, nested.name, nested.workerName, worker.fullName, nested.fullName) || (rawWorkerId == null ? 'Unknown' : `Worker ${index + 1}`);

  const agency = worker.agency && typeof worker.agency === 'object' ? worker.agency : nested.agency && typeof nested.agency === 'object' ? nested.agency : null;

  const scheduleAgency = extractAgencyFromWorkerSchedule(worker);
  const agencyId = pickId(agency?._id, agency?.id, worker.agencyId, scheduleAgency?.id);
  const agencyName = pickName(agency?.name, worker.agencyName, scheduleAgency?.name);

  return {
    id,
    // Keep alternate ids so availability GET (staff) can map back onto calendar rows (workerId)
    staffId: pickId(worker.staffId, nested.staffId, nested._id) || id,
    membershipId: pickId(worker.membershipId, worker._id) || undefined,
    name,
    email: pickName(worker.email, nested.email),
    role: pickName(worker.role, worker.title, worker.jobType, nested.role, nested.title),
    roleCode: pickName(worker.roleCode, worker.code, nested.roleCode),
    avatarUrl: worker.profileIcon || worker.avatarUrl || nested.profileIcon || '',
    fromAgency: Boolean(agency || worker.fromAgency || worker.agencyId || scheduleAgency?.id),
    agencyId,
    agencyName,
    isVacant: Boolean(worker.isVacant),
    isPast: Boolean(worker.isPast),
    raw: worker,
  };
}

function collectDayWeatherFromWorkers(workersRaw = [], dayWeatherByDate = {}) {
  workersRaw.forEach((worker) => {
    const schedule = worker?.schedule;
    if (!schedule || typeof schedule !== 'object' || Array.isArray(schedule)) return;

    Object.entries(schedule).forEach(([dateKey, dayPayload]) => {
      const date = toDateKey(dateKey) || dateKey;
      if (!date || dayWeatherByDate[date]) return;
      const mapped = mapDayWeather(dayPayload?.weather, date);
      if (mapped) dayWeatherByDate[date] = mapped;
    });
  });
  return dayWeatherByDate;
}

/**
 * Map GET `/web/care-home/booking/calender`
 * → `{ teams, shifts, dayWeather, meta, message }`
 */
export function mapCareHomeBookingCalendarFromApi(response = {}) {
  const data = response?.data && typeof response.data === 'object' ? response.data : {};
  const meta = response?.meta && typeof response.meta === 'object' ? response.meta : {};
  const roleEntries = Object.entries(data);

  const shifts = {};
  const dayWeather = {};

  const teams = roleEntries.map(([roleLabel, rolePayload], teamIndex) => {
    const payload = rolePayload && typeof rolePayload === 'object' ? rolePayload : {};
    const workersRaw = Array.isArray(payload.workers) ? payload.workers : Array.isArray(payload.staff) ? payload.staff : Array.isArray(payload.nurses) ? payload.nurses : [];
    const totals = payload.totals && typeof payload.totals === 'object' ? payload.totals : {};
    const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
    const label = String(roleLabel || `Team ${teamIndex + 1}`).trim();
    const teamId = slugify(label) || `team-${teamIndex}`;
    const teamBadge = badgeFromLabel(label);

    collectDayWeatherFromWorkers(workersRaw, dayWeather);

    const staffById = new Map();

    workersRaw.forEach((worker, workerIndex) => {
      const mapped = mapCalendarWorker(worker, workerIndex);
      if (!staffById.has(mapped.id)) {
        staffById.set(mapped.id, mapped);
      }

      extractShiftList(worker).forEach((shiftRaw) => {
        const shift = mapCalendarShift(shiftRaw, mapped, mapped.id, teamBadge, label);
        if (!shift) return;
        const key = `${shift.staffId}-${shift.date}`;
        const existing = shifts[key];

        // leave / busy / dayOff / onCall / sleepover always win the cell
        if (isCalendarStatusBlock(shift)) {
          shifts[key] = shift;
        } else if (!existing) {
          shifts[key] = shift;
        } else if (!isCalendarStatusBlock(existing)) {
          const asArray = Array.isArray(existing) ? existing : [existing];
          const withoutDup = asArray.filter((item) => item.id !== shift.id);
          const next = [...withoutDup, shift];
          shifts[key] = next.length === 1 ? next[0] : next;
        }

        // Keep agency link on staff even if top-level worker payload omitted it
        if (!mapped.agencyId && shift.employer) {
          const userType = String(shift.employer.accountState?.userType || shift.employer.userType || '')
            .trim()
            .toLowerCase();
          if (userType === 'agency') {
            const agencyId = pickId(shift.employer.id, shift.employer._id);
            if (agencyId) {
              mapped.agencyId = agencyId;
              mapped.agencyName = pickName(shift.employer.name, mapped.agencyName);
              mapped.fromAgency = true;
              staffById.set(mapped.id, { ...mapped });
            }
          }
        }
      });
    });

    const staff = [...staffById.values()];
    // A job type with no workers (e.g. a supplier's saved type with no shifts yet) still gets
    // its row group: one placeholder row, kept visible by the roster filter (`keepWhenEmpty`).
    const isEmptyJobType = staff.length === 0;
    const resolvedStaff = isEmptyJobType
      ? [
          {
            id: `role-${teamId}`,
            name: 'No shifts yet',
            role: label,
            isVacant: false,
            isPlaceholder: true,
          },
        ]
      : staff;

    return {
      id: teamId,
      color,
      badge: teamBadge,
      badgeColor: color,
      label,
      keepWhenEmpty: isEmptyJobType,
      totals: {
        totalShifts: Number(totals.totalShifts) || 0,
        totalHours: Number(totals.totalHours) || 0,
        totalPeople: Number(totals.totalPeople) || staff.filter((s) => !s.isVacant).length,
      },
      staff: resolvedStaff,
    };
  });

  return {
    teams,
    shifts,
    dayWeather,
    meta: {
      totalShifts: Number(meta.totalShifts) || 0,
      totalHours: Number(meta.totalHours) || 0,
      totalCost: Number(meta.totalCost) || 0,
      totalPaidToWorker: Number(meta.totalPaidToWorker) || 0,
      totalPeople: Number(meta.totalPeople) || 0,
    },
    message: response?.message || '',
  };
}

export function formatCalendarMetaStats(meta = {}) {
  const hours = Number(meta.totalHours) || 0;
  const cost = Number(meta.totalCost) || 0;
  const count = Number(meta.totalShifts) || 0;

  return {
    hours: `${Math.round(hours)}h`,
    cost: `£${Math.round(cost).toLocaleString()}`,
    count: String(count),
  };
}
