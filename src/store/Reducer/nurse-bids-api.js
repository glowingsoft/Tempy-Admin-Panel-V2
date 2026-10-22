import { createApi } from '@reduxjs/toolkit/query/react';

import {
  extractAgencyBidsList,
  filterBidsOwnedByUser,
  mapAgencyBidFromApi,
  pickBidDocumentId,
  unwrapBidDocument,
} from 'src/sections/agency/bids/agency-bid-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const nurseBidsApi = createApi({
  reducerPath: 'nurseBidsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['NurseBid'],

  endpoints: (builder) => ({
    /** GET /web/nurse/bids */
    getNurseBids: builder.query({
      query: ({
        page = 0,
        limit = 500,
        status = '',
        keyword = '',
        shift = '',
        job = '',
        userId = '',
      } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;
        if (shift) params.shift = shift;
        if (job) params.job = job;
        if (userId) params.userId = String(userId).trim();

        return {
          url: API_ROUTES.NURSE_BIDS,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response, _meta, arg) => {
        const list = extractAgencyBidsList(response);
        const mapped = list
          .map(mapAgencyBidFromApi)
          .filter((bid) => bid.shiftId || bid.id);

        const scopeUserId = String(arg?.userId || '').trim();
        // requireOwner: drop every bid that is not explicitly owned by scopeUserId
        // (admin impersonation otherwise returns the full nurse-bids collection).
        const data = scopeUserId
          ? filterBidsOwnedByUser(mapped, scopeUserId, {
              requireOwner: Boolean(arg?.requireOwner),
            })
          : mapped;

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: scopeUserId ? data.length : (response?.meta?.totalRecords ?? data.length),
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((bid) => ({ type: 'NurseBid', id: bid.id })),
              { type: 'NurseBid', id: 'LIST' },
            ]
          : [{ type: 'NurseBid', id: 'LIST' }],
    }),

    /** POST /web/nurse/bids — { shift, job, bid, note } */
    createNurseBid: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.NURSE_BIDS,
        method: 'POST',
        body,
      }),
      transformResponse: (response) => {
        const doc = unwrapBidDocument(response);
        const id = doc ? pickBidDocumentId(doc) : '';
        if (doc && id) {
          return { ...(typeof response === 'object' ? response : {}), data: { ...doc, _id: id, id } };
        }
        return response;
      },
      invalidatesTags: [{ type: 'NurseBid', id: 'LIST' }],
    }),

    /** PUT /web/nurse/bids/:id */
    updateNurseBid: builder.mutation({
      query: ({ id, bid, note, status }) => {
        const body = {};
        if (status) {
          body.status = status;
        }
        if (bid != null && bid !== '') {
          body.bid = Number(bid);
          if (note != null) {
            body.note = String(note).trim();
          }
        }

        return {
          url: API_ROUTES.NURSE_BIDS_BY_ID(id),
          method: 'PUT',
          body,
        };
      },
      transformResponse: (response) => {
        const doc = unwrapBidDocument(response);
        const id = doc ? pickBidDocumentId(doc) : '';
        if (doc && id) {
          return { ...(typeof response === 'object' ? response : {}), data: { ...doc, _id: id, id } };
        }
        return response;
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NurseBid', id },
        { type: 'NurseBid', id: 'LIST' },
      ],
    }),

    /** DELETE /web/nurse/bids/:id */
    deleteNurseBid: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.NURSE_BIDS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'NurseBid', id },
        { type: 'NurseBid', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetNurseBidsQuery,
  useLazyGetNurseBidsQuery,
  useCreateNurseBidMutation,
  useUpdateNurseBidMutation,
  useDeleteNurseBidMutation,
} = nurseBidsApi;
