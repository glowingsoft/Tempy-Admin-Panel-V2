import { useCallback, useMemo } from 'react';

import {
  useEndAdminPermanentHireMutation,
  useGetAdminHiredPermanentHiresQuery,
  useGetAdminPermanentHiresQuery,
} from 'src/store/Reducer/dashboard-settings-api';

const EMPTY_PAGE = { data: [], totalRecords: 0, currentPage: 1, totalPages: 1, limit: 10 };

function pageOf(result) {
  return result?.data ? result : EMPTY_PAGE;
}

export function useAdminRecruitment(status, { page = 0, limit = 10 } = {}) {
  const listQuery = useGetAdminPermanentHiresQuery(
    { status, page, limit },
    { skip: !status }
  );
  const acceptedQuery = useGetAdminPermanentHiresQuery({ status: 'accepted', page: 0, limit: 5 });
  const hiredQuery = useGetAdminHiredPermanentHiresQuery({ page: 0, limit: 5 });
  const [endHire, { isLoading: ending }] = useEndAdminPermanentHireMutation();

  const listPage = pageOf(listQuery.data);
  const acceptedPage = pageOf(acceptedQuery.data);
  const hiredPage = pageOf(hiredQuery.data);

  const requests = useMemo(() => {
    if (status) return listPage.data;

    const byId = new Map();
    acceptedPage.data.forEach((row) => {
      if (row.id) byId.set(row.id, row);
    });
    hiredPage.data.forEach((row) => {
      if (row.id) byId.set(row.id, row);
    });
    return [...byId.values()];
  }, [acceptedPage.data, hiredPage.data, listPage.data, status]);

  const summary = useMemo(() => {
    const accepted = acceptedPage.totalRecords;
    const hired = hiredPage.totalRecords;
    const total = accepted + hired;
    const conversionRate = total ? Math.round((hired / total) * 100) : 0;
    const recent = [...requests]
      .sort((a, b) => new Date(b.updatedAt || b.respondedAt || 0) - new Date(a.updatedAt || a.respondedAt || 0))
      .slice(0, 5);

    return {
      accepted,
      hired,
      total,
      offersPending: accepted,
      permanentHired: hired,
      activeTemp: 0,
      conversionRate,
      pipeline: [
        { label: 'Accepted', value: accepted },
        { label: 'Hired', value: hired },
      ].filter((item) => item.value > 0),
      recent,
    };
  }, [acceptedPage.totalRecords, hiredPage.totalRecords, requests]);

  const refetch = useCallback(() => {
    listQuery.refetch();
    acceptedQuery.refetch();
    hiredQuery.refetch();
  }, [acceptedQuery, hiredQuery, listQuery]);

  return {
    requests,
    totalRecords: status ? listPage.totalRecords : requests.length,
    summary,
    isLoading: status ? listQuery.isLoading : acceptedQuery.isLoading || hiredQuery.isLoading,
    isFetching: status ? listQuery.isFetching : acceptedQuery.isFetching || hiredQuery.isFetching,
    isError: status ? listQuery.isError : acceptedQuery.isError || hiredQuery.isError,
    error: status ? listQuery.error : acceptedQuery.error || hiredQuery.error,
    refetch,
    endHire,
    ending,
  };
}
