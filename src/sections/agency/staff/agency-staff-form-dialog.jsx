import { z as zod } from 'zod';
import { useMemo, useEffect, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';

import { STAFF_GENDER_OPTIONS, STAFF_SPECIALTY_API_OPTIONS } from 'src/_mock/_staff';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { StaffDocumentUploadRow } from 'src/sections/staff/staff-document-upload-row';
import { SupplierStaffStatusField } from 'src/sections/staff/supplier-staff-status-field';
import { getAgencyBranchLocationLabel } from 'src/sections/branches/agency-branch-utils';
import { ensureFormAddressCoordinates } from 'src/sections/branches/address-form-utils';

import { useGetAgencyBranchesQuery } from 'src/store/Reducer/agency-branches-api';
import { useGetAgencyStaffNursesQuery } from 'src/store/Reducer/agency-staff-api';

import {
  buildAgencyStaffPayload,
  buildAgencyStaffUpdatePayload,
  isNurseAccountUserType,
  isValidFlexiblePhone,
  staffFormHasValidCoordinates,
} from './agency-staff-api-utils';

function buildLocationSearchLabel(member = {}) {
  const parts = [member.city, member.state, member.country].filter(Boolean);
  return parts.join(', ');
}

const FIELD_LABELS = {
  name: 'Name',
  email: 'Email',
  phoneNumber: 'Phone Number',
  password: 'Password',
  gender: 'Gender',
  fullAddress: 'Full address',
  locationSearch: 'Location',
  taxNumber: 'Tax Number',
  branch: 'Location',
  specialty: 'Specialty',
  ratePerHour: 'Rate per hour',
  platformPercent: 'Platform percent',
  status: 'Status',
  dob: 'Date of birth',
};

function asTrimmedString(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object') {
    return String(value.fullAddress || value.label || value.name || value.number || '').trim();
  }
  return String(value).trim();
}

function getValidationMessages(errors = {}) {
  return Object.entries(errors)
    .filter(([, value]) => value?.message)
    .map(([key, value]) => {
      const label = FIELD_LABELS[key] || key;
      return `${label}: ${value.message}`;
    });
}

function showValidationToast(errors) {
  const messages = getValidationMessages(errors);
  if (!messages.length) {
    toast.error('Please fill all required fields.');
    return;
  }
  toast.error(messages.slice(0, 4).join(' · '));
}

