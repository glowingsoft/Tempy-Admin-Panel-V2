import { useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { DesktopTimePicker } from '@mui/x-date-pickers/DesktopTimePicker';
import { renderTimeViewClock } from '@mui/x-date-pickers/timeViewRenderers';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { AppButton } from 'src/components/app-button';
import { JobImageUpload } from 'src/components/jobs/job-image';

import {
  useCreateCareHomeBranchMutation,
  useGetCareHomeBranchesQuery,
} from 'src/store/Reducer/care-home-branches-api';
import {
  useCreateHospitalBranchMutation,
  useGetHospitalBranchesQuery,
} from 'src/store/Reducer/hospital-branches-api';
import {
  useCreateLocalAuthorityBranchMutation,
  useGetLocalAuthorityBranchesQuery,
} from 'src/store/Reducer/local-authority-branches-api';
import {
  useCreateHomeCareCompanyBranchMutation,
  useGetHomeCareCompanyBranchesQuery,
} from 'src/store/Reducer/home-care-company-branches-api';
import {
  useCreateUserBranchMutation,
  useUserAddressesQuery,
} from 'src/store/Reducer/user-branches-api';

import { mapAgencyBranchFromApi, getAgencyBranchLocationLabel } from 'src/sections/branches/agency-branch-utils';
import { BranchFormDialog, buildAgencyBranchPayload } from 'src/sections/branches/branch-form-dialog';
import { buildUserAddressPayload, mapUserAddressFromApi } from 'src/sections/branches/user-address-utils';
import { useRoleJobTypes } from 'src/sections/job-roles/use-role-job-types';

import {
  GENDER_OPTIONS,
  createDefaultSchedule,
  findBestJobTypeOption,
  getMinJobScheduleDate,
  getScheduleBreakError,
  getScheduleDurationMinutes,
  isPastJobScheduleDate,
  jobTypeMatchesAnyTeam,
} from './care-home-job-utils';
import { getCareHomeAgencyPartners } from './agency-job-request';

const OUTLINED_LABEL_SX = {
  px: 0.5,
  bgcolor: 'background.paper',
  maxWidth: 'calc(100% - 24px)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '&.MuiInputLabel-shrink': {
    transform: 'translate(14px, -9px) scale(0.75)',
  },
};

function formatBranchAddress(branch) {
  if (!branch) return '';
  const address = getAgencyBranchLocationLabel(branch);
  const label = branch.name || branch.branchName || '';
  if (address && address !== '—' && label && address !== label) {
    return `${label} — ${address}`;
  }
  return address !== '—' ? address : label;
}

function createdLocationFromResponse(result, { userMode = false } = {}) {
  const raw = result?.data ?? result;
  const item = Array.isArray(raw) ? raw[0] : raw;
  if (!item || typeof item !== 'object') return null;
  return userMode ? mapUserAddressFromApi(item) : mapAgencyBranchFromApi(item);
}

function isActiveBranch(branch) {
  if (!branch) return false;
  const status = String(branch.status || 'active').toLowerCase();
  if (status === 'deleted' || status === 'delete' || status === 'inactive') return false;
  return true;
}

const CLOCK_TIME_VIEWS = {
  hours: renderTimeViewClock,
  minutes: renderTimeViewClock,
};

function hhmmToDayjs(hhmm) {
  if (!hhmm) return null;
  const value = dayjs(`2000-01-01T${hhmm}`);
  return value.isValid() ? value : null;
}

function JobScheduleTimeField({ label, value, onChange, disabled, error, helperText, minTime }) {
  const minValue = hhmmToDayjs(minTime);

  return (
    <DesktopTimePicker
      ampm
      label={label}
      value={hhmmToDayjs(value)}
      minutesStep={1}
      views={['hours', 'minutes']}
      viewRenderers={CLOCK_TIME_VIEWS}
      format="hh:mm A"
      disabled={disabled}
      minTime={minValue || undefined}
      onChange={(next) => {
        if (!next || !dayjs(next).isValid()) return;
        onChange(dayjs(next).format('HH:mm'));
      }}
      slotProps={{
        textField: {
          size: 'small',
          fullWidth: true,
          error,
          helperText,
          InputLabelProps: { shrink: true },
          sx: {
            '& .MuiInputBase-root': { bgcolor: 'background.paper' },
          },
        },
        popper: {
          sx: { zIndex: 1600 },
        },
      }}
    />
  );
}

