import { addDays, format, isSameDay, isValid, parse, startOfDay } from 'date-fns';

import { fCurrency } from 'src/utils/format-number';

import { resolveBidApiStatus } from '../care-home-job-bid-api-utils';

// ----------------------------------------------------------------------

export const ROWS_PER_PAGE_GRID = 12;
export const ROWS_PER_PAGE_LIST = 10;

export const DATE_FILTERS = [
  { value: 'all', label: 'Any date' },
  { value: 'next24Hours', label: 'Urgent · Next 24h' },
  { value: 'thisWeek', label: 'This week' },
  { value: 'nextWeek', label: 'Next week' },
];

/** Display metadata per backend bid status. `closed` = no further employer action. */
export const BID_STATUS_META = {
  pending: { label: 'Pending', color: 'warning', icon: 'solar:clock-circle-bold', closed: false },
  accepted: { label: 'Accepted', color: 'success', icon: 'solar:check-circle-bold', closed: false },
  rejected: { label: 'Rejected', color: 'error', icon: 'solar:close-circle-bold', closed: true },
  deleted: { label: 'Deleted', color: 'default', icon: 'solar:trash-bin-trash-bold', closed: true },
  withdraw: { label: 'Withdrawn', color: 'default', icon: 'solar:undo-left-round-bold', closed: true },
  cancelledByWorker: {
    label: 'Cancelled by worker',
    color: 'error',
    icon: 'solar:forbidden-circle-bold',
    closed: true,
  },
  cancelledByEmployer: {
    label: 'Cancelled by employer',
    color: 'error',
    icon: 'solar:forbidden-circle-bold',
    closed: true,
  },
  cancelledByUser: {
    label: 'Cancelled by user',
    color: 'error',
    icon: 'solar:forbidden-circle-bold',
    closed: true,
  },
};

export const BID_STATUS_FILTERS = [{ value: 'all', label: 'All statuses' }, ...Object.entries(BID_STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))];

/** Summary tiles above the list — each one doubles as a quick status filter. */
export const BID_SUMMARY_TILES = [
  { value: 'all', label: 'Total bids', color: 'primary', icon: 'solar:hand-money-bold' },
  { value: 'pending', label: 'Pending', color: 'warning', icon: 'solar:clock-circle-bold' },
  { value: 'accepted', label: 'Accepted', color: 'success', icon: 'solar:check-circle-bold' },
  { value: 'rejected', label: 'Rejected', color: 'error', icon: 'solar:close-circle-bold' },
];

export const BID_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'shiftSoonest', label: 'Shift date (soonest)' },
  { value: 'priceLow', label: 'Total price (low to high)' },
  { value: 'priceHigh', label: 'Total price (high to low)' },
  { value: 'rateLow', label: 'Hourly rate (low to high)' },
  { value: 'ratingHigh', label: 'Rating (highest)' },
  { value: 'status', label: 'Status' },
];

// ----------------------------------------------------------------------

export function getBidUiStatus(bid) {
  return resolveBidApiStatus(bid?.apiStatus || bid?.status) || 'pending';
}

export function getBidStatusMeta(bid) {
  return BID_STATUS_META[getBidUiStatus(bid)] || BID_STATUS_META.pending;
}

export function getBidId(bid) {
  return String(bid?.id || bid?._id || '').trim();
}

export function getBidUserId(bid) {
  return String(bid?.userId || bid?.user?._id || bid?.user?.id || '').trim();
}

export function formatShiftTime(shiftTime) {
  return shiftTime?.replace(/^Shift:\s*/i, '') || shiftTime || '';
}

function getShiftDate(shiftDate) {
  if (!shiftDate) return null;
  const parsed = parse(shiftDate, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? startOfDay(parsed) : null;
}

export function formatShiftDateLabel(shiftDate) {
  const date = getShiftDate(shiftDate);
  if (!date) return '';

  const today = startOfDay(new Date());
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, addDays(today, 1))) return 'Tomorrow';
  return format(date, 'EEE d MMM');
}

export function isNurseJobType(jobType = '') {
  return String(jobType).toLowerCase().includes('nurse');
}

function getBidUserType(bid) {
  return String(bid?.userType || bid?.user?.accountState?.userType || '')
    .trim()
    .toLowerCase();
}

/** True when the bidder is a nurse/individual (not an agency). */
export function isNurseBidder(bid) {
  const partner = String(bid?.partnerType || '')
    .trim()
    .toLowerCase();
  const userType = getBidUserType(bid);

  if (partner === 'agency' || userType === 'agency') return false;
  return partner === 'individual' || partner === 'nurse' || userType === 'nurse' || userType === 'individual' || userType === 'worker';
}

const SUPPLIER_TYPES = {
  agency: { label: 'Agency', icon: 'solar:buildings-2-bold', color: 'info' },
  homeCareCompany: { label: 'Home care company', icon: 'solar:home-2-bold', color: 'secondary' },
  nurse: { label: 'Nurse', icon: 'solar:user-heart-bold', color: 'primary' },
};