function normalizeSpecialities(value) {
  return (Array.isArray(value) ? value : [value])
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

const AgencyStaffFormSchema = zod
  .object({
    staffMode: zod.enum(['existing', 'new', 'edit']),
    name: zod.string().optional(),
    email: zod.string().optional(),
    phoneNumber: zod.string().optional(),
    password: zod.string().optional(),
    dob: zod.string().optional(),
    gender: zod.string().optional(),
    location: zod.preprocess(asTrimmedString, zod.string().optional()),
    fullAddress: zod.preprocess(asTrimmedString, zod.string().optional()),
    locationSearch: zod.preprocess(asTrimmedString, zod.string().optional()),
    city: zod.string().optional(),
    state: zod.string().optional(),
    country: zod.string().optional(),
    postalCode: zod.string().optional(),
    longitude: zod.preprocess(
      (value) => (value === '' || value == null ? 0 : value),
      zod.coerce.number().optional()
    ),
    latitude: zod.preprocess(
      (value) => (value === '' || value == null ? 0 : value),
      zod.coerce.number().optional()
    ),
    taxNumber: zod.preprocess(asTrimmedString, zod.string().optional()),
    branch: zod.string().min(1, { message: 'Location is required' }),
    specialty: zod.array(zod.string()).min(1, { message: 'Select at least one specialty' }),
    ratePerHour: zod.coerce.number().min(0, { message: 'Rate per hour must be 0 or more' }),
    platformPercent: zod.coerce
      .number()
      .min(0, { message: 'Platform percent must be 0 or more' })
      .max(100, { message: 'Platform percent cannot exceed 100' }),
    status: zod
      .string()
      .optional()
      .refine(
        (value) =>
          !value || ['active', 'inactive', 'pending', 'deleted', 'left'].includes(value),
        {
          message: 'Select a valid status',
        }
      ),
    avatarUrl: zod.any().optional(),
    governmentId: zod.array(zod.any()).default([]),
    nursingDegree: zod.array(zod.any()).default([]),
    certifications: zod.array(zod.any()).default([]),
  })
  .superRefine((data, ctx) => {
    // Existing pick / Edit: agency fields only (branch, specialty, rates, status).
    // Do not require phone/tax/address again — status-only updates must succeed (QA).
    if (data.staffMode === 'existing' || data.staffMode === 'edit') {
      const phone = asTrimmedString(data.phoneNumber);
      if (phone && !isValidFlexiblePhone(phone)) {
        ctx.addIssue({
          code: 'custom',
          message: 'Use 03004785384 or +923004785384',
          path: ['phoneNumber'],
        });
      }
      return;
    }

    const name = asTrimmedString(data.name);
    const email = asTrimmedString(data.email);
    const phone = asTrimmedString(data.phoneNumber);
    const password = asTrimmedString(data.password);
    const gender = asTrimmedString(data.gender);
    const fullAddress = asTrimmedString(data.fullAddress || data.location);
    const locationSearch = asTrimmedString(data.locationSearch);
    const taxNumber = asTrimmedString(data.taxNumber);

    if (!name) {
      ctx.addIssue({ code: 'custom', message: 'Required', path: ['name'] });
    }
    if (!email) {
      ctx.addIssue({ code: 'custom', message: 'Required', path: ['email'] });
    } else if (!zod.string().email().safeParse(email).success) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid email', path: ['email'] });
    }
    if (!phone) {
      ctx.addIssue({ code: 'custom', message: 'Required', path: ['phoneNumber'] });
    } else if (!isValidFlexiblePhone(phone)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Use 03004785384 or +923004785384',
        path: ['phoneNumber'],
      });
    }
    // Password only when creating a brand-new staff login
    if (data.staffMode === 'new') {
      if (!password) {
        ctx.addIssue({ code: 'custom', message: 'Required', path: ['password'] });
      } else if (password.length < 6) {
        ctx.addIssue({ code: 'custom', message: 'Min 6 characters', path: ['password'] });
      }
    }
    if (!gender) {
      ctx.addIssue({ code: 'custom', message: 'Required', path: ['gender'] });
    }
    if (!fullAddress) {
      ctx.addIssue({ code: 'custom', message: 'Required', path: ['fullAddress'] });
    }
    if (!staffFormHasValidCoordinates(data) && !locationSearch) {
      ctx.addIssue({
        code: 'custom',
        message: 'Search and pick a map location',
        path: ['locationSearch'],
      });
    }
    if (!taxNumber) {
      ctx.addIssue({ code: 'custom', message: 'Required', path: ['taxNumber'] });
    }
  });

const EMPTY_FORM_VALUES = {
  staffMode: 'existing',
  name: '',
  email: '',
  phoneNumber: '',
  password: '',
  dob: '',
  gender: '',
  location: '',
  fullAddress: '',
  locationSearch: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  longitude: 0,
  latitude: 0,
  taxNumber: '',
  branch: '',
  specialty: ['generalNurse'],
  ratePerHour: 12,
  platformPercent: 10,
  status: 'pending',
  avatarUrl: null,
  governmentId: [],
  nursingDegree: [],
  certifications: [],
};

function mapRegisteredStaffToForm(member) {
  return {
    staffMode: 'existing',
    name: member.name || '',
    email: member.email || '',
    phoneNumber: member.phone || '',
    password: '',
    dob: member.dob || '',
    gender: member.gender || '',
    location: member.location || '',
    fullAddress: member.location || '',
    locationSearch: buildLocationSearchLabel(member),
    city: member.city || '',
    state: member.state || '',
    country: member.country || '',
    postalCode: member.postalCode || '',
    longitude: member.longitude ?? 0,
    latitude: member.latitude ?? 0,
    taxNumber: member.taxNumber || '',
    branch: member.branch || '',
    specialty: normalizeSpecialities(member.specialities || member.specialties || member.specialty || 'generalNurse'),
    ratePerHour: member.ratePerHour ?? 12,
    platformPercent: member.platformPercent ?? 10,
    avatarUrl: member.avatarUrl || null,
    governmentId: [],
    nursingDegree: [],
    certifications: [],
    status: 'pending',
  };
}