export function JobSchedulesEditor({ schedules, onChange, lockTimes = false }) {
  const minScheduleDate = useMemo(() => getMinJobScheduleDate(), []);

  const handleScheduleChange = (scheduleId, field, value) => {
    onChange(
      schedules.map((entry) => {
        if (entry.id !== scheduleId) return entry;
        const next = { ...entry, [field]: value };

        if (
          (field === 'startTime' || field === 'endTime') &&
          next.startTime &&
          next.endTime &&
          next.endTime < next.startTime
        ) {
          next.endTime = next.startTime;
        }

        return next;
      })
    );
  };

  const handleAddSchedule = () => {
    onChange([...schedules, createDefaultSchedule()]);
  };

  const handleRemoveSchedule = (scheduleId) => {
    if (schedules.length <= 1) return;
    onChange(schedules.filter((entry) => entry.id !== scheduleId));
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" fontWeight={600} sx={{ px: 0.25 }}>
        Date & Time
      </Typography>

      {schedules.map((entry, index) => {
        const endBeforeStart = Boolean(
          entry.startTime && entry.endTime && entry.endTime < entry.startTime
        );
        const breakError = getScheduleBreakError(entry);
        const shiftMinutes = getScheduleDurationMinutes(entry.startTime, entry.endTime);

        return (
          <Box
            key={entry.id}
            sx={{
              px: { xs: 1.5, sm: 2 },
              pt: 2.25,
              pb: 1.75,
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              bgcolor: 'background.neutral',
              overflow: 'visible',
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1.75, minHeight: 28 }}
            >
              <Typography variant="caption" fontWeight={700} color="text.secondary">
                Shift {index + 1}
              </Typography>
              {schedules.length > 1 && !lockTimes && (
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleRemoveSchedule(entry.id)}
                  sx={{ p: 0.5, mr: -0.5 }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                </IconButton>
              )}
            </Stack>

            <Stack spacing={2.25}>
              <TextField
                fullWidth
                size="small"
                label="Date"
                type="date"
                value={entry.date}
                onChange={(e) => handleScheduleChange(entry.id, 'date', e.target.value)}
                disabled={lockTimes}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: minScheduleDate }}
                error={Boolean(!lockTimes && entry.date && isPastJobScheduleDate(entry.date))}
                helperText={
                  !lockTimes && entry.date && isPastJobScheduleDate(entry.date)
                    ? 'Date cannot be in the past'
                    : undefined
                }
                sx={{
                  '& .MuiInputBase-root': { bgcolor: 'background.paper' },
                  '& .MuiInputLabel-root': { maxWidth: 'calc(100% - 28px)' },
                }}
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <JobScheduleTimeField
                    label="Start Time"
                    value={entry.startTime}
                    disabled={lockTimes}
                    onChange={(next) => handleScheduleChange(entry.id, 'startTime', next)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <JobScheduleTimeField
                    label="End Time"
                    value={entry.endTime}
                    disabled={lockTimes}
                    minTime={entry.startTime}
                    error={endBeforeStart}
                    helperText={
                      endBeforeStart ? 'End time cannot be earlier than start time' : undefined
                    }
                    onChange={(next) => handleScheduleChange(entry.id, 'endTime', next)}
                  />
                </Grid>
              </Grid>

              <Stack
                spacing={1.5}
                sx={{
                  pt: 1.5,
                  mt: 0.25,
                  borderTop: (theme) => `1px dashed ${theme.vars.palette.divider}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minHeight: 36 }}>
                  <Switch
                    checked={entry.breakIncluded !== false}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onChange(
                        schedules.map((schedule) =>
                          schedule.id === entry.id
                            ? {
                              ...schedule,
                              breakIncluded: checked,
                              breakMins: checked ? schedule.breakMins || 30 : 0,
                            }
                            : schedule
                        )
                      );
                    }}
                    color="primary"
                    size="small"
                  />
                  <Typography variant="body2" color="text.secondary">
                    Break Included
                  </Typography>
                </Stack>

                {entry.breakIncluded !== false && (
                  <TextField
                    fullWidth
                    size="small"
                    label="Break Mins"
                    type="number"
                    value={entry.breakMins ?? 30}
                    onChange={(e) =>
                      handleScheduleChange(entry.id, 'breakMins', Number(e.target.value))
                    }
                    error={Boolean(breakError)}
                    helperText={breakError || undefined}
                    inputProps={{
                      min: 0,
                      step: 5,
                      max: shiftMinutes != null ? shiftMinutes : undefined,
                    }}
                    sx={{ '& .MuiInputBase-root': { bgcolor: 'background.paper' } }}
                  />
                )}
              </Stack>
            </Stack>
          </Box>
        );
      })}

      {!lockTimes && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 0.5 }}>
          <AppButton
            size="small"
            startIcon={<Iconify icon="eva:plus-fill" width={14} />}
            onClick={handleAddSchedule}
            sx={{
              minHeight: 32,
              px: 1.5,
              py: 0.5,
              typography: 'caption',
              fontWeight: 600,
            }}
          >
            Add Shift
          </AppButton>
        </Stack>
      )}
    </Stack>
  );
}

export function JobDraftForm({
  draft,
  onChange,
  onSchedulesChange,
  mode = 'careHome',
  calendarTeamLabels = null,
  typeFieldLabel = 'Type',
}) {
  const isHospital = mode === 'hospital';
  const isUser = mode === 'user';
  const isLocalAuthority = mode === 'localAuthority';
  const isHomeCareCompany = mode === 'homeCareCompany';
  const skipCareHome = isHospital || isUser || isLocalAuthority || isHomeCareCompany;
  const didAutoSelectTypeRef = useRef(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [createCareHomeBranch, { isLoading: creatingCareHomeBranch }] = useCreateCareHomeBranchMutation();
  const [createHospitalBranch, { isLoading: creatingHospitalBranch }] = useCreateHospitalBranchMutation();
  const [createLocalAuthorityBranch, { isLoading: creatingLocalAuthorityBranch }] =
    useCreateLocalAuthorityBranchMutation();
  const [createHomeCareCompanyBranch, { isLoading: creatingHomeCareCompanyBranch }] =
    useCreateHomeCareCompanyBranchMutation();
  const [createUserBranch, { isLoading: creatingUserBranch }] = useCreateUserBranchMutation();
  const creatingLocation =
    creatingCareHomeBranch ||
    creatingHospitalBranch ||
    creatingLocalAuthorityBranch ||
    creatingHomeCareCompanyBranch ||
    creatingUserBranch;

  const {
    data: typesList,
    isLoading: typesLoading,
    isError: typesError,
  } = useRoleJobTypes(mode);

  const branchListArgs = useMemo(() => ({ page: 0, limit: 100, status: '' }), []);
  const branchQueryOptions = useMemo(
    () => ({ refetchOnMountOrArgChange: true }),
    []
  );

  const careBranchesQuery = useGetCareHomeBranchesQuery(branchListArgs, {
    skip: skipCareHome,
    ...branchQueryOptions,
  });
  const hospitalBranchesQuery = useGetHospitalBranchesQuery(branchListArgs, {
    skip: !isHospital,
    ...branchQueryOptions,
  });
  const localAuthorityBranchesQuery = useGetLocalAuthorityBranchesQuery(branchListArgs, {
    skip: !isLocalAuthority,
    ...branchQueryOptions,
  });
  const homeCareCompanyBranchesQuery = useGetHomeCareCompanyBranchesQuery(branchListArgs, {
    skip: !isHomeCareCompany,
    ...branchQueryOptions,
  });
  const userBranchesQuery = useUserAddressesQuery(branchListArgs, {
    skip: !isUser,
    ...branchQueryOptions,
  });
  const branchesQuery = isUser
    ? userBranchesQuery
    : isLocalAuthority
      ? localAuthorityBranchesQuery
      : isHospital
        ? hospitalBranchesQuery
        : isHomeCareCompany
          ? homeCareCompanyBranchesQuery
          : careBranchesQuery;
  const branchesData = branchesQuery?.data;
  const branchesLoading = Boolean(branchesQuery?.isLoading);
  const branchesError = Boolean(branchesQuery?.isError);

  const teamLabels = useMemo(
    () =>
      Array.isArray(calendarTeamLabels)
        ? calendarTeamLabels.map((label) => String(label || '').trim()).filter(Boolean)
        : null,
    [calendarTeamLabels]
  );

  const allJobTypes = useMemo(
    () => typesList.filter((item) => item.status === 'active' || !item.status),
    [typesList]
  );
  const jobTypes = useMemo(() => {
    if (!teamLabels?.length) return allJobTypes;
    return allJobTypes.filter((opt) =>
      jobTypeMatchesAnyTeam(opt?.title || opt?.name || '', teamLabels)
    );
  }, [allJobTypes, teamLabels]);

  const apiBranches = useMemo(
    () => (branchesData?.data || []).filter(isActiveBranch),
    [branchesData]
  );

  // API only — never fall back to local demo branches (Head Office / North Branch).
  const branches = apiBranches;

  const agencyPartners = getCareHomeAgencyPartners();
  const locationLabel = 'Location';

  // Edit only: the API says whether the rate and shift times can still change.
  const rateAndTimesLocked = Boolean(draft.id) && draft.canEditRateAndShiftTimes === false;

  const selectedTypeId = draft.typeId || '';
  const typeSelectValue = jobTypes.some((opt) => String(opt.id) === String(selectedTypeId))
    ? selectedTypeId
    : '';
  const selectedBranchId = draft.branchId || '';
  const branchSelectValue = branches.some((item) => String(item.id) === String(selectedBranchId))
    ? selectedBranchId
    : '';

  useEffect(() => {
    if (!draft.typeId) {
      didAutoSelectTypeRef.current = false;
    }
  }, [draft.typeId]);

  useEffect(() => {
    if (didAutoSelectTypeRef.current || typesLoading || !allJobTypes.length) return;
    if (draft.typeId) {
      didAutoSelectTypeRef.current = true;
      return;
    }

    const preferred = String(draft.type || draft.typeTitle || '').trim();
    const pool = jobTypes.length ? jobTypes : allJobTypes;
    if (!preferred) return;

    const best = findBestJobTypeOption(preferred, pool, teamLabels);
    if (!best?.id) return;

    didAutoSelectTypeRef.current = true;
    if (typeof onChange === 'function') {
      onChange({
        typeId: best.id,
        type: best.title || best.name || preferred,
        typeTitle: best.title || best.name || preferred,
      });
    }
  }, [
    allJobTypes,
    draft.type,
    draft.typeId,
    draft.typeTitle,
    jobTypes,
    onChange,
    teamLabels,
    typesLoading,
  ]);

  const handleFieldChange = (field, value) => {
    if (typeof onChange === 'function') {
      if (field && typeof field === 'object' && value === undefined) {
        onChange(field);
        return;
      }
      onChange(field, value);
    }
  };

  const handleAddLocation = async (data) => {
    const payload = isUser ? buildUserAddressPayload(data) : buildAgencyBranchPayload(data);

    try {
      let result;
      if (isUser) {
        result = await createUserBranch(payload).unwrap();
      } else if (isHospital) {
        result = await createHospitalBranch(payload).unwrap();
      } else if (isLocalAuthority) {
        result = await createLocalAuthorityBranch(payload).unwrap();
      } else if (isHomeCareCompany) {
        result = await createHomeCareCompanyBranch(payload).unwrap();
      } else {
        result = await createCareHomeBranch(payload).unwrap();
      }

      const refreshed = await branchesQuery.refetch();
      const list = refreshed?.data?.data || [];
      const created = createdLocationFromResponse(result, { userMode: isUser });
      const createdName = String(data?.name || '').trim();
      const branch =
        list.find((item) => created?.id && String(item.id) === String(created.id)) ||
        list.find((item) => createdName && String(item.name || item.branchName || '').trim() === createdName) ||
        created;

      if (branch?.id) {
        handleFieldChange({
          branchId: branch.id,
          address: formatBranchAddress(branch),
          location: branch.location || null,
        });
      }

      toast.success('Location added');
    } catch (error) {
      toast.error(error?.data?.message || error?.error || 'Failed to add location');
      throw error;
    }
  };

  return (
    <>
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            size="small"
            label="Job name"
            value={draft.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            placeholder="e.g. Night shift RN"
          />

          <FormControl fullWidth size="small" error={typesError} sx={{ overflow: 'visible' }}>
            <InputLabel id="job-draft-type-label" shrink sx={OUTLINED_LABEL_SX}>
              {typeFieldLabel}
            </InputLabel>
            <Select
              labelId="job-draft-type-label"
              value={typeSelectValue}
              label={typeFieldLabel}
              notched
              displayEmpty
              onChange={(e) => {
                const nextId = e.target.value;
                const selected = jobTypes.find((item) => item.id === nextId);
                handleFieldChange({
                  typeId: nextId,
                  type: selected?.title || '',
                  typeTitle: selected?.title || '',
                });
              }}
              MenuProps={{
                disablePortal: false,
                anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                transformOrigin: { vertical: 'top', horizontal: 'left' },
                PaperProps: { sx: { maxHeight: 280, zIndex: (theme) => theme.zIndex.modal + 2 } },
              }}
              disabled={typesLoading}
              endAdornment={
                typesLoading ? (
                  <CircularProgress color="inherit" size={16} sx={{ mr: 2 }} />
                ) : null
              }
            >
              <MenuItem value="" disabled>
                <em>Select {typeFieldLabel.toLowerCase()}</em>
              </MenuItem>
              {jobTypes.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {opt.title}
                    </Typography>
                    {opt.department ? (
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {opt.department}
                      </Typography>
                    ) : null}
                  </Box>
                </MenuItem>
              ))}
            </Select>
            {typesError && (
              <FormHelperText>Could not load job types. Please retry.</FormHelperText>
            )}
            {!typesLoading && !typesError && !jobTypes.length && (
              <FormHelperText>
                {teamLabels?.length
                  ? 'No roles match this site. Add a matching job type, or post from Add Job.'
                  : 'No active job types found.'}
              </FormHelperText>
            )}
            {!typesLoading && !typesError && jobTypes.length > 0 && teamLabels?.length ? (
              <FormHelperText>Roles for this site</FormHelperText>
            ) : null}
          </FormControl>

          <FormControl fullWidth size="small" required error={branchesError} sx={{ overflow: 'visible' }}>
            <InputLabel id="job-draft-branch-label" shrink sx={OUTLINED_LABEL_SX}>
              {locationLabel}
            </InputLabel>
            <Select
              labelId="job-draft-branch-label"
              value={branchSelectValue}
              label={locationLabel}
              notched
              displayEmpty
              open={locationMenuOpen}
              onOpen={() => setLocationMenuOpen(true)}
              onClose={() => setLocationMenuOpen(false)}
              onChange={(e) => {
                const nextId = e.target.value;
                if (!nextId) {
                  handleFieldChange({ branchId: '', address: '', location: null });
                  return;
                }
                const branch =
                  branches.find((item) => String(item.id) === String(nextId)) ||
                  branches.find((item) => String(item._id) === String(nextId));
                handleFieldChange({
                  branchId: nextId,
                  address: formatBranchAddress(branch),
                  location: branch?.location || null,
                });
              }}
              MenuProps={{
                disablePortal: false,
                anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                transformOrigin: { vertical: 'top', horizontal: 'left' },
                PaperProps: {
                  sx: { maxHeight: 320, maxWidth: 420, zIndex: (theme) => theme.zIndex.modal + 2 },
                },
              }}
              disabled={branchesLoading}
              endAdornment={
                branchesLoading ? (
                  <CircularProgress color="inherit" size={16} sx={{ mr: 2 }} />
                ) : null
              }
            >
              <MenuItem value="" sx={{ display: 'none' }}>
                Select location
              </MenuItem>
              <Box
                sx={{ px: 1, py: 1 }}
                onMouseDown={(event) => event.preventDefault()}
              >
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="mingcute:add-line" width={16} />}
                  onClick={() => {
                    setLocationMenuOpen(false);
                    setAddLocationOpen(true);
                  }}
                >
                  Add location
                </Button>
              </Box>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0, width: 1 }}>
                    <Iconify
                      icon="solar:map-point-bold"
                      width={18}
                      sx={{ color: 'text.secondary', flexShrink: 0 }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" noWrap fontWeight={600}>
                        {branch.name || branch.branchName || 'Location'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap display="block">
                        {getAgencyBranchLocationLabel(branch)}
                      </Typography>
                    </Box>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
            {branchesError && (
              <FormHelperText>
                Could not load locations. Please retry.
              </FormHelperText>
            )}
            {!branchesLoading && !branchesError && !branches.length && (
              <FormHelperText>
                No locations found — add them under Locations on your dashboard first.
              </FormHelperText>
            )}
          </FormControl>

          <TextField
            fullWidth
            size="small"
            required={!draft.id}
            label={draft.id ? 'Rate per hour' : 'Rate per hour (required)'}
            type="number"
            value={draft.hourlyRate ?? ''}
            onChange={(e) => handleFieldChange('hourlyRate', e.target.value)}
            disabled={rateAndTimesLocked}
            InputLabelProps={{ shrink: true }}
            InputProps={{ startAdornment: <InputAdornment position="start">£</InputAdornment> }}
            inputProps={{ min: 0.01, step: 0.01 }}
            helperText={
              rateAndTimesLocked
                ? undefined
                : draft.id
                  ? 'Suppliers can sort jobs by rate.'
                  : 'Required. Suppliers can sort jobs by this rate.'
            }
          />

          {rateAndTimesLocked && (
            <Alert severity="info">
              The rate and shift dates and times can&apos;t be changed once a job has bids or a
              booked shift. You can still edit everything else.
            </Alert>
          )}

          <JobSchedulesEditor
            schedules={draft.schedules}
            onChange={onSchedulesChange}
            lockTimes={rateAndTimesLocked}
          />
        </Stack>
      </Grid>

      <Grid item xs={12} md={6}>
        <Stack spacing={2.5}>
          <JobImageUpload
            required={!draft.id}
            value={draft.image || ''}
            onChange={(value) => handleFieldChange('image', value)}
          />

          {(draft.agencyName || draft.agencyId) && (
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                bgcolor: 'background.neutral',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Agency
              </Typography>
              <Typography variant="subtitle2" fontWeight={700}>
                {draft.agencyName ||
                  agencyPartners.find((partner) => partner.id === draft.agencyId)?.name ||
                  'Partner agency'}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            multiline
            rows={5}
            size="small"
            label="Description/Notes (optional)"
            value={draft.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              overflow: 'visible',
              '& .MuiInputLabel-root': OUTLINED_LABEL_SX,
            }}
          />

          <FormControl fullWidth size="small" sx={{ overflow: 'visible' }}>
            <InputLabel id="job-draft-gender-label" shrink sx={OUTLINED_LABEL_SX}>
              Gender (Dependent/Care recipient)
            </InputLabel>
            <Select
              labelId="job-draft-gender-label"
              value={draft.gender || ''}
              label="Gender (Dependent/Care recipient)"
              displayEmpty
              notched
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              MenuProps={{
                disablePortal: false,
                anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                transformOrigin: { vertical: 'top', horizontal: 'left' },
                marginThreshold: 8,
                PaperProps: {
                  sx: {
                    maxHeight: 280,
                    zIndex: (theme) => theme.zIndex.modal + 2,
                  },
                },
              }}
            >
              <MenuItem value="" disabled>
                <em>Select gender</em>
              </MenuItem>
              {GENDER_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Grid>
    </Grid>

    <BranchFormDialog
      open={addLocationOpen}
      onClose={() => setAddLocationOpen(false)}
      currentBranch={null}
      onSubmit={handleAddLocation}
      submitting={creatingLocation}
      entityLabel="Location"
      addressOnly={isUser}
      showComplianceFields={isHomeCareCompany}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 5 }}
    />
    </>
  );
}
