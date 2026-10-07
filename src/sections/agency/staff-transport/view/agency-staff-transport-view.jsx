import { useCallback, useEffect, useMemo, useState } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import AvatarGroup from '@mui/material/AvatarGroup';
import InputLabel from '@mui/material/InputLabel';
import { alpha, useTheme } from '@mui/material/styles';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';

import {
  TRANSPORT_DATES,
  TRANSPORT_STATUS_COLOR,
  buildShuttlePlan,
  createInitialTransportPlan,
  formatClock,
  formatTransportStatus,
  getStopStaffCount,
} from 'src/_mock/_agency-staff-transport';

import { AgencyTransportMap } from '../agency-transport-map';
import { AgencyStopDetailsDialog } from '../agency-stop-details-dialog';

// ----------------------------------------------------------------------

const SIDEBAR_W = 360;
/** Approx card height + gap — keep at least 5 cards visible before scroll. */
const STOP_CARD_ROW_PX = 148;
const VISIBLE_STOP_CARDS = 5;
const STOP_LIST_MIN_H = STOP_CARD_ROW_PX * VISIBLE_STOP_CARDS;

function MetricCard({ icon, label, value, color = 'primary' }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2,
        height: 1,
        borderRadius: 2,
        boxShadow: theme.customShadows?.z1,
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: alpha(theme.palette[color].main, 0.12),
            color: `${color}.main`,
          }}
        >
          <Iconify icon={icon} width={22} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {label}
          </Typography>
          <Typography variant="h6" noWrap>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

