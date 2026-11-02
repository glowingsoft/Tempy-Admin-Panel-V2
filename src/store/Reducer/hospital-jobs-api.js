import { createApi } from '@reduxjs/toolkit/query/react';

import {
  mapCareHomeJobFromApi,
  mapCareHomeJobTypeFromApi,
  keepJobsForStatus,
  buildJobListParams,
  buildJobBidListParams,
} from 'src/sections/care-home/jobs/care-home-job-api-utils';
import { mapCareHomeJobBidFromApi, keepJobBidsForStatus } from 'src/sections/care-home/jobs/care-home-job-bid-api-utils';
import { mapCareHomeBookingCalendarFromApi } from 'src/sections/care-home/shifts/care-home-booking-calendar-api-utils';
import { mapJobAlertMutationResponse, patchJobAlert } from 'src/sections/care-home/jobs/job-alert-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const hospitalJobsApi = createApi({
  reducerPath: 'hospitalJobsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['HospitalJob', 'HospitalJobType', 'HospitalJobBid', 'HospitalBookingCalendar'],

  endpoints: (builder) => ({
    getHospitalJobs: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '', horizon = '', dateFilter = '', ...filters } = {}) => ({
        url: API_ROUTES.HOSPITAL_JOBS,
        method: 'GET',
        params: buildJobListParams({ page, limit, status, keyword, horizon, dateFilter, ...filters }),
      }),
      transformResponse: (response, _meta, arg) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        const data = keepJobsForStatus(list.map(mapCareHomeJobFromApi), arg?.status);

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
          jobsCount: response?.meta?.JobsCount || {},
        };
      },
      providesTags: (result) =>
        result?.data?.length ? [...result.data.map((job) => ({ type: 'HospitalJob', id: job.id })), { type: 'HospitalJob', id: 'LIST' }] : [{ type: 'HospitalJob', id: 'LIST' }],
    }),

    getHospitalJobTypes: builder.query({
      query: ({ page = 0, limit = 100, status = 'active', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.HOSPITAL_JOB_TYPES,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        const data = list.map(mapCareHomeJobTypeFromApi).filter((item) => item.id && item.status !== 'deleted' && item.status !== 'delete');

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
          jobRoleCount: response?.meta?.JobRoleCount || {},
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [...result.data.map((item) => ({ type: 'HospitalJobType', id: item.id })), { type: 'HospitalJobType', id: 'LIST' }]
          : [{ type: 'HospitalJobType', id: 'LIST' }],
    }),

    createHospitalJobType: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.HOSPITAL_JOB_TYPES,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'HospitalJobType', id: 'LIST' }],
    }),

    updateHospitalJobType: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.HOSPITAL_JOB_TYPES_BY_ID(id),
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'HospitalJobType', id },
        { type: 'HospitalJobType', id: 'LIST' },
      ],
    }),

    deleteHospitalJobType: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.HOSPITAL_JOB_TYPES_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'HospitalJobType', id },
        { type: 'HospitalJobType', id: 'LIST' },
      ],
    }),

    createHospitalJob: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.HOSPITAL_JOBS,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'HospitalJob', id: 'LIST' },
        { type: 'HospitalBookingCalendar', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          const raw = response?.data && typeof response.data === 'object' ? response.data : response;
          if (!raw || typeof raw !== 'object') return;

          const mapped = mapCareHomeJobFromApi(raw);
          if (!mapped?.id) return;

          const cachedArgs = hospitalJobsApi.util.selectCachedArgsForQuery(getState(), 'getHospitalJobs');

          cachedArgs.forEach((originalArgs) => {
            dispatch(
              hospitalJobsApi.util.updateQueryData('getHospitalJobs', originalArgs, (draft) => {
                if (!draft?.data) return;
                if (draft.data.some((job) => job.id === mapped.id)) return;
                draft.data.unshift(mapped);
                draft.total_length = draft.data.length;
                if (draft.jobsCount) {
                  draft.jobsCount.total = (Number(draft.jobsCount.total) || 0) + 1;
                  if (mapped.status === 'active') {
                    draft.jobsCount.active = (Number(draft.jobsCount.active) || 0) + 1;
                  }
                }
              })
            );
          });
        } catch {
        }
      },
    }),

    getHospitalJobById: builder.query({
      query: (id) => ({
        url: API_ROUTES.HOSPITAL_JOBS_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response) => {
        const item = response?.data ?? response;
        const record = item?.job || item?.data || item;
        return mapCareHomeJobFromApi(record || {});
      },
      providesTags: (_result, _error, id) => [{ type: 'HospitalJob', id }],
    }),

    updateHospitalJob: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.HOSPITAL_JOBS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'HospitalJob', id },
        { type: 'HospitalJob', id: 'LIST' },
      ],
    }),

    deleteHospitalJob: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.HOSPITAL_JOBS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'HospitalJob', id },
        { type: 'HospitalJob', id: 'LIST' },
      ],
    }),

    updateHospitalJobAlert: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.HOSPITAL_JOB_ALERT(id),
        method: 'PUT',
        body,
      }),
      transformResponse: (response) => mapJobAlertMutationResponse(response),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: alert } = await queryFulfilled;
          dispatch(hospitalJobsApi.util.updateQueryData('getHospitalJobById', id, (draft) => patchJobAlert(draft, alert)));
        } catch {
        }
      },
    }),

    clearHospitalJobAlert: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.HOSPITAL_JOB_ALERT(id),
        method: 'DELETE',
      }),
      transformResponse: (response) => mapJobAlertMutationResponse(response),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: alert } = await queryFulfilled;
          dispatch(hospitalJobsApi.util.updateQueryData('getHospitalJobById', id, (draft) => patchJobAlert(draft, alert)));
        } catch {
        }
      },
    }),

    getHospitalJobBids: builder.query({
      query: ({ page = 0, limit = 100, status = '', keyword = '', job = '', date = '', dateFilter = '', branch = '' } = {}) => ({
        url: API_ROUTES.HOSPITAL_JOB_BIDS,
        method: 'GET',
        params: buildJobBidListParams({ page, limit, status, keyword, job, date, dateFilter, branch }),
      }),
      transformResponse: (response, _meta, arg) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        const data = keepJobBidsForStatus(list.map(mapCareHomeJobBidFromApi), arg?.status);

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
          bidCount: response?.meta?.BidCount || {},
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [...result.data.map((bid) => ({ type: 'HospitalJobBid', id: bid.id })), { type: 'HospitalJobBid', id: 'LIST' }]
          : [{ type: 'HospitalJobBid', id: 'LIST' }],
    }),

    updateHospitalJobBid: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.HOSPITAL_JOB_BIDS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'HospitalJobBid', id },
        { type: 'HospitalJobBid', id: 'LIST' },
        { type: 'HospitalJob', id: 'LIST' },
      ],
    }),

    createHospitalBooking: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.HOSPITAL_BOOKING,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'HospitalJobBid', id: 'LIST' },
        { type: 'HospitalJob', id: 'LIST' },
        { type: 'HospitalBookingCalendar', id: 'LIST' },
      ],
    }),

    getHospitalBookingCalendar: builder.query({
      query: ({ latitude = 0.1, longitude = 0.1, startDate, endDate, branch = '' } = {}) => {
        const params = {
          latitude,
          longitude,
          startDate,
          endDate,
        };
        if (branch) params.branch = branch;

        return {
          url: API_ROUTES.HOSPITAL_BOOKING_CALENDAR,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => mapCareHomeBookingCalendarFromApi(response),
      providesTags: [{ type: 'HospitalBookingCalendar', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetHospitalJobsQuery,
  useGetHospitalJobByIdQuery,
  useLazyGetHospitalJobByIdQuery,
  useGetHospitalJobTypesQuery,
  useCreateHospitalJobTypeMutation,
  useUpdateHospitalJobTypeMutation,
  useDeleteHospitalJobTypeMutation,
  useCreateHospitalJobMutation,
  useUpdateHospitalJobMutation,
  useDeleteHospitalJobMutation,
  useUpdateHospitalJobAlertMutation,
  useClearHospitalJobAlertMutation,
  useGetHospitalJobBidsQuery,
  useUpdateHospitalJobBidMutation,
  useCreateHospitalBookingMutation,
  useGetHospitalBookingCalendarQuery,
} = hospitalJobsApi;
