import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, TileLayer, useMap, ZoomControl } from 'react-leaflet';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

import { buildRouteLineCoordinates, getStopStaffCount } from 'src/_mock/_agency-staff-transport';

import 'leaflet/dist/leaflet.css';

// ----------------------------------------------------------------------

/** Esri street tiles — no API key (CARTO voyager now watermarks “API KEY REQUIRED”). */
const STREET_TILES = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom',
};

const OVERVIEW_MAX_ZOOM = 12.2;
const STOP_FOCUS_ZOOM = 15;

function MapEffects({ hub, stops, selectedStopId, focusToken }) {
  const map = useMap();
  const lastStopsKey = useRef('');
  const lastFocusToken = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(timer);
  }, [map, stops.length]);

  useEffect(() => {
    if (!hub) return;

    const stopsKey = stops.map((stop) => stop.id).join('|');
    const selected = selectedStopId
      ? stops.find((stop) => stop.id === selectedStopId)
      : null;

    // New route / date / vehicle → show full overview once
    if (stopsKey !== lastStopsKey.current) {
      lastStopsKey.current = stopsKey;
      lastFocusToken.current = focusToken;
      const points = [
        [hub.latitude, hub.longitude],
        ...stops.map((stop) => [stop.latitude, stop.longitude]),
      ];
      map.fitBounds(L.latLngBounds(points), {
        padding: [64, 64],
        maxZoom: OVERVIEW_MAX_ZOOM,
        animate: true,
      });
      return;
    }

    // Card / marker select → zoom into that location (focusToken allows re-zoom)
    if (selected && focusToken !== lastFocusToken.current) {
      lastFocusToken.current = focusToken;
      map.flyTo([selected.latitude, selected.longitude], STOP_FOCUS_ZOOM, {
        duration: 0.75,
      });
      return;
    }

    // Deselect → back to overview
    if (!selected && lastFocusToken.current !== 0) {
      lastFocusToken.current = 0;
      const points = [
        [hub.latitude, hub.longitude],
        ...stops.map((stop) => [stop.latitude, stop.longitude]),
      ];
      map.fitBounds(L.latLngBounds(points), {
        padding: [64, 64],
        maxZoom: OVERVIEW_MAX_ZOOM,
        animate: true,
      });
    }
  }, [focusToken, hub, map, selectedStopId, stops]);

  return null;
}

