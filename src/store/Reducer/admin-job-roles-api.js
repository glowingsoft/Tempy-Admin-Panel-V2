import { createApi } from '@reduxjs/toolkit/query/react';

import { extractAdminJobRolesList, mapAdminJobRoleFromApi } from 'src/sections/admin/job-types/admin-job-roles-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/**
 * Admin Job Types page:
 * GET/POST /admin/job-roles
 * PUT/DELETE /admin/job-roles/:id
 */
export const adminJobRolesApi = createApi({
  reducerPath: 'adminJobRolesApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AdminJobRole'],

  endpoints: (builder) => ({
    /** GET /admin/job-roles */
    getAdminJobRoles: builder.query({
      query: ({ page = 0, limit = 200, keyword = '', status = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.ADMIN_JOB_ROLES,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const list = extractAdminJobRolesList(response);
        const data = list.map(mapAdminJobRoleFromApi).filter((item) => item.id);

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [...result.data.map((item) => ({ type: 'AdminJobRole', id: item.id })), { type: 'AdminJobRole', id: 'LIST' }]
          : [{ type: 'AdminJobRole', id: 'LIST' }],
    }),

    /** POST /admin/job-roles — body: { department, title, description } */
    createAdminJobRole: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.ADMIN_JOB_ROLES,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: [{ type: 'AdminJobRole', id: 'LIST' }],
    }),

    /** PUT /admin/job-roles/:id — body: { department, title, description } */
    updateAdminJobRole: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.ADMIN_JOB_ROLES_BY_ID(id),
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AdminJobRole', id },
        { type: 'AdminJobRole', id: 'LIST' },
      ],
    }),

    /** DELETE /admin/job-roles/:id */
    deleteAdminJobRole: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.ADMIN_JOB_ROLES_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'AdminJobRole', id },
        { type: 'AdminJobRole', id: 'LIST' },
      ],
    }),
  }),
});

export const { useGetAdminJobRolesQuery, useCreateAdminJobRoleMutation, useUpdateAdminJobRoleMutation, useDeleteAdminJobRoleMutation } = adminJobRolesApi;
