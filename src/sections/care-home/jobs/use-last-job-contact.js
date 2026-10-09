import { useMemo } from 'react';

import { useGetCareHomeJobByIdQuery, useGetCareHomeJobsQuery } from 'src/store/Reducer/care-home-jobs-api';
import { useGetHospitalJobByIdQuery, useGetHospitalJobsQuery } from 'src/store/Reducer/hospital-jobs-api';
import { useGetLocalAuthorityJobByIdQuery, useGetLocalAuthorityJobsQuery } from 'src/store/Reducer/local-authority-jobs-api';
import { useGetUserJobByIdQuery, useGetUserJobsQuery } from 'src/store/Reducer/user-jobs-api';

import { pickJobContactDetails } from './care-home-job-utils';

const LATEST_JOB_ARGS = { page: 0, limit: 1 };

/**
 * Contact and emergency details from the newest job this customer posted.
 * The list row is only an id; the job detail call is what carries the contacts.
 */
export function useLastJobContactDetails(mode, enabled = true) {
  const isHospital = mode === 'hospital';
  const isUser = mode === 'user';
  const isLocalAuthority = mode === 'localAuthority';
  const isCareHome = !isHospital && !isUser && !isLocalAuthority;

  const careHomeList = useGetCareHomeJobsQuery(LATEST_JOB_ARGS, { skip: !enabled || !isCareHome });
  const hospitalList = useGetHospitalJobsQuery(LATEST_JOB_ARGS, { skip: !enabled || !isHospital });
  const userList = useGetUserJobsQuery(LATEST_JOB_ARGS, { skip: !enabled || !isUser });
  const localAuthorityList = useGetLocalAuthorityJobsQuery(LATEST_JOB_ARGS, {
    skip: !enabled || !isLocalAuthority,
  });

  const list = isHospital ? hospitalList : isUser ? userList : isLocalAuthority ? localAuthorityList : careHomeList;
  const latest = list.data?.data?.[0] || null;
  const latestId = String(latest?.id || '').trim();
  const skipDetail = !enabled || !latestId;

  const careHomeJob = useGetCareHomeJobByIdQuery(latestId, { skip: skipDetail || !isCareHome });
  const hospitalJob = useGetHospitalJobByIdQuery(latestId, { skip: skipDetail || !isHospital });
  const userJob = useGetUserJobByIdQuery(latestId, { skip: skipDetail || !isUser });
  const localAuthorityJob = useGetLocalAuthorityJobByIdQuery(latestId, {
    skip: skipDetail || !isLocalAuthority,
  });

  const jobQuery = isHospital ? hospitalJob : isUser ? userJob : isLocalAuthority ? localAuthorityJob : careHomeJob;

  return useMemo(() => {
    if (!enabled || !latestId) return null;
    if (jobQuery.isLoading || jobQuery.isUninitialized) return null;
    return pickJobContactDetails(jobQuery.data) || pickJobContactDetails(latest);
  }, [enabled, jobQuery.data, jobQuery.isLoading, jobQuery.isUninitialized, latest, latestId]);
}
