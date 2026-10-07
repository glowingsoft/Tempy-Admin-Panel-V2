import { getDashboardRootPath } from './dashboard-path-utils';

// ----------------------------------------------------------------------

export function getPostLoginPath(permission, accountType) {
  return getDashboardRootPath(permission, accountType);
}
