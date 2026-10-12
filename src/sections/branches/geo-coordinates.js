/** WGS84 helpers. Backend + mobile store coordinates as [latitude, longitude]. */

export function isValidLongitude(lng) {
  const value = Number(lng);
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidLatitude(lat) {
  const value = Number(lat);
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLngLat(lng, lat) {
  return isValidLongitude(lng) && isValidLatitude(lat);
}

/** Payload order used by backend and mobile apps. */
export function toApiCoordinates(latitude, longitude) {
  return [Number(latitude) || 0, Number(longitude) || 0];
}

/**
 * Read API / stored coordinates.
 * Prefer [lat, lng]. If index 0 is outside ±90, treat as legacy GeoJSON [lng, lat].
 */
export function parseCoordinates(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const first = Number(coords[0]);
  const second = Number(coords[1]);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  let latitude;
  let longitude;

  if (Math.abs(first) > 90 && isValidLongitude(first) && isValidLatitude(second)) {
    longitude = first;
    latitude = second;
  } else {
    latitude = first;
    longitude = second;
  }

  if (!isValidLngLat(longitude, latitude)) return null;
  return { longitude, latitude };
}

export const INVALID_BRANCH_COORDINATES_MESSAGE =
  'Selected location has invalid latitude/longitude. Edit the location and set latitude between -90 and 90, longitude between -180 and 180 (Lahore example: 31.52, 74.36).';
