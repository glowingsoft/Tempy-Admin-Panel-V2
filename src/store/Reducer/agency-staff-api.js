import { createApi } from '@reduxjs/toolkit/query/react';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import { IMPORT_FILE_FIELD, fileResponseHandler } from '../file-response';
import {
  extractAgencyNursesList,
  isNurseAccountUserType,
  mapAgencyNurseFromApi,
  mapAgencyStaffDetailFromApi,
  mapAgencyStaffFromApi,
} from 'src/sections/agency/staff/agency-staff-api-utils';

export const agencyStaffApi = createApi({
  reducerPath: 'agencyStaffApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AgencyStaff', 'AgencyNurse'],

  endpoints: (builder) => ({
    getAgencyStaff: builder.query({
      query: ({ page = 0, limit = 10, status = '', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.AGENCY_STAFF,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        const data = list.map(mapAgencyStaffFromApi).filter((staff) => staff.id);

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? data.length,
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [...result.data.map((staff) => ({ type: 'AgencyStaff', id: staff.id })), { type: 'AgencyStaff', id: 'LIST' }]
          : [{ type: 'AgencyStaff', id: 'LIST' }],
    }),

    getAgencyStaffNurses: builder.query({
      query: ({ keyword = '', email = '', page = 0, limit = 100 } = {}) => {
        const params = {
          page: page + 1,
          limit,
          userType: 'nurse',
        };
        if (keyword) params.keyword = keyword;
        if (email) params.email = email;

        return {
          url: API_ROUTES.AGENCY_STAFF_NURSES,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const data = extractAgencyNursesList(response)
          .map(mapAgencyNurseFromApi)
          .filter((nurse) => nurse.id && isNurseAccountUserType(nurse.userType));

        return {
          data,
          meta: response?.meta || {},
          message: response?.message || '',
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [...result.data.map((nurse) => ({ type: 'AgencyNurse', id: nurse.id })), { type: 'AgencyNurse', id: 'LIST' }]
          : [{ type: 'AgencyNurse', id: 'LIST' }],
    }),

    getAgencyStaffById: builder.query({
      query: (id) => ({
        url: API_ROUTES.AGENCY_STAFF_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response, _meta, id) => mapAgencyStaffDetailFromApi(response?.data || response || {}, id),
      providesTags: (result, error, id) => [{ type: 'AgencyStaff', id }],
    }),

    createAgencyStaff: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.AGENCY_STAFF,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'AgencyStaff', id: 'LIST' },
        { type: 'AgencyNurse', id: 'LIST' },
      ],
    }),

    updateAgencyStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.AGENCY_STAFF_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'AgencyStaff', id },
        { type: 'AgencyStaff', id: 'LIST' },
      ],
    }),

    /** POST /web/agency/staff/import — multipart CSV upload. */
    importAgencyStaff: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append(IMPORT_FILE_FIELD, file);

        return {
          url: API_ROUTES.AGENCY_STAFF_IMPORT,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [
        { type: 'AgencyStaff', id: 'LIST' },
        { type: 'AgencyNurse', id: 'LIST' },
      ],
    }),

    /** GET /web/agency/staff/import/template — returns the CSV itself. */
    getAgencyStaffImportTemplate: builder.query({
      query: () => ({
        url: API_ROUTES.AGENCY_STAFF_IMPORT_TEMPLATE,
        method: 'GET',
        responseHandler: fileResponseHandler,
        cache: 'no-store',
      }),
      keepUnusedDataFor: 0,
    }),

    deleteAgencyStaff: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.AGENCY_STAFF_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'AgencyStaff', id },
        { type: 'AgencyStaff', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetAgencyStaffQuery,
  useGetAgencyStaffByIdQuery,
  useGetAgencyStaffNursesQuery,
  useCreateAgencyStaffMutation,
  useImportAgencyStaffMutation,
  useLazyGetAgencyStaffImportTemplateQuery,
  useUpdateAgencyStaffMutation,
  useDeleteAgencyStaffMutation,
} = agencyStaffApi;
