
import {
  detectGpsPlace,
  formatGeolocationError,
  getBrowserPosition,
} from 'src/sections/tempy-home/detect-gps-place';

export { formatGeolocationError, getBrowserPosition };

export async function resolveCurrentLocation(fallbackAddress = '') {
  const place = await detectGpsPlace();

  if (Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude))) {
    return {
      label: place.label,
      lat: place.latitude,
      lng: place.longitude,
      capturedAt: new Date().toISOString(),
      source: place.source,
    };
  }

  return {
    label: fallbackAddress?.trim() || 'Location unavailable',
    lat: null,
    lng: null,
    capturedAt: new Date().toISOString(),
    source: fallbackAddress ? 'job-fallback' : 'unavailable',
    error: place.error || formatGeolocationError(),
  };
}
