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

export const homeCareCompanyStaffApi = createApi({
  reducerPath: 'homeCareCompanyStaffApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['HomeCareCompanyStaff', 'HomeCareCompanyNurse'],

  endpoints: (builder) => ({
    getHomeCareCompanyStaff: builder.query({
      query: ({ page = 0, limit = 10, status = '', keyword = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (status && status !== 'all') params.status = status;

        return {
          url: API_ROUTES.HOME_CARE_COMPANY_STAFF,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        const data = list
          .map(mapAgencyStaffFromApi)
          .filter((staff) => staff.id);

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
              ...result.data.map((staff) => ({ type: 'HomeCareCompanyStaff', id: staff.id })),
              { type: 'HomeCareCompanyStaff', id: 'LIST' },
            ]
          : [{ type: 'HomeCareCompanyStaff', id: 'LIST' }],
    }),

    getHomeCareCompanyStaffNurses: builder.query({
      query: ({ keyword = '', email = '', page = 0, limit = 100 } = {}) => {
        const params = {
          page: page + 1,
          limit,
          userType: 'nurse',
        };
        if (keyword) params.keyword = keyword;
        if (email) params.email = email;

        return {
          url: API_ROUTES.HOME_CARE_COMPANY_STAFF_NURSES,
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
          ? [
              ...result.data.map((nurse) => ({ type: 'HomeCareCompanyNurse', id: nurse.id })),
              { type: 'HomeCareCompanyNurse', id: 'LIST' },
            ]
          : [{ type: 'HomeCareCompanyNurse', id: 'LIST' }],
    }),

    getHomeCareCompanyStaffById: builder.query({
      query: (id) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_STAFF_BY_ID(id),
        method: 'GET',
      }),
      transformResponse: (response, _meta, id) =>
        mapAgencyStaffDetailFromApi(response?.data || response || {}, id),
      providesTags: (_result, _error, id) => [{ type: 'HomeCareCompanyStaff', id }],
    }),

    createHomeCareCompanyStaff: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_STAFF,
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'HomeCareCompanyStaff', id: 'LIST' },
        { type: 'HomeCareCompanyNurse', id: 'LIST' },
      ],
    }),

    updateHomeCareCompanyStaff: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_STAFF_BY_ID(id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'HomeCareCompanyStaff', id },
        { type: 'HomeCareCompanyStaff', id: 'LIST' },
      ],
    }),

    /** POST /web/home-care-company/staff/import — multipart CSV upload. */
    importHomeCareCompanyStaff: builder.mutation({
      query: (file) => {
        const formData = new FormData();
        formData.append(IMPORT_FILE_FIELD, file);

        return {
          url: API_ROUTES.HOME_CARE_COMPANY_STAFF_IMPORT,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: [
        { type: 'HomeCareCompanyStaff', id: 'LIST' },
        { type: 'HomeCareCompanyNurse', id: 'LIST' },
      ],
    }),

    /** GET /web/home-care-company/staff/import/template — returns the CSV itself. */
    getHomeCareCompanyStaffImportTemplate: builder.query({
      query: () => ({
        url: API_ROUTES.HOME_CARE_COMPANY_STAFF_IMPORT_TEMPLATE,
        method: 'GET',
        responseHandler: fileResponseHandler,
        cache: 'no-store',
      }),
      keepUnusedDataFor: 0,
    }),

    deleteHomeCareCompanyStaff: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.HOME_CARE_COMPANY_STAFF_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'HomeCareCompanyStaff', id },
        { type: 'HomeCareCompanyStaff', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetHomeCareCompanyStaffQuery,
  useGetHomeCareCompanyStaffByIdQuery,
  useGetHomeCareCompanyStaffNursesQuery,
  useCreateHomeCareCompanyStaffMutation,
  useImportHomeCareCompanyStaffMutation,
  useLazyGetHomeCareCompanyStaffImportTemplateQuery,
  useUpdateHomeCareCompanyStaffMutation,
  useDeleteHomeCareCompanyStaffMutation,
} = homeCareCompanyStaffApi;
