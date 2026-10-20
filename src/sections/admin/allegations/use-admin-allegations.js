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

function matchesFeed(row, type) {
  // Default / Raised = full API list (raised + derived). Other cards narrow by derivedType.
  if (!type || type === 'raised' || type === 'all') {
    return true;
  }
  return row.feedType === type || row.derivedType === type;
}

export function useAdminAllegations({ page = 0, limit = 10, status = '', keyword = '', type = '' } = {}) {
  const isRaised = !type || type === 'raised' || type === 'all';

  // API returns mixed raised + derived in one list; filter by screen on the client.
  const listQuery = useGetAdminAllegationsQuery({
    page: 0,
    limit: 200,
    status: isRaised && status && status !== 'all' ? status : '',
    keyword,
    type: '',
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

  const filtered = useMemo(() => {
    let list = rows.filter((row) => matchesFeed(row, type));
    if (isRaised && status && status !== 'all') {
      list = list.filter((row) => row.status === status);
    }
    return list;
  }, [isRaised, rows, status, type]);

  const allegations = useMemo(
    () => filtered.slice(page * limit, page * limit + limit),
    [filtered, limit, page]
  );

  const hasTotal = true;
  const serverTotal = filtered.length;

  const summaryRef = useRef(EMPTY_SUMMARY);
  const summary = useMemo(() => {
    if (!listQuery.data) return summaryRef.current;
    const next = { ...EMPTY_SUMMARY };

    (listQuery.data.cards || []).forEach((card) => {
      const key = summaryKey(card.key);
      if (key) next[key] = Number(card.total) || 0;
    });

    // "All allegations" card = full list size (API raised count is often 0 while derived rows exist).
    const totalCard = listQuery.data.cards?.find((card) => String(card.key) === 'total');
    next.raised = Number(totalCard?.total) || rows.length || next.raised || 0;
    ['cancellation_strike', 'abandoned_shift', 'suspended_user', 'reported_user'].forEach((key) => {
      if (!listQuery.data.cards?.some((card) => summaryKey(card.key) === key)) {
        next[key] = rows.filter((row) => matchesFeed(row, key)).length;
      }
    });

    summaryRef.current = next;
    return next;
  }, [listQuery.data, rows]);

  return {
    allegations,
    allRows: rows,
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
