import { createApi } from '@reduxjs/toolkit/query/react';

import { extractAdminPayouts } from 'src/sections/admin/transactions/admin-payouts-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

const USABLE_MANDATE_STATUSES = new Set(['active', 'submitted', 'pending_submission']);

function pickId(candidates) {
  for (const value of candidates) {
    if (typeof value === 'string' || typeof value === 'number') {
      const text = String(value).trim();
      if (text) return text;
    }
    if (value && typeof value === 'object') {
      const nested = value._id || value.id;
      if (typeof nested === 'string' || typeof nested === 'number') {
        const text = String(nested).trim();
        if (text) return text;
      }
    }
  }
  return '';
}

export function isUsableMandateStatus(status) {
  return USABLE_MANDATE_STATUSES.has(String(status || '').trim().toLowerCase());
}

export function isUsableCustomerMandate(record) {
  return isUsableMandateStatus(record?.status);
}

function findUsableMandate(value, depth = 0) {
  if (!value || typeof value !== 'object' || depth > 8) return null;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findUsableMandate(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const status = String(value.status || '').trim().toLowerCase();
  const mandateId = String(value.mandateId || value.mandate_id || '').trim();
  if (isUsableMandateStatus(status) && mandateId) return value;

  for (const key of ['mandate', 'data', 'gocardlessMandate', 'directDebit', 'mandates']) {
    const found = findUsableMandate(value[key], depth + 1);
    if (found) return found;
  }

  return null;
}

export function mapGoCardlessMandate(response) {
  const root = asObject(response);
  const payload = asObject(root.data ?? root);
  const mandate = findUsableMandate(root) || {};
  const redirectSource = asObject(payload.mandate ? payload : root);

  return {
    status: isUsableMandateStatus(mandate.status) ? String(mandate.status).trim().toLowerCase() : '',
    id: pickId([mandate.mandateId, mandate.mandate_id, mandate._id, mandate.id]),
    ownerId: pickId([mandate.customer, mandate.customerId, mandate.userId, payload.customer, payload.customerId]),
    redirectUrl: String(
      redirectSource.redirectUrl ||
        redirectSource.authorisationUrl ||
        redirectSource.authorizationUrl ||
        redirectSource.url ||
        ''
    ),
  };
}

export const gocardlessApi = createApi({
  reducerPath: 'gocardlessApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['GoCardlessMandate', 'AdminPayout'],

  endpoints: (builder) => ({
    getGoCardlessMandate: builder.query({
      query: () => ({ url: API_ROUTES.GOCARDLESS_MANDATE, method: 'GET' }),
      transformResponse: (response) => mapGoCardlessMandate(response),
      providesTags: (result, error, userId) => [
        { type: 'GoCardlessMandate', id: String(userId || 'CURRENT') },
      ],
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    }),

    setupGoCardlessMandate: builder.mutation({
      query: () => ({ url: API_ROUTES.GOCARDLESS_MANDATE, method: 'POST' }),
      transformResponse: (response) => mapGoCardlessMandate(response),
      invalidatesTags: (result, error, userId) => [
        { type: 'GoCardlessMandate', id: String(userId || 'CURRENT') },
      ],
    }),

    getAdminPayouts: builder.query({
      query: () => ({ url: API_ROUTES.ADMIN_PAYOUTS, method: 'GET' }),
      transformResponse: (response) => extractAdminPayouts(response),
      providesTags: [{ type: 'AdminPayout', id: 'LIST' }],
    }),

    refundAdminBooking: builder.mutation({
      query: ({ bookingId, amount, reason }) => ({
        url: API_ROUTES.ADMIN_BOOKING_REFUND(bookingId),
        method: 'POST',
        body: {
          ...(amount ? { amount } : {}),
          ...(reason ? { reason } : {}),
        },
      }),
      invalidatesTags: [{ type: 'AdminPayout', id: 'LIST' }],
    }),

    recordAdminPayout: builder.mutation({
      query: ({ supplierId, bookingIds, reference }) => ({
        url: API_ROUTES.ADMIN_PAYOUTS_SETTLE,
        method: 'POST',
        body: {
          supplierId,
          ...(Array.isArray(bookingIds) && bookingIds.length ? { bookingIds } : {}),
          ...(reference ? { reference } : {}),
        },
      }),
      invalidatesTags: [{ type: 'AdminPayout', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetGoCardlessMandateQuery,
  useSetupGoCardlessMandateMutation,
  useGetAdminPayoutsQuery,
  useRecordAdminPayoutMutation,
  useRefundAdminBookingMutation,
} = gocardlessApi;
