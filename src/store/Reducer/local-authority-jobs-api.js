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
import { mapJobAlertFromApi, patchJobAlert } from 'src/sections/care-home/jobs/job-alert-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/**
 * Local authority dashboard jobs / bids — same shape as care-home.
 * POST/GET /web/local-authority/job
 * PUT/DELETE /web/local-authority/job/:id
 * GET /web/local-authority/job/type
 * GET /web/local-authority/job/bids
 * PUT /web/local-authority/job/bids/:id
 * GET /web/local-authority/booking/calender
 */
export const localAuthorityJobsApi = createApi({
  reducerPath: 'localAuthorityJobsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['LocalAuthorityJob', 'LocalAuthorityJobType', 'LocalAuthorityJobBid', 'LocalAuthorityBookingCalendar'],

  endpoints: (builder) => ({
    /** GET /web/local-authority/job */
    getLocalAuthorityJobs: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '', horizon = '', dateFilter = '', ...filters } = {}) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_JOBS,
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
        result?.data?.length
          ? [...result.data.map((job) => ({ type: 'LocalAuthorityJob', id: job.id })), { type: 'LocalAuthorityJob', id: 'LIST' }]
          : [{ type: 'LocalAuthorityJob', id: 'LIST' }],
    }),

    /** GET /web/local-authority/job/type */
    getLocalAuthorityJobTypes: builder.query({
      query: ({ page = 0, limit = 100, status = 'active', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.LOCAL_AUTHORITY_JOB_TYPES,
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
          ? [...result.data.map((item) => ({ type: 'LocalAuthorityJobType', id: item.id })), { type: 'LocalAuthorityJobType', id: 'LIST' }]
          : [{ type: 'LocalAuthorityJobType', id: 'LIST' }],
    }),

    /** POST /web/local-authority/job */
    createLocalAuthorityJob: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_JOBS,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'LocalAuthorityJob', id: 'LIST' },
        { type: 'LocalAuthorityBookingCalendar', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          const raw = response?.data && typeof response.data === 'object' ? response.data : response;
          if (!raw || typeof raw !== 'object') return;

          const mapped = mapCareHomeJobFromApi(raw);
          if (!mapped?.id) return;

          const cachedArgs = localAuthorityJobsApi.util.selectCachedArgsForQuery(getState(), 'getLocalAuthorityJobs');

          cachedArgs.forEach((originalArgs) => {
            dispatch(
              localAuthorityJobsApi.util.updateQueryData('getLocalAuthorityJobs', originalArgs, (draft) => {
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
          // create failed
        }
      },
    }),

    /** GET /web/local-authority/job/:id */
    getLocalAuthorityJobById: builder.query({
      query: (id) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_JOBS_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response) => {
        const item = response?.data ?? response;
        const record = item?.job || item?.data || item;
        return mapCareHomeJobFromApi(record || {});
      },
      providesTags: (_result, _error, id) => [{ type: 'LocalAuthorityJob', id }],
    }),

    /** PUT /web/local-authority/job/:id */
    updateLocalAuthorityJob: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_JOBS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LocalAuthorityJob', id },
        { type: 'LocalAuthorityJob', id: 'LIST' },
      ],
    }),

    /** DELETE /web/local-authority/job/:id */
    deleteLocalAuthorityJob: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_JOBS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'LocalAuthorityJob', id },
        { type: 'LocalAuthorityJob', id: 'LIST' },
      ],
    }),

    /**
     * PUT /web/local-authority/job/:id/alert — shift alert settings
     * Body: { enabled, phoneNumber: { code, number }, hoursBefore, minutesBefore }
     */
    updateLocalAuthorityJobAlert: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_JOB_ALERT(id),
        method: 'PUT',
        body,
      }),
      transformResponse: (response) => mapJobAlertFromApi(response?.data ?? response),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: alert } = await queryFulfilled;
          dispatch(localAuthorityJobsApi.util.updateQueryData('getLocalAuthorityJobById', id, (draft) => patchJobAlert(draft, alert)));
        } catch {
          // save failed — the form shows the error
        }
      },
    }),

    /** DELETE /web/local-authority/job/:id/alert — reset the alert to off */
    clearLocalAuthorityJobAlert: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_JOB_ALERT(id),
        method: 'DELETE',
      }),
      transformResponse: (response) => mapJobAlertFromApi(response?.data ?? response),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: alert } = await queryFulfilled;
          dispatch(localAuthorityJobsApi.util.updateQueryData('getLocalAuthorityJobById', id, (draft) => patchJobAlert(draft, alert)));
        } catch {
          // clear failed — the form shows the error
        }
      },
    }),

    /** GET /web/local-authority/job/bids */
    getLocalAuthorityJobBids: builder.query({
      query: ({ page = 0, limit = 100, status = '', keyword = '', job = '', date = '', dateFilter = '' } = {}) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_JOB_BIDS,
        method: 'GET',
        params: buildJobBidListParams({ page, limit, status, keyword, job, date, dateFilter }),
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
          ? [...result.data.map((bid) => ({ type: 'LocalAuthorityJobBid', id: bid.id })), { type: 'LocalAuthorityJobBid', id: 'LIST' }]
          : [{ type: 'LocalAuthorityJobBid', id: 'LIST' }],
    }),

    /** PUT /web/local-authority/job/bids/:id — accept / reject / status */
    updateLocalAuthorityJobBid: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_JOB_BIDS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'LocalAuthorityJobBid', id },
        { type: 'LocalAuthorityJobBid', id: 'LIST' },
        { type: 'LocalAuthorityJob', id: 'LIST' },
      ],
    }),

    /** POST /web/local-authority/booking — accept bid + create booking { bid, worker } */
    createLocalAuthorityBooking: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_BOOKING,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'LocalAuthorityJobBid', id: 'LIST' },
        { type: 'LocalAuthorityJob', id: 'LIST' },
        { type: 'LocalAuthorityBookingCalendar', id: 'LIST' },
      ],
    }),

    /**
     * GET /web/local-authority/booking/calender
     * Query: latitude, longitude, startDate, endDate, branch?
     */
    getLocalAuthorityBookingCalendar: builder.query({
      query: ({ latitude = 0.1, longitude = 0.1, startDate, endDate, branch = '' } = {}) => {
        const params = {
          latitude,
          longitude,
          startDate,
          endDate,
        };
        if (branch) params.branch = branch;

        return {
          url: API_ROUTES.LOCAL_AUTHORITY_BOOKING_CALENDAR,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => mapCareHomeBookingCalendarFromApi(response),
      providesTags: [{ type: 'LocalAuthorityBookingCalendar', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetLocalAuthorityJobsQuery,
  useGetLocalAuthorityJobByIdQuery,
  useLazyGetLocalAuthorityJobByIdQuery,
  useGetLocalAuthorityJobTypesQuery,
  useCreateLocalAuthorityJobMutation,
  useUpdateLocalAuthorityJobMutation,
  useDeleteLocalAuthorityJobMutation,
  useUpdateLocalAuthorityJobAlertMutation,
  useClearLocalAuthorityJobAlertMutation,
  useGetLocalAuthorityJobBidsQuery,
  useUpdateLocalAuthorityJobBidMutation,
  useCreateLocalAuthorityBookingMutation,
  useGetLocalAuthorityBookingCalendarQuery,
} = localAuthorityJobsApi;
