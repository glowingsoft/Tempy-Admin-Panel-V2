import { useCallback, useEffect, useRef, useState } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { alpha } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';

import { resolveCurrentLocation } from './staff-member-location';

// ----------------------------------------------------------------------

const PHOTO_PREVIEW_H = 160;

/** Paint the canvas white, so the saved PNG is black ink on white rather than transparent. */
function fillWhite(canvas) {
  const ctx = canvas?.getContext('2d');
  if (!ctx) return;
  ctx.save();
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

export function SignaturePad({ onChange, height = 240 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    fillWhite(canvasRef.current);
  }, []);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: ((source.clientX - rect.left) / rect.width) * canvas.width,
      y: ((source.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDraw = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const point = getPoint(event);
    if (!ctx || !point) return;
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const moveDraw = (event) => {
    if (!drawing.current) return;
    event.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const point = getPoint(event);
    if (!ctx || !point) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    if (!hasInk) setHasInk(true);
  };

  const endDraw = () => {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setHasInk(true);
    onChange?.(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fillWhite(canvas);
    setHasInk(false);
    onChange?.(null);
  };

  return (
    <Box>
      <Box
        sx={{
          borderRadius: 2,
          bgcolor: '#fff',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={320}
          onMouseDown={startDraw}
          onMouseMove={moveDraw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={moveDraw}
          onTouchEnd={endDraw}
          style={{ display: 'block', width: '100%', height, cursor: 'crosshair' }}
        />
      </Box>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.75 }}>
        <Button size="small" color="inherit" onClick={clear} disabled={!hasInk}>
          Clear
        </Button>
      </Stack>
    </Box>
  );
}

function LocationField({ value, onChange, loading, onDetect }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
        Current Location
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Enter your location, or detect via GPS.
      </Typography>
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={4}
        size="small"
        placeholder="Enter current location address…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  color: 'primary.main',
                }}
              >
                {loading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Iconify icon="solar:map-point-bold" width={18} />
                )}
              </Box>
            </InputAdornment>
          ),
        }}
      />
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.75 }}>
        <LoadingButton
          size="small"
          color="inherit"
          loading={loading}
          startIcon={<Iconify icon="solar:routing-2-bold" width={16} />}
          onClick={onDetect}
        >
          Detect GPS
        </LoadingButton>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function StaffMemberCheckInDialog({ open, job, onClose, onConfirm, mode = 'checkin' }) {
  const isCheckout = mode === 'checkout';
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFileName, setPhotoFileName] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [locationMeta, setLocationMeta] = useState(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef(null);

  const detectLocation = useCallback(async () => {
    setLocating(true);
    const next = await resolveCurrentLocation(job?.address || '');
    if (next?.label) {
      setLocationLabel(next.label);
      setLocationMeta(next);
    }
    setLocating(false);
  }, [job?.address]);

  useEffect(() => {
    if (!open) return undefined;
    setPhotoPreview(null);
    setPhotoFileName('');
    setSignatureDataUrl(null);
    setLocationLabel(job?.address || '');
    setLocationMeta(null);
    setSubmitError('');
    detectLocation();
    return undefined;
  }, [open, job?.address, detectLocation, mode]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(typeof reader.result === 'string' ? reader.result : null);
      setPhotoFileName(file.name);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const trimmedLocation = locationLabel.trim();
  // Check-in needs photo + signature + location; check-out only needs the location.
  const hasProof = Boolean(photoPreview) && Boolean(signatureDataUrl);
  const canSubmit = (isCheckout || hasProof) && Boolean(trimmedLocation) && !locating;

  const handleConfirm = async () => {
    if (!canSubmit || !job) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await onConfirm?.({
        job,
        photoDataUrl: photoPreview,
        photoFileName,
        signatureDataUrl,
        location: {
          label: trimmedLocation,
          lat: locationMeta?.lat ?? job?.latitude ?? null,
          lng: locationMeta?.lng ?? job?.longitude ?? null,
          capturedAt: new Date().toISOString(),
          source: locationMeta?.source || 'manual',
        },
      });
    } catch (error) {
      setSubmitError(
        error?.message || (isCheckout ? 'Check-out failed. Please try again.' : 'Check-in failed. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6, position: 'relative' }}>
        {isCheckout ? 'Check Out' : 'Check In'}
        {job?.title ? `${isCheckout ? ' — ' : ', '}${job.title}` : ''}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              Picture (Proof){isCheckout ? ' — optional' : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Please upload your picture here…
            </Typography>
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                cursor: 'pointer',
              }}
            >
              <Box
                sx={{
                  height: PHOTO_PREVIEW_H,
                  minHeight: PHOTO_PREVIEW_H,
                  borderRadius: 1.5,
                  border: (theme) => `1.5px dashed ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
                }}
              >
                {photoPreview ? (
                  <Box
                    component="img"
                    src={photoPreview}
                    alt={isCheckout ? 'Check-out proof' : 'Check-in proof'}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                    }}
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
            </Box>
            {photoPreview && (
              <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.75 }}>
                <Button size="small" color="inherit" onClick={() => fileInputRef.current?.click()}>
                  Change photo
                </Button>
              </Stack>
            )}
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
            <Typography variant="subtitle2" fontWeight={700}>
              Signature (Digital){isCheckout ? ' — optional' : ''}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Add your signature here…
            </Typography>
            <SignaturePad onChange={setSignatureDataUrl} height={PHOTO_PREVIEW_H} />
          </Box>

          <LocationField
            value={locationLabel}
            onChange={(next) => {
              setLocationLabel(next);
            }}
            loading={locating}
            onDetect={detectLocation}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={submitting}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          color={isCheckout ? 'error' : 'primary'}
          onClick={handleConfirm}
          loading={submitting}
          disabled={!canSubmit || submitting}
        >
          {isCheckout ? 'Check Out' : 'Check In'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

/** @deprecated Use StaffMemberCheckInDialog with mode="checkout" */
export function StaffMemberCheckOutDialog({ open, job, onClose, onConfirm }) {
  return (
    <StaffMemberCheckInDialog
      open={open}
      job={job}
      onClose={onClose}
      onConfirm={onConfirm}
      mode="checkout"
    />
  );
}
