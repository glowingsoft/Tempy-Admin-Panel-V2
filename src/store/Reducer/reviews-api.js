import { createApi } from '@reduxjs/toolkit/query/react';

import { extractReviewsList, isApiReviewed, mapReviewFromApi, pickApiReview } from 'src/sections/reviews/reviews-api-utils';

import { extractNurseBookingsList, mapNurseBookingFromApi } from 'src/sections/staff-member/jobs/nurse-checkin-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

const EMPLOYER_BOOKING_ROUTES = {
  careHome: API_ROUTES.CARE_HOME_BOOKING,
  hospital: API_ROUTES.HOSPITAL_BOOKING,
  localAuthority: API_ROUTES.LOCAL_AUTHORITY_BOOKING,
  user: API_ROUTES.USER_BOOKING,
  homeCareCompany: API_ROUTES.HOME_CARE_COMPANY_BOOKING,
};

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['Review'],

  endpoints: (builder) => ({
    getReviews: builder.query({
      query: ({ page = 0, limit = 100, keyword = '', reviewType = '', objectId = '' } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };
        if (keyword) params.keyword = keyword;
        if (reviewType) params.reviewType = reviewType;
        if (objectId) params.objectId = objectId;

        return {
          url: API_ROUTES.REVIEWS,
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const list = extractReviewsList(response)
          .map(mapReviewFromApi)
          .filter((item) => item.id);

        return {
          data: list,
          meta: response?.meta || {},
          message: response?.message || '',
          total_length: response?.meta?.totalRecords ?? list.length,
        };
      },
      serializeQueryArgs: ({ queryArgs }) => `reviews-${queryArgs?.reviewType || 'all'}-${queryArgs?.objectId || 'all'}-${queryArgs?.page ?? 0}-${queryArgs?.limit ?? 100}`,
      providesTags: (result, _error, arg) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'Review', id: item.id })),
              {
                type: 'Review',
                id: `LIST-${arg?.reviewType || 'all'}-${arg?.objectId || 'all'}`,
              },
            ]
          : [
              {
                type: 'Review',
                id: `LIST-${arg?.reviewType || 'all'}-${arg?.objectId || 'all'}`,
              },
            ],
    }),

    /** GET /reviews/all/:nurseId — every review whose objectUser is this nurse (booking reviews included). */
    getNurseReviews: builder.query({
      query: ({ nurseId, page = 0, limit = 100 } = {}) => ({
        url: API_ROUTES.REVIEWS_BY_NURSE(nurseId),
        method: 'GET',
        params: { page: page + 1, limit },
      }),
      transformResponse: (response) => {
        const list = extractReviewsList(response)
          .map(mapReviewFromApi)
          .filter((item) => item.id);

        return {
          data: list,
          meta: response?.meta || {},
          total_length: response?.meta?.totalRecords ?? list.length,
        };
      },
      providesTags: (result, _error, arg) => [...(result?.data || []).map((item) => ({ type: 'Review', id: item.id })), { type: 'Review', id: `NURSE-${arg?.nurseId || ''}` }],
    }),

    /**
     * GET /web/<role>/booking[?job=<jobId>] — employer's bookings (all, or for one job), used to
     * find the completed booking a "Rate worker" review targets and to match reviews back to jobs.
     */
    getJobReviewBookings: builder.query({
      query: ({ mode = 'careHome', jobId = '', limit = 50 } = {}) => ({
        url: EMPLOYER_BOOKING_ROUTES[mode] || API_ROUTES.CARE_HOME_BOOKING,
        method: 'GET',
        params: { ...(jobId ? { job: jobId } : {}), page: 1, limit },
      }),
      transformResponse: (response) =>
        extractNurseBookingsList(response).map((item) => ({
          ...mapNurseBookingFromApi(item),
          jobStatus: String(item?.jobStatus || item?.job?.status || '').toLowerCase(),
          review: pickApiReview(item),
          isReviewed: isApiReviewed(item),
        })),
      providesTags: [{ type: 'Review', id: 'EMPLOYER-BOOKINGS' }],
    }),

    createReview: builder.mutation({
      query: (body) => ({
        url: API_ROUTES.REVIEWS,
        method: 'POST',
        body: {
          reviewType: body.reviewType,
          objectId: body.objectId,
          rating: Number(body.rating),
          comment: body.comment || '',
        },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Review', id: `LIST-${arg?.reviewType || 'all'}-${arg?.objectId || 'all'}` },
        { type: 'Review', id: 'LIST-all-all' },
        { type: 'Review', id: 'EMPLOYER-BOOKINGS' },
      ],
    }),

    updateReview: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API_ROUTES.REVIEWS_BY_ID(id),
        method: 'PUT',
        body: {
          ...(body.reviewType ? { reviewType: body.reviewType } : {}),
          ...(body.objectId ? { objectId: body.objectId } : {}),
          ...(body.rating != null ? { rating: Number(body.rating) } : {}),
          ...(body.comment != null ? { comment: body.comment } : {}),
        },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Review', id: arg.id },
        { type: 'Review', id: `LIST-${arg?.reviewType || 'all'}-${arg?.objectId || 'all'}` },
        { type: 'Review', id: 'LIST-all-all' },
        { type: 'Review', id: 'EMPLOYER-BOOKINGS' },
      ],
    }),

    deleteReview: builder.mutation({
      query: (id) => ({
        url: API_ROUTES.REVIEWS_BY_ID(id),
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Review', id },
        { type: 'Review', id: 'LIST-all-all' },
        { type: 'Review', id: 'EMPLOYER-BOOKINGS' },
      ],
    }),
  }),
});

export const { useGetReviewsQuery, useLazyGetReviewsQuery, useGetNurseReviewsQuery, useGetJobReviewBookingsQuery, useLazyGetJobReviewBookingsQuery, useCreateReviewMutation, useUpdateReviewMutation, useDeleteReviewMutation } = reviewsApi;
