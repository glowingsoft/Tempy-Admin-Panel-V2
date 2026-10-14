import { useMemo } from 'react';
import { MapContainer, CircleMarker, Popup, TileLayer } from 'react-leaflet';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { visibleScrollY } from 'src/theme/styles';

import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

import 'leaflet/dist/leaflet.css';

// ----------------------------------------------------------------------

const WORLD_CENTER = [30, 20];

function toCount(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function heatColor(intensity) {
  if (intensity >= 0.5) return '#1b5e20';
  if (intensity >= 0.15) return '#43a047';
  if (intensity >= 0.05) return '#f9a825';
  return '#c62828';
}

function pointKey(point, index) {
  return `${point.id || point.label}-${point.lat}-${point.lng}-${index}`;
}

export function AdminRegionalHeatMap({
  title = 'Regional heat map',
  subheader = 'Bookings by location',
  points: pointsProp = [],
}) {
  const theme = useTheme();
  const rows = useMemo(() => (Array.isArray(pointsProp) ? pointsProp : []), [pointsProp]);

  const mapPoints = useMemo(
    () =>
      rows.filter(
        (point) =>
          Number.isFinite(Number(point?.lat)) &&
          Number.isFinite(Number(point?.lng)) &&
          Math.abs(Number(point.lat)) <= 90 &&
          Math.abs(Number(point.lng)) <= 180
      ),
    [rows]
  );

  const maxTotal = Math.max(1, ...mapPoints.map((point) => toCount(point.total)));

  const mapCenter = useMemo(() => {
    if (!mapPoints.length) return WORLD_CENTER;
    const lat = mapPoints.reduce((sum, point) => sum + Number(point.lat), 0) / mapPoints.length;
    const lng = mapPoints.reduce((sum, point) => sum + Number(point.lng), 0) / mapPoints.length;
    return [lat, lng];
  }, [mapPoints]);

  return (
    <Card sx={{ height: 1, minHeight: 360, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={title} subheader={subheader} />
      {rows.length ? (
        <Box sx={{ px: 2, pb: 2, flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {mapPoints.length ? (
            <Box sx={{ height: 220, borderRadius: 1.5, overflow: 'hidden', flexShrink: 0 }}>
              <MapContainer
                center={mapCenter}
                zoom={mapPoints.length === 1 ? 8 : 4}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                />
                {mapPoints.map((point, index) => {
                  const total = toCount(point.total);
                  const intensity = Number(point.intensity) || 0;
                  return (
                    <CircleMarker
                      key={pointKey(point, index)}
                      center={[Number(point.lat), Number(point.lng)]}
                      radius={7 + (total / maxTotal) * 16}
                      pathOptions={{
                        color: heatColor(intensity),
                        fillColor: heatColor(intensity),
                        fillOpacity: 0.55,
                        weight: 1,
                      }}
                    >
                      <Popup>
                        <Typography variant="subtitle2">{point.label}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">
                          {[point.state, point.country].filter(Boolean).join(', ')}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          Total {total} · Pending {toCount(point.pending)} · Active{' '}
                          {toCount(point.active)}
                        </Typography>
                        <Typography variant="body2">
                          In progress {toCount(point.inProgress)} · Completed{' '}
                          {toCount(point.completed)} · Cancelled {toCount(point.cancelled)}
                        </Typography>
                        <Typography variant="caption" display="block">
                          Intensity {intensity}
                        </Typography>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </MapContainer>
            </Box>
          ) : null}

          <Stack spacing={1.25} sx={{ mt: 1.5, minHeight: 0, flexGrow: 1, maxHeight: 220, ...visibleScrollY }}>
            {rows.map((row, index) => {
              const total = toCount(row.total);
              const intensity = Number(row.intensity) || 0;
              const width = `${Math.max(4, Math.min(100, (total / maxTotal) * 100))}%`;

              return (
                <Box key={pointKey(row, index)}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography variant="body2" sx={{ flexGrow: 1, minWidth: 0, fontWeight: 500 }}>
                      {row.label || 'Unknown'}
                    </Typography>
                    <Typography variant="subtitle2" sx={{ flexShrink: 0 }}>
                      {total}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    Pending {toCount(row.pending)} · Active {toCount(row.active)} · In progress{' '}
                    {toCount(row.inProgress)} · Completed {toCount(row.completed)} · Cancelled{' '}
                    {toCount(row.cancelled)} · Intensity {intensity}
                  </Typography>
                  <Box
                    sx={{
                      height: 6,
                      borderRadius: 1,
                      bgcolor: theme.vars.palette.grey[200],
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width,
                        height: 1,
                        borderRadius: 1,
                        bgcolor: heatColor(intensity),
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Box>
      ) : (
        <DashboardEmptyState message="No regional heat map data yet" />
      )}
    </Card>
  );
}
