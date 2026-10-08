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

// ----------------------------------------------------------------------

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
    return { data, meta };
  };
}

/**
 * Supplier ↔ customer: contracts, agreed rates and temp-to-permanent hires.
 * Every call takes `base`, the role prefix from getRoleApiBase(user), e.g. /web/agency.
 */
export const supplierRelationshipsApi = createApi({
  reducerPath: 'supplierRelationshipsApi',
  baseQuery: createCustomFetchBaseQuery(),
  keepUnusedDataFor: 0,
  refetchOnMountOrArgChange: true,
  tagTypes: ['Contract', 'AgreedRate', 'PermanentHire'],

  endpoints: (builder) => ({
    /** GET agreed-rates/users?userType=careHome|user — customers a supplier can pick */
    getCustomerOptions: builder.query({
      query: ({ base, userType }) => ({
        url: `${API_ROUTES.AGREED_RATES(base)}/users`,
        method: 'GET',
        params: { userType, page: 1, limit: 100 },
      }),
      transformResponse: mapList(mapUserOption),
    }),

    // Contracts ----------------------------------------------------------

    getContracts: builder.query({
      query: ({ base }) => ({ url: API_ROUTES.CONTRACTS(base), method: 'GET', params: { limit: 100 } }),
      transformResponse: mapList(mapRelationshipFromApi),
      providesTags: ['Contract'],
    }),

    /** Supplier: { customer, document } */
    uploadContract: builder.mutation({
      query: ({ base, ...body }) => ({ url: API_ROUTES.CONTRACTS(base), method: 'POST', body }),
      invalidatesTags: ['Contract'],
    }),

    /** action: sign (customer, first) | countersign (supplier, completes it) */
    signContract: builder.mutation({
      query: ({ base, id, action, signature }) => ({
        url: API_ROUTES.CONTRACT_ACTION(base, id, action),
        method: 'PUT',
        body: { signature },
      }),
      invalidatesTags: ['Contract'],
    }),

    // Agreed rates -------------------------------------------------------

    /** GET {base}/agreed-rates/current?customer=&jobType — rates already agreed for this customer and role */
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
      query: ({ base }) => ({ url: API_ROUTES.AGREED_RATES(base), method: 'GET', params: { limit: 100 } }),
      transformResponse: mapList(mapAgreedRateFromApi),
      providesTags: ['AgreedRate'],
    }),

    /** Supplier: { customer, jobType, rates: { day, night, weekend }, effectiveFrom } */
    createAgreedRate: builder.mutation({
      query: ({ base, ...body }) => ({ url: API_ROUTES.AGREED_RATES(base), method: 'POST', body }),
      invalidatesTags: ['AgreedRate'],
    }),

    /** Supplier, while still open: { rates, effectiveFrom } — goes back to pending */
    updateAgreedRate: builder.mutation({
      query: ({ base, id, ...body }) => ({
        url: API_ROUTES.AGREED_RATE_BY_ID(base, id),
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AgreedRate'],
    }),

    /** action: withdraw (supplier) | accept | reject | review (customer, body { note }) */
    respondToAgreedRate: builder.mutation({
      query: ({ base, id, action, ...body }) => ({
        url: API_ROUTES.AGREED_RATE_ACTION(base, id, action),
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AgreedRate'],
    }),

    // Temp to permanent --------------------------------------------------

    /** { minShifts, fee } set by admin */
    getPermanentHireSettings: builder.query({
      query: ({ base }) => ({ url: API_ROUTES.PERMANENT_HIRE_SETTINGS(base), method: 'GET' }),
      transformResponse: (response) => response?.data || {},
    }),

    /** Care home: agency workers and solo nurses who have worked there, with shift counts */
    getEligibleWorkers: builder.query({
      query: ({ base }) => ({ url: API_ROUTES.PERMANENT_HIRE_ELIGIBLE(base), method: 'GET' }),
      transformResponse: mapList(mapEligibleWorkerFromApi),
      providesTags: ['PermanentHire'],
    }),

    getPermanentHires: builder.query({
      query: ({ base }) => ({
        url: API_ROUTES.PERMANENT_HIRES(base),
        method: 'GET',
        params: { limit: 100 },
      }),
      transformResponse: mapList(mapPermanentHireFromApi),
      providesTags: ['PermanentHire'],
    }),

    /** Care home: { worker, supplier? } — supplier is the agency id, left out for a solo nurse */
    requestPermanentHire: builder.mutation({
      query: ({ base, ...body }) => ({ url: API_ROUTES.PERMANENT_HIRES(base), method: 'POST', body }),
      invalidatesTags: ['PermanentHire'],
    }),

    /** action: cancel (care home) | accept | reject (agency / nurse) */
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
