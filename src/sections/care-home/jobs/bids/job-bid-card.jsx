import { useState, useCallback } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { fCurrency } from 'src/utils/format-number';
import { pickApiToastMessage } from 'src/store/handleApiError';

import { BidDetailsDialog } from './job-bid-details-dialog';
import { BidTags, BidPrice, BidAvatar, BidRating, BidStatusLabel, BidSupplierTypeLabel } from './job-bid-shared';
import { getBidId, isNurseBidder, getBidStatusMeta, getBidScheduleLabel, getBidSubmittedLabel, getBidSpecialitiesLabel } from './job-bid-utils';

export function getBidPermissions(bid, { hasChat = false } = {}) {
  const isAccepted = bid.status === 'accepted';
  const isClosed = bid.status === 'declined' || getBidStatusMeta(bid).closed;
  const isOpen = !isAccepted && !isClosed;

  return {
    isAccepted,
    isClosed,
    canAccept: isOpen,
    canDecline: isOpen,
    awaitingStaff: isAccepted && !isNurseBidder(bid) && !bid.bookingId,
    canChat: isAccepted && hasChat,
  };
}

const STATUS_ACCENT = {
  default: 'grey.400',
  warning: 'warning.main',
  success: 'success.main',
  error: 'error.main',
};


function BidActionButtons({ permissions, fullWidth = false, busy = false, locked = false, acceptLoading = false, onAccept, onDecline, onChat, onViewDetails }) {
  const { canAccept, canDecline, canChat, awaitingStaff } = permissions;
  const lockedHint = locked && !busy ? 'Another bid is being updated — please wait' : '';
  const buttonSx = { minHeight: 36, whiteSpace: 'nowrap', ...(fullWidth && { flex: { xs: 1, sm: 'none' } }) };

  const withLockHint = (node) =>
    lockedHint ? (
      <Tooltip title={lockedHint}>
        <Box component="span" sx={{ display: 'inline-flex', ...(fullWidth && { flex: { xs: 1, sm: 'none' } }) }}>
          {node}
        </Box>
      </Tooltip>
    ) : (
      node
    );

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      alignItems="center"
      justifyContent="flex-end"
      gap={1}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {onViewDetails ? (
        <Button size="small" color="inherit" onClick={onViewDetails} sx={{ ...buttonSx, color: 'text.secondary' }}>
          View details
        </Button>
      ) : null}

      {canChat ? (
        <Button size="small" variant="outlined" color="success" onClick={onChat} startIcon={<Iconify icon="solar:chat-round-dots-bold" width={16} />} sx={buttonSx}>
          Message
        </Button>
      ) : null}

      {awaitingStaff ? (
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: 'warning.main' }}>
          <Iconify icon="solar:clock-circle-bold" width={16} />
          <Typography variant="caption" fontWeight={600}>
            Awaiting staff assignment
          </Typography>
        </Stack>
      ) : null}

      {canDecline
        ? withLockHint(
          <Button size="small" variant="outlined" color="error" onClick={onDecline} disabled={locked} startIcon={<Iconify icon="eva:close-fill" width={16} />} sx={buttonSx}>
            Reject
          </Button>
        )
        : null}

      {canAccept
        ? withLockHint(
          <LoadingButton
            size="small"
            variant="contained"
            color="primary"
            onClick={onAccept}
            loading={acceptLoading}
            disabled={locked}
            startIcon={<Iconify icon="eva:checkmark-fill" width={16} />}
            sx={buttonSx}
          >
            Accept bid
          </LoadingButton>
        )
        : null}
    </Stack>
  );
}


function BidMetaLine({ icon, children, strong = false }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
      <Iconify icon={icon} width={16} sx={{ color: 'text.disabled' }} />
      <Typography variant="body2" noWrap sx={{ minWidth: 0, color: strong ? 'text.primary' : 'text.secondary', fontWeight: strong ? 600 : 400 }}>
        {children}
      </Typography>
    </Stack>
  );
}


