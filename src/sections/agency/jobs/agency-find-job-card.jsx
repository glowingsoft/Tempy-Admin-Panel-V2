import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import AvatarGroup from '@mui/material/AvatarGroup';

import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';
import { getJobDateParts } from 'src/components/jobs/job-date-filters';
import { fCurrency } from 'src/utils/format-number';

import {
  canEditAgencyBid,
  normalizeAgencyBidStatus,
} from 'src/sections/agency/bids/agency-bid-api-utils';
import {
  hasStaffShiftEnded,
  getStaffJobShiftStart,
  getStaffShiftEnd,
} from 'src/sections/staff-member/jobs/staff-member-job-utils';
import { resolveJobAttendance } from 'src/sections/staff-member/jobs/staff-member-attendance';
import { hasAttendanceRecord } from 'src/sections/staff-member/jobs/nurse-checkin-api-utils';

import { buildMapsUrl } from './agency-job-care-details-store';
import { toast } from 'src/components/snackbar';


function isCompletedWorkJob(job) {
  return (
    String(job?.apiStatus || '').toLowerCase() === 'completed' ||
    String(job?.status || '').toLowerCase() === 'completed' ||
    String(job?.shiftRows?.[0]?.status || '').toLowerCase() === 'completed' ||
    String(job?.bookingStatus || '').toLowerCase() === 'completed'
  );
}

function hasSupplierWorkAction(job) {
  return ['assignStaff', 'assigned', 'reassign', 'awaitingWorker', 'viewStaff'].includes(job?.actionType);
}

function shouldUseActiveJobActions(variant, mode, job) {
  if (variant === 'active' && job?.status === 'active') return true;
  if (variant !== 'all' && variant !== 'completed') return false;

  if (mode === 'staffMember') {
    const ownShift =
      job?.status === 'active' ||
      Boolean(job?.bookingStatus) ||
      Boolean(String(job?.bookingId || '').trim());
    if (!ownShift) return false;
    return job?.status === 'active' || variant === 'completed' || isCompletedWorkJob(job);
  }

  if (job?.status === 'active') return true;
  return (variant === 'completed' || isCompletedWorkJob(job)) && hasSupplierWorkAction(job);
}

function isFindJobsBidVariant(variant, mode, job) {
  if (shouldUseActiveJobActions(variant, mode, job)) return false;

  return (
    variant === 'new' ||
    variant === 'all' ||
    variant === 'pending' ||
    variant === 'active' ||
    variant === 'inactive'
  );
}

const CANCELLED_BOOKING_STATUSES = ['cancelledByWorker', 'cancelledByEmployer', 'cancelledByUser'];

function hasShiftEnded(row, job) {
  if (Number.isFinite(row?.endsAt)) return row.endsAt <= Date.now();
  return hasStaffShiftEnded(row?.endTime ? row : job);
}

const SHIFT_ENDED_AFTER_MS = 48 * 60 * 60 * 1000;

function shiftPassedAtMs(row, job) {
  if (Number.isFinite(row?.endsAt)) return row.endsAt;
  const end = getStaffShiftEnd(row?.endTime || row?.date ? row : job);
  if (end) return end.getTime();
  if (Number.isFinite(row?.startsAt)) return row.startsAt;
  const start = getStaffJobShiftStart(
    row?.date ? { shiftDate: row.date, shiftStartTime: row.startTime } : job
  );
  return start ? start.getTime() : NaN;
}

function isShiftPast48Hours(row, job) {
  const at = shiftPassedAtMs(row, job);
  return Number.isFinite(at) && Date.now() - at >= SHIFT_ENDED_AFTER_MS;
}

