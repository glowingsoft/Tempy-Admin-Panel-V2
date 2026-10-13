import { formatCalendarMetaStats, mapCareHomeBookingCalendarFromApi } from 'src/sections/care-home/shifts/care-home-booking-calendar-api-utils';
import { parseCoordinates } from 'src/sections/branches/geo-coordinates';

// ----------------------------------------------------------------------

/**
 * Map GET `/web/agency/booking/calender` (same shape as care-home calendar).
 * → `{ teams, shifts, dayWeather, meta, message }`
 */
export function mapAgencyBookingCalendarFromApi(response = {}) {
  const mapped = mapCareHomeBookingCalendarFromApi(response);
  const shifts = { ...mapped.shifts };

  // Agency cells: prefer care-home / client name when location address is missing
  Object.keys(shifts).forEach((key) => {
    const entry = shifts[key];
    const list = Array.isArray(entry) ? entry : [entry];
    const next = list.map((shift) => {
      if (!shift || shift.location) return shift;
      const clientName = String(shift.user?.name || shift.raw?.user?.name || '').trim();
      if (!clientName) return shift;
      return { ...shift, location: clientName };
    });
    shifts[key] = next.length === 1 ? next[0] : next;
  });

  return { ...mapped, shifts };
}

export { formatCalendarMetaStats };

/** Branch pin for calendar. API stores [long, lat]. */
export function getAgencyBranchLatLng(branch) {
  if (!branch || typeof branch !== 'object') return null;
  const parsed = parseCoordinates(branch.location?.coordinates);
  if (!parsed) return null;
  const { latitude, longitude } = parsed;
  if (latitude === 0 && longitude === 0) {
    return null;
  }

  return { latitude, longitude };
}

export function getFirstAgencyBranchLatLng(branches = []) {
  for (const branch of branches) {
    const origin = getAgencyBranchLatLng(branch);
    if (origin) return origin;
  }
  return null;
}
