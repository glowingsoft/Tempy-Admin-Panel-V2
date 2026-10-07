import { createApi } from '@reduxjs/toolkit/query/react';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

function mapCounts(response) {
  const data = response?.data ?? response;
  if (!data || typeof data !== 'object') return {};
  return Object.fromEntries(
    Object.entries(data)
      .map(([key, value]) => [key, Number(value)])
      .filter(([, value]) => Number.isFinite(value) && value >= 0)
  );
}

export const sidebarCountsApi = createApi({
  reducerPath: 'sidebarCountsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['SidebarCounts'],

  endpoints: (builder) => ({
    getSidebarCounts: builder.query({
      query: (prefix) => ({
        url: API_ROUTES.SIDEBAR_COUNTS(prefix),
        method: 'GET',
      }),
      transformResponse: mapCounts,
      providesTags: [{ type: 'SidebarCounts', id: 'VIEW' }],
    }),

    markSidebarSeen: builder.mutation({
      query: ({ prefix, section }) => ({
        url: API_ROUTES.SIDEBAR_SEEN(prefix),
        method: 'POST',
        body: { section },
      }),
      transformResponse: mapCounts,
      async onQueryStarted({ prefix, section }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          sidebarCountsApi.util.updateQueryData('getSidebarCounts', prefix, (draft) => {
            if (draft && section in draft) draft[section] = 0;
          })
        );
        try {
          const { data: counts } = await queryFulfilled;
          if (counts && Object.keys(counts).length) {
            dispatch(sidebarCountsApi.util.upsertQueryData('getSidebarCounts', prefix, counts));
          }
        } catch {
          patch.undo();
        }
      },
    }),
  }),
});

export const { useGetSidebarCountsQuery, useMarkSidebarSeenMutation } = sidebarCountsApi;
