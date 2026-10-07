import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fCurrency } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { useEnrolStaffCareTutorCourseMutation } from 'src/store/Reducer/care-tutor-api';

import { CARE_TUTOR_COURSE_CATALOG } from './care-tutor-data';
import { calculateTrainingCheckout, enrolStaffInCourse } from './care-tutor-store';

// ----------------------------------------------------------------------

export function CareTutorEnrolDialog({ open, onClose, orgId, staffOptions = [], commissionPercent = 10, onEnrolled }) {
  const [staffId, setStaffId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [enrolApi] = useEnrolStaffCareTutorCourseMutation();

  const selectedStaff = staffOptions.find((item) => String(item.id) === String(staffId));
  const selectedCourse = CARE_TUTOR_COURSE_CATALOG.find((item) => item.id === courseId);

  const checkout = useMemo(
    () => calculateTrainingCheckout(selectedCourse?.price || 0, commissionPercent),
    [commissionPercent, selectedCourse?.price]
  );

  const handleClose = () => {
    setStaffId('');
    setCourseId('');
    onClose?.();
  };

  const handleEnrol = async () => {
    if (!staffId || !selectedCourse) {
      toast.error('Select staff and course.');
      return;
    }

    try {
      const { record, payment } = enrolStaffInCourse(orgId, {
        staffId,
        staffName: selectedStaff?.name,
        courseTitle: selectedCourse.title,
        coursePrice: selectedCourse.price,
        commissionPercent,
      });

      enrolApi({
        staffId,
        courseId: selectedCourse.id,
        courseTitle: selectedCourse.title,
        amount: payment.amount,
      }).catch(() => {});

      toast.success(`${selectedStaff?.name || 'Staff'} enrolled in ${selectedCourse.title}`);
      onEnrolled?.(record);
      handleClose();
    } catch (error) {
      toast.error(error?.message || 'Could not enrol staff.');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Enrol in Care Tutor course</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          <TextField
            select
            fullWidth
            label="Staff member"
            value={staffId}
            onChange={(event) => setStaffId(event.target.value)}
          >
            {staffOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Course"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          >
            {CARE_TUTOR_COURSE_CATALOG.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.title} — {fCurrency(course.price)}
              </MenuItem>
            ))}
          </TextField>

          {selectedCourse ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'background.neutral',
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Payment breakdown
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Course fee
                  </Typography>
                  <Typography variant="body2">{fCurrency(checkout.amount)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Tempy platform fee ({checkout.commissionPercent}%)
                  </Typography>
                  <Typography variant="body2">{fCurrency(checkout.platformFee)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Care Tutor receives
                  </Typography>
                  <Typography variant="body2">{fCurrency(checkout.caretutorPayout)}</Typography>
                </Stack>
                <Divider sx={{ borderStyle: 'dashed' }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="subtitle2">Total charge</Typography>
                  <Typography variant="subtitle2">{fCurrency(checkout.total)}</Typography>
                </Stack>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                Certificate appears on the staff profile once Care Tutor verifies completion.
              </Typography>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:card-bold" />}
          onClick={handleEnrol}
          disabled={!staffId || !courseId}
        >
          Pay &amp; enrol
        </Button>
      </DialogActions>
    </Dialog>
  );
}
