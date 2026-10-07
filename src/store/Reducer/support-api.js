import { createApi } from '@reduxjs/toolkit/query/react';

import {
  mapSupportFromApi,
  normalizeSupportListResponse,
  SUPPORT_ROUTE_KEYS_BY_ACCOUNT,
} from 'src/sections/support/support-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/** Keep in sync with admin SupportListView query args (cache updates). */
export const ADMIN_SUPPORT_LIST_ARGS = { page: 0, limit: 200 };

function resolveSupportUrls(accountKey) {
  const keys = SUPPORT_ROUTE_KEYS_BY_ACCOUNT[accountKey];
  if (!keys) return { listUrl: '', createUrl: '' };
  return {
    listUrl: API_ROUTES[keys.list] || '',
    createUrl: API_ROUTES[keys.create] || '',
  };
}

function patchAdminSupportList(draft, updater) {
  if (!draft) return;
  if (!Array.isArray(draft.data)) draft.data = [];
  updater(draft);
}

/**
 * Support API
 * - Role dashboards: GET /settings/support + create via /support
 * - Admin /admin-dashboard/support: GET/PUT/DELETE on /admin/support
 *
 * Admin mutations update the list cache in-place (no LIST refetch) to avoid
 * backend "Too many requests to support" rate limits.
 */
export const supportApi = createApi({
  reducerPath: 'supportApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['Support', 'AdminSupport'],
  refetchOnFocus: false,
  refetchOnReconnect: false,

  endpoints: (builder) => ({
    /**
     * Role dashboards — GET /settings/support
     */
    getSupportTickets: builder.query({
      query: ({ accountKey } = {}) => {
        const { listUrl } = resolveSupportUrls(accountKey);
        return {
          url: listUrl,
          method: 'GET',
        };
      },
      transformResponse: normalizeSupportListResponse,
      providesTags: (_result, _error, arg) => [
        { type: 'Support', id: `LIST-${arg?.accountKey || 'unknown'}` },
      ],
    }),

    /**
     * Role dashboards — POST /support
     * Body: { subject, message }
     */
    createSupportTicket: builder.mutation({
      query: ({ accountKey, subject, message }) => {
        const { createUrl } = resolveSupportUrls(accountKey);
        return {
          url: createUrl,
          method: 'POST',
          body: { subject, message },
        };
      },
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Support', id: `LIST-${arg?.accountKey || 'unknown'}` },
        // Admin Support inbox reads /admin/support — keep it fresh after user tickets.
        { type: 'AdminSupport', id: 'LIST' },
      ],
    }),

    /** Admin — GET /admin/support */
    getAdminSupportTickets: builder.query({
      query: ({ page = 0, limit = 200, status = '', keyword = '', type = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (status && status !== 'all') params.status = status;
        if (keyword) params.keyword = keyword;
        if (type && type !== 'all') params.type = type;

        return {
          url: API_ROUTES.ADMIN_SUPPORT,
          method: 'GET',
          params,
        };
      },
      transformResponse: normalizeSupportListResponse,
      // Always prefer live admin inbox data (no long-lived stale cache).
      keepUnusedDataFor: 0,
      providesTags: [{ type: 'AdminSupport', id: 'LIST' }],
    }),

    /** Admin — POST /admin/support */
    createAdminSupportTicket: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.ADMIN_SUPPORT,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const raw = data?.data ?? data;
          const mapped = mapSupportFromApi(Array.isArray(raw) ? raw[0] : raw);
          if (!mapped?.id) return;

          dispatch(
            supportApi.util.updateQueryData(
              'getAdminSupportTickets',
              ADMIN_SUPPORT_LIST_ARGS,
              (draft) => {
                patchAdminSupportList(draft, () => {
                  draft.data = draft.data.filter((item) => item.id !== mapped.id);
                  draft.data.unshift(mapped);
                });
              }
            )
          );
        } catch {
          // ignore — caller shows toast
        }
      },
    }),

    /** Admin — PUT /admin/support/:id */
    updateAdminSupportTicket: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.ADMIN_SUPPORT_BY_ID(id),
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      async onQueryStarted({ id, ...body }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          supportApi.util.updateQueryData(
            'getAdminSupportTickets',
            ADMIN_SUPPORT_LIST_ARGS,
            (draft) => {
              const row = draft?.data?.find((item) => String(item.id) === String(id));
              if (!row) return;
              if (body.status != null) row.status = String(body.status).toLowerCase();
              if (body.subject != null) row.subject = body.subject;
              if (body.message != null) row.message = body.message;
              if (body.response != null) row.response = body.response;
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    /** Admin — DELETE /admin/support/:id */
    deleteAdminSupportTicket: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.ADMIN_SUPPORT_BY_ID(id),
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          supportApi.util.updateQueryData(
            'getAdminSupportTickets',
            ADMIN_SUPPORT_LIST_ARGS,
            (draft) => {
              if (!draft?.data) return;
              draft.data = draft.data.filter((item) => String(item.id) !== String(id));
            }
          )
        );

        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetSupportTicketsQuery,
  useCreateSupportTicketMutation,
  useGetAdminSupportTicketsQuery,
  useCreateAdminSupportTicketMutation,
  useUpdateAdminSupportTicketMutation,
  useDeleteAdminSupportTicketMutation,
} = supportApi;
