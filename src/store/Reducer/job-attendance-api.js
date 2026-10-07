import { createApi } from '@reduxjs/toolkit/query/react';

import { extractNurseBookingsList, mapNurseBookingFromApi } from 'src/sections/staff-member/jobs/nurse-checkin-api-utils';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

/** Booking list of whoever posted the job (customers) or assigned the worker (suppliers). */
const BOOKING_ROUTES = {
  careHome: API_ROUTES.CARE_HOME_BOOKING,
  hospital: API_ROUTES.HOSPITAL_BOOKING,
  localAuthority: API_ROUTES.LOCAL_AUTHORITY_BOOKING,
  user: API_ROUTES.USER_BOOKING,
  agency: API_ROUTES.AGENCY_BOOKING,
  homeCareCompany: API_ROUTES.HOME_CARE_COMPANY_BOOKING,
};

function pickWorker(item = {}) {
  const candidates = [item.worker, item.nurse, item.staff, item.user];
  return candidates.find((value) => value && typeof value === 'object') || {};
}

function pickWorkerName(worker = {}) {
  const full = [worker.firstName, worker.lastName].filter(Boolean).join(' ');
  return [worker.fullName, worker.name, full, worker.email].map((value) => String(value || '').trim()).find(Boolean) || '';
}

export const jobAttendanceApi = createApi({
  reducerPath: 'jobAttendanceApi',
  baseQuery: createCustomFetchBaseQuery(),
  tagTypes: ['JobAttendance'],

  endpoints: (builder) => ({
    /** GET /web/<role>/booking?job=<jobId> — every booking on the job, each with its `attendance`. */
    getJobAttendanceBookings: builder.query({
      query: ({ mode = 'careHome', jobId = '', limit = 200 } = {}) => ({
        url: BOOKING_ROUTES[mode] || API_ROUTES.CARE_HOME_BOOKING,
        method: 'GET',
        params: { ...(jobId ? { job: jobId } : {}), page: 1, limit },
      }),
      transformResponse: (response) => {
        const seen = new Set();
        return extractNurseBookingsList(response)
          .map((item) => {
            const worker = pickWorker(item);
            return {
              ...mapNurseBookingFromApi(item),
              workerName: pickWorkerName(worker),
              workerAvatar: String(worker.profileIcon || worker.avatarUrl || worker.image || '').trim(),
            };
          })
          .filter((row) => {
            if (!row.id || seen.has(row.id)) return false;
            seen.add(row.id);
            return true;
          });
      },
      providesTags: (_result, _error, arg) => [{ type: 'JobAttendance', id: `${arg?.mode || ''}-${arg?.jobId || ''}` }],
    }),
  }),
});

export const { useGetJobAttendanceBookingsQuery } = jobAttendanceApi;
