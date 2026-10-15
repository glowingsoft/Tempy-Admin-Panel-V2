import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { useGetNurseDashboardQuery } from 'src/store/Reducer/nurse-dashboard-api';
import { useGetUserByIdQuery } from 'src/store/Reducer/users-api';
import { useScopedUserId } from 'src/hooks/use-scoped-user-id';

import { extractCancellationStats, mergeCancellationStats } from './staff-member-cancellation-utils';
import { getLocalCancellationStats } from './staff-member-cancellation-store';
import { countActiveProfileStrikes } from './staff-member-strike-rule-utils';

export function useStaffCancellationStats() {
  const { user } = useSelector((state) => state.user);
  const scopeUserId = useScopedUserId();
  const { data: dashboard } = useGetNurseDashboardQuery({ userId: scopeUserId }, { skip: !scopeUserId });
  // Refetch on mount so strikes cleared by an admin show up without a reload.
  const { data: profile } = useGetUserByIdQuery(scopeUserId, {
    skip: !scopeUserId,
    refetchOnMountOrArgChange: 60, refetchOnFocus: false,
  });

  return useMemo(() => {
    const apiStats = extractCancellationStats(user, dashboard, dashboard?.cancellationStats);
    const merged = mergeCancellationStats(apiStats, getLocalCancellationStats());
    // Uncleared strikes on the profile are the source of truth; null → fall back to `late`.
    const activeStrikes = countActiveProfileStrikes(profile?.raw, user);
    return { ...merged, activeStrikes };
  }, [dashboard, profile, user]);
}
