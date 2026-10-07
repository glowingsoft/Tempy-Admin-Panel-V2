import { createApi } from '@reduxjs/toolkit/query/react';

import { extractBranchesList, mapAgencyBranchFromApi } from 'src/sections/branches/agency-branch-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const agencyBranchesApi = createApi({
  reducerPath: 'agencyBranchesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AgencyBranch'],

  endpoints: (builder) => ({
    getAgencyBranches: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.AGENCY_BRANCHES,
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
              ...result.data.map((branch) => ({ type: 'AgencyBranch', id: branch.id })),
              { type: 'AgencyBranch', id: 'LIST' },
            ]
          : [{ type: 'AgencyBranch', id: 'LIST' }],
    }),

    createAgencyBranch: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AGENCY_BRANCHES,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'AgencyBranch', id: 'LIST' }],
    }),

    /** PUT /web/agency/branches/:id — full update (name, location, status). */
    updateAgencyBranch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.AGENCY_BRANCHES_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AgencyBranch', id },
        { type: 'AgencyBranch', id: 'LIST' },
      ],
    }),

    deleteAgencyBranch: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.AGENCY_BRANCHES_BY_ID(id),
        method: 'DELETE',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patches = [
          dispatch(
            agencyBranchesApi.util.updateQueryData('getAgencyBranches', {}, (draft) => {
              if (!Array.isArray(draft?.data)) return;
              draft.data = draft.data.filter(
                (branch) => branch.id !== id && branch._id !== id
              );
              if (draft.meta?.totalRecords != null) {
                draft.meta.totalRecords = Math.max(0, draft.meta.totalRecords - 1);
              }
              draft.total_length = draft.data.length;
            })
          ),
          dispatch(
            agencyBranchesApi.util.updateQueryData('getAgencyBranches', undefined, (draft) => {
              if (!Array.isArray(draft?.data)) return;
              draft.data = draft.data.filter(
                (branch) => branch.id !== id && branch._id !== id
              );
              if (draft.meta?.totalRecords != null) {
                draft.meta.totalRecords = Math.max(0, draft.meta.totalRecords - 1);
              }
              draft.total_length = draft.data.length;
            })
          ),
        ];

        try {
          await queryFulfilled;
        } catch {
          patches.forEach((patch) => patch.undo());
        }
      },
      invalidatesTags: (result, error, id) => [
        { type: 'AgencyBranch', id },
        { type: 'AgencyBranch', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAgencyBranchesQuery,
  useCreateAgencyBranchMutation,
  useUpdateAgencyBranchMutation,
  useDeleteAgencyBranchMutation,
} = agencyBranchesApi;
