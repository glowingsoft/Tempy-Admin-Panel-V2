import { deriveCityFromLabel, geocodeAddress } from 'src/sections/tempy-home/standalone-address-input';

import { matchUkCounty } from './branches-constants';
import { isValidLngLat } from './geo-coordinates';


export function applyAddressPlaceToForm(
  setValue,
  place,
  { addressField = 'locationSearch', updateSearchLabel = true, matchCountyEnum = false } = {}
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

  const city =
    String(place.city || '').trim() || deriveCityFromLabel(place.label || place.secondaryText || '');
  const country = String(place.country || '').trim();
  let state = String(place.state || '').trim();
  if (state && country && state.toLowerCase() === country.toLowerCase()) {
    state = '';
  }
  if (matchCountyEnum) {
    state = matchUkCounty(state);
  }

  setValue('city', city, { shouldDirty: true, shouldValidate: true });
  setValue('state', state, { shouldDirty: true, shouldValidate: true });
  setValue('country', country, { shouldDirty: true, shouldValidate: true });
  setValue('postalCode', String(place.postalCode || '').trim(), {
    shouldDirty: true,
    shouldValidate: true,
  });

  const line1 = String(place.mainText || place.name || '').trim() || extractAddressLine1(place.label);
  if (line1) {
    setValue('addressLine1', line1, { shouldDirty: true, shouldValidate: true });
  }
}

/** First segment of a comma-separated address (house / street). */
export function extractAddressLine1(fullAddress) {
  const raw = String(fullAddress || '').trim();
  if (!raw) return '';
  return raw.split(',')[0].trim();
}

/** Build stored fullAddress with required line 1 first. */
export function composeLocationFullAddress({
  addressLine1 = '',
  fullAddress = '',
  city = '',
  state = '',
  postalCode = '',
  country = '',
} = {}) {
  const line1 = String(addressLine1 || '').trim();
  const lookup = String(fullAddress || '').trim();
  if (line1 && lookup) {
    if (lookup.toLowerCase().startsWith(line1.toLowerCase())) return lookup;
    return [line1, lookup].join(', ');
  }
  if (line1) {
    return [line1, city, state, postalCode, country].map((part) => String(part || '').trim()).filter(Boolean).join(', ');
  }
  return lookup;
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
  'Search a place or tap Find my location — latitude and longitude are set automatically.';

export const FULL_ADDRESS_HELPER = 'Street address for records (separate from map location).';
