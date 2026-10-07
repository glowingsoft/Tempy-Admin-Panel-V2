export const ALL_LOCATIONS_ID = 'all';

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

/** Haversine distance in km between two `{ latitude, longitude }` points. */
export function getLocationDistanceKm(from, to) {
  if (
    from?.latitude == null ||
    from?.longitude == null ||
    to?.latitude == null ||
    to?.longitude == null
  ) {
    return null;
  }

  const lat1 = Number(from.latitude);
  const lng1 = Number(from.longitude);
  const lat2 = Number(to.latitude);
  const lng2 = Number(to.longitude);

  if ([lat1, lng1, lat2, lng2].some((n) => Number.isNaN(n))) return null;
  if (lat1 === 0 && lng1 === 0) return null;
  if (lat2 === 0 && lng2 === 0) return null;

  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

/**
 * Attach distanceKm when an origin + lat/lng are available.
 * Does not invent fake demo distances.
 */
export function withLocationDistances(locations = [], origin = null) {
  return locations.map((loc) => {
    if (loc.distanceKm != null) return loc;
    if (!origin) return { ...loc, distanceKm: null };

    const km = getLocationDistanceKm(origin, {
      latitude: loc.latitude,
      longitude: loc.longitude,
    });

    return {
      ...loc,
      distanceKm: km == null ? null : Number(km.toFixed(1)),
    };
  });
}

export function withAllLocationsOption(locations = [], origin = null) {
  const withKm = withLocationDistances(
    locations.filter((loc) => loc.id !== ALL_LOCATIONS_ID),
    origin
  );
  return [
    {
      id: ALL_LOCATIONS_ID,
      label: 'All locations',
      address: withKm.map((loc) => loc.label).filter(Boolean).join(' · '),
      distanceKm: null,
      isAll: true,
      locationCount: withKm.length,
    },
    ...withKm,
  ];
}

export function formatLocationDistanceLabel(loc) {
  if (!loc || loc.isAll || loc.distanceKm == null) return '';
  return `${loc.distanceKm} km`;
}

export function getLocationDisplayTitle(loc, locations = []) {
  if (!loc) return '';
  if (loc.isAll || loc.id === ALL_LOCATIONS_ID) {
    const count = loc.locationCount ?? locations.filter((item) => !item.isAll).length;
    return count ? `All locations (${count})` : 'All locations';
  }
  return loc.label || '';
}
