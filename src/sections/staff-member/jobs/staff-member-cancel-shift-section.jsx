import { useCallback, useMemo } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { toast } from 'src/components/snackbar';

import {
  useCancelNurseBookingMutation,
  useLazyGetNurseBookingsQuery,
} from 'src/store/Reducer/nurse-bookings-api';

import {
  matchNurseBookingId,
  pickBookingIdOnly,
} from 'src/sections/staff-member/jobs/nurse-checkin-api-utils';
import {
  canCancelStaffShift,
  isShiftWithin24Hours,
} from 'src/sections/staff-member/jobs/staff-member-job-utils';
import { recordLocalCancellation } from 'src/sections/staff-member/jobs/staff-member-cancellation-store';
import { useStaffCancellationStats } from 'src/sections/staff-member/jobs/use-staff-cancellation-stats';
import { StaffMemberCancelShiftConfirmContent } from 'src/sections/staff-member/jobs/staff-member-cancel-shift-confirm-content';
import { getStrikeRuleStatus } from 'src/sections/staff-member/jobs/staff-member-strike-rule-utils';
import { StaffMemberStrikeRuleAlert } from 'src/sections/staff-member/jobs/staff-member-strike-rule-alert';

// ----------------------------------------------------------------------

async function resolveBookingId(job, fetchBookings) {
  const fromJob = pickBookingIdOnly(job);
  if (fromJob) return fromJob;

  try {
    const listed = await fetchBookings({
      page: 0,
      limit: 200,
      job: job?.id || job?._id || '',
      shift: job?.shiftRows?.[0]?.id || job?.shiftRows?.[0]?._id || '',
    }).unwrap();

    return matchNurseBookingId(listed?.data || [], job) || '';
  } catch {
    return '';
  }
}

function CancelShiftConfirmDialog({
  open,
  onClose,
  job,
  within24Hours,
  cancellationStats,
  loading,
  onConfirm,
  confirmDisabled = false,
}) {
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Cancel shift?"
      content={
        <StaffMemberCancelShiftConfirmContent
          job={job}
          within24Hours={within24Hours}
          cancellationStats={cancellationStats}
        />
      }
      action={
        <LoadingButton
          variant="contained"
          color="error"
          loading={loading}
          disabled={confirmDisabled}
          onClick={onConfirm}
        >
          Cancel shift
        </LoadingButton>
      }
    />
  );
}

export function StaffMemberCancelShiftSection({ job, onCancelled, variant = 'content' }) {
  // Admin viewing the account cannot cancel the worker's shifts.
  const viewOnly = useViewOnly();
  const confirmDialog = useBoolean();
  const [fetchBookings] = useLazyGetNurseBookingsQuery();
  const [cancelBooking, cancelState] = useCancelNurseBookingMutation();
  const cancellationStats = useStaffCancellationStats();
  const strikeStatus = useMemo(() => getStrikeRuleStatus(cancellationStats), [cancellationStats]);

  const canCancel = useMemo(() => canCancelStaffShift(job), [job]);
  const within24Hours = useMemo(() => isShiftWithin24Hours(job), [job]);
  const lateCancelBlocked = within24Hours && strikeStatus.isAccessBlocked;

  const closeConfirm = useCallback(() => {
    if (cancelState.isLoading) return;
    confirmDialog.onFalse();
  }, [cancelState.isLoading, confirmDialog]);

  const handleConfirmCancel = useCallback(async () => {
    if (!job || lateCancelBlocked) return;

    const bookingId = await resolveBookingId(job, fetchBookings);
    if (!bookingId) {
      toast.error('Could not find this shift booking. Please refresh and try again.');
      return;
    }

    try {
      await cancelBooking({ id: bookingId, within24Hours }).unwrap();
      recordLocalCancellation({
        within24Hours,
        jobId: job?.id || job?._id || '',
        bookingId,
      });
      toast.success(
        within24Hours
          ? strikeStatus.isFinalStrikeRisk
            ? 'Shift cancelled. This was your final late cancellation strike — Tempy access may be suspended.'
            : 'Shift cancelled. A low star rating has been applied to your profile.'
          : 'Shift cancelled.'
      );
      confirmDialog.onFalse();
      onCancelled?.();
    } catch (error) {
      toast.error(
        error?.data?.message || error?.error || 'Could not cancel this shift. Please try again.'
      );
    }
  }, [cancelBooking, confirmDialog, fetchBookings, job, lateCancelBlocked, onCancelled, strikeStatus.isFinalStrikeRisk, within24Hours]);

  if (!canCancel || viewOnly) return null;

  if (variant === 'footer') {
    return (
      <>
        <Button
          color="error"
          variant="outlined"
          onClick={confirmDialog.onTrue}
          disabled={lateCancelBlocked}
        >
          Cancel shift
        </Button>

        <CancelShiftConfirmDialog
          open={confirmDialog.value}
          onClose={closeConfirm}
          job={job}
          within24Hours={within24Hours}
          cancellationStats={cancellationStats}
          loading={cancelState.isLoading}
          confirmDisabled={lateCancelBlocked}
          onConfirm={handleConfirmCancel}
        />
      </>
    );
  }

  return (
    <>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Cancel shift</Typography>
        <Typography variant="body2" color="text.secondary">
          You can cancel this accepted shift if you are no longer available.
        </Typography>
        {lateCancelBlocked ? (
          <StaffMemberStrikeRuleAlert cancellationStats={cancellationStats} within24Hours />
        ) : (
          <Button color="error" variant="outlined" onClick={confirmDialog.onTrue}>
            Cancel shift
          </Button>
        )}
      </Stack>

      <CancelShiftConfirmDialog
        open={confirmDialog.value}
        onClose={closeConfirm}
        job={job}
        within24Hours={within24Hours}
        cancellationStats={cancellationStats}
        loading={cancelState.isLoading}
        confirmDisabled={lateCancelBlocked}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
