import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

import { Iconify } from 'src/components/iconify';
import { getJobDateParts } from 'src/components/jobs/job-date-filters';
import { fCurrency } from 'src/utils/format-number';

import { formatSupplierJobStatus } from './supplier-job-dashboard-utils';
import { StaffMemberShiftAlertSection } from 'src/sections/staff-member/jobs/staff-member-shift-alert-section';
import { StaffMemberCancelShiftSection } from 'src/sections/staff-member/jobs/staff-member-cancel-shift-section';
import { useViewOnly } from 'src/hooks/use-view-only';


function DetailRow({ label, value }) {
  if (value == null || value === '') return null;
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

export function SupplierJobDetailsDialog({
  open,
  job,
  onClose,
  title,
  showShiftAlert = false,
  showCancelShift = false,
  onCancelled,
}) {
  const viewOnly = useViewOnly();
  if (!job) return null;

  const parts = getJobDateParts(job);
  const dateLabel = parts.hasDate
    ? `${parts.weekday} ${parts.day} ${parts.month} ${parts.iso.slice(0, 4)}`
    : '';
  const pay =
    job.hourlyRate != null && job.hourlyRate !== ''
      ? `${fCurrency(job.hourlyRate)} / hr`
      : job.totalPay != null && job.totalPay !== ''
        ? fCurrency(job.totalPay)
        : '';
  const dialogTitle = title || job.title || 'Job details';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 6 }}>
        {dialogTitle}
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
        <Stack spacing={1.5}>
          <DetailRow label="Status" value={formatSupplierJobStatus(job)} />
          <DetailRow label="Date" value={dateLabel} />
          <DetailRow label="Time" value={parts.time} />
          <DetailRow label="Location" value={job.address} />
          <DetailRow label="Role" value={job.role || job.jobTypeTitle} />
          <DetailRow label="Pay" value={pay} />
          <DetailRow label="Posted by" value={job.postedBy?.name} />
          <DetailRow label="Description" value={job.description} />
          <DetailRow label="Notes" value={job.careNotes} />
          {showShiftAlert && !viewOnly ? <StaffMemberShiftAlertSection job={job} /> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}>
        <Box>
          {showCancelShift && !viewOnly ? (
            <StaffMemberCancelShiftSection
              job={job}
              onCancelled={onCancelled}
              variant="footer"
            />
          ) : null}
        </Box>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
