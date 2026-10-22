import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';

import { canReofferBid, formatBidDeadlineLabel } from './bids-actions';
import {
  canEditAgencyBid,
  canWithdrawAgencyBid,
  normalizeAgencyBidStatus,
} from './agency-bid-api-utils';


const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning' },
  accepted: { label: 'Accepted', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
  deleted: { label: 'Deleted', color: 'default' },
  withdraw: { label: 'Withdraw', color: 'warning' },
  cancelledByWorker: { label: 'Cancelled by worker', color: 'error' },
  cancelledByEmployer: { label: 'Cancelled by employer', color: 'error' },
  cancelledByUser: { label: 'Cancelled by user', color: 'error' },
};

function DetailRow({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Iconify icon={icon} width={20} sx={{ color: 'text.secondary', mt: 0.25, flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.disabled" display="block">
          {label}
        </Typography>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Stack>
  );
}

export function AgencyBidDetailDialog({ open, bid, onClose, onEdit, onWithdraw, onChat }) {
  if (!bid) return null;

  const statusConfig = STATUS_CONFIG[normalizeAgencyBidStatus(bid.status)] || STATUS_CONFIG.pending;
  const canReoffer = canReofferBid(bid);
  const deadlineLabel = formatBidDeadlineLabel(bid);
  const reduced =
    bid.originalBidAmount != null && Number(bid.originalBidAmount) > Number(bid.bidAmount);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
            <JobMediaThumb image={bid.image} alt={bid.jobTitle} width={48} height={48} />
            <Typography variant="h6" sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              {bid.jobTitle}
            </Typography>
          </Stack>
          <Chip
            label={statusConfig.label}
            size="small"
            color={statusConfig.color}
            variant="soft"
            sx={{ flexShrink: 0 }}
          />
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {bid.jobRef}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <DetailRow icon="solar:calendar-clock-bold" label="Date & Time" value={bid.schedule || '—'} />
          <DetailRow icon="solar:map-point-bold" label="Location" value={bid.address || '—'} />
          <DetailRow icon="solar:buildings-2-bold" label="Care home" value={bid.careHome} />

          {bid.status === 'pending' && deadlineLabel && (
            <DetailRow
              icon="solar:clock-circle-bold"
              label="Pending deadline"
              value={canReoffer ? deadlineLabel : 'Deadline passed — re-offer closed'}
            />
          )}

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Stack direction="row" spacing={3} flexWrap="wrap">
            <Box>
              <Typography variant="caption" color="text.disabled" display="block">
                Bid amount
              </Typography>
              <Typography variant="h5" color="primary.main">
                {fCurrency(bid.bidAmount)}
              </Typography>
              {reduced && (
                <Typography variant="caption" color="success.main">
                  Re-offered down from {fCurrency(bid.originalBidAmount)}
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="caption" color="text.disabled" display="block">
                Hourly rate
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {fCurrency(bid.hourlyRate)}/hr
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.disabled" display="block">
                Hours
              </Typography>
              <Typography variant="subtitle1" fontWeight={600}>
                {bid.hours}h
              </Typography>
            </Box>
          </Stack>

          {(bid.notes || bid.note) && (
            <DetailRow
              icon="solar:document-text-bold"
              label="Note"
              value={bid.notes || bid.note}
            />
          )}

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Stack spacing={0.75}>
            <Typography variant="caption" color="text.disabled">
              Submitted {bid.submittedAt}
            </Typography>
            {bid.updatedAt && (
              <Typography variant="caption" color="info.main">
                Last updated {bid.updatedAt}
                {bid.reofferCount ? ` · ${bid.reofferCount} re-offer${bid.reofferCount > 1 ? 's' : ''}` : ''}
              </Typography>
            )}
            {bid.acceptedAt && (
              <Typography variant="caption" color="success.main">
                Accepted {bid.acceptedAt}
              </Typography>
            )}
            {bid.declinedAt && (
              <Typography variant="caption" color="error.main">
                Declined {bid.declinedAt}
              </Typography>
            )}
            {bid.withdrawnAt && (
              <Typography variant="caption" color="text.secondary">
                Withdrawn {bid.withdrawnAt}
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {bid.status === 'accepted' && onChat ? (
          <Button
            variant="outlined"
            color="success"
            startIcon={<Iconify icon="solar:chat-round-dots-bold" width={18} />}
            onClick={() => onChat(bid)}
          >
            Chat with job poster
          </Button>
        ) : null}
        {onEdit && canEditAgencyBid(bid) && (
          <Button variant="outlined" color="primary" onClick={() => onEdit(bid)}>
            Edit bid
          </Button>
        )}
        {onWithdraw && canWithdrawAgencyBid(bid) && (
          <Button color="error" variant="outlined" onClick={() => onWithdraw(bid)}>
            Withdraw bid
          </Button>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" color="primary" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
