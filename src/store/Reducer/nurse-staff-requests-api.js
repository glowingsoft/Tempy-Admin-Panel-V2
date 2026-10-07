import { createApi } from '@reduxjs/toolkit/query/react';

import {
  buildStaffRequestRespondPayload,
  extractStaffRequestsList,
  mapStaffRequestFromApi,
} from 'src/sections/staff-member/staff-requests-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const nurseStaffRequestsApi = createApi({
  reducerPath: 'nurseStaffRequestsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['NurseStaffRequest'],

  endpoints: (builder) => ({
    getNurseStaffRequests: builder.query({
      query: () => ({
        url: API_ROUTES.NURSE_STAFF_REQUESTS,
        method: 'GET',
      }),
      transformResponse: (response) => {
        const list = extractStaffRequestsList(response)
          .map(mapStaffRequestFromApi)
          .filter((item) => item.id);

        return {
          data: list,
          meta: response?.meta || {},
          message: response?.message || '',
          pendingCount:
            response?.meta?.pendingCount ??
            list.filter((item) => item.status === 'pending').length,
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'NurseStaffRequest', id: item.id })),
              { type: 'NurseStaffRequest', id: 'LIST' },
            ]
          : [{ type: 'NurseStaffRequest', id: 'LIST' }],
    }),

    respondNurseStaffRequest: builder.mutation({
      query: ({ id, action = 'accept' }) => ({
        url: API_ROUTES.NURSE_STAFF_REQUESTS_BY_ID(id),
        method: 'PUT',
        body: buildStaffRequestRespondPayload(action),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'NurseStaffRequest', id },
        { type: 'NurseStaffRequest', id: 'LIST' },
      ],
    }),
  }),
});

export const { useGetNurseStaffRequestsQuery, useRespondNurseStaffRequestMutation } =
  nurseStaffRequestsApi;
