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
  'hosted_billing_request_url',
  'hostedBillingRequestUrl',
  'flowUrl',
  'flow_url',
  'billingRequestFlowUrl',
  'billing_request_flow_url',
];

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || '').trim());
}

export function isGoCardlessReturnUrl(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return false;
  if (raw.includes('/gocardless/return') || raw.includes('/gocardless/exit')) return true;
  try {
    const path = new URL(String(value)).pathname.replace(/\/+$/, '').toLowerCase();
    return path.endsWith('/gocardless/return') || path.endsWith('/gocardless/exit');
  } catch {
    return false;
  }
}

function isLikelyGoCardlessHostedForm(url) {
  try {
    const host = new URL(String(url)).hostname.toLowerCase();
    return (
      host === 'gocardless.com' ||
      host === 'pay.gocardless.com' ||
      host.endsWith('.gocardless.com')
    );
  } catch {
    return false;
  }
}

export function isGoCardlessBankSetupUrl(url) {
  const text = String(url || '').trim();
  if (!isHttpUrl(text) || isGoCardlessReturnUrl(text)) return false;
  return isLikelyGoCardlessHostedForm(text);
}

function coerceHttpUrl(value) {
  if (typeof value === 'string') {
    const text = value.trim();
    return isHttpUrl(text) ? text : '';
  }
  if (value && typeof value === 'object') {
    for (const key of ['href', 'url', 'authorisationUrl', 'authorizationUrl', 'authorisation_url']) {
      const nested = value[key];
      if (typeof nested === 'string' && isHttpUrl(nested.trim())) return nested.trim();
    }
  }
  return '';
}

function readUrl(source, key) {
  return coerceHttpUrl(source?.[key]);
}

function objectsIn(value, depth = 0, list = []) {
  if (!value || typeof value !== 'object' || depth > 8) return list;
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

function collectHttpUrls(value, depth = 0, out = []) {
  if (depth > 8 || value == null) return out;
  if (typeof value === 'string') {
    const url = coerceHttpUrl(value);
    if (url) out.push(url);
    return out;
  }
  if (typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    value.forEach((item) => collectHttpUrls(item, depth + 1, out));
    return out;
  }
  Object.values(value).forEach((item) => collectHttpUrls(item, depth + 1, out));
  return out;
}


export function pickSetupUrl(source) {
  const objects = objectsIn(source);

  for (const key of SETUP_URL_KEYS) {
    for (const object of objects) {
      const url = readUrl(object, key);
      if (isGoCardlessBankSetupUrl(url)) return url;
    }
  }

  for (const url of collectHttpUrls(source)) {
    if (isGoCardlessBankSetupUrl(url)) return url;
  }

  return '';
}

export function mapGoCardlessMandate(response) {
  const root = asObject(response);
  const payload = asObject(root.data ?? root);
  const mandate = findUsableMandate(root) || {};
  const setupUrl = pickSetupUrl(root);
  const allUrls = collectHttpUrls(root);
  const refusedReturnUrls = allUrls.filter((url) => isGoCardlessReturnUrl(url));

  return {
    status: isUsableMandateStatus(mandate.status) ? String(mandate.status).trim().toLowerCase() : '',
    id: pickId([mandate.mandateId, mandate.mandate_id, mandate._id, mandate.id]),
    ownerId: pickId([mandate.customer, mandate.customerId, mandate.userId, payload.customer, payload.customerId]),
    redirectUrl: setupUrl,
    setupUrl,
    debugUrls: allUrls.slice(0, 8),
    refusedReturnUrls: refusedReturnUrls.slice(0, 4),
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
      serializeQueryArgs: () => 'gocardless-mandate',
      providesTags: [{ type: 'GoCardlessMandate', id: 'CURRENT' }],
      refetchOnFocus: false,
      refetchOnReconnect: false,
      refetchOnMountOrArgChange: false,
    }),

    setupGoCardlessMandate: builder.mutation({
      query: () => ({ url: API_ROUTES.GOCARDLESS_MANDATE, method: 'POST' }),
      transformResponse: (response) => mapGoCardlessMandate(response),
      invalidatesTags: (result) =>
        isUsableCustomerMandate(result) ? [{ type: 'GoCardlessMandate', id: 'CURRENT' }] : [],
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
