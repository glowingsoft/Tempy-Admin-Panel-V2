import { createApi } from '@reduxjs/toolkit/query/react';

import { mapCareHomeJobTypeFromApi } from 'src/sections/care-home/jobs/care-home-job-api-utils';
import { mapAgencyAvailabilityFromApi } from 'src/sections/agency/shifts/agency-availability-api-utils';
import { mapAgencyBookingCalendarFromApi } from 'src/sections/agency/shifts/agency-booking-calendar-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/**
 * Home care company shifts — routes match HCC login (`/web/home-care-company/...`):
 * - GET /web/home-care-company/booking/calender → rota grid (teams + shifts + weather)
 * - GET/POST /web/home-care-company/availability + PUT/DELETE :id → leave/busy CRUD
 * - GET /web/home-care-company/job/type → Add Shift job types
 */
export const homeCareCompanyAvailabilityApi = createApi({
  reducerPath: 'homeCareCompanyAvailabilityApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: [
    'HomeCareCompanyAvailability',
    'HomeCareCompanyJobType',
    'HomeCareCompanyBookingCalendar',
  ],

  endpoints: (builder) => ({
    /**
     * GET /web/home-care-company/booking/calender
     * Query: latitude, longitude, startDate, endDate, branch?
     */
    getHomeCareCompanyBookingCalendar: builder.query({
      query: ({
        latitude = 0.1,
        longitude = 0.1,
        startDate,
        endDate,
        branch = '',
      } = {}) => {
        const params = {
          latitude,
          longitude,
          startDate,
          endDate,
        };
        if (branch) params.branch = branch;

        return {
          url: API_ROUTES.HOME_CARE_COMPANY_BOOKING_CALENDAR,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => mapAgencyBookingCalendarFromApi(response),
      providesTags: [{ type: 'HomeCareCompanyBookingCalendar', id: 'LIST' }],
    }),

    /** GET /web/home-care-company/availability */
    getHomeCareCompanyAvailability: builder.query({
      query: ({
        page = 0,
        limit = 200,
        status = '',
        keyword = '',
        startDate = '',
        endDate = '',
      } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        return {
          url: API_ROUTES.HOME_CARE_COMPANY_AVAILABILITY,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const raw = response?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.docs)
            ? raw.docs
            : Array.isArray(raw?.items)
              ? raw.items
              : Array.isArray(raw?.results)
                ? raw.results
                : Array.isArray(response)
                  ? response
                  : [];
        const data = list
          .map(mapAgencyAvailabilityFromApi)
          .filter((item) => item.id && item.apiStatus !== 'deleted' && item.apiStatus !== 'delete');

        return {
          data,
          meta: response?.meta || raw?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? raw?.totalRecords ?? data.length,
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({
                type: 'HomeCareCompanyAvailability',
                id: item.id,
              })),
              { type: 'HomeCareCompanyAvailability', id: 'LIST' },
            ]
          : [{ type: 'HomeCareCompanyAvailability', id: 'LIST' }],
    }),

    /** GET /web/home-care-company/job/type */
    getHomeCareCompanyJobTypes: builder.query({
      query: ({ page = 0, limit = 100, status = 'active', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.HOME_CARE_COMPANY_JOB_TYPES,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const raw = response?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.docs)
            ? raw.docs
            : Array.isArray(raw?.items)
              ? raw.items
              : Array.isArray(response)
                ? response
                : [];
        const data = list
          .map(mapCareHomeJobTypeFromApi)
          .filter((item) => item.id && item.status !== 'deleted' && item.status !== 'delete');

        return {
          data,
          meta: response?.meta || raw?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? raw?.totalRecords ?? data.length,
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'HomeCareCompanyJobType', id: item.id })),
              { type: 'HomeCareCompanyJobType', id: 'LIST' },
            ]
          : [{ type: 'HomeCareCompanyJobType', id: 'LIST' }],
    }),

    /** POST /web/home-care-company/availability */
    createHomeCareCompanyAvailability: builder.mutation({
      query: (payload = {}) => {
        const status = String(payload?.status || 'available').trim() || 'available';

        const body = {
          status,
          startDateTime: payload.startDateTime,
          endDateTime: payload.endDateTime,
        };

        if (payload?.user) body.user = payload.user;
        if (payload?.staff) body.staff = payload.staff;
        if (payload?.worker) body.worker = payload.worker;
        if (payload?.jobType) body.jobType = payload.jobType;
        if (payload?.notes) body.notes = payload.notes;
        if (payload?.note) body.note = payload.note;

        return {
          url: API_ROUTES.HOME_CARE_COMPANY_AVAILABILITY,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        };
      },
      invalidatesTags: [
        { type: 'HomeCareCompanyAvailability', id: 'LIST' },
        { type: 'HomeCareCompanyBookingCalendar', id: 'LIST' },
      ],
    }),

    /** PUT /web/home-care-company/availability/:id */
    updateHomeCareCompanyAvailability: builder.mutation({
      query: ({ id, ...payload } = {}) => {
        const status = String(payload?.status || 'available').trim() || 'available';

        const body = {
          status,
          startDateTime: payload.startDateTime,
          endDateTime: payload.endDateTime,
        };

        if (payload?.user) body.user = payload.user;
        if (payload?.staff) body.staff = payload.staff;
        if (payload?.worker) body.worker = payload.worker;
        if (payload?.jobType) body.jobType = payload.jobType;
        if (payload?.notes) body.notes = payload.notes;
        if (payload?.note) body.note = payload.note;

        return {
          url: API_ROUTES.HOME_CARE_COMPANY_AVAILABILITY_BY_ID(id),
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'HomeCareCompanyAvailability', id },
        { type: 'HomeCareCompanyAvailability', id: 'LIST' },
        { type: 'HomeCareCompanyBookingCalendar', id: 'LIST' },
      ],
    }),

    /**
     * POST /web/home-care-company/booking — assign worker to an accepted bid
     * Body: { bid, worker }
     */
    createHomeCareCompanyBooking: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_BOOKING,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [
        { type: 'HomeCareCompanyBookingCalendar', id: 'LIST' },
        { type: 'HomeCareCompanyAvailability', id: 'LIST' },
      ],
    }),

    /** DELETE /web/home-care-company/availability/:id */
    deleteHomeCareCompanyAvailability: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_AVAILABILITY_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'HomeCareCompanyAvailability', id },
        { type: 'HomeCareCompanyAvailability', id: 'LIST' },
        { type: 'HomeCareCompanyBookingCalendar', id: 'LIST' },
      ],
    }),

    /** PUT /web/home-care-company/booking/:id { status: 'cancel' } — supplier withdraws a pending / active booking (cancelledByEmployer). */
    cancelHomeCareCompanyBooking: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_BOOKING_BY_ID(id),
        method: 'PUT',
        body: { status: 'cancel' },
      }),
      invalidatesTags: [
        { type: 'HomeCareCompanyBookingCalendar', id: 'LIST' },
        { type: 'HomeCareCompanyAvailability', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHomeCareCompanyBookingCalendarQuery,
  useGetHomeCareCompanyAvailabilityQuery,
  useGetHomeCareCompanyJobTypesQuery,
  useCreateHomeCareCompanyAvailabilityMutation,
  useUpdateHomeCareCompanyAvailabilityMutation,
  useDeleteHomeCareCompanyAvailabilityMutation,
  useCreateHomeCareCompanyBookingMutation,
  useCancelHomeCareCompanyBookingMutation,
} = homeCareCompanyAvailabilityApi;
