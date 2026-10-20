import { createApi } from '@reduxjs/toolkit/query/react';

import {
  collectSummaryCards,
  countAllegationCards,
  extractAllegationList,
  mapAllegationFromApi,
  mapReplacementWorker,
  collectShifts,
} from 'src/sections/admin/allegations/admin-allegations-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

export const adminAllegationsApi = createApi({
  reducerPath: 'adminAllegationsApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['AdminAllegation'],

  endpoints: (builder) => ({
    getAdminAllegations: builder.query({
      query: ({ page = 0, limit = 10, status = '', keyword = '', type = '', worker = '' } = {}) => {
        const params = { page: page + 1, limit };
        if (status && status !== 'all') params.status = status;
        if (keyword) params.keyword = keyword;
        if (type && type !== 'all') params.type = type;
        if (worker) params.worker = worker;

        return { url: API_ROUTES.ADMIN_ALLEGATIONS, method: 'GET', params };
      },
      refetchOnFocus: false,
      refetchOnReconnect: false,
      transformResponse: (response) => {
        let data = [];
        try {
          data = extractAllegationList(response).map(mapAllegationFromApi).filter((item) => item.id);
        } catch {
          data = [];
        }
        const totalRaw =
          response?.meta?.totalRecords ??
          response?.meta?.total ??
          response?.pagination?.totalRecords ??
          response?.pagination?.total ??
          response?.data?.meta?.totalRecords ??
          response?.data?.pagination?.totalRecords ??
          response?.data?.pagination?.total ??
          response?.total ??
          response?.data?.total;
        const hasTotal = totalRaw !== undefined && totalRaw !== null && totalRaw !== '';
        const totalRecords = hasTotal ? Number(totalRaw) || 0 : null;

        const cards = collectSummaryCards(
          response?.meta?.summary ||
            response?.summary ||
            response?.counts ||
            response?.data?.summary ||
            response?.data?.counts ||
            response?.meta?.counts
        );

        return {
          data,
          total: totalRecords ?? data.length,
          meta: { totalRecords, hasTotal },
          cards,
          cardCounts: countAllegationCards(response, data),
        };
      },
      providesTags: (result) =>
        result?.data?.length
          ? [
              ...result.data.map((item) => ({ type: 'AdminAllegation', id: item.id })),
              { type: 'AdminAllegation', id: 'LIST' },
            ]
          : [{ type: 'AdminAllegation', id: 'LIST' }],
    }),

    getAdminAllegationById: builder.query({
      query: (id) => ({ url: API_ROUTES.ADMIN_ALLEGATION_BY_ID(id), method: 'GET' }),
      refetchOnFocus: false,
      refetchOnReconnect: false,
      transformResponse: (response) => {
        const raw = response?.data && typeof response.data === 'object' && !Array.isArray(response.data) ? response.data : response || {};
        const item = raw.allegation || raw.record || raw;
        const shifts = collectShifts(item).length ? collectShifts(item) : collectShifts(raw);
        return mapAllegationFromApi({ ...item, affectedShifts: shifts });
      },
      providesTags: (_result, _error, id) => [{ type: 'AdminAllegation', id }],
    }),

    raiseAdminAllegation: builder.mutation({
      query: ({ workerId, allegationType, description, employerName }) => ({
        url: API_ROUTES.ADMIN_ALLEGATIONS,
        method: 'POST',
        body: {
          workerId,
          allegationType,
          description,
          ...(employerName ? { employerName } : {}),
        },
      }),
      invalidatesTags: [{ type: 'AdminAllegation', id: 'LIST' }],
    }),

    updateAdminAllegationStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: API_ROUTES.ADMIN_ALLEGATION_STATUS(id),
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'AdminAllegation', id },
        { type: 'AdminAllegation', id: 'LIST' },
      ],
    }),

    getAllegationReplacements: builder.query({
      query: ({ allegationId, shiftId }) => ({
        url: API_ROUTES.ADMIN_ALLEGATION_REPLACEMENTS(allegationId, shiftId),
        method: 'GET',
      }),
      transformResponse: (response) => {
        const data = response?.data;
        const candidates = [
          response,
          data,
          data?.workers,
          data?.replacements,
          data?.staff,
          data?.nurses,
          data?.docs,
          data?.items,
          data?.list,
          data?.rows,
          response?.workers,
          response?.replacements,
        ];
        const list = candidates.find(Array.isArray) || [];
        return list.map(mapReplacementWorker).filter((worker) => worker.id);
      },
    }),

    republishAllegationShift: builder.mutation({
      query: ({ allegationId, shiftId }) => ({
        url: API_ROUTES.ADMIN_ALLEGATION_REPUBLISH(allegationId, shiftId),
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, { allegationId }) => [
        { type: 'AdminAllegation', id: allegationId },
        { type: 'AdminAllegation', id: 'LIST' },
      ],
    }),

    reallocateAllegationShift: builder.mutation({
      query: ({ allegationId, shiftId, replacementWorkerId }) => ({
        url: API_ROUTES.ADMIN_ALLEGATION_REALLOCATE(allegationId, shiftId),
        method: 'POST',
        body: { replacementWorkerId },
      }),
    }),
  }),
});

export const {
  useGetAdminAllegationsQuery,
  useGetAdminAllegationByIdQuery,
  useRaiseAdminAllegationMutation,
  useUpdateAdminAllegationStatusMutation,
  useLazyGetAllegationReplacementsQuery,
  useRepublishAllegationShiftMutation,
  useReallocateAllegationShiftMutation,
} = adminAllegationsApi;
