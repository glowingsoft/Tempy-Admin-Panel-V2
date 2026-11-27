import { createApi } from '@reduxjs/toolkit/query/react';

import { mapCareHomeJobTypeFromApi } from 'src/sections/care-home/jobs/care-home-job-api-utils';
import {
  buildAvailabilityRulePayload,
  clampAvailabilityCalendarRange,
  transformAvailabilityListResponse,
  transformAvailabilityRulesResponse,
} from 'src/sections/agency/shifts/agency-availability-api-utils';
import { mapAgencyBookingCalendarFromApi } from 'src/sections/agency/shifts/agency-booking-calendar-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/**
 * Agency shifts:
 * - GET /web/agency/booking/calender → rota grid (teams + shifts + weather)
 * - GET/POST /web/agency/availability + PUT/DELETE :id → leave/busy/shift CRUD
 * - GET /web/agency/availability/calendar → diary (one-offs + repeating rules; max 92 days)
 * - GET/POST /web/agency/availability/rules + PUT/DELETE :id → repeating availability
 * - GET /web/agency/job/type → Add Shift job types
 */
export const agencyAvailabilityApi = createApi({
  reducerPath: 'agencyAvailabilityApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: [
    'AgencyAvailability',
    'AgencyAvailabilityCalendar',
    'AgencyAvailabilityRules',
    'AgencyJobType',
    'AgencyBookingCalendar',
  ],

  endpoints: (builder) => ({
    /**
     * GET /web/agency/booking/calender
     * Query: latitude, longitude, startDate, endDate, branch?
     */
    getAgencyBookingCalendar: builder.query({
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
          url: API_ROUTES.AGENCY_BOOKING_CALENDAR,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => mapAgencyBookingCalendarFromApi(response),
      providesTags: [{ type: 'AgencyBookingCalendar', id: 'LIST' }],
    }),

    /** GET /web/agency/availability */
    getAgencyAvailability: builder.query({
      query: ({ page = 0, limit = 200, status = '', keyword = '', startDate = '', endDate = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        return {
          url: API_ROUTES.AGENCY_AVAILABILITY,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => transformAvailabilityListResponse(response),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'AgencyAvailability', id: item.id })),
              { type: 'AgencyAvailability', id: 'LIST' },
            ]
          : [{ type: 'AgencyAvailability', id: 'LIST' }],
    }),

    /**
     * GET /web/agency/availability/calendar
     * Includes one-offs + expanded repeating rules. Range clamped to max 92 days.
     */
    getAgencyAvailabilityCalendar: builder.query({
      query: ({ startDate = '', endDate = '', userId = '' } = {}) => {
        const range = clampAvailabilityCalendarRange(startDate, endDate);
        const params = {
          startDate: range.startDate,
          endDate: range.endDate,
        };
        if (userId) params.userId = String(userId).trim();

        return {
          url: API_ROUTES.AGENCY_AVAILABILITY_CALENDAR,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => transformAvailabilityListResponse(response),
      providesTags: [{ type: 'AgencyAvailabilityCalendar', id: 'LIST' }],
    }),

    /** GET /web/agency/availability/rules */
    getAgencyAvailabilityRules: builder.query({
      query: ({ page = 0, limit = 200, userId = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (userId) params.userId = String(userId).trim();

        return {
          url: API_ROUTES.AGENCY_AVAILABILITY_RULES,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => transformAvailabilityRulesResponse(response),
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'AgencyAvailabilityRules', id: item.id })),
              { type: 'AgencyAvailabilityRules', id: 'LIST' },
            ]
          : [{ type: 'AgencyAvailabilityRules', id: 'LIST' }],
    }),

    /** POST /web/agency/availability/rules */
    createAgencyAvailabilityRule: builder.mutation({
      query: (payload = {}) => ({
        url: API_ROUTES.AGENCY_AVAILABILITY_RULES,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: buildAvailabilityRulePayload(payload),
      }),
      invalidatesTags: [
        { type: 'AgencyAvailabilityRules', id: 'LIST' },
        { type: 'AgencyAvailabilityCalendar', id: 'LIST' },
        { type: 'AgencyAvailability', id: 'LIST' },
      ],
    }),

    /** PUT /web/agency/availability/rules/:id */
    updateAgencyAvailabilityRule: builder.mutation({
      query: ({ id, ...payload } = {}) => ({
        url: API_ROUTES.AGENCY_AVAILABILITY_RULES_BY_ID(id),
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: buildAvailabilityRulePayload(payload),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AgencyAvailabilityRules', id },
        { type: 'AgencyAvailabilityRules', id: 'LIST' },
        { type: 'AgencyAvailabilityCalendar', id: 'LIST' },
        { type: 'AgencyAvailability', id: 'LIST' },
      ],
    }),

    /** DELETE /web/agency/availability/rules/:id */
    deleteAgencyAvailabilityRule: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.AGENCY_AVAILABILITY_RULES_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AgencyAvailabilityRules', id },
        { type: 'AgencyAvailabilityRules', id: 'LIST' },
        { type: 'AgencyAvailabilityCalendar', id: 'LIST' },
        { type: 'AgencyAvailability', id: 'LIST' },
      ],
    }),

    /** GET /web/agency/job/type */
    getAgencyJobTypes: builder.query({
      query: ({ page = 0, limit = 100, status = 'active', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.AGENCY_JOB_TYPES,
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
              ...result.data.map((item) => ({ type: 'AgencyJobType', id: item.id })),
              { type: 'AgencyJobType', id: 'LIST' },
            ]
          : [{ type: 'AgencyJobType', id: 'LIST' }],
    }),

    /** POST /web/agency/availability — body: status, startDateTime, endDateTime, user/staff/worker */
    createAgencyAvailability: builder.mutation({
      query: (payload = {}) => {
        const status = String(payload?.status || 'available').trim() || 'available';

        const body = {
          status,
          startDateTime: payload.startDateTime,
          endDateTime: payload.endDateTime,
        };

        // Worker must go on `user` — backend stores it there (staff/worker alone are ignored)
        if (payload?.user) body.user = payload.user;
        if (payload?.staff) body.staff = payload.staff;
        if (payload?.worker) body.worker = payload.worker;
        if (payload?.jobType) body.jobType = payload.jobType;
        if (payload?.notes) body.notes = payload.notes;
        if (payload?.note) body.note = payload.note;

        return {
          url: API_ROUTES.AGENCY_AVAILABILITY,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        };
      },
      invalidatesTags: [
        { type: 'AgencyAvailability', id: 'LIST' },
        { type: 'AgencyAvailabilityCalendar', id: 'LIST' },
        { type: 'AgencyBookingCalendar', id: 'LIST' },
      ],
    }),

    /** PUT /web/agency/availability/:id */
    updateAgencyAvailability: builder.mutation({
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
          url: API_ROUTES.AGENCY_AVAILABILITY_BY_ID(id),
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AgencyAvailability', id },
        { type: 'AgencyAvailability', id: 'LIST' },
        { type: 'AgencyAvailabilityCalendar', id: 'LIST' },
        { type: 'AgencyBookingCalendar', id: 'LIST' },
      ],
    }),

    /** DELETE /web/agency/availability/:id */
    deleteAgencyAvailability: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.AGENCY_AVAILABILITY_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AgencyAvailability', id },
        { type: 'AgencyAvailability', id: 'LIST' },
        { type: 'AgencyAvailabilityCalendar', id: 'LIST' },
        { type: 'AgencyBookingCalendar', id: 'LIST' },
      ],
    }),

    /**
     * POST /web/agency/booking — assign worker to an accepted bid
     * Body: { bid, worker }
     */
    createAgencyBooking: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AGENCY_BOOKING,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [
        { type: 'AgencyBookingCalendar', id: 'LIST' },
        { type: 'AgencyAvailability', id: 'LIST' },
      ],
    }),

    /** PUT /web/agency/booking/:id { status: 'cancel' } — supplier withdraws a pending / active booking (cancelledByEmployer). */
    cancelAgencyBooking: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.AGENCY_BOOKING_BY_ID(id),
        method: 'PUT',
        body: { status: 'cancel' },
      }),
      invalidatesTags: [
        { type: 'AgencyBookingCalendar', id: 'LIST' },
        { type: 'AgencyAvailability', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAgencyBookingCalendarQuery,
  useGetAgencyAvailabilityQuery,
  useGetAgencyAvailabilityCalendarQuery,
  useGetAgencyAvailabilityRulesQuery,
  useCreateAgencyAvailabilityRuleMutation,
  useUpdateAgencyAvailabilityRuleMutation,
  useDeleteAgencyAvailabilityRuleMutation,
  useGetAgencyJobTypesQuery,
  useCreateAgencyAvailabilityMutation,
  useUpdateAgencyAvailabilityMutation,
  useDeleteAgencyAvailabilityMutation,
  useCreateAgencyBookingMutation,
  useCancelAgencyBookingMutation,
} = agencyAvailabilityApi;
