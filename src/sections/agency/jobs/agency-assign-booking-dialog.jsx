import { useMemo, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { format, isValid, parseISO } from 'date-fns';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { handleApiError } from 'src/store/handleApiError';
import { getJobApiErrorMessage } from 'src/sections/care-home/jobs/care-home-job-api-utils';
import {
  buildStaffBusyDateSet,
  isStaffBusyOnDateInSet,
} from 'src/sections/agency/shifts/agency-availability-api-utils';

function pickApiToastMessage(payload, fallback) {
  const candidates = [
    payload?.message,
    payload?.data?.message,
    typeof payload?.data === 'string' ? payload.data : '',
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
}

function pickApiErrorToast(err, fallback) {
  const raw = err?.data?.message;
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  return getJobApiErrorMessage(err) || handleApiError(err) || fallback;
}

import { useGetAgencyStaffQuery } from 'src/store/Reducer/agency-staff-api';
import {
  agencyAvailabilityApi,
  useCreateAgencyBookingMutation,
  useGetAgencyAvailabilityQuery,
} from 'src/store/Reducer/agency-availability-api';
import { agencyJobsApi } from 'src/store/Reducer/agency-jobs-api';
import { agencyBidsApi } from 'src/store/Reducer/agency-bids-api';
import { useGetHomeCareCompanyStaffQuery } from 'src/store/Reducer/home-care-company-staff-api';
import {
  homeCareCompanyAvailabilityApi,
  useCreateHomeCareCompanyBookingMutation,
  useGetHomeCareCompanyAvailabilityQuery,
} from 'src/store/Reducer/home-care-company-availability-api';
import { homeCareCompanyJobsApi } from 'src/store/Reducer/home-care-company-jobs-api';
import { homeCareCompanyBidsApi } from 'src/store/Reducer/home-care-company-bids-api';

// ----------------------------------------------------------------------

function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || '').trim());
}

/** Prefer linked nurse/worker id for POST booking */
function resolveWorkerId(staff) {
  const candidates = [
    staff?.staffId,
    staff?.workerId,
    staff?.raw?.staffId,
    staff?.raw?.workerId,
    staff?.raw?.staff?._id,
    staff?.id,
  ];
  for (const candidate of candidates) {
    const id = String(candidate || '').trim();
    if (isMongoObjectId(id)) return id;
  }
  return '';
}

function formatSpecialtyLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatStaffOptionLabel(member) {
  const specialty = formatSpecialtyLabel(member?.specialty || member?.specialities?.[0]);
  const name = String(member?.name || 'Staff').trim();
  return specialty ? `${name} · ${specialty}` : name;
}

function formatStaffOptionMeta(member, { busy = false } = {}) {
  const rate = Number(member?.ratePerHour);
  const rating = Number(member?.rating);
  const worked = Number(member?.totalHoursWorked ?? member?.weeklyHours);
  const allowed = Number(member?.hoursAllowed);
  const parts = [];
  if (busy) parts.push('Busy — no auto-accept');
  if (Number.isFinite(rate) && rate > 0) parts.push(`${fCurrency(rate)}/hr`);
  if (Number.isFinite(rating) && rating > 0) parts.push(`★ ${rating.toFixed(1)}`);
  if (Number.isFinite(worked) || Number.isFinite(allowed)) {
    const w = Number.isFinite(worked) ? worked : 0;
    const a = Number.isFinite(allowed) && allowed > 0 ? allowed : null;
    parts.push(a != null ? `${w}h/${a}h` : `${w}h`);
  }
  return parts.join(' · ');
}

function resolveJobShiftDateKey(job) {
  const raw = String(job?.shiftDate || job?.shiftRows?.[0]?.date || '').trim();
  if (!raw) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  try {
    const parsed = parseISO(raw);
    if (isValid(parsed)) return format(parsed, 'yyyy-MM-dd');
  } catch {
    // fall through
  }
  return raw.slice(0, 10);
}

function isMemberBusyOnDate(busyDateKeys, member, dateKey) {
  if (!dateKey || !busyDateKeys?.size) return false;
  const ids = [member?.workerId, member?.staffId, member?.id, member?.membershipId, member?._id]
    .map((value) => String(value || '').trim())
    .filter(Boolean);
  return ids.some((id) => isStaffBusyOnDateInSet(busyDateKeys, id, dateKey));
}