function formatAttendanceTime(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

const descriptionSx = {
  color: 'text.secondary',
  fontSize: '0.75rem',
  lineHeight: 1.45,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const bidButtonSx = {
  minWidth: 60,
  px: 0.75,
  py: 0.25,
  fontSize: 10,
  fontWeight: 700,
  borderRadius: 1,
  flexShrink: 0,
  boxShadow: 'none',
};

const actionButtonSx = {
  minWidth: 90,
  px: 1,
  py: 0.35,
  fontSize: 10,
  fontWeight: 700,
  borderRadius: 1,
  boxShadow: 'none',
};

function getShiftRows(job) {
  if (job.shiftRows?.length) return job.shiftRows;

  if (job.schedules?.length) {
    return job.schedules.map((label, index) => ({ id: `schedule-${index}`, label }));
  }

  if (job.schedule) {
    return [{ id: 'schedule-0', label: job.schedule }];
  }

  return [];
}

function formatBreakLabel(job) {
  const hasMins = job?.breakMin != null && job.breakMin !== '';
  const type = String(job?.breakType || '').trim();
  if (hasMins && type) return `${job.breakMin} min · ${type}`;
  if (hasMins) return `${job.breakMin} min`;
  if (type) return type;
  return '—';
}

function getAllowedPersons(job) {
  // Prefer this card's shift (expanded rows), then job-level API field
  const fromShift = Number(job?.shiftRows?.[0]?.allowedPersons);
  if (Number.isFinite(fromShift) && fromShift > 0) return fromShift;
  const fromJob = Number(job?.allowedPersons);
  if (Number.isFinite(fromJob) && fromJob > 0) return fromJob;
  return null;
}

function getAllShiftRows(job) {
  if (Array.isArray(job?.allShiftRows) && job.allShiftRows.length) return job.allShiftRows;
  return getShiftRows(job);
}
function hasJobDistance(job) {
  return job?.distance != null && job.distance !== '';
}

const metaChipSx = {
  height: 20,
  fontSize: 9,
  fontWeight: 600,
  border: 'none',
  bgcolor: 'action.hover',
  color: 'text.primary',
  '&:hover': {
    border: 'none',
    bgcolor: 'info.lighter',
    color: 'info.darker',
  },
};

const shiftDateRowSx = {
  minWidth: 0,
  color: 'text.primary',
  '&:hover': { color: 'info.darker' },
};

const shiftDateChipSx = {
  maxWidth: 1,
  fontWeight: 700,
  fontSize: 11,
  border: 'none',
  bgcolor: 'transparent',
  color: 'inherit',
  '&:hover': { bgcolor: 'transparent', color: 'inherit', border: 'none' },
  '& .MuiChip-icon': { color: 'inherit' },
  '& .MuiChip-label': { color: 'inherit' },
};

function JobMetaChips({ job, postedAt }) {
  const bidsCount = Number(job?.bidsCount) || 0;
  const allowedPersons = getAllowedPersons(job);

  return (
    <Stack
      direction="row"
      flexWrap="nowrap"
      gap={0.4}
      alignItems="center"
      sx={{ mb: 0.5, minHeight: 20, width: 1 }}
    >
      {hasJobDistance(job) ? (
        <Chip
          label={job.distance}
          size="small"
          variant="outlined"
          sx={{
            ...metaChipSx,
            maxWidth: 110,
            '& .MuiChip-label': { px: 0.75, overflow: 'hidden', textOverflow: 'ellipsis' },
          }}
        />
      ) : null}
      {bidsCount > 0 ? (
        <Chip
          label={`${bidsCount} bid${bidsCount === 1 ? '' : 's'}`}
          size="small"
          variant="outlined"
          sx={{ ...metaChipSx, flexShrink: 0 }}
        />
      ) : null}
      {allowedPersons ? (
        <Chip
          label={`${allowedPersons} staff`}
          size="small"
          variant="outlined"
          sx={{ ...metaChipSx, flexShrink: 0 }}
        />
      ) : null}
      {postedAt ? (
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', ml: 'auto', fontSize: 10, flexShrink: 0 }}
        >
          {postedAt}
        </Typography>
      ) : null}
    </Stack>
  );
}

function JobLocationBlock({ job, sx }) {
  const mapsUrl = buildMapsUrl(job);
  const addressLabel = String(job.address || '').trim();
  const lat = Number(job.latitude);
  const lng = Number(job.longitude);
  const hasCoords =
    Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

  const handleOpenMaps = () => {
    if (!mapsUrl) {
      toast.warning('No map location available for this job');
      return;
    }
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  const mapsTooltip = !mapsUrl
    ? 'No location available'
    : hasCoords
      ? addressLabel
        ? `Open pin on Google Maps (${addressLabel})`
        : 'Open pin on Google Maps'
      : `Search Google Maps: ${addressLabel}`;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '14px minmax(0, 1fr) auto',
        gridTemplateRows: hasJobDistance(job) ? 'auto 14px' : 'auto',
        columnGap: 0.75,
        rowGap: 0.35,
        alignItems: 'center',
        minHeight: 32,
        ...sx,
      }}
    >
      <Iconify
        icon="solar:map-point-bold"
        width={13}
        sx={{ color: 'text.secondary', display: 'block' }}
      />

      <Tooltip title={addressLabel || ''} arrow>
        <Typography
          variant="caption"
          noWrap
          sx={{
            fontSize: 10,
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {addressLabel || '—'}
        </Typography>
      </Tooltip>

      <Tooltip title={mapsTooltip} arrow>
        <span>
          <IconButton
            size="small"
            disabled={!mapsUrl}
            onClick={handleOpenMaps}
            aria-label="Open location in Google Maps"
            sx={{
              p: 0,
              width: 18,
              height: 18,
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Iconify icon="solar:map-arrow-right-bold" width={13} />
          </IconButton>
        </span>
      </Tooltip>

      {hasJobDistance(job) ? (
        <>
          <Iconify
            icon="solar:routing-2-bold"
            width={13}
            sx={{ color: 'text.disabled', display: 'block' }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              gridColumn: '2 / 4',
              fontSize: 10,
              lineHeight: 1.45,
            }}
          >
            {job.distance}
          </Typography>
        </>
      ) : null}
    </Box>
  );
}

function PostedByFooter({ job, postedBy, isCareHome }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 'auto', pt: 0.25 }}>
      {isCareHome ? (
        <Box
          sx={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon="solar:buildings-2-bold" width={12} />
        </Box>
      ) : (
        <Avatar src={postedBy.avatarUrl} alt={postedBy.name} sx={{ width: 24, height: 24 }}>
          {postedBy.name?.[0]}
        </Avatar>
      )}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="caption" fontWeight={700} noWrap sx={{ display: 'block', fontSize: 10 }}>
          {postedBy.name}
        </Typography>
        {(postedBy.rating != null || job.rating != null) && (
          <Stack direction="row" alignItems="center" spacing={0.25}>
            <Iconify icon="material-symbols:star" width={11} sx={{ color: '#FFB800' }} />
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10 }}>
              {postedBy.rating ?? job.rating ?? 0} ({postedBy.reviewCount ?? job.reviewCount ?? 0})
            </Typography>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}


function JobStatusChip({ job, variant }) {
  if (variant === 'previous') {
    return (
      <Chip
        label="Completed"
        size="small"
        sx={{
          height: 20,
          fontSize: 9,
          fontWeight: 700,
          bgcolor: 'success.lighter',
          color: 'success.dark',
          flexShrink: 0,
        }}
      />
    );
  }

  if (!job.shiftType) return null;

  if (job.requestFromCareHome) {
    return (
      <Stack direction="row" spacing={0.4} sx={{ flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Chip
          label="Direct Request"
          size="small"
          sx={{
            height: 20,
            fontSize: 9,
            fontWeight: 700,
            bgcolor: 'common.white',
            color: 'warning.darker',
            border: '1px solid',
            borderColor: 'warning.main',
          }}
        />
        <Chip
          label={job.shiftType}
          size="small"
          sx={{
            height: 20,
            fontSize: 9,
            fontWeight: 700,
            bgcolor: 'primary.lighter',
            color: 'primary.dark',
          }}
        />
      </Stack>
    );
  }

  return (
    <Chip
      label={job.shiftType}
      size="small"
      sx={{
        height: 20,
        fontSize: 9,
        fontWeight: 700,
        bgcolor: 'primary.lighter',
        color: 'primary.dark',
        flexShrink: 0,
      }}
    />
  );
}

function AttendanceAction({ job, onOpen, sx }) {
  return (
    <Button
      size="small"
      variant="outlined"
      color="primary"
      startIcon={<Iconify icon="solar:camera-bold" width={13} />}
      onClick={(event) => {
        event.stopPropagation();
        onOpen?.(job);
      }}
      sx={{
        ...bidButtonSx,
        minWidth: 'auto',
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      Attendance
    </Button>
  );
}

function AttendanceSpot({ job, showButton, notCheckedIn, onOpen, sx }) {
  if (!showButton && !notCheckedIn) return null;

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={sx}>
      {notCheckedIn && (
        <Chip
          size="small"
          label="Not checked in"
          color="warning"
          sx={{ height: 22, fontSize: 10, fontWeight: 700, flexShrink: 0 }}
        />
      )}
      {showButton && <AttendanceAction job={job} onOpen={onOpen} />}
    </Stack>
  );
}

function CareDetailsAction({ job, onOpen, sx }) {
  return (
    <Button
      size="small"
      variant="outlined"
      color="inherit"
      startIcon={<Iconify icon="solar:eye-bold" width={13} />}
      onClick={() => onOpen?.(job)}
      sx={{
        ...bidButtonSx,
        minWidth: 'auto',
        whiteSpace: 'nowrap',
        ...sx,
      }}
    >
      View details
    </Button>
  );
}

function JobActionButtons({
  readOnly = false,
  job,
  variant,
  mode = 'agency',
  attendance = null,
  onBid,
  onEditBid,
  onDeleteBid,
  onAssignStaff,
  onViewStaff,
  onCheckIn,
  onCheckOut,
  onRespondOffer,
  onCancelBooking,
  onChat,
  shiftRow,
  existingBid = null,
  sx,
}) {
  if (readOnly) return null;

  const bookingStatus = attendance?.bookingStatus || job?.bookingStatus || '';
  const chatButton =
    onChat && typeof onChat === 'function' ? (
      <Tooltip title="Chat with job poster">
        <IconButton
          size="small"
          color="success"
          onClick={() => onChat(job)}
          aria-label="Chat with job poster"
          sx={{
            width: 28,
            height: 28,
            bgcolor: 'success.lighter',
            color: 'success.dark',
            '&:hover': { bgcolor: 'success.light', color: 'success.darker' },
          }}
        >
          <Iconify icon="solar:chat-round-dots-bold" width={16} />
        </IconButton>
      </Tooltip>
    ) : null;

  const statusChip = (label, color) => (
    <Stack direction="row" spacing={0.35} alignItems="center" sx={sx}>
      {chatButton}
      <Chip size="small" label={label} color={color} sx={{ height: 22, fontSize: 10, fontWeight: 700 }} />
    </Stack>
  );


  const isOwnStaffShift =
    job?.status === 'active' || Boolean(bookingStatus) || Boolean(attendance?.checkInAt);

  const activeActions = shouldUseActiveJobActions(variant, mode, job);

  if (activeActions && mode === 'staffMember' && isOwnStaffShift) {
    if (bookingStatus === 'pending') {
      return (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={sx}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => onRespondOffer?.(job, 'decline')}
            sx={{ ...actionButtonSx, minWidth: 70 }}
          >
            Decline
          </Button>
          <Button
            size="small"
            variant="contained"
            color="primary"
            onClick={() => onRespondOffer?.(job, 'accept')}
            sx={{ ...actionButtonSx, minWidth: 70 }}
          >
            Accept
          </Button>
        </Stack>
      );
    }

    if (CANCELLED_BOOKING_STATUSES.includes(bookingStatus)) return statusChip('Cancelled', 'default');

    const checkedOut = bookingStatus === 'completed' || Boolean(attendance?.checkOutAt);
    const checkedIn =
      !checkedOut && (bookingStatus === 'inProgress' || Boolean(attendance?.checkInAt));

    if (checkedOut) {
      const inTime = formatAttendanceTime(attendance?.checkInAt);
      const outTime = formatAttendanceTime(attendance?.checkOutAt);

      return (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={sx}>
          {chatButton}
          <Chip
            size="small"
            label="Completed"
            color="success"
            sx={{ height: 22, fontSize: 10, fontWeight: 700, flexShrink: 0 }}
          />
          {inTime || outTime ? (
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 600, lineHeight: 1 }}
            >
              In {inTime || '—'} · Out {outTime || '—'}
            </Typography>
          ) : null}
        </Stack>
      );
    }

    if (checkedIn) {
      const inTime = formatAttendanceTime(attendance?.checkInAt);

      return (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={sx}>
          {chatButton}
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={() => onCheckOut?.(job)}
            sx={{ ...actionButtonSx, ...sx, flexShrink: 0 }}
          >
            Check Out
          </Button>
          {inTime ? (
            <Typography
              variant="caption"
              noWrap
              sx={{ color: 'text.secondary', fontSize: 10, fontWeight: 600, lineHeight: 1 }}
            >
              In {inTime}
            </Typography>
          ) : null}
        </Stack>
      );
    }

    const staffRow = shiftRow || job?.shiftRows?.[0];
    const checkInClosed = hasShiftEnded(staffRow, job) || isShiftPast48Hours(staffRow, job);

    return (
      <Stack direction="row" spacing={0.35} alignItems="center" sx={sx}>
        {chatButton}
        <Tooltip title={checkInClosed ? 'Shift time is over' : ''}>
          <span>
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={checkInClosed}
              onClick={() => onCheckIn?.(job)}
              sx={{
                ...actionButtonSx,
                ...sx,
                ...(checkInClosed && {
                  bgcolor: 'grey.400',
                  color: 'common.white',
                  '&.Mui-disabled': {
                    bgcolor: 'grey.400',
                    color: 'grey.100',
                  },
                }),
              }}
            >
              Check In
            </Button>
          </span>
        </Tooltip>
      </Stack>
    );
  }

  if (isFindJobsBidVariant(variant, mode, job)) {
    const row = shiftRow || job?.shiftRows?.[0] || null;
    if (existingBid) {
      const bidStatus = normalizeAgencyBidStatus(existingBid.status);
      const bidAmount = Number(existingBid.bidAmount);
      const bidNote = String(existingBid.notes || existingBid.note || '').trim();
      const bidSummary = (
        <Box sx={{ minWidth: 0, mr: 0.5, textAlign: 'right' }}>
          {Number.isFinite(bidAmount) && bidAmount > 0 ? (
            <Typography variant="caption" fontWeight={700} color="primary.main" display="block" sx={{ fontSize: 10, lineHeight: 1.2 }}>
              {fCurrency(bidAmount)}
            </Typography>
          ) : null}
          {bidNote ? (
            <Tooltip title={bidNote} arrow>
              <Typography
                variant="caption"
                color="text.secondary"
                noWrap
                sx={{ fontSize: 9, maxWidth: 88, display: 'block' }}
              >
                {bidNote}
              </Typography>
            </Tooltip>
          ) : null}
        </Box>
      );
      if (['withdrawn', 'deleted', 'cancelled', 'canceled'].includes(bidStatus)) {
      } else if (!canEditAgencyBid(existingBid)) {
        const isDeclined = bidStatus === 'rejected' || bidStatus === 'declined';
        const closedLabel = isDeclined ? 'Declined' : bidStatus === 'accepted' ? 'Accepted' : 'Closed';
        return (
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0, ...sx }}>
            {bidSummary}
            <Chip
              size="small"
              color={bidStatus === 'accepted' ? 'success' : isDeclined ? 'error' : 'default'}
              label={closedLabel}
              sx={{ height: 22, fontSize: 10, fontWeight: 700 }}
            />
            {bidStatus === 'accepted' ? chatButton : null}
          </Stack>
        );
      } else {
        return (
          <Stack direction="row" spacing={0.25} alignItems="center" sx={{ flexShrink: 0, ...sx }}>
            {bidSummary}
            <Tooltip title="Edit bid">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEditBid?.(existingBid, job, row)}
                aria-label="Edit bid"
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                <Iconify icon="solar:pen-bold" width={14} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete bid">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDeleteBid?.(existingBid, job, row)}
                aria-label="Delete bid"
                sx={{
                  width: 28,
                  height: 28,
                  border: '1px solid',
                  borderColor: 'error.main',
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={14} />
              </IconButton>
            </Tooltip>
          </Stack>
        );
      }
    }

    if (row?.isBiddingAllowed === false) {
      return (
        <Chip
          size="small"
          label="Bidding closed"
          sx={{ height: 22, fontSize: 10, fontWeight: 700 }}
        />
      );
    }

    return (
      <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={() => onBid?.(job, row)}
        sx={{ ...bidButtonSx, ...sx }}
      >
        {job.requestFromCareHome ? 'Review' : 'Bid Now'}
      </Button>
    );
  }

  if (activeActions && job.actionType === 'reassign') {
    return (
      <Button
        size="small"
        variant="contained"
        color="warning"
        onClick={() => onAssignStaff?.(job)}
        sx={{ ...actionButtonSx, ...sx }}
      >
        Reassign
      </Button>
    );
  }

  if (activeActions && job.actionType === 'awaitingWorker') {
    return (
      <Stack direction="row" spacing={0.5} alignItems="center" sx={sx}>
        <Chip
          size="small"
          color="warning"
          variant="soft"
          label="Waiting for worker"
          sx={{ height: 28, fontWeight: 700, fontSize: 11, borderRadius: 1 }}
        />
        <Button
          size="small"
          variant="outlined"
          color="error"
          onClick={() => onCancelBooking?.(job)}
          sx={{ ...actionButtonSx, minWidth: 70 }}
        >
          Withdraw
        </Button>
      </Stack>
    );
  }

  if (activeActions && (job.actionType === 'assignStaff' || job.actionType === 'assigned')) {
    const alreadyAssigned = Boolean(
      job.actionType === 'assigned' ||
      String(job.bookingId || '').trim() ||
      String(job.shiftRows?.[0]?.bookingId || '').trim() ||
      String(existingBid?.bookingId || '').trim()
    );

    if (alreadyAssigned) {
      return (
        <Chip
          size="small"
          color="success"
          label="Assigned"
          sx={{
            ...sx,
            height: 28,
            fontWeight: 700,
            fontSize: 11,
            borderRadius: 1,
          }}
        />
      );
    }

    return (
      <Button
        size="small"
        variant="contained"
        color="primary"
        onClick={() => onAssignStaff?.(job)}
        sx={{ ...actionButtonSx, ...sx }}
      >
        Assign Staff
      </Button>
    );
  }

  if (activeActions && job.actionType === 'bidUnavailable') {
    return (
      <Chip
        size="small"
        variant="outlined"
        label="Bid unavailable"
        sx={{
          ...sx,
          height: 28,
          fontWeight: 600,
          fontSize: 11,
          borderRadius: 1,
          color: 'text.secondary',
        }}
      />
    );
  }

  if (activeActions && job.actionType === 'viewStaff') {
    return (
      <Stack direction="row" alignItems="center" spacing={0.75}>
        {job.assignedStaff?.length > 0 && (
          <AvatarGroup
            max={3}
            sx={{
              '& .MuiAvatar-root': {
                width: 22,
                height: 22,
                fontSize: 10,
                border: '2px solid',
                borderColor: 'background.paper',
              },
            }}
          >
            {job.assignedStaff.map((member) => (
              <Avatar key={member.id || member.name} src={member.avatarUrl} alt={member.name} />
            ))}
          </AvatarGroup>
        )}
        <Button
          size="small"
          variant="contained"
          color="primary"
          onClick={() => onViewStaff?.(job)}
          sx={{ ...actionButtonSx, ...sx }}
        >
          View Staff
        </Button>
      </Stack>
    );
  }

  return null;
}

export function AgencyFindJobCard({
  readOnly = false,
  job,
  variant = 'new',
  viewMode = 'grid',
  mode = 'agency',
  attendance: liveAttendance = null,
  existingBid = null,
  onBid,
  onEditBid,
  onDeleteBid,
  onAssignStaff,
  onViewStaff,
  onCheckIn,
  onCheckOut,
  onRespondOffer,
  onCancelBooking,
  onChat,
  onViewAllSchedules,
  onOpenCareDetails,
  onOpenAttendance,
  onOpenJob,
}) {

  const attendance = resolveJobAttendance(job, liveAttendance);
  const shiftRows = getShiftRows(job);
  const allShiftRows = getAllShiftRows(job);
  const hasMultipleSchedules = allShiftRows.length > 1;
  const primaryShift = shiftRows[0];
  const allowedPersons = getAllowedPersons(job);
  const bidsCount = Number(job?.bidsCount) || 0;

  const shiftCompleted = primaryShift?.status === 'completed' || variant === 'completed';
  const bookingStatus = attendance?.bookingStatus || job?.bookingStatus || '';
  const hasBooking = Boolean(String(job?.bookingId || '').trim());
  const assignedWork =
    hasBooking ||
    shiftCompleted ||
    job?.actionType === 'assigned' ||
    ['active', 'inProgress', 'completed', 'assigned'].includes(bookingStatus);
  const checkedIn = Boolean(
    attendance?.checkInAt ||
    attendance?.checkOutAt ||
    attendance?.autoCheckedOut ||
    ['inProgress', 'completed'].includes(String(bookingStatus || '').toLowerCase())
  );
  const showNotCheckedIn =
    assignedWork &&
    !checkedIn &&
    bookingStatus !== 'pending' &&
    !CANCELLED_BOOKING_STATUSES.includes(bookingStatus) &&
    (mode === 'agency' ||
      mode === 'homeCareCompany' ||
      typeof onOpenAttendance === 'function');
  const showAttendance =
    (mode === 'staffMember' || hasBooking || shiftCompleted) &&
    typeof onOpenAttendance === 'function' &&
    (hasAttendanceRecord(attendance) ||
      ['inProgress', 'completed'].includes(bookingStatus) ||
      shiftCompleted);
  const dateParts = getJobDateParts(job);
  const postedBy = job.postedBy || {};
  const isCareHome = postedBy.type === 'care_home';
  const showCareDetails = typeof onOpenCareDetails === 'function';
  const bookingActionsInShiftRow = !isFindJobsBidVariant(variant, mode, job) && shiftRows.length > 0;

  const handleCardClick = (event) => {
    if (!onOpenJob) return;
    if (event.target.closest('button, a, [role="button"]')) return;
    onOpenJob(job);
  };

  const listDescriptionSx = {
    ...descriptionSx,
    WebkitLineClamp: 1,
    mb: 0,
  };

  if (viewMode === 'list') {
    return (
      <Card
        onClick={handleCardClick}
        sx={{
          p: 1.25,
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(99, 115, 129, 0.1)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          gap: 1.25,
          ...(onOpenJob
            ? {
              cursor: 'pointer',
              '&:hover': { boxShadow: '0 4px 16px rgba(99, 115, 129, 0.16)' },
            }
            : null),
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
          <JobMediaThumb image={job.image} alt={job.title} width={44} height={44} />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack spacing={0.15} sx={{ minWidth: 0, flex: 1 }}>
              <Tooltip title={job.title} arrow>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {job.title}
                </Typography>
              </Tooltip>
              {(job.jobTypeTitle || job.role) && (
                <Tooltip title={job.jobTypeTitle || job.role} arrow>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {job.jobTypeTitle || job.role}
                  </Typography>
                </Tooltip>
              )}
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.25 }} flexWrap="wrap" useFlexGap>
              <JobStatusChip job={job} variant={variant} />
              {hasJobDistance(job) ? (
                <Chip
                  label={job.distance}
                  size="small"
                  variant="outlined"
                  sx={{
                    ...metaChipSx,
                    flexShrink: 0,
                  }}
                />
              ) : null}
            </Stack>

            <Tooltip title={job.description || ''} arrow placement="top" disableHoverListener={!job.description}>
              <Typography sx={{ ...listDescriptionSx, minHeight: '1.1rem' }}>
                {job.description || '—'}
              </Typography>
            </Tooltip>

            {primaryShift && (
              <Tooltip title={dateParts.label} arrow>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.35, minWidth: 0 }} flexWrap="wrap" useFlexGap>
                  <Stack direction="row" alignItems="center" spacing={0.5} sx={shiftDateRowSx}>
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={<Iconify icon="solar:calendar-bold" width={12} />}
                      label={dateParts.hasDate ? `${dateParts.weekday} ${dateParts.day} ${dateParts.month}` : 'Date TBC'}
                      sx={{ ...shiftDateChipSx, height: 22, '& .MuiChip-icon': { color: 'inherit', ml: 0.5 } }}
                    />
                    {dateParts.time ? (
                      <Typography variant="caption" noWrap sx={{ color: 'inherit', fontWeight: 700 }}>
                        {dateParts.time}
                      </Typography>
                    ) : null}
                  </Stack>
                  {hasMultipleSchedules && (
                    <Button
                      size="small"
                      onClick={() => onViewAllSchedules?.(job)}
                      sx={{ minWidth: 'auto', px: 0.5, py: 0, fontSize: 9, fontWeight: 700 }}
                    >
                      +{allShiftRows.length - 1} more
                    </Button>
                  )}
                </Stack>
              </Tooltip>
            )}

            <JobLocationBlock job={job} sx={{ mt: 0.35 }} />
          </Box>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent={{ xs: 'space-between', md: 'flex-end' }}
          spacing={1.25}
          flexWrap="wrap"
          useFlexGap
          sx={{ flexShrink: 0, width: { xs: 1, md: 'auto' }, pl: { xs: 0, md: 0 } }}
        >
          <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.25} sx={{ minWidth: 0 }}>
            {job.postedAt && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>
                {job.postedAt}
              </Typography>
            )}
            {job.hourlyRate != null ? (
              <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ color: 'primary.main', lineHeight: 1.2 }}>
                {fCurrency(job.hourlyRate)}/hr
              </Typography>
            ) : job.totalPay != null ? (
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'primary.main', lineHeight: 1.2 }}>
                {fCurrency(job.totalPay)}
              </Typography>
            ) : null}
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10 }}>
              Break: {formatBreakLabel(job)}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10 }}>
              {[
                job.gender ? `Gender: ${job.gender}` : null,
                bidsCount > 0 ? `${bidsCount} bid${bidsCount === 1 ? '' : 's'}` : null,
                allowedPersons ? `${allowedPersons} staff` : null,
              ]
                .filter(Boolean)
                .join(' · ') || null}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <JobActionButtons readOnly={readOnly}
              job={job}
              variant={variant}
              mode={mode}
              attendance={attendance}
              shiftRow={primaryShift}
              existingBid={existingBid}
              onBid={onBid}
              onEditBid={onEditBid}
              onDeleteBid={onDeleteBid}
              onAssignStaff={onAssignStaff}
              onViewStaff={onViewStaff}
              onCheckIn={onCheckIn}
              onCheckOut={onCheckOut}
              onRespondOffer={onRespondOffer}
              onCancelBooking={onCancelBooking}
              onChat={onChat}
              sx={{ minWidth: { xs: 0, md: 88 }, py: 0.5, fontSize: 11 }}
            />

            {(showAttendance || showNotCheckedIn) && (
              <AttendanceSpot
                job={job}
                showButton={showAttendance}
                notCheckedIn={showNotCheckedIn}
                onOpen={onOpenAttendance}
              />
            )}

            {showCareDetails && (
              <CareDetailsAction job={job} onOpen={onOpenCareDetails} />
            )}

            <Box sx={{ minWidth: 0, maxWidth: { xs: 1, md: 140 } }}>
              <PostedByFooter job={job} postedBy={postedBy} isCareHome={isCareHome} />
            </Box>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        p: 1.25,
        height: 1,
        minHeight: 292,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: '0 2px 12px rgba(99, 115, 129, 0.1)',
        ...(onOpenJob
          ? {
            cursor: 'pointer',
            '&:hover': { boxShadow: '0 4px 16px rgba(99, 115, 129, 0.16)' },
          }
          : null),
        ...(job.requestFromCareHome && {
          border: '1px solid',
          borderColor: 'warning.main',
          bgcolor: 'background.paper',
          boxShadow: '0 4px 16px rgba(255, 171, 0, 0.14)',
        }),
      }}
    >
      <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 0.5 }}>
        <JobMediaThumb image={job.image} alt={job.title} width={36} height={36} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={0.5}>
            <Box sx={{ minWidth: 0, flex: 1, pr: 0.5 }}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0 }}>
                <Tooltip title={job.title} arrow>
                  <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ minWidth: 0 }}>
                    {job.title}
                  </Typography>
                </Tooltip>
                {job.requestFromCareHome && (
                  <Chip
                    label="Direct Request"
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 8,
                      fontWeight: 700,
                      flexShrink: 0,
                      bgcolor: 'warning.main',
                      color: 'common.white',
                    }}
                  />
                )}
              </Stack>
              <Tooltip title={job.jobTypeTitle || job.role || ''} arrow disableHoverListener={!job.jobTypeTitle && !job.role}>
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary', minHeight: 18, display: 'block' }}
                  noWrap
                >
                  {job.jobTypeTitle || job.role || ' '}
                </Typography>
              </Tooltip>
            </Box>
            {!job.requestFromCareHome && <JobStatusChip job={job} variant={variant} />}
            {job.requestFromCareHome && (
              <Chip
                label={job.shiftType || 'Single Shift'}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 9,
                  fontWeight: 700,
                  bgcolor: 'primary.lighter',
                  color: 'primary.dark',
                  flexShrink: 0,
                }}
              />
            )}
          </Stack>
        </Box>
      </Stack>

      <JobMetaChips job={job} postedAt={job.postedAt} />

      <Tooltip
        title={job.description || ''}
        arrow
        placement="top"
        disableHoverListener={!job.description}
      >
        <Typography
          sx={{
            ...descriptionSx,
            mb: 0.5,
            minHeight: '2.175rem',
          }}
        >
          {job.description || '—'}
        </Typography>
      </Tooltip>

      <Box sx={{ mb: 0.5 }}>
        {shiftRows.length > 0 &&
          shiftRows.slice(0, 1).map((row) => (
            <Stack key={row.id} spacing={0.35}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.5}>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={shiftDateRowSx}>
                  <Chip
                    size="small"
                    variant="outlined"
                    icon={<Iconify icon="solar:calendar-bold" width={14} />}
                    label={
                      dateParts.hasDate
                        ? `${dateParts.weekday} ${dateParts.day} ${dateParts.month}`
                        : 'Date TBC'
                    }
                    sx={{
                      ...shiftDateChipSx,
                      height: 24,
                      '& .MuiChip-icon': { color: 'inherit', ml: 0.75 },
                      '& .MuiChip-label': { color: 'inherit', px: 0.75 },
                    }}
                  />
                  {dateParts.time ? (
                    <Typography variant="caption" noWrap sx={{ color: 'inherit', fontWeight: 700, fontSize: 12 }}>
                      {dateParts.time}
                    </Typography>
                  ) : !dateParts.hasDate && row.label ? (
                    <Typography variant="caption" noWrap sx={{ color: 'inherit', fontWeight: 700, fontSize: 12 }}>
                      {row.label}
                    </Typography>
                  ) : null}
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0, ml: 'auto' }}>
                  {hasMultipleSchedules && (
                    <Button
                      size="small"
                      onClick={() => onViewAllSchedules?.(job)}
                      sx={{ minWidth: 'auto', px: 0.5, py: 0, fontSize: 9, fontWeight: 700 }}
                    >
                      View All
                    </Button>
                  )}
                  {job.hourlyRate != null && (
                    <Typography variant="subtitle2" noWrap sx={{ color: 'primary.main', fontWeight: 800, fontSize: 13 }}>
                      {fCurrency(job.hourlyRate)}/hr
                    </Typography>
                  )}
                </Stack>
              </Stack>

              {(showCareDetails || isFindJobsBidVariant(variant, mode, job) || bookingActionsInShiftRow) && (
                <Stack
                  direction="row"
                  alignItems="center"
                  sx={{ py: 0.75, width: 1 }}
                >
                  {showCareDetails ? (
                    <CareDetailsAction job={job} onOpen={onOpenCareDetails} />
                  ) : (
                    <Box />
                  )}
                  <Box sx={{ flexGrow: 1, minWidth: 8 }} />
                  {isFindJobsBidVariant(variant, mode, job) && (
                    <JobActionButtons readOnly={readOnly}
                      job={job}
                      variant={variant}
                      mode={mode}
                      attendance={attendance}
                      shiftRow={row}
                      existingBid={existingBid}
                      onBid={onBid}
                      onEditBid={onEditBid}
                      onDeleteBid={onDeleteBid}
                      onCheckIn={onCheckIn}
                      onCheckOut={onCheckOut}
                      onChat={onChat}
                    />
                  )}
                  {bookingActionsInShiftRow && (
                    <JobActionButtons readOnly={readOnly}
                      job={job}
                      variant={variant}
                      mode={mode}
                      attendance={attendance}
                      shiftRow={row}
                      existingBid={existingBid}
                      onAssignStaff={onAssignStaff}
                      onViewStaff={onViewStaff}
                      onCancelBooking={onCancelBooking}
                      onCheckIn={onCheckIn}
                      onCheckOut={onCheckOut}
                      onRespondOffer={onRespondOffer}
                      onChat={onChat}
                    />
                  )}
                </Stack>
              )}
            </Stack>
          ))}
      </Box>

      <JobLocationBlock job={job} sx={{ mb: 0.5 }} />

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, minHeight: 16 }}>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10 }}>
          Break:{' '}
          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {formatBreakLabel(job)}
          </Box>
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10 }}>
          Gender:{' '}
          <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {job.gender || '—'}
          </Box>
        </Typography>
        {allowedPersons ? (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 10 }}>
            Staff needed:{' '}
            <Box component="span" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {allowedPersons}
            </Box>
          </Typography>
        ) : null}
        {(showAttendance || showNotCheckedIn) && (
          <Box sx={{ ml: 'auto' }}>
            <AttendanceSpot
              job={job}
              showButton={showAttendance}
              notCheckedIn={showNotCheckedIn}
              onOpen={onOpenAttendance}
            />
          </Box>
        )}
      </Stack>

      {showCareDetails && shiftRows.length === 0 && (
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
          <CareDetailsAction job={job} onOpen={onOpenCareDetails} />
          {isFindJobsBidVariant(variant, mode, job) ? (
            <JobActionButtons readOnly={readOnly}
              job={job}
              variant={variant}
              mode={mode}
              attendance={attendance}
              shiftRow={null}
              existingBid={existingBid}
              onBid={onBid}
              onEditBid={onEditBid}
              onDeleteBid={onDeleteBid}
              onCheckIn={onCheckIn}
              onCheckOut={onCheckOut}
              onChat={onChat}
            />
          ) : null}
        </Stack>
      )}

      {!showCareDetails && shiftRows.length === 0 && isFindJobsBidVariant(variant, mode, job) && (
        <Stack direction="row" justifyContent="flex-end" alignItems="center" sx={{ mb: 0.5 }}>
          <JobActionButtons readOnly={readOnly}
            job={job}
            variant={variant}
            mode={mode}
            attendance={attendance}
            shiftRow={null}
            existingBid={existingBid}
            onBid={onBid}
            onEditBid={onEditBid}
            onDeleteBid={onDeleteBid}
            onCheckIn={onCheckIn}
            onCheckOut={onCheckOut}
          />
        </Stack>
      )}

      {variant === 'active' && (
        <Stack spacing={0.5} sx={{ mb: 0.5 }}>
          {job.totalPay != null && (
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                Total Pay
              </Typography>
              <Typography variant="caption" fontWeight={700} sx={{ color: 'primary.main', fontSize: 11 }}>
                {fCurrency(job.totalPay)}
              </Typography>
            </Stack>
          )}

          <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={0.35}>
            {showCareDetails && shiftRows.length === 0 && (
              <CareDetailsAction job={job} onOpen={onOpenCareDetails} />
            )}
            {!isFindJobsBidVariant(variant, mode, job) && !bookingActionsInShiftRow && (
              <JobActionButtons readOnly={readOnly}
                job={job}
                variant={variant}
                mode={mode}
                attendance={attendance}
                onAssignStaff={onAssignStaff}
                onViewStaff={onViewStaff}
                onCheckIn={onCheckIn}
                onCheckOut={onCheckOut}
                onRespondOffer={onRespondOffer}
                onCancelBooking={onCancelBooking}
              />
            )}
          </Stack>
        </Stack>
      )}

      <PostedByFooter job={job} postedBy={postedBy} isCareHome={isCareHome || job.requestFromCareHome} />
    </Card>
  );
}
