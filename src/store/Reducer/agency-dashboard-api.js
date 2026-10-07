import { createApi } from '@reduxjs/toolkit/query/react';

import { mapAgencyDashboardFromApi } from 'src/sections/dashboard/dashboard-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { buildScopedDashboardQuery } from '../scoped-dashboard-query';

export const agencyDashboardApi = createApi({
  reducerPath: 'agencyDashboardApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AgencyDashboard'],

  endpoints: (builder) => ({
    /** GET /web/agency/dashboard */
    getAgencyDashboard: builder.query({
      query: (arg) => buildScopedDashboardQuery(API_ROUTES.AGENCY_DASHBOARD, arg),
      transformResponse: (response) => mapAgencyDashboardFromApi(response),
      providesTags: [{ type: 'AgencyDashboard', id: 'VIEW' }],
    }),
  }),
});

export const { useGetAgencyDashboardQuery } = agencyDashboardApi;
