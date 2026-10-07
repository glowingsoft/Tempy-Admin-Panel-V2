import { useEffect, useMemo, useState } from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { AppButton } from 'src/components/app-button';

// ----------------------------------------------------------------------

export const PERSON_OFF_TYPES = [
  { value: 'day-off', label: 'Day off' },
  { value: 'leave', label: 'Leave / person off' },
];

export function PersonOffDialog({ open, onClose, staff, date, dateLabel = '', onConfirm }) {
  const [type, setType] = useState('day-off');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setType('day-off');
    setNotes('');
    setSaving(false);
  }, [open, staff?.id, date]);

  const titleName = useMemo(() => staff?.name || 'Staff', [staff?.name]);

  const handleConfirm = async () => {
    try {
      setSaving(true);
      await onConfirm?.({
        staff,
        date,
        type,
        notes: notes.trim(),
      });
      onClose?.();
    } catch {
      // parent shows toast
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>Person off / day off</DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5, pb: 2 }}>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Mark <strong>{titleName}</strong>
            {dateLabel ? ` on ${dateLabel}` : ''} as unavailable on the rota.
          </Typography>

          <TextField
            select
            fullWidth
            size="small"
            label="Type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            InputLabelProps={{ shrink: true }}
          >
            {PERSON_OFF_TYPES.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            size="small"
            label="Notes (optional)"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            multiline
            minRows={2}
            InputLabelProps={{ shrink: true }}
            placeholder="Reason or handover note"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" variant="outlined" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <AppButton onClick={handleConfirm} loading={saving}>
          Confirm
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
