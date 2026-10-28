import { useCallback, useEffect, useMemo, useState } from 'react';

import { useGetCareHomeJobsQuery } from 'src/store/Reducer/care-home-jobs-api';
import { useGetHospitalJobsQuery } from 'src/store/Reducer/hospital-jobs-api';
import { useGetLocalAuthorityJobsQuery } from 'src/store/Reducer/local-authority-jobs-api';
import { useGetUserJobsQuery } from 'src/store/Reducer/user-jobs-api';
import { useGetAgencyJobsQuery } from 'src/store/Reducer/agency-jobs-api';
import { useGetHomeCareCompanyJobsQuery } from 'src/store/Reducer/home-care-company-jobs-api';

import { normalizePostedJobForSidebar } from './posted-jobs-schedule-utils';

const EMPTY = [];
const DEFAULT_PAGE_SIZE = 50;

export function useEmployerPostedJobs(
  apiRole = 'careHome',
  { skip = false, pageSize = DEFAULT_PAGE_SIZE } = {}
) {
  const [limit, setLimit] = useState(pageSize);

  useEffect(() => {
    setLimit(pageSize);
  }, [apiRole, pageSize, skip]);

  const args = useMemo(() => ({ page: 0, limit, status: 'all' }), [limit]);

  const careHome = useGetCareHomeJobsQuery(args, {
    skip: skip || apiRole !== 'careHome',
  });
  const hospital = useGetHospitalJobsQuery(args, {
    skip: skip || apiRole !== 'hospital',
  });
  const localAuthority = useGetLocalAuthorityJobsQuery(args, {
    skip: skip || apiRole !== 'localAuthority',
  });
  const user = useGetUserJobsQuery(args, {
    skip: skip || apiRole !== 'user',
  });
  const agency = useGetAgencyJobsQuery(args, {
    skip: skip || apiRole !== 'agency',
  });
  const homeCareCompany = useGetHomeCareCompanyJobsQuery(args, {
    skip: skip || apiRole !== 'homeCareCompany',
  });

  const active =
    apiRole === 'hospital'
      ? hospital
      : apiRole === 'localAuthority'
        ? localAuthority
        : apiRole === 'user'
          ? user
          : apiRole === 'agency'
            ? agency
            : apiRole === 'homeCareCompany'
              ? homeCareCompany
              : careHome;

  const jobs = useMemo(() => {
    const list = Array.isArray(active.data?.data) ? active.data.data : EMPTY;
    return list.map(normalizePostedJobForSidebar).filter(Boolean);
  }, [active.data?.data]);

  const totalRaw = active.data?.meta?.totalRecords ?? active.data?.total_length;
  const apiHasTotal = totalRaw !== undefined && totalRaw !== null && totalRaw !== '';
  const total = apiHasTotal ? Number(totalRaw) || 0 : null;
  const hasMore = apiHasTotal ? jobs.length < total : jobs.length >= limit;

  const loadMore = useCallback(() => {
    if (!hasMore || active.isFetching) return;
    setLimit((prev) => prev + pageSize);
  }, [active.isFetching, hasMore, pageSize]);

  return {
    jobs,
    loading: Boolean(active.isLoading),
    loadingMore: Boolean(active.isFetching && jobs.length),
    hasMore,
    loadMore,
    total,
    refetch: active.refetch,
  };
}