/**
 * Find Jobs → Assign Staff modal.
 * POST { bid, worker } → /web/agency/booking or /web/home-care-company/booking
 * Booking then shows on Shifts calendar GET.
 */
export function AgencyAssignBookingDialog({ open, job, bid, onClose, mode = 'agency' }) {
  const dispatch = useDispatch();
  const isHomeCareCompany = mode === 'homeCareCompany';
  const [workerId, setWorkerId] = useState('');

  const [createAgencyBooking, agencyAssignState] = useCreateAgencyBookingMutation();
  const [createHccBooking, hccAssignState] = useCreateHomeCareCompanyBookingMutation();
  const assigning = isHomeCareCompany ? hccAssignState.isLoading : agencyAssignState.isLoading;

  const shiftDateKey = useMemo(() => resolveJobShiftDateKey(job), [job]);

  const agencyStaffQuery = useGetAgencyStaffQuery(
    { page: 0, limit: 200, status: 'active' },
    { skip: !open || isHomeCareCompany }
  );
  const hccStaffQuery = useGetHomeCareCompanyStaffQuery(
    { page: 0, limit: 200, status: 'active' },
    { skip: !open || !isHomeCareCompany }
  );

  const agencyAvailabilityQuery = useGetAgencyAvailabilityQuery(
    {
      page: 0,
      limit: 200,
      startDate: shiftDateKey,
      endDate: shiftDateKey,
    },
    { skip: !open || isHomeCareCompany || !shiftDateKey }
  );
  const hccAvailabilityQuery = useGetHomeCareCompanyAvailabilityQuery(
    {
      page: 0,
      limit: 200,
      startDate: shiftDateKey,
      endDate: shiftDateKey,
    },
    { skip: !open || !isHomeCareCompany || !shiftDateKey }
  );

  const staffQuery = isHomeCareCompany ? hccStaffQuery : agencyStaffQuery;
  const staffData = staffQuery.data;
  const staffLoading = staffQuery.isLoading;
  const staffError = staffQuery.isError;
  const staffErrorDetail = staffQuery.error;

  const availabilityList = isHomeCareCompany
    ? hccAvailabilityQuery.data?.data
    : agencyAvailabilityQuery.data?.data;

  const staffOptions = useMemo(() => {
    const list = Array.isArray(staffData?.data) ? staffData.data : [];
    return list
      .filter((member) => !member?.isVacant && resolveWorkerId(member))
      .map((member) => ({
        ...member,
        workerId: resolveWorkerId(member),
      }));
  }, [staffData?.data]);

  const busyDateKeys = useMemo(
    () => buildStaffBusyDateSet(availabilityList, staffOptions),
    [availabilityList, staffOptions]
  );

  const staffOptionsWithBusy = useMemo(
    () =>
      staffOptions.map((member) => ({
        ...member,
        busy: isMemberBusyOnDate(busyDateKeys, member, shiftDateKey),
      })),
    [busyDateKeys, shiftDateKey, staffOptions]
  );

  const availableStaffOptions = useMemo(
    () => staffOptionsWithBusy.filter((member) => !member.busy),
    [staffOptionsWithBusy]
  );

  const selectedIsBusy = useMemo(() => {
    const selected = staffOptionsWithBusy.find((member) => member.workerId === workerId);
    return Boolean(selected?.busy);
  }, [staffOptionsWithBusy, workerId]);

  const bidId = String(bid?.id || bid?._id || '').trim();
  const schedule =
    job?.schedule ||
    [
      job?.shiftDate,
      job?.shiftStartTime && job?.shiftEndTime
        ? `${job.shiftStartTime}–${job.shiftEndTime}`
        : '',
    ]
      .filter(Boolean)
      .join(' · ') ||
    '—';

  useEffect(() => {
    if (!open) {
      setWorkerId('');
      return;
    }
    if (workerId) {
      const stillOk = availableStaffOptions.some((member) => member.workerId === workerId);
      if (!stillOk) setWorkerId('');
      return;
    }
    if (availableStaffOptions.length === 1) {
      setWorkerId(availableStaffOptions[0].workerId);
    }
  }, [availableStaffOptions, open, workerId]);

  const handleAssign = async () => {
    if (!isMongoObjectId(bidId)) {
      toast.error('Missing accepted bid for this shift');
      return;
    }
    if (!isMongoObjectId(workerId)) {
      toast.error('Select a staff member to assign');
      return;
    }
    if (selectedIsBusy) {
      toast.warning('This staff member is busy / unavailable for that shift date.');
      return;
    }

    try {
      const body = { bid: bidId, worker: workerId };
      let result;
      if (isHomeCareCompany) {
        result = await createHccBooking(body).unwrap();
        dispatch(
          homeCareCompanyAvailabilityApi.util.invalidateTags([
            { type: 'HomeCareCompanyBookingCalendar', id: 'LIST' },
          ])
        );
        dispatch(homeCareCompanyJobsApi.util.invalidateTags([{ type: 'HomeCareCompanyJob', id: 'LIST' }]));
        dispatch(homeCareCompanyBidsApi.util.invalidateTags([{ type: 'HomeCareCompanyBid', id: 'LIST' }]));
      } else {
        result = await createAgencyBooking(body).unwrap();
        dispatch(
          agencyAvailabilityApi.util.invalidateTags([{ type: 'AgencyBookingCalendar', id: 'LIST' }])
        );
        dispatch(agencyJobsApi.util.invalidateTags([{ type: 'AgencyJob', id: 'LIST' }]));
        dispatch(agencyBidsApi.util.invalidateTags([{ type: 'AgencyBid', id: 'LIST' }]));
      }
      toast.success(pickApiToastMessage(result, 'Staff assigned — check Shifts calendar'));
      onClose?.({ assigned: true });
    } catch (err) {
      toast.error(pickApiErrorToast(err, 'Failed to assign staff'));
    }
  };

  return (
    <Dialog open={open} onClose={() => !assigning && onClose?.()} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1 }}>Assign staff</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.5}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Job
            </Typography>
            <Typography variant="subtitle2">{job?.title || '—'}</Typography>
            {job?.role ? (
              <Typography variant="caption" color="text.secondary">
                {job.role}
              </Typography>
            ) : null}
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary">
              Shift
            </Typography>
            <Typography variant="body2">{schedule}</Typography>
          </Box>

          {staffLoading ? (
            <Stack alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : staffError ? (
            <Alert
              severity="error"
              action={
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<Iconify icon="eva:refresh-fill" width={16} />}
                  onClick={() => staffQuery.refetch()}
                  disabled={staffQuery.isFetching}
                >
                  Retry
                </Button>
              }
            >
              {pickApiErrorToast(staffErrorDetail, 'Could not load staff. Please try again.')}
            </Alert>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel id="assign-worker-label">Staff</InputLabel>
              <Select
                labelId="assign-worker-label"
                label="Staff"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                disabled={assigning || !availableStaffOptions.length}
                renderValue={(selected) => {
                  const member = staffOptionsWithBusy.find((item) => item.workerId === selected);
                  return member ? formatStaffOptionLabel(member) : '';
                }}
              >
                {staffOptionsWithBusy.length === 0 ? (
                  <MenuItem value="" disabled>
                    No active staff found
                  </MenuItem>
                ) : availableStaffOptions.length === 0 ? (
                  <MenuItem value="" disabled>
                    All staff are busy for this shift date
                  </MenuItem>
                ) : (
                  staffOptionsWithBusy.map((member) => {
                    const meta = formatStaffOptionMeta(member, { busy: member.busy });
                    return (
                      <MenuItem
                        key={member.workerId}
                        value={member.workerId}
                        disabled={member.busy}
                        sx={{ py: 1 }}
                      >
                        <Stack spacing={0.15} sx={{ minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            noWrap
                            sx={{ color: member.busy ? 'text.disabled' : 'text.primary' }}
                          >
                            {formatStaffOptionLabel(member)}
                          </Typography>
                          {meta ? (
                            <Typography
                              variant="caption"
                              noWrap
                              sx={{ color: member.busy ? 'warning.main' : 'text.secondary' }}
                            >
                              {meta}
                            </Typography>
                          ) : null}
                        </Stack>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
              {shiftDateKey && staffOptionsWithBusy.some((member) => member.busy) ? (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                  Busy staff are disabled for {shiftDateKey} (availability / leave).
                </Typography>
              ) : null}
            </FormControl>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={() => onClose?.()} disabled={assigning}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={assigning}
          disabled={!bidId || !workerId || selectedIsBusy}
          onClick={handleAssign}
          startIcon={<Iconify icon="eva:checkmark-circle-2-fill" width={16} />}
        >
          Assign
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
