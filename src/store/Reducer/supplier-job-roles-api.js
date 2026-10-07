import { createApi } from '@reduxjs/toolkit/query/react';

import { getSupplierApiPrefix, extractJobRolesList, mapJobRoleFromApi } from 'src/sections/job-roles/supplier-job-roles-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { agencyAvailabilityApi } from './agency-availability-api';
import { nurseAvailabilityApi } from './nurse-availability-api';
import { homeCareCompanyAvailabilityApi } from './home-care-company-availability-api';

// ----------------------------------------------------------------------

function mapJobRolesResponse(response) {
  return extractJobRolesList(response)
    .map(mapJobRoleFromApi)
    .filter((item) => item.id);
}

/** Saved job types decide the supplier's calendar rows, so refresh that calendar after a save. */
function invalidateSupplierCalendar(dispatch, role) {
  if (role === 'agency') {
    dispatch(agencyAvailabilityApi.util.invalidateTags([{ type: 'AgencyBookingCalendar', id: 'LIST' }]));
  } else if (role === 'homeCareCompany') {
    dispatch(homeCareCompanyAvailabilityApi.util.invalidateTags([{ type: 'HomeCareCompanyBookingCalendar', id: 'LIST' }]));
  } else if (role === 'nurse') {
    dispatch(nurseAvailabilityApi.util.invalidateTags([{ type: 'NurseBookingCalendar', id: 'LIST' }]));
  }
}

export const supplierJobRolesApi = createApi({
  reducerPath: 'supplierJobRolesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['SupplierJobRoleChoices', 'SupplierJobRolesMine'],

  endpoints: (builder) => ({
    /** GET {prefix}/job-roles?status=active — every active job type an admin created. */
    getSupplierJobRoleChoices: builder.query({
      query: ({ role }) => ({
        url: API_ROUTES.SUPPLIER_JOB_ROLES(getSupplierApiPrefix(role)),
        method: 'GET',
        params: { status: 'active' },
      }),
      transformResponse: mapJobRolesResponse,
      providesTags: (_result, _error, { role }) => [{ type: 'SupplierJobRoleChoices', id: role }],
    }),

    /** GET {prefix}/job-roles/mine — the supplier's saved job types. */
    getMySupplierJobRoles: builder.query({
      query: ({ role }) => ({
        url: API_ROUTES.SUPPLIER_JOB_ROLES_MINE(getSupplierApiPrefix(role)),
        method: 'GET',
      }),
      transformResponse: mapJobRolesResponse,
      providesTags: (_result, _error, { role }) => [{ type: 'SupplierJobRolesMine', id: role }],
    }),

    /** PUT {prefix}/job-roles/mine { jobRoles } — replaces the saved list ([] clears it). */
    updateMySupplierJobRoles: builder.mutation({
      query: ({ role, jobRoles = [] }) => ({
        url: API_ROUTES.SUPPLIER_JOB_ROLES_MINE(getSupplierApiPrefix(role)),
        method: 'PUT',
        body: { jobRoles },
      }),
      transformResponse: mapJobRolesResponse,
      async onQueryStarted({ role }, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(supplierJobRolesApi.util.updateQueryData('getMySupplierJobRoles', { role }, () => data));
          invalidateSupplierCalendar(dispatch, role);
        } catch {
          // the form shows the error
        }
      },
    }),
  }),
});

export const { useGetSupplierJobRoleChoicesQuery, useGetMySupplierJobRolesQuery, useUpdateMySupplierJobRolesMutation } = supplierJobRolesApi;
