import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export const VIEW_ONLY_MESSAGE = 'View only — admin cannot make changes to this account.';

/** True while admin is inside another account (impersonation) on its dashboard. */
export function isViewOnlySession(state, pathname = '') {
  const impersonating = Boolean(state?.impersonation?.isActive);
  const onAdminDashboard = String(pathname || '').startsWith(paths.adminDashboard.root);
  return impersonating && !onAdminDashboard;
}
