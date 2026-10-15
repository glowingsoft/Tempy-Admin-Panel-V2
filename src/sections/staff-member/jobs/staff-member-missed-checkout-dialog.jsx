import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fDate, fDateTime } from 'src/utils/format-time';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';

import { useGetNurseJobByIdQuery } from 'src/store/Reducer/nurse-jobs-api';
import {
  useGetNurseBookingByIdQuery,
  useSubmitNurseCheckOutProofMutation,
} from 'src/store/Reducer/nurse-bookings-api';

import { PHOTO_PREVIEW_H, SIGNATURE_H, SignaturePad } from './staff-member-check-dialogs';
import { mapAttendanceBlock } from './nurse-checkin-api-utils';


function DetailRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <Iconify icon={icon} width={18} sx={{ mt: '2px', color: 'text.disabled', flexShrink: 0 }} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2">{value}</Typography>
      </Box>
    </Stack>
  );
}


export function StaffMemberMissedCheckoutDialog({ bookingId, onClose, onResolved, uploadAsset }) {
  const open = Boolean(bookingId);

  const bookingQuery = useGetNurseBookingByIdQuery(bookingId, {
    skip: !open,
    refetchOnMountOrArgChange: 60, refetchOnFocus: false,
  });
  const booking = bookingQuery.data;
  const jobQuery = useGetNurseJobByIdQuery(booking?.jobId, { skip: !open || !booking?.jobId });
  const job = jobQuery.data;

  const [submitProof, { isLoading: submitting }] = useSubmitNurseCheckOutProofMutation();

  const [photo, setPhoto] = useState(null);
  const [signature, setSignature] = useState(null);
  const [reason, setReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setPhoto(null);
    setSignature(null);
    setReason('');
    setSubmitError('');
  }, [open, bookingId]);

  const attendance = mapAttendanceBlock(booking?.attendance);

  const rawAttendance = booking?.attendance || {};
  const needsProof = Boolean(
    rawAttendance.autoCheckedOut &&
    (!rawAttendance.checkOutProofPicture || !rawAttendance.checkOutSignature)
  );

  const busy = submitting || uploading;
  const canSubmit = needsProof && Boolean(photo) && Boolean(signature) && Boolean(reason.trim());

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError('');
    setUploading(true);
    try {
      const [proofPicture, signatureUrl] = await Promise.all([
        uploadAsset(photo, 'checkout-proof.jpg'),
        uploadAsset(signature, 'checkout-signature.png'),
      ]);
      setUploading(false);
      await submitProof({ id: bookingId, proofPicture, signature: signatureUrl, reason }).unwrap();
      toast.success('Check-out details submitted. You can check in now.');
      onResolved?.();
    } catch (error) {
      setSubmitError(
        error?.data?.message || error?.message || 'Could not submit the check-out details.'
      );
    } finally {
      setUploading(false);
    }
  };

  const shiftTime =
    booking?.shiftStartTime && booking?.shiftEndTime
      ? `${booking.shiftStartTime} – ${booking.shiftEndTime}`
      : booking?.shiftStartTime || '';
  const shiftLabel = [booking?.shiftDate ? fDate(booking.shiftDate) : '', shiftTime]
    .filter(Boolean)
    .join(', ');

  const renderDetails = (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" fontWeight={700}>
        {job?.title || booking?.title || 'Shift'}
      </Typography>
      <DetailRow icon="solar:buildings-2-bold" label="Customer" value={job?.postedBy?.name} />
      <DetailRow icon="solar:map-point-bold" label="Location" value={job?.address || booking?.address} />
      <DetailRow icon="solar:calendar-bold" label="Shift" value={shiftLabel} />
      <DetailRow
        icon="solar:login-3-bold"
        label="Checked in"
        value={attendance?.checkInAt ? fDateTime(attendance.checkInAt) : ''}
      />
      <DetailRow
        icon="solar:logout-3-bold"
        label={attendance?.autoCheckedOut ? 'Checked out automatically' : 'Checked out'}
        value={attendance?.checkOutAt ? fDateTime(attendance.checkOutAt) : ''}
      />
    </Stack>
  );

  const renderProofForm = (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Picture (Proof)
        </Typography>
        <Box
          onClick={() => fileInputRef.current?.click()}
          sx={{
            height: PHOTO_PREVIEW_H,
            borderRadius: 1.5,
            cursor: 'pointer',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: (theme) => `1.5px dashed ${theme.palette.divider}`,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
          }}
        >
          {photo ? (
            <Box
              component="img"
              src={photo}
              alt="Check-out proof"
              sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <Stack alignItems="center" spacing={0.75}>
              <Iconify icon="solar:camera-bold" width={36} sx={{ color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                Tap to upload photo
              </Typography>
            </Stack>
          )}
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={handlePhotoChange}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Signature (Digital)
        </Typography>
        <SignaturePad onChange={setSignature} height={SIGNATURE_H} />
      </Box>

      <TextField
        fullWidth
        multiline
        minRows={3}
        label="What happened?"
        placeholder="Tell us why you did not check out of this shift…"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
    </Stack>
  );

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {needsProof ? 'Finish your last shift' : 'You are still checked in to another shift'}
      </DialogTitle>

      <DialogContent dividers>
        {bookingQuery.isLoading ? (
          <ModuleLoading sx={{ py: 4 }} />
        ) : bookingQuery.isError ? (
          <Alert severity="error">Could not load that shift. Please try again.</Alert>
        ) : (
          <Stack spacing={2.5}>
            {submitError ? <Alert severity="error">{submitError}</Alert> : null}

            <Alert severity="warning">
              {needsProof
                ? 'You did not check out of this shift, so it was closed automatically. Upload a picture and signature and tell us what happened, then check in again.'
                : 'Check out of this shift from its job card before checking in to a new one.'}
            </Alert>

            {renderDetails}

            {needsProof ? (
              <>
                <Divider />
                {renderProofForm}
              </>
            ) : null}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={busy}>
          {needsProof ? 'Cancel' : 'Close'}
        </Button>
        {needsProof ? (
          <LoadingButton
            variant="contained"
            loading={busy}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Submit
          </LoadingButton>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}
