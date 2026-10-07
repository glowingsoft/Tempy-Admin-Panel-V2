import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { toast } from 'src/components/snackbar';

import { useGetAdminTempToPermSettingsQuery, useUpdateAdminTempToPermSettingsMutation } from 'src/store/Reducer/dashboard-settings-api';

// ----------------------------------------------------------------------

/** Settings document updated by PUT /admin/settings/update/:id */
const PLATFORM_SETTINGS_ID = '6a5f189636e21ab87ed3cf15';

function wholeNumber(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits === '' ? '' : String(Number(digits));
}

/** Admin-only rules: temp-to-perm shifts and the weekly hours cap. */
export function AdminPlatformRules() {
  const isAdmin = Number(useSelector((state) => state.user?.user?.permission)) === 1;
  const { data: settings } = useGetAdminTempToPermSettingsQuery(undefined, { skip: !isAdmin });
  const [updateSettings, { isLoading }] = useUpdateAdminTempToPermSettingsMutation();

  const [minShifts, setMinShifts] = useState('');
  const [weeklyHoursLimit, setWeeklyHoursLimit] = useState('');

  useEffect(() => {
    if (!settings) return;
    setMinShifts(settings.minShifts == null || settings.minShifts === '' ? '' : String(settings.minShifts));
    setWeeklyHoursLimit(settings.weeklyHoursLimit == null || settings.weeklyHoursLimit === '' ? '' : String(settings.weeklyHoursLimit));
  }, [settings]);

  if (!isAdmin) return null;

  const handleSave = async () => {
    const shifts = Number(minShifts);
    const hours = Number(weeklyHoursLimit);
    if (!Number.isFinite(shifts) || shifts < 0 || !Number.isFinite(hours) || hours < 0) {
      toast.error('Enter a minimum shift count and a weekly hours limit');
      return;
    }
    try {
      await updateSettings({
        id: settings?.id || PLATFORM_SETTINGS_ID,
        minShifts: shifts,
        weeklyHoursLimit: hours,
      }).unwrap();
      toast.success('Platform rules saved');
    } catch (err) {
      toast.error(err?.data?.message || 'Could not save the settings.');
    }
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Card sx={{ p: 3 }}>
        <Typography variant="h6">Platform rules</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Minimum shifts before a care home can hire an agency worker or solo nurse permanently, and the most hours a worker can be booked in a week. Home care company staff are not
          included in temp to permanent.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-start' }}>
          <TextField label="Minimum shifts" value={minShifts} onChange={(event) => setMinShifts(wholeNumber(event.target.value))} inputProps={{ inputMode: 'numeric' }} />
          <TextField
            label="Weekly hours limit"
            value={weeklyHoursLimit}
            onChange={(event) => setWeeklyHoursLimit(wholeNumber(event.target.value))}
            inputProps={{ inputMode: 'numeric' }}
          />
          <LoadingButton variant="contained" loading={isLoading} onClick={handleSave} sx={{ height: 54 }}>
            Save
          </LoadingButton>
        </Stack>
      </Card>
    </Box>
  );
}
