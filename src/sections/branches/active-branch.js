import { paths } from 'src/routes/paths';

export const ALL_SITES_ID = 'all';

const STORAGE_PREFIX = 'tempy-active-branch';

export function resolveBranchRole(user) {
  const permission = Number(user?.permission);
  const accountType = String(user?.accountState?.accountType || user?.accountType || user?.userType || '');

  if (permission === 1 || accountType === 'admin') return null;
  if (permission === 8 || accountType === 'staff_member' || accountType === 'nurse') return null;

  if (permission === 3 || accountType === 'agency') return 'agency';
  if (permission === 4 || accountType === 'hospital_nhs' || accountType === 'hospital') return 'hospital';
  if (permission === 5 || accountType === 'local_authority' || accountType === 'localAuthority') {
    return 'localAuthority';
  }
  if (
    permission === 6 ||
    accountType === 'individual_home_care' ||
    accountType === 'individualHomeCare' ||
    accountType === 'user'
  ) {
    return 'user';
  }
  if (permission === 7 || accountType === 'home_care_company' || accountType === 'homeCareCompany') {
    return 'homeCareCompany';
  }
  if (permission === 2 || accountType === 'care_home' || accountType === 'careHome') return 'careHome';

  return null;
}

export function getBranchesManagePath(role) {
  if (role === 'agency') return paths.dashboard.agency.branches;
  if (role === 'hospital') return paths.dashboard.hospital.branches;
  if (role === 'localAuthority') return paths.dashboard.localAuthority.branches;
  if (role === 'user') return paths.dashboard.individualHomeCare.locations;
  if (role === 'homeCareCompany') return paths.dashboard.homeCareCompany.branches;
  return paths.dashboard.branches;
}

export function getSiteNoun(role, { plural = false } = {}) {
  if (role === 'user') return plural ? 'locations' : 'location';
  return plural ? 'sites' : 'site';
}

export function getBranchDisplayName(branch) {
  if (!branch) return '';
  return String(branch.name || branch.branchName || branch.title || '').trim();
}

export function isListedBranch(branch) {
  if (!branch) return false;
  const status = String(branch.status || 'active').toLowerCase();
  return status !== 'deleted' && status !== 'delete';
}

export function isActiveSiteBranch(branch) {
  if (!isListedBranch(branch)) return false;
  const status = String(branch.status || 'active').toLowerCase();
  if (status === 'inactive') return false;
  if (branch.isActive === false) return false;
  return true;
}

export function getJobBranchId(job) {
  if (!job) return '';
  if (typeof job.branch === 'object') {
    return String(job.branch?._id || job.branch?.id || job.branchId || '');
  }
  return String(job.branchId || job.branch || '');
}

export function jobMatchesActiveBranch(job, activeBranchId) {
  if (!activeBranchId || activeBranchId === ALL_SITES_ID) return true;
  const jobBranchId = getJobBranchId(job);
  if (!jobBranchId) return false;
  return String(jobBranchId) === String(activeBranchId);
}

export function bidMatchesActiveBranch(bid, activeBranchId, siteJobIds) {
  if (!activeBranchId || activeBranchId === ALL_SITES_ID) return true;
  const bidBranchId = getJobBranchId(bid);
  if (bidBranchId) return String(bidBranchId) === String(activeBranchId);
  if (siteJobIds?.size) return siteJobIds.has(String(bid.jobId || ''));
  return true;
}

function storageKey(userId) {
  return `${STORAGE_PREFIX}:${userId || 'anon'}`;
}

export function loadActiveBranchId(userId) {
  try {
    const value = window.localStorage.getItem(storageKey(userId));
    return value || ALL_SITES_ID;
  } catch {
    return ALL_SITES_ID;
  }
}

export function saveActiveBranchId(userId, branchId) {
  try {
    window.localStorage.setItem(storageKey(userId), branchId || ALL_SITES_ID);
  } catch {
    // ignore quota / private mode
  }
}
