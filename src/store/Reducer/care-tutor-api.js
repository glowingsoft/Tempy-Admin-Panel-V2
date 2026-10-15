import { createApi } from '@reduxjs/toolkit/query/react';

import {
  mapCareTutorCertificateFromApi,
  mapCareTutorStaffTrainingFromApi,
} from 'src/sections/care-tutor/care-tutor-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const careTutorApi = createApi({
  reducerPath: 'careTutorApi',
  baseQuery: createCustomFetchBaseQuery(),
  keepUnusedDataFor: 60,
  refetchOnMountOrArgChange: 60,
  tagTypes: ['CareTutorTraining', 'CareTutorSettings'],

  endpoints: (builder) => ({
    /** POST /integrations/caretutor/connect — link employer Care Tutor account */
    connectCareTutor: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.CARE_TUTOR_CONNECT,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'CareTutorSettings', id: 'ORG' }],
    }),

    /** GET /staff/:staffId/training — verified certificates + matrix */
    getStaffCareTutorTraining: builder.query({
      query: (staffId) => ({
        url: API_ROUTES.CARE_TUTOR_STAFF_TRAINING(staffId),
        method: 'GET',
      }),
      transformResponse: (response) => {
        const payload = response?.data || response || {};
        return mapCareTutorStaffTrainingFromApi(payload);
      },
      providesTags: (_result, _error, staffId) => [
        { type: 'CareTutorTraining', id: staffId },
      ],
    }),

    /** GET /app/compliance/caretutor — org-wide training matrix */
    getOrgCareTutorTraining: builder.query({
      query: ({ page = 0, limit = 50 } = {}) => ({
        url: API_ROUTES.CARE_TUTOR_ORG_TRAINING,
        method: 'GET',
        params: { page: page + 1, limit },
      }),
      transformResponse: (response) => {
        const list = Array.isArray(response?.data) ? response.data : [];
        return {
          data: list.map(mapCareTutorStaffTrainingFromApi),
          meta: response?.meta || {},
        };
      },
      providesTags: [{ type: 'CareTutorTraining', id: 'LIST' }],
    }),

    /**
     * POST /staff/:staffId/training/enrol
     * Body: { courseId, paymentMethodId? }
     * Response: { payment, enrolment, certificate? }
     */
    enrolStaffCareTutorCourse: builder.mutation({
      query: ({ staffId, ...body }) => ({
        url: API_ROUTES.CARE_TUTOR_STAFF_ENROL(staffId),
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'CareTutorTraining', id: arg?.staffId },
        { type: 'CareTutorTraining', id: 'LIST' },
      ],
    }),

    /** GET /admin/settings/training-commission */
    getTrainingCommissionSettings: builder.query({
      query: () => ({
        url: API_ROUTES.ADMIN_TRAINING_COMMISSION,
        method: 'GET',
      }),
      providesTags: [{ type: 'CareTutorSettings', id: 'COMMISSION' }],
    }),

    /** PUT /admin/settings/training-commission — { platformPercent } */
    updateTrainingCommissionSettings: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.ADMIN_TRAINING_COMMISSION,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [{ type: 'CareTutorSettings', id: 'COMMISSION' }],
    }),
  }),
});

export const {
  useConnectCareTutorMutation,
  useGetStaffCareTutorTrainingQuery,
  useGetOrgCareTutorTrainingQuery,
  useEnrolStaffCareTutorCourseMutation,
  useGetTrainingCommissionSettingsQuery,
  useUpdateTrainingCommissionSettingsMutation,
} = careTutorApi;

export { mapCareTutorCertificateFromApi };
