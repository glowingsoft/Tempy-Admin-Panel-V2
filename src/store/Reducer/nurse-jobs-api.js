import { createApi } from '@reduxjs/toolkit/query/react';

import { mapAgencyJobFromApi, keepSupplierJobsForStatus } from 'src/sections/agency/jobs/agency-job-api-utils';
import { applyJobListFilters } from 'src/sections/care-home/jobs/care-home-job-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/** Search radius when lat/lng are sent (API requires km with coordinates). */
export const NURSE_JOBS_DEFAULT_KM = 1000;

export const nurseJobsApi = createApi({
  reducerPath: 'nurseJobsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['NurseJob'],

  endpoints: (builder) => ({
    getNurseJobs: builder.query({
      query: ({ page = 0, limit = 100, status = '', keyword = '', date = '', dateFilter = '', latitude, longitude, km = NURSE_JOBS_DEFAULT_KM, ...filters } = {}) => {
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
          url: API_ROUTES.NURSE_JOBS,
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
      keepUnusedDataFor: 60,
      providesTags: (result) =>
        result?.data?.length ? [...result.data.map((job) => ({ type: 'NurseJob', id: job.id })), { type: 'NurseJob', id: 'LIST' }] : [{ type: 'NurseJob', id: 'LIST' }],
    }),

    /** GET /web/nurse/job/:id — one job's title, address and poster */
    getNurseJobById: builder.query({
      query: (id) => ({
        url: API_ROUTES.NURSE_JOBS_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response) => mapAgencyJobFromApi(response?.data ?? response ?? {}),
      providesTags: (_r, _e, id) => [{ type: 'NurseJob', id: String(id) }],
    }),
  }),
});

export const { useGetNurseJobsQuery, useGetNurseJobByIdQuery } = nurseJobsApi;
