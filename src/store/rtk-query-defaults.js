
export const BRANCH_LIST_ARGS = { page: 0, limit: 100 };

export const REFETCH_IF_STALE_SECONDS = 60;

export const staleIfOlder = {
  refetchOnMountOrArgChange: REFETCH_IF_STALE_SECONDS,
  refetchOnFocus: false,
  refetchOnReconnect: true,
};