export function AgencyStaffFormDialog({
  open,
  onClose,
  currentStaff,
  onSubmit,
  existingEmails = [],
  submitting = false,
  useBranchesQuery = useGetAgencyBranchesQuery,
  useNursesQuery = useGetAgencyStaffNursesQuery,
}) {
  const isEdit = !!currentStaff;
  const [selectedRegisteredStaff, setSelectedRegisteredStaff] = useState(null);
  const [chooseError, setChooseError] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const {
    data: nursesData,
    isLoading: loadingNurses,
    isFetching: fetchingNurses,
    error: nursesError,
  } = useNursesQuery({ page: 0, limit: 500 }, { skip: !open || isEdit });

  const {
    data: branchesData,
    isLoading: loadingBranches,
    isFetching: fetchingBranches,
    error: branchesError,
  } = useBranchesQuery({ page: 0, limit: 100 }, { skip: !open });

  const branchOptions = useMemo(() => {
    const list = branchesData?.data || [];
    return list.filter((branch) => {
      const status = String(branch.status || 'active').toLowerCase();
      return status !== 'deleted' && status !== 'delete';
    });
  }, [branchesData?.data]);

  const branchHelperText = useMemo(() => {
    if (loadingBranches || fetchingBranches) return 'Loading locations...';
    if (branchesError) return branchesError?.data?.message || 'Could not load locations';
    if (!branchOptions.length) return 'No locations found. Add a location first from Locations.';
    return `${branchOptions.length} location${branchOptions.length === 1 ? '' : 's'} available`;
  }, [branchOptions.length, branchesError, fetchingBranches, loadingBranches]);

  // Show full nurses list from API (do not hide by existing agency emails)
  const availableRegisteredStaff = useMemo(() => nursesData?.data || [], [nursesData?.data]);

  // Edit uses list row from GET /web/agency/staff (`_id`) — no GET-by-id (returns Staff not found).
  const editStaff = useMemo(() => {
    if (!isEdit || !currentStaff) return null;
    return currentStaff;
  }, [currentStaff, isEdit]);

  const defaultValues = useMemo(
    () =>
      isEdit && editStaff
        ? {
          staffMode: 'edit',
          name: editStaff.name || '',
          email: editStaff.email || '',
          phoneNumber: editStaff.phone || '',
          password: '',
          dob: editStaff.dob || '',
          gender: editStaff.gender || '',
          location: editStaff.location || '',
          fullAddress: editStaff.location || '',
          locationSearch: buildLocationSearchLabel(editStaff),
          city: editStaff.city || '',
          state: editStaff.state || '',
          country: editStaff.country || '',
          postalCode: editStaff.postalCode || '',
          longitude: editStaff.longitude ?? 0,
          latitude: editStaff.latitude ?? 0,
          taxNumber: editStaff.taxNumber || '',
          branch: editStaff.branch || '',
          specialty: normalizeSpecialities(
            editStaff.specialities || editStaff.specialties || editStaff.specialty || 'generalNurse'
          ),
          ratePerHour: editStaff.ratePerHour ?? 12,
          platformPercent: editStaff.platformPercent ?? 10,
          status: String(editStaff.status || 'pending').trim().toLowerCase(),
          avatarUrl: editStaff.avatarUrl || null,
          governmentId: [],
          nursingDegree: [],
          certifications: [],
        }
        : EMPTY_FORM_VALUES,
    [editStaff, isEdit]
  );

  const methods = useForm({
    mode: 'onTouched',
    reValidateMode: 'onChange',
    resolver: zodResolver(AgencyStaffFormSchema),
    defaultValues,
    shouldFocusError: true,
  });

  const {
    reset,
    watch,
    getValues,
    setValue,
    trigger,
    handleSubmit,
    getFieldState,
    formState: { isSubmitting, errors },
  } = methods;

  const staffMode = watch('staffMode');
  const isExistingMode = staffMode === 'existing';
  const busy = submitting || isSubmitting;

  useEffect(() => {
    if (!open) return;

    setSelectedRegisteredStaff(null);
    setChooseError('');
    setActiveStep(0);
    reset(defaultValues);
  }, [open, defaultValues, reset]);

  const handleSelectRegisteredStaff = useCallback(
    (member) => {
      setSelectedRegisteredStaff(member);
      setChooseError('');
      setActiveStep(0);

      if (member) {
        const currentBranch = getValues('branch') || '';
        reset({
          ...mapRegisteredStaffToForm(member),
          branch: currentBranch || member.branch || '',
        });
      } else {
        reset({ ...EMPTY_FORM_VALUES, staffMode: 'existing', branch: getValues('branch') || '' });
      }
    },
    [getValues, reset]
  );

  const handleSwitchToNewStaff = useCallback(() => {
    setSelectedRegisteredStaff(null);
    setChooseError('');
    setActiveStep(0);
    reset({ ...EMPTY_FORM_VALUES, staffMode: 'new' });
  }, [reset]);

  const handleSwitchToExistingStaff = useCallback(() => {
    setSelectedRegisteredStaff(null);
    setChooseError('');
    setActiveStep(0);
    reset({ ...EMPTY_FORM_VALUES, staffMode: 'existing' });
  }, [reset]);

  const collectFieldErrors = useCallback(
    (fields) => {
      const nextErrors = {};
      fields.forEach((fieldName) => {
        const state = getFieldState(fieldName);
        if (state.error) nextErrors[fieldName] = state.error;
      });
      return nextErrors;
    },
    [getFieldState]
  );

  const handleNextStep = useCallback(async () => {
    if (isExistingMode && !selectedRegisteredStaff) {
      setChooseError('Please choose a registered staff member by email.');
      toast.error('Please choose a registered staff member.');
      return;
    }

    const fields = isExistingMode
      ? ['branch', 'specialty', 'ratePerHour', 'platformPercent']
      : [
        'name',
        'email',
        'phoneNumber',
        'password',
        'gender',
        'fullAddress',
        'locationSearch',
        'taxNumber',
        'branch',
        'specialty',
        'ratePerHour',
        'platformPercent',
      ];

    try {
      if (!isExistingMode && !isEdit) {
        const hasCoords = await ensureFormAddressCoordinates(getValues, setValue, {
          addressField: 'locationSearch',
        });
        if (!hasCoords || !staffFormHasValidCoordinates(getValues())) {
          toast.error('Pick a location from the suggestions so map coordinates can be set.');
          return;
        }
      }

      const isValid = await trigger(fields, { shouldFocus: true });
      if (!isValid) {
        const fieldErrors = collectFieldErrors(fields);
        showValidationToast(Object.keys(fieldErrors).length ? fieldErrors : errors);
        return;
      }
      setActiveStep(1);
    } catch (error) {
      toast.error(error?.message || 'Could not continue. Please check the form.');
    }
  }, [
    collectFieldErrors,
    errors,
    getValues,
    isEdit,
    isExistingMode,
    selectedRegisteredStaff,
    setValue,
    trigger,
  ]);

  const handleRemoveFile = useCallback(
    (fieldName) => (inputFile) => {
      const current = getValues(fieldName) || [];
      setValue(
        fieldName,
        current.filter((file) => file !== inputFile),
        { shouldValidate: true }
      );
    },
    [getValues, setValue]
  );

  const existingDocumentSource = selectedRegisteredStaff || currentStaff;
  const isRegistryLocked = !isEdit && isExistingMode && Boolean(selectedRegisteredStaff);
  const showStepNavigation = !isEdit;

  const handleFormSubmit = handleSubmit(
    async (data) => {
      if (!isEdit && isExistingMode) {
        const existingStaffId = String(selectedRegisteredStaff?.id || '').trim();
        if (!existingStaffId) {
          setChooseError('Please choose a registered staff member by email.');
          toast.error('Please choose a registered staff member.');
          return;
        }
        if (!/^[a-f\d]{24}$/i.test(existingStaffId)) {
          setChooseError('Could not resolve this staff member’s nurse id.');
          toast.error('Could not resolve this staff member’s nurse id.');
          return;
        }
        if (!isNurseAccountUserType(selectedRegisteredStaff?.userType)) {
          setChooseError('Selected user is not a nurse.');
          toast.error('Selected user is not a nurse.');
          return;
        }
      }

      let formData = data;

      if ((!isExistingMode || isEdit) && !isRegistryLocked) {
        const hasCoords = await ensureFormAddressCoordinates(getValues, setValue, {
          addressField: 'locationSearch',
        });
        if (!hasCoords) {
          toast.error('Pick a location from the suggestions so map coordinates can be set.');
          return;
        }
        formData = getValues();
      }

      if (
        (!isExistingMode || isEdit) &&
        !isRegistryLocked &&
        !staffFormHasValidCoordinates(formData)
      ) {
        toast.error('Pick a location from the suggestions so map coordinates can be set.');
        return;
      }

      const payload = isEdit
        ? buildAgencyStaffUpdatePayload({
          ...formData,
          location: formData.fullAddress || formData.location || editStaff?.location || '',
          fullAddress: formData.fullAddress || formData.location || editStaff?.location || '',
          city: formData.city || editStaff?.city || '',
          state: formData.state || editStaff?.state || '',
          country: formData.country || editStaff?.country || '',
          postalCode: formData.postalCode || editStaff?.postalCode || '',
          longitude: formData.longitude ?? editStaff?.longitude ?? 0,
          latitude: formData.latitude ?? editStaff?.latitude ?? 0,
          taxNumber: formData.taxNumber || editStaff?.taxNumber || '',
          // Keep previously saved docs + any newly uploaded files
          governmentId: [
            ...(editStaff?.documents?.governmentId ||
              currentStaff?.documents?.governmentId ||
              []).map((file) => file.name || file),
            ...(formData.governmentId || []),
          ],
          nursingDegree: [
            ...(editStaff?.documents?.nursingDegree ||
              currentStaff?.documents?.nursingDegree ||
              []).map((file) => file.name || file),
            ...(formData.nursingDegree || []),
          ],
          certifications: [
            ...(editStaff?.documents?.certifications ||
              currentStaff?.documents?.certifications ||
              []).map((file) => file.name || file),
            ...(formData.certifications || []),
          ],
        })
        : buildAgencyStaffPayload(formData, {
          existingStaffId: isExistingMode ? selectedRegisteredStaff?.id : undefined,
        });

      try {
        await onSubmit?.(payload, { formData, staffMode: formData.staffMode, isEdit });
        onClose?.();
      } catch {
        // Parent shows toast; keep dialog open
      }
    },
    (formErrors) => {
      showValidationToast(formErrors);
    }
  );

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={busy ? undefined : onClose}
      scroll="paper"
      PaperProps={{
        sx: {
          maxWidth: 520,
          height: { xs: '90vh', sm: 560 },
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          '& form': {
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 0,
          },
        },
      }}
    >
      <Form methods={methods} onSubmit={handleFormSubmit} autoComplete="off">
        <DialogTitle sx={{ flexShrink: 0 }}>{isEdit ? 'Edit Staff' : 'Add Staff'}</DialogTitle>

        <DialogContent
          dividers
          sx={{
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            pt: 1,
          }}
        >
          <Stack spacing={2.5} sx={{ flex: 1, minHeight: 0, overflow: 'auto', pr: 0.5 }}>
            {showStepNavigation && (
              <>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography variant="subtitle2">Step {activeStep + 1} of 2</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {activeStep === 0 ? 'Staff details' : 'Documents'}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={2}>
                  {isExistingMode ? (
                    <Link component="button" type="button" variant="body2" onClick={handleSwitchToNewStaff}>
                      Add as new staff member
                    </Link>
                  ) : (
                    <Link
                      component="button"
                      type="button"
                      variant="body2"
                      onClick={handleSwitchToExistingStaff}
                    >
                      Select existing staff instead
                    </Link>
                  )}
                </Stack>
              </>
            )}

            {(!showStepNavigation || activeStep === 0) && (
              <>
                <Field.Select
                  name="branch"
                  label="Location *"
                  InputLabelProps={{ shrink: true }}
                  helperText={branchHelperText}
                >
                  <MenuItem value="">Select location</MenuItem>
                  {branchOptions.map((branch) => {
                    const locationLabel = getAgencyBranchLocationLabel(branch);
                    const label =
                      locationLabel && locationLabel !== '—'
                        ? `${branch.name || 'Location'} — ${locationLabel}`
                        : branch.name || branch.id;

                    return (
                      <MenuItem key={branch.id} value={branch.id}>
                        {label}
                      </MenuItem>
                    );
                  })}
                </Field.Select>

                {!isEdit && isExistingMode && (
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Search staff who already have a platform login and select by email.
                    </Typography>

                    <Autocomplete
                      autoComplete={false}
                      disablePortal={false}
                      loading={loadingNurses || fetchingNurses}
                      value={selectedRegisteredStaff}
                      onChange={(event, newValue) => handleSelectRegisteredStaff(newValue)}
                      options={availableRegisteredStaff}
                      ListboxProps={{
                        style: { maxHeight: 280 },
                      }}
                      slotProps={{
                        popper: {
                          sx: { zIndex: (theme) => theme.zIndex.modal + 2 },
                        },
                      }}
                      filterOptions={(options, state) => {
                        const query = state.inputValue.trim().toLowerCase();
                        if (!query) return options;

                        return options.filter((option) => {
                          const name = String(option.name || '').toLowerCase();
                          const email = String(option.email || '').toLowerCase();
                          return name.includes(query) || email.includes(query);
                        });
                      }}
                      getOptionLabel={(option) => {
                        if (!option) return '';
                        if (option.name && option.email) return `${option.name} (${option.email})`;
                        return option.email || option.name || option.id || '';
                      }}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      noOptionsText={
                        nursesError
                          ? nursesError?.data?.message || 'Could not load registered staff'
                          : loadingNurses || fetchingNurses
                            ? 'Loading staff...'
                            : 'No registered staff found'
                      }
                      renderOption={(props, option) => (
                        <Box component="li" {...props} key={option.id}>
                          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ py: 0.5 }}>
                            <Avatar src={option.avatarUrl || undefined} alt={option.name} sx={{ width: 32, height: 32 }}>
                              {option.name?.[0]}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" noWrap>
                                {option.name || '—'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                                {option.email || option.id}
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Search registered staff"
                          placeholder="Search name or email..."
                          error={Boolean(chooseError) || Boolean(nursesError)}
                          helperText={
                            chooseError ||
                            (nursesError
                              ? nursesError?.data?.message || 'Could not load registered staff'
                              : availableRegisteredStaff.length
                                ? `${availableRegisteredStaff.length} staff available`
                                : '')
                          }
                          inputProps={{
                            ...params.inputProps,
                            autoComplete: 'off',
                            name: 'staff-member-search',
                            'data-form-type': 'other',
                            'data-lpignore': 'true',
                            'data-1p-ignore': 'true',
                          }}
                        />
                      )}
                    />
                  </Stack>
                )}

                {(!isExistingMode || isEdit) && (
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Field.UploadAvatar name="avatarUrl" disabled={isRegistryLocked} />
                  </Box>
                )}

                <Box
                  rowGap={2.5}
                  columnGap={2}
                  display="grid"
                  gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
                >
                  {!isExistingMode || isEdit ? (
                    <>
                      <Field.Text name="name" label="Name *" disabled={isRegistryLocked} />
                      <Field.Text
                        name="phoneNumber"
                        label="Phone Number *"
                        disabled={isRegistryLocked}
                        placeholder="03004785384 or +923004785384"
                      />
                      <Field.Text
                        name="email"
                        label="Email *"
                        disabled={isRegistryLocked}
                        inputProps={{ autoComplete: 'off' }}
                      />
                      {!isEdit && (
                        <Field.Text
                          name="password"
                          label="Password *"
                          type="password"
                          disabled={isRegistryLocked}
                          inputProps={{ autoComplete: 'new-password' }}
                        />
                      )}
                      {isEdit && (
                        <Field.Text
                          name="password"
                          label="Password"
                          type="password"
                          placeholder="Leave blank to keep current"
                        />
                      )}
                      <Field.Text
                        name="dob"
                        label="Date of birth"
                        type="date"
                        disabled={isRegistryLocked}
                        InputLabelProps={{ shrink: true }}
                      />
                      <Field.Select
                        name="gender"
                        label="Gender *"
                        disabled={isRegistryLocked}
                        InputLabelProps={{ shrink: true }}
                      >
                        <MenuItem value="">Select gender</MenuItem>
                        {STAFF_GENDER_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Field.Select>
                      <Field.Text
                        name="taxNumber"
                        label="National Insurance / Tax Number *"
                        disabled={isRegistryLocked}
                      />
                      {isRegistryLocked ? (
                        <>
                          <Field.Text name="fullAddress" label="Full address *" disabled sx={{ gridColumn: '1 / -1' }} />
                          <Field.Text name="locationSearch" label="Location" disabled sx={{ gridColumn: '1 / -1' }} />
                        </>
                      ) : (
                        <>
                          <Field.Text
                            name="fullAddress"
                            label="Full address *"
                            disabled={isRegistryLocked}
                            helperText="Home or correspondence address"
                            sx={{ gridColumn: '1 / -1' }}
                          />
                          <Box sx={{ gridColumn: '1 / -1' }}>
                            <Field.StandaloneAddress
                              name="locationSearch"
                              label="Location *"
                              helperText="Search map location for latitude & longitude"
                            />
                          </Box>
                        </>
                      )}
                      <Field.Text name="city" label="City" disabled={isRegistryLocked} />
                      <Field.Text name="state" label="State" disabled={isRegistryLocked} />
                      <Field.Text name="country" label="Country" disabled={isRegistryLocked} />
                      <Field.Text name="postalCode" label="Postal code" disabled={isRegistryLocked} />
                    </>
                  ) : null}

                  <Field.Autocomplete
                    name="specialty"
                    label="Specialties"
                    multiple
                    options={STAFF_SPECIALTY_API_OPTIONS.map((option) => option.value)}
                    getOptionLabel={(value) =>
                      STAFF_SPECIALTY_API_OPTIONS.find((option) => option.value === value)?.label || value
                    }
                  />
                  <Field.Text
                    name="ratePerHour"
                    label="Rate per hour (£)"
                    type="number"
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <Field.Text
                    name="platformPercent"
                    label="Platform percent"
                    type="number"
                    inputProps={{ min: 0, max: 100, step: 1 }}
                  />
                  <SupplierStaffStatusField
                    required
                    isEdit={isEdit}
                    currentStatus={isEdit ? currentStaff?.status : 'pending'}
                  />
                </Box>
              </>
            )}

            {(!showStepNavigation || activeStep === 1) && (!isExistingMode || isEdit) && (
              <Stack spacing={1.5}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Add required documents (PDF or Word only). Drag a file onto a row or tap Upload.
                </Typography>

                <StaffDocumentUploadRow
                  name="governmentId"
                  label="Government-issued ID"
                  existingFiles={existingDocumentSource?.documents?.governmentId || []}
                  onRemove={handleRemoveFile('governmentId')}
                  helperText="Upload PDF / DOC only"
                />

                <StaffDocumentUploadRow
                  name="nursingDegree"
                  label="Nursing Degree / Diploma"
                  existingFiles={existingDocumentSource?.documents?.nursingDegree || []}
                  onRemove={handleRemoveFile('nursingDegree')}
                  helperText="Upload PDF / DOC only"
                />

                <StaffDocumentUploadRow
                  name="certifications"
                  label="Certifications (BLS, ACLS, First Aid)"
                  existingFiles={existingDocumentSource?.documents?.certifications || []}
                  onRemove={handleRemoveFile('certifications')}
                  helperText="Upload PDF / DOC only"
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, flexShrink: 0 }}>
          <Button variant="outlined" onClick={onClose} disabled={busy}>
            Cancel
          </Button>

          {showStepNavigation && activeStep === 0 && !isExistingMode ? (
            <Button type="button" variant="contained" color="primary" onClick={handleNextStep}>
              Next
            </Button>
          ) : showStepNavigation && activeStep === 0 && isExistingMode ? (
            <LoadingButton type="submit" variant="contained" color="primary" loading={busy}>
              Add
            </LoadingButton>
          ) : (
            <>
              {showStepNavigation && !isExistingMode && (
                <Button type="button" variant="outlined" onClick={() => setActiveStep(0)} disabled={busy}>
                  Back
                </Button>
              )}
              <LoadingButton type="submit" variant="contained" color="primary" loading={busy}>
                {isEdit ? 'Save changes' : 'Add'}
              </LoadingButton>
            </>
          )}
        </DialogActions>
      </Form>
    </Dialog>
  );
}
