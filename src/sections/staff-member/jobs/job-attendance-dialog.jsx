import { useMemo } from 'react';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';
import { Lightbox, useLightBox } from 'src/components/lightbox';

import { useGetJobAttendanceBookingsQuery } from 'src/store/Reducer/job-attendance-api';

import { normalizeBookingStatus } from 'src/sections/agency/jobs/agency-job-api-utils';

import { hasAttendanceRecord, mapAttendanceBlock, mergeAttendance } from './nurse-checkin-api-utils';
import { renderSignatureSlide } from './signature-image';
import { AttendanceRecord, getAttendanceSlides } from './staff-member-attendance-dialog';

// ----------------------------------------------------------------------

const STATUS_CHIPS = {
  active: { label: 'Booked', color: 'info' },
  inProgress: { label: 'On shift', color: 'warning' },
  completed: { label: 'Completed', color: 'success' },
};

function formatShiftLabel(booking) {
  let day = '';
  if (booking.shiftDate) {
    const date = new Date(`${booking.shiftDate}T00:00:00`);
    day = Number.isNaN(date.getTime())
      ? booking.shiftDate
      : date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  }
  const time = [booking.shiftStartTime, booking.shiftEndTime].filter(Boolean).join(' – ');
  return [day, time].filter(Boolean).join(' · ');
}

function isCancelled(status) {
  return String(status || '').toLowerCase().startsWith('cancel');
}

/** The bookings this dialog is about: one booking / shift when given, else the whole job. */
function pickBookings(bookings, { jobId, bookingId, shiftId }) {
  // The list can come back unfiltered, so keep only this job's bookings.
  const live = bookings.filter(
    (row) => !isCancelled(row.status) && (!jobId || String(row.jobId || '').trim() === jobId)
  );
  if (bookingId) {
    const match = live.filter((row) => row.id === bookingId);
    if (match.length) return match;
  }
  if (shiftId) {
    const match = live.filter((row) => row.shiftId === shiftId);
    if (match.length) return match;
  }
  return bookingId || shiftId ? [] : live;
}

// ----------------------------------------------------------------------

/**
 * Attendance of the workers booked on a job, for whoever booked them: the customer that posted
 * the job, or the agency / home care company that assigned its own staff.
 *
 * `fallbackAttendance` (already mapped) covers a single booking when the list has nothing for it.
 */
export function JobAttendanceDialog({
  open,
  mode,
  job,
  bookingId = '',
  shiftId = '',
  fallbackAttendance = null,
  onClose,
}) {
  const jobId = String(job?.id || job?._id || '').trim();

  const { data = [], isFetching } = useGetJobAttendanceBookingsQuery(
    { mode, jobId },
    { skip: !open || !jobId, refetchOnMountOrArgChange: true }
  );

  const records = useMemo(() => {
    const rows = pickBookings(data, {
      jobId,
      bookingId: String(bookingId || '').trim(),
      shiftId: String(shiftId || '').trim(),
    }).map((booking) => ({
      ...booking,
      bookingStatus: normalizeBookingStatus(booking.status),
      attendance: mapAttendanceBlock(booking.attendance),
    }));

    const fallback = hasAttendanceRecord(fallbackAttendance) ? fallbackAttendance : null;
    if (!rows.length && fallback) {
      return [{ id: bookingId || 'fallback', attendance: fallback }];
    }
    if (rows.length === 1 && fallback) {
      rows[0].attendance = mergeAttendance(fallback, rows[0].attendance);
    }
    return rows;
  }, [bookingId, data, fallbackAttendance, jobId, shiftId]);

  const slides = useMemo(
    () =>
      records.flatMap((record) =>
        getAttendanceSlides(record.attendance).map((slide) => ({
          ...slide,
          title: record.workerName ? `${record.workerName} · ${slide.title}` : slide.title,
        }))
      ),
    [records]
  );

  const lightbox = useLightBox(slides);

  if (!job) return null;

  const loading = isFetching && !records.length;

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle sx={{ pr: 6 }}>
          Attendance
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {job.title || job.type}
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

        {isFetching ? <LinearProgress /> : null}

        <DialogContent dividers>
          {!records.length && !isFetching ? (
            <Alert severity="info">
              No worker is booked on this job yet — check-in and check-out proof appear here once
              the booked worker starts the shift.
            </Alert>
          ) : null}

          {loading ? <AttendanceRecord attendance={null} loading /> : null}

          <Stack spacing={3} divider={<Divider flexItem />}>
            {records.map((record) => {
              const chip = STATUS_CHIPS[record.bookingStatus];
              const shiftLabel = formatShiftLabel(record);
              const showHeader = Boolean(record.workerName || shiftLabel || chip);

              return (
                <Stack key={record.id} spacing={1.5}>
                  {showHeader ? (
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar
                        src={record.workerAvatar || undefined}
                        alt={record.workerName}
                        sx={{ width: 36, height: 36 }}
                      >
                        {(record.workerName || '?').charAt(0).toUpperCase()}
                      </Avatar>
                      <Stack sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {record.workerName || 'Booked worker'}
                        </Typography>
                        {shiftLabel ? (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                            {shiftLabel}
                          </Typography>
                        ) : null}
                      </Stack>
                      {chip ? (
                        <Chip
                          size="small"
                          variant="soft"
                          color={chip.color}
                          label={chip.label}
                          sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
                        />
                      ) : null}
                    </Stack>
                  ) : null}

                  <AttendanceRecord attendance={record.attendance} onOpen={lightbox.onOpen} />
                </Stack>
              );
            })}
          </Stack>
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
