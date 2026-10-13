/** WGS84 helpers. Backend coordinate arrays are [longitude, latitude]. */

export function readApiLate(source) {
  if (!source || typeof source !== 'object') return undefined;
  return source.lat ?? source.latitude;
}

export function readApiLong(source) {
  if (!source || typeof source !== 'object') return undefined;
  return source.long ?? source.lng ?? source.lon ?? source.longitude;
}

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

/** Payload order: [longitude, latitude]. */
export function toApiCoordinates(latitude, longitude) {
  return [Number(longitude) || 0, Number(latitude) || 0];
}

/** Read API coordinates as [longitude, latitude]. */
export function parseCoordinates(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const longitude = Number(coords[0]);
  const latitude = Number(coords[1]);
  if (!isValidLngLat(longitude, latitude)) return null;
  return { longitude, latitude };
}

export const INVALID_BRANCH_COORDINATES_MESSAGE =
  'Selected location has invalid latitude/longitude. Edit the location and set latitude between -90 and 90, longitude between -180 and 180 (Lahore example: 31.52, 74.36).';
