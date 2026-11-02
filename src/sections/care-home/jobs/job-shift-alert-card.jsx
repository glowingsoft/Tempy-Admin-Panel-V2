import { useMemo, useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { PhoneInput } from 'src/components/phone-input';
import { toast } from 'src/components/snackbar';

import { handleApiError, pickApiToastMessage } from 'src/store/handleApiError';
import {
  useClearUserJobAlertMutation,
  useUpdateUserJobAlertMutation,
} from 'src/store/Reducer/user-jobs-api';
import {
  useClearCareHomeJobAlertMutation,
  useUpdateCareHomeJobAlertMutation,
} from 'src/store/Reducer/care-home-jobs-api';
import {
  useClearHospitalJobAlertMutation,
  useUpdateHospitalJobAlertMutation,
} from 'src/store/Reducer/hospital-jobs-api';
import {
  useClearLocalAuthorityJobAlertMutation,
  useUpdateLocalAuthorityJobAlertMutation,
} from 'src/store/Reducer/local-authority-jobs-api';

import {
  JOB_ALERT_MAX_HOURS,
  JOB_ALERT_MAX_MINUTES,
  JOB_ALERT_DEFAULT_CODE,
  formatJobAlertLead,
  mapJobAlertFromApi,
  buildJobAlertPayload,
  validateJobAlertForm,
  splitStoredPhone,
  toPhoneInputValue,
} from './job-alert-utils';
import { useViewOnly } from 'src/hooks/use-view-only';


function toForm(alert) {
  return {
    enabled: alert.enabled,
    phoneNumber: {
      code: alert.phoneNumber.code || JOB_ALERT_DEFAULT_CODE,
      number: alert.phoneNumber.number,
    },
    hoursBefore: String(alert.hoursBefore),
    minutesBefore: String(alert.minutesBefore),
  };
}

function useJobAlertMutations(mode) {
  const careUpdate = useUpdateCareHomeJobAlertMutation();
  const careClear = useClearCareHomeJobAlertMutation();
  const hospitalUpdate = useUpdateHospitalJobAlertMutation();
  const hospitalClear = useClearHospitalJobAlertMutation();
  const authorityUpdate = useUpdateLocalAuthorityJobAlertMutation();
  const authorityClear = useClearLocalAuthorityJobAlertMutation();
  const userUpdate = useUpdateUserJobAlertMutation();
  const userClear = useClearUserJobAlertMutation();

  const byMode = {
    careHome: [careUpdate, careClear],
    hospital: [hospitalUpdate, hospitalClear],
    localAuthority: [authorityUpdate, authorityClear],
    user: [userUpdate, userClear],
  };
  const [[updateAlert, updateState], [clearAlert, clearState]] = byMode[mode] || byMode.careHome;

  return { updateAlert, clearAlert, saving: updateState.isLoading, clearing: clearState.isLoading };
}

export function JobShiftAlertCard({ mode, jobId, alert: rawAlert }) {
  const viewOnly = useViewOnly();
  const savedAlert = useMemo(() => mapJobAlertFromApi(rawAlert), [rawAlert]);
  const [form, setForm] = useState(() => toForm(savedAlert));
  const [errors, setErrors] = useState({});
  const { updateAlert, clearAlert, saving, clearing } = useJobAlertMutations(mode);

  useEffect(() => {
    setForm(toForm(savedAlert));
    setErrors({});
  }, [savedAlert]);

  const setField = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors({});
  }, []);

  const handlePhoneChange = useCallback((nextValue) => {
    const split = splitStoredPhone(nextValue);
    setForm((prev) => ({
      ...prev,
      phoneNumber: {
        code: nextValue ? split.code : prev.phoneNumber.code || JOB_ALERT_DEFAULT_CODE,
        number: nextValue ? split.number : '',
      },
    }));
    setErrors({});
  }, []);

  const handleSave = useCallback(async () => {
    const nextErrors = validateJobAlertForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const saved = await updateAlert({ id: jobId, ...buildJobAlertPayload(form) }).unwrap();
      setForm(toForm(saved));
      toast.success(
        pickApiToastMessage(saved, saved.enabled ? 'Shift alert saved' : 'Shift alert turned off')
      );
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not save shift alert');
    }
  }, [form, jobId, updateAlert]);

  const handleClear = useCallback(async () => {
    try {
      const cleared = await clearAlert(jobId).unwrap();
      setForm(toForm(cleared));
      setErrors({});
      toast.success(pickApiToastMessage(cleared, 'Shift alert cleared'));
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not clear shift alert');
    }
  }, [clearAlert, jobId]);

  const busy = saving || clearing || viewOnly;
  const hasSavedAlert =
    savedAlert.enabled ||
    Boolean(savedAlert.phoneNumber.number) ||
    savedAlert.hoursBefore > 0 ||
    savedAlert.minutesBefore > 0;
  const savedLead = formatJobAlertLead(savedAlert.hoursBefore, savedAlert.minutesBefore);

  return (
    <Card>
      <CardHeader
        title="Shift Alert"
        subheader={
          savedAlert.enabled && savedLead
            ? `On — alerts ${savedLead} before each shift starts`
            : 'Get notified a set time before each shift of this job starts'
        }
        action={
          <FormControlLabel
            label={form.enabled ? 'On' : 'Off'}
            labelPlacement="start"
            control={
              <Switch
                checked={form.enabled}
                onChange={(event) => setField('enabled', event.target.checked)}
                disabled={busy}
              />
            }
          />
        }
      />

      <Stack spacing={2.5} sx={{ p: 3 }}>
        <PhoneInput
          fullWidth
          label="Phone Number"
          country="GB"
          value={toPhoneInputValue(`${form.phoneNumber.code}${form.phoneNumber.number}`)}
          onChange={handlePhoneChange}
          placeholder="Enter phone number"
          error={Boolean(errors.phone)}
          helperText={errors.phone}
          disabled={busy}
        />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Alert me before shift</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              type="number"
              label="Hours"
              value={form.hoursBefore}
              onChange={(event) => setField('hoursBefore', event.target.value)}
              error={Boolean(errors.time)}
              disabled={busy}
              inputProps={{ min: 0, max: JOB_ALERT_MAX_HOURS, step: 1 }}
              sx={{ width: { sm: 160 } }}
            />
            <TextField
              type="number"
              label="Minutes"
              value={form.minutesBefore}
              onChange={(event) => setField('minutesBefore', event.target.value)}
              error={Boolean(errors.time)}
              disabled={busy}
              inputProps={{ min: 0, max: JOB_ALERT_MAX_MINUTES, step: 1 }}
              sx={{ width: { sm: 160 } }}
            />
          </Stack>
          {errors.time ? (
            <Typography variant="caption" color="error.main">
              {errors.time}
            </Typography>
          ) : null}
        </Stack>

        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="flex-end"
          sx={{ display: viewOnly ? 'none' : 'flex' }}
        >
          {hasSavedAlert ? (
            <LoadingButton color="inherit" variant="outlined" onClick={handleClear} loading={clearing} disabled={saving}>
              Clear
            </LoadingButton>
          ) : null}
          <LoadingButton variant="contained" onClick={handleSave} loading={saving} disabled={clearing}>
            Save
          </LoadingButton>
        </Stack>
      </Stack>
    </Card>
  );
}