export function BidCard({ bid, viewMode = 'list', onDecline, onAccepted, onChat, updatingBidId = null, showJob = true }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const bidId = getBidId(bid);
  const isList = viewMode === 'list';
  const basePermissions = getBidPermissions(bid, { hasChat: Boolean(onChat) });
  const permissions = {
    ...basePermissions,
    canAccept: basePermissions.canAccept && typeof onAccepted === 'function',
    canDecline: basePermissions.canDecline && typeof onDecline === 'function',
  };
  const statusMeta = getBidStatusMeta(bid);
  const scheduleLabel = getBidScheduleLabel(bid);
  const submittedLabel = getBidSubmittedLabel(bid);
  const specialitiesLabel = getBidSpecialitiesLabel(bid);
  const nurseBidder = isNurseBidder(bid);
  const busy = submitting || (Boolean(updatingBidId) && String(updatingBidId) === bidId);
  const locked = Boolean(updatingBidId) || submitting;

  const closeConfirm = useCallback(() => {
    if (!submitting) setConfirm(null);
  }, [submitting]);

  const handleConfirmAccept = useCallback(async () => {
    if (!bidId) {
      toast.error('Missing bid id');
      return;
    }
    if (typeof onAccepted !== 'function') {
      toast.error('Accept handler missing');
      return;
    }

    setSubmitting(true);
    try {
      const response = await onAccepted(bidId);
      toast.success(
        pickApiToastMessage(response, `Bid from ${bid.name || 'bidder'} accepted`)
      );
      setConfirm(null);
      setDetailsOpen(false);
    } catch {
    } finally {
      setSubmitting(false);
    }
  }, [bid.name, bidId, onAccepted]);

  const handleConfirmDecline = useCallback(async () => {
    setSubmitting(true);
    try {
      await onDecline?.(bid.id);
      setConfirm(null);
      setDetailsOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [bid.id, onDecline]);

  const openDetails = useCallback(() => setDetailsOpen(true), []);

  const actionHandlers = {
    permissions,
    busy,
    locked,
    acceptLoading: busy && confirm !== 'decline',
    onAccept: () => setConfirm('accept'),
    onDecline: () => setConfirm('decline'),
    onChat: () => onChat?.(bid),
  };
  const cardActions = <BidActionButtons {...actionHandlers} onViewDetails={openDetails} fullWidth />;


  const identity = (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
      <BidAvatar bid={bid} size={isList ? 48 : 44} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="subtitle1" noWrap title={bid.name} sx={{ lineHeight: 1.35 }}>
          {bid.name}
        </Typography>
        <Stack direction="row" alignItems="center" flexWrap="wrap" columnGap={1.25} rowGap={0.25}>
          <BidSupplierTypeLabel bid={bid} />
          <BidRating bid={bid} />
        </Stack>
      </Box>
    </Stack>
  );

  const jobDetails = (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      {showJob ? (
        <BidMetaLine icon="solar:case-round-bold" strong>
          {bid.jobName && bid.jobName !== bid.jobType ? `${bid.jobType} · ${bid.jobName}` : bid.jobType}
        </BidMetaLine>
      ) : null}
      <BidMetaLine icon="solar:calendar-bold" strong={!showJob}>
        {scheduleLabel || 'Schedule not specified'}
      </BidMetaLine>
      {specialitiesLabel ? <BidMetaLine icon="solar:diploma-verified-bold">{specialitiesLabel}</BidMetaLine> : null}
    </Stack>
  );

  const note = bid.description ? (
    <Typography
      variant="body2"
      title={bid.description}
      sx={{
        color: 'text.secondary',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        wordBreak: 'break-word',
      }}
    >
      {bid.description}
    </Typography>
  ) : null;

  const cardSx = {
    position: 'relative',
    borderRadius: 2,
    cursor: 'pointer',
    transition: (theme) => theme.transitions.create(['box-shadow']),
    '&::before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      bgcolor: STATUS_ACCENT[statusMeta.color] || STATUS_ACCENT.default,
    },
    '&:hover': { boxShadow: (theme) => theme.customShadows.z12 },
    ...(permissions.isClosed && {
      bgcolor: 'background.neutral',
      '& .bid-card-body': { opacity: 0.72 },
    }),
  };

  const cardProps = {
    component: 'article',
    'aria-label': `Bid from ${bid.name}`,
    onClick: openDetails,
  };

  const card = isList ? (
    <Card sx={{ ...cardSx, pl: 3, pr: 2.5, py: 2 }} {...cardProps}>
      <Box
        className="bid-card-body"
        sx={{
          display: 'grid',
          alignItems: 'center',
          columnGap: 3,
          rowGap: 1.5,
          gridTemplateColumns: {
            xs: '1fr auto',
            md: 'minmax(0, 1.3fr) minmax(0, 1fr) auto',
          },
          gridTemplateAreas: {
            xs: '"identity identity" "status status" "job job" "note note" "price price"',
            sm: '"identity status" "job price" "note note"',
            md: '"identity job price" "status note note"',
          },
        }}
      >
        <Box sx={{ gridArea: 'identity', minWidth: 0 }}>{identity}</Box>
        <Stack
          direction={{ xs: 'row', sm: 'column', md: 'row' }}
          alignItems={{ xs: 'center', sm: 'flex-end', md: 'center' }}
          flexWrap="wrap"
          gap={0.75}
          sx={{ gridArea: 'status', minWidth: 0, justifySelf: { sm: 'end', md: 'start' }, pl: { md: 7.5 } }}
        >
          <BidStatusLabel bid={bid} />
          <BidTags bid={bid} />
        </Stack>
        <Box sx={{ gridArea: 'job', minWidth: 0 }}>{jobDetails}</Box>
        <Box sx={{ gridArea: 'price', justifySelf: { xs: 'start', sm: 'end' } }}>
          <BidPrice bid={bid} align={{ xs: 'left', sm: 'right' }} />
        </Box>
        {note ? <Box sx={{ gridArea: 'note', minWidth: 0 }}>{note}</Box> : null}
      </Box>

      <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" gap={1}>
        <Typography variant="caption" color="text.disabled">
          {submittedLabel}
        </Typography>
        {cardActions}
      </Stack>
    </Card>
  ) : (
    <Card sx={{ ...cardSx, pl: 2.75, pr: 2, py: 2, height: 1, display: 'flex', flexDirection: 'column' }} {...cardProps}>
      <Stack className="bid-card-body" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
          <BidStatusLabel bid={bid} />
          <Typography variant="caption" color="text.disabled" noWrap sx={{ pt: 0.25 }}>
            {submittedLabel.replace(/^Submitted /, '')}
          </Typography>
        </Stack>
        {identity}
        <BidTags bid={bid} />
        {jobDetails}
        {note}
        <Box sx={{ flex: 1 }} />
        <BidPrice bid={bid} align="left" />
      </Stack>

      <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />

      {cardActions}
    </Card>
  );


  const confirmIsAccept = confirm === 'accept';

  return (
    <>
      {card}

      <BidDetailsDialog open={detailsOpen} onClose={() => setDetailsOpen(false)} bid={bid} showJob={showJob} actions={<BidActionButtons {...actionHandlers} fullWidth />} />

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={closeConfirm}
        title={confirmIsAccept ? 'Accept this bid?' : 'Reject this bid?'}
        content={
          <Stack spacing={1.5}>
            <Typography variant="body2">
              {confirmIsAccept ? (
                <>
                  Accept <strong>{bid.name}</strong>&apos;s bid of <strong>{fCurrency(bid.totalPrice)}</strong> ({fCurrency(bid.hourlyRate || 0)}/h)
                  {scheduleLabel ? ` for ${scheduleLabel}` : ''}? The other bids on this shift will be rejected.
                </>
              ) : (
                <>
                  Reject <strong>{bid.name}</strong>&apos;s bid of <strong>{fCurrency(bid.totalPrice)}</strong>
                  {scheduleLabel ? ` for ${scheduleLabel}` : ''}? The bid will be marked as rejected.
                </>
              )}
            </Typography>
            {confirmIsAccept && !nurseBidder ? (
              <Typography variant="body2" color="text.secondary">
                {bid.name} will then assign one of their staff to the shift.
              </Typography>
            ) : null}
          </Stack>
        }
        action={
          <LoadingButton
            variant="contained"
            color={confirmIsAccept ? 'primary' : 'error'}
            loading={submitting}
            onClick={confirmIsAccept ? handleConfirmAccept : handleConfirmDecline}
          >
            {confirmIsAccept ? 'Accept bid' : 'Reject bid'}
          </LoadingButton>
        }
      />
    </>
  );
}
