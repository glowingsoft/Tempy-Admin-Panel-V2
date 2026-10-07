import { createApi } from '@reduxjs/toolkit/query/react';

import { extractNurseBookingsList, mapBookingLogs, mapNurseBookingFromApi } from 'src/sections/staff-member/jobs/nurse-checkin-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { nurseDashboardApi } from './nurse-dashboard-api';

export const nurseBookingsApi = createApi({
  reducerPath: 'nurseBookingsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['NurseBookingLog', 'NurseBooking'],

  endpoints: (builder) => ({
    /** GET /web/nurse/booking — nurse booking list used to resolve check-in ids */
    getNurseBookings: builder.query({
      query: ({ page = 0, limit = 200, job = '', shift = '', userId = '' } = {}) => {
        const params = { page: page + 1, limit };
        if (job) params.job = job;
        if (shift) params.shift = shift;
        if (userId) params.userId = String(userId).trim();
        return {
          url: API_ROUTES.NURSE_BOOKING,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response, _meta, arg) => {
        const seen = new Set();
        let data = extractNurseBookingsList(response)
          .map(mapNurseBookingFromApi)
          .filter((row) => {
            if (!row.id || seen.has(row.id)) return false;
            seen.add(row.id);
            return true;
          });

        const scopeUserId = String(arg?.userId || '').trim();
        // Admin impersonation: backend often returns every booking. Keep only explicit own rows.
        if (scopeUserId && arg?.requireOwner) {
          data = data.filter((row) => String(row.workerId || '').trim() === scopeUserId);
        } else if (scopeUserId) {
          const anyHasWorker = data.some((row) => String(row.workerId || '').trim());
          if (anyHasWorker) {
            data = data.filter((row) => String(row.workerId || '').trim() === scopeUserId);
          }
        }

        return { data, meta: response?.meta || {} };
      },
      providesTags: [{ type: 'NurseBooking', id: 'LIST' }],
    }),

    /** GET /app/nurse/booking/:id — one booking: shift snapshot + attendance (job is an id only) */
    getNurseBookingById: builder.query({
      query: (id) => ({
        url: API_ROUTES.NURSE_BOOKINGS_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response) => mapNurseBookingFromApi(response?.data ?? response ?? {}),
      providesTags: (_r, _e, id) => [{ type: 'NurseBookingLog', id: String(id) }],
    }),

    /** GET /app/nurse/booking/logs/:bookingId — In/Out on Active cards */
    getNurseBookingLogs: builder.query({
      query: (bookingId) => ({
        url: API_ROUTES.NURSE_BOOKING_LOGS(bookingId),
        method: 'GET',
      }),
      transformResponse: (response) => mapBookingLogs(response),
      providesTags: (_r, _e, bookingId) => [{ type: 'NurseBookingLog', id: String(bookingId) }],
    }),

    /** PUT /app/nurse/booking/:id?checkinCheckout=true */
    checkInOutNurseBooking: builder.mutation({
      query: ({ id, body }) => ({
        url: API_ROUTES.NURSE_BOOKINGS_BY_ID(id),
        method: 'PUT',
        params: { checkinCheckout: true },
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'NurseBookingLog', id: String(id) },
        { type: 'NurseBooking', id: 'LIST' },
      ],
    }),

    /**
     * PUT /app/nurse/booking/:id?checkinCheckout=true { status: 'checkOutProof', ... } — the
     * picture, signature and reason for a shift the system auto-checked out. Until they are in,
     * the backend refuses the worker's next check-in.
     */
    submitNurseCheckOutProof: builder.mutation({
      query: ({ id, proofPicture, signature, reason }) => ({
        url: API_ROUTES.NURSE_BOOKINGS_BY_ID(id),
        method: 'PUT',
        params: { checkinCheckout: true },
        body: { status: 'checkOutProof', proofPicture, signature, reason: String(reason || '').trim() },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'NurseBookingLog', id: String(id) },
        { type: 'NurseBooking', id: 'LIST' },
      ],
    }),

    /**
     * PUT /app/nurse/booking/:id — worker answers a pending offer.
     * accept → { status: 'active' } (booking active); decline → { status: 'cancel' }
     * (booking cancelledByWorker; the supplier must reassign).
     */
    respondNurseBookingOffer: builder.mutation({
      query: ({ id, action }) => ({
        url: API_ROUTES.NURSE_BOOKINGS_BY_ID(id),
        method: 'PUT',
        body: { status: action === 'accept' ? 'active' : 'cancel' },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'NurseBookingLog', id: String(id) },
        { type: 'NurseBooking', id: 'LIST' },
      ],
    }),

    /** PUT /app/nurse/booking/:id?cancel=true { status: 'cancel' } — worker cancels (cancelledByWorker) */
    cancelNurseBooking: builder.mutation({
      query: ({ id, reason = '', within24Hours = false } = {}) => ({
        url: API_ROUTES.NURSE_BOOKINGS_BY_ID(id),
        method: 'PUT',
        params: { cancel: true },
        body: {
          status: 'cancel',
          ...(reason ? { reason: String(reason).trim() } : {}),
          ...(within24Hours ? { within24Hours: true, shortNotice: true } : {}),
        },
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(nurseDashboardApi.util.invalidateTags([{ type: 'NurseDashboard', id: 'VIEW' }]));
        } catch {
          // keep cached dashboard if cancel failed
        }
      },
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'NurseBookingLog', id: String(id) },
        { type: 'NurseBooking', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetNurseBookingsQuery,
  useLazyGetNurseBookingsQuery,
  useLazyGetNurseBookingLogsQuery,
  useGetNurseBookingByIdQuery,
  useCheckInOutNurseBookingMutation,
  useSubmitNurseCheckOutProofMutation,
  useRespondNurseBookingOfferMutation,
  useCancelNurseBookingMutation,
} = nurseBookingsApi;
