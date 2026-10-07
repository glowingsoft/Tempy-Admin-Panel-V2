import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { toast } from 'src/components/snackbar';

import {
  useGetAdminTermsConditionsQuery,
  useGetAdminTempToPermSettingsQuery,
  useUpdateAdminTempToPermSettingsMutation,
} from 'src/store/Reducer/dashboard-settings-api';

// ----------------------------------------------------------------------

/** Admin: shifts a worker must do for a care home before it can hire them. */
export function TempToPermSettings() {
  const { data: terms } = useGetAdminTermsConditionsQuery();
  const { data: settings } = useGetAdminTempToPermSettingsQuery();
  const [updateSettings, { isLoading }] = useUpdateAdminTempToPermSettingsMutation();

  const [minShifts, setMinShifts] = useState('');

  useEffect(() => {
    if (!settings) return;
    setMinShifts(String(settings.minShifts ?? ''));
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettings({
        id: terms?.id,
        minShifts: Number(minShifts) || 0,
      }).unwrap();
      toast.success('Temp to permanent settings saved');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not save the settings.');
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6">Temp to permanent</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          A care home can hire an agency worker or solo nurse permanently after this many shifts.
          It does not apply to home care company staff.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
          <TextField
            label="Minimum shifts"
            value={minShifts}
            onChange={(e) => setMinShifts(e.target.value)}
            inputProps={{ inputMode: 'numeric' }}
          />
          <LoadingButton
            variant="contained"
            loading={isLoading}
            disabled={!terms?.id}
            onClick={handleSave}
            sx={{ height: 54 }}
          >
            Save
          </LoadingButton>
        </Stack>
      </Card>
    </Box>
  );
}
