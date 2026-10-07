import { createApi } from '@reduxjs/toolkit/query/react';

import { mapCustomerDashboardFromApi } from 'src/sections/dashboard/dashboard-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { buildScopedDashboardQuery } from '../scoped-dashboard-query';

export const hospitalDashboardApi = createApi({
  reducerPath: 'hospitalDashboardApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['HospitalDashboard'],

  endpoints: (builder) => ({
    /** GET /web/hospital/dashboard */
    getHospitalDashboard: builder.query({
      query: (arg) => buildScopedDashboardQuery(API_ROUTES.HOSPITAL_DASHBOARD, arg),
      transformResponse: (response) => mapCustomerDashboardFromApi(response),
      providesTags: [{ type: 'HospitalDashboard', id: 'VIEW' }],
    }),
  }),
});

export const { useGetHospitalDashboardQuery } = hospitalDashboardApi;