function createHubIcon(theme) {
  return L.divIcon({
    className: 'tempy-shuttle-marker',
    iconSize: [48, 56],
    iconAnchor: [24, 56],
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:auto">
        <div style="
          background:${theme.palette.primary.main};color:#fff;font:800 11px/1 Inter,Arial,sans-serif;
          padding:4px 8px;border-radius:6px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.25);
        ">Agency</div>
        <div style="
          width:42px;height:42px;border-radius:12px;background:${theme.palette.primary.main};
          border:3px solid #fff;display:grid;place-items:center;box-shadow:0 2px 8px rgba(0,0,0,.28);
          color:#fff;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h8v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm9 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zM5 11V6h14v5H5z"/>
          </svg>
        </div>
      </div>
    `,
  });
}

/** One person icon + numbered pin + staff count — no name labels (cleaner, Google-like). */
function createStopIcon({ sequence, selected, staffCount, theme }) {
  const fill = selected ? theme.palette.warning.main : theme.palette.error.main;
  const scale = selected ? 'scale(1.08)' : 'scale(1)';

  return L.divIcon({
    className: 'tempy-shuttle-marker',
    iconSize: [36, 64],
    iconAnchor: [18, 64],
    html: `
      <div style="
        display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;
        transform:${scale};transition:transform .15s ease;pointer-events:auto;
      ">
        <div style="
          width:20px;height:20px;border-radius:50%;background:#fff;border:1px solid rgba(0,0,0,.12);
          display:grid;place-items:center;box-shadow:0 1px 3px rgba(0,0,0,.2);color:#637381;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        <div style="
          width:${selected ? 34 : 30}px;height:${selected ? 34 : 30}px;border-radius:50%;
          background:${fill};color:#fff;border:3px solid #fff;display:grid;place-items:center;
          font:700 12px/1 Inter,Arial,sans-serif;box-shadow:0 2px 6px rgba(0,0,0,.28);
        ">${sequence}</div>
        <div style="
          background:#fff;border:1px solid rgba(0,0,0,.1);border-radius:999px;
          padding:1px 6px;font:700 10px/1.3 Inter,Arial,sans-serif;color:#212B36;
          box-shadow:0 1px 3px rgba(0,0,0,.12);white-space:nowrap;
        ">${staffCount}</div>
      </div>
    `,
  });
}

function MapRefBridge({ mapRef }) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);

  return null;
}

// ----------------------------------------------------------------------

export function AgencyLeafletShuttleMap({
  hub,
  stops,
  selectedStopId,
  focusToken = 0,
  onSelectStop,
  sx,
}) {
  const theme = useTheme();
  const mapRef = useRef(null);

  const routePositions = useMemo(
    () => buildRouteLineCoordinates(hub, stops).map(([lng, lat]) => [lat, lng]),
    [hub, stops]
  );

  const hubIcon = useMemo(() => createHubIcon(theme), [theme]);
  const mapKey = useMemo(
    () => `${hub.id}-${stops.map((s) => s.id).join(',')}`,
    [hub.id, stops]
  );

  const handleFitAll = () => {
    onSelectStop?.(null);
    const map = mapRef.current;
    if (!map || !hub) return;
    const points = [
      [hub.latitude, hub.longitude],
      ...stops.map((stop) => [stop.latitude, stop.longitude]),
    ];
    map.fitBounds(L.latLngBounds(points), {
      padding: [64, 64],
      maxZoom: OVERVIEW_MAX_ZOOM,
      animate: true,
    });
  };

  return (
    <Box
      sx={{
        position: 'relative',
        width: 1,
        height: 1,
        minHeight: 420,
        bgcolor: '#e5e3df',
        '& .leaflet-container': {
          width: '100%',
          height: '100%',
          minHeight: 420,
          fontFamily: theme.typography.fontFamily,
          background: '#e5e3df',
        },
        '& .tempy-shuttle-marker': {
          background: 'transparent',
          border: 'none',
        },
        '& .leaflet-control-zoom': {
          border: 'none !important',
          marginRight: '12px !important',
          marginBottom: '24px !important',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        },
        '& .leaflet-control-zoom a': {
          width: '40px !important',
          height: '40px !important',
          lineHeight: '40px !important',
          fontSize: '22px !important',
          color: '#5f6368 !important',
          background: '#fff !important',
        },
        // Keep custom fit-all button clear of +/- zoom stack (80px + 24px margin + 12px gap)
        '& .tempy-fit-all-btn': {
          bottom: 116,
          right: 12,
        },
        '& .leaflet-control-attribution': {
          fontSize: 10,
          background: 'rgba(255,255,255,0.75) !important',
        },
        ...sx,
      }}
    >
      <MapContainer
        key={mapKey}
        center={[hub.latitude, hub.longitude]}
        zoom={11}
        zoomControl={false}
        scrollWheelZoom
        style={{ width: '100%', height: '100%', minHeight: 420 }}
      >
        <TileLayer
          url={STREET_TILES.url}
          attribution={STREET_TILES.attribution}
          subdomains="abcd"
          maxZoom={20}
        />
        <ZoomControl position="bottomright" />
        <MapRefBridge mapRef={mapRef} />
        <MapEffects
          hub={hub}
          stops={stops}
          selectedStopId={selectedStopId}
          focusToken={focusToken}
        />

        <Polyline
          positions={routePositions}
          pathOptions={{
            color: theme.palette.primary.main,
            weight: 5,
            opacity: 0.92,
          }}
        />

        <Marker
          position={[hub.latitude, hub.longitude]}
          icon={hubIcon}
          eventHandlers={{
            click: () => onSelectStop?.(null),
          }}
          zIndexOffset={2000}
        />

        {stops.map((stop) => {
          const selected = selectedStopId === stop.id;
          return (
            <Marker
              key={stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={createStopIcon({
                sequence: stop.sequence,
                selected,
                staffCount: getStopStaffCount(stop),
                theme,
              })}
              eventHandlers={{
                click: () => onSelectStop?.(stop.id),
              }}
              zIndexOffset={selected ? 1500 : stop.sequence}
            />
          );
        })}
      </MapContainer>

      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        sx={{
          position: 'absolute',
          left: 12,
          top: 12,
          zIndex: 1000,
          px: 1.25,
          py: 0.75,
          borderRadius: 1,
          bgcolor: 'background.paper',
          boxShadow: '0 1px 4px rgba(0,0,0,0.24)',
          pointerEvents: 'none',
        }}
      >
        <Iconify icon="solar:map-bold-duotone" width={18} sx={{ color: 'primary.main' }} />
        <Typography variant="caption" fontWeight={700}>
          {selectedStopId ? 'Zoomed to stop' : `Street map · ${stops.length} stops`}
        </Typography>
      </Stack>

      <Box
        component="button"
        type="button"
        aria-label="Show all locations"
        className="tempy-fit-all-btn"
        onClick={handleFitAll}
        sx={{
          position: 'absolute',
          right: 12,
          bottom: 116,
          zIndex: 1000,
          width: 40,
          height: 40,
          border: 'none',
          borderRadius: '2px',
          bgcolor: '#fff',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          color: '#5f6368',
          '&:hover': { bgcolor: '#f8f9fa' },
        }}
      >
        <Iconify icon="solar:full-screen-square-bold" width={20} />
      </Box>
    </Box>
  );
}
