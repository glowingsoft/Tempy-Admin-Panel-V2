import { createApi } from '@reduxjs/toolkit/query/react';

import { mapEarningsFromApi } from 'src/sections/agency/earnings/earnings-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

function buildEarningsParams({ userId, from, to, workerId, paymentStatus, page, limit } = {}) {
  const params = { page: page || 1, limit: limit || 10 };
  if (userId) params.userId = userId;
  if (from) params.from = from;
  if (to) params.to = to;
  if (workerId) params.workerId = workerId;
  if (paymentStatus) params.paymentStatus = paymentStatus;
  return params;
}

export const earningsApi = createApi({
  reducerPath: 'earningsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['Earnings'],

  endpoints: (builder) => ({
    /** GET /web/:role/booking/earnings — earnings for suppliers, spend for customers. */
    getEarnings: builder.query({
      query: ({ role = 'agency', ...arg } = {}) => ({
        url: API_ROUTES.BOOKING_EARNINGS(role),
        method: 'GET',
        params: buildEarningsParams(arg),
      }),
      transformResponse: (response) => mapEarningsFromApi(response),
      providesTags: [{ type: 'Earnings', id: 'VIEW' }],
    }),
  }),
});

export const { useGetEarningsQuery, useLazyGetEarningsQuery } = earningsApi;
