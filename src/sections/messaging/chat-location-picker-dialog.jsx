import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Fab from '@mui/material/Fab';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';
import { useTheme } from '@mui/material/styles';

import { CONFIG } from 'src/config-global';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import 'leaflet/dist/leaflet.css';

// ----------------------------------------------------------------------

/**
 * Mobile-like location picker.
 * Google Map needs Cloud Billing + Maps JavaScript API.
 * If BillingNotEnabledMapError (or key blocked), we fall back to street tiles
 * so search + pin + Send Location still work. Payload stays lat/long only.
 */

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  CONFIG.google?.mapsApiKey ||
  'AIzaSyDhxIZyzA8tXTfP7VPVbi5BayMMlid2PuA';

const DEFAULT_CENTER = { lat: 31.4697, lng: 74.2728 };
const SEARCH_ZOOM = 17;
const DEFAULT_ZOOM = 14;

const STREET_TILES = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom',
};

let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tempy-google-maps="true"]');

    const finish = async () => {
      try {
        if (window.google?.maps?.importLibrary) {
          await Promise.all([
            window.google.maps.importLibrary('maps'),
            window.google.maps.importLibrary('places'),
            window.google.maps.importLibrary('geocoding'),
          ]).catch(() => null);
        }
        if (!window.google?.maps?.Map) {
          reject(new Error('Google Maps Map API unavailable'));
          return;
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

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.tempyGoogleMaps = 'true';
    script.onload = finish;
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function hasValidCoords(location = {}) {
  return (
    location.latitude != null &&
    location.longitude != null &&
    Number.isFinite(Number(location.latitude)) &&
    Number.isFinite(Number(location.longitude)) &&
    Math.abs(Number(location.latitude)) <= 90 &&
    Math.abs(Number(location.longitude)) <= 180
  );
}

function pinIcon(color) {
  return L.divIcon({
    className: 'tempy-chat-location-pin',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${color};border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.28);
    "></div>`,
  });
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(event) {
      onPick?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

function RecenterMap({ latitude, longitude, focusToken }) {
  const map = useMap();

  useEffect(() => {
    if (latitude == null || longitude == null) return;
    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) return;

    const lat = Number(latitude);
    const lng = Number(longitude);

    const run = () => {
      map.invalidateSize();
      map.setView([lat, lng], SEARCH_ZOOM, { animate: false });
      map.invalidateSize();
      window.setTimeout(() => {
        map.flyTo([lat, lng], SEARCH_ZOOM, { animate: true, duration: 0.5 });
      }, 40);
    };

    const frame = window.requestAnimationFrame(run);
    const timer = window.setTimeout(run, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [latitude, longitude, focusToken, map]);

  return null;
}

function fetchGooglePredictions(input, service, sessionToken) {
  return new Promise((resolve) => {
    if (!service || !window.google?.maps?.places) {
      resolve([]);
      return;
    }

    service.getPlacePredictions(
      { input, sessionToken: sessionToken || undefined },
      (predictions, status) => {
        const ok = window.google.maps.places.PlacesServiceStatus.OK;
        if (status !== ok || !predictions?.length) {
          resolve([]);
          return;
        }

        resolve(
          predictions.map((item) => ({
            id: item.place_id,
            label: item.description,
            primary: item.structured_formatting?.main_text || item.description,
            secondary: item.structured_formatting?.secondary_text || '',
            placeId: item.place_id,
            source: 'google',
          }))
        );
      }
    );
  });
}

async function fetchNominatimSuggestions(input) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json&addressdetails=1&limit=5`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'TempyAdminPanel/1.0 (chat-location-picker)',
    },
  });
  if (!response.ok) throw new Error('Nominatim failed');
  const data = await response.json();
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => {
      const label = String(item.display_name || '').trim();
      const primary = item.name || label.split(',')[0] || label;
      const secondary = label.includes(',') ? label.slice(label.indexOf(',') + 1).trim() : '';
      return {
        id: String(item.place_id || `${item.lat},${item.lon}`),
        label,
        primary,
        secondary,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        source: 'nominatim',
      };
    })
    .filter(
      (item) =>
        item.label && Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
    );
}

async function reverseGeocodeNominatim(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'TempyAdminPanel/1.0 (chat-location-picker)',
    },
  });
  if (!response.ok) return '';
  const data = await response.json();
  return String(data?.display_name || '').trim();
}

async function searchPlaces(input, autocompleteService, sessionToken) {
  const trimmed = String(input || '').trim();
  if (trimmed.length < 2) return [];

  try {
    const googleResults = await fetchGooglePredictions(
      trimmed,
      autocompleteService,
      sessionToken
    );
    if (googleResults.length) return googleResults;
  } catch (error) {
    console.warn('Google Places search failed', error);
  }

  return fetchNominatimSuggestions(trimmed);
}

// ----------------------------------------------------------------------

export function ChatLocationPickerDialog({
  open,
  initialLocation = null,
  submitting = false,
  onClose,
  onShare,
}) {
  const theme = useTheme();
  const apiKey = GOOGLE_MAPS_API_KEY;
  const leafletIcon = useMemo(
    () => pinIcon(theme.palette.primary.main),
    [theme.palette.primary.main]
  );

  const mapContainerRef = useRef(null);
  const attributionRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const placesServiceRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const geocoderRef = useRef(null);
  const sessionTokenRef = useRef(null);
  const searchTimerRef = useRef(null);
  const reverseTimerRef = useRef(null);
  const draftRef = useRef({ latitude: null, longitude: null });

  const [draft, setDraft] = useState({ latitude: null, longitude: null });
  const [search, setSearch] = useState('');
  const [addressLabel, setAddressLabel] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [focusToken, setFocusToken] = useState(0);
  const [mapEngine, setMapEngine] = useState('loading'); // loading | google | leaflet
  const [billingWarning, setBillingWarning] = useState('');

  draftRef.current = draft;

  const updateAddressLabel = useCallback(async (lat, lng) => {
    if (reverseTimerRef.current) window.clearTimeout(reverseTimerRef.current);

    reverseTimerRef.current = window.setTimeout(async () => {
      if (geocoderRef.current) {
        geocoderRef.current.geocode({ location: { lat, lng } }, (resultsList, status) => {
          if (status === 'OK' && resultsList?.[0]?.formatted_address) {
            setAddressLabel(resultsList[0].formatted_address);
            return;
          }
          reverseGeocodeNominatim(lat, lng).then((label) => {
            setAddressLabel(label || `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`);
          });
        });
        return;
      }

      const label = await reverseGeocodeNominatim(lat, lng);
      setAddressLabel(label || `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`);
    }, 250);
  }, []);

  const applyDraft = useCallback((lat, lng, { fly = true, updateAddress = true } = {}) => {
    const next = {
      latitude: Number(Number(lat).toFixed(7)),
      longitude: Number(Number(lng).toFixed(7)),
    };
    setDraft(next);
    draftRef.current = next;
    setResults([]);
    if (fly) setFocusToken((token) => token + 1);
    if (updateAddress) updateAddressLabel(next.latitude, next.longitude);
  }, [updateAddressLabel]);

  const moveGooglePin = useCallback(
    (lat, lng, { pan = true, zoom = SEARCH_ZOOM, updateAddress = true } = {}) => {
      const next = {
        latitude: Number(Number(lat).toFixed(7)),
        longitude: Number(Number(lng).toFixed(7)),
      };
      setDraft(next);
      draftRef.current = next;
      setResults([]);

      const map = mapRef.current;
      if (!map || !window.google?.maps) {
        if (updateAddress) updateAddressLabel(next.latitude, next.longitude);
        return;
      }

      const position = { lat: next.latitude, lng: next.longitude };

      if (markerRef.current) {
        markerRef.current.setPosition(position);
        markerRef.current.setMap(map);
      } else {
        markerRef.current = new window.google.maps.Marker({
          map,
          position,
          draggable: true,
          animation: window.google.maps.Animation.DROP,
        });
        markerRef.current.addListener('dragend', (event) => {
          const latLng = event.latLng;
          if (!latLng) return;
          moveGooglePin(latLng.lat(), latLng.lng(), { pan: false, updateAddress: true });
        });
      }

      if (pan) {
        map.panTo(position);
        map.setZoom(zoom);
      }

      if (updateAddress) updateAddressLabel(next.latitude, next.longitude);
    },
    [updateAddressLabel]
  );

  const applyPin = useCallback(
    (lat, lng, options = {}) => {
      if (mapRef.current && window.google?.maps && mapEngine === 'google') {
        moveGooglePin(lat, lng, options);
        return;
      }
      applyDraft(lat, lng, {
        fly: options.pan !== false,
        updateAddress: options.updateAddress !== false,
      });
    },
    [applyDraft, mapEngine, moveGooglePin]
  );

  useEffect(() => {
    if (!open) return;

    const next = initialLocation || {};
    const initial = {
      latitude: hasValidCoords(next) ? Number(next.latitude) : null,
      longitude: hasValidCoords(next) ? Number(next.longitude) : null,
    };
    setDraft(initial);
    draftRef.current = initial;
    setSearch('');
    setResults([]);
    setAddressLabel('');
    setFocusToken(0);
    setMapEngine('loading');
    setBillingWarning('');
  }, [initialLocation, open]);

  useEffect(() => {
    if (!open) {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
      return undefined;
    }

    let cancelled = false;
    let clickListener = null;
    let authTimer = null;
    let switchedToFallback = false;

    const startLeaflet = (reason) => {
      if (cancelled || switchedToFallback) return;
      switchedToFallback = true;
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
      setBillingWarning(
        reason ||
          'Google Maps billing is not enabled (BillingNotEnabledMapError). Using street map fallback. Enable billing to show real Google Map like mobile.'
      );
      setMapEngine('leaflet');
    };

    const boot = async () => {
      if (!apiKey) {
        startLeaflet('Google Maps API key missing. Using street map fallback.');
        return;
      }

      try {
        const prevAuth = window.gm_authFailure;
        window.gm_authFailure = () => {
          prevAuth?.();
          if (!cancelled) {
            startLeaflet(
              'BillingNotEnabledMapError / Google key blocked on web. Enable Cloud Billing + Maps JavaScript API + Places API. Do not disable those APIs.'
            );
          }
        };

        const google = await loadGoogleMaps(apiKey);
        if (cancelled || switchedToFallback || !mapContainerRef.current) return;

        try {
          autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
          sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
          placesServiceRef.current = new google.maps.places.PlacesService(
            attributionRef.current || mapContainerRef.current
          );
          geocoderRef.current = new google.maps.Geocoder();
        } catch (placesError) {
          console.warn('Places init failed', placesError);
        }

        const hasPin = hasValidCoords(draftRef.current);
        const center = hasPin
          ? { lat: Number(draftRef.current.latitude), lng: Number(draftRef.current.longitude) }
          : DEFAULT_CENTER;

        const map = new google.maps.Map(mapContainerRef.current, {
          center,
          zoom: hasPin ? SEARCH_ZOOM : DEFAULT_ZOOM,
          mapTypeId: 'roadmap',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          clickableIcons: true,
          gestureHandling: 'greedy',
          zoomControl: true,
        });

        if (switchedToFallback) return;

        mapRef.current = map;

        clickListener = map.addListener('click', (event) => {
          if (!event.latLng) return;
          moveGooglePin(event.latLng.lat(), event.latLng.lng(), {
            pan: true,
            zoom: SEARCH_ZOOM,
          });
        });

        if (hasPin) {
          moveGooglePin(draftRef.current.latitude, draftRef.current.longitude, {
            pan: true,
            zoom: SEARCH_ZOOM,
          });
        }

        window.setTimeout(() => {
          if (cancelled || switchedToFallback || !mapRef.current) return;
          google.maps.event.trigger(mapRef.current, 'resize');
          mapRef.current.setCenter(center);
        }, 80);

        authTimer = window.setTimeout(() => {
          if (cancelled || switchedToFallback) return;
          setMapEngine('google');
          setBillingWarning('');
        }, 1000);
      } catch (error) {
        console.warn(error);
        startLeaflet(error?.message || 'Google Maps failed to load.');
      }
    };

    boot();

    return () => {
      cancelled = true;
      if (authTimer) window.clearTimeout(authTimer);
      if (clickListener) clickListener.remove();
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, open, moveGooglePin]);

  useEffect(
    () => () => {
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
      if (reverseTimerRef.current) window.clearTimeout(reverseTimerRef.current);
    },
    []
  );

  const selectPlace = useCallback(
    (place) => {
      if (!place) return;

      if (Number.isFinite(place.latitude) && Number.isFinite(place.longitude)) {
        setSearch(place.primary || place.label);
        setAddressLabel(place.label);
        applyPin(place.latitude, place.longitude, {
          pan: true,
          zoom: SEARCH_ZOOM,
          updateAddress: false,
        });
        return;
      }

      if (place.placeId && placesServiceRef.current) {
        placesServiceRef.current.getDetails(
          {
            placeId: place.placeId,
            fields: ['geometry', 'name', 'formatted_address'],
            sessionToken: sessionTokenRef.current || undefined,
          },
          (details, status) => {
            if (window.google?.maps?.places?.AutocompleteSessionToken) {
              sessionTokenRef.current = new window.google.maps.places.AutocompleteSessionToken();
            }

            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              details?.geometry?.location
            ) {
              const lat = details.geometry.location.lat();
              const lng = details.geometry.location.lng();
              const label = details.formatted_address || place.label || details.name || '';
              setSearch(place.primary || details.name || label);
              setAddressLabel(label);
              applyPin(lat, lng, { pan: true, zoom: SEARCH_ZOOM, updateAddress: false });
              return;
            }

            toast.error('Could not open that place.');
          }
        );
        return;
      }

      toast.error('Could not open that place.');
    },
    [applyPin]
  );

  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearch(value);

    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        const places = await searchPlaces(
          trimmed,
          autocompleteServiceRef.current,
          sessionTokenRef.current
        );
        setResults(places);
      } catch {
        setResults([]);
        toast.error('Search failed. Try again.');
      } finally {
        setSearching(false);
      }
    }, 280);
  }, []);

  const handleSearchKeyDown = useCallback(
    async (event) => {
      if (event.key !== 'Enter') return;
      event.preventDefault();
      if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);

      if (results[0]) {
        selectPlace(results[0]);
        return;
      }

      const trimmed = search.trim();
      if (trimmed.length < 2) return;

      setSearching(true);
      try {
        const places = await searchPlaces(
          trimmed,
          autocompleteServiceRef.current,
          sessionTokenRef.current
        );
        setSearching(false);
        if (!places[0]) {
          toast.info('No places found.');
          return;
        }
        selectPlace(places[0]);
      } catch {
        setSearching(false);
        toast.error('Search failed. Try again.');
      }
    },
    [results, search, selectPlace]
  );

  const handleUseGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('GPS is unavailable.');
      return;
    }

    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDetectingGps(false);
        applyPin(position.coords.latitude, position.coords.longitude, {
          pan: true,
          zoom: SEARCH_ZOOM,
        });
      },
      (error) => {
        setDetectingGps(false);
        toast.info(
          error?.code === 1
            ? 'GPS permission denied — search or tap the map.'
            : 'Could not get GPS — search or tap the map.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [applyPin]);

  const handleShare = useCallback(async () => {
    const latitude = Number(draft.latitude);
    const longitude = Number(draft.longitude);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      toast.error('Place a pin on the map first');
      return;
    }

    await onShare?.({
      latitude: Number(latitude.toFixed(7)),
      longitude: Number(longitude.toFixed(7)),
    });
  }, [draft, onShare]);

  const leafletCenter = hasValidCoords(draft)
    ? { lat: Number(draft.latitude), lng: Number(draft.longitude) }
    : DEFAULT_CENTER;

  const showGoogle = mapEngine === 'google' || mapEngine === 'loading';
  const showLeaflet = mapEngine === 'leaflet';

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (submitting) return;
        onClose?.();
      }}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { overflow: 'hidden' } }}
    >
      <DialogTitle
        sx={{
          py: 1.5,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <IconButton edge="start" onClick={onClose} disabled={submitting} aria-label="Back">
          <Iconify icon="eva:arrow-ios-back-fill" />
        </IconButton>
        <Typography variant="h6" sx={{ flex: 1, textAlign: 'center', pr: 5 }}>
          Location
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0, position: 'relative' }}>
        <Box ref={attributionRef} sx={{ display: 'none' }} />

        {billingWarning ? (
          <Alert severity="warning" sx={{ borderRadius: 0 }}>
            {billingWarning}
          </Alert>
        ) : null}

        <Box sx={{ p: 1.5, pb: 1, position: 'relative', zIndex: 3 }}>
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search here..."
            InputProps={{
              sx: { borderRadius: 5, bgcolor: 'background.paper' },
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" width={18} />
                </InputAdornment>
              ),
              endAdornment: searching ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : null,
            }}
          />

          {results.length > 0 ? (
            <Paper
              elevation={4}
              sx={{
                mt: 1,
                maxHeight: 200,
                overflowY: 'auto',
                borderRadius: 2,
                position: 'absolute',
                left: 12,
                right: 12,
                zIndex: 5,
              }}
            >
              <List dense disablePadding>
                {results.map((place) => (
                  <ListItem key={place.id} disablePadding divider>
                    <ListItemButton onClick={() => selectPlace(place)} sx={{ py: 1.1 }}>
                      <ListItemText
                        primary={place.primary || place.label}
                        secondary={place.secondary || null}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          ) : null}

          {addressLabel ? (
            <Chip
              icon={<Iconify icon="solar:map-point-bold" width={16} />}
              label={addressLabel}
              sx={{
                mt: 1,
                maxWidth: 1,
                height: 'auto',
                py: 0.75,
                px: 0.5,
                borderRadius: 5,
                bgcolor: 'background.paper',
                boxShadow: 1,
                '& .MuiChip-label': {
                  display: 'block',
                  whiteSpace: 'normal',
                  py: 0.25,
                  fontSize: 12,
                },
              }}
            />
          ) : null}
        </Box>

        <Box sx={{ height: 380, position: 'relative', bgcolor: 'grey.200' }}>
          {showGoogle ? (
            <Box
              ref={mapContainerRef}
              sx={{ height: 1, width: 1, display: showLeaflet ? 'none' : 'block' }}
            />
          ) : null}

          {showLeaflet && open ? (
            <Box sx={{ height: 1, '& .leaflet-container': { height: '100%', width: '100%' } }}>
              <MapContainer
                key="chat-location-fallback-map"
                center={[leafletCenter.lat, leafletCenter.lng]}
                zoom={hasValidCoords(draft) ? SEARCH_ZOOM : DEFAULT_ZOOM}
                maxZoom={19}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer url={STREET_TILES.url} attribution={STREET_TILES.attribution} />
                <MapClickHandler
                  onPick={(lat, lng) =>
                    applyPin(lat, lng, { pan: true, zoom: SEARCH_ZOOM })
                  }
                />
                <RecenterMap
                  latitude={draft.latitude}
                  longitude={draft.longitude}
                  focusToken={focusToken}
                />
                {hasValidCoords(draft) ? (
                  <Marker
                    position={[Number(draft.latitude), Number(draft.longitude)]}
                    icon={leafletIcon}
                    draggable
                    eventHandlers={{
                      dragend: (event) => {
                        const { lat, lng } = event.target.getLatLng();
                        applyPin(lat, lng, { pan: false });
                      },
                    }}
                  />
                ) : null}
              </MapContainer>
            </Box>
          ) : null}

          {mapEngine === 'loading' ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{ position: 'absolute', inset: 0, bgcolor: 'background.paper', zIndex: 1 }}
            >
              <CircularProgress size={22} />
              <Typography variant="caption" color="text.secondary">
                Loading map…
              </Typography>
            </Stack>
          ) : null}

          <Fab
            size="small"
            color="primary"
            onClick={handleUseGps}
            disabled={detectingGps || submitting || mapEngine === 'loading'}
            sx={{ position: 'absolute', right: 16, bottom: 16, zIndex: 2 }}
            aria-label="My location"
          >
            {detectingGps ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Iconify icon="solar:gps-bold" width={20} />
            )}
          </Fab>
        </Box>

        {hasValidCoords(draft) ? (
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {Number(draft.latitude).toFixed(7)},{Number(draft.longitude).toFixed(7)}
            </Typography>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <LoadingButton
          fullWidth
          size="large"
          variant="contained"
          loading={submitting}
          onClick={handleShare}
          disabled={!hasValidCoords(draft)}
          sx={{ borderRadius: 1.5, py: 1.25, textTransform: 'none', fontWeight: 700 }}
        >
          Send Location
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
