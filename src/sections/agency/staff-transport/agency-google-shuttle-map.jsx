import { useCallback, useEffect, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';

import { CONFIG } from 'src/config-global';
import { Iconify } from 'src/components/iconify';

import { buildRouteLineCoordinates, getStopStaffCount } from 'src/_mock/_agency-staff-transport';

// ----------------------------------------------------------------------

let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google);
  }

  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-tempy-google-maps="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    script.dataset.tempyGoogleMaps = 'true';
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

function createNumberedMarkerContent({ sequence, selected, staffCount, theme }) {
  const root = document.createElement('div');
  root.style.cssText = `
    display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;
    transform: translateY(-4px);
  `;

  root.innerHTML = `
    <div style="
      width:22px;height:22px;border-radius:50%;
      background:#fff;border:1px solid rgba(0,0,0,0.12);
      display:grid;place-items:center;box-shadow:0 1px 4px rgba(0,0,0,0.2);
      color:#637381;
    ">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    </div>
    <div style="
      width:32px;height:32px;border-radius:50%;
      background:${selected ? theme.palette.warning.main : theme.palette.error.main};
      color:#fff;border:3px solid #fff;display:grid;place-items:center;
      font:700 12px/1 Inter,Arial,sans-serif;
      box-shadow:0 2px 6px rgba(0,0,0,0.28);
    ">${sequence}</div>
    <div style="
      background:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.08);
      border-radius:4px;padding:1px 5px;font:700 11px/1.2 Inter,Arial,sans-serif;color:#212B36;
    ">${staffCount}</div>
  `;

  return root;
}

// ----------------------------------------------------------------------

