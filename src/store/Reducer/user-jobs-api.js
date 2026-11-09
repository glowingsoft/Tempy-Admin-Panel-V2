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


export const userJobsApi = createApi({
  reducerPath: 'userJobsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['UserJob', 'UserJobType', 'UserJobBid', 'UserBookingCalendar'],

  endpoints: (builder) => ({
    getUserJobs: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '', horizon = '', dateFilter = '', ...filters } = {}) => ({
        url: API_ROUTES.USER_JOBS,
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
        result?.data?.length ? [...result.data.map((job) => ({ type: 'UserJob', id: job.id })), { type: 'UserJob', id: 'LIST' }] : [{ type: 'UserJob', id: 'LIST' }],
    }),


    getUserJobTypes: builder.query({
      query: ({ page = 0, limit = 100, status = 'active', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.USER_JOB_TYPES,
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
        result?.data?.length ? [...result.data.map((item) => ({ type: 'UserJobType', id: item.id })), { type: 'UserJobType', id: 'LIST' }] : [{ type: 'UserJobType', id: 'LIST' }],
    }),

    createUserJobType: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.USER_JOB_TYPES,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'UserJobType', id: 'LIST' }],
    }),

    updateUserJobType: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.USER_JOB_TYPES_BY_ID(id),
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'UserJobType', id },
        { type: 'UserJobType', id: 'LIST' },
      ],
    }),

    deleteUserJobType: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.USER_JOB_TYPES_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'UserJobType', id },
        { type: 'UserJobType', id: 'LIST' },
      ],
    }),

    createUserJob: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.USER_JOBS,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'UserJob', id: 'LIST' },
        { type: 'UserBookingCalendar', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          const raw = response?.data && typeof response.data === 'object' ? response.data : response;
          if (!raw || typeof raw !== 'object') return;

          const mapped = mapCareHomeJobFromApi(raw);
          if (!mapped?.id) return;

          const cachedArgs = userJobsApi.util.selectCachedArgsForQuery(getState(), 'getUserJobs');

          cachedArgs.forEach((originalArgs) => {
            dispatch(
              userJobsApi.util.updateQueryData('getUserJobs', originalArgs, (draft) => {
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

    getUserJobById: builder.query({
      query: (id) => ({
        url: API_ROUTES.USER_JOBS_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response) => {
        const item = response?.data ?? response;
        const record = item?.job || item?.data || item;
        return mapCareHomeJobFromApi(record || {});
      },
      providesTags: (_result, _error, id) => [{ type: 'UserJob', id }],
    }),

    updateUserJob: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.USER_JOBS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'UserJob', id },
        { type: 'UserJob', id: 'LIST' },
      ],
    }),

    deleteUserJob: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.USER_JOBS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'UserJob', id },
        { type: 'UserJob', id: 'LIST' },
      ],
    }),


    updateUserJobAlert: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.USER_JOB_ALERT(id),
        method: 'PUT',
        body,
      }),
      transformResponse: (response) => mapJobAlertMutationResponse(response),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: alert } = await queryFulfilled;
          dispatch(userJobsApi.util.updateQueryData('getUserJobById', id, (draft) => patchJobAlert(draft, alert)));
        } catch {
        }
      },
    }),

    clearUserJobAlert: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.USER_JOB_ALERT(id),
        method: 'DELETE',
      }),
      transformResponse: (response) => mapJobAlertMutationResponse(response),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: alert } = await queryFulfilled;
          dispatch(userJobsApi.util.updateQueryData('getUserJobById', id, (draft) => patchJobAlert(draft, alert)));
        } catch {
        }
      },
    }),

    getUserJobBids: builder.query({
      query: ({ page = 0, limit = 100, status = '', keyword = '', job = '', date = '', dateFilter = '', branch = '' } = {}) => ({
        url: API_ROUTES.USER_JOB_BIDS,
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
        result?.data?.length ? [...result.data.map((bid) => ({ type: 'UserJobBid', id: bid.id })), { type: 'UserJobBid', id: 'LIST' }] : [{ type: 'UserJobBid', id: 'LIST' }],
    }),

    updateUserJobBid: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.USER_BIDS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'UserJobBid', id },
        { type: 'UserJobBid', id: 'LIST' },
        { type: 'UserJob', id: 'LIST' },
      ],
    }),

    createUserBooking: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.USER_BOOKING,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'UserJobBid', id: 'LIST' },
        { type: 'UserJob', id: 'LIST' },
        { type: 'UserBookingCalendar', id: 'LIST' },
      ],
    }),

    cancelUserBooking: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.USER_BOOKING_BY_ID(id),
        method: 'PUT',
        body: { status: 'cancel' },
      }),
      invalidatesTags: [
        { type: 'UserJobBid', id: 'LIST' },
        { type: 'UserJob', id: 'LIST' },
        { type: 'UserBookingCalendar', id: 'LIST' },
      ],
    }),

    getUserBookingCalendar: builder.query({
      query: ({ latitude = 0.1, longitude = 0.1, startDate, endDate, branch = '' } = {}) => {
        const params = {
          latitude,
          longitude,
          startDate,
          endDate,
        };
        if (branch) params.branch = branch;

        return {
          url: API_ROUTES.USER_BOOKING_CALENDAR,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => mapCareHomeBookingCalendarFromApi(response),
      providesTags: [{ type: 'UserBookingCalendar', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUserJobsQuery,
  useGetUserJobByIdQuery,
  useLazyGetUserJobByIdQuery,
  useGetUserJobTypesQuery,
  useCreateUserJobTypeMutation,
  useUpdateUserJobTypeMutation,
  useDeleteUserJobTypeMutation,
  useCreateUserJobMutation,
  useUpdateUserJobMutation,
  useDeleteUserJobMutation,
  useUpdateUserJobAlertMutation,
  useClearUserJobAlertMutation,
  useGetUserJobBidsQuery,
  useUpdateUserJobBidMutation,
  useCreateUserBookingMutation,
  useCancelUserBookingMutation,
  useGetUserBookingCalendarQuery,
} = userJobsApi;
