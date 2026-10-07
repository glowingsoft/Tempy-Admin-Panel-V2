import { createApi } from '@reduxjs/toolkit/query/react';

import { mapCustomerDashboardFromApi } from 'src/sections/dashboard/dashboard-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { buildScopedDashboardQuery } from '../scoped-dashboard-query';

export const userDashboardApi = createApi({
  reducerPath: 'userDashboardApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['UserDashboard'],

  endpoints: (builder) => ({
    /** GET /web/user/dashboard */
    getUserDashboard: builder.query({
      query: (arg) => buildScopedDashboardQuery(API_ROUTES.USER_DASHBOARD, arg),
      transformResponse: (response) => mapCustomerDashboardFromApi(response),
      providesTags: [{ type: 'UserDashboard', id: 'VIEW' }],
    }),
  }),
});

export const { useGetUserDashboardQuery } = userDashboardApi;
