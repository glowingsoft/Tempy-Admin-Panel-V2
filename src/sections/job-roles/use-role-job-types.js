import { useGetUserJobTypesQuery } from 'src/store/Reducer/user-jobs-api';
import { useGetCareHomeJobTypesQuery } from 'src/store/Reducer/care-home-jobs-api';
import { useGetHospitalJobTypesQuery } from 'src/store/Reducer/hospital-jobs-api';
import { useGetSupplierJobRoleChoicesQuery } from 'src/store/Reducer/supplier-job-roles-api';
import { useGetLocalAuthorityJobTypesQuery } from 'src/store/Reducer/local-authority-jobs-api';

import { isSupplierRole } from './supplier-job-roles-utils';

// ----------------------------------------------------------------------

const DEFAULT_ARGS = { page: 0, limit: 100, status: 'active' };

/**
 * Job types for the signed-in role, from that role's own API prefix:
 * - careHome / hospital / localAuthority / user → GET /web/{role}/job/type
 * - agency / homeCareCompany / nurse → GET /web/{role}/job-roles?status=active
 *
 * Returns `{ data: [{ id, title, label, department, status }], isLoading, isFetching, isError, refetch }`.
 * Unknown roles fall back to care home.
 */
export function useRoleJobTypes(role = 'careHome', { args = DEFAULT_ARGS, skip = false, ...options } = {}) {
  const isSupplier = isSupplierRole(role);
  const jobTypeRole = isSupplier || ['hospital', 'localAuthority', 'user'].includes(role) ? role : 'careHome';

  const careHome = useGetCareHomeJobTypesQuery(args, { ...options, skip: skip || jobTypeRole !== 'careHome' });
  const hospital = useGetHospitalJobTypesQuery(args, { ...options, skip: skip || jobTypeRole !== 'hospital' });
  const localAuthority = useGetLocalAuthorityJobTypesQuery(args, {
    ...options,
    skip: skip || jobTypeRole !== 'localAuthority',
  });
  const user = useGetUserJobTypesQuery(args, { ...options, skip: skip || jobTypeRole !== 'user' });
  const supplier = useGetSupplierJobRoleChoicesQuery({ role }, { ...options, skip: skip || !isSupplier });

  const query = isSupplier ? supplier : { careHome, hospital, localAuthority, user }[jobTypeRole];
  // Supplier choices come back as a bare array; the /job/type endpoints wrap theirs in `{ data }`.
  const list = isSupplier ? query.data : query.data?.data;

  return {
    data: Array.isArray(list) ? list : EMPTY,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    refetch: query.refetch,
  };
}

const EMPTY = [];