export function AgencyGoogleShuttleMap({
  hub,
  stops,
  selectedStopId,
  focusToken = 0,
  onSelectStop,
  sx,
}) {
  const theme = useTheme();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const lastStopsKeyRef = useRef('');
  const lastFocusTokenRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const apiKey = CONFIG.google?.mapsApiKey;

  const fitBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map || !window.google?.maps || !hub) return;

    lastFocusTokenRef.current = 0;
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend({ lat: hub.latitude, lng: hub.longitude });
    stops.forEach((stop) => bounds.extend({ lat: stop.latitude, lng: stop.longitude }));
    map.fitBounds(bounds, 64);
  }, [hub, stops]);

  useEffect(() => {
    if (!apiKey || !containerRef.current) return undefined;

    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !containerRef.current) return;

        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat: hub.latitude, lng: hub.longitude },
          zoom: 11,
          mapTypeId: 'roadmap',
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_LEFT,
          },
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          streetViewControl: true,
          streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          fullscreenControl: true,
          fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP,
          },
          scaleControl: true,
          rotateControl: false,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: [],
        });

        setReady(true);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        setError('Google Maps failed to load. Check VITE_GOOGLE_MAPS_API_KEY.');
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }
      mapRef.current = null;
    };
    // Init once per mount / api key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current;
    const google = window.google;
    if (!ready || !map || !google?.maps) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    const path = buildRouteLineCoordinates(hub, stops).map(([lng, lat]) => ({ lat, lng }));

    polylineRef.current = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: theme.palette.primary.main,
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map,
    });

    const hubMarker = new google.maps.Marker({
      map,
      position: { lat: hub.latitude, lng: hub.longitude },
      title: hub.name,
      label: {
        text: 'A',
        color: '#fff',
        fontWeight: '700',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 14,
        fillColor: theme.palette.primary.main,
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
    });

    hubMarker.addListener('click', () => onSelectStop?.(null));
    markersRef.current.push(hubMarker);

    stops.forEach((stop) => {
      const selected = selectedStopId === stop.id;
      const staffCount = getStopStaffCount(stop);

      const overlay = new google.maps.OverlayView();
      overlay.onAdd = function onAdd() {
        const div = createNumberedMarkerContent({
          sequence: stop.sequence,
          selected,
          staffCount,
          theme,
        });
        div.title = `${stop.sequence}. ${stop.name}`;
        div.addEventListener('click', (event) => {
          event.stopPropagation();
          onSelectStop?.(stop.id);
        });
        this.div = div;
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(div);
      };
      overlay.draw = function draw() {
        const projection = this.getProjection();
        if (!projection || !this.div) return;
        const point = projection.fromLatLngToDivPixel(
          new google.maps.LatLng(stop.latitude, stop.longitude)
        );
        if (!point) return;
        this.div.style.position = 'absolute';
        this.div.style.left = `${point.x}px`;
        this.div.style.top = `${point.y}px`;
        this.div.style.transform = 'translate(-50%, -100%)';
        this.div.style.zIndex = selected ? '1000' : String(stop.sequence);
      };
      overlay.onRemove = function onRemove() {
        if (this.div?.parentNode) this.div.parentNode.removeChild(this.div);
        this.div = null;
      };

      overlay.setMap(map);
      markersRef.current.push(overlay);
    });

    const stopsKey = stops.map((stop) => stop.id).join('|');
    if (stopsKey !== lastStopsKeyRef.current) {
      lastStopsKeyRef.current = stopsKey;
      lastFocusTokenRef.current = focusToken;
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: hub.latitude, lng: hub.longitude });
      stops.forEach((stop) => bounds.extend({ lat: stop.latitude, lng: stop.longitude }));
      map.fitBounds(bounds, 64);
    }
  }, [focusToken, hub, onSelectStop, ready, selectedStopId, stops, theme]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !window.google?.maps) return;

    const selected = selectedStopId
      ? stops.find((stop) => stop.id === selectedStopId)
      : null;

    if (selected && focusToken !== lastFocusTokenRef.current) {
      lastFocusTokenRef.current = focusToken;
      map.panTo({ lat: selected.latitude, lng: selected.longitude });
      map.setZoom(15);
      return;
    }

    if (!selected && lastFocusTokenRef.current !== 0) {
      fitBounds();
    }
  }, [fitBounds, focusToken, ready, selectedStopId, stops]);

  if (!apiKey) {
    return (
      <Box
        sx={{
          height: 1,
          minHeight: 420,
          display: 'grid',
          placeItems: 'center',
          bgcolor: alpha(theme.palette.grey[500], 0.08),
          ...sx,
        }}
      >
        <Stack spacing={1} alignItems="center" sx={{ p: 3, textAlign: 'center' }}>
          <Iconify icon="solar:map-bold-duotone" width={40} sx={{ color: 'primary.main' }} />
          <Typography variant="subtitle1">Google Maps key required</Typography>
          <Typography variant="body2" color="text.secondary">
            Add `VITE_GOOGLE_MAPS_API_KEY` in `.env` for the Google Maps shuttle view.
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', width: 1, height: 1, minHeight: 420, ...sx }}>
      <Box ref={containerRef} sx={{ width: 1, height: 1, minHeight: 420 }} />

      {!ready && !error && (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: alpha(theme.palette.background.paper, 0.72),
          }}
        >
          <CircularProgress size={28} />
          <Typography variant="caption">Loading Google Maps…</Typography>
        </Stack>
      )}

      {error && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ position: 'absolute', inset: 0, p: 2, textAlign: 'center' }}
        >
          <Typography color="error">{error}</Typography>
        </Stack>
      )}

      {ready && (
        <Box
          component="button"
          type="button"
          aria-label="Fit all locations"
          onClick={() => {
            onSelectStop?.(null);
            fitBounds();
          }}
          sx={{
            position: 'absolute',
            right: 12,
            bottom: 140,
            zIndex: 2,
            width: 40,
            height: 40,
            border: 'none',
            borderRadius: 1,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Iconify icon="solar:full-screen-square-bold" width={20} />
        </Box>
      )}
    </Box>
  );
}

export function isGoogleMapsConfigured() {
  return Boolean(CONFIG.google?.mapsApiKey);
}
