import { startOfDay } from 'date-fns';

import { parseJobShiftDate, parseJobShiftStart } from 'src/components/jobs/job-date-filters';

import { formatSupplierJobStatus } from 'src/sections/agency/jobs/supplier-job-dashboard-utils';

export function isAcceptedStaffJob(job) {
  // Must be a real booking/assignment — marketplace "active" open jobs are NOT shifts.
  if (String(job?.bookingId || '').trim()) return true;

  const shiftStatus = String(job?.shiftRows?.[0]?.status || job?.status || '').toLowerCase();
  if (['booked', 'assigned', 'accepted'].includes(shiftStatus)) return true;

  const apiStatus = String(job?.apiStatus || '').toLowerCase();
  return ['accepted', 'booked', 'assigned'].includes(apiStatus);
}

export function expandAcceptedJobs(jobs = []) {
  const next = [];

  jobs.filter(isAcceptedStaffJob).forEach((job) => {
    const rows =
      Array.isArray(job.shiftRows) && job.shiftRows.length
        ? job.shiftRows
        : [{ date: job.shiftDate, startTime: job.shiftStartTime, endTime: job.shiftEndTime }];

    rows.forEach((row, index) => {
      next.push({
        ...job,
        cardKey: `${job.id}-${row.id || row.date || index}`,
        shiftDate: row.date || job.shiftDate,
        shiftStartTime: row.startTime || job.shiftStartTime,
        shiftEndTime: row.endTime || job.shiftEndTime,
        title: job.title || job.jobTypeTitle || 'Accepted job',
      });
    });
  });

  return next;
}

export function pickUpcomingStaffJobs(jobs = [], { limit = 3 } = {}) {
  const today = startOfDay(new Date());

  return expandAcceptedJobs(jobs)
    .map((job) => ({
      job,
      date: parseJobShiftDate(job.shiftDate),
    }))
    .filter((row) => row.date && row.date.getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit)
    .map((row) => row.job);
}

export function findStaffJobById(jobs = [], entityId) {
  const id = String(entityId || '').trim();
  if (!id) return null;

  const list = Array.isArray(jobs) ? jobs : [];
  const direct =
    list.find((job) => String(job.id || job._id || '') === id) ||
    expandAcceptedJobs(list).find(
      (job) =>
        String(job.id || job._id || '') === id ||
        String(job.cardKey || '').startsWith(`${id}-`)
    );

  return direct || null;
}

export function formatStaffJobStatus(job) {
  return formatSupplierJobStatus(job);
}

const MS_24H = 24 * 60 * 60 * 1000;

export function getStaffJobShiftStart(job) {
  return parseJobShiftStart({
    shiftDate: job?.shiftDate || job?.shiftRows?.[0]?.date,
    shiftStartTime: job?.shiftStartTime || job?.shiftRows?.[0]?.startTime,
  });
}

/**
 * Shift end as a Date. `endTime` ≤ `startTime` means the shift runs past midnight (ends next day).
 * Accepts a shift row ({ date, startTime, endTime }) or a staff job (shiftDate / shiftRows).
 */
export function getStaffShiftEnd(source) {
  const row = source?.shiftRows?.[0] || {};
  const date = String(source?.date || source?.shiftDate || row.date || '').slice(0, 10);
  const startTime = String(source?.startTime || source?.shiftStartTime || row.startTime || '').slice(0, 5);
  const endTime = String(source?.endTime || source?.shiftEndTime || row.endTime || '').slice(0, 5);
  if (!date || !endTime) return null;

  const end = parseJobShiftStart({ shiftDate: date, shiftStartTime: endTime });
  if (!end || Number.isNaN(end.getTime())) return null;
  if (startTime && endTime <= startTime) end.setDate(end.getDate() + 1);
  return end;
}

/** True once the shift's end time has passed — check-in is no longer allowed. */
export function hasStaffShiftEnded(source, now = new Date()) {
  const end = getStaffShiftEnd(source);
  return Boolean(end && now.getTime() >= end.getTime());
}

export function isShiftWithin24Hours(job) {
  const shiftStart = getStaffJobShiftStart(job);
  if (!shiftStart) return false;
  const msUntil = shiftStart.getTime() - Date.now();
  return msUntil > 0 && msUntil < MS_24H;
}

export function canCancelStaffShift(job) {
  if (!job) return false;

  const blockStatus = String(job?.status || '').toLowerCase();
  if (['leave', 'busy', 'dayoff', 'oncall', 'sleepover', 'cancelled', 'canceled', 'completed', 'withdrawn', 'deleted'].includes(blockStatus)) {
    return false;
  }

  if (isAcceptedStaffJob(job)) {
    const status = String(
      job?.apiStatus || job?.status || job?.shiftRows?.[0]?.status || ''
    ).toLowerCase();

    if (['cancelled', 'canceled', 'completed', 'withdrawn', 'deleted'].includes(status)) {
      return false;
    }

    return true;
  }

  // Calendar accepted shift (date + time window, not availability block)
  return Boolean(job.shiftDate && job.shiftStartTime && job.shiftEndTime);
}
