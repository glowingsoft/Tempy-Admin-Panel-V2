import { addHours, format, formatDistanceToNow, isValid, parse, startOfDay } from 'date-fns';
import { isValidPhoneNumber } from 'react-phone-number-input';

export { DEFAULT_JOB_TYPE_LABELS as JOB_TYPE_OPTIONS } from './care-home-job-types-utils';

export const ACTIVE_JOB_HORIZON_OPTIONS = [
  { value: 'all', label: 'All upcoming' },
  { value: 'next6Hours', label: '6 hours', hours: 6 },
  { value: 'next12Hours', label: '12 hours', hours: 12 },
  { value: 'next24Hours', label: '24 hours', hours: 24 },
  { value: 'next3Days', label: '3 days', hours: 72 },
  { value: 'next7Days', label: '7 days', hours: 168 },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const JOB_API_STATUSES = ['active', 'inactive', 'deleted', 'completed'];

export const JOB_STATUS_CONFIG = {
  active: { label: 'Active', color: 'success' },
  inactive: { label: 'Inactive', color: 'warning' },
  deleted: { label: 'Deleted', color: 'default' },
  completed: { label: 'Completed', color: 'success' },
};

export const CREATED_JOB_API_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'deleted', label: 'Deleted' },
];

export const CREATED_JOB_FILL_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Receiving bids (unfilled)' },
  { value: 'scheduled', label: 'Active (filled)' },
  { value: 'completed', label: 'Completed' },
];

export const WORKER_RATING_OPTIONS = [
  { id: 'very-poor', label: 'Very poor', rating: 1 },
  { id: 'poor', label: 'Poor', rating: 2 },
  { id: 'satisfactory', label: 'Satisfactory', rating: 3 },
  { id: 'good', label: 'Good', rating: 4 },
  { id: 'excellent', label: 'Excellent', rating: 5 },
];

const LEGACY_WORKER_RATING_OPTIONS = [];

const ALL_WORKER_RATING_OPTIONS = [...WORKER_RATING_OPTIONS, ...LEGACY_WORKER_RATING_OPTIONS];

export const CREATED_JOB_API_STATUS_CONFIG = JOB_STATUS_CONFIG;

export function resolveJobApiStatus(status) {
  const raw = String(status || '')
    .trim()
    .toLowerCase();
  if (!raw) return '';

  const match = JOB_API_STATUSES.find((value) => value === raw);
  if (match) return match;

  if (raw === 'delete') return 'deleted';
  if (raw === 'closed' || raw === 'cancelled' || raw === 'canceled') return 'inactive';
  if (raw === 'complete' || raw === 'done' || raw === 'completeed') return 'completed';
  if (raw === 'open' || raw === 'live' || raw === 'published') return 'active';
  if (raw === 'draft' || raw === 'pending') return 'inactive';
  return '';
}

