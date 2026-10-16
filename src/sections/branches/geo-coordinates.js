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

/**
 * Fix common lat/lng swaps (e.g. Lahore [74, 31] stored/read as lat=74 → Arctic pin).
 * GeoJSON / API arrays are [longitude, latitude].
 */
export function normalizeLatLng(latitude, longitude) {
  let lat = Number(latitude);
  let lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Absolute invalid: try the swapped pair (lat must be ≤ 90).
  if (!isValidLatitude(lat) && isValidLatitude(lng) && isValidLongitude(lat)) {
    return { latitude: lng, longitude: lat };
  }

  if (!isValidLngLat(lng, lat)) return null;

  // Both valid, but clearly swapped: "latitude" is really a PK/ME longitude (~60–80)
  // and "longitude" is really a latitude (~0–60). Leaflet then plots in the Arctic.
  if (Math.abs(lat) > 60 && Math.abs(lng) <= 60) {
    return { latitude: lng, longitude: lat };
  }

  // UK-style [lat, lng] wrongly read as GeoJSON: lng≈51, lat≈0 → near equator.
  if (Math.abs(lng) >= 40 && Math.abs(lng) <= 62 && Math.abs(lat) < 15) {
    return { latitude: lng, longitude: lat };
  }

  return { latitude: lat, longitude: lng };
}

/** Payload order: [longitude, latitude]. */
export function toApiCoordinates(latitude, longitude) {
  const normalized = normalizeLatLng(latitude, longitude);
  const lat = Number(normalized?.latitude ?? latitude) || 0;
  const lng = Number(normalized?.longitude ?? longitude) || 0;
  return [lng, lat];
}

/** Read API coordinates as [longitude, latitude]. */
export function parseCoordinates(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return null;
  // Stored as GeoJSON [lng, lat]; also accept mistaken [lat, lng] via normalize.
  const asGeoJson = normalizeLatLng(coords[1], coords[0]);
  if (asGeoJson) return asGeoJson;

  const asLatLng = normalizeLatLng(coords[0], coords[1]);
  return asLatLng;
}

export const INVALID_BRANCH_COORDINATES_MESSAGE =
  'Selected location has invalid latitude/longitude. Edit the location and set latitude between -90 and 90, longitude between -180 and 180 (Lahore example: 31.52, 74.36).';
