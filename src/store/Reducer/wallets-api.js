import { createApi } from '@reduxjs/toolkit/query/react';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { API_ROUTES } from '../apiRoutes';

export const walletsApi = createApi({
  reducerPath: 'walletsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['Wallet'],

  endpoints: (builder) => ({
    getWallets: builder.query({
      query: ({ search = '', page = 0, status = '', date, limit = 10, timePeriod = 'all', transactionType = 'all', startDate, endDate }) => {
        const params = {
          page: page + 1,
          limit,
        };

        if (search) params.keyword = search;
        if (timePeriod && timePeriod !== 'all') params.timePeriod = timePeriod;
        if (transactionType && transactionType !== 'all') params.transactionType = transactionType;
        if (status) params.status = status;
        if (date) params.date = date;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        return {
          url: API_ROUTES.WALLETS,
          method: 'GET',
          params,
        };
      },
      transformResponse: (res) => ({
        total_length: res?.meta?.totalRecords || 0,
        data: res?.data || [],
        meta: res?.meta || {},
      }),
      providesTags: (result) =>
        result?.data
          ? [
            ...result.data.map(({ _id }) => ({ type: 'Wallet', id: _id })),
            { type: 'Wallet', id: 'LIST' },
          ]
          : [{ type: 'Wallet', id: 'LIST' }],
    }),

    addWallet: builder.mutation({
      query: (newWallet) => ({
        url: API_ROUTES.WALLETS,
        method: 'POST',
        body: newWallet,
      }),
      invalidatesTags: [{ type: 'Wallet', id: 'LIST' }],
    }),

    updateWallet: builder.mutation({
      query: ({ id, ...updatedWallet }) => ({
        url: API_ROUTES.WALLETS_BY_ID(id),
        method: 'PUT',
        body: updatedWallet,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Wallet', id },
        { type: 'Wallet', id: 'LIST' },
      ],
    }),

    deleteWallet: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.WALLETS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Wallet', id },
        { type: 'Wallet', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetWalletsQuery,
  useAddWalletMutation,
  useUpdateWalletMutation,
  useDeleteWalletMutation,
} = walletsApi;