function StopCard({ stop, selected, onOpen }) {
  const staffCount = getStopStaffCount(stop);
  const driveMin = stop.travelMinutes || stop.etaMinutes || 0;

  return (
    <Card
      onClick={() => onOpen(stop)}
      sx={{
        p: 1.75,
        cursor: 'pointer',
        borderRadius: 2,
        border: (theme) =>
          `1px solid ${selected ? theme.palette.primary.main : theme.palette.divider}`,
        bgcolor: (theme) =>
          selected ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
        transition: (theme) => theme.transitions.create(['border-color', 'background-color']),
        '&:hover': {
          borderColor: 'primary.main',
        },
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: selected ? 'primary.main' : 'error.main',
              color: 'common.white',
              display: 'grid',
              placeItems: 'center',
              typography: 'caption',
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {stop.sequence}
          </Box>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" noWrap>
                {stop.name}
              </Typography>
              <Label color={TRANSPORT_STATUS_COLOR[stop.status] || 'default'} variant="soft">
                {formatTransportStatus(stop.status)}
              </Label>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>
              {stop.address}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <AvatarGroup
            max={4}
            sx={{
              '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 12 },
            }}
          >
            {stop.staff.map((person) => (
              <Avatar key={person.id} alt={person.name} src={person.avatarUrl} />
            ))}
          </AvatarGroup>

          <Stack spacing={0.25} alignItems="flex-end">
            <Typography variant="caption" fontWeight={700}>
              {staffCount} staff
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
              ETA {stop.eta}
            </Typography>
            <Typography variant="caption" fontWeight={700} color="primary.main">
              {driveMin} min drive
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stop.distanceLabel || '—'}
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function AgencyStaffTransportView() {
  const theme = useTheme();
  const initialPlan = useMemo(() => createInitialTransportPlan(), []);

  const [date, setDate] = useState(initialPlan.date);
  const [routeMode, setRouteMode] = useState(initialPlan.routeMode);
  const [selectedStopId, setSelectedStopId] = useState(initialPlan.stops[0]?.id || null);
  const [focusToken, setFocusToken] = useState(0);
  const [detailsStop, setDetailsStop] = useState(null);
  const [optimizing, setOptimizing] = useState(false);

  const vehicleId = initialPlan.vehicleId;

  const plan = useMemo(
    () => buildShuttlePlan({ date, vehicleId, routeMode }),
    [date, vehicleId, routeMode]
  );

  const { stops, metrics, hub, departureTime } = plan;

  useEffect(() => {
    if (!selectedStopId) {
      setSelectedStopId(stops[0]?.id || null);
      return;
    }
    const stillExists = stops.some((stop) => stop.id === selectedStopId);
    if (!stillExists) setSelectedStopId(stops[0]?.id || null);
  }, [selectedStopId, stops]);

  useEffect(() => {
    setDetailsStop((prev) => {
      if (!prev) return prev;
      return stops.find((stop) => stop.id === prev.id) || null;
    });
  }, [stops]);

  const handleOpenStopDetails = useCallback((stop) => {
    if (!stop) return;
    setSelectedStopId(stop.id);
    setDetailsStop(stop);
    setFocusToken((token) => token + 1);
  }, []);

  const handleSelectStopOnMap = useCallback(
    (stopId) => {
      if (!stopId) {
        setSelectedStopId(null);
        setFocusToken((token) => token + 1);
        return;
      }

      const stop = stops.find((item) => item.id === stopId);
      setSelectedStopId(stopId);
      setFocusToken((token) => token + 1);
      if (stop) setDetailsStop(stop);
    },
    [stops]
  );

  const handleOptimize = useCallback(async () => {
    setOptimizing(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    const next = buildShuttlePlan({ date, vehicleId, routeMode: 'optimized' });
    setRouteMode('optimized');
    setSelectedStopId(next.stops[0]?.id || null);
    setFocusToken((token) => token + 1);
    setOptimizing(false);
    toast.success(
      routeMode === 'optimized'
        ? `Already on nearest-first order · ${next.stops.length} stops · ${next.metrics.distanceLabel}`
        : `Route optimized · ${next.stops.length} stops · nearest location first · ${next.metrics.distanceLabel}`
    );
  }, [date, routeMode, vehicleId]);

  const handleResetOrder = useCallback(() => {
    const next = buildShuttlePlan({ date, vehicleId, routeMode: 'original' });
    setRouteMode('original');
    setSelectedStopId(next.stops[0]?.id || null);
    setFocusToken((token) => token + 1);
    toast.info(
      routeMode === 'original'
        ? `Already on original order · ${next.stops.length} stops · ${next.metrics.distanceLabel}`
        : `Original list order restored · ${next.stops.length} stops · ${next.metrics.distanceLabel}`
    );
  }, [date, routeMode, vehicleId]);

  const handleDateChange = useCallback(
    (event) => {
      const nextDate = event.target.value;
      const next = buildShuttlePlan({ date: nextDate, vehicleId, routeMode });
      setDate(nextDate);
      setSelectedStopId(next.stops[0]?.id || null);
      setFocusToken((token) => token + 1);
      toast.success(
        `${next.stops.length} locations · departs ${formatClock(next.departureMinutes)} · ETAs & statuses updated`
      );
    },
    [routeMode, vehicleId]
  );

  return (
    <DashboardContent maxWidth={false}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h4">Staff Shuttle</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Change date to refresh stops, statuses, and ETAs — Optimize / Reset reorder the map
              route.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon="solar:restart-bold" />}
              onClick={handleResetOrder}
            >
              Reset order
            </Button>
            <LoadingButton
              variant="contained"
              loading={optimizing}
              startIcon={<Iconify icon="solar:routing-2-bold" />}
              onClick={handleOptimize}
            >
              Optimize route
            </LoadingButton>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))',
            },
          }}
        >
          <MetricCard
            icon="solar:users-group-rounded-bold"
            label="Staff on route"
            value={metrics.totalStaff}
            color="primary"
          />
          <MetricCard
            icon="solar:map-point-bold"
            label="Locations"
            value={metrics.totalStops}
            color="info"
          />
          <MetricCard
            icon="solar:routing-2-bold"
            label="Route distance"
            value={metrics.distanceLabel}
            color="warning"
          />
          <MetricCard
            icon="solar:clock-circle-bold"
            label="Est. duration"
            value={metrics.durationLabel}
            color="success"
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              lg: `${SIDEBAR_W}px minmax(0, 1fr)`,
            },
            alignItems: 'stretch',
            height: {
              xs: 'auto',
              lg: `max(calc(100vh - 260px), ${STOP_LIST_MIN_H + 280}px)`,
            },
            minHeight: { xs: STOP_LIST_MIN_H + 280, lg: STOP_LIST_MIN_H + 280 },
          }}
        >
          <Card
            sx={{
              p: 2,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              height: { xs: STOP_LIST_MIN_H + 320, lg: 1 },
              minHeight: 0,
              boxShadow: theme.customShadows?.z1,
            }}
          >
            <Stack spacing={1.5} sx={{ mb: 1.5, flexShrink: 0 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Route planner
                </Typography>
                <Label
                  variant="soft"
                  color={routeMode === 'optimized' ? 'success' : 'default'}
                >
                  {routeMode === 'optimized' ? 'Optimized' : 'Original order'}
                </Label>
              </Stack>

              <FormControl fullWidth size="small">
                <InputLabel id="transport-date-label">Date</InputLabel>
                <Select
                  labelId="transport-date-label"
                  label="Date"
                  value={date}
                  onChange={handleDateChange}
                >
                  {TRANSPORT_DATES.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                  border: (t) => `1px dashed ${alpha(t.palette.primary.main, 0.24)}`,
                }}
              >
                <Typography variant="caption" color="text.secondary" display="block">
                  Departs {departureTime} · {stops.length} locations on this date
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2">Location sequence</Typography>
                <Typography variant="caption" color="text.secondary">
                  {stops.length} stops · click card or map pin for staff details
                </Typography>
              </Box>
            </Stack>

            <Scrollbar sx={{ flex: '1 1 0', minHeight: STOP_LIST_MIN_H }}>
              <Stack spacing={1.25} sx={{ pr: 1, pb: 1 }}>
                {!stops.length ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    No locations for this date. Try another date.
                  </Typography>
                ) : (
                  stops.map((stop) => (
                    <StopCard
                      key={stop.id}
                      stop={stop}
                      selected={selectedStopId === stop.id}
                      onOpen={handleOpenStopDetails}
                    />
                  ))
                )}
              </Stack>
            </Scrollbar>
          </Card>

          <Card
            sx={{
              p: 0,
              borderRadius: 2,
              minWidth: 0,
              overflow: 'hidden',
              height: { xs: 480, lg: 1 },
              minHeight: { xs: 420, lg: 0 },
              boxShadow: theme.customShadows?.z1,
            }}
          >
            <AgencyTransportMap
              hub={hub}
              stops={stops}
              selectedStopId={selectedStopId}
              focusToken={focusToken}
              onSelectStop={handleSelectStopOnMap}
              sx={{ height: 1, minHeight: { xs: 420, lg: '100%' } }}
            />
          </Card>
        </Box>
      </Stack>

      <AgencyStopDetailsDialog
        open={Boolean(detailsStop)}
        stop={detailsStop}
        onClose={() => setDetailsStop(null)}
      />
    </DashboardContent>
  );
}
