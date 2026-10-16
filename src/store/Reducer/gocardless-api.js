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

const SETUP_URL_KEYS = [
  'authorisationUrl',
  'authorizationUrl',
  'authorisation_url',
  'authorization_url',
  'hostedUrl',
  'hosted_url',
  'flowUrl',
  'flow_url',
];

const FALLBACK_URL_KEYS = ['redirectUrl', 'redirect_url', 'url', 'link'];

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

/** Backend return page after GoCardless finishes. It is not the bank-details form. */
function isGoCardlessReturnUrl(value) {
  try {
    const path = new URL(String(value)).pathname.replace(/\/+$/, '').toLowerCase();
    return path.endsWith('/gocardless/return') || path.endsWith('/gocardless/exit');
  } catch {
    return String(value || '').toLowerCase().includes('/gocardless/return');
  }
}

function readUrl(source, key) {
  const value = source?.[key];
  const text = typeof value === 'string' ? value.trim() : '';
  return isHttpUrl(text) ? text : '';
}

function objectsIn(value, depth = 0, list = []) {
  if (!value || typeof value !== 'object' || depth > 5) return list;
  if (Array.isArray(value)) {
    value.forEach((item) => objectsIn(item, depth + 1, list));
    return list;
  }
  list.push(value);
  Object.values(value).forEach((item) => {
    if (item && typeof item === 'object') objectsIn(item, depth + 1, list);
  });
  return list;
}

/**
 * Open the GoCardless bank page, not the API return URL.
 * `redirectUrl` is often https://…/gocardless/return (“Done”), while the form lives on authorisationUrl.
 */
function pickSetupUrl(source) {
  const objects = objectsIn(source);

  for (const key of SETUP_URL_KEYS) {
    for (const object of objects) {
      const url = readUrl(object, key);
      if (url && !isGoCardlessReturnUrl(url)) return url;
    }
  }

  for (const key of FALLBACK_URL_KEYS) {
    for (const object of objects) {
      const url = readUrl(object, key);
      if (url && !isGoCardlessReturnUrl(url)) return url;
    }
  }

  return '';
}

export function mapGoCardlessMandate(response) {
  const root = asObject(response);
  const payload = asObject(root.data ?? root);
  const mandate = findUsableMandate(root) || {};

  return {
    status: isUsableMandateStatus(mandate.status) ? String(mandate.status).trim().toLowerCase() : '',
    id: pickId([mandate.mandateId, mandate.mandate_id, mandate._id, mandate.id]),
    ownerId: pickId([mandate.customer, mandate.customerId, mandate.userId, payload.customer, payload.customerId]),
    redirectUrl: pickSetupUrl(root),
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
      refetchOnFocus: false,
      refetchOnMountOrArgChange: 60,
    }),

    setupGoCardlessMandate: builder.mutation({
      query: () => ({ url: API_ROUTES.GOCARDLESS_MANDATE, method: 'POST' }),
      transformResponse: (response) => mapGoCardlessMandate(response),
      invalidatesTags: (result, error, userId) => [
        { type: 'GoCardlessMandate', id: String(userId || 'CURRENT') },
      ],
    }),

    getAdminPayouts: builder.query({
      query: ({ page = 1, limit = 10, status = '' } = {}) => {
        const params = { page, limit };
        if (status && status !== 'all') params.status = status;
        return {
          url: API_ROUTES.ADMIN_PAYOUTS,
          method: 'GET',
          params,
        };
      },
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

    /** POST /admin/gocardless/payouts/settle — { supplierId, reference } */
    recordAdminPayout: builder.mutation({
      query: ({ supplierId, bookingIds, reference }) => ({
        url: API_ROUTES.ADMIN_PAYOUTS_SETTLE,
        method: 'POST',
        body: {
          supplierId,
          ...(reference ? { reference } : {}),
          ...(Array.isArray(bookingIds) && bookingIds.length ? { bookingIds } : {}),
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
