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

export const careHomeJobsApi = createApi({
  reducerPath: 'careHomeJobsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['CareHomeJob', 'CareHomeJobType', 'CareHomeJobBid', 'CareHomeBookingCalendar'],

  endpoints: (builder) => ({
    /** GET /web/care-home/job */
    getCareHomeJobs: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '', horizon = '', dateFilter = '', ...filters } = {}) => ({
        url: API_ROUTES.CARE_HOME_JOBS,
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
        result?.data?.length ? [...result.data.map((job) => ({ type: 'CareHomeJob', id: job.id })), { type: 'CareHomeJob', id: 'LIST' }] : [{ type: 'CareHomeJob', id: 'LIST' }],
    }),

    /** GET /web/care-home/job/type — JobRole list for Add Job type select */
    getCareHomeJobTypes: builder.query({
      query: ({ page = 0, limit = 100, status = 'active', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.CARE_HOME_JOB_TYPES,
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
          ? [...result.data.map((item) => ({ type: 'CareHomeJobType', id: item.id })), { type: 'CareHomeJobType', id: 'LIST' }]
          : [{ type: 'CareHomeJobType', id: 'LIST' }],
    }),

    /** POST /web/care-home/job */
    createCareHomeJob: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.CARE_HOME_JOBS,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'CareHomeJob', id: 'LIST' },
        { type: 'CareHomeBookingCalendar', id: 'LIST' },
      ],
      async onQueryStarted(_arg, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: response } = await queryFulfilled;
          const raw = response?.data && typeof response.data === 'object' ? response.data : response;
          if (!raw || typeof raw !== 'object') return;

          const mapped = mapCareHomeJobFromApi(raw);
          if (!mapped?.id) return;

          const cachedArgs = careHomeJobsApi.util.selectCachedArgsForQuery(getState(), 'getCareHomeJobs');

          cachedArgs.forEach((originalArgs) => {
            dispatch(
              careHomeJobsApi.util.updateQueryData('getCareHomeJobs', originalArgs, (draft) => {
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
          // create failed — nothing to patch
        }
      },
    }),

    /** GET /web/care-home/job/:id */
    getCareHomeJobById: builder.query({
      query: (id) => ({
        url: API_ROUTES.CARE_HOME_JOBS_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response) => {
        const item = response?.data ?? response;
        const record = item?.job || item?.data || item;
        return mapCareHomeJobFromApi(record || {});
      },
      providesTags: (_result, _error, id) => [{ type: 'CareHomeJob', id }],
    }),

    /** PUT /web/care-home/job/:id */
    updateCareHomeJob: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.CARE_HOME_JOBS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CareHomeJob', id },
        { type: 'CareHomeJob', id: 'LIST' },
      ],
    }),

    /** DELETE /web/care-home/job/:id */
    deleteCareHomeJob: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.CARE_HOME_JOBS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'CareHomeJob', id },
        { type: 'CareHomeJob', id: 'LIST' },
      ],
    }),

    /**
     * PUT /web/care-home/job/:id/alert — shift alert settings
     * Body: { enabled, phoneNumber: { code, number }, hoursBefore, minutesBefore }
     */
    updateCareHomeJobAlert: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.CARE_HOME_JOB_ALERT(id),
        method: 'PUT',
        body,
      }),
      transformResponse: (response) => mapJobAlertFromApi(response?.data ?? response),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          const { data: alert } = await queryFulfilled;
          dispatch(careHomeJobsApi.util.updateQueryData('getCareHomeJobById', id, (draft) => patchJobAlert(draft, alert)));
        } catch {
          // save failed — the form shows the error
        }
      },
    }),

    /** DELETE /web/care-home/job/:id/alert — reset the alert to off */
    clearCareHomeJobAlert: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.CARE_HOME_JOB_ALERT(id),
        method: 'DELETE',
      }),
      transformResponse: (response) => mapJobAlertFromApi(response?.data ?? response),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        try {
          const { data: alert } = await queryFulfilled;
          dispatch(careHomeJobsApi.util.updateQueryData('getCareHomeJobById', id, (draft) => patchJobAlert(draft, alert)));
        } catch {
          // clear failed — the form shows the error
        }
      },
    }),

    /** GET /web/care-home/job/bids */
    getCareHomeJobBids: builder.query({
      query: ({ page = 0, limit = 100, status = '', keyword = '', job = '', date = '', dateFilter = '' } = {}) => ({
        url: API_ROUTES.CARE_HOME_JOB_BIDS,
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
          ? [...result.data.map((bid) => ({ type: 'CareHomeJobBid', id: bid.id })), { type: 'CareHomeJobBid', id: 'LIST' }]
          : [{ type: 'CareHomeJobBid', id: 'LIST' }],
    }),

    /**
     * PUT /web/care-home/job/bids/:id — accept / decline / status update
     * Body: { status: 'accepted' | 'rejected', worker? }
     */
    updateCareHomeJobBid: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.CARE_HOME_JOB_BIDS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CareHomeJobBid', id },
        { type: 'CareHomeJobBid', id: 'LIST' },
        { type: 'CareHomeJob', id: 'LIST' },
      ],
    }),

    /**
     * POST /web/care-home/booking — accept bid + assign worker
     * Body: { bid, worker }
     */
    createCareHomeBooking: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.CARE_HOME_BOOKING,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'CareHomeJobBid', id: 'LIST' },
        { type: 'CareHomeJob', id: 'LIST' },
        { type: 'CareHomeBookingCalendar', id: 'LIST' },
      ],
    }),

    /** PUT /web/care-home/booking/:id { status: 'cancel' } — client cancels a created booking (cancelledByUser). */
    cancelCareHomeBooking: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.CARE_HOME_BOOKING_BY_ID(id),
        method: 'PUT',
        body: { status: 'cancel' },
      }),
      invalidatesTags: [
        { type: 'CareHomeJobBid', id: 'LIST' },
        { type: 'CareHomeJob', id: 'LIST' },
        { type: 'CareHomeBookingCalendar', id: 'LIST' },
      ],
    }),

    /**
     * GET /web/care-home/booking/calender
     * Query: latitude, longitude, startDate, endDate, branch?
     */
    getCareHomeBookingCalendar: builder.query({
      query: ({ latitude = 0.1, longitude = 0.1, startDate, endDate, branch = '' } = {}) => {
        const params = {
          latitude,
          longitude,
          startDate,
          endDate,
        };
        if (branch) params.branch = branch;

        return {
          url: API_ROUTES.CARE_HOME_BOOKING_CALENDAR,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => mapCareHomeBookingCalendarFromApi(response),
      providesTags: [{ type: 'CareHomeBookingCalendar', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetCareHomeJobsQuery,
  useGetCareHomeJobByIdQuery,
  useLazyGetCareHomeJobByIdQuery,
  useGetCareHomeJobTypesQuery,
  useCreateCareHomeJobMutation,
  useUpdateCareHomeJobMutation,
  useDeleteCareHomeJobMutation,
  useUpdateCareHomeJobAlertMutation,
  useClearCareHomeJobAlertMutation,
  useGetCareHomeJobBidsQuery,
  useUpdateCareHomeJobBidMutation,
  useCreateCareHomeBookingMutation,
  useCancelCareHomeBookingMutation,
  useGetCareHomeBookingCalendarQuery,
} = careHomeJobsApi;
