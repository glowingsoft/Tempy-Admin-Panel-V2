import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layer, Marker, Source } from 'react-map-gl';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { CONFIG } from 'src/config-global';
import { Iconify } from 'src/components/iconify';
import { Map, MapControl, MapPopup } from 'src/components/map';

import { buildRouteLineCoordinates, getStopStaffCount } from 'src/_mock/_agency-staff-transport';

import { AgencyLeafletShuttleMap } from './agency-leaflet-shuttle-map';

// ----------------------------------------------------------------------

function HubMarker({ hub, onClick }) {
  const theme = useTheme();

  return (
    <Marker latitude={hub.latitude} longitude={hub.longitude} onClick={onClick} anchor="bottom">
      <Stack alignItems="center" spacing={0.5} sx={{ transform: 'translateY(4px)' }}>
        <Box
          sx={{
            px: 1.25,
            py: 0.5,
            borderRadius: 1,
            bgcolor: 'primary.main',
            color: 'common.white',
            typography: 'caption',
            fontWeight: 800,
            boxShadow: theme.customShadows?.z8 || theme.shadows[4],
            whiteSpace: 'nowrap',
          }}
        >
          Agency
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.main',
            color: 'common.white',
            border: `3px solid ${theme.palette.common.white}`,
            boxShadow: theme.customShadows?.z8 || theme.shadows[4],
            cursor: 'pointer',
          }}
        >
          <Iconify icon="solar:bus-bold" width={26} />
        </Box>
      </Stack>
    </Marker>
  );
}

function StopMarker({ stop, selected, onClick }) {
  const theme = useTheme();
  const staffCount = getStopStaffCount(stop);

  return (
    <Marker latitude={stop.latitude} longitude={stop.longitude} onClick={onClick} anchor="bottom">
      <Stack
        alignItems="center"
        spacing={0.5}
        sx={{
          transform: selected ? 'translateY(4px) scale(1.06)' : 'translateY(4px)',
          transition: theme.transitions.create('transform'),
          cursor: 'pointer',
        }}
      >
        <Stack
          direction="row"
          spacing={0.25}
          alignItems="center"
          sx={{
            px: 0.75,
            py: 0.35,
            borderRadius: 5,
            bgcolor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.customShadows?.z4 || theme.shadows[2],
            color: 'text.secondary',
          }}
        >
          <Iconify icon="solar:user-bold" width={12} />
          <Typography variant="caption" fontWeight={700} sx={{ lineHeight: 1.1 }}>
            {staffCount}
          </Typography>
        </Stack>

        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            bgcolor: selected ? theme.palette.warning.main : theme.palette.error.main,
            color: 'common.white',
            border: `3px solid ${theme.palette.common.white}`,
            boxShadow: theme.customShadows?.z8 || theme.shadows[4],
            typography: 'caption',
            fontWeight: 800,
          }}
        >
          {stop.sequence}
        </Box>

        <Box
          sx={{
            px: 0.75,
            py: 0.25,
            borderRadius: 0.75,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            border: `1px solid ${theme.palette.divider}`,
            maxWidth: 120,
          }}
        >
          <Typography variant="caption" fontWeight={700} noWrap sx={{ display: 'block' }}>
            {stop.name.split(' ').slice(0, 2).join(' ')}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
            {staffCount} staff
          </Typography>
        </Box>
      </Stack>
    </Marker>
  );
}

