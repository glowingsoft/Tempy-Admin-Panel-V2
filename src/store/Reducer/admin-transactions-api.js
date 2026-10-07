import { format, isValid } from 'date-fns';
import { createApi } from '@reduxjs/toolkit/query/react';

import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function formatWhen(value, pattern) {
  if (!value) return '';
  const date = new Date(value);
  return isValid(date) ? format(date, pattern) : '';
}

function mapParty(person) {
  const source = asObject(person);
  const name = String(source.name || '').trim();
  const email = String(source.email || '').trim();
  if (!name && !email) return null;
  return {
    id: String(source._id || source.id || ''),
    name: name || email,
    email,
    avatarUrl: resolveProfileAssetUrl(source.profileIcon),
    userType: String(source.userType || source.accountState?.userType || '').trim(),
  };
}

export function mapAdminTransaction(row) {
  const source = asObject(row);
  const shift = asObject(source.shift);
  const job = asObject(source.job);

  return {
    id: String(source._id || source.id || ''),
    reference: String(source.reference || '').trim(),
    bookingStatus: String(source.bookingStatus || '').trim(),
    jobName: String(job.name || source.jobName || '').trim(),
    date: formatWhen(shift.date, 'd MMM yyyy'),
    time: [shift.startTime, shift.endTime].filter(Boolean).join(' – '),
    isBreak: Boolean(shift.isBreak),
    breakMin: toNumber(shift.breakMin),
    customer: mapParty(source.customer),
    worker: mapParty(source.worker),
    supplier: mapParty(source.supplier),
    currency: String(source.currency || 'GBP'),
    amount: toNumber(source.amount),
    platformFee: toNumber(source.platformFee),
    platformFeePercent: toNumber(source.platformFeePercent),
    supplierAmount: toNumber(source.supplierAmount),
    status: String(source.status || '').trim(),
    gateway: String(source.gateway || '').trim(),
    gatewayStatus: String(source.gatewayStatus || '').trim(),
    paidAt: formatWhen(source.paidAt, 'd MMM yyyy, HH:mm'),
    payoutStatus: String(source.payoutStatus || '').trim(),
    payoutAt: formatWhen(source.payoutAt, 'd MMM yyyy, HH:mm'),
    payoutReference: String(source.payoutReference || '').trim(),
    createdAt: formatWhen(source.createdAt, 'd MMM yyyy, HH:mm'),
  };
}

function firstNumber(...values) {
  const found = values.find((value) => value !== undefined && value !== null && value !== '');
  return found === undefined ? null : toNumber(found);
}

function extractRows(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.transactions)) return data.transactions;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

export function mapAdminTransactionList(response) {
  const data = asObject(response?.data);
  const rows = extractRows(response);
  const meta = asObject(response?.meta ?? data.meta);
  const totalRecords = firstNumber(meta.totalRecords, meta.total, meta.totalCount, meta.count, data.totalRecords, data.total);

  return {
    transactions: rows.map(mapAdminTransaction),
    meta: {
      page: toNumber(meta.currentPage || meta.page) || 1,
      totalRecords,
      hasTotal: totalRecords != null,
      limit: toNumber(meta.limit),
    },
  };
}

export function mapPlatformFee(response) {
  const data = response?.data ?? response;
  if (typeof data === 'number' || typeof data === 'string') return { percent: toNumber(data) };
  const source = asObject(data);
  return {
    percent: toNumber(source.percent ?? source.platformFeePercent ?? source.rate ?? source.fee),
  };
}

export const adminTransactionsApi = createApi({
  reducerPath: 'adminTransactionsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AdminTransaction', 'AdminPlatformFee'],

  endpoints: (builder) => ({
    getAdminTransactions: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: API_ROUTES.ADMIN_TRANSACTIONS,
        method: 'GET',
        params: { page, limit },
      }),
      transformResponse: (response) => mapAdminTransactionList(response),
      providesTags: [{ type: 'AdminTransaction', id: 'LIST' }],
    }),

    getAdminTransactionById: builder.query({
      query: (id) => ({
        url: API_ROUTES.ADMIN_TRANSACTION_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response) => mapAdminTransaction(response?.data ?? response),
      providesTags: (result, error, id) => [{ type: 'AdminTransaction', id }],
    }),

    getAdminPlatformFee: builder.query({
      query: () => ({
        url: API_ROUTES.ADMIN_TRANSACTION_PLATFORM_FEE,
        method: 'GET',
      }),
      transformResponse: (response) => mapPlatformFee(response),
      providesTags: [{ type: 'AdminPlatformFee', id: 'CURRENT' }],
    }),

    updateAdminPlatformFee: builder.mutation({
      query: ({ percent }) => ({
        url: API_ROUTES.ADMIN_TRANSACTION_PLATFORM_FEE,
        method: 'PUT',
        body: { percent },
      }),
      invalidatesTags: [{ type: 'AdminPlatformFee', id: 'CURRENT' }],
    }),
  }),
});

export const { useGetAdminTransactionsQuery, useGetAdminTransactionByIdQuery, useGetAdminPlatformFeeQuery, useUpdateAdminPlatformFeeMutation } = adminTransactionsApi;
