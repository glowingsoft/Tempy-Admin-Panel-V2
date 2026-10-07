import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';

import {
  TRANSPORT_STATUS_COLOR,
  formatTransportStatus,
  getStopStaffCount,
} from 'src/_mock/_agency-staff-transport';

// ----------------------------------------------------------------------

function InfoRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          display: 'grid',
          placeItems: 'center',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          color: 'primary.main',
          flexShrink: 0,
        }}
      >
        <Iconify icon={icon} width={18} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={600}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function AgencyStopDetailsDialog({ open, onClose, stop }) {
  if (!stop) return null;

  const staffCount = getStopStaffCount(stop);

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={onClose} scroll="paper">
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={2}
        sx={{ px: 3, pt: 2.5, pb: 2 }}
      >
        <Stack spacing={1} sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: 'error.main',
                color: 'common.white',
                display: 'grid',
                placeItems: 'center',
                typography: 'caption',
                fontWeight: 800,
              }}
            >
              {stop.sequence}
            </Box>
            <Typography variant="h6">Stop details</Typography>
            <Label color={TRANSPORT_STATUS_COLOR[stop.status] || 'default'} variant="soft">
              {formatTransportStatus(stop.status)}
            </Label>
          </Stack>
          <Typography variant="subtitle1">{stop.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {stop.client}
          </Typography>
        </Stack>

        <IconButton aria-label="Close stop details" onClick={onClose}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Stack>

      <Divider />

      <DialogContent sx={{ px: 3, py: 2.5 }}>
        <Stack spacing={2.5}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <InfoRow
              icon="solar:calendar-bold"
              label="Arrival window"
              value={stop.window}
            />
            <InfoRow
              icon="solar:clock-circle-bold"
              label="ETA"
              value={`${stop.eta} · ${stop.travelMinutes ?? 0} min drive`}
            />
            <InfoRow icon="solar:map-point-bold" label="Address" value={stop.address} />
            <InfoRow
              icon="solar:routing-2-bold"
              label="From previous"
              value={`${stop.fromLabel || 'Agency'} · ${stop.distanceLabel || '—'}`}
            />
            <InfoRow
              icon="solar:users-group-rounded-bold"
              label="Staff at this location"
              value={`${staffCount} people`}
            />
          </Box>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              Assigned staff
            </Typography>

            <Stack spacing={1}>
              {stop.staff.map((person) => (
                <Stack
                  key={person.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Avatar src={person.avatarUrl || undefined} alt={person.name}>
                    {person.name?.[0]}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" noWrap>
                      {person.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {person.role}
                    </Typography>
                  </Box>
                  <Label variant="soft" color="info">
                    Drop-off
                  </Label>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Status: {formatTransportStatus(stop.status)}
        </Typography>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
