import { useMemo } from 'react';

import { useGetCareHomeJobsQuery } from 'src/store/Reducer/care-home-jobs-api';
import { useGetHospitalJobsQuery } from 'src/store/Reducer/hospital-jobs-api';
import { useGetLocalAuthorityJobsQuery } from 'src/store/Reducer/local-authority-jobs-api';
import { useGetUserJobsQuery } from 'src/store/Reducer/user-jobs-api';
import { useGetAgencyJobsQuery } from 'src/store/Reducer/agency-jobs-api';
import { useGetHomeCareCompanyJobsQuery } from 'src/store/Reducer/home-care-company-jobs-api';

import { normalizePostedJobForSidebar } from './posted-jobs-schedule-utils';

const EMPTY = [];

/**
 * Posted / available jobs for employer schedule left panel.
 * careHome | hospital | localAuthority | user → company-posted jobs
 * agency | homeCareCompany → jobs list for that dashboard
 */
export function useEmployerPostedJobs(apiRole = 'careHome', { skip = false, limit = 50 } = {}) {
  const args = { page: 0, limit, status: 'all' };

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

  return {
    jobs,
    loading: Boolean(active.isLoading || active.isFetching),
    refetch: active.refetch,
  };
}
