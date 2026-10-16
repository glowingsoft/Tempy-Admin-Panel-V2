
export function formatGeolocationError(error) {
  const code = Number(error?.code);
  if (code === 1) {
    return 'Location permission is blocked. Click the lock / location icon in the address bar → allow Location for this site, then tap Detect GPS again.';
  }
  if (code === 2) {
    return 'GPS position unavailable. Turn on device location / Wi‑Fi and try Detect GPS again.';
  }
  if (code === 3) {
    return 'GPS timed out. Move somewhere with a clearer signal and try Detect GPS again.';
  }
  const message = String(error?.message || '').trim();
  if (message) return message;
  return 'Unable to read GPS. Please allow location access and try again.';
}

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

async function reverseGeocodeNominatim(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const address = data?.address || {};
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      '';
    return {
      label: data?.display_name || null,
      city,
      state: address.state || address.region || '',
      country: address.country || '',
      postalCode: address.postcode || '',
    };
  } catch {
    return null;
  }
}


export async function detectGpsPlace() {
  try {
    const position = await getBrowserPosition();
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const geocoded = await reverseGeocodeNominatim(latitude, longitude);
    const label =
      geocoded?.label || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

    return {
      label,
      latitude,
      longitude,
      city: geocoded?.city || '',
      state: geocoded?.state || '',
      country: geocoded?.country || '',
      postalCode: geocoded?.postalCode || '',
      source: geocoded?.label ? 'gps+geocode' : 'gps',
    };
  } catch (error) {
    return {
      label: '',
      latitude: null,
      longitude: null,
      city: '',
      state: '',
      country: '',
      postalCode: '',
      source: 'unavailable',
      error: formatGeolocationError(error),
    };
  }
}
