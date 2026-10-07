import { createApi } from '@reduxjs/toolkit/query/react';

import { mapSupplierDashboardFromApi } from 'src/sections/dashboard/dashboard-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { buildScopedDashboardQuery } from '../scoped-dashboard-query';

export const homeCareCompanyDashboardApi = createApi({
  reducerPath: 'homeCareCompanyDashboardApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['HomeCareCompanyDashboard'],

  endpoints: (builder) => ({
    /** GET /web/home-care-company/dashboard */
    getHomeCareCompanyDashboard: builder.query({
      query: (arg) => buildScopedDashboardQuery(API_ROUTES.HOME_CARE_COMPANY_DASHBOARD, arg),
      transformResponse: (response) => mapSupplierDashboardFromApi(response),
      providesTags: [{ type: 'HomeCareCompanyDashboard', id: 'VIEW' }],
    }),
  }),
});

export const { useGetHomeCareCompanyDashboardQuery } = homeCareCompanyDashboardApi;
