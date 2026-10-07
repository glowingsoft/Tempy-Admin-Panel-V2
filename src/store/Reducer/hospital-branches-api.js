import { createApi } from '@reduxjs/toolkit/query/react';

import { extractBranchesList, mapAgencyBranchFromApi } from 'src/sections/branches/agency-branch-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const hospitalBranchesApi = createApi({
  reducerPath: 'hospitalBranchesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['HospitalBranch'],

  endpoints: (builder) => ({
    getHospitalBranches: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.HOSPITAL_BRANCHES,
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
              ...result.data.map((branch) => ({ type: 'HospitalBranch', id: branch.id })),
              { type: 'HospitalBranch', id: 'LIST' },
            ]
          : [{ type: 'HospitalBranch', id: 'LIST' }],
    }),

    createHospitalBranch: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.HOSPITAL_BRANCHES,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'HospitalBranch', id: 'LIST' }],
    }),

    /** PUT /web/hospital/branches/:id — full update (name, location, status). */
    updateHospitalBranch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.HOSPITAL_BRANCHES_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'HospitalBranch', id },
        { type: 'HospitalBranch', id: 'LIST' },
      ],
    }),

    /** DELETE /web/hospital/branches/:id */
    deleteHospitalBranch: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.HOSPITAL_BRANCHES_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'HospitalBranch', id },
        { type: 'HospitalBranch', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHospitalBranchesQuery,
  useCreateHospitalBranchMutation,
  useUpdateHospitalBranchMutation,
  useDeleteHospitalBranchMutation,
} = hospitalBranchesApi;
