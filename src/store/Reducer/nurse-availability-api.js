import { createApi } from '@reduxjs/toolkit/query/react';

import { mapCareHomeJobTypeFromApi } from 'src/sections/care-home/jobs/care-home-job-api-utils';
import { mapAgencyAvailabilityFromApi } from 'src/sections/agency/shifts/agency-availability-api-utils';
import { mapAgencyBookingCalendarFromApi } from 'src/sections/agency/shifts/agency-booking-calendar-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/**
 * Nurse (staff member) shifts — routes match nurse login (`/web/nurse/...`):
 * - GET /web/nurse/booking/calender
 * - GET/POST /web/nurse/availability + PUT/DELETE :id
 * - GET /web/nurse/job/type
 */
export const nurseAvailabilityApi = createApi({
  reducerPath: 'nurseAvailabilityApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: [
    'NurseAvailability',
    'NurseJobType',
    'NurseBookingCalendar',
  ],

  endpoints: (builder) => ({
    /**
     * GET /web/nurse/booking/calender
     * Query: latitude, longitude, startDate, endDate, branch?
     */
    getNurseBookingCalendar: builder.query({
      query: ({
        latitude = 0.1,
        longitude = 0.1,
        startDate,
        endDate,
        branch = '',
        userId = '',
      } = {}) => {
        const params = {
          latitude,
          longitude,
          startDate,
          endDate,
        };
        if (branch) params.branch = branch;
        if (userId) params.userId = String(userId).trim();

        return {
          url: API_ROUTES.NURSE_BOOKING_CALENDAR,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => mapAgencyBookingCalendarFromApi(response),
      providesTags: [{ type: 'NurseBookingCalendar', id: 'LIST' }],
    }),

    /** GET /web/nurse/availability */
    getNurseAvailability: builder.query({
      query: ({
        page = 0,
        limit = 200,
        status = '',
        keyword = '',
        startDate = '',
        endDate = '',
        userId = '',
      } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (userId) params.userId = String(userId).trim();

        return {
          url: API_ROUTES.NURSE_AVAILABILITY,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response, _meta, arg) => {
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
        let data = list
          .map(mapAgencyAvailabilityFromApi)
          .filter((item) => item.id && item.apiStatus !== 'deleted' && item.apiStatus !== 'delete');

        const scopeUserId = String(arg?.userId || '').trim();
        if (scopeUserId && arg?.requireOwner) {
          // Impersonation: only rows explicitly owned by this nurse.
          data = data.filter((item) => String(item.staffId || '').trim() === scopeUserId);
        } else if (scopeUserId) {
          const owned = data.filter((item) => String(item.staffId || '').trim() === scopeUserId);
          const anyHasOwner = data.some((item) => String(item.staffId || '').trim());
          if (anyHasOwner) data = owned;
        }

        return {
          data,
          meta: response?.meta || raw?.meta || {},
          message: response?.message || '',
          total_length: scopeUserId ? data.length : (response?.meta?.totalRecords ?? raw?.totalRecords ?? data.length),
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({
                type: 'NurseAvailability',
                id: item.id,
              })),
              { type: 'NurseAvailability', id: 'LIST' },
            ]
          : [{ type: 'NurseAvailability', id: 'LIST' }],
    }),

    /** GET /web/nurse/job/type */
    getNurseJobTypes: builder.query({
      query: ({ page = 0, limit = 100, status = 'active', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.NURSE_JOB_TYPES,
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
              ...result.data.map((item) => ({ type: 'NurseJobType', id: item.id })),
              { type: 'NurseJobType', id: 'LIST' },
            ]
          : [{ type: 'NurseJobType', id: 'LIST' }],
    }),

    /** POST /web/nurse/availability — include `user` (worker id) so labels survive refetch */
    createNurseAvailability: builder.mutation({
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
          url: API_ROUTES.NURSE_AVAILABILITY,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        };
      },
      invalidatesTags: [
        { type: 'NurseAvailability', id: 'LIST' },
        { type: 'NurseBookingCalendar', id: 'LIST' },
      ],
    }),

    /** PUT /web/nurse/availability/:id */
    updateNurseAvailability: builder.mutation({
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
          url: API_ROUTES.NURSE_AVAILABILITY_BY_ID(id),
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NurseAvailability', id },
        { type: 'NurseAvailability', id: 'LIST' },
        { type: 'NurseBookingCalendar', id: 'LIST' },
      ],
    }),

    /**
     * POST /web/nurse/booking — assign (same contract as agency: { bid, worker })
     */
    createNurseBooking: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.NURSE_BOOKING,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [
        { type: 'NurseBookingCalendar', id: 'LIST' },
        { type: 'NurseAvailability', id: 'LIST' },
      ],
    }),

    /** DELETE /web/nurse/availability/:id */
    deleteNurseAvailability: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.NURSE_AVAILABILITY_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'NurseAvailability', id },
        { type: 'NurseAvailability', id: 'LIST' },
        { type: 'NurseBookingCalendar', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetNurseBookingCalendarQuery,
  useGetNurseAvailabilityQuery,
  useGetNurseJobTypesQuery,
  useCreateNurseAvailabilityMutation,
  useUpdateNurseAvailabilityMutation,
  useDeleteNurseAvailabilityMutation,
  useCreateNurseBookingMutation,
} = nurseAvailabilityApi;
