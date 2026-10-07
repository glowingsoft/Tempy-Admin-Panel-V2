import { useEffect, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate } from 'src/utils/format-time';

import { AppButton } from 'src/components/app-button';

// ----------------------------------------------------------------------

export function ReallocateShiftDialog({
  open,
  onClose,
  shift,
  workers = [],
  loading = false,
  error = '',
  onConfirm,
  submitting = false,
}) {
  const [workerId, setWorkerId] = useState('');

  useEffect(() => {
    if (!open) return;
    setWorkerId('');
  }, [open, shift?.id]);

  const handleConfirm = async () => {
    const worker = workers.find((item) => item.id === workerId);
    if (!worker) return;
    await onConfirm?.(worker);
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Re-allocate shift</DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5 }}>
        {shift ? (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {shift.ref}
            {shift.date ? ` · ${fDate(shift.date)}` : ''}
            {shift.startTime || shift.endTime ? ` · ${shift.startTime}–${shift.endTime}` : ''}
            <br />
            {[shift.location, shift.role].filter(Boolean).join(' · ')}
          </Typography>
        ) : null}

        <Typography variant="body2" sx={{ mb: 2 }}>
          The replacement gets a pending booking and must accept it. If they decline, the agency keeps the award and assigns someone else.
        </Typography>

        {loading ? (
          <CircularProgress size={28} />
        ) : (
          <TextField
            select
            fullWidth
            size="small"
            label="Replacement worker"
            value={workerId}
            onChange={(event) => setWorkerId(event.target.value)}
            disabled={submitting || !workers.length}
            InputLabelProps={{ shrink: true }}
            helperText={error || (workers.length ? 'Select a worker from this shift’s replacements.' : 'No replacement workers returned.')}
            error={Boolean(error)}
          >
            {workers.map((worker) => (
              <MenuItem key={worker.id} value={worker.id}>
                {worker.name}
                {worker.role ? ` · ${worker.role}` : ''}
              </MenuItem>
            ))}
          </TextField>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" variant="outlined" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <AppButton onClick={handleConfirm} loading={submitting} disabled={loading || !workerId}>
          Re-allocate
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
