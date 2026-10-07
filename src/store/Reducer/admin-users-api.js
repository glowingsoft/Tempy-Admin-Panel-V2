import { createApi } from '@reduxjs/toolkit/query/react';

import {
  buildAdminUserStatusPayload,
  extractAdminUsersList,
  mapAdminUserFromApi,
} from 'src/sections/admin/shared/admin-users-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';


export const adminUsersApi = createApi({
  reducerPath: 'adminUsersApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AdminUser'],

  endpoints: (builder) => ({
    getAdminUsers: builder.query({
      query: ({ userType, page = 0, limit = 200, keyword = '', status = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (userType) params.userType = userType;
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.ADMIN_USERS,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const list = extractAdminUsersList(response);
        const data = list
          .map(mapAdminUserFromApi)
          .filter((item) => item.id);

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
        };
      },
      providesTags: (result, _error, arg) => {
        const listTag = { type: 'AdminUser', id: `LIST-${arg?.userType || 'all'}` };
        if (!result?.data?.length) return [listTag];
        return [
          ...result.data.map((item) => ({ type: 'AdminUser', id: item.id })),
          listTag,
        ];
      },
    }),

    getAdminUserById: builder.query({
      query: (id) => ({
        url: API_ROUTES.ADMIN_USERS_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response) => {
        const raw = response?.data ?? response;
        const item =
          raw && typeof raw === 'object' && !Array.isArray(raw)
            ? raw.user ||
              raw.careHome ||
              raw.hospital ||
              raw.agency ||
              raw.staff ||
              raw.record ||
              (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) ? raw.data : raw)
            : raw;
        return mapAdminUserFromApi(item || {});
      },
      providesTags: (_result, _error, id) => [{ type: 'AdminUser', id }],
    }),

    updateAdminUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: API_ROUTES.ADMIN_USERS_BY_ID(id),
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: buildAdminUserStatusPayload(status),
      }),
      invalidatesTags: (_result, _error, { id, userType }) => [
        { type: 'AdminUser', id },
        { type: 'AdminUser', id: `LIST-${userType || 'all'}` },
        { type: 'AdminUser', id: 'LIST-all' },
      ],
    }),
  }),
});

export const {
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useUpdateAdminUserStatusMutation,
} = adminUsersApi;
