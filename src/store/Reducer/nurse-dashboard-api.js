import { createApi } from '@reduxjs/toolkit/query/react';

import { mapNurseDashboardFromApi } from 'src/sections/dashboard/dashboard-api-utils';
import { extractCancellationStats } from 'src/sections/staff-member/jobs/staff-member-cancellation-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { buildScopedDashboardQuery } from '../scoped-dashboard-query';

export const nurseDashboardApi = createApi({
  reducerPath: 'nurseDashboardApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['NurseDashboard'],

  endpoints: (builder) => ({
    /** GET /web/nurse/dashboard */
    getNurseDashboard: builder.query({
      query: (arg) => buildScopedDashboardQuery(API_ROUTES.NURSE_DASHBOARD, arg),
      transformResponse: (response) => {
        const mapped = mapNurseDashboardFromApi(response);
        return {
          ...mapped,
          cancellationStats: extractCancellationStats(response, response?.data),
        };
      },
      providesTags: [{ type: 'NurseDashboard', id: 'VIEW' }],
    }),
  }),
});

export const { useGetNurseDashboardQuery } = nurseDashboardApi;
