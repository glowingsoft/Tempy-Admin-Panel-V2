import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';
import { Lightbox, useLightBox } from 'src/components/lightbox';
import { getJobDateParts } from 'src/components/jobs/job-date-filters';

import { formatAttendanceTime } from './staff-member-attendance';
import { SignatureImage, renderSignatureSlide } from './signature-image';

// ----------------------------------------------------------------------

function formatAttendanceStamp(iso) {
  if (!iso) return '';
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

function ProofImage({ src, label, signature, loading, onOpen }) {
  const imageSx = {
    width: 1,
    height: 150,
    cursor: 'zoom-in',
    borderRadius: 1.5,
    // Whole picture, never cropped.
    objectFit: 'contain',
    bgcolor: 'background.neutral',
    border: '1px solid',
    borderColor: 'divider',
    '&:hover': { borderColor: 'primary.main' },
  };

  return (
    <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
        {label}
      </Typography>

      {src && signature ? (
        <SignatureImage
          alt={label}
          src={src}
          loading="lazy"
          data-no-preview
          onClick={() => onOpen(src)}
          sx={{ ...imageSx, bgcolor: '#fff' }}
        />
      ) : src ? (
        <Box
          component="img"
          alt={label}
          src={src}
          loading="lazy"
          data-no-preview
          onClick={() => onOpen(src)}
          sx={imageSx}
        />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          spacing={0.5}
          sx={{
            width: 1,
            height: 150,
            borderRadius: 1.5,
            border: '1px dashed',
            borderColor: 'divider',
            color: 'text.disabled',
            bgcolor: 'background.neutral',
          }}
        >
          <Iconify
            icon={loading ? 'svg-spinners:180-ring-with-bg' : 'solar:gallery-remove-bold'}
            width={20}
          />
          <Typography variant="caption">{loading ? 'Loading…' : 'Not captured'}</Typography>
        </Stack>
      )}
    </Stack>
  );
}

function PointLink({ point }) {
  if (!point) return null;
  const label = `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Iconify icon="solar:map-point-bold" width={14} sx={{ color: 'text.secondary' }} />
      <Link
        href={`https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        variant="caption"
      >
        {label}
      </Link>
    </Stack>
  );
}

function AttendanceSide({
  title,
  icon,
  color,
  at,
  proof,
  signature,
  point,
  loading,
  children,
  onOpen,
}) {
  const stamp = formatAttendanceStamp(at);

  return (
    <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Iconify icon={icon} width={18} sx={{ color: `${color}.main` }} />
        <Typography variant="subtitle2">{title}</Typography>
        <Chip
          size="small"
          color={stamp ? color : 'default'}
          variant={stamp ? 'soft' : 'outlined'}
          label={stamp || 'Not recorded'}
          sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
        />
      </Stack>

      <Stack direction="row" spacing={1}>
        <ProofImage src={proof} label="Proof picture" loading={loading} onOpen={onOpen} />
        <ProofImage src={signature} label="Signature" signature loading={loading} onOpen={onOpen} />
      </Stack>

      <PointLink point={point} />

      {children}
    </Stack>
  );
}

/** Check-in and check-out side by side — proof pictures, signatures, times and location. */
export function AttendanceRecord({ attendance, loading = false, onOpen }) {
  return (
    <>
      <Stack
        spacing={2}
        direction={{ xs: 'column', sm: 'row' }}
        divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
      >
        <AttendanceSide
          title="Check in"
          icon="solar:login-3-bold"
          color="success"
          at={attendance?.checkInAt}
          proof={attendance?.checkInProof}
          signature={attendance?.checkInSignature}
          point={attendance?.checkInPoint}
          loading={loading}
          onOpen={onOpen}
        />

        <AttendanceSide
          title="Check out"
          icon="solar:logout-3-bold"
          color="error"
          at={attendance?.checkOutAt}
          proof={attendance?.checkOutProof}
          signature={attendance?.checkOutSignature}
          point={attendance?.checkOutPoint}
          loading={loading}
          onOpen={onOpen}
        >
          {attendance?.checkOutReason ? (
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Reason: {attendance.checkOutReason}
            </Typography>
          ) : null}
          {attendance?.autoCheckedOut ? (
            <Chip
              size="small"
              color="warning"
              variant="soft"
              label="Auto checked out"
              sx={{ alignSelf: 'flex-start', height: 22, fontSize: 11, fontWeight: 600 }}
            />
          ) : null}
        </AttendanceSide>
      </Stack>

      {attendance?.checkInAt && attendance?.checkOutAt ? (
        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
          On shift {formatAttendanceTime(attendance.checkInAt)} —{' '}
          {formatAttendanceTime(attendance.checkOutAt)}
        </Typography>
      ) : null}
    </>
  );
}

/** Proof pictures and signatures of one attendance, in lightbox order. */
export function getAttendanceSlides(attendance) {
  return [
    { src: attendance?.checkInProof, title: 'Check-in proof picture' },
    { src: attendance?.checkInSignature, title: 'Check-in signature', isSignature: true },
    { src: attendance?.checkOutProof, title: 'Check-out proof picture' },
    { src: attendance?.checkOutSignature, title: 'Check-out signature', isSignature: true },
  ].filter((slide) => Boolean(slide.src));
}

/** Check-in / check-out proof pictures, signatures, times and location for one booking. */
export function StaffMemberAttendanceDialog({ open, job, attendance, loading = false, onClose }) {
  const slides = useMemo(() => getAttendanceSlides(attendance), [attendance]);

  const lightbox = useLightBox(slides);

  if (!job) return null;

  const parts = getJobDateParts(job);
  const shiftLabel = [
    [parts.weekday, parts.day, parts.month].filter(Boolean).join(' '),
    parts.time || job.schedule || '',
  ]
    .filter(Boolean)
    .join(' · ');

  const hasRecord = Boolean(attendance?.checkInAt || attendance?.checkOutAt || slides.length);

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6 }}>
          Attendance
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {job.title}
            {shiftLabel ? ` · ${shiftLabel}` : ''}
          </Typography>
          <IconButton
            aria-label="Close"
            onClick={onClose}
            size="small"
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>

        {loading && !hasRecord ? <ModuleLoading sx={{ py: 4 }} /> : null}

        <DialogContent dividers>
          {!hasRecord && !loading ? (
            <Alert severity="info" sx={{ mb: 1 }}>
              Nothing recorded for this shift yet — the proof picture and signature appear here once
              the worker checks in.
            </Alert>
          ) : null}

          <AttendanceRecord attendance={attendance} loading={loading} onOpen={lightbox.onOpen} />
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="outlined" color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Lightbox
        open={lightbox.open}
        close={lightbox.onClose}
        slides={slides}
        index={lightbox.selected}
        disableVideo
        disableSlideshow
        render={{ slide: renderSignatureSlide }}
      />
    </>
  );
}
