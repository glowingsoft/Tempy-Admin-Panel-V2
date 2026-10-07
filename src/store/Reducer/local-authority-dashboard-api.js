import { createApi } from '@reduxjs/toolkit/query/react';

import { mapCustomerDashboardFromApi } from 'src/sections/dashboard/dashboard-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { buildScopedDashboardQuery } from '../scoped-dashboard-query';

export const localAuthorityDashboardApi = createApi({
  reducerPath: 'localAuthorityDashboardApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['LocalAuthorityDashboard'],

  endpoints: (builder) => ({
    /** GET /web/local-authority/dashboard */
    getLocalAuthorityDashboard: builder.query({
      query: (arg) => buildScopedDashboardQuery(API_ROUTES.LOCAL_AUTHORITY_DASHBOARD, arg),
      transformResponse: (response) => mapCustomerDashboardFromApi(response),
      providesTags: [{ type: 'LocalAuthorityDashboard', id: 'VIEW' }],
    }),
  }),
});

export const { useGetLocalAuthorityDashboardQuery } = localAuthorityDashboardApi;
