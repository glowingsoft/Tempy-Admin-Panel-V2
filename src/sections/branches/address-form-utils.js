import { deriveCityFromLabel, geocodeAddress } from 'src/sections/tempy-home/standalone-address-input';

import { isValidLngLat } from './geo-coordinates';

// ----------------------------------------------------------------------

export function applyAddressPlaceToForm(
  setValue,
  place,
  { addressField = 'locationSearch', updateSearchLabel = true } = {}
) {
  if (!place || typeof setValue !== 'function') return;

  if (updateSearchLabel && addressField && place.label) {
    setValue(addressField, place.label, { shouldDirty: true, shouldValidate: true });
  }

  const lat = Number(place.latitude);
  const lng = Number(place.longitude);

  if (Number.isFinite(lat)) {
    setValue('latitude', lat, { shouldDirty: true });
  }
  if (Number.isFinite(lng)) {
    setValue('longitude', lng, { shouldDirty: true });
  }

  // Always overwrite — do not keep a previous city (e.g. Lahore) when picking Sialkot.
  const city =
    String(place.city || '').trim() || deriveCityFromLabel(place.label || place.secondaryText || '');
  setValue('city', city, { shouldDirty: true, shouldValidate: true });
  setValue('state', String(place.state || '').trim(), { shouldDirty: true, shouldValidate: true });
  setValue('country', String(place.country || '').trim(), { shouldDirty: true, shouldValidate: true });
  setValue('postalCode', String(place.postalCode || '').trim(), {
    shouldDirty: true,
    shouldValidate: true,
  });
}

export async function ensureFormAddressCoordinates(
  getValues,
  setValue,
  { addressField = 'locationSearch' } = {}
) {
  const lng = Number(getValues('longitude'));
  const lat = Number(getValues('latitude'));

  if (isValidLngLat(lng, lat) && !(lng === 0 && lat === 0)) {
    return true;
  }

  const query = String(getValues(addressField) || '').trim();
  if (!query) return false;

  const geocoded = await geocodeAddress(query);
  if (!geocoded) return false;

  applyAddressPlaceToForm(setValue, geocoded, { addressField });
  return isValidLngLat(Number(getValues('longitude')), Number(getValues('latitude')));
}

export const ADDRESS_COORDINATES_HELPER =
  'Search and pick a place on the map — latitude and longitude are set automatically.';

export const FULL_ADDRESS_HELPER = 'Street address for records (separate from map location).';
