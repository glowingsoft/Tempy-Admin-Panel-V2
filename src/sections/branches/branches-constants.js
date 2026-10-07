/** Branch status constants used by API-backed branch screens (not demo data). */

export const BRANCH_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INACTIVE: 'inactive',
  DELETED: 'deleted',
  DELETE: 'deleted',
};

export const BRANCH_STATUS_OPTIONS = [
  { value: BRANCH_STATUS.ACTIVE, label: 'Active' },
  { value: BRANCH_STATUS.PENDING, label: 'Pending' },
  { value: BRANCH_STATUS.INACTIVE, label: 'Inactive' },
  { value: BRANCH_STATUS.DELETED, label: 'Deleted' },
];

export const BRANCH_STATUS_TABS = [
  { value: 'all', label: 'All', color: 'info' },
  { value: BRANCH_STATUS.ACTIVE, label: 'Active', color: 'success' },
  { value: BRANCH_STATUS.PENDING, label: 'Pending', color: 'warning' },
  { value: BRANCH_STATUS.INACTIVE, label: 'Inactive', color: 'error' },
  { value: BRANCH_STATUS.DELETED, label: 'Deleted', color: 'default' },
];

/** UK CQC ratings — used on home care company branch profiles. */
export const CQC_RATING_OPTIONS = [
  { value: 'outstanding', label: 'Outstanding' },
  { value: 'good', label: 'Good' },
  { value: 'requires_improvement', label: 'Requires improvement' },
  { value: 'inadequate', label: 'Inadequate' },
  { value: 'not_rated', label: 'Not rated yet' },
];
