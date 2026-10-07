import { createApi } from '@reduxjs/toolkit/query/react';

import { mapAdminDashboardFromApi } from 'src/sections/admin/dashboard/admin-dashboard-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const adminDashboardApi = createApi({
  reducerPath: 'adminDashboardApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AdminDashboard'],

  endpoints: (builder) => ({
    /** GET /admin/dashboard */
    getAdminDashboard: builder.query({
      query: () => ({
        url: API_ROUTES.ADMIN_DASHBOARD,
        method: 'GET',
      }),
      transformResponse: (response) => mapAdminDashboardFromApi(response),
      providesTags: [{ type: 'AdminDashboard', id: 'VIEW' }],
    }),
  }),
});

export const { useGetAdminDashboardQuery } = adminDashboardApi;
