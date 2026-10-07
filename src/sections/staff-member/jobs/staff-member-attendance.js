/** Attendance for Active cards — from GET /app/nurse/booking/logs/:id and the check-in/out PUT. */

import {
  mapAttendanceBlock,
  mergeAttendance,
  pickBookingIdOnly,
} from './nurse-checkin-api-utils';

export function getAttendanceKey(job) {
  // Only real booking ids — never job/shift id (avoids mass invalid log calls)
  return pickBookingIdOnly(job);
}

/**
 * Second key for the attendance map: the booking id on the card can be missing until the job
 * list refetches, so check-in/out also stores its result under the job + shift the card shows.
 */
export function getAttendanceFallbackKey(job) {
  const jobId = String(job?.id || job?._id || '').trim();
  if (!jobId) return '';
  const shiftId = String(
    job?.shiftRows?.[0]?.id || job?.shiftRows?.[0]?._id || job?.shiftId || ''
  ).trim();
  return `job:${jobId}:${shiftId}`;
}

/** Every key a card's attendance may be stored under, best first. */
export function getAttendanceKeys(job) {
  return [
    getAttendanceKey(job),
    String(job?.bookingId || '').trim(),
    getAttendanceFallbackKey(job),
  ].filter(Boolean);
}

export function readAttendance(attendanceMap, job) {
  if (!attendanceMap) return null;
  for (const key of getAttendanceKeys(job)) {
    if (attendanceMap[key]) return attendanceMap[key];
  }
  return null;
}

/**
 * What a card should show: the booking the jobs API sent inline, with anything this session
 * checked in / out layered on top.
 */
export function resolveJobAttendance(job, liveAttendance) {
  return mergeAttendance(mapAttendanceBlock(job?.bookingAttendance), liveAttendance);
}

export function formatAttendanceTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}
