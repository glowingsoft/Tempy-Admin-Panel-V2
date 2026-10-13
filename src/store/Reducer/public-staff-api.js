import { createApi } from '@reduxjs/toolkit/query/react';

import { toApiCoordinates } from 'src/sections/branches/geo-coordinates';

import { API_ROUTES } from '../apiRoutes';
import { createCustomFetchBaseQuery } from '../baseQuery';

function pickList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export function buildPublicStaffLocation(place, addressLabel = '') {
  const lng = Number(place?.longitude);
  const lat = Number(place?.latitude);
  const fullAddress = String(place?.label || addressLabel || '').trim();
  const title = String(
    place?.mainText || place?.city || fullAddress.split(',')[0] || 'Location'
  ).trim();

  return {
    title,
    coordinates: toApiCoordinates(Number.isFinite(lat) ? lat : 0, Number.isFinite(lng) ? lng : 0),
    fullAddress,
    city: String(place?.city || '').trim(),
    country: String(place?.country || '').trim(),
    state: String(place?.state || '').trim(),
    postalCode: String(place?.postalCode || '').trim(),
    type: 'Point',
  };
}

function mapPublicStaff(item = {}, index) {
  return {
    id: String(item.staffId || item.staffRecordId || item._id || `staff-${index}`),
    staffId: item.staffId || '',
    staffRecordId: item.staffRecordId || '',
    name: String(item.name || '').trim() || 'Staff member',
    avatar: item.profileIcon || '',
    speciality: item.speciality || item.specialty || '',
  };
}

export const publicStaffApi = createApi({
  reducerPath: 'publicStaffApi',
  baseQuery: createCustomFetchBaseQuery(),
  endpoints: (builder) => ({
    searchPublicStaff: builder.query({
      query: ({ speciality = '', location } = {}) => ({
        url: API_ROUTES.PUBLIC_STAFF_SEARCH,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          speciality,
          location,
        },
      }),
      transformResponse: (response) => ({
        data: pickList(response).map(mapPublicStaff),
        meta: response?.meta || {},
        message: response?.message || '',
      }),
    }),
  }),
});

export const { useSearchPublicStaffQuery } = publicStaffApi;
