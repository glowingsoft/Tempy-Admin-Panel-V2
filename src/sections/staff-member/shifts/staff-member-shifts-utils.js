import { startOfDay } from 'date-fns';

import { parseJobShiftDate } from 'src/components/jobs/job-date-filters';

export const SHIFT_PERIOD_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export function filterShiftsByPeriod(jobs = [], period = 'all', from = new Date()) {
  if (!period || period === 'all') return jobs;

  const today = startOfDay(from).getTime();

  return jobs.filter((job) => {
    const shiftDate = parseJobShiftDate(job.shiftDate || job.shiftRows?.[0]?.date);
    if (!shiftDate) return false;

    const time = shiftDate.getTime();
    if (period === 'upcoming') return time >= today;
    if (period === 'past') return time < today;
    return true;
  });
}

export function countShiftsByPeriod(jobs = [], from = new Date()) {
  const today = startOfDay(from).getTime();

  return jobs.reduce(
    (acc, job) => {
      const shiftDate = parseJobShiftDate(job.shiftDate || job.shiftRows?.[0]?.date);
      if (!shiftDate) return acc;

      acc.all += 1;
      if (shiftDate.getTime() >= today) acc.upcoming += 1;
      else acc.past += 1;
      return acc;
    },
    { all: 0, upcoming: 0, past: 0 }
  );
}
