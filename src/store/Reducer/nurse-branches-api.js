import { createApi } from '@reduxjs/toolkit/query/react';

import { extractBranchesList, mapAgencyBranchFromApi } from 'src/sections/branches/agency-branch-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const nurseBranchesApi = createApi({
  reducerPath: 'nurseBranchesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['NurseBranch'],

  endpoints: (builder) => ({
    getNurseBranches: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.NURSE_BRANCHES,
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
              ...result.data.map((branch) => ({ type: 'NurseBranch', id: branch.id })),
              { type: 'NurseBranch', id: 'LIST' },
            ]
          : [{ type: 'NurseBranch', id: 'LIST' }],
    }),
  }),
});

export const { useGetNurseBranchesQuery } = nurseBranchesApi;
