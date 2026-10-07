import { createApi } from '@reduxjs/toolkit/query/react';

import {
  FAQ_ROUTE_KEYS_BY_ACCOUNT,
  normalizeFaqsResponse,
} from 'src/sections/faqs/faq-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

function resolveFaqListUrl(accountKey) {
  const routeKey = FAQ_ROUTE_KEYS_BY_ACCOUNT[accountKey];
  if (!routeKey) return '';
  return API_ROUTES[routeKey] || '';
}

/**
 * FAQ API
 * - Role dashboards: GET /settings/faqs
 * - Admin /admin-dashboard/faqs: CRUD on /admin/faqs
 */
export const faqsApi = createApi({
  reducerPath: 'faqsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['Faq', 'AdminFaq'],

  endpoints: (builder) => ({
    /** Role dashboards — GET /settings/faqs */
    getFaqs: builder.query({
      query: ({ accountKey } = {}) => ({
        url: resolveFaqListUrl(accountKey),
        method: 'GET',
      }),
      transformResponse: normalizeFaqsResponse,
      providesTags: (_result, _error, arg) => [
        { type: 'Faq', id: `LIST-${arg?.accountKey || 'unknown'}` },
      ],
    }),

    /** Admin — GET /admin/faqs */
    getAdminFaqs: builder.query({
      query: ({ type = '', keyword = '' } = {}) => {
        const params = {};
        if (type && type !== 'all') params.type = type;
        if (keyword) params.keyword = keyword;
        return {
          url: API_ROUTES.ADMIN_FAQS,
          method: 'GET',
          params,
        };
      },
      transformResponse: normalizeFaqsResponse,
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'AdminFaq', id: item.id })),
              { type: 'AdminFaq', id: 'LIST' },
            ]
          : [{ type: 'AdminFaq', id: 'LIST' }],
    }),

    /** Admin — POST /admin/faqs — body: { type, question, answer } */
    createFaq: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.ADMIN_FAQS,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'AdminFaq', id: 'LIST' }],
    }),

    /** Admin — PUT /admin/faqs/:id */
    updateFaq: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.ADMIN_FAQS_BY_ID(id),
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AdminFaq', id },
        { type: 'AdminFaq', id: 'LIST' },
      ],
    }),

    /** Admin — DELETE /admin/faqs/:id */
    deleteFaq: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.ADMIN_FAQS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AdminFaq', id },
        { type: 'AdminFaq', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetFaqsQuery,
  useGetAdminFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
} = faqsApi;