/** Sketch-style overview when Mapbox key is missing — all locations visible at once. */
function ShuttleOverviewFallback({ hub, stops, selectedStopId, onSelectStop }) {
  const theme = useTheme();

  // Relative positions for a map-like overview canvas (not geo-accurate)
  const layout = useMemo(() => {
    const points = [
      { id: hub.id, x: 48, y: 14, isHub: true },
      ...stops.map((stop, index) => {
        const angle = ((index / Math.max(stops.length, 1)) * Math.PI * 1.2) - 0.2;
        const radius = 28 + (index % 2) * 8;
        return {
          id: stop.id,
          x: 50 + Math.cos(angle) * radius,
          y: 42 + Math.sin(angle) * (radius * 0.75),
          isHub: false,
          stop,
        };
      }),
    ];
    return points;
  }, [hub.id, stops]);

  return (
    <Box
      sx={{
        height: 1,
        minHeight: { xs: 360, md: 560 },
        position: 'relative',
        overflow: 'hidden',
        bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
        backgroundImage: (t) =>
          `radial-gradient(${alpha(t.palette.grey[500], 0.16)} 1px, transparent 1px)`,
        backgroundSize: '22px 22px',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 2,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor: 'background.paper',
          border: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        Shuttle overview · all locations
      </Typography>

      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0 }}
      >
        {stops.map((stop, index) => {
          const from =
            index === 0
              ? layout[0]
              : layout.find((point) => point.id === stops[index - 1].id) || layout[0];
          const to = layout.find((point) => point.id === stop.id);
          if (!from || !to) return null;

          return (
            <line
              key={`line-${stop.id}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={theme.palette.primary.main}
              strokeWidth="0.6"
              strokeOpacity="0.7"
              strokeDasharray="1.4 0.8"
            />
          );
        })}
      </svg>

      {layout.map((point) => {
        if (point.isHub) {
          return (
            <Box
              key={point.id}
              onClick={() => onSelectStop?.(null)}
              sx={{
                position: 'absolute',
                left: `${point.x}%`,
                top: `${point.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 3,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <Box
                sx={{
                  px: 1,
                  py: 0.35,
                  mb: 0.5,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  typography: 'caption',
                  fontWeight: 800,
                }}
              >
                Agency
              </Box>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  mx: 'auto',
                  borderRadius: 1.5,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  border: '3px solid #fff',
                  boxShadow: theme.customShadows?.z8 || theme.shadows[4],
                }}
              >
                <Iconify icon="solar:bus-bold" width={24} />
              </Box>
            </Box>
          );
        }

        const selected = selectedStopId === point.stop.id;
        const staffCount = getStopStaffCount(point.stop);

        return (
          <Box
            key={point.id}
            onClick={() => onSelectStop?.(point.stop.id)}
            sx={{
              position: 'absolute',
              left: `${point.x}%`,
              top: `${point.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: selected ? 4 : 2,
              cursor: 'pointer',
              textAlign: 'center',
              minWidth: 88,
            }}
          >
            <Stack
              direction="row"
              spacing={0.25}
              justifyContent="center"
              alignItems="center"
              sx={{
                mb: 0.5,
                color: 'text.secondary',
              }}
            >
              <Iconify icon="solar:user-bold" width={14} />
              <Typography variant="caption" fontWeight={700}>
                {staffCount}
              </Typography>
            </Stack>
            <Box
              sx={{
                width: 32,
                height: 32,
                mx: 'auto',
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: selected ? 'warning.main' : 'error.main',
                color: 'common.white',
                border: '3px solid #fff',
                typography: 'caption',
                fontWeight: 800,
                boxShadow: theme.customShadows?.z8 || theme.shadows[4],
              }}
            >
              {point.stop.sequence}
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mt: 0.5 }}>
              {point.stop.name.split(' ').slice(0, 2).join(' ')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {staffCount} staff
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function AgencyMapboxShuttleMap({ hub, stops, selectedStopId, focusToken, onSelectStop, sx }) {
  const theme = useTheme();
  const mapRef = useRef(null);
  const [popupStop, setPopupStop] = useState(null);
  const hasMapKey = Boolean(CONFIG.mapbox.apiKey);
  const lightMode = theme.palette.mode === 'light';

  const routeGeoJson = useMemo(
    () => ({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: buildRouteLineCoordinates(hub, stops),
      },
    }),
    [hub, stops]
  );

  const fitAllLocations = useCallback(() => {
    const map = mapRef.current;
    if (!map || !hub) return;

    const points = [
      [hub.longitude, hub.latitude],
      ...stops.map((stop) => [stop.longitude, stop.latitude]),
    ];

    if (!points.length) return;

    const lngs = points.map((point) => point[0]);
    const lats = points.map((point) => point[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      {
        padding: { top: 72, bottom: 72, left: 72, right: 72 },
        duration: 700,
        maxZoom: 12.5,
      }
    );
  }, [hub, stops]);

  useEffect(() => {
    if (!hasMapKey) return undefined;

    const timer = window.setTimeout(fitAllLocations, 120);
    return () => window.clearTimeout(timer);
  }, [fitAllLocations, hasMapKey, stops]);

  useEffect(() => {
    if (!selectedStopId || !hasMapKey) return;
    // Keep overview — only refresh popup, do not zoom away from all locations
    const stop = stops.find((item) => item.id === selectedStopId);
    if (stop) setPopupStop(stop);
  }, [hasMapKey, selectedStopId, stops]);

  if (!hasMapKey) {
    // Never show the old schematic grid — use street map instead
    return (
      <AgencyLeafletShuttleMap
        hub={hub}
        stops={stops}
        selectedStopId={selectedStopId}
        focusToken={focusToken}
        onSelectStop={onSelectStop}
        sx={sx}
      />
    );
  }

  return (
    <Box
      sx={{
        height: 1,
        minHeight: { xs: 360, md: 560 },
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        ...sx,
      }}
    >
      <Map
        ref={mapRef}
        initialViewState={{
          latitude: hub.latitude,
          longitude: hub.longitude,
          zoom: 10.4,
        }}
        mapStyle={`mapbox://styles/mapbox/${lightMode ? 'streets' : 'dark'}-v11`}
        style={{ width: '100%', height: '100%' }}
        onLoad={fitAllLocations}
      >
        <MapControl hideGeolocate />

        <Source id="shuttle-route" type="geojson" data={routeGeoJson}>
          <Layer
            id="shuttle-route-glow"
            type="line"
            paint={{
              'line-color': theme.palette.primary.main,
              'line-width': 10,
              'line-opacity': 0.18,
            }}
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
          />
          <Layer
            id="shuttle-route-line"
            type="line"
            paint={{
              'line-color': theme.palette.primary.main,
              'line-width': 4,
              'line-opacity': 0.92,
            }}
            layout={{
              'line-cap': 'round',
              'line-join': 'round',
            }}
          />
        </Source>

        <HubMarker
          hub={hub}
          onClick={(event) => {
            event.originalEvent.stopPropagation();
            setPopupStop({
              id: hub.id,
              name: hub.name,
              address: hub.address,
              isHub: true,
              latitude: hub.latitude,
              longitude: hub.longitude,
            });
            onSelectStop?.(null);
          }}
        />

        {stops.map((stop) => (
          <StopMarker
            key={stop.id}
            stop={stop}
            selected={selectedStopId === stop.id}
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setPopupStop(stop);
              onSelectStop?.(stop.id);
            }}
          />
        ))}

        {popupStop && (
          <MapPopup
            latitude={popupStop.latitude}
            longitude={popupStop.longitude}
            onClose={() => setPopupStop(null)}
          >
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {popupStop.isHub ? 'Agency hub' : `Stop ${popupStop.sequence}`}
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {popupStop.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {popupStop.address}
            </Typography>
            {!popupStop.isHub && (
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                {getStopStaffCount(popupStop)} staff · ETA {popupStop.eta}
              </Typography>
            )}
          </MapPopup>
        )}
      </Map>
    </Box>
  );
}
