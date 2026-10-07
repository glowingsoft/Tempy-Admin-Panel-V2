import { createApi } from '@reduxjs/toolkit/query/react';

import { mapAgencyJobFromApi, keepSupplierJobsForStatus } from 'src/sections/agency/jobs/agency-job-api-utils';
import { applyJobListFilters } from 'src/sections/care-home/jobs/care-home-job-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/** Search radius when lat/lng are sent (API requires km with coordinates). */
export const AGENCY_JOBS_DEFAULT_KM = 1000;

export const agencyJobsApi = createApi({
  reducerPath: 'agencyJobsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AgencyJob'],

  endpoints: (builder) => ({
    getAgencyJobs: builder.query({
      query: ({ page = 0, limit = 100, status = '', keyword = '', date = '', dateFilter = '', latitude, longitude, km = AGENCY_JOBS_DEFAULT_KM, ...filters } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;
        if (dateFilter && dateFilter !== 'all') params.dateFilter = dateFilter;
        else if (date && date !== 'all') params.dateFilter = date;
        applyJobListFilters(params, filters);

        const hasLat = latitude != null && latitude !== '' && !Number.isNaN(Number(latitude));
        const hasLng = longitude != null && longitude !== '' && !Number.isNaN(Number(longitude));
        const hasKm = km != null && km !== '' && !Number.isNaN(Number(km)) && Number(km) > 0;

        if (hasLat && hasLng && hasKm) {
          params.latitude = Number(latitude);
          params.longitude = Number(longitude);
          params.km = Number(km);
        }

        return {
          url: API_ROUTES.AGENCY_JOBS,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response, _meta, arg) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        const origin = arg?.latitude != null && arg?.longitude != null ? { latitude: Number(arg.latitude), longitude: Number(arg.longitude) } : null;

        const data = keepSupplierJobsForStatus(
          list.map((item) => mapAgencyJobFromApi(item, { origin })),
          arg?.status
        );

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
          jobsCount: response?.meta?.JobsCount || response?.JobsCount || {},
        };
      },
      providesTags: (result) =>
        result?.data?.length ? [...result.data.map((job) => ({ type: 'AgencyJob', id: job.id })), { type: 'AgencyJob', id: 'LIST' }] : [{ type: 'AgencyJob', id: 'LIST' }],
    }),
  }),
});

export const { useGetAgencyJobsQuery } = agencyJobsApi;
