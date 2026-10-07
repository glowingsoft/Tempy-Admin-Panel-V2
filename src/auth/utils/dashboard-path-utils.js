import { paths } from 'src/routes/paths';

const PERMISSION_DASHBOARD_ROOT = {
  1: paths.adminDashboard.root,
  2: paths.dashboard.root,
  3: paths.dashboard.agency.root,
  4: paths.dashboard.hospital.root,
  5: paths.dashboard.localAuthority.root,
  6: paths.dashboard.individualHomeCare.root,
  7: paths.dashboard.homeCareCompany.root,
  8: paths.dashboard.staffMember.root,
};

const ACCOUNT_TYPE_DASHBOARD_ROOT = {
  admin: paths.adminDashboard.root,
  care_home: paths.dashboard.root,
  agency: paths.dashboard.agency.root,
  hospital_nhs: paths.dashboard.hospital.root,
  local_authority: paths.dashboard.localAuthority.root,
  individual_home_care: paths.dashboard.individualHomeCare.root,
  individualHomeCare: paths.dashboard.individualHomeCare.root,
  user: paths.dashboard.individualHomeCare.root,
  home_care_company: paths.dashboard.homeCareCompany.root,
  staff_member: paths.dashboard.staffMember.root,
};

export function getDashboardRootPath(permission, accountType) {
  const resolvedPermission = Number(permission);

  if (PERMISSION_DASHBOARD_ROOT[resolvedPermission]) {
    return PERMISSION_DASHBOARD_ROOT[resolvedPermission];
  }

  if (accountType && ACCOUNT_TYPE_DASHBOARD_ROOT[accountType]) {
    return ACCOUNT_TYPE_DASHBOARD_ROOT[accountType];
  }

  return paths.dashboard.root;
}

export const DASHBOARD_USER_PERMISSIONS = [2, 3, 4, 5, 6, 7, 8];
