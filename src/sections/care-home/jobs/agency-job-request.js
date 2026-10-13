import { format, parse, isValid } from 'date-fns';

import { getAgreedRatePartnersByType } from 'src/_mock/_agreed-rates';
import { parseCoordinates } from 'src/sections/branches/geo-coordinates';

const STORAGE_KEY = 'agency-incoming-job-requests';

const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

export function getCareHomeAgencyPartners() {
  return getAgreedRatePartnersByType('agency');
}

function formatAgencyShiftLabel(date, startTime, endTime) {
  try {
    const day = parse(date, 'yyyy-MM-dd', new Date());
    if (!isValid(day)) return `${date} - ${startTime} To ${endTime}`;
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    const datePart = format(day, 'MMM d yyyy');
    const startPart = isValid(start) ? format(start, 'hh a') : startTime;
    const endPart = isValid(end) ? format(end, 'hh a') : endTime;
    return `${datePart} - ${startPart} To ${endPart}`;
  } catch {
    return `${date} - ${startTime} To ${endTime}`;
  }
}

/** Convert a care-home job request into the agency Find Jobs card shape. */
export function careHomeJobToAgencyJob(job) {
  const schedules = job.schedules || [];
  const shiftRows = schedules.map((entry, index) => ({
    id: entry.id || `s${index + 1}`,
    date: entry.date || '',
    startTime: entry.startTime || '',
    endTime: entry.endTime || '',
    label: formatAgencyShiftLabel(entry.date, entry.startTime, entry.endTime),
  }));

  const primary = schedules[0] || {};

  return {
    id: `ch-req-${job.id}`,
    status: 'new',
    title: job.type || 'Staff request',
    role: job.type || 'Care staff',
    shiftType: schedules.length > 1 ? 'Multi Shift' : 'Single Shift',
    // Distance filled by applyJobDistances when coords / origin available
    distance: '',
    latitude: job.latitude ?? parseCoordinates(job.location?.coordinates)?.latitude ?? null,
    longitude: job.longitude ?? parseCoordinates(job.location?.coordinates)?.longitude ?? null,
    location: job.location || undefined,
    hourlyRate: job.hourlyRate ?? job.ratePerHour ?? null,
    breakType: schedules.some((entry) => entry.breakIncluded !== false) ? 'Paid' : 'Unpaid',
    gender: GENDER_LABELS[String(job.gender || '').toLowerCase()] || '',
    image: typeof job.image === 'string' ? job.image : '',
    description: job.description || 'Direct staff request from care home.',
    address: job.address || '',
    postedAt: 'Just now',
    postedBy: {
      name: job.careHomeName || job.postedByName || 'Care Home',
      type: 'care_home',
      rating: 4.8,
      reviewCount: 0,
    },
    shiftDate: primary.date || '',
    shiftStartTime: primary.startTime || '',
    shiftRows,
    requestFromCareHome: true,
    careHomeJobId: job.id,
    targetAgencyId: job.agencyId || '',
    targetAgencyName: job.assignedAgency || '',
  };
}

export function loadAgencyJobRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveAgencyJobRequests(jobs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

export function appendAgencyJobRequest(careHomeJob) {
  if (!careHomeJob?.agencyId && !careHomeJob?.assignedAgency) return null;

  const agencyJob = careHomeJobToAgencyJob(careHomeJob);
  const existing = loadAgencyJobRequests().filter((job) => job.id !== agencyJob.id);
  saveAgencyJobRequests([agencyJob, ...existing]);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('agency-job-requests-updated'));
  }

  return agencyJob;
}
