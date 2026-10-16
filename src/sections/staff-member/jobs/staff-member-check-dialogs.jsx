import { useCallback, useEffect, useRef, useState } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { alpha } from '@mui/material/styles';

import { StandaloneAddressInput } from 'src/sections/tempy-home/standalone-address-input';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { resolveCurrentLocation } from './staff-member-location';


export const PHOTO_PREVIEW_H = 110;
export const SIGNATURE_H = 80;

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

function LocationField({
  value,
  onChange,
  onPlaceSelect,
  loading,
  onDetect,
  gpsOnly = false,
  error = '',
}) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
        Current Location
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {gpsOnly
          ? 'Check-in uses your live GPS location (not a selected job or map place).'
          : 'Enter your location, or detect via GPS.'}
      </Typography>
      {gpsOnly ? (
        <Box
          sx={{
            px: 1.5,
            py: 1.25,
            borderRadius: 1.5,
            border: (theme) =>
              `1px solid ${error ? theme.palette.error.main : theme.palette.divider}`,
            bgcolor: 'background.neutral',
            minHeight: 48,
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {loading
              ? 'Detecting GPS…'
              : value?.trim() || 'GPS location not available yet'}
          </Typography>
        </Box>
      ) : (
        <StandaloneAddressInput
          value={value}
          onChange={onChange}
          onPlaceSelect={onPlaceSelect}
          label=""
          size="small"
          showDetectGps={false}
          placeholder="Enter current location address…"
          sx={{
            '& .MuiInputAdornment-root': { alignSelf: 'center', mt: 0 },
          }}
        />
      )}
      {error ? (
        <Alert severity="warning" sx={{ mt: 1 }}>
          {error}
        </Alert>
      ) : null}
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
  const [locationError, setLocationError] = useState('');
  const fileInputRef = useRef(null);

  const detectLocation = useCallback(
    async ({ notify = false } = {}) => {
      setLocating(true);
      setLocationError('');
      const next = await resolveCurrentLocation(isCheckout ? job?.address || '' : '');
      setLocationLabel(next?.label || 'Location unavailable');
      setLocationMeta(next || null);

      const failed =
        !Number.isFinite(Number(next?.lat)) || !Number.isFinite(Number(next?.lng));
      if (failed) {
        const message =
          next?.error ||
          'Unable to read GPS. Allow location for this site, then tap Detect GPS again.';
        setLocationError(message);
        if (notify) toast.error(message);
      }

      setLocating(false);
      return next;
    },
    [isCheckout, job?.address]
  );

  useEffect(() => {
    if (!open) return undefined;
    setPhotoPreview(null);
    setPhotoFileName('');
    setSignatureDataUrl(null);
    setLocationLabel(isCheckout ? job?.address || '' : '');
    setLocationMeta(null);
    setSubmitError('');
    setLocationError('');
    detectLocation({ notify: false });
    return undefined;
  }, [open, job?.address, detectLocation, mode, isCheckout]);

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
  const hasGpsCoords =
    Number.isFinite(Number(locationMeta?.lat)) && Number.isFinite(Number(locationMeta?.lng));
  const hasProof = Boolean(photoPreview) && Boolean(signatureDataUrl);
  const canSubmit =
    (isCheckout || hasProof) &&
    Boolean(trimmedLocation) &&
    !locating &&
    (isCheckout || hasGpsCoords);

  const handleConfirm = async () => {
    if (!canSubmit || !job) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      let locationPayload;

      if (isCheckout) {
        locationPayload = {
          label: trimmedLocation,
          lat: locationMeta?.lat ?? job?.latitude ?? null,
          lng: locationMeta?.lng ?? job?.longitude ?? null,
          capturedAt: new Date().toISOString(),
          source: locationMeta?.source || 'manual',
        };
      } else {
        const fresh = await detectLocation({ notify: false });
        const lat = Number(fresh?.lat);
        const lng = Number(fresh?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          throw new Error(
            fresh?.error ||
            'Current GPS location is required for check-in. Please enable location access and try again.'
          );
        }
        locationPayload = {
          label: String(fresh.label || '').trim() || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          lat,
          lng,
          capturedAt: fresh.capturedAt || new Date().toISOString(),
          source: fresh.source || 'gps',
        };
      }

      await onConfirm?.({
        job,
        photoDataUrl: photoPreview,
        photoFileName,
        signatureDataUrl,
        location: locationPayload,
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
            <SignaturePad onChange={setSignatureDataUrl} height={SIGNATURE_H} />
          </Box>

          <LocationField
            gpsOnly={!isCheckout}
            value={locationLabel}
            error={locationError}
            onChange={(next) => {
              setLocationLabel(next);
              setLocationMeta((current) =>
                current?.label === next
                  ? current
                  : { label: next, lat: null, lng: null, source: 'manual' }
              );
            }}
            onPlaceSelect={(place) => {
              if (!isCheckout) return;
              const label = place?.label || '';
              setLocationLabel(label);
              setLocationMeta({
                label,
                lat: place?.latitude ?? null,
                lng: place?.longitude ?? null,
                source: 'places',
                capturedAt: new Date().toISOString(),
              });
            }}
            loading={locating}
            onDetect={() => detectLocation({ notify: true })}
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
