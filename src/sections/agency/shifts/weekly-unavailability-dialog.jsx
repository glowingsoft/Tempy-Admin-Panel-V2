import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import LoadingButton from '@mui/lab/LoadingButton';

import {
  DEFAULT_WEEKLY_UNAVAILABILITY_WEEKS,
  WEEKLY_UNAVAILABILITY_RULES,
  expandWeeklyUnavailabilitySlots,
} from './weekly-unavailability-utils';

const WEEK_OPTIONS = [4, 8, 12, 26];

export function WeeklyUnavailabilityDialog({
  open,
  onClose,
  onSubmit,
  submitting = false,
  staffName = '',
  defaultStartDate = '',
}) {
  const [ruleIds, setRuleIds] = useState([]);
  const [weeks, setWeeks] = useState(DEFAULT_WEEKLY_UNAVAILABILITY_WEEKS);
  const [startDate, setStartDate] = useState(defaultStartDate);

  useEffect(() => {
    if (!open) return;
    setRuleIds([]);
    setWeeks(DEFAULT_WEEKLY_UNAVAILABILITY_WEEKS);
    setStartDate(defaultStartDate || new Date().toISOString().slice(0, 10));
  }, [open, defaultStartDate]);

  const previewCount = useMemo(
    () => expandWeeklyUnavailabilitySlots({ ruleIds, startDate, weeks }).length,
    [ruleIds, startDate, weeks]
  );

  const toggleRule = (id) => {
    setRuleIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    const slots = expandWeeklyUnavailabilitySlots({ ruleIds, startDate, weeks });
    await onSubmit?.({ ruleIds, weeks, startDate, slots });
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Weekly unavailability</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Set blanket days or times when {staffName ? <strong>{staffName}</strong> : 'this person'}{' '}
            cannot work — for example Tuesdays, Wednesday mornings, or weekends.
          </Typography>

          <Box>
            {WEEKLY_UNAVAILABILITY_RULES.map((rule) => (
              <FormControlLabel
                key={rule.id}
                control={
                  <Checkbox
                    checked={ruleIds.includes(rule.id)}
                    onChange={() => toggleRule(rule.id)}
                    disabled={submitting}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {rule.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rule.helper}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', display: 'flex', width: 1, ml: 0, mb: 1 }}
              />
            ))}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Start from"
              type="date"
              size="small"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={submitting}
            />
            <TextField
              select
              label="Apply for"
              size="small"
              value={weeks}
              onChange={(event) => setWeeks(Number(event.target.value))}
              InputLabelProps={{ shrink: true }}
              fullWidth
              disabled={submitting}
            >
              {WEEK_OPTIONS.map((value) => (
                <MenuItem key={value} value={value}>
                  {value} weeks
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            {ruleIds.length
              ? `This will create ${previewCount} unavailable slot${previewCount === 1 ? '' : 's'} on the rota.`
              : 'Select at least one option.'}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button color="inherit" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          loading={submitting}
          disabled={!ruleIds.length || !startDate}
          onClick={handleSave}
        >
          Save weekly unavailability
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
