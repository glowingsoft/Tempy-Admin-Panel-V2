export const RECRUITMENT_STATUS = {
  TEMP_ACTIVE: 'temp_active',
  OFFER_MADE: 'offer_made',
  OFFER_ACCEPTED: 'offer_accepted',
  PERMANENT_HIRED: 'permanent_hired',
  WITHDRAWN: 'withdrawn',
};

export const RECRUITMENT_STATUS_OPTIONS = [
  {
    value: RECRUITMENT_STATUS.TEMP_ACTIVE,
    label: 'On temp assignment',
    color: 'info',
    description: 'Worker is covering shifts temporarily',
  },
  {
    value: RECRUITMENT_STATUS.OFFER_MADE,
    label: 'Offer made',
    color: 'warning',
    description: 'Employer has sent a permanent role offer',
  },
  {
    value: RECRUITMENT_STATUS.OFFER_ACCEPTED,
    label: 'Offer accepted',
    color: 'primary',
    description: 'Worker accepted the permanent offer',
  },
  {
    value: RECRUITMENT_STATUS.PERMANENT_HIRED,
    label: 'Permanent hire',
    color: 'success',
    description: 'Temp-to-perm conversion completed',
  },
  {
    value: RECRUITMENT_STATUS.WITHDRAWN,
    label: 'Withdrawn',
    color: 'default',
    description: 'Offer declined or process cancelled',
  },
  { value: 'pending', label: 'Pending', color: 'warning', description: '' },
  { value: 'accepted', label: 'Accepted', color: 'primary', description: '' },
  { value: 'rejected', label: 'Rejected', color: 'error', description: '' },
  { value: 'cancelled', label: 'Cancelled', color: 'default', description: '' },
  { value: 'ended', label: 'Ended', color: 'info', description: '' },
  { value: 'hired', label: 'Hired', color: 'success', description: '' },
];

export const RECRUITMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  ...RECRUITMENT_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
];

export function getRecruitmentStatusOption(status) {
  return (
    RECRUITMENT_STATUS_OPTIONS.find((item) => item.value === status) || {
      value: status,
      label: String(status || 'Unknown'),
      color: 'default',
      description: '',
    }
  );
}
