/**
 * Shared traffic-light status colours across Jobs, Bookings, Staff, Bids.
 *
 * warning  = waiting / needs action
 * info     = confirmed / open / scheduled (not finished)
 * primary  = happening now
 * success  = done / positive outcome
 * error    = cancelled / rejected / negative
 * default  = inactive / withdrawn / neutral
 */

export const WORKFLOW_STATUS_COLOR = {
  pending: 'warning',
  requested: 'warning',
  unread: 'warning',

  active: 'info',
  scheduled: 'info',
  confirmed: 'info',
  open: 'info',
  accepted: 'success',
  approved: 'success',

  in_progress: 'primary',
  inprogress: 'primary',
  ongoing: 'primary',
  live: 'primary',

  completed: 'success',
  complete: 'success',
  done: 'success',
  paid: 'success',

  cancelled: 'error',
  canceled: 'error',
  rejected: 'error',
  failed: 'error',
  banned: 'error',

  inactive: 'default',
  withdrawn: 'default',
  closed: 'default',
  expired: 'default',
};

function normalizeStatusKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

/** Resolve MUI Label / palette color key for a status or display label. */
export function getWorkflowStatusColorKey(statusOrLabel) {
  const raw = String(statusOrLabel || '').trim().toLowerCase();
  if (!raw) return 'default';

  const compact = raw.replace(/[\s_-]+/g, '');
  const underscored = normalizeStatusKey(raw);

  if (WORKFLOW_STATUS_COLOR[underscored]) return WORKFLOW_STATUS_COLOR[underscored];
  if (WORKFLOW_STATUS_COLOR[compact]) return WORKFLOW_STATUS_COLOR[compact];

  // Phrase fallbacks
  if (raw.includes('progress')) return 'primary';
  if (raw.includes('pending') || raw.includes('review')) return 'warning';
  if (raw.includes('complete') || raw.includes('accept') || raw.includes('success')) return 'success';
  if (raw.includes('cancel') || raw.includes('reject') || raw.includes('fail')) return 'error';
  if (raw.includes('inactive') || raw.includes('withdraw')) return 'default';
  if (raw.includes('schedul') || raw.includes('confirm') || raw.includes('active')) return 'info';

  return 'default';
}

/** Theme hex (or grey) for charts from a status / label / colorKey. */
export function resolveWorkflowStatusHex(theme, statusOrLabel, colorKey) {
  // Ignore raw hex if accidentally passed as colorKey from older callers
  const key =
    colorKey && !String(colorKey).startsWith('#')
      ? colorKey
      : getWorkflowStatusColorKey(statusOrLabel);
  if (key === 'default') return theme.palette.grey[500];
  return theme.palette[key]?.main || theme.palette.grey[500];
}
