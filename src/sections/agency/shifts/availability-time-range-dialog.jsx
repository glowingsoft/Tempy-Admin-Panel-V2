import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ToggleButton from '@mui/material/ToggleButton';
import LoadingButton from '@mui/lab/LoadingButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

/** Part-day / night windows — day-off all-day is fine for day care, not night care. */
export const AVAILABILITY_TIME_PRESETS = [
  { id: 'all-day', label: 'All day', helper: 'Day care', startTime: '00:00', endTime: '23:59' },
  { id: 'morning', label: 'Morning', helper: '00:00 – 12:00', startTime: '00:00', endTime: '12:00' },
  {
    id: 'afternoon',
    label: 'Afternoon',
    helper: '12:00 – 18:00',
    startTime: '12:00',
    endTime: '18:00',
  },
  { id: 'evening', label: 'Evening', helper: '18:00 – 23:59', startTime: '18:00', endTime: '23:59' },
  {
    id: 'night',
    label: 'Night',
    helper: '22:00 – 07:00 (next day)',
    startTime: '22:00',
    endTime: '07:00',
  },
  { id: 'custom', label: 'Custom', helper: 'Pick times', startTime: '', endTime: '' },
];

const TITLE_BY_KIND = {
  busy: 'Mark busy',
  'day-off': 'Schedule day / night off',
  'add-leave': 'Add leave',
};

function normalizeTime(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return '';
  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

export function AvailabilityTimeRangeDialog({
  open,
  onClose,
  onSubmit,
  submitting = false,
  kind = 'busy',
  staffName = '',
  dateLabel = '',
  defaultPresetId,
}) {
  const initialPreset =
    defaultPresetId ||
    (kind === 'busy' ? 'morning' : kind === 'add-leave' ? 'afternoon' : 'all-day');

  const [presetId, setPresetId] = useState(initialPreset);
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('12:00');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    const preset =
      AVAILABILITY_TIME_PRESETS.find((item) => item.id === initialPreset) ||
      AVAILABILITY_TIME_PRESETS[0];
    setPresetId(preset.id);
    setStartTime(preset.startTime || (kind === 'add-leave' ? '09:00' : '00:00'));
    setEndTime(preset.endTime || (kind === 'add-leave' ? '18:00' : '23:59'));
    setNote('');
  }, [open, initialPreset, kind]);

  const activePreset = useMemo(
    () => AVAILABILITY_TIME_PRESETS.find((item) => item.id === presetId),
    [presetId]
  );

  const handlePreset = (_, next) => {
    if (!next) return;
    setPresetId(next);
    const preset = AVAILABILITY_TIME_PRESETS.find((item) => item.id === next);
    if (!preset || next === 'custom') return;
    setStartTime(preset.startTime);
    setEndTime(preset.endTime);
  };

  const resolvedStart = normalizeTime(startTime);
  const resolvedEnd = normalizeTime(endTime);
  const canSave = Boolean(resolvedStart && resolvedEnd);

  const handleSave = async () => {
    if (!canSave) return;
    await onSubmit?.({
      kind,
      presetId,
      startTime: resolvedStart,
      endTime: resolvedEnd,
      overnight: resolvedEnd <= resolvedStart,
      note: String(note || '').trim(),
    });
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{TITLE_BY_KIND[kind] || 'Availability'}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            {staffName ? (
              <>
                Choose when <strong>{staffName}</strong> is unavailable
                {dateLabel ? ` on ${dateLabel}` : ''}. Use a part of the day (e.g. morning busy,
                afternoon free), or Night for night care — all-day is for day care only.
              </>
            ) : (
              <>
                Choose a time window. Part-day busy leaves the rest of the day free; Night covers
                overnight care.
              </>
            )}
          </Typography>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={presetId}
            onChange={handlePreset}
            disabled={submitting}
            sx={{ flexWrap: 'wrap', gap: 1 }}
          >
            {AVAILABILITY_TIME_PRESETS.map((preset) => (
              <ToggleButton
                key={preset.id}
                value={preset.id}
                sx={{ textTransform: 'none', px: 1.25, py: 0.75, borderRadius: 1 }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="body2" fontWeight={600}>
                    {preset.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {preset.helper}
                  </Typography>
                </Box>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="From"
              type="time"
              size="small"
              value={resolvedStart || ''}
              onChange={(event) => {
                setPresetId('custom');
                setStartTime(event.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={submitting}
            />
            <TextField
              label="To"
              type="time"
              size="small"
              value={resolvedEnd || ''}
              onChange={(event) => {
                setPresetId('custom');
                setEndTime(event.target.value);
              }}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={submitting}
              helperText={
                resolvedStart && resolvedEnd && resolvedEnd <= resolvedStart
                  ? 'Ends next day (overnight / night care)'
                  : activePreset?.id === 'all-day'
                    ? 'Blocks the whole calendar day'
                    : ' '
              }
            />
          </Stack>

          <TextField
            label="Note"
            placeholder={
              kind === 'busy'
                ? 'Where are they working / what are they busy with?'
                : 'Optional note for this tile'
            }
            value={note}
            onChange={(event) => setNote(event.target.value)}
            fullWidth
            size="small"
            multiline
            minRows={2}
            disabled={submitting}
            helperText={
              kind === 'busy'
                ? 'Type the real place or reason — that text shows on the Busy tile'
                : 'Shows on the rota tile'
            }
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
