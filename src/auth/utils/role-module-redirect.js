import { paths } from 'src/routes/paths';

/**
 * Resolve which of the 7 dashboards the logged-in user belongs to.
 * @returns {'careHome'|'agency'|'hospital'|'localAuthority'|'user'|'homeCareCompany'|'nurse'|null}
 */
export function resolveDashboardRole(user) {
  const permission = Number(user?.permission);
  const accountType = String(user?.accountState?.accountType || '').toLowerCase();

  if (permission === 1 || accountType === 'admin') return null;
  if (permission === 3 || accountType === 'agency') return 'agency';
  if (permission === 4 || accountType === 'hospital_nhs' || accountType === 'hospital') {
    return 'hospital';
  }
  if (permission === 5 || accountType === 'local_authority') return 'localAuthority';
  if (permission === 6 || accountType === 'individual_home_care') return 'user';
  if (permission === 7 || accountType === 'home_care_company') return 'homeCareCompany';
  if (permission === 8 || accountType === 'staff_member' || accountType === 'nurse') {
    return 'nurse';
  }
  if (permission === 2 || accountType === 'care_home') return 'careHome';

  return 'careHome';
}

/**
 * Map a care-home-root or agency-root module to the correct path for the logged-in role.
 * Returns null when the current page is already correct for this role (no redirect).
 *
 * @param {'shifts'|'jobs.created'|'jobs.bids'|'jobs.post'|'jobs.find'|'jobs.agreedRates'|'agency.shifts'|'agency.bids'|'agency.jobs'} moduleKey
 */
export function getRoleModuleRedirectPath(user, moduleKey) {
  const role = resolveDashboardRole(user);
  if (!role || role === 'careHome') {
    // Care-home users stay on /dashboard/... care-home pages
    if (String(moduleKey).startsWith('agency.')) {
      // Care-home should not stay on agency pages
      if (moduleKey === 'agency.shifts') return paths.dashboard.shifts;
      if (moduleKey === 'agency.bids') return paths.dashboard.jobs.bids;
      if (moduleKey === 'agency.jobs') return paths.dashboard.jobs.created;
      return paths.dashboard.root;
    }
    // Find Jobs is agency/seller — keep care-home off agency APIs
    if (moduleKey === 'jobs.find') return paths.dashboard.jobs.created;
    return null;
  }

  const byRole = {
    agency: {
      shifts: paths.dashboard.agency.shifts,
      'jobs.created': paths.dashboard.agency.bids,
      'jobs.bids': paths.dashboard.agency.bids,
      'jobs.post': paths.dashboard.agency.bids,
      'jobs.find': null,
      'jobs.agreedRates': paths.dashboard.agency.agreedRates,
      'agency.shifts': null,
      'agency.bids': null,
      'agency.jobs': null,
    },
    hospital: {
      shifts: paths.dashboard.hospital.shifts,
      'jobs.created': paths.dashboard.hospital.jobs.created,
      'jobs.bids': paths.dashboard.hospital.jobs.bids,
      'jobs.post': paths.dashboard.hospital.jobs.post,
      'jobs.find': paths.dashboard.hospital.root,
      'jobs.agreedRates': paths.dashboard.hospital.root,
      'agency.shifts': paths.dashboard.hospital.shifts,
      'agency.bids': paths.dashboard.hospital.jobs.bids,
      'agency.jobs': paths.dashboard.hospital.jobs.created,
    },
    localAuthority: {
      shifts: paths.dashboard.localAuthority.shifts,
      'jobs.created': paths.dashboard.localAuthority.jobs.created,
      'jobs.bids': paths.dashboard.localAuthority.jobs.bids,
      'jobs.post': paths.dashboard.localAuthority.jobs.post,
      'jobs.find': paths.dashboard.localAuthority.root,
      'jobs.agreedRates': paths.dashboard.localAuthority.jobs.contracts,
      'agency.shifts': paths.dashboard.localAuthority.shifts,
      'agency.bids': paths.dashboard.localAuthority.jobs.bids,
      'agency.jobs': paths.dashboard.localAuthority.jobs.created,
    },
    user: {
      shifts: paths.dashboard.individualHomeCare.shifts,
      'jobs.created': paths.dashboard.individualHomeCare.jobs.created,
      'jobs.bids': paths.dashboard.individualHomeCare.jobs.bids,
      'jobs.post': paths.dashboard.individualHomeCare.jobs.post,
      'jobs.find': paths.dashboard.individualHomeCare.root,
      'jobs.agreedRates': paths.dashboard.individualHomeCare.jobs.agreedRates,
      'agency.shifts': paths.dashboard.individualHomeCare.shifts,
      'agency.bids': paths.dashboard.individualHomeCare.jobs.bids,
      'agency.jobs': paths.dashboard.individualHomeCare.jobs.created,
    },
    homeCareCompany: {
      shifts: paths.dashboard.homeCareCompany.shifts,
      'jobs.created': paths.dashboard.homeCareCompany.jobs,
      'jobs.bids': paths.dashboard.homeCareCompany.bids,
      'jobs.post': paths.dashboard.homeCareCompany.jobs,
      'jobs.find': paths.dashboard.homeCareCompany.jobs,
      'jobs.agreedRates': paths.dashboard.homeCareCompany.agreedRates,
      'agency.shifts': paths.dashboard.homeCareCompany.shifts,
      'agency.bids': paths.dashboard.homeCareCompany.bids,
      'agency.jobs': paths.dashboard.homeCareCompany.jobs,
    },
    nurse: {
      shifts: paths.dashboard.staffMember.shifts,
      'jobs.created': paths.dashboard.staffMember.jobs,
      'jobs.bids': paths.dashboard.staffMember.bids,
      'jobs.post': paths.dashboard.staffMember.jobs,
      'jobs.find': paths.dashboard.staffMember.jobs,
      'jobs.agreedRates': paths.dashboard.staffMember.agreedRates,
      'agency.shifts': paths.dashboard.staffMember.shifts,
      'agency.bids': paths.dashboard.staffMember.bids,
      'agency.jobs': paths.dashboard.staffMember.jobs,
    },
  };

  const map = byRole[role];
  if (!map) return null;
  return map[moduleKey] ?? null;
}
