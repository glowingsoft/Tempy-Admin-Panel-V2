import { createApi } from '@reduxjs/toolkit/query/react';

import { buildAdminSettingPayload, normalizeSettingsContentResponse, SETTINGS_ROUTE_KEYS_BY_ACCOUNT } from 'src/sections/dashboard-settings/dashboard-settings-api-utils';
import { mapAdminPermanentHirePage } from 'src/sections/admin/recruitment/admin-recruitment-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

function resolveSettingsUrls(accountKey) {
  const keys = SETTINGS_ROUTE_KEYS_BY_ACCOUNT[accountKey];
  if (!keys) {
    return { termsUrl: '', aboutUrl: '', privacyUrl: '', contactUrl: '' };
  }
  return {
    termsUrl: API_ROUTES[keys.terms] || '',
    aboutUrl: API_ROUTES[keys.about] || '',
    privacyUrl: API_ROUTES[keys.privacy] || '',
    contactUrl: API_ROUTES[keys.contact] || '',
  };
}

export const dashboardSettingsApi = createApi({
  reducerPath: 'dashboardSettingsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['SettingsContent', 'AdminLegal', 'TermsStatus', 'TempToPerm', 'AdminPermanentHire'],

  endpoints: (builder) => ({
    /** GET /settings/terms-conditions */
    getTermsConditions: builder.query({
      query: ({ accountKey } = {}) => ({
        url: resolveSettingsUrls(accountKey).termsUrl,
        method: 'GET',
      }),
      transformResponse: normalizeSettingsContentResponse,
      providesTags: (_r, _e, arg) => [{ type: 'SettingsContent', id: `TERMS-${arg?.accountKey || 'unknown'}` }],
    }),

    /** GET /settings/terms-conditions/status — has the supplier accepted the current version? */
    getTermsStatus: builder.query({
      query: () => ({ url: API_ROUTES.TERMS_STATUS, method: 'GET' }),
      transformResponse: (response) => response?.data || {},
      providesTags: ['TermsStatus'],
    }),

    /** POST /settings/terms-conditions/accept — records acceptance of the current version */
    acceptTerms: builder.mutation({
      query: () => ({ url: API_ROUTES.TERMS_ACCEPT, method: 'POST' }),
      invalidatesTags: ['TermsStatus'],
    }),

    /** GET /settings/about-us (role dashboards) */
    getAboutUs: builder.query({
      query: ({ accountKey } = {}) => ({
        url: resolveSettingsUrls(accountKey).aboutUrl,
        method: 'GET',
      }),
      transformResponse: normalizeSettingsContentResponse,
      providesTags: (_r, _e, arg) => [{ type: 'SettingsContent', id: `ABOUT-${arg?.accountKey || 'unknown'}` }],
    }),

    /** GET /settings/privacy-policy */
    getPrivacyPolicy: builder.query({
      query: ({ accountKey } = {}) => ({
        url: resolveSettingsUrls(accountKey).privacyUrl,
        method: 'GET',
      }),
      transformResponse: normalizeSettingsContentResponse,
      providesTags: (_r, _e, arg) => [{ type: 'SettingsContent', id: `PRIVACY-${arg?.accountKey || 'unknown'}` }],
    }),

    /**
     * POST /contact-us
     * Body: { name, email, phoneNumber?, subject, message, description }
     */
    createContactUs: builder.mutation({
      query: ({ accountKey, ...body }) => ({
        url: resolveSettingsUrls(accountKey).contactUrl,
        method: 'POST',
        body,
      }),
    }),

    /** Admin — GET /settings/about-us */
    getAdminAboutUs: builder.query({
      query: () => ({
        url: API_ROUTES.ADMIN_ABOUT_US,
        method: 'GET',
      }),
      transformResponse: normalizeSettingsContentResponse,
      providesTags: [{ type: 'AdminLegal', id: 'ABOUT' }],
    }),

    /** Admin — GET /settings/privacy-policy */
    getAdminPrivacyPolicy: builder.query({
      query: () => ({
        url: API_ROUTES.ADMIN_PRIVACY_POLICY,
        method: 'GET',
      }),
      transformResponse: normalizeSettingsContentResponse,
      providesTags: [{ type: 'AdminLegal', id: 'PRIVACY' }],
    }),

    /** Admin — GET /settings/terms-conditions */
    getAdminTermsConditions: builder.query({
      query: () => ({
        url: API_ROUTES.ADMIN_TERMS_CONDITIONS,
        method: 'GET',
      }),
      transformResponse: normalizeSettingsContentResponse,
      providesTags: [{ type: 'AdminLegal', id: 'TERMS' }],
    }),

    /**
     * Admin — PUT /admin/settings/update/:id
     * Body key depends on pageType: about_us | privacy_policy | terms_conditions
     */
    updateAdminLegalSetting: builder.mutation({
      query: ({ id, pageType = 'about', content = '', contentKey = '' }) => ({
        url: API_ROUTES.ADMIN_SETTINGS_UPDATE_BY_ID(id),
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: buildAdminSettingPayload(pageType, { content, contentKey }),
      }),
      invalidatesTags: (_r, _e, arg) => {
        const map = { about: 'ABOUT', policy: 'PRIVACY', terms: 'TERMS' };
        return [{ type: 'AdminLegal', id: map[arg?.pageType] || 'ABOUT' }];
      },
    }),

    /** Admin — GET /admin/permanent-hires/settings → { minShifts, weeklyHoursLimit, fee } */
    getAdminTempToPermSettings: builder.query({
      query: () => ({ url: API_ROUTES.PERMANENT_HIRE_SETTINGS('/admin'), method: 'GET' }),
      transformResponse: (response) => {
        const data = response?.data || {};
        return {
          ...data,
          id: data._id || data.id || '',
          minShifts: data.minShifts ?? data.temp_to_perm_min_shifts,
          weeklyHoursLimit: data.weeklyHoursLimit ?? data.weekly_hours_limit,
        };
      },
      providesTags: ['TempToPerm'],
    }),

    /** Admin — GET /admin/permanent-hires?status=&page=&limit= */
    getAdminPermanentHires: builder.query({
      query: ({ status = 'pending', page = 0, limit = 10 } = {}) => ({
        url: API_ROUTES.PERMANENT_HIRES('/admin'),
        method: 'GET',
        params: { status, page: page + 1, limit },
      }),
      transformResponse: (response, _meta, arg) => mapAdminPermanentHirePage(response, arg?.status),
      providesTags: ['AdminPermanentHire'],
    }),

    /** Admin — GET /admin/permanent-hires/hired?page=&limit= */
    getAdminHiredPermanentHires: builder.query({
      query: ({ page = 0, limit = 10 } = {}) => ({
        url: `${API_ROUTES.PERMANENT_HIRES('/admin')}/hired`,
        method: 'GET',
        params: { page: page + 1, limit },
      }),
      transformResponse: (response) => mapAdminPermanentHirePage(response, 'hired'),
      providesTags: ['AdminPermanentHire'],
    }),

    /** Admin — PUT /admin/permanent-hires/:id/end */
    endAdminPermanentHire: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.PERMANENT_HIRE_ACTION('/admin', id, 'end'),
        method: 'PUT',
      }),
      invalidatesTags: ['AdminPermanentHire'],
    }),

    /** Admin — PUT /admin/settings/update/:id { temp_to_perm_min_shifts, weekly_hours_limit } */
    updateAdminTempToPermSettings: builder.mutation({
      query: ({ id, minShifts, weeklyHoursLimit }) => ({
        url: API_ROUTES.ADMIN_SETTINGS_UPDATE_BY_ID(id),
        method: 'PUT',
        body: {
          temp_to_perm_min_shifts: minShifts,
          weekly_hours_limit: weeklyHoursLimit,
        },
      }),
      invalidatesTags: ['TempToPerm'],
    }),
  }),
});

export const {
  useGetTermsConditionsQuery,
  useGetTermsStatusQuery,
  useAcceptTermsMutation,
  useGetAboutUsQuery,
  useGetPrivacyPolicyQuery,
  useCreateContactUsMutation,
  useGetAdminAboutUsQuery,
  useGetAdminPrivacyPolicyQuery,
  useGetAdminTermsConditionsQuery,
  useUpdateAdminLegalSettingMutation,
  useGetAdminTempToPermSettingsQuery,
  useUpdateAdminTempToPermSettingsMutation,
  useGetAdminPermanentHiresQuery,
  useGetAdminHiredPermanentHiresQuery,
  useEndAdminPermanentHireMutation,
} = dashboardSettingsApi;
