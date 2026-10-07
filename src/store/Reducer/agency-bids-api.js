import { createApi } from '@reduxjs/toolkit/query/react';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import {
  mapAgencyBidFromApi,
  extractAgencyBidsList,
  filterBidsOwnedByUser,
  unwrapBidDocument,
  pickBidDocumentId,
} from 'src/sections/agency/bids/agency-bid-api-utils';

export const agencyBidsApi = createApi({
  reducerPath: 'agencyBidsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AgencyBid'],

  endpoints: (builder) => ({
    getAgencyBids: builder.query({
      query: ({
        page = 0,
        limit = 100,
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
          url: API_ROUTES.AGENCY_BIDS,
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
              ...result.data.map((bid) => ({ type: 'AgencyBid', id: bid.id })),
              { type: 'AgencyBid', id: 'LIST' },
            ]
          : [{ type: 'AgencyBid', id: 'LIST' }],
    }),

    /** POST /web/agency/bids — { shift, job, bid, note } */
    createAgencyBid: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AGENCY_BIDS,
        method: 'POST',
        body,
      }),
      transformResponse: (response) => {
        // Normalize so frontend always sees bid doc + _id when API nests it
        const doc = unwrapBidDocument(response);
        const id = doc ? pickBidDocumentId(doc) : '';
        if (doc && id) {
          return { ...(typeof response === 'object' ? response : {}), data: { ...doc, _id: id, id } };
        }
        return response;
      },
      invalidatesTags: [{ type: 'AgencyBid', id: 'LIST' }],
    }),

    /** PUT /web/agency/bids/:id
     * Body:
     *  - edit:       { "bid": 14, "note": "..." }
     *  - withdraw:   { "status": "withdraw" }
     *  - reactivate: { "bid": 14, "note": "...", "status": "pending" }
     * Response data._id is the bid id (same as :id).
     */
    updateAgencyBid: builder.mutation({
      query: ({ id, bid, note, status }) => {
        const body = {};
        if (status) {
          body.status = status;
        }
        // Allow bid+note together with status (e.g. reactivate withdrawn → pending)
        if (bid != null && bid !== '') {
          body.bid = Number(bid);
          if (note != null) {
            body.note = String(note).trim();
          }
        }

        return {
          url: API_ROUTES.AGENCY_BIDS_BY_ID(id),
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
      invalidatesTags: (result, error, { id }) => [
        { type: 'AgencyBid', id },
        { type: 'AgencyBid', id: 'LIST' },
      ],
    }),

    /** DELETE /web/agency/bids/:id */
    deleteAgencyBid: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.AGENCY_BIDS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'AgencyBid', id },
        { type: 'AgencyBid', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAgencyBidsQuery,
  useLazyGetAgencyBidsQuery,
  useCreateAgencyBidMutation,
  useUpdateAgencyBidMutation,
  useDeleteAgencyBidMutation,
} = agencyBidsApi;
