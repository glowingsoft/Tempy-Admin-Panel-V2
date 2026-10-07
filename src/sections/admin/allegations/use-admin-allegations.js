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
  const allegations = listType
    ? rows.filter((row) => row.feedType === listType)
    : rows.filter((row) => !row.feedType);
  const total = !listQuery.data
    ? 0
    : !listType
      ? Number(listQuery.data.total) || allegations.length
      : rows.length && rows.every((row) => row.feedType === listType)
        ? Number(listQuery.data.total) || rows.length
        : 0;

  const summaryRef = useRef(EMPTY_SUMMARY);
  const summary = useMemo(() => {
    if (!listQuery.data) return summaryRef.current;
    const next = { ...summaryRef.current };
    if (!listType) next.raised = Number(listQuery.data.total) || allegations.length;
    else next[listType] = total;
    summaryRef.current = next;
    return next;
  }, [allegations.length, listQuery.data, listType, total]);

  return {
    allegations,
    total,
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