export function countJobsByApiStatus(jobs = []) {
  return jobs.reduce((acc, job) => {
    const key = resolveJobApiStatus(job?.apiStatus || job?.status) || 'active';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

export function getCreatedJobApiStatusKey(job) {
  return resolveJobApiStatus(job?.apiStatus || job?.status);
}

export function getCreatedJobStatusChip(job) {
  return getJobStatusConfig(job?.apiStatus || job?.status);
}

export const JOB_STATUS_OPTIONS = Object.entries(JOB_STATUS_CONFIG)
  .filter(([value]) => value !== 'deleted')
  .map(([value, config]) => ({
    value,
    label: config.label,
  }));

export function normalizeJobStatus(status) {
  return resolveJobApiStatus(status) || 'active';
}

export function normalizeReceivingBids(job, from = new Date()) {
  if (Array.isArray(job?.schedules) && job.schedules.length) {
    return job.schedules.some((entry) => {
      if (entry?.receivingBids === false || entry?.isBiddingAllowed === false) return false;

      if (entry?.date && entry?.startTime) {
        try {
          const start = parse(`${entry.date} ${entry.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
          if (isValid(start) && start.getTime() < from.getTime()) return false;
        } catch {
        }
      }

      return true;
    });
  }
  if (typeof job?.receivingBids === 'boolean') return job.receivingBids;
  return job?.status === 'open';
}

const FILLED_SHIFT_STATUSES = new Set(['accepted', 'booked', 'filled', 'assigned', 'confirmed', 'scheduled', 'in_progress', 'inprogress', 'completed']);

function resolveWorkerId(job) {
  const worker = job?.worker;
  if (worker && typeof worker === 'object') {
    return String(worker._id || worker.id || '').trim();
  }
  return String(job?.workerId || worker || job?.employeeId || job?.employee || '').trim();
}

function shiftHasCoverage(entry = {}) {
  if (String(entry?.bookingId || '').trim()) return true;
  if (String(entry?.workerId || '').trim()) return true;

  const status = String(entry?.status || '').toLowerCase();
  if (FILLED_SHIFT_STATUSES.has(status)) return true;

  if (entry?.receivingBids === false || entry?.isBiddingAllowed === false) return true;

  return false;
}

export function isJobScheduledWithWorkers(job) {
  const status = normalizeJobStatus(job?.apiStatus || job?.status);
  if (status !== 'active') return false;

  if (String(job?.bookingId || '').trim()) return true;
  if (job?.hasAcceptedBid) return true;
  if (Number(job?.acceptedBidsCount) > 0) return true;

  if (resolveWorkerId(job)) return true;

  if (job?.assignedAgency || job?.agencyId) return true;

  if (Array.isArray(job?.schedules) && job.schedules.length) {
    if (job.schedules.some(shiftHasCoverage)) return true;

    const anyShiftStillOpen = job.schedules.some((entry) => entry?.receivingBids !== false && entry?.isBiddingAllowed !== false && !shiftHasCoverage(entry));
    return !anyShiftStillOpen;
  }

  const raw = job?.raw;
  if (raw && typeof raw === 'object') {
    if (Number(raw.acceptedBidsCount ?? raw.acceptedBidCount ?? 0) > 0) return true;
    if (raw.acceptedBid || raw.latestAcceptedBid) return true;
    const bids = Array.isArray(raw.bids) ? raw.bids : [];
    if (
      bids.some((bid) => {
        const bidStatus = String(bid?.status || '').toLowerCase();
        return bidStatus === 'accepted' || bidStatus === 'accept' || bidStatus === 'approved';
      })
    ) {
      return true;
    }
  }

  if (typeof job?.receivingBids === 'boolean' && !job.receivingBids) return true;

  return false;
}


export function jobMayHaveAttendance(job) {
  const status = normalizeJobStatus(job?.apiStatus || job?.status);
  if (status === 'completed') return true;
  if (status !== 'active') return false;
  return Boolean(
    job?.isFilled ||
      isJobScheduledWithWorkers(job) ||
      Number(job?.acceptedBidsCount) > 0 ||
      Number(job?.bidCount) > 0
  );
}

export function isJobPendingFill(job) {
  if (isEmployerJobCompleted(job)) return false;
  const status = normalizeJobStatus(job?.apiStatus || job?.status);
  if (status !== 'active') return false;
  return !isJobScheduledWithWorkers(job);
}

export function parseScheduleEnd(schedule) {
  if (!schedule?.date) return null;
  const endTime = schedule.endTime || '23:59';
  try {
    const parsed = parse(`${schedule.date} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function areAllJobShiftsPast(job, from = new Date()) {
  const schedules = job?.schedules || [];
  if (!schedules.length) return false;
  return schedules.every((entry) => {
    const end = parseScheduleEnd(entry) || parseScheduleStart(entry);
    return Boolean(end && end.getTime() < from.getTime());
  });
}

export function isEmployerJobCompleted(job) {
  return normalizeJobStatus(job?.apiStatus || job?.status) === 'completed';
}

export function jobHasWorkerRating(job) {
  return Boolean(job?.review?.id || job?.review?.rating || job?.review?.ratingLabel || job?.isReviewed);
}

export function getJobWorkerName(source) {
  const job = source && typeof source === 'object' ? source : {};
  const worker = job.worker && typeof job.worker === 'object' ? job.worker : {};
  const accepted = job.acceptedBid && typeof job.acceptedBid === 'object' ? job.acceptedBid : {};
  const acceptedWorker = accepted.worker && typeof accepted.worker === 'object' ? accepted.worker : {};
  const reviewedNurse = getReviewedNurse(job);
  const names = [
    worker.name,
    worker.fullName,
    job.workerName,
    job.assignedStaff,
    accepted.assignedStaff,
    acceptedWorker.name,
    accepted.name,
    reviewedNurse.name,
    job.assignedAgency,
    job.agencyName,
  ];
  return names.map((value) => String(value || '').trim()).find(Boolean) || '';
}

export function getJobWorkerAvatarUrl(source) {
  const job = source && typeof source === 'object' ? source : {};
  const worker = job.worker && typeof job.worker === 'object' ? job.worker : {};
  const reviewedNurse = getReviewedNurse(job);
  return String(worker.profileIcon || worker.avatarUrl || worker.image || job.workerAvatar || reviewedNurse.profileIcon || '').trim();
}

function getReviewedNurse(job = {}) {
  const nurse = job.review?.raw?.nurse;
  return nurse && typeof nurse === 'object' ? nurse : {};
}

export function getWorkerRatingOption({ rating, comment, ratingLabel } = {}) {
  const label = String(ratingLabel || '')
    .trim()
    .toLowerCase();
  if (label) {
    const byLabel = ALL_WORKER_RATING_OPTIONS.find((option) => option.label.toLowerCase() === label);
    if (byLabel) return byLabel;
  }

  const text = String(comment || '').toLowerCase();
  const fromComment = ALL_WORKER_RATING_OPTIONS.find((option) => text.includes(option.label.toLowerCase()));
  if (fromComment) return fromComment;

  const score = Number(rating);
  if (!Number.isFinite(score) || score <= 0) return null;
  if (score >= 5) return WORKER_RATING_OPTIONS.find((option) => option.id === 'excellent');
  if (score >= 4) return WORKER_RATING_OPTIONS.find((option) => option.id === 'good');
  if (score >= 3) return WORKER_RATING_OPTIONS.find((option) => option.id === 'satisfactory');
  if (score >= 2) return WORKER_RATING_OPTIONS.find((option) => option.id === 'poor');
  return WORKER_RATING_OPTIONS.find((option) => option.id === 'very-poor');
}

export function jobMatchesDashboardFilter(job, filter = '') {
  if (!filter) return true;
  if (filter === 'completed') return isEmployerJobCompleted(job);
  if (filter === 'scheduled') {
    return isJobScheduledWithWorkers(job) && !isEmployerJobCompleted(job);
  }
  if (filter === 'pending') {
    return isJobPendingFill(job) && !isEmployerJobCompleted(job);
  }
  return true;
}

export function getJobStatusConfig(status) {
  return JOB_STATUS_CONFIG[normalizeJobStatus(status)] || JOB_STATUS_CONFIG.active;
}

export function normalizeCareHomeJob(job) {
  return {
    ...job,
    image: typeof job?.image === 'string' ? job.image : '',
    status: normalizeJobStatus(job.status),
    receivingBids: normalizeReceivingBids(job),
  };
}

const STORAGE_KEY = 'care-home-jobs';

export function createScheduleId() {
  return `schedule-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createJobId() {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createCareHomeJobFromDraft(draft) {
  const { breakIncluded, breakMins, ...rest } = draft;
  const requestFromAgency = Boolean(draft.requestFromAgency && (draft.agencyId || draft.agencyName));
  const receivingBidsOverride = requestFromAgency ? false : draft.receivingBids;
  const schedules = (draft.schedules || []).map((entry) =>
    normalizeSchedule(entry, {
      breakIncluded,
      breakMins,
      receivingBids: receivingBidsOverride,
    })
  );

  return {
    ...rest,
    schedules,
    id: createJobId(),
    status: 'active',
    receivingBids: requestFromAgency ? false : schedules.some((entry) => entry.receivingBids !== false),
    postedAt: 'Just now',
    bidCount: 0,
    ...(requestFromAgency
      ? {
          agencyId: draft.agencyId || '',
          assignedAgency: draft.agencyName || draft.assignedAgency || '',
          requestFromAgency: true,
        }
      : {
          agencyId: '',
          assignedAgency: undefined,
          requestFromAgency: false,
        }),
  };
}

export function createJobDraftForCell({
  date,
  startTime = '09:00',
  endTime = '17:00',
  type = '',
  agencyId = '',
  agencyName = '',
  requestFromAgency = false,
  address = '',
  branchId = '',
  workerId = '',
  employeeId = '',
} = {}) {
  const directTarget = String(workerId || employeeId || agencyId || '').trim();
  const isDirect = Boolean(requestFromAgency || directTarget);

  return {
    ...EMPTY_JOB_DRAFT,
    agencyId,
    agencyName,
    requestFromAgency: isDirect,
    workerId: String(workerId || '').trim(),
    employeeId: String(employeeId || '').trim(),
    branchId: String(branchId || '').trim(),
    type,
    address,
    receivingBids: !isDirect,
    schedules: [
      normalizeSchedule({
        id: createScheduleId(),
        date: date || '',
        startTime,
        endTime,
        receivingBids: !isDirect,
      }),
    ],
  };
}

export function teamLabelToJobType(teamLabel = '') {
  const trimmed = String(teamLabel).trim();
  if (!trimmed) return '';

  const separatorIndex = trimmed.indexOf(' - ');
  if (separatorIndex === -1) return trimmed;

  return `${trimmed.slice(0, separatorIndex)} · ${trimmed.slice(separatorIndex + 3)}`;
}

export function findTeamLabelForJobType(jobType = '') {
  const trimmed = String(jobType).trim();
  if (!trimmed) return '';

  const separatorIndex = trimmed.indexOf(' · ');
  if (separatorIndex === -1) return trimmed;

  return `${trimmed.slice(0, separatorIndex)} - ${trimmed.slice(separatorIndex + 3)}`;
}

export function normalizeJobMatchText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/\bos\b/g, 'of')
    .replace(/[·\-_/,.|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scoreJobTypeAgainstTeamLabel(jobType = '', teamLabel = '') {
  const job = normalizeJobMatchText(jobType);
  const team = normalizeJobMatchText(teamLabel);
  const teamAsType = normalizeJobMatchText(teamLabelToJobType(teamLabel));
  if (!job || (!team && !teamAsType)) return 0;

  let score = 0;
  const candidates = [...new Set([team, teamAsType].filter(Boolean))];

  candidates.forEach((cand) => {
    if (cand === job) {
      score = Math.max(score, 100);
      return;
    }

    if (cand.includes(job) || job.includes(cand)) {
      const ratio = Math.min(job.length, cand.length) / Math.max(job.length, cand.length);
      score = Math.max(score, Math.round(55 + ratio * 40));
    }

    const jobTokens = job.split(' ').filter((token) => token.length > 1);
    const candTokens = cand.split(' ').filter((token) => token.length > 1);
    if (!jobTokens.length || !candTokens.length) return;

    const matched = jobTokens.filter((jt) => candTokens.some((ct) => ct === jt || ct.includes(jt) || jt.includes(ct)));

    if (matched.length === jobTokens.length) {
      score = Math.max(score, 60 + matched.length * 8);
    } else if (matched.length >= 2 || matched.length / jobTokens.length >= 0.66) {
      score = Math.max(score, Math.round(50 + (matched.length / jobTokens.length) * 30));
    } else if (matched.length > 0) {
      score = Math.max(score, Math.round((matched.length / jobTokens.length) * 48));
    }
  });

  if (job.includes('night') && (team.includes('night') || teamAsType.includes('night'))) {
    score = Math.max(score, 85);
  }
  if (job.includes('day') && (team.includes('day') || teamAsType.includes('day'))) {
    score = Math.max(score, 75);
  }
  if (job.includes('bank') && (team.includes('bank') || teamAsType.includes('bank'))) {
    score = Math.max(score, 80);
  }
  if (job.includes('senior') && (team.includes('senior') || teamAsType.includes('senior'))) {
    score = Math.max(score, 70);
  }
  if (job.includes('lead') && (team.includes('lead') || teamAsType.includes('lead'))) {
    score = Math.max(score, 70);
  }
  if (job.includes('management') && team.includes('management')) score = Math.max(score, 60);
  if (job.includes('deputy') && team.includes('deputy')) score = Math.max(score, 65);
  if (job.includes('home manager') && team.includes('home manager')) score = Math.max(score, 65);
  if (job.includes('nurse') && team.includes('nurse')) score = Math.max(score, 55);
  if (job.includes('head') && job.includes('care') && team.includes('head') && team.includes('care')) {
    score = Math.max(score, 80);
  }

  return score;
}

const TEAM_MATCH_MIN_SCORE = 50;

export function findBestTeamForJobType(jobType = '', teams = []) {
  const trimmed = String(jobType).trim();
  if (!trimmed || !Array.isArray(teams) || !teams.length) return null;

  const exactLabel = findTeamLabelForJobType(trimmed);
  const exactTeam = teams.find((team) => team.label === exactLabel);
  if (exactTeam) return exactTeam;

  const ranked = teams
    .map((team) => ({
      team,
      score: scoreJobTypeAgainstTeamLabel(trimmed, team?.label || ''),
    }))
    .filter((entry) => entry.score >= TEAM_MATCH_MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.team || null;
}

export function jobTypeMatchesAnyTeam(jobType = '', teamLabels = [], minScore = TEAM_MATCH_MIN_SCORE) {
  if (!Array.isArray(teamLabels) || !teamLabels.length) return true;
  return teamLabels.some((label) => scoreJobTypeAgainstTeamLabel(jobType, label) >= minScore);
}

export function findBestJobTypeOption(preferredLabel = '', jobTypes = [], teamLabels = []) {
  if (!Array.isArray(jobTypes) || !jobTypes.length) return null;

  const preferred = String(preferredLabel || '').trim();
  const scored = jobTypes
    .map((opt) => {
      const title = opt?.title || opt?.name || '';
      let score = preferred ? scoreJobTypeAgainstTeamLabel(preferred, title) : 0;
      if (Array.isArray(teamLabels) && teamLabels.length) {
        const teamScore = Math.max(0, ...teamLabels.map((label) => scoreJobTypeAgainstTeamLabel(title, label)));
        score = Math.max(score, teamScore);
      }
      return { opt, score };
    })
    .filter((entry) => entry.score >= TEAM_MATCH_MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  return scored[0]?.opt || null;
}

export function getMinJobScheduleDate(from = new Date()) {
  return format(startOfDay(from), 'yyyy-MM-dd');
}

export function isPastJobScheduleDate(dateValue, from = new Date()) {
  if (!dateValue) return false;

  try {
    const date = parse(dateValue, 'yyyy-MM-dd', new Date());
    if (!isValid(date)) return false;
    return startOfDay(date).getTime() < startOfDay(from).getTime();
  } catch {
    return false;
  }
}

export function buildJobScheduleTimeOptions(stepMinutes = 15) {
  const options = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += stepMinutes) {
    const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
    const mm = String(minutes % 60).padStart(2, '0');
    options.push(`${hh}:${mm}`);
  }
  return options;
}

export const JOB_SCHEDULE_TIME_OPTIONS = buildJobScheduleTimeOptions(15);

/** Minutes between start and end on the same day. Null when the range is missing or invalid. */
export function getScheduleDurationMinutes(startTime, endTime) {
  const start = String(startTime || '').trim();
  const end = String(endTime || '').trim();
  const startMatch = /^(\d{1,2}):(\d{2})$/.exec(start);
  const endMatch = /^(\d{1,2}):(\d{2})$/.exec(end);
  if (!startMatch || !endMatch) return null;

  const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
  const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);
  if (endMinutes <= startMinutes) return null;
  return endMinutes - startMinutes;
}

/** Break must be shorter than the shift. Returns an error message, or ''. */
export function getScheduleBreakError(entry) {
  if (!entry || entry.breakIncluded === false) return '';
  const duration = getScheduleDurationMinutes(entry.startTime, entry.endTime);
  if (duration == null) return '';
  const breakMins = Number(entry.breakMins);
  if (!Number.isFinite(breakMins) || breakMins < 0) return 'Enter a valid break length';
  if (breakMins > duration) {
    return `Break cannot be longer than the shift (${duration} min)`;
  }
  return '';
}

/** Ensure a free-typed HH:mm still appears in the select list. */
export function withJobScheduleTimeOption(options = JOB_SCHEDULE_TIME_OPTIONS, timeValue = '') {
  const value = String(timeValue || '').trim();
  if (!value || options.includes(value)) return options;
  return [...options, value].sort();
}

export function createDefaultSchedule(from = new Date()) {
  return {
    id: createScheduleId(),
    date: getMinJobScheduleDate(from),
    startTime: '09:00',
    endTime: '17:00',
    breakIncluded: true,
    breakPaid: true,
    breakMins: 30,
    receivingBids: true,
  };
}

export function normalizeSchedule(entry, fallback = {}) {
  const breakMins = Number(entry?.breakMins ?? fallback.breakMins ?? 0);
  const breakIncluded =
    entry?.breakIncluded != null
      ? Boolean(entry.breakIncluded)
      : fallback.breakIncluded != null
        ? Boolean(fallback.breakIncluded)
        : breakMins > 0;
  const breakPaid =
    entry?.breakPaid != null
      ? Boolean(entry.breakPaid)
      : fallback.breakPaid != null
        ? Boolean(fallback.breakPaid)
        : true;
  const receivingBids = entry?.receivingBids ?? fallback.receivingBids ?? true;

  return {
    id: entry?.id || createScheduleId(),
    date: entry?.date || '',
    startTime: entry?.startTime || '09:00',
    endTime: entry?.endTime || '17:00',
    breakIncluded,
    breakPaid,
    breakMins: breakIncluded ? (breakMins > 0 ? breakMins : 30) : 0,
    receivingBids: Boolean(receivingBids),
  };
}

export const JOB_CONTACT_FIELDS = [
  'contactName',
  'contactPhone',
  'contactEmail',
  'emergencyName',
  'emergencyPhone',
  'emergencyRelation',
];

/** Contact and emergency fields from a saved job, or null when none were set. */
export function pickJobContactDetails(job) {
  if (!job) return null;

  const contact = {};
  let hasAny = false;
  JOB_CONTACT_FIELDS.forEach((field) => {
    const value = String(job[field] || '').trim();
    contact[field] = value;
    if (value) hasAny = true;
  });

  return hasAny ? contact : null;
}

/** Fill only contact fields the draft has not already set. */
export function mergeEmptyJobContact(draft, contact) {
  if (!contact) return draft;

  const next = { ...draft };
  JOB_CONTACT_FIELDS.forEach((field) => {
    if (!String(next[field] || '').trim() && String(contact[field] || '').trim()) {
      next[field] = contact[field];
    }
  });
  return next;
}

export const EMPTY_JOB_DRAFT = {
  name: '',
  type: '',
  typeId: '',
  typeTitle: '',
  branchId: '',
  address: '',
  schedules: [createDefaultSchedule()],
  image: '',
  description: '',
  gender: '',
  hourlyRate: '',
  agencyId: '',
  agencyName: '',
  requestFromAgency: false,
  workerId: '',
  employeeId: '',
  careNotes: '',
  instructions: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  careDocuments: [],
};

export function jobToDraft(job) {
  if (!job) return { ...EMPTY_JOB_DRAFT, schedules: [createDefaultSchedule()] };

  const jobReceivingBids = normalizeReceivingBids(job);
  const fallback = {
    breakIncluded: job.breakIncluded,
    breakMins: job.breakMins,
    receivingBids: jobReceivingBids,
  };

  const schedules = job.schedules?.length ? job.schedules.map((entry) => normalizeSchedule(entry, fallback)) : [createDefaultSchedule()];


  const hourlyRate = job.hasRateField ? Number(job.rate) : Number(job.hourlyRate);
  const scheduleRate = job.hasRateField ? NaN : Number(job.schedules?.find((entry) => Number(entry?.hourlyRate) > 0)?.hourlyRate);

  return {
    id: job.id || job._id || '',
    name: job.name || job.type || '',
    type: job.typeTitle || job.type || '',
    typeId: job.typeId || '',
    typeTitle: job.typeTitle || '',
    branchId: job.branchId || '',
    address: job.address || '',
    location: job.location || null,
    schedules,
    image: typeof job.image === 'string' ? job.image : '',
    description: job.description || '',
    gender: GENDER_OPTIONS.find((option) => option.value === String(job.gender || '').toLowerCase())?.value || '',
    hourlyRate: Number.isFinite(hourlyRate) && hourlyRate > 0 ? String(hourlyRate) : Number.isFinite(scheduleRate) && scheduleRate > 0 ? String(scheduleRate) : '',
    status: normalizeJobStatus(job.status),
    canEditRateAndShiftTimes: job.canEditRateAndShiftTimes !== false,
    receivingBids: schedules.some((entry) => entry.receivingBids !== false),
    agencyId: job.agencyId || '',
    agencyName: job.assignedAgency || job.agencyName || '',
    requestFromAgency: Boolean(job.requestFromAgency || job.assignedAgency || job.agencyId),
    careNotes: job.careNotes || '',
    instructions: job.instructions || '',
    contactName: job.contactName || '',
    contactPhone: job.contactPhone || '',
    contactEmail: job.contactEmail || '',
    emergencyName: job.emergencyName || '',
    emergencyPhone: job.emergencyPhone || '',
    emergencyRelation: job.emergencyRelation || '',
    careDocuments: Array.isArray(job.careDocuments)
      ? job.careDocuments.map((doc, index) => ({
          id: doc.id || doc._id || `doc-${index}`,
          name: doc.name || doc.fileName || `Document ${index + 1}`,
          url: doc.url || doc.fileUrl || '',
          uploadedAt: doc.uploadedAt || '',
        }))
      : [],
  };
}

export function formatDisplayDate(dateValue) {
  if (!dateValue) return '';
  try {
    return format(parse(dateValue, 'yyyy-MM-dd', new Date()), 'EEE d MMM yyyy');
  } catch {
    return dateValue;
  }
}

export function formatTimeLabel(timeValue) {
  if (!timeValue) return '';
  try {
    return format(parse(timeValue, 'HH:mm', new Date()), 'hh:mm a');
  } catch {
    return timeValue;
  }
}

export function getScheduleBreakLabel(schedule, jobFallback) {
  const breakMins = Number(schedule?.breakMins ?? jobFallback?.breakMins ?? 0);
  const breakIncluded =
    schedule?.breakIncluded ?? jobFallback?.breakIncluded ?? breakMins > 0;
  if (!breakIncluded || !(breakMins > 0)) return 'No break';

  const breakPaid = schedule?.breakPaid ?? jobFallback?.breakPaid ?? true;
  return `${breakPaid === false ? 'Unpaid' : 'Paid'} break: ${breakMins} min`;
}

export function formatScheduleLabel(schedule, jobFallback) {
  const dateLabel = formatDisplayDate(schedule.date);
  const timeLabel = `${formatTimeLabel(schedule.startTime)} - ${formatTimeLabel(schedule.endTime)}`;
  const breakLabel = getScheduleBreakLabel(schedule, jobFallback);

  if (!dateLabel) return `${timeLabel} · ${breakLabel}`;
  return `${dateLabel} · ${timeLabel} · ${breakLabel}`;
}

export function parseScheduleStart(schedule) {
  if (!schedule?.date || !schedule?.startTime) return null;
  try {
    const parsed = parse(`${schedule.date} ${schedule.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function getJobNextScheduleStart(job, from = new Date()) {
  const schedules = job?.schedules || [];
  const allStarts = schedules
    .map(parseScheduleStart)
    .filter(Boolean)
    .sort((a, b) => a - b);
  if (!allStarts.length) return null;

  const upcoming = allStarts.filter((dt) => dt.getTime() >= from.getTime());
  return upcoming[0] || allStarts[0];
}

export function getJobFirstScheduleStart(job) {
  const schedules = job?.schedules || [];
  const allStarts = schedules
    .map(parseScheduleStart)
    .filter(Boolean)
    .sort((a, b) => a - b);
  return allStarts[0] || null;
}

export function sortSchedulesByStart(schedules = []) {
  return [...schedules].sort((a, b) => {
    const aStart = parseScheduleStart(a);
    const bStart = parseScheduleStart(b);
    if (aStart && bStart && aStart.getTime() !== bStart.getTime()) {
      return aStart.getTime() - bStart.getTime();
    }
    if (aStart && !bStart) return -1;
    if (!aStart && bStart) return 1;
    return String(a?.date || '').localeCompare(String(b?.date || ''));
  });
}

export function sortJobsByScheduleSequence(jobs = []) {
  return [...jobs].sort((a, b) => {
    const aStart = getJobFirstScheduleStart(a);
    const bStart = getJobFirstScheduleStart(b);
    if (aStart && bStart && aStart.getTime() !== bStart.getTime()) {
      return aStart.getTime() - bStart.getTime();
    }
    if (aStart && !bStart) return -1;
    if (!aStart && bStart) return 1;
    const aCreated = Date.parse(a?.createdAt) || 0;
    const bCreated = Date.parse(b?.createdAt) || 0;
    return aCreated - bCreated;
  });
}

export function sortJobsByNextSchedule(jobs, from = new Date()) {
  return [...jobs].sort((a, b) => {
    const aStart = getJobNextScheduleStart(a, from);
    const bStart = getJobNextScheduleStart(b, from);
    if (!aStart && !bStart) return 0;
    if (!aStart) return 1;
    if (!bStart) return -1;
    return aStart.getTime() - bStart.getTime();
  });
}

export function sortJobsByCreatedAtDesc(jobs, from = new Date()) {
  return [...jobs].sort((a, b) => {
    const aCreated = Date.parse(a?.createdAt) || 0;
    const bCreated = Date.parse(b?.createdAt) || 0;
    if (bCreated !== aCreated) return bCreated - aCreated;

    const aStart = getJobNextScheduleStart(a, from);
    const bStart = getJobNextScheduleStart(b, from);
    if (!aStart && !bStart) return 0;
    if (!aStart) return 1;
    if (!bStart) return -1;
    return aStart.getTime() - bStart.getTime();
  });
}

export function jobStartsWithinHorizon(job, horizonHours, from = new Date()) {
  const next = getJobNextScheduleStart(job, from);
  if (!next || next.getTime() < from.getTime()) return false;
  const limit = addHours(from, horizonHours);
  return next.getTime() <= limit.getTime();
}

export function filterActiveJobsByHorizon(jobs, horizonValue, from = new Date()) {
  if (horizonValue === 'all') return jobs;

  const option = ACTIVE_JOB_HORIZON_OPTIONS.find((entry) => entry.value === horizonValue);
  if (!option?.hours) return jobs;

  return jobs.filter((job) => jobStartsWithinHorizon(job, option.hours, from));
}

export function formatJobStartsInLabel(job, from = new Date()) {
  const next = getJobNextScheduleStart(job, from);
  if (!next) return '';

  if (next.getTime() < from.getTime()) return 'In progress / past start';
  return `Starts in ${formatDistanceToNow(next, { addSuffix: false })}`;
}

export function getGenderLabel(value) {
  return GENDER_OPTIONS.find((option) => option.value === value)?.label || value;
}

export function validateJobDraft(draft, now = new Date()) {
  if (!GENDER_OPTIONS.some((option) => option.value === draft.gender)) {
    return 'Please select gender';
  }
  if (!draft.typeId && !draft.type) return 'Please select a job type';
  if (!draft.branchId) {
    return 'Please select a location';
  }

  if (!draft.id && !String(draft.image || '').trim()) {
    return 'Please add a job image';
  }

  if (!draft.schedules?.length) return 'Please add at least one date and time';

  const invalidSchedule = draft.schedules.find((entry) => !entry.date || !entry.startTime || !entry.endTime);
  if (invalidSchedule) return 'Please complete date, start time and end time for each entry';

  if (!draft.id) {
    for (const entry of draft.schedules) {
      const start = parseScheduleStart(entry);
      if (!start) return 'Please enter a valid shift date and start time';
      if (start.getTime() <= now.getTime()) {
        return 'Shift date and start time must be in the future';
      }
    }

    const endBeforeStart = draft.schedules.find((entry) => entry.startTime && entry.endTime && entry.endTime < entry.startTime);
    if (endBeforeStart) return 'End time cannot be earlier than start time';
  }

  const longBreak = draft.schedules.find((entry) => getScheduleBreakError(entry));
  if (longBreak) return getScheduleBreakError(longBreak);

  if (draft.requestFromAgency && !draft.agencyId && !draft.workerId && !draft.employeeId && !draft.worker && !draft.employee) {
    return 'Please select the agency or worker for this direct request';
  }

  return '';
}

function carePhoneError(value, label) {
  const raw = String(value || '').trim();
  if (!raw) return `Please enter a ${label}`;
  const candidate = raw.startsWith('+') ? raw.replace(/[^\d+]/g, '') : `+${raw.replace(/\D/g, '')}`;
  if (!isValidPhoneNumber(candidate)) {
    return `Enter a valid ${label} for the selected country code`;
  }
  return '';
}

export function validateCareDetails(draft) {
  const contactPhone = String(draft.contactPhone || '').trim();
  if (contactPhone) {
    const contactPhoneError = carePhoneError(contactPhone, 'contact phone number');
    if (contactPhoneError) return contactPhoneError;
  }

  const email = String(draft.contactEmail || '').trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Please enter a valid contact email';
  }

  if (!String(draft.emergencyName || '').trim()) return 'Please enter an emergency contact name';
  const emergencyPhoneError = carePhoneError(draft.emergencyPhone, 'emergency contact phone number');
  if (emergencyPhoneError) return emergencyPhoneError;
  if (!String(draft.emergencyRelation || '').trim()) return 'Please enter the emergency contact relation';
  return '';
}

export function loadCareHomeJobs(defaultJobs, storageKey = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return defaultJobs.map(normalizeCareHomeJob);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed.map(normalizeCareHomeJob) : defaultJobs.map(normalizeCareHomeJob);
  } catch {
    return defaultJobs.map(normalizeCareHomeJob);
  }
}

export function saveCareHomeJobs(jobs, storageKey = STORAGE_KEY) {
  localStorage.setItem(storageKey, JSON.stringify(jobs));
}
