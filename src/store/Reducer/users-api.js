import { createApi } from '@reduxjs/toolkit/query/react';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { mapUserProfileFromApi } from 'src/sections/account/account-profile-utils';

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['UserProfile'],

  endpoints: (builder) => ({
    /** GET /users/:id */
    getUserById: builder.query({
      query: (id) => ({
        url: API_ROUTES.USERS_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response) => mapUserProfileFromApi(response?.data ?? response),
      providesTags: (_result, _error, id) => [{ type: 'UserProfile', id }],
    }),

    /** PUT /users/:id */
    updateUserById: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.USERS_BY_ID(id),
        method: 'PUT',
        body,
      }),
      transformResponse: (response) => mapUserProfileFromApi(response?.data ?? response),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'UserProfile', id }],
    }),
  }),
});

export const { useGetUserByIdQuery, useUpdateUserByIdMutation } = usersApi;
