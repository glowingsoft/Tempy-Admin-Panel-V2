import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fDateTime } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

import { BidTags, BidStatusLabel, BidProfileSummary } from './job-bid-shared';
import { isNurseJobType, formatShiftTime, getBidSubmittedLabel, formatShiftDateLabel, getBidWeeklyHoursLabel, getBidSpecialitiesLabel } from './job-bid-utils';

// ----------------------------------------------------------------------

function DetailRow({ icon, label, children }) {
  if (children == null || children === '' || children === false) return null;

  return (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Iconify icon={icon} width={18} sx={{ color: 'text.disabled', mt: 0.25 }} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" component="dt">
          {label}
        </Typography>
        <Typography variant="body2" component="dd" sx={{ m: 0, wordBreak: 'break-word' }}>
          {children}
        </Typography>
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function BidDetailsDialog({ open, onClose, bid, actions, showJob = true }) {
  if (!bid) return null;

  const isNurseJob = isNurseJobType(bid.jobType);
  const submittedAt = bid.createdAt ? fDateTime(bid.createdAt) : '';
  const submittedLabel = getBidSubmittedLabel(bid);
  const shiftDate = formatShiftDateLabel(bid.shiftDate);
  const shiftTime = formatShiftTime(bid.shiftTime);
  const note = bid.note || bid.description;
  const breakLabel = bid.shiftBreak ? `Includes ${bid.shiftBreakMin ? `${bid.shiftBreakMin} min ` : ''}break` : '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="bid-details-title">
      <DialogTitle id="bid-details-title" sx={{ pr: 7, pb: 1 }}>
        Bid details
        <Tooltip title="Close">
          <IconButton aria-label="Close" onClick={onClose} sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </Tooltip>
      </DialogTitle>

      <DialogContent sx={{ pb: 3 }}>
        <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2.5 }}>
          <BidStatusLabel bid={bid} />
          <BidTags bid={bid} />
          {submittedLabel ? (
            <Tooltip title={submittedAt || ''}>
              <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto' }}>
                {submittedLabel}
              </Typography>
            </Tooltip>
          ) : null}
        </Stack>

        <BidProfileSummary bid={bid} />

        <Divider sx={{ my: 2.5, borderStyle: 'dashed' }} />

        <Box
          component="dl"
          sx={{
            m: 0,
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
          }}
        >
          {showJob ? (
            <DetailRow icon="solar:case-round-bold" label="Job">
              {bid.jobName && bid.jobName !== bid.jobType ? `${bid.jobType} · ${bid.jobName}` : bid.jobType}
            </DetailRow>
          ) : null}
          <DetailRow icon="solar:map-point-bold" label="Location">
            {bid.jobAddress}
          </DetailRow>
          {isNurseJob ? (
            <DetailRow icon="solar:clock-circle-bold" label="Weekly hours available">
              {getBidWeeklyHoursLabel(bid) || 'Not specified'}
            </DetailRow>
          ) : (
            <>
              <DetailRow icon="solar:calendar-bold" label="Shift date">
                {shiftDate}
              </DetailRow>
              <DetailRow icon="solar:clock-circle-bold" label="Shift time">
                {[shiftTime, breakLabel].filter(Boolean).join(' · ')}
              </DetailRow>
            </>
          )}
          <DetailRow icon="solar:tag-price-bold" label="Hourly rate">
            {`${fCurrency(bid.hourlyRate || 0)}/h`}
          </DetailRow>
          <DetailRow icon="solar:wad-of-money-bold" label="Total bid">
            {`${fCurrency(bid.totalPrice)}${bid.totalHours ? ` for ${bid.totalHours}h` : ''}`}
          </DetailRow>
          <DetailRow icon="solar:diploma-verified-bold" label="Specialities">
            {getBidSpecialitiesLabel(bid)}
          </DetailRow>
          {bid.assignedStaff ? (
            <DetailRow icon="solar:user-check-bold" label="Assigned staff">
              {bid.assignedStaff}
            </DetailRow>
          ) : null}
        </Box>

        {note ? (
          <Box sx={{ mt: 2.5, p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
            <Typography variant="overline" color="text.secondary" component="p" sx={{ mb: 0.5 }}>
              {bid.note ? 'Message from bidder' : 'Job description'}
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
              {note}
            </Typography>
          </Box>
        ) : null}
      </DialogContent>

      {actions ? (
        <DialogActions sx={{ borderTop: (theme) => `1px dashed ${theme.vars.palette.divider}`, pt: 2 }}>
          <Box sx={{ width: 1 }}>{actions}</Box>
        </DialogActions>
      ) : null}
    </Dialog>
  );
}
