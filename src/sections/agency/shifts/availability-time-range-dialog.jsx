import { useEffect, useState } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LoadingButton from '@mui/lab/LoadingButton';

const TITLE_BY_KIND = {
  busy: 'Mark as busy',
  'day-off': 'Day Off',
  'add-leave': 'Add leave',
  other: 'Other',
};

function normalizeTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

function defaultTimesForKind(kind) {
  if (kind === 'add-leave') return { startTime: '09:00', endTime: '18:00' };
  if (kind === 'busy' || kind === 'other') return { startTime: '00:00', endTime: '12:00' };
  return { startTime: '00:00', endTime: '23:59' };
}

export function AvailabilityTimeRangeDialog({
  open,
  onClose,
  onSubmit,
  submitting = false,
  kind = 'busy',
  staffName = '',
  dateLabel = '',
}) {
  const noteRequired = kind === 'other' || kind === 'busy';
  const defaults = defaultTimesForKind(kind);

  const [startTime, setStartTime] = useState(defaults.startTime);
  const [endTime, setEndTime] = useState(defaults.endTime);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    const next = defaultTimesForKind(kind);
    setStartTime(next.startTime);
    setEndTime(next.endTime);
    setNote('');
  }, [open, kind]);

  const resolvedStart = normalizeTime(startTime);
  const resolvedEnd = normalizeTime(endTime);
  const noteText = String(note || '').trim();
  const canSave = Boolean(resolvedStart && resolvedEnd && (!noteRequired || noteText));

  const handleSave = async () => {
    if (!canSave) return;
    await onSubmit?.({
      kind,
      startTime: resolvedStart,
      endTime: resolvedEnd,
      overnight: resolvedEnd <= resolvedStart,
      note: noteText,
    });
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{TITLE_BY_KIND[kind] || 'Availability'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="From"
              type="time"
              size="small"
              value={resolvedStart || ''}
              onChange={(event) => setStartTime(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={submitting}
            />
            <TextField
              label="To"
              type="time"
              size="small"
              value={resolvedEnd || ''}
              onChange={(event) => setEndTime(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={submitting}
              helperText={
                resolvedStart && resolvedEnd && resolvedEnd <= resolvedStart
                  ? 'Ends next day'
                  : ' '
              }
            />
          </Stack>

          <TextField
            label={kind === 'other' ? 'Description' : 'Note'}
            placeholder={
              kind === 'other'
                ? 'Add description'
                : kind === 'busy'
                  ? 'Busy doing what?'
                  : 'Note (optional)'
            }
            value={note}
            onChange={(event) => setNote(event.target.value)}
            fullWidth
            size="small"
            multiline
            minRows={2}
            required={noteRequired}
            disabled={submitting}
            error={noteRequired && open && !noteText}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={submitting}
          disabled={!canSave}
          onClick={handleSave}
        >
          Save
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
