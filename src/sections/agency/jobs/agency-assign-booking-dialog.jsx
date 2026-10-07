import { useMemo, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
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

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { getJobApiErrorMessage } from 'src/sections/care-home/jobs/care-home-job-api-utils';

import { useGetAgencyStaffQuery } from 'src/store/Reducer/agency-staff-api';
import { agencyAvailabilityApi, useCreateAgencyBookingMutation } from 'src/store/Reducer/agency-availability-api';
import { agencyJobsApi } from 'src/store/Reducer/agency-jobs-api';
import { agencyBidsApi } from 'src/store/Reducer/agency-bids-api';
import { useGetHomeCareCompanyStaffQuery } from 'src/store/Reducer/home-care-company-staff-api';
import {
  homeCareCompanyAvailabilityApi,
  useCreateHomeCareCompanyBookingMutation,
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

  const agencyStaffQuery = useGetAgencyStaffQuery(
    { page: 0, limit: 200, status: 'active' },
    { skip: !open || isHomeCareCompany }
  );
  const hccStaffQuery = useGetHomeCareCompanyStaffQuery(
    { page: 0, limit: 200, status: 'active' },
    { skip: !open || !isHomeCareCompany }
  );

  const staffData = isHomeCareCompany ? hccStaffQuery.data : agencyStaffQuery.data;
  const staffLoading = isHomeCareCompany ? hccStaffQuery.isFetching : agencyStaffQuery.isFetching;

  const staffOptions = useMemo(() => {
    const list = Array.isArray(staffData?.data) ? staffData.data : [];
    return list
      .filter((member) => !member?.isVacant && resolveWorkerId(member))
      .map((member) => ({
        ...member,
        workerId: resolveWorkerId(member),
      }));
  }, [staffData?.data]);

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
    if (!workerId && staffOptions.length === 1) {
      setWorkerId(staffOptions[0].workerId);
    }
  }, [open, staffOptions, workerId]);

  const handleAssign = async () => {
    if (!isMongoObjectId(bidId)) {
      toast.error('Missing accepted bid for this shift');
      return;
    }
    if (!isMongoObjectId(workerId)) {
      toast.error('Select a staff member to assign');
      return;
    }

    try {
      const body = { bid: bidId, worker: workerId };
      if (isHomeCareCompany) {
        await createHccBooking(body).unwrap();
        dispatch(
          homeCareCompanyAvailabilityApi.util.invalidateTags([
            { type: 'HomeCareCompanyBookingCalendar', id: 'LIST' },
          ])
        );
        dispatch(homeCareCompanyJobsApi.util.invalidateTags([{ type: 'HomeCareCompanyJob', id: 'LIST' }]));
        dispatch(homeCareCompanyBidsApi.util.invalidateTags([{ type: 'HomeCareCompanyBid', id: 'LIST' }]));
      } else {
        await createAgencyBooking(body).unwrap();
        dispatch(
          agencyAvailabilityApi.util.invalidateTags([{ type: 'AgencyBookingCalendar', id: 'LIST' }])
        );
        dispatch(agencyJobsApi.util.invalidateTags([{ type: 'AgencyJob', id: 'LIST' }]));
        dispatch(agencyBidsApi.util.invalidateTags([{ type: 'AgencyBid', id: 'LIST' }]));
      }
      toast.success('Staff assigned — check Shifts calendar');
      onClose?.({ assigned: true });
    } catch (err) {
      const message =
        getJobApiErrorMessage(err) || err?.data?.message || err?.error || err?.message || 'Failed to assign staff';
      toast.error(message);
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
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel id="assign-worker-label">Staff</InputLabel>
              <Select
                labelId="assign-worker-label"
                label="Staff"
                value={workerId}
                onChange={(e) => setWorkerId(e.target.value)}
                disabled={assigning || !staffOptions.length}
              >
                {staffOptions.length === 0 ? (
                  <MenuItem value="" disabled>
                    No active staff found
                  </MenuItem>
                ) : (
                  staffOptions.map((member) => (
                    <MenuItem key={member.workerId} value={member.workerId}>
                      {member.name}
                      {member.specialty ? ` · ${member.specialty}` : ''}
                    </MenuItem>
                  ))
                )}
              </Select>
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
          disabled={!bidId || !workerId}
          onClick={handleAssign}
          startIcon={<Iconify icon="eva:checkmark-circle-2-fill" width={16} />}
        >
          Assign
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
