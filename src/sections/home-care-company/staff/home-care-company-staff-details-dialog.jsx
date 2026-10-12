import Box from '@mui/material/Box';
import Grid from '@mui/material/Unstable_Grid2';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fCurrency } from 'src/utils/format-number';
import { getStaffStatusLabel } from 'src/_mock/_staff';

function DetailItem({ label, value }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Stack>
  );
}

export function HomeCareCompanyStaffDetailsDialog({ open, onClose, staff }) {
  if (!staff) return null;

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose}>
      <DialogContent sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ mb: 3 }}>
          <Avatar src={staff.avatarUrl || undefined} alt={staff.name} sx={{ width: 80, height: 80 }}>
            {staff.name?.[0]}
          </Avatar>
          <Box>
            <Typography variant="h6">{staff.name || 'Staff details'}</Typography>
            <Typography variant="body2" color="text.secondary">
              {staff.email || '—'}
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={2.5}>
          <Grid xs={12} sm={6}>
            <DetailItem label="Specialty" value={staff.specialty} />
          </Grid>
          <Grid xs={12} sm={6}>
            <DetailItem label="Status" value={getStaffStatusLabel(staff.status)} />
          </Grid>
          <Grid xs={12} sm={6}>
            <DetailItem label="Phone" value={staff.phone} />
          </Grid>
          <Grid xs={12} sm={6}>
            <DetailItem label="Gender" value={staff.gender} />
          </Grid>
          <Grid xs={12} sm={6}>
            <DetailItem label="Rate per hour" value={staff.ratePerHour != null ? fCurrency(staff.ratePerHour) : ''} />
          </Grid>
          <Grid xs={12} sm={6}>
            <DetailItem
              label="Platform percent"
              value={staff.platformPercent != null ? `${staff.platformPercent}%` : ''}
            />
          </Grid>
          <Grid xs={12} sm={6}>
            <DetailItem label="Tax Number" value={staff.taxNumber} />
          </Grid>
          <Grid xs={12} sm={6}>
            <DetailItem label="Added On" value={staff.addedOn} />
          </Grid>
          <Grid xs={12}>
            <DetailItem label="Location" value={staff.branchName} />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
