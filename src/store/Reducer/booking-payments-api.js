import { format, isValid } from 'date-fns';
import { createApi } from '@reduxjs/toolkit/query/react';

import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { fileResponseHandler } from '../file-response';

const PAYMENT_INVOICE_ROUTE = {
  nurse: API_ROUTES.NURSE_BOOKING_PAYMENT_INVOICE,
  agency: API_ROUTES.AGENCY_BOOKING_PAYMENT_INVOICE,
  'home-care-company': API_ROUTES.HOME_CARE_COMPANY_BOOKING_PAYMENT_INVOICE,
};

function paymentInvoiceUrl(role, bookingId) {
  const named = PAYMENT_INVOICE_ROUTE[role];
  if (named) return named(bookingId);
  return API_ROUTES.BOOKING_PAYMENT_INVOICE(role, bookingId);
}

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

function mapPerson(person) {
  const source = asObject(person);
  const name = String(source.name || source.fullName || '').trim();
  const companyName = String(source.companyName || '').trim();
  if (!name && !companyName) return null;
  return {
    id: String(source._id || source.id || ''),
    name: name || companyName,
    companyName: name && companyName && companyName !== name ? companyName : '',
    avatarUrl: resolveProfileAssetUrl(source.profileIcon),
  };
}

function mapMoney(block) {
  if (typeof block === 'number' || typeof block === 'string') {
    return { amount: toNumber(block), formatted: '' };
  }
  const source = asObject(block);
  return {
    amount: toNumber(source.amount),
    formatted: String(source.formatted || '').trim(),
  };
}

function mapSummaryBlock(block) {
  const money = mapMoney(block);
  return money.formatted || money.amount ? money : { amount: 0, formatted: '' };
}

function mapPayment(row) {
  const source = asObject(row);
  const shift = asObject(source.shift);

  return {
    id: String(source._id || source.id || source.reference || ''),
    bookingId: String(
      source.bookingId ||
        source.booking_id ||
        asObject(source.booking)._id ||
        asObject(source.booking).id ||
        (typeof source.booking === 'string' ? source.booking : '') ||
        source._id ||
        source.id ||
        ''
    ),
    reference: String(source.reference || '').trim(),
    transactionId: String(source.transactionId || '').trim(),
    bookingStatus: String(source.bookingStatus || '').trim(),
    jobName: String(source.jobName || '').trim(),
    date: formatWhen(shift.date, 'd MMM yyyy'),
    time: [shift.startTime, shift.endTime].filter(Boolean).join(' – '),
    isBreak: Boolean(shift.isBreak),
    breakMin: toNumber(shift.breakMin),
    hours: toNumber(source.hours),
    amount: toNumber(source.amount),
    formatted: String(source.formatted || '').trim(),
    platformFee: toNumber(source.platformFee),
    currency: String(source.currency || 'GBP'),
    status: String(source.status || '').trim(),
    gateway: String(source.gateway || '').trim(),
    paidAt: formatWhen(source.paidAt, 'd MMM yyyy, HH:mm'),
    customer: mapPerson(source.customer),
    worker: mapPerson(source.worker),
    employer: mapPerson(source.employer),
  };
}

function mapSummary(summary) {
  const source = asObject(summary);
  return {
    role: String(source.role || '').trim(),
    currency: String(source.currency || 'GBP'),
    symbol: String(source.symbol || '£'),
    total: mapSummaryBlock(source.total),
    paid: mapSummaryBlock(source.paid),
    pending: mapSummaryBlock(source.pending),
    refunded: mapSummaryBlock(source.refunded),
  };
}

function firstNumber(...values) {
  const found = values.find((value) => value !== undefined && value !== null && value !== '');
  return found === undefined ? null : toNumber(found);
}

export function mapBookingPaymentsFromApi(response) {
  const data = asObject(response?.data ?? response);
  const rows = Array.isArray(data.payments) ? data.payments : Array.isArray(data.history) ? data.history : Array.isArray(data) ? data : [];
  const meta = asObject(response?.meta ?? data.meta ?? data.pagination ?? response?.pagination);
  const totalRecords = firstNumber(meta.totalRecords, meta.total, meta.totalCount, meta.count, meta.total_records, data.totalRecords, data.total);
  const limit = toNumber(meta.limit || meta.perPage || meta.per_page);
  const totalPages = toNumber(meta.totalPages || meta.pages) || (totalRecords != null && limit ? Math.ceil(totalRecords / limit) : 0);

  return {
    summary: mapSummary(data.summary),
    payments: rows.map(mapPayment),
    meta: {
      page: toNumber(meta.currentPage || meta.page) || 1,
      totalPages,
      totalRecords,
      hasTotal: totalRecords != null,
      limit,
    },
  };
}

function buildPaymentsParams({ from, paymentStatus, payoutStatus, page, limit } = {}) {
  const params = { page: page || 1, limit: limit || 10 };
  if (from) params.from = from;
  if (paymentStatus) params.paymentStatus = paymentStatus;
  if (payoutStatus) params.payoutStatus = payoutStatus;
  return params;
}

export const bookingPaymentsApi = createApi({
  reducerPath: 'bookingPaymentsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['BookingPayments'],

  endpoints: (builder) => ({
    getBookingPayments: builder.query({
      query: ({ role = 'care-home', ...arg } = {}) => ({
        url: API_ROUTES.BOOKING_PAYMENTS(role),
        method: 'GET',
        params: buildPaymentsParams(arg),
      }),
      transformResponse: (response) => mapBookingPaymentsFromApi(response),
      providesTags: [{ type: 'BookingPayments', id: 'LIST' }],
    }),

    /** GET /web/:role/booking/payments/:bookingId/invoice — PDF download. */
    downloadBookingPaymentInvoice: builder.mutation({
      query: ({ role = 'nurse', bookingId }) => ({
        url: paymentInvoiceUrl(role, bookingId),
        method: 'GET',
        responseHandler: fileResponseHandler,
        cache: 'no-store',
      }),
    }),
  }),
});

export const { useGetBookingPaymentsQuery, useDownloadBookingPaymentInvoiceMutation } = bookingPaymentsApi;
