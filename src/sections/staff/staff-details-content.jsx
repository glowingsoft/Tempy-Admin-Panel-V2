import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { STAFF_STATUS_COLOR } from 'src/_mock/_staff';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function DetailField({ label, value }) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : value;

  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="body2">{displayValue}</Typography>
    </Stack>
  );
}

function getSpecialitiesLabel(staff) {
  const values = Array.isArray(staff?.specialities)
    ? staff.specialities
    : [staff?.specialty || staff?.speciality];
  return values.join(', ') || '—';
}

function StaffProfileCard({ staff, onToggleFavorite }) {
  return (
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="flex-start">
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar
            src={staff.avatarUrl}
            alt={staff.name}
            sx={{ width: 100, height: 100 }}
          />
          {onToggleFavorite && (
            <IconButton
              size="small"
              aria-label={staff.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={onToggleFavorite}
              sx={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 28,
                height: 28,
                bgcolor: 'background.paper',
                border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              <Iconify
                icon={staff.isFavorite ? 'solar:heart-bold' : 'solar:heart-linear'}
                width={16}
                sx={{ color: staff.isFavorite ? 'error.main' : 'text.primary' }}
              />
            </IconButton>
          )}
        </Box>

        <Stack spacing={1.25} sx={{ flexGrow: 1, pt: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {staff.name || '—'}
          </Typography>

          <Typography variant="body2">{staff.email || '—'}</Typography>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Status
            </Typography>
            <Label color={STAFF_STATUS_COLOR[staff.status] || 'default'} variant="soft">
              {staff.status || 'active'}
            </Label>
          </Stack>
        </Stack>
      </Stack>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Grid container spacing={3}>
        <Grid xs={12} sm={6}>
          <Stack spacing={2.5}>
            <DetailField label="Role" value={staff.role || staff.userType} />
            <DetailField label="Specialties" value={getSpecialitiesLabel(staff)} />
            <DetailField label="Added On" value={staff.addedOn} />
          </Stack>
        </Grid>

        <Grid xs={12} sm={6}>
          <Stack spacing={2.5}>
            <DetailField label="Bookings" value={staff.bookingCount ?? 0} />
            <DetailField
              label="Average Rating"
              value={
                staff.reviewCount
                  ? `${staff.rating} (${staff.reviewCount} reviews)`
                  : `${staff.rating ?? 0}`
              }
            />
            <DetailField label="Latest Shift" value={staff.latestShiftDate} />
          </Stack>
        </Grid>
      </Grid>
    </Card>
  );
}

function SummaryCard({ staff }) {
  return (
    <Card sx={{ p: 3, borderRadius: 2, height: 1 }}>
      <Typography variant="h6" sx={{ mb: 2.5 }}>
        Summary
      </Typography>

      <Stack spacing={2.5}>
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'background.neutral',
          }}
        >
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {staff.bookingCount ?? 0}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Total Bookings
          </Typography>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: 'background.neutral',
          }}
        >
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {staff.rating ?? 0}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Average Rating ({staff.reviewCount ?? 0} reviews)
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function StaffDetailsContent({ staff, onToggleFavorite }) {
  if (!staff) return null;

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <StaffProfileCard staff={staff} onToggleFavorite={onToggleFavorite} />
        </Grid>

        <Grid xs={12} md={4}>
          <SummaryCard staff={staff} />
        </Grid>
      </Grid>
    </Stack>
  );
}
