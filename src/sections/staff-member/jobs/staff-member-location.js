/** Geolocation helpers for staff-member check-in / check-out. */

export function getBrowserPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0,
      ...options,
    });
  });
}

async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name || null;
  } catch {
    return null;
  }
}

/**
 * Resolve a human-readable current location label + coordinates.
 * Falls back to job address / coordinates when reverse geocode is unavailable.
 */
export async function resolveCurrentLocation(fallbackAddress = '') {
  try {
    const position = await getBrowserPosition();
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const geocoded = await reverseGeocode(lat, lng);
    const label =
      geocoded ||
      fallbackAddress?.trim() ||
      `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    return {
      label,
      lat,
      lng,
      capturedAt: new Date().toISOString(),
      source: geocoded ? 'gps+geocode' : fallbackAddress ? 'gps+job' : 'gps',
    };
  } catch (error) {
    const label = fallbackAddress?.trim() || 'Location unavailable';
    return {
      label,
      lat: null,
      lng: null,
      capturedAt: new Date().toISOString(),
      source: fallbackAddress ? 'job-fallback' : 'unavailable',
      error: error?.message || 'Unable to read GPS',
    };
  }
}
