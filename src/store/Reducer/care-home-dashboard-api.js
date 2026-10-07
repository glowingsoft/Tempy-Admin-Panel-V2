import { createApi } from '@reduxjs/toolkit/query/react';

import { mapCareHomeDashboardFromApi } from 'src/sections/care-home/dashboard/care-home-dashboard-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { buildScopedDashboardQuery } from '../scoped-dashboard-query';

export const careHomeDashboardApi = createApi({
  reducerPath: 'careHomeDashboardApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['CareHomeDashboard'],

  endpoints: (builder) => ({
    /** GET /web/care-home/dashboard */
    getCareHomeDashboard: builder.query({
      query: (arg) => buildScopedDashboardQuery(API_ROUTES.CARE_HOME_DASHBOARD, arg),
      transformResponse: (response) => mapCareHomeDashboardFromApi(response),
      providesTags: [{ type: 'CareHomeDashboard', id: 'VIEW' }],
    }),
  }),
});

export const { useGetCareHomeDashboardQuery } = careHomeDashboardApi;
