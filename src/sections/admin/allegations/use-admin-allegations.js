import { useCallback, useMemo, useRef } from 'react';

import {
  useGetAdminAllegationsQuery,
  useLazyGetAllegationReplacementsQuery,
  useRaiseAdminAllegationMutation,
  useReallocateAllegationShiftMutation,
  useRepublishAllegationShiftMutation,
  useUpdateAdminAllegationStatusMutation,
} from 'src/store/Reducer/admin-allegations-api';

const EMPTY_SUMMARY = {
  raised: 0,
  cancellation_strike: 0,
  abandoned_shift: 0,
  suspended_user: 0,
  reported_user: 0,
};

const SUMMARY_KEYS = {
  raised: 'raised',
  allegations: 'raised',
  allegation: 'raised',
  cancellation_strike: 'cancellation_strike',
  cancellationstrike: 'cancellation_strike',
  cancellationstrikes: 'cancellation_strike',
  abandoned_shift: 'abandoned_shift',
  abandonedshift: 'abandoned_shift',
  abandonedshifts: 'abandoned_shift',
  suspended_user: 'suspended_user',
  suspendeduser: 'suspended_user',
  suspendedusers: 'suspended_user',
  suspended: 'suspended_user',
  suspensions: 'suspended_user',
  reported_user: 'reported_user',
  reporteduser: 'reported_user',
  reportedusers: 'reported_user',
  reported: 'reported_user',
};

function summaryKey(value) {
  const raw = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
  return SUMMARY_KEYS[raw] || SUMMARY_KEYS[raw.replace(/_/g, '')] || '';
}

export function useAdminAllegations({ page = 0, limit = 10, status = '', keyword = '', type = '' } = {}) {
  const listType = !type || type === 'raised' || type === 'all' ? '' : type;
  const listQuery = useGetAdminAllegationsQuery({
    page,
    limit,
    status: listType ? '' : status,
    keyword,
    type: listType,
  });
  const [raiseAllegationMutation, raiseState] = useRaiseAdminAllegationMutation();
  const [updateStatusMutation, statusState] = useUpdateAdminAllegationStatusMutation();
  const [reallocateMutation, reallocateState] = useReallocateAllegationShiftMutation();
  const [republishMutation, republishState] = useRepublishAllegationShiftMutation();
  const [loadReplacements, replacementsState] = useLazyGetAllegationReplacementsQuery();

  const raiseAllegation = useCallback(
    (payload) => raiseAllegationMutation(payload).unwrap(),
    [raiseAllegationMutation]
  );

  const setAllegationStatus = useCallback(
    (id, statusValue) => updateStatusMutation({ id, status: statusValue }).unwrap(),
    [updateStatusMutation]
  );

  const reallocate = useCallback(
    (allegationId, shiftId, replacementWorkerId) =>
      reallocateMutation({ allegationId, shiftId, replacementWorkerId }).unwrap(),
    [reallocateMutation]
  );

  const republish = useCallback(
    (allegationId, shiftId) => republishMutation({ allegationId, shiftId }).unwrap(),
    [republishMutation]
  );

  const fetchReplacements = useCallback(
    (allegationId, shiftId) => loadReplacements({ allegationId, shiftId }).unwrap(),
    [loadReplacements]
  );

  const rows = listQuery.data?.data || [];
  const mixedFeeds = Boolean(listType) && rows.some((row) => row.feedType && row.feedType !== listType);
  const allegations = !listType
    ? rows.filter((row) => !row.feedType)
    : mixedFeeds
      ? rows.filter((row) => row.feedType === listType)
      : rows;
  const hasTotal = Boolean(listQuery.data?.meta?.hasTotal);
  const serverTotal = hasTotal ? Number(listQuery.data.meta.totalRecords) || 0 : null;

  const summaryRef = useRef(EMPTY_SUMMARY);
  const summary = useMemo(() => {
    if (!listQuery.data) return summaryRef.current;
    const next = { ...summaryRef.current };
    (listQuery.data.cards || []).forEach((card) => {
      const key = summaryKey(card.key);
      if (key) next[key] = Number(card.total) || 0;
    });
    const activeCount = serverTotal ?? allegations.length;
    if (!listType) next.raised = activeCount;
    else next[listType] = activeCount;
    summaryRef.current = next;
    return next;
  }, [allegations.length, listQuery.data, listType, serverTotal]);

  return {
    allegations,
    hasTotal,
    serverTotal,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isError: listQuery.isError,
    error: listQuery.error,
    summary,
    raiseAllegation,
    setAllegationStatus,
    reallocate,
    republish,
    fetchReplacements,
    raising: raiseState.isLoading,
    updatingStatus: statusState.isLoading,
    reallocating: reallocateState.isLoading,
    republishing: republishState.isLoading,
    loadingReplacements: replacementsState.isLoading || replacementsState.isFetching,
  };
}
