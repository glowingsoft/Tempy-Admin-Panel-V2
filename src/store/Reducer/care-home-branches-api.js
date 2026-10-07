import { createApi } from '@reduxjs/toolkit/query/react';

import { extractBranchesList, mapAgencyBranchFromApi } from 'src/sections/branches/agency-branch-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const careHomeBranchesApi = createApi({
  reducerPath: 'careHomeBranchesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['CareHomeBranch'],

  endpoints: (builder) => ({
    getCareHomeBranches: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.CARE_HOME_BRANCHES,
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
              ...result.data.map((branch) => ({ type: 'CareHomeBranch', id: branch.id })),
              { type: 'CareHomeBranch', id: 'LIST' },
            ]
          : [{ type: 'CareHomeBranch', id: 'LIST' }],
    }),

    createCareHomeBranch: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.CARE_HOME_BRANCHES,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CareHomeBranch', id: 'LIST' }],
    }),

    /** PUT /web/care-home/branches/:id — full update (name, location, status). */
    updateCareHomeBranch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.CARE_HOME_BRANCHES_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'CareHomeBranch', id },
        { type: 'CareHomeBranch', id: 'LIST' },
      ],
    }),

    /** DELETE /web/care-home/branches/:id */
    deleteCareHomeBranch: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.CARE_HOME_BRANCHES_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'CareHomeBranch', id },
        { type: 'CareHomeBranch', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetCareHomeBranchesQuery,
  useCreateCareHomeBranchMutation,
  useUpdateCareHomeBranchMutation,
  useDeleteCareHomeBranchMutation,
} = careHomeBranchesApi;
