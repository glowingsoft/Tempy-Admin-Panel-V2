import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { StaffDetailsContent } from './staff-details-content';

// ----------------------------------------------------------------------

export function StaffDetailsDialog({ open, onClose, staff, onToggleFavorite }) {
  if (!staff) return null;

  return (
    <Dialog fullWidth maxWidth="md" open={open} onClose={onClose} scroll="paper">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 3, py: 2, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton onClick={onClose}>
            <Iconify icon="eva:arrow-ios-back-fill" />
          </IconButton>
          <Typography variant="h6">Staff details</Typography>
        </Stack>
        <IconButton aria-label="Close staff details" onClick={onClose}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </Stack>

      <DialogContent sx={{ p: 3 }}>
        <StaffDetailsContent staff={staff} onToggleFavorite={onToggleFavorite} />
      </DialogContent>
    </Dialog>
  );
}
