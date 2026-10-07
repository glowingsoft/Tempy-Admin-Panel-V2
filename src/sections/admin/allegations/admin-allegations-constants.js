export const ALLEGATION_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  WITHDRAWN: 'withdrawn',
};

export const ALLEGATION_FEED = {
  RAISED: 'raised',
  CANCELLATION_STRIKE: 'cancellation_strike',
  ABANDONED_SHIFT: 'abandoned_shift',
  SUSPENDED_USER: 'suspended_user',
  REPORTED_USER: 'reported_user',
};

export const ALLEGATION_FEED_TYPES = [
  ALLEGATION_FEED.CANCELLATION_STRIKE,
  ALLEGATION_FEED.ABANDONED_SHIFT,
  ALLEGATION_FEED.SUSPENDED_USER,
  ALLEGATION_FEED.REPORTED_USER,
];

export const ALLEGATION_SCREEN_CARDS = [
  {
    value: ALLEGATION_FEED.RAISED,
    title: 'Raised allegations',
    icon: 'solar:danger-triangle-bold-duotone',
    color: 'error',
    note: 'Formal allegations are nurses only. Raise one from Individual (Staff Member). The third allegation that still counts suspends the nurse and stops upcoming bookings.',
  },
  {
    value: ALLEGATION_FEED.CANCELLATION_STRIKE,
    title: 'Cancellation strike',
    icon: 'solar:calendar-mark-bold-duotone',
    color: 'warning',
    note: 'Suppliers. These come from late cancellations by the worker or the employer.',
  },
  {
    value: ALLEGATION_FEED.ABANDONED_SHIFT,
    title: 'Abandoned shift',
    icon: 'solar:logout-3-bold-duotone',
    color: 'info',
    note: 'The worker who never checked out.',
  },
  {
    value: ALLEGATION_FEED.SUSPENDED_USER,
    title: 'Suspended user',
    icon: 'solar:user-block-bold-duotone',
    color: 'error',
    note: 'Any suspended account, including customers.',
  },
  {
    value: ALLEGATION_FEED.REPORTED_USER,
    title: 'Reported user',
    icon: 'solar:flag-bold-duotone',
    color: 'primary',
    note: 'Any user whose report count is above 0. This list stays empty until that count is set.',
  },
];

export function isAllegationFeedType(value) {
  return ALLEGATION_FEED_TYPES.includes(String(value || ''));
}

export const ALLEGATION_TYPE_OPTIONS = [
  { value: 'safeguarding', label: 'Safeguarding' },
  { value: 'conduct', label: 'Conduct' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'clinical', label: 'Clinical' },
  { value: 'other', label: 'Other' },
];

export const ALLEGATION_STATUS_OPTIONS = [
  { value: ALLEGATION_STATUS.OPEN, label: 'Open', color: 'error' },
  { value: ALLEGATION_STATUS.UNDER_REVIEW, label: 'Under review', color: 'warning' },
  { value: ALLEGATION_STATUS.RESOLVED, label: 'Resolved', color: 'success' },
  { value: ALLEGATION_STATUS.WITHDRAWN, label: 'Withdrawn', color: 'default' },
];

export const SHIFT_ACTION_STATUS = {
  STOPPED: 'stopped',
  NEEDS_REALLOCATION: 'needs_reallocation',
  REALLOCATED: 'reallocated',
  REPUBLISHED: 'republished',
};

export const SHIFT_ACTION_STATUS_OPTIONS = [
  { value: SHIFT_ACTION_STATUS.STOPPED, label: 'Stopped', color: 'error' },
  { value: SHIFT_ACTION_STATUS.NEEDS_REALLOCATION, label: 'Needs re-allocation', color: 'warning' },
  { value: SHIFT_ACTION_STATUS.REALLOCATED, label: 'Re-allocated', color: 'success' },
  { value: SHIFT_ACTION_STATUS.REPUBLISHED, label: 'Re-published', color: 'info' },
];

/** open can move to review, resolved or withdrawn. under_review can only close. The last two stay put. */
export function getAllowedAllegationStatuses(current) {
  const value = String(current || '');
  if (value === ALLEGATION_STATUS.OPEN) {
    return ALLEGATION_STATUS_OPTIONS.filter((item) =>
      [ALLEGATION_STATUS.OPEN, ALLEGATION_STATUS.UNDER_REVIEW, ALLEGATION_STATUS.RESOLVED, ALLEGATION_STATUS.WITHDRAWN].includes(item.value)
    );
  }
  if (value === ALLEGATION_STATUS.UNDER_REVIEW) {
    return ALLEGATION_STATUS_OPTIONS.filter((item) =>
      [ALLEGATION_STATUS.UNDER_REVIEW, ALLEGATION_STATUS.RESOLVED, ALLEGATION_STATUS.WITHDRAWN].includes(item.value)
    );
  }
  const matched = ALLEGATION_STATUS_OPTIONS.filter((item) => item.value === value);
  return matched.length ? matched : [{ value, label: value || 'Unknown', color: 'default' }];
}

export function getAllegationStatusOption(status) {
  return (
    ALLEGATION_STATUS_OPTIONS.find((item) => item.value === status) || {
      value: status,
      label: String(status || 'Unknown'),
      color: 'default',
    }
  );
}

export function getShiftActionStatusOption(status) {
  return (
    SHIFT_ACTION_STATUS_OPTIONS.find((item) => item.value === status) || {
      value: status,
      label: String(status || 'Unknown'),
      color: 'default',
    }
  );
}

export function getAllegationTypeLabel(value) {
  return ALLEGATION_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || '—';
}
