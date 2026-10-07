import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { useRouter } from 'src/routes/hooks';

import { getRoleModuleRedirectPath } from 'src/auth/utils/role-module-redirect';

/**
 * Redirects away from care-home/agency legacy URLs when the logged-in role
 * should use a different dashboard module (avoids wrong /web/{prefix} APIs).
 *
 * @param {'shifts'|'jobs.created'|'jobs.bids'|'jobs.post'|'jobs.find'|'jobs.agreedRates'|'agency.shifts'|'agency.bids'|'agency.jobs'} moduleKey
 */
export function useRoleModuleGuard(moduleKey) {
  const router = useRouter();
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    const redirectTo = getRoleModuleRedirectPath(user, moduleKey);
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [user, moduleKey, router]);

  const redirectTo = getRoleModuleRedirectPath(user, moduleKey);
  return Boolean(redirectTo);
}
