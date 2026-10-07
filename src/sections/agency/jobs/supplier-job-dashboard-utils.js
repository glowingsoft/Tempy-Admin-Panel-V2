import { startOfDay } from 'date-fns';

import { parseJobShiftDate } from 'src/components/jobs/job-date-filters';

export function expandJobsByShift(jobs = []) {
  const next = [];

  (Array.isArray(jobs) ? jobs : []).forEach((job) => {
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
        title: job.title || job.jobTypeTitle || 'Job',
      });
    });
  });

  return next;
}

export function pickUpcomingSupplierJobs(jobs = [], { limit = 3 } = {}) {
  const today = startOfDay(new Date());

  return expandJobsByShift(jobs)
    .map((job) => ({
      job,
      date: parseJobShiftDate(job.shiftDate),
    }))
    .filter((row) => row.date && row.date.getTime() >= today.getTime())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit)
    .map((row) => row.job);
}

export function findSupplierJobById(jobs = [], entityId) {
  const id = String(entityId || '').trim();
  if (!id) return null;

  const list = Array.isArray(jobs) ? jobs : [];
  return (
    list.find((job) => String(job.id || job._id || '') === id) ||
    expandJobsByShift(list).find(
      (job) =>
        String(job.id || job._id || '') === id ||
        String(job.cardKey || '').startsWith(`${id}-`)
    ) ||
    null
  );
}

export function formatSupplierJobStatus(job) {
  if (String(job?.bookingId || '').trim()) return 'Booked';

  const status = String(job?.apiStatus || job?.status || job?.shiftRows?.[0]?.status || '')
    .trim()
    .toLowerCase();

  if (!status) return 'Open';
  if (['active', 'accepted', 'booked', 'assigned'].includes(status)) return 'Active';
  if (status === 'completed') return 'Completed';
  if (status === 'inactive') return 'Inactive';
  if (status === 'pending') return 'Pending';

  return status.charAt(0).toUpperCase() + status.slice(1);
}
