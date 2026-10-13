import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LoadingButton from '@mui/lab/LoadingButton';

import { fCurrency } from 'src/utils/format-number';
import { fDateTime, fToNow } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

const STATUS_COLOR = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'error',
};

function ProfileRow({ label, value }) {
  if (value == null || value === '') return null;

  return (
    <Stack direction="row" spacing={2} alignItems="flex-start" justifyContent="space-between">
      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function formatRate(value) {
  if (value == null || value === '') return '';
  const amount = fCurrency(value);
  return amount ? `${amount}/hr` : '';
}

function formatPercent(value) {
  if (value == null || value === '') return '';
  return `${value}%`;
}

export function StaffRequestProfileDialog({
  request,
  open,
  onClose,
  onAccept,
  onReject,
  responding = false,
  activeAction = '',
  viewOnly = false,
}) {
  const invited = request?.createdAt ? fDateTime(request.createdAt) : '';
  const invitedAgo = request?.createdAt ? fToNow(request.createdAt) : '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pr: 6 }}>
        Agency profile
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      {request ? (
        <>
          <DialogContent>
            <Stack spacing={2.5}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar src={request.avatarUrl || undefined} alt={request.agencyName} sx={{ width: 72, height: 72 }}>
                  {request.agencyName?.[0]}
                </Avatar>

                <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                  <Typography variant="h6" noWrap>
                    {request.agencyName}
                  </Typography>
                  {request.email ? (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {request.email}
                    </Typography>
                  ) : null}
                  <Label
                    variant="soft"
                    color={STATUS_COLOR[request.status] || 'default'}
                    sx={{ width: 'fit-content', textTransform: 'capitalize' }}
                  >
                    {request.status}
                  </Label>
                </Stack>
              </Stack>

              <Divider sx={{ borderStyle: 'dashed' }} />

              <Stack spacing={1.25}>
                <ProfileRow label="Specialty" value={request.specialtyLabel || request.specialty} />
                <ProfileRow label="Rate per hour" value={formatRate(request.ratePerHour)} />
                <ProfileRow label="Platform percent" value={formatPercent(request.platformPercent)} />
                <ProfileRow label="Phone" value={request.phone} />
                <ProfileRow label="Company" value={request.companyName} />
                <ProfileRow label="Address" value={request.address} />
                <ProfileRow
                  label="Invited"
                  value={[invited, invitedAgo].filter(Boolean).join(' · ')}
                />
              </Stack>

              {request.message ? (
                <Typography variant="body2" color="text.secondary">
                  {request.message}
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>

          {request.canRespond && !viewOnly ? (
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <LoadingButton
                variant="outlined"
                color="error"
                loading={responding && activeAction === 'reject'}
                disabled={responding}
                onClick={() => onReject?.(request)}
                startIcon={<Iconify icon="solar:close-circle-bold" width={18} />}
              >
                Reject
              </LoadingButton>
              <LoadingButton
                variant="contained"
                color="success"
                loading={responding && activeAction === 'accept'}
                disabled={responding}
                onClick={() => onAccept?.(request)}
                startIcon={<Iconify icon="solar:check-circle-bold" width={18} />}
              >
                Accept
              </LoadingButton>
            </DialogActions>
          ) : null}
        </>
      ) : null}
    </Dialog>
  );
}
