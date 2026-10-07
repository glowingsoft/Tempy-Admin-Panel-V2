import { debounce } from 'lodash';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { CONFIG } from 'src/config-global';

import { Iconify } from '../iconify';

// ----------------------------------------------------------------------

let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.places) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function formatPhotonLabel(properties) {
  const parts = [
    properties.name,
    properties.housenumber,
    properties.street,
    properties.district,
    properties.city,
    properties.state,
    properties.country,
  ].filter(Boolean);

  return [...new Set(parts)].join(', ');
}

async function fetchPhotonSuggestions(input) {
  const response = await fetch(
    `https://photon.komoot.io/api/?${new URLSearchParams({
      q: input,
      limit: '8',
      lang: 'en',
    })}`
  );

  if (!response.ok) {
    throw new Error('Photon request failed');
  }

  const data = await response.json();

  return (data.features ?? []).map((feature) => ({
    label: formatPhotonLabel(feature.properties),
    placeId: `photon-${feature.properties.osm_id}`,
    source: 'photon',
  }));
}

async function fetchMapboxSuggestions(input, accessToken) {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?${new URLSearchParams({
      access_token: accessToken,
      autocomplete: 'true',
      limit: '8',
    })}`
  );

  if (!response.ok) {
    throw new Error('Mapbox request failed');
  }

  const data = await response.json();

  return (data.features ?? []).map((feature) => ({
    label: feature.place_name,
    placeId: feature.id,
    source: 'mapbox',
  }));
}

function fetchGoogleSuggestions(input, autocompleteService, sessionToken) {
  return new Promise((resolve) => {
    autocompleteService.getPlacePredictions(
      { input, sessionToken },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          resolve(
            predictions.map((prediction) => ({
              label: prediction.description,
              placeId: prediction.place_id,
              source: 'google',
            }))
          );
          return;
        }

        resolve([]);
      }
    );
  });
}

// ----------------------------------------------------------------------

export function RHFGoogleAddress({ name, label, helperText, placeholder, ...other }) {
  const { control, setValue } = useFormContext();

  const googleApiKey = CONFIG.google.mapsApiKey;
  const mapboxApiKey = CONFIG.mapbox.apiKey;

  const [isGoogleReady, setIsGoogleReady] = useState(!!window.google?.maps?.places);
  const [options, setOptions] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const sessionToken = useRef(null);
  const placesDivRef = useRef(null);

  const useGoogle = Boolean(googleApiKey);

  useEffect(() => {
    if (!useGoogle) return undefined;

    let isMounted = true;

    loadGoogleMaps(googleApiKey)
      .then((google) => {
        if (!isMounted) return;

        autocompleteService.current = new google.maps.places.AutocompleteService();
        placesService.current = new google.maps.places.PlacesService(placesDivRef.current);
        sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        setIsGoogleReady(true);
      })
      .catch((error) => {
        console.error('Google Places failed to load:', error);
      });

    return () => {
      isMounted = false;
    };
  }, [googleApiKey, useGoogle]);

  const fetchSuggestions = useCallback(
    async (input) => {
      if (!input?.trim()) {
        setOptions([]);
        setDropdownOpen(false);
        return;
      }

      setFetching(true);

      try {
        let suggestions = [];

        if (useGoogle && isGoogleReady && autocompleteService.current) {
          suggestions = await fetchGoogleSuggestions(
            input,
            autocompleteService.current,
            sessionToken.current
          );
        } else if (mapboxApiKey) {
          suggestions = await fetchMapboxSuggestions(input, mapboxApiKey);
        } else {
          suggestions = await fetchPhotonSuggestions(input);
        }

        setOptions(suggestions);
        setDropdownOpen(suggestions.length > 0);
      } catch (error) {
        console.error('Address suggestions failed:', error);
        setOptions([]);
        setDropdownOpen(false);
      } finally {
        setFetching(false);
      }
    },
    [isGoogleReady, mapboxApiKey, useGoogle]
  );

  const debouncedFetch = useMemo(() => debounce(fetchSuggestions, 350), [fetchSuggestions]);

  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch]);

  const handleSelectPlace = (option) => {
    if (!option?.label) return;

    if (option.source === 'google' && placesService.current && option.placeId) {
      placesService.current.getDetails(
        {
          placeId: option.placeId,
          fields: ['formatted_address'],
          sessionToken: sessionToken.current,
        },
        (place, status) => {
          const address =
            status === window.google.maps.places.PlacesServiceStatus.OK
              ? place?.formatted_address ?? option.label
              : option.label;

          setValue(name, address, { shouldValidate: true, shouldDirty: true });

          if (window.google?.maps?.places?.AutocompleteSessionToken) {
            sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
          }
        }
      );
      return;
    }

    setValue(name, option.label, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <>
      <div ref={placesDivRef} style={{ display: 'none' }} />

      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <Autocomplete
            freeSolo
            fullWidth
            open={dropdownOpen}
            onOpen={() => {
              if (options.length > 0) setDropdownOpen(true);
            }}
            onClose={() => setDropdownOpen(false)}
            filterOptions={(items) => items}
            options={options}
            loading={fetching}
            inputValue={typeof field.value === 'string' ? field.value : ''}
            onInputChange={(_, value, reason) => {
              if (reason === 'input' || reason === 'clear') {
                field.onChange(typeof value === 'string' ? value : '');
              }

              if (reason === 'input') {
                debouncedFetch(value);
              }

              if (reason === 'clear') {
                setOptions([]);
                setDropdownOpen(false);
              }
            }}
            onChange={(_, newValue) => {
              setDropdownOpen(false);

              if (!newValue) {
                return;
              }

              if (typeof newValue === 'string') {
                field.onChange(newValue);
                return;
              }

              handleSelectPlace(newValue);
            }}
            getOptionLabel={(option) => {
              if (!option) return '';
              if (typeof option === 'string') return option;
              return option.label || '';
            }}
            isOptionEqualToValue={(option, value) => {
              if (typeof option === 'string' || typeof value === 'string') {
                return option === value;
              }

              return option.placeId === value.placeId;
            }}
            noOptionsText={field.value ? 'No locations found' : 'Type to search locations'}
            componentsProps={{
              popper: {
                placement: 'bottom-start',
                sx: { zIndex: 1500 },
              },
            }}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <li key={option.placeId || key} {...optionProps}>
                  <Iconify
                    icon="solar:map-point-bold"
                    width={18}
                    sx={{ mr: 1.5, color: 'primary.main', flexShrink: 0 }}
                  />
                  {option.label}
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder ?? 'Search address or place name'}
                error={!!error}
                helperText={error?.message ?? helperText}
                InputLabelProps={{
                  ...params.InputLabelProps,
                  shrink: true,
                }}
                onFocus={() => {
                  if (options.length > 0) setDropdownOpen(true);
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {fetching ? <CircularProgress color="inherit" size={18} /> : null}
                      {params.InputProps.endAdornment}
                      <InputAdornment position="end">
                        <Iconify
                          icon="solar:map-point-bold"
                          width={20}
                          sx={{ color: 'text.disabled' }}
                        />
                      </InputAdornment>
                    </>
                  ),
                }}
                inputProps={{
                  ...params.inputProps,
                  autoComplete: 'off',
                  name: `address-search-${name}`,
                }}
                {...other}
              />
            )}
          />
        )}
      />
    </>
  );
};
