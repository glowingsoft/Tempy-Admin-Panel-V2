import { useSelector } from 'react-redux';

import { usePathname } from 'src/routes/hooks';

import { isViewOnlySession } from 'src/auth/utils/view-only';

// ----------------------------------------------------------------------

/**
 * Admin can look at any account but not change it: while this is true, screens hide their
 * create / edit / delete actions. The API layer refuses those requests as well (baseQuery).
 */
export function useViewOnly() {
  const pathname = usePathname();
  return useSelector((state) => isViewOnlySession(state, pathname));
}
