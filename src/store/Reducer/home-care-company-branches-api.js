import { createApi } from '@reduxjs/toolkit/query/react';

import { extractBranchesList, mapAgencyBranchFromApi } from 'src/sections/branches/agency-branch-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const homeCareCompanyBranchesApi = createApi({
  reducerPath: 'homeCareCompanyBranchesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['HomeCareCompanyBranch'],

  endpoints: (builder) => ({
    getHomeCareCompanyBranches: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.HOME_CARE_COMPANY_BRANCHES,
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
              ...result.data.map((branch) => ({ type: 'HomeCareCompanyBranch', id: branch.id })),
              { type: 'HomeCareCompanyBranch', id: 'LIST' },
            ]
          : [{ type: 'HomeCareCompanyBranch', id: 'LIST' }],
    }),

    createHomeCareCompanyBranch: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_BRANCHES,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'HomeCareCompanyBranch', id: 'LIST' }],
    }),

    /** PUT /web/home-care-company/branches/:id — full update (name, location, status). */
    updateHomeCareCompanyBranch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_BRANCHES_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HomeCareCompanyBranch', id },
        { type: 'HomeCareCompanyBranch', id: 'LIST' },
      ],
    }),

    /** DELETE /web/home-care-company/branches/:id */
    deleteHomeCareCompanyBranch: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_BRANCHES_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'HomeCareCompanyBranch', id },
        { type: 'HomeCareCompanyBranch', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHomeCareCompanyBranchesQuery,
  useCreateHomeCareCompanyBranchMutation,
  useUpdateHomeCareCompanyBranchMutation,
  useDeleteHomeCareCompanyBranchMutation,
} = homeCareCompanyBranchesApi;
