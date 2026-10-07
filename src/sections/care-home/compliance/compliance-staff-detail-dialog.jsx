import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { WORKER_COMPLIANCE_STATUS } from './care-home-compliance-data';

function workerInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'W';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function ComplianceStaffDetailDialog({ open, onClose, staff }) {
  if (!staff) return null;

  const statusMeta = WORKER_COMPLIANCE_STATUS[staff.status] || WORKER_COMPLIANCE_STATUS.pending;
  const qualifications = staff.qualifications || [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{ position: 'absolute', right: 12, top: 12, zIndex: 1 }}
      >
        <Iconify icon="mingcute:close-line" />
      </IconButton>

      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar src={staff.avatarUrl || undefined} sx={{ width: 44, height: 44 }}>
            {workerInitials(staff.name)}
          </Avatar>
          <Box>
            <Typography variant="h6">{staff.name}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {staff.role ? (
                <Typography variant="body2" color="text.secondary">
                  {staff.role}
                </Typography>
              ) : null}
              <Label variant="soft" color={statusMeta.color}>
                {statusMeta.label}
              </Label>
            </Stack>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Qualifications
        </Typography>
        {qualifications.length ? (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {qualifications.map((title) => (
              <Chip
                key={title}
                variant="soft"
                color="primary"
                label={title}
                icon={<Iconify icon="solar:verified-check-bold" width={16} />}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No qualifications with an uploaded certificate yet. Original files stay on the worker
            profile — this list only shows verified titles.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
