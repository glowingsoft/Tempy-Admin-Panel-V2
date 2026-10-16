import { useEffect, useMemo } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { getJobDateParts } from 'src/components/jobs/job-date-filters';
import { extractLatLng } from 'src/sections/agency/jobs/agency-job-api-utils';

import 'leaflet/dist/leaflet.css';

// ----------------------------------------------------------------------

/** Esri street tiles — no API key (CARTO voyager now watermarks “API KEY REQUIRED”). */
const TILES = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom',
};

function FitMarkers({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const timer = window.setTimeout(() => {
      if (points.length === 1) {
        map.setView(points[0], 13);
        return;
      }
      map.fitBounds(points, { padding: [32, 32], maxZoom: 13 });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [map, points]);

  return null;
}

function pinIcon(theme) {
  return L.divIcon({
    className: 'tempy-job-map-pin',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    html: `<div style="
      width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
      background:${theme.palette.primary.main};border:2px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,.28);
    "></div>`,
  });
}

export function AgencyJobsMapView({ jobs = [] }) {
  const theme = useTheme();

  const mappedJobs = useMemo(
    () =>
      jobs
        .map((job) => {
          const point = extractLatLng(job, { allowZero: false });
          if (!point) return null;
          return { job, lat: point.latitude, lng: point.longitude };
        })
        .filter(Boolean),
    [jobs]
  );

  const points = useMemo(
    () => mappedJobs.map((item) => [item.lat, item.lng]),
    [mappedJobs]
  );

  const missingCount = jobs.length - mappedJobs.length;
  const icon = useMemo(() => pinIcon(theme), [theme]);

  if (!mappedJobs.length) {
    return (
      <Card sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <Iconify icon="solar:map-point-bold-duotone" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          No map locations yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Jobs need a pin (latitude / longitude) before they can show on the map.
        </Typography>
      </Card>
    );
  }

  return (
    <Stack spacing={1.5}>
      {missingCount > 0 ? (
        <Typography variant="caption" color="text.secondary">
          Showing {mappedJobs.length} of {jobs.length} jobs with a map pin.
        </Typography>
      ) : null}

      <Card sx={{ borderRadius: 2, overflow: 'hidden', height: { xs: 420, md: 560 } }}>
        <Box sx={{ height: 1, '& .leaflet-container': { height: '100%', width: '100%' } }}>
          <MapContainer
            center={points[0]}
            zoom={11}
            scrollWheelZoom
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url={TILES.url} attribution={TILES.attribution} />
            <FitMarkers points={points} />
            {mappedJobs.map(({ job, lat, lng }) => {
              const parts = getJobDateParts(job);
              return (
                <Marker key={job.cardKey || job.id} position={[lat, lng]} icon={icon}>
                  <Popup>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {job.title}
                    </Typography>
                    <Typography variant="caption" display="block">
                      {parts.label}
                    </Typography>
                    {job.address ? (
                      <Typography variant="caption" display="block" color="text.secondary">
                        {job.address}
                      </Typography>
                    ) : null}
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </Box>
      </Card>
    </Stack>
  );
}
