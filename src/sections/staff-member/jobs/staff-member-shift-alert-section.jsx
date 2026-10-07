import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { parseJobShiftStart } from 'src/components/jobs/job-date-filters';
import { toast } from 'src/components/snackbar';

import {
  alertOffsetMinutes,
  clearShiftAlert,
  getShiftAlert,
  saveShiftAlert,
} from './staff-member-shift-alert-store';

// ----------------------------------------------------------------------

function defaultPhoneFromUser(user) {
  const basic = user?.basicInfo || {};
  const raw =
    basic.phoneNumber ||
    user?.phoneNumber ||
    basic.phone ||
    user?.phone ||
    '';
  if (typeof raw === 'string') return raw.trim();
  if (raw && typeof raw === 'object') {
    const code = String(raw.code || '').trim();
    const number = String(raw.number || '').trim();
    return `${code}${number}`.trim();
  }
  return '';
}

function scheduleBrowserReminder({ job, settings, shiftStart }) {
  if (!settings?.enabled || !shiftStart) return;

  const offsetMs = alertOffsetMinutes(settings) * 60 * 1000;
  const fireAt = shiftStart.getTime() - offsetMs;
  const delay = fireAt - Date.now();

  if (delay <= 0) {
    toast.info('Shift start time is too soon for this reminder on this device.');
    return;
  }

  if (typeof window === 'undefined' || !('Notification' in window)) return;

  const title = job?.title || 'Upcoming shift';
  const body = `Your shift starts at ${shiftStart.toLocaleString()}. Alert set for ${settings.alertPhone || 'your number'}.`;

  const showNotification = () => {
    try {
      // eslint-disable-next-line no-new
      new Notification(title, { body });
    } catch {
      // ignore
    }
  };

  if (Notification.permission === 'granted') {
    window.setTimeout(showNotification, delay);
    return;
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        window.setTimeout(showNotification, delay);
      }
    });
  }
}

export function StaffMemberShiftAlertSection({ job }) {
  const { user } = useSelector((state) => state.user);
  const profilePhone = useMemo(() => defaultPhoneFromUser(user), [user]);
  const [enabled, setEnabled] = useState(true);
  const [alertPhone, setAlertPhone] = useState('');
  const [alertHours, setAlertHours] = useState('1');
  const [alertMinutes, setAlertMinutes] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!job) return;
    const saved = getShiftAlert(job);
    if (saved) {
      setEnabled(saved.enabled !== false);
      setAlertPhone(saved.alertPhone || profilePhone);
      setAlertHours(String(saved.alertHours ?? 1));
      setAlertMinutes(String(saved.alertMinutes ?? 0));
      return;
    }
    setEnabled(true);
    setAlertPhone(profilePhone);
    setAlertHours('1');
    setAlertMinutes('0');
  }, [job, profilePhone]);

  const shiftStart = useMemo(
    () =>
      parseJobShiftStart({
        shiftDate: job?.shiftDate || job?.shiftRows?.[0]?.date,
        shiftStartTime: job?.shiftStartTime || job?.shiftRows?.[0]?.startTime,
      }),
    [job]
  );

  const handleSave = useCallback(async () => {
    if (!job) return;

    const phone = String(alertPhone || '').trim();
    const hours = Math.max(0, Number(alertHours) || 0);
    const minutes = Math.max(0, Number(alertMinutes) || 0);

    if (enabled && !phone) {
      toast.error('Enter an alert phone number.');
      return;
    }

    if (enabled && hours === 0 && minutes === 0) {
      toast.error('Set hours or minutes before the shift.');
      return;
    }

    setSaving(true);
    try {
      const saved = saveShiftAlert(job, {
        alertPhone: phone,
        alertHours: hours,
        alertMinutes: minutes,
        enabled,
      });

      if (enabled && saved) {
        scheduleBrowserReminder({ job, settings: saved, shiftStart });
      }

      toast.success(
        enabled
          ? 'Shift alert saved on this device. Backend SMS will apply once the API is live.'
          : 'Shift alert turned off.'
      );
    } finally {
      setSaving(false);
    }
  }, [alertHours, alertMinutes, alertPhone, enabled, job, shiftStart]);

  const handleClear = useCallback(() => {
    if (!job) return;
    clearShiftAlert(job);
    setEnabled(false);
    toast.success('Shift alert removed.');
  }, [job]);

  if (!job) return null;

  return (
    <Box>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Shift alert
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
        Get reminded before this shift starts. Saved on this device until the backend SMS API is
        connected.
      </Typography>

      <Stack spacing={1.5}>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
          }
          label="Enable alert for this shift"
        />

        <TextField
          fullWidth
          label="Alert phone number"
          value={alertPhone}
          onChange={(event) => setAlertPhone(event.target.value)}
          disabled={!enabled}
          placeholder="+44 7..."
          InputLabelProps={{ shrink: true }}
        />

        <Stack direction="row" spacing={1.5}>
          <TextField
            fullWidth
            type="number"
            label="Hours before"
            value={alertHours}
            onChange={(event) => setAlertHours(event.target.value)}
            disabled={!enabled}
            inputProps={{ min: 0, max: 72 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            type="number"
            label="Minutes before"
            value={alertMinutes}
            onChange={(event) => setAlertMinutes(event.target.value)}
            disabled={!enabled}
            inputProps={{ min: 0, max: 59 }}
            InputLabelProps={{ shrink: true }}
          />
        </Stack>

        {shiftStart ? (
          <Typography variant="caption" color="text.secondary">
            Shift starts: {shiftStart.toLocaleString()}
          </Typography>
        ) : (
          <Typography variant="caption" color="warning.main">
            Shift start time is missing — alert timing may be inaccurate until the API sends it.
          </Typography>
        )}

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <LoadingButton color="inherit" onClick={handleClear} disabled={saving}>
            Clear
          </LoadingButton>
          <LoadingButton variant="contained" onClick={handleSave} loading={saving}>
            Save alert
          </LoadingButton>
        </Stack>
      </Stack>
    </Box>
  );
}
