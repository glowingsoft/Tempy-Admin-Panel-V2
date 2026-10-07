import { createApi } from '@reduxjs/toolkit/query/react';

import { extractBranchesList, mapAgencyBranchFromApi } from 'src/sections/branches/agency-branch-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const localAuthorityBranchesApi = createApi({
  reducerPath: 'localAuthorityBranchesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['LocalAuthorityBranch'],

  endpoints: (builder) => ({
    getLocalAuthorityBranches: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.LOCAL_AUTHORITY_BRANCHES,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const data = extractBranchesList(response)
          .map(mapAgencyBranchFromApi)
          .filter(Boolean);

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((branch) => ({ type: 'LocalAuthorityBranch', id: branch.id })),
              { type: 'LocalAuthorityBranch', id: 'LIST' },
            ]
          : [{ type: 'LocalAuthorityBranch', id: 'LIST' }],
    }),

    createLocalAuthorityBranch: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_BRANCHES,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'LocalAuthorityBranch', id: 'LIST' }],
    }),

    /** PUT /web/local-authority/branches/:id — full update (name, location, status). */
    updateLocalAuthorityBranch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_BRANCHES_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'LocalAuthorityBranch', id },
        { type: 'LocalAuthorityBranch', id: 'LIST' },
      ],
    }),

    /** DELETE /web/local-authority/branches/:id */
    deleteLocalAuthorityBranch: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.LOCAL_AUTHORITY_BRANCHES_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'LocalAuthorityBranch', id },
        { type: 'LocalAuthorityBranch', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetLocalAuthorityBranchesQuery,
  useCreateLocalAuthorityBranchMutation,
  useUpdateLocalAuthorityBranchMutation,
  useDeleteLocalAuthorityBranchMutation,
} = localAuthorityBranchesApi;
