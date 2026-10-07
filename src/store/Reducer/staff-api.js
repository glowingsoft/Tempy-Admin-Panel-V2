import { createApi } from '@reduxjs/toolkit/query/react';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';
import {
  extractStaffListPayload,
  mapDashboardStaffToUi,
  STAFF_ROUTE_KEYS_BY_ACCOUNT,
} from 'src/sections/staff/staff-api-utils';

function resolveStaffListUrl(accountKey) {
  const routeKey = STAFF_ROUTE_KEYS_BY_ACCOUNT[accountKey] || 'CARE_HOME_STAFF';
  return API_ROUTES[routeKey] || API_ROUTES.CARE_HOME_STAFF;
}

/** Job-bids accept modal — role-specific /staff/available */
const AVAILABLE_STAFF_ROUTE_BY_MODE = {
  careHome: 'CARE_HOME_STAFF_AVAILABLE',
  hospital: 'HOSPITAL_STAFF_AVAILABLE',
  user: 'USER_STAFF_AVAILABLE',
  localAuthority: 'LOCAL_AUTHORITY_STAFF_AVAILABLE',
};

function resolveAvailableStaffUrl(mode = 'careHome') {
  const routeKey = AVAILABLE_STAFF_ROUTE_BY_MODE[mode] || 'CARE_HOME_STAFF_AVAILABLE';
  return API_ROUTES[routeKey] || API_ROUTES.CARE_HOME_STAFF_AVAILABLE;
}

export const staffApi = createApi({
  reducerPath: 'staffApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['DashboardStaff', 'AvailableStaff'],

  endpoints: (builder) => ({
    /**
     * GET staff list — URL from accountKey:
     * care_home → /web/care-home/staff
     * hospital_nhs → /web/hospital/staff
     * local_authority → /web/local-authority/staff
     * individual_home_care / user → /web/user/staff
     */
    getDashboardStaff: builder.query({
      query: ({
        accountKey = 'care_home',
        search = '',
        page = 0,
        limit = 50,
        status = '',
        keyword,
      } = {}) => {
        const params = {
          page: page + 1,
          limit,
        };

        const searchValue = keyword ?? search;
        if (searchValue) params.keyword = searchValue;
        if (status && status !== 'all') params.status = status;

        return {
          url: resolveStaffListUrl(accountKey),
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const payload = extractStaffListPayload(response);
        return {
          data: (payload.data || []).map(mapDashboardStaffToUi),
          meta: payload.meta || {},
          total_length: payload.total_length ?? payload.data?.length ?? 0,
        };
      },
      providesTags: (result, _error, arg) =>
        result?.data?.length
          ? [
              ...result.data.map((staff) => ({ type: 'DashboardStaff', id: staff.id })),
              { type: 'DashboardStaff', id: `LIST-${arg?.accountKey || 'care_home'}` },
            ]
          : [{ type: 'DashboardStaff', id: `LIST-${arg?.accountKey || 'care_home'}` }],
    }),

    /**
     * GET /web/{role}/staff/available — requires bid user + job
     * mode: careHome | hospital | user | localAuthority
     */
    getAvailableStaff: builder.query({
      query: ({
        mode = 'careHome',
        page = 0,
        limit = 100,
        keyword = '',
        user = '',
        job = '',
        bid = '',
        date = '',
        startTime = '',
        endTime = '',
        shift = '',
      } = {}) => {
        const params = {
          page: page + 1,
          limit,
          user,
          job,
        };
        if (keyword) params.keyword = keyword;
        if (bid) params.bid = bid;
        if (date) params.date = date;
        if (startTime) params.startTime = startTime;
        if (endTime) params.endTime = endTime;
        if (shift) params.shift = shift;

        return {
          url: resolveAvailableStaffUrl(mode),
          method: 'GET',
          params,
        };
      },
      transformResponse: (response) => {
        const payload = extractStaffListPayload(response);
        return {
          data: (payload.data || []).map(mapDashboardStaffToUi),
          meta: payload.meta || {},
          message: response?.message || '',
          total_length: payload.total_length ?? payload.data?.length ?? 0,
        };
      },
      providesTags: (result, _error, arg) =>
        result?.data?.length
          ? [
              ...result.data.map((staff) => ({ type: 'AvailableStaff', id: staff.id })),
              { type: 'AvailableStaff', id: `LIST-${arg?.mode || 'careHome'}` },
            ]
          : [{ type: 'AvailableStaff', id: `LIST-${arg?.mode || 'careHome'}` }],
    }),

    /** @deprecated Prefer getAvailableStaff({ mode: 'careHome', ... }) */
    getCareHomeAvailableStaff: builder.query({
      query: (args = {}) => ({
        url: resolveAvailableStaffUrl('careHome'),
        method: 'GET',
        params: (() => {
          const {
            page = 0,
            limit = 100,
            keyword = '',
            user = '',
            job = '',
            bid = '',
            date = '',
            startTime = '',
            endTime = '',
            shift = '',
          } = args;
          const params = { page: page + 1, limit, user, job };
          if (keyword) params.keyword = keyword;
          if (bid) params.bid = bid;
          if (date) params.date = date;
          if (startTime) params.startTime = startTime;
          if (endTime) params.endTime = endTime;
          if (shift) params.shift = shift;
          return params;
        })(),
      }),
      transformResponse: (response) => {
        const payload = extractStaffListPayload(response);
        return {
          data: (payload.data || []).map(mapDashboardStaffToUi),
          meta: payload.meta || {},
          message: response?.message || '',
          total_length: payload.total_length ?? payload.data?.length ?? 0,
        };
      },
      providesTags: [{ type: 'AvailableStaff', id: 'LIST-careHome' }],
    }),
  }),
});

export const {
  useGetDashboardStaffQuery,
  useLazyGetDashboardStaffQuery,
  useGetAvailableStaffQuery,
  useGetCareHomeAvailableStaffQuery,
} = staffApi;
