const STORAGE_KEY = 'tempy-staff-shift-alerts';

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota / private mode
  }
}

export function buildShiftAlertKey(job = {}) {
  const jobId = String(job.id || job._id || '').trim();
  const bookingId = String(job.bookingId || '').trim();
  const shiftDate = String(job.shiftDate || job.shiftRows?.[0]?.date || '').trim();
  const shiftStartTime = String(job.shiftStartTime || job.shiftRows?.[0]?.startTime || '').trim();

  if (bookingId) return `booking:${bookingId}`;
  if (jobId && shiftDate) return `job:${jobId}:${shiftDate}:${shiftStartTime}`;
  if (jobId) return `job:${jobId}`;
  return '';
}

export function getShiftAlert(job) {
  const key = buildShiftAlertKey(job);
  if (!key) return null;
  const row = readStore()[key];
  if (!row || typeof row !== 'object') return null;
  return row;
}

export function saveShiftAlert(job, settings = {}) {
  const key = buildShiftAlertKey(job);
  if (!key) return null;

  const next = {
    alertPhone: String(settings.alertPhone || '').trim(),
    alertHours: Math.max(0, Number(settings.alertHours) || 0),
    alertMinutes: Math.max(0, Number(settings.alertMinutes) || 0),
    enabled: settings.enabled !== false,
    updatedAt: new Date().toISOString(),
  };

  const store = readStore();
  store[key] = next;
  writeStore(store);
  return next;
}

export function clearShiftAlert(job) {
  const key = buildShiftAlertKey(job);
  if (!key) return;
  const store = readStore();
  delete store[key];
  writeStore(store);
}

export function alertOffsetMinutes(settings = {}) {
  const hours = Math.max(0, Number(settings.alertHours) || 0);
  const minutes = Math.max(0, Number(settings.alertMinutes) || 0);
  return hours * 60 + minutes;
}
