import { useEffect, useMemo, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fCurrency } from 'src/utils/format-number';

import { jobToDraft } from './care-home-job-utils';

// ----------------------------------------------------------------------

function resolveCurrentRate(job) {
  const draft = jobToDraft(job);
  const rate = Number(draft.hourlyRate);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

/**
 * Client: if there are no bids, employer can increase the job rate.
 */
export function IncreaseJobRateDialog({ open, job, onClose, onSubmit }) {
  const currentRate = useMemo(() => resolveCurrentRate(job), [job]);
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    const next = currentRate > 0 ? String(currentRate) : '';
    setRate(next);
    setError('');
    setSubmitting(false);
  }, [open, currentRate, job?.id]);

  const handleClose = () => {
    if (submitting) return;
    onClose?.();
  };

  const handleSubmit = async () => {
    const nextRate = Number(rate);
    if (!Number.isFinite(nextRate) || nextRate <= 0) {
      setError('Enter a valid hourly rate');
      return;
    }
    if (currentRate > 0 && nextRate <= currentRate) {
      setError(`New rate must be higher than ${fCurrency(currentRate)}/h`);
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit?.({ job, nextRate });
      onClose?.();
    } catch (err) {
      setError(
        err?.data?.message ||
          err?.error ||
          err?.message ||
          'Could not update the job rate'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!job) return null;

  const jobLabel = job.name || job.type || job.typeTitle || 'Job';

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Increase rate</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            No bids yet for <strong>{jobLabel}</strong>. Raise the offered rate to attract more
            applicants.
          </Typography>

          {currentRate > 0 ? (
            <Typography variant="body2">
              Current rate: <strong>{fCurrency(currentRate)}/h</strong>
            </Typography>
          ) : null}

          <TextField
            autoFocus
            fullWidth
            type="number"
            label="New hourly rate"
            value={rate}
            onChange={(event) => {
              setRate(event.target.value);
              if (error) setError('');
            }}
            inputProps={{ min: 0, step: 0.5 }}
            InputProps={{
              startAdornment: <InputAdornment position="start">£</InputAdornment>,
              endAdornment: <InputAdornment position="end">/h</InputAdornment>,
            }}
            error={Boolean(error)}
            helperText={error || 'Must be higher than the current rate'}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <LoadingButton variant="contained" loading={submitting} onClick={handleSubmit}>
          Save new rate
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