/** Nurse | Agency | Home care company, derived from the bidder account type. */
export function getBidSupplierType(bid) {
  const userType = getBidUserType(bid).replace(/[\s_-]/g, '');
  const partner = String(bid?.partnerType || '')
    .toLowerCase()
    .replace(/[\s_-]/g, '');

  if (userType === 'homecarecompany' || partner === 'homecarecompany') {
    return SUPPLIER_TYPES.homeCareCompany;
  }
  if (isNurseBidder(bid)) return SUPPLIER_TYPES.nurse;
  return SUPPLIER_TYPES.agency;
}

export function getBidWeeklyHoursLabel(bid) {
  if (bid?.weeklyHoursAvailable) return bid.weeklyHoursAvailable;
  if (Number(bid?.weeklyHours) > 0) return `${bid.weeklyHours}h / week`;
  return '';
}

/** Status label after accept / assign / smart-assign. */
export function getBidAcceptanceLabel(bid) {
  if (!bid || bid.status !== 'accepted') return '';
  if (bid.assignedStaff) {
    return `${bid.autoAssigned ? 'Smart assigned' : 'Assigned'} · ${bid.assignedStaff}`;
  }
  return 'Accepted';
}

export function getBidSpecialitiesLabel(bid) {
  return Array.isArray(bid?.specialities) ? bid.specialities.filter(Boolean).join(', ') : '';
}

/** "Today · 09:00 - 17:00" for shift jobs, weekly hours for nurse jobs. */
export function getBidScheduleLabel(bid) {
  if (isNurseJobType(bid?.jobType)) {
    const hours = getBidWeeklyHoursLabel(bid);
    return hours ? `Available ${hours}` : 'Weekly hours not specified';
  }
  return [formatShiftDateLabel(bid?.shiftDate), formatShiftTime(bid?.shiftTime)].filter(Boolean).join(' · ');
}

/** "Submitted 3 hours ago" — `timeAgo` comes from fToNow (no "ago" suffix). */
export function getBidSubmittedLabel(bid) {
  const ago = String(bid?.timeAgo || '').trim();
  if (!ago || ago === 'Invalid time value') return '';
  return `Submitted ${/ago$/i.test(ago) ? ago : `${ago} ago`}`;
}

export function formatBidRate(bid) {
  return `${fCurrency(bid?.hourlyRate || 0)}/h`;
}

export function getBidInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export function getJobFilterLabel(job) {
  return job?.type || 'Untitled job';
}

export function getBidsPath(pathname, fallback) {
  if (pathname?.includes('/jobs/')) {
    return pathname.replace(/\/jobs\/[^/?]+$/, '/jobs/bids');
  }
  return fallback;
}

// ----------------------------------------------------------------------

export function getBidReceivedTime(bid) {
  const created = Date.parse(bid?.createdAt) || 0;
  const updated = Date.parse(bid?.updatedAt) || 0;
  if (created || updated) return Math.max(created, updated);

  const id = getBidId(bid);
  if (/^[a-f\d]{24}$/i.test(id)) {
    return parseInt(id.slice(0, 8), 16) * 1000;
  }

  return 0;
}

function compareBidsByShiftDate(a, b) {
  const dateA = getShiftDate(a.shiftDate)?.getTime() || Number.MAX_SAFE_INTEGER;
  const dateB = getShiftDate(b.shiftDate)?.getTime() || Number.MAX_SAFE_INTEGER;
  if (dateA !== dateB) return dateA - dateB;

  const timeA = a.shiftStartTime || '99:99';
  const timeB = b.shiftStartTime || '99:99';
  return timeA.localeCompare(timeB);
}

/** Newest incoming bids first — then earlier shift as a tie-break. */
function compareBidsNewestFirst(a, b) {
  const diff = getBidReceivedTime(b) - getBidReceivedTime(a);
  return diff || compareBidsByShiftDate(a, b);
}

const STATUS_ORDER = Object.keys(BID_STATUS_META);

const BID_COMPARATORS = {
  newest: compareBidsNewestFirst,
  oldest: (a, b) => -compareBidsNewestFirst(a, b),
  shiftSoonest: (a, b) => compareBidsByShiftDate(a, b) || compareBidsNewestFirst(a, b),
  priceLow: (a, b) => a.totalPrice - b.totalPrice || compareBidsNewestFirst(a, b),
  priceHigh: (a, b) => b.totalPrice - a.totalPrice || compareBidsNewestFirst(a, b),
  rateLow: (a, b) => a.hourlyRate - b.hourlyRate || compareBidsNewestFirst(a, b),
  ratingHigh: (a, b) => b.rating - a.rating || b.reviews - a.reviews || compareBidsNewestFirst(a, b),
  status: (a, b) => STATUS_ORDER.indexOf(getBidUiStatus(a)) - STATUS_ORDER.indexOf(getBidUiStatus(b)) || compareBidsNewestFirst(a, b),
};

export function sortBids(bids, sortBy = 'newest') {
  return [...bids].sort(BID_COMPARATORS[sortBy] || BID_COMPARATORS.newest);
}

export function bidMatchesSearch(bid, query) {
  const needle = String(query || '')
    .trim()
    .toLowerCase();
  if (!needle) return true;

  return [bid.name, bid.jobType, bid.jobName, bid.jobAddress, getBidSpecialitiesLabel(bid), getBidSupplierType(bid).label].some((value) =>
    String(value || '')
      .toLowerCase()
      .includes(needle)
  );
}
