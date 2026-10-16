import { debounce } from 'lodash';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { LoadingButton } from '@mui/lab';

import { CONFIG } from 'src/config-global';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { detectGpsPlace } from './detect-gps-place';


const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  CONFIG.google?.mapsApiKey ||
  'AIzaSyDhxIZyzA8tXTfP7VPVbi5BayMMlid2PuA';

let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.places?.AutocompleteService) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tempy-google-maps="true"]');

    const finish = async () => {
      try {
        if (window.google?.maps?.importLibrary) {
          await window.google.maps.importLibrary('places');
        }
        resolve(window.google);
      } catch (error) {
        reject(error);
      }
    };

    if (window.google?.maps) {
      finish();
      return;
    }

    if (existing) {
      existing.addEventListener('load', finish);
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    window.gm_authFailure = () => {
      reject(new Error('Google Maps authentication failed'));
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.tempyGoogleMaps = 'true';
    script.onload = finish;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

const CITY_BIAS = {
  lahore: { latitude: 31.5204, longitude: 74.3587 },
  karachi: { latitude: 24.8607, longitude: 67.0011 },
  islamabad: { latitude: 33.6844, longitude: 73.0479 },
  rawalpindi: { latitude: 33.5651, longitude: 73.0169 },
  faisalabad: { latitude: 31.4504, longitude: 73.135 },
  multan: { latitude: 30.1575, longitude: 71.5249 },
  peshawar: { latitude: 34.0151, longitude: 71.5249 },
  quetta: { latitude: 30.1798, longitude: 66.975 },
  sialkot: { latitude: 32.4945, longitude: 74.5229 },
  gujranwala: { latitude: 32.1877, longitude: 74.1945 },
  sargodha: { latitude: 32.0836, longitude: 72.6711 },
  bahawalpur: { latitude: 29.3956, longitude: 71.6836 },
  sukkur: { latitude: 27.7052, longitude: 68.8574 },
  hyderabad: { latitude: 25.396, longitude: 68.3578 },
  abbottabad: { latitude: 34.1463, longitude: 73.2117 },
  mardan: { latitude: 34.1989, longitude: 72.0231 },
  gujrat: { latitude: 32.5739, longitude: 74.0789 },
  sheikhupura: { latitude: 31.7167, longitude: 73.985 },
  jhelum: { latitude: 32.9425, longitude: 73.7257 },
  sahiwal: { latitude: 30.6682, longitude: 73.1114 },
};

const CITY_BIAS_KEYS = Object.keys(CITY_BIAS).sort((a, b) => b.length - a.length);

function toTitleCase(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function extractQueryCity(query) {
  const text = String(query || '').toLowerCase();
  return CITY_BIAS_KEYS.find((city) => text.includes(city)) || '';
}

export function deriveCityFromLabel(label) {
  const key = extractQueryCity(label);
  if (key) return toTitleCase(key);

  const parts = String(label || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  const skip = /^(pakistan|punjab|sindh|balochistan|khyber|kpk|federal|capital|district|tehsil|province)$/i;
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const part = parts[i].replace(/\s+district$/i, '').trim();
    if (!part || skip.test(part) || /^\d+$/.test(part)) continue;
    if (part.split(/\s+/).length <= 3) return part;
  }

  return '';
}

function enrichLabelWithCity(label, city) {
  const text = String(label || '').trim();
  const cityName = toTitleCase(city);
  if (!text || !cityName) return text;
  if (text.toLowerCase().includes(cityName.toLowerCase())) return text;
  if (/, punjab/i.test(text)) return text.replace(/, punjab/i, `, ${cityName}, Punjab`);
  if (/, pakistan/i.test(text)) return text.replace(/, pakistan/i, `, ${cityName}, Pakistan`);
  return `${text}, ${cityName}`;
}

function withQueryCity(item, query) {
  const queryCity = extractQueryCity(query);
  const fromLabel = deriveCityFromLabel(item.label || item.secondaryText || query);
  const city =
    String(item.city || '').trim() ||
    (queryCity ? toTitleCase(queryCity) : '') ||
    fromLabel ||
    '';
  return {
    ...item,
    city,
    label: enrichLabelWithCity(item.label, city),
    secondaryText: enrichLabelWithCity(item.secondaryText, city),
  };
}

function fetchGoogleJsPredictions(input, service, sessionToken) {
  return new Promise((resolve, reject) => {
    const queryCity = extractQueryCity(input);
    const request = {
      input,
      sessionToken,
      componentRestrictions: { country: 'pk' },
    };
    if (queryCity && CITY_BIAS[queryCity] && window.google?.maps?.LatLng) {
      request.location = new window.google.maps.LatLng(
        CITY_BIAS[queryCity].latitude,
        CITY_BIAS[queryCity].longitude
      );
      request.radius = 50000;
    }

    service.getPlacePredictions(request, (predictions, status) => {
      const ok = window.google.maps.places.PlacesServiceStatus.OK;
      const zero = window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS;

      if (status === ok && predictions?.length) {
        resolve(
          predictions.map((prediction) => {
            const fromTerms = (prediction.terms || [])
              .map((term) => term.value)
              .filter(Boolean);
            const label =
              fromTerms.length > 1 ? [...new Set(fromTerms)].join(', ') : prediction.description;
            return withQueryCity(
              {
                label,
                mainText: prediction.structured_formatting?.main_text || prediction.description,
                secondaryText: prediction.structured_formatting?.secondary_text || '',
                placeId: prediction.place_id,
                isGoogle: true,
                source: 'js',
              },
              input
            );
          })
        );
        return;
      }

      if (status === zero) {
        resolve([]);
        return;
      }

      reject(new Error(String(status || 'PREDICTION_FAILED')));
    });
  });
}

export async function fetchPhotonSuggestions(input) {
  const queryCity = extractQueryCity(input);
  const bias = queryCity ? CITY_BIAS[queryCity] : null;
  const params = {
    q: input,
    limit: '8',
    lang: 'en',
  };
  if (bias) {
    params.lat = String(bias.latitude);
    params.lon = String(bias.longitude);
  } else {
    params.lat = '30.3753';
    params.lon = '69.3451';
  }

  const res = await fetch(
    `https://photon.komoot.io/api/?${new URLSearchParams(params)}`
  );
  if (!res.ok) throw new Error('Photon failed');
  const data = await res.json();

  const mapped = (data.features ?? []).map((feature) => {
    const properties = feature.properties || {};
    const [lng, lat] = feature.geometry?.coordinates || [];
    const city =
      properties.city || properties.town || properties.village || properties.county || '';
    const parts = [
      properties.name,
      properties.housenumber,
      properties.street,
      city,
      properties.state,
      properties.country,
    ].filter(Boolean);

    return withQueryCity(
      {
        label: [...new Set(parts)].join(', '),
        mainText: properties.name || parts[0] || '',
        secondaryText: parts.slice(1).join(', '),
        placeId: `ph-${properties.osm_id}`,
        latitude: Number.isFinite(lat) ? lat : null,
        longitude: Number.isFinite(lng) ? lng : null,
        city,
        state: properties.state || '',
        country: properties.country || '',
        postalCode: properties.postcode || '',
      },
      input
    );
  });

  if (!queryCity) return mapped;

  const preferred = mapped.filter((item) =>
    String(item.city || item.label || '')
      .toLowerCase()
      .includes(queryCity)
  );
  return preferred.length ? preferred : mapped;
}

async function fetchNominatimSuggestions(input) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q: input,
      format: 'jsonv2',
      addressdetails: '1',
      limit: '8',
      countrycodes: 'pk',
    })}`
  );
  if (!res.ok) throw new Error('Nominatim failed');
  const data = await res.json();

  return (Array.isArray(data) ? data : []).map((item) =>
    withQueryCity(
      {
        label: item.display_name,
        mainText: item.name || item.display_name,
        secondaryText: item.display_name,
        placeId: `osm-${item.place_id}`,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        city: item.address?.city || item.address?.town || item.address?.village || '',
        state: item.address?.state || '',
        country: item.address?.country || '',
        postalCode: item.address?.postcode || '',
      },
      input
    )
  );
}

function hasCoordinates(place) {
  const lat = Number(place?.latitude);
  const lng = Number(place?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

export async function geocodeAddress(query) {
  const text = String(query || '').trim();
  if (!text) return null;

  const queryCity = extractQueryCity(text);

  try {
    const photonResults = await fetchPhotonSuggestions(text);
    const match =
      (queryCity &&
        photonResults.find((item) =>
          String(item.city || item.label || '')
            .toLowerCase()
            .includes(queryCity)
        )) ||
      photonResults[0];
    if (hasCoordinates(match)) return match;
  } catch (error) {
    console.warn('Photon geocode failed', error);
  }

  try {
    const nominatimResults = await fetchNominatimSuggestions(text);
    const match =
      (queryCity &&
        nominatimResults.find((item) =>
          String(item.city || item.label || '')
            .toLowerCase()
            .includes(queryCity)
        )) ||
      nominatimResults[0];
    if (hasCoordinates(match)) return match;
  } catch (error) {
    console.warn('Nominatim geocode failed', error);
  }

  if (queryCity && CITY_BIAS[queryCity]) {
    return {
      label: text,
      city: toTitleCase(queryCity),
      latitude: CITY_BIAS[queryCity].latitude,
      longitude: CITY_BIAS[queryCity].longitude,
      country: 'Pakistan',
    };
  }

  return null;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), ms);
    }),
  ]);
}

async function searchLocations(input, apiKey, serviceRef, sessionTokenRef) {
  const googlePromise = apiKey
    ? withTimeout(
      (async () => {
        const google = await loadGoogleMaps(apiKey);
        if (!serviceRef.current) {
          serviceRef.current = new google.maps.places.AutocompleteService();
        }
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
        }
        return fetchGoogleJsPredictions(input, serviceRef.current, sessionTokenRef.current);
      })(),
      3000
    ).catch((error) => {
      console.warn('Google Autocomplete failed', error);
      return [];
    })
    : Promise.resolve([]);

  const photonPromise = withTimeout(fetchPhotonSuggestions(input), 2500).catch((error) => {
    console.warn('Photon failed', error);
    return [];
  });

  const [googleResults, photonResults] = await Promise.all([googlePromise, photonPromise]);
  if (googleResults.length) return googleResults;
  if (photonResults.length) return photonResults;
  return [];
}

function parseGoogleJsPlace(place, fallbackLabel) {
  const location = place?.geometry?.location;
  const components = place?.address_components || [];
  const getComponent = (type) =>
    components.find((item) => item.types.includes(type))?.long_name || '';

  const label = place?.formatted_address || fallbackLabel || '';
  const city =
    getComponent('locality') ||
    getComponent('postal_town') ||
    String(getComponent('administrative_area_level_2') || '').replace(/ district/i, '') ||
    getComponent('sublocality') ||
    deriveCityFromLabel(label) ||
    '';

  return {
    label,
    latitude: location ? location.lat() : null,
    longitude: location ? location.lng() : null,
    city,
    state: getComponent('administrative_area_level_1'),
    country: getComponent('country'),
    postalCode: getComponent('postal_code'),
  };
}

export function StandaloneAddressInput({
  value,
  onChange,
  onPlaceSelect,
  label = 'Location',
  size = 'small',
  labelPlacement = 'above',
  error,
  helperText,
  showDetectGps = true,
  sx,
  ...other
}) {
  const googleApiKey = GOOGLE_MAPS_API_KEY;
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const serviceRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const attributionRef = useRef(null);

  const fetchSuggestions = useCallback(
    async (input) => {
      const query = String(input || '').trim();
      if (query.length < 2) {
        setOptions([]);
        setOpen(false);
        return;
      }

      setLoading(true);
      setOpen(true);
      try {
        const results = await searchLocations(
          query,
          googleApiKey,
          serviceRef,
          sessionTokenRef
        );
        setOptions(results);
        setOpen(true);
      } catch (err) {
        console.warn('Location search failed', err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [googleApiKey]
  );

  const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 350), [fetchSuggestions]);

  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

  const emitPlace = (place) => {
    if (!place) return;
    if (place.label) onChange(place.label);
    onPlaceSelect?.(place);
  };

  const resolvePlaceWithCoords = async (option) => {
    let resolved = option;

    if (option.source === 'js' && option.placeId) {
      try {
        const google = await loadGoogleMaps(googleApiKey);
        if (attributionRef.current) {
          const placesService = new google.maps.places.PlacesService(attributionRef.current);
          resolved = await new Promise((resolve) => {
            placesService.getDetails(
              {
                placeId: option.placeId,
                fields: ['formatted_address', 'geometry', 'address_components'],
                sessionToken: sessionTokenRef.current,
              },
              (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                  resolve({ ...option, ...parseGoogleJsPlace(place, option.label) });
                  return;
                }
                resolve(option);
              }
            );
          });
          sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
        }
      } catch (err) {
        console.warn('Google JS details failed', err);
      }
    }

    if (!hasCoordinates(resolved)) {
      const geocoded = await geocodeAddress(resolved.label || option.label);
      if (geocoded) {
        const selectedCity =
          resolved.city || deriveCityFromLabel(resolved.label || option.label);
        const geocodedCity = geocoded.city || deriveCityFromLabel(geocoded.label);
        const cityMismatch =
          selectedCity &&
          geocodedCity &&
          !String(geocodedCity).toLowerCase().includes(String(selectedCity).toLowerCase()) &&
          !String(selectedCity).toLowerCase().includes(String(geocodedCity).toLowerCase());

        if (cityMismatch) {
          const biasKey = extractQueryCity(selectedCity);
          const bias = biasKey ? CITY_BIAS[biasKey] : null;
          resolved = {
            ...resolved,
            city: selectedCity,
            latitude: bias?.latitude ?? resolved.latitude,
            longitude: bias?.longitude ?? resolved.longitude,
            state: resolved.state || geocoded.state || '',
            country: resolved.country || geocoded.country || 'Pakistan',
          };
        } else {
          resolved = {
            ...resolved,
            ...geocoded,
            city: selectedCity || geocodedCity,
            label: resolved.label || geocoded.label,
          };
        }
      }
    }

    if (!resolved.city) {
      resolved = {
        ...resolved,
        city: deriveCityFromLabel(resolved.label || option.label),
      };
    }

    return resolved;
  };

  const handleSelect = async (option) => {
    setOpen(false);
    if (!option) return;

    onChange(option.label);
    const resolved = await resolvePlaceWithCoords(option);
    emitPlace(resolved);
  };

  const handleDetectGps = async () => {
    setDetectingGps(true);
    setOpen(false);
    try {
      const place = await detectGpsPlace();
      if (!Number.isFinite(Number(place.latitude)) || !Number.isFinite(Number(place.longitude))) {
        toast.error(place.error || 'Unable to read GPS. Please allow location access and try again.');
        return;
      }
      emitPlace(place);
    } finally {
      setDetectingGps(false);
    }
  };

  const showList = open && (loading || options.length > 0);

  return (
    <ClickAwayListener
      onClickAway={(event) => {
        if (listRef.current?.contains(event.target)) return;
        setOpen(false);
      }}
    >
      <Box sx={{ width: 1, minWidth: 0, ...sx }}>
        <div ref={attributionRef} style={{ display: 'none' }} />

        {label && labelPlacement === 'above' ? (
          <Typography
            component="label"
            variant="caption"
            sx={{
              display: 'block',
              mb: 0.375,
              fontSize: size === 'small' ? 12 : 14,
              fontWeight: 500,
              color: 'text.secondary',
              lineHeight: 1.2,
            }}
          >
            {label}
          </Typography>
        ) : null}

        <TextField
          fullWidth
          size={size}
          inputRef={inputRef}
          value={value ?? ''}
          label={labelPlacement === 'outlined' ? label : undefined}
          placeholder="Search address or city..."
          error={Boolean(error)}
          helperText={helperText}
          InputLabelProps={labelPlacement === 'outlined' ? { shrink: true } : undefined}
          onFocus={() => {
            if (options.length || loading) setOpen(true);
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue);
            debouncedFetch(nextValue);
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                {loading || detectingGps ? <CircularProgress color="inherit" size={16} /> : null}
                <Iconify icon="solar:map-point-bold" width={18} sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          inputProps={{ autoComplete: 'off' }}
          {...other}
        />

        {showDetectGps ? (
          <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.75 }}>
            <LoadingButton
              size="small"
              color="inherit"
              loading={detectingGps}
              startIcon={<Iconify icon="solar:routing-2-bold" width={16} />}
              onClick={handleDetectGps}
            >
              Detect GPS
            </LoadingButton>
          </Stack>
        ) : null}

        <Popper
          open={showList}
          anchorEl={inputRef.current}
          placement="bottom-start"
          disablePortal={false}
          sx={{ zIndex: 1500, width: inputRef.current?.offsetWidth || 280 }}
        >
          <Paper
            ref={listRef}
            elevation={8}
            sx={{ mt: 0.5, maxHeight: 280, overflowY: 'auto', borderRadius: 1 }}
          >
            {loading && !options.length ? (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Searching locations...
                </Typography>
              </Box>
            ) : (
              options.map((option) => (
                <MenuItem
                  key={option.placeId}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                  sx={{ alignItems: 'flex-start', whiteSpace: 'normal', py: 1 }}
                >
                  <Iconify
                    icon="solar:map-point-bold"
                    width={18}
                    sx={{ mr: 1.25, mt: 0.25, color: 'primary.main', flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2">{option.mainText || option.label}</Typography>
                    {option.secondaryText ? (
                      <Typography variant="caption" color="text.secondary">
                        {option.secondaryText}
                      </Typography>
                    ) : null}
                  </Box>
                </MenuItem>
              ))
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
}
