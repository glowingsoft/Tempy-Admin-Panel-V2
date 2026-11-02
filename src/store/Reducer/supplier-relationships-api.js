import { createApi } from '@reduxjs/toolkit/query/react';

import {
  mapUserOption,
  mapAgreedRateFromApi,
  mapCurrentAgreedRateOptions,
  mapRelationshipFromApi,
  mapPermanentHireFromApi,
  mapEligibleWorkerFromApi,
} from 'src/sections/supplier-relationship/supplier-relationship-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';


function extractList(response) {
  const data = response?.data ?? response;
  const candidates = [
    data,
    data?.data,
    data?.permanentHires,
    data?.hires,
    data?.docs,
    data?.items,
    data?.list,
    data?.rows,
    data?.records,
    data?.results,
    response?.permanentHires,
    response?.hires,
  ];
  return candidates.find(Array.isArray) || [];
}

function mapList(mapItem) {
  return (response) => {
    const list = extractList(response);
    const data = list
      .map((item) => {
        try {
          return mapItem(item || {});
        } catch {
          return null;
        }
      })
      .filter((item) => item?.id);
    const meta = response?.meta || response?.data?.meta || {};
    const totalRecords = meta.totalRecords ?? meta.total ?? meta.total_count ?? data.length;
    return {
      data,
      meta: { ...meta, totalRecords },
      total_length: totalRecords,
    };
  };
}

function listParams({ page = 0, limit = 10, ...rest } = {}) {
  const params = { page: page + 1, limit };
  Object.entries(rest).forEach(([key, value]) => {
    if (value != null && value !== '') params[key] = value;
  });
  return params;
}


export const supplierRelationshipsApi = createApi({
  reducerPath: 'supplierRelationshipsApi',
  baseQuery: createCustomFetchBaseQuery(),
  keepUnusedDataFor: 60,
  refetchOnMountOrArgChange: 60,
  tagTypes: ['Contract', 'AgreedRate', 'PermanentHire'],

  endpoints: (builder) => ({
    getCustomerOptions: builder.query({
      query: ({ base, userType }) => ({
        url: `${API_ROUTES.AGREED_RATES(base)}/users`,
        method: 'GET',
        params: { userType, page: 1, limit: 100 },
      }),
      transformResponse: mapList(mapUserOption),
    }),


    getContracts: builder.query({
      query: ({ base, page = 0, limit = 10 } = {}) => ({
        url: API_ROUTES.CONTRACTS(base),
        method: 'GET',
        params: listParams({ page, limit }),
      }),
      transformResponse: mapList(mapRelationshipFromApi),
      providesTags: ['Contract'],
    }),

    uploadContract: builder.mutation({
      query: ({ base, ...body }) => ({ url: API_ROUTES.CONTRACTS(base), method: 'POST', body }),
      invalidatesTags: ['Contract'],
    }),

    signContract: builder.mutation({
      query: ({ base, id, action, signature }) => ({
        url: API_ROUTES.CONTRACT_ACTION(base, id, action),
        method: 'PUT',
        body: { signature },
      }),
      invalidatesTags: ['Contract'],
    }),


    getCurrentAgreedRate: builder.query({
      query: ({ base, customer, jobType }) => ({
        url: API_ROUTES.AGREED_RATES_CURRENT(base),
        method: 'GET',
        params: { customer, jobType },
        cache: 'no-store',
      }),
      transformResponse: mapCurrentAgreedRateOptions,
    }),

    getAgreedRates: builder.query({
      query: ({ base, page = 0, limit = 10 } = {}) => ({
        url: API_ROUTES.AGREED_RATES(base),
        method: 'GET',
        params: listParams({ page, limit }),
      }),
      transformResponse: mapList(mapAgreedRateFromApi),
      providesTags: ['AgreedRate'],
    }),

    createAgreedRate: builder.mutation({
      query: ({ base, ...body }) => ({ url: API_ROUTES.AGREED_RATES(base), method: 'POST', body }),
      invalidatesTags: ['AgreedRate'],
    }),

    updateAgreedRate: builder.mutation({
      query: ({ base, id, ...body }) => ({
        url: API_ROUTES.AGREED_RATE_BY_ID(base, id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AgreedRate'],
    }),

    respondToAgreedRate: builder.mutation({
      query: ({ base, id, action, ...body }) => ({
        url: API_ROUTES.AGREED_RATE_ACTION(base, id, action),
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AgreedRate'],
    }),


    getPermanentHireSettings: builder.query({
      query: ({ base }) => ({ url: API_ROUTES.PERMANENT_HIRE_SETTINGS(base), method: 'GET' }),
      transformResponse: (response) => response?.data || {},
    }),

    getEligibleWorkers: builder.query({
      query: ({ base }) => ({ url: API_ROUTES.PERMANENT_HIRE_ELIGIBLE(base), method: 'GET' }),
      transformResponse: mapList(mapEligibleWorkerFromApi),
      providesTags: ['PermanentHire'],
    }),

    getPermanentHires: builder.query({
      query: ({ base, page = 0, limit = 10 } = {}) => ({
        url: API_ROUTES.PERMANENT_HIRES(base),
        method: 'GET',
        params: listParams({ page, limit }),
      }),
      transformResponse: mapList(mapPermanentHireFromApi),
      providesTags: ['PermanentHire'],
    }),

    requestPermanentHire: builder.mutation({
      query: ({ base, ...body }) => ({ url: API_ROUTES.PERMANENT_HIRES(base), method: 'POST', body }),
      invalidatesTags: ['PermanentHire'],
    }),

    respondToPermanentHire: builder.mutation({
      query: ({ base, id, action }) => ({
        url: API_ROUTES.PERMANENT_HIRE_ACTION(base, id, action),
        method: 'PUT',
      }),
      invalidatesTags: ['PermanentHire'],
    }),
  }),
});

export const {
  useGetCustomerOptionsQuery,
  useGetContractsQuery,
  useUploadContractMutation,
  useSignContractMutation,
  useGetCurrentAgreedRateQuery,
  useGetAgreedRatesQuery,
  useCreateAgreedRateMutation,
  useUpdateAgreedRateMutation,
  useRespondToAgreedRateMutation,
  useGetPermanentHireSettingsQuery,
  useGetPermanentHiresQuery,
  useGetEligibleWorkersQuery,
  useRequestPermanentHireMutation,
  useRespondToPermanentHireMutation,
} = supplierRelationshipsApi;
