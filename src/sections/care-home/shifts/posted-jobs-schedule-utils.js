/** Normalize employer / supplier job rows for the schedule left panel. */

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toScheduleDateKey(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }

  const raw = String(value).trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);

  const monthDayYear = raw.match(/([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
  if (monthDayYear) {
    const parsed = new Date(`${monthDayYear[1]} ${monthDayYear[2]}, ${monthDayYear[3]}`);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())}`;
  }

  return '';
}

function firstScheduleTimeLabel(job = {}) {
  const schedules = Array.isArray(job.schedules) ? job.schedules : [];
  const first = schedules[0];
  if (typeof first === 'string' && first.trim()) return first.trim();
  if (first?.label) return String(first.label).trim();
  if (first?.date) {
    const start = first.startTime || '';
    const end = first.endTime || '';
    return [first.date, start && end ? `${start}–${end}` : ''].filter(Boolean).join(' · ');
  }

  const rawShift = Array.isArray(job.raw?.shift) ? job.raw.shift[0] : null;
  if (rawShift?.date) {
    const start = rawShift.startTime || '';
    const end = rawShift.endTime || '';
    return [toScheduleDateKey(rawShift.date) || rawShift.date, start && end ? `${start}–${end}` : '']
      .filter(Boolean)
      .join(' · ');
  }

  return '';
}

export function normalizePostedJobForSidebar(job = {}) {
  const id = String(job.id || job._id || '').trim();
  if (!id) return null;

  const dateLabel = firstScheduleTimeLabel(job) || job.postedAt || '';
  const rate = Number(job.hourlyRate || job.ratePerHour || 0) || 0;
  const workerName =
    (typeof job.worker === 'object' && (job.worker?.name || job.worker?.displayName)) ||
    job.workerName ||
    job.assignedWorker?.name ||
    '';

  const assigneeLabel =
    workerName ||
    job.assignedAgency ||
    (job.hasAcceptedBid || job.bookingId ? 'Assigned' : 'Unassigned');

  return {
    id,
    title: String(job.title || job.typeTitle || job.type || job.name || 'Job').trim() || 'Job',
    status: String(job.status || job.apiStatus || '').trim().toLowerCase(),
    subtitle: [dateLabel, rate > 0 ? `£${rate}/hr` : ''].filter(Boolean).join(' · '),
    assigneeLabel,
  };
}
