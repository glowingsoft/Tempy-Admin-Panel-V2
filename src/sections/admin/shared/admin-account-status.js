import {
  ADMIN_HOSPITALS_LIST,
  ADMIN_LOCAL_AUTHORITY_LIST,
  ADMIN_INDIVIDUAL_HOME_CARE_LIST,
  ADMIN_HOME_CARE_COMPANIES_LIST,
  ADMIN_STAFF_MEMBERS_LIST,
} from 'src/_mock/_admin-list-config';
import { ADMIN_AGENCIES_LIST, ADMIN_CARE_HOMES_LIST } from 'src/_mock/_admin-agencies';

const STORAGE_KEY = 'tempy-admin-account-status';

const ADMIN_ACCOUNT_LISTS = [
  ADMIN_AGENCIES_LIST,
  ADMIN_CARE_HOMES_LIST,
  ADMIN_HOSPITALS_LIST,
  ADMIN_LOCAL_AUTHORITY_LIST,
  ADMIN_INDIVIDUAL_HOME_CARE_LIST,
  ADMIN_HOME_CARE_COMPANIES_LIST,
  ADMIN_STAFF_MEMBERS_LIST,
];

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function normalizeEmail(email = '') {
  return String(email).trim().toLowerCase();
}

export function isAccountInactive(status) {
  if (status === false || status === 0) return true;
  if (status == null || status === '') return false;
  return String(status).toLowerCase() === 'inactive';
}

export function isAccountSuspended(status) {
  if (status == null || status === '') return false;
  return String(status).toLowerCase() === 'suspended';
}

export function isAccountPending(status) {
  if (status == null || status === '') return false;
  const raw = String(status).toLowerCase();
  return (
    raw === 'pending' ||
    raw === 'awaiting' ||
    raw === 'under_review' ||
    raw === 'in_review' ||
    raw === 'not_approved' ||
    raw === 'unapproved' ||
    raw === 'waiting' ||
    raw === 'waiting_approval' ||
    raw === 'awaiting_approval'
  );
}

/** Only Active accounts may sign in (Pending / Inactive / Suspended are blocked). */
export function canAccountLogin(status) {
  if (isAccountInactive(status) || isAccountPending(status) || isAccountSuspended(status)) return false;
  const raw = String(status || '')
    .trim()
    .toLowerCase();
  return !raw || raw === 'active' || raw === 'approved' || raw === 'enabled' || raw === 'verified';
}

function findStatusInAdminLists(email) {
  const key = normalizeEmail(email);
  for (const list of ADMIN_ACCOUNT_LISTS) {
    const match = list.find((row) => normalizeEmail(row.email) === key);
    if (match?.status) return match.status;
  }
  return null;
}

/** Persist status set from admin listings (keyed by email). */
export function setAccountStatusByEmail(email, status) {
  const key = normalizeEmail(email);
  if (!key) return;
  const map = readMap();
  map[key] = status;
  writeMap(map);
}

export function getAccountStatusByEmail(email, fallback = 'active') {
  const key = normalizeEmail(email);
  if (!key) return fallback;
  const map = readMap();
  if (Object.prototype.hasOwnProperty.call(map, key)) {
    return map[key];
  }
  const fromList = findStatusInAdminLists(key);
  if (fromList != null) return fromList;
  return fallback;
}

/** Merge persisted status overrides onto listing rows. */
export function applyStoredStatuses(rows = []) {
  return rows.map((row) => {
    if (!row?.email) return row;
    const map = readMap();
    const key = normalizeEmail(row.email);
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return { ...row, status: map[key] };
    }
    return row;
  });
}

export const INACTIVE_LOGIN_MESSAGE =
  'Your account is inactive. Please contact support. You cannot log in while inactive.';

export const SUSPENDED_LOGIN_MESSAGE =
  'Your account is suspended. Please contact support. You cannot log in while suspended.';

export const PENDING_LOGIN_MESSAGE =
  'Your account is pending approval. Please wait until an admin sets your status to Active.';

export const INACTIVE_STATUS_NOTE =
  'Inactive users cannot log in. They can continue viewing previously assigned jobs where applicable.';

export const SUSPENDED_STATUS_NOTE =
  'Suspended users cannot log in. This is separate from Inactive.';

export const PENDING_STATUS_NOTE =
  'Pending users cannot sign in until an admin sets their status to Active.';

export const ACTIVE_STATUS_NOTE =
  'Active users can sign in to their dashboard immediately.';

export function getLoginBlockMessage(status) {
  if (isAccountSuspended(status)) return SUSPENDED_LOGIN_MESSAGE;
  if (isAccountInactive(status)) return INACTIVE_LOGIN_MESSAGE;
  if (isAccountPending(status)) return PENDING_LOGIN_MESSAGE;
  return '';
}
