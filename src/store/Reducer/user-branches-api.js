import { createApi } from '@reduxjs/toolkit/query/react';
import { useSelector } from 'react-redux';

import { getProfileUserId } from 'src/sections/account/account-profile-utils';

import {
  extractUserAddressesList,
  mapUserAddressFromApi,
} from 'src/sections/branches/user-address-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

function resolveUserAddressOwnerId(state) {
  const impersonation = state?.impersonation;

  if (
    impersonation?.isActive &&
    impersonation?.targetType === 'individual_home_care' &&
    impersonation?.targetId
  ) {
    return String(impersonation.targetId).trim();
  }

  return getProfileUserId(state?.user?.user);
}

export const userBranchesApi = createApi({
  reducerPath: 'userBranchesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['UserBranch'],

  endpoints: (builder) => ({
    getUserBranches: builder.query({
      query: ({ page = 0, limit = 50, status = '', keyword = '' } = {}) => {
        const params = {};
        if (page != null) params.page = page + 1;
        if (limit != null) params.limit = limit;
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.USER_ADDRESS,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const list = extractUserAddressesList(response);
        const data = list.map(mapUserAddressFromApi).filter((item) => item?.id);

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
              ...result.data.map((branch) => ({ type: 'UserBranch', id: branch.id })),
              { type: 'UserBranch', id: 'LIST' },
            ]
          : [{ type: 'UserBranch', id: 'LIST' }],
    }),

    createUserBranch: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.USER_ADDRESS,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'UserBranch', id: 'LIST' }],
    }),

    updateUserBranch: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.USER_ADDRESS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'UserBranch', id },
        { type: 'UserBranch', id: 'LIST' },
      ],
    }),

    deleteUserBranch: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.USER_ADDRESS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'UserBranch', id },
        { type: 'UserBranch', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUserBranchesQuery,
  useCreateUserBranchMutation,
  useUpdateUserBranchMutation,
  useDeleteUserBranchMutation,
} = userBranchesApi;

export const useGetUserAddressesQuery = useGetUserBranchesQuery;
export const useCreateUserAddressMutation = useCreateUserBranchMutation;
export const useUpdateUserAddressMutation = useUpdateUserBranchMutation;
export const useDeleteUserAddressMutation = useDeleteUserBranchMutation;

/** Skips until impersonation target or logged-in profile id is available. */
export function useUserAddressesQuery(overrides = {}, queryOptions = {}) {
  const state = useSelector((root) => root);
  const ownerId = resolveUserAddressOwnerId(state);
  const skip = Boolean(queryOptions.skip) || !ownerId;

  return useGetUserBranchesQuery(
    { page: 0, limit: 100, ...overrides },
    { ...queryOptions, skip }
  );
}
