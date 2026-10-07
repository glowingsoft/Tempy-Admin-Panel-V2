import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Radio from '@mui/material/Radio';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import RadioGroup from '@mui/material/RadioGroup';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import {
  WORKER_RATING_OPTIONS,
  getJobWorkerName,
  getWorkerRatingOption,
} from './care-home-job-utils';

// ----------------------------------------------------------------------

function commentWithoutLabel(comment = '') {
  return String(comment || '')
    .replace(/^\s*\[[^\]]+\]\s*/i, '')
    .trim();
}

export function RateWorkerDialog({
  open,
  job,
  onClose,
  onSubmit,
  submitting = false,
}) {
  const [ratingId, setRatingId] = useState('');
  const [comment, setComment] = useState('');

  const isEditing = Boolean(job?.review?.id || job?.review?.rating);
  const workerName = getJobWorkerName(job);

  useEffect(() => {
    if (!open) return;
    const existing = getWorkerRatingOption(job?.review || {});
    setRatingId(existing?.id || '');
    setComment(commentWithoutLabel(job?.review?.comment || ''));
  }, [open, job]);

  const selected = WORKER_RATING_OPTIONS.find((option) => option.id === ratingId);

  const handleSubmit = () => {
    if (!selected || submitting) return;
    const notes = comment.trim();
    onSubmit?.({
      rating: selected.rating,
      ratingLabel: selected.label,
      comment: notes ? `[${selected.label}] ${notes}` : `[${selected.label}]`,
    });
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? 'Update worker rating' : 'Rate worker'}</DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>
              {job?.title || job?.type || 'Completed job'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {workerName
                ? `Rate ${workerName}. A rating is required for every completed job.`
                : 'A rating is required for every completed job.'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              Choose how the worker performed on this completed shift. Payment is still taken
              automatically 7 days after the shift, in £.
            </Typography>
          </Box>

          <RadioGroup
            value={ratingId}
            onChange={(event) => setRatingId(event.target.value)}
          >
            {WORKER_RATING_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio size="small" />}
                label={option.label}
              />
            ))}
          </RadioGroup>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (optional)"
            placeholder="Add anything the team should know…"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" variant="outlined" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          color="primary"
          disabled={!selected}
          loading={submitting}
          onClick={handleSubmit}
        >
          {isEditing ? 'Update rating' : 'Submit rating'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
