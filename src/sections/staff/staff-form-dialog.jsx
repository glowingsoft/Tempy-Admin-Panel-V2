import { z as zod } from 'zod';
import { useMemo, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { STAFF_GENDER_OPTIONS, STAFF_SPECIALTY_API_OPTIONS } from 'src/_mock/_staff';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

import { ensureFormAddressCoordinates } from 'src/sections/branches/address-form-utils';

import { StaffDocumentUploadRow } from './staff-document-upload-row';

// ----------------------------------------------------------------------

const StaffFormSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  phoneNumber: zod.string().min(1, { message: 'Phone number is required!' }),
  password: zod.string().optional(),
  gender: zod.string().min(1, { message: 'Gender is required!' }),
  location: zod.string().min(1, { message: 'Location is required!' }),
  fullAddress: zod.string().min(1, { message: 'Full address is required!' }),
  locationSearch: zod.string().optional(),
  city: zod.string().optional(),
  state: zod.string().optional(),
  country: zod.string().optional(),
  postalCode: zod.string().optional(),
  latitude: zod.coerce.number().optional(),
  longitude: zod.coerce.number().optional(),
  taxNumber: zod.string().min(1, { message: 'National Insurance / Tax Number is required!' }),
  specialty: zod.array(zod.string()).min(1, { message: 'Select at least one specialty!' }),
  ratePerHour: zod.coerce.number().min(0, { message: 'Rate per hour must be 0 or more' }),
  platformPercent: zod.coerce
    .number()
    .min(0, { message: 'Platform percent must be 0 or more' })
    .max(100, { message: 'Platform percent cannot exceed 100' }),
  avatarUrl: zod.any().optional(),
  governmentId: zod.array(zod.any()).default([]),
  nursingDegree: zod.array(zod.any()).default([]),
  certifications: zod.array(zod.any()).default([]),
});

const EMPTY_FORM_VALUES = {
  name: '',
  email: '',
  phoneNumber: '',
  password: '',
  gender: '',
  location: '',
  fullAddress: '',
  locationSearch: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  latitude: 0,
  longitude: 0,
  taxNumber: '',
  specialty: ['generalNurse'],
  ratePerHour: 12,
  platformPercent: 10,
  avatarUrl: null,
  governmentId: [],
  nursingDegree: [],
  certifications: [],
};

// ----------------------------------------------------------------------

export function StaffFormDialog({ open, onClose, currentStaff, onSubmit, isNested = false }) {
  const isEdit = !!currentStaff;

  const defaultValues = useMemo(
    () =>
      isEdit
        ? {
          name: currentStaff.name || '',
          email: currentStaff.email || '',
          phoneNumber: currentStaff.phone || '',
          password: '',
          gender: currentStaff.gender || '',
          location: currentStaff.location || '',
          fullAddress: currentStaff.location || '',
          locationSearch: [currentStaff.city, currentStaff.state, currentStaff.country]
            .filter(Boolean)
            .join(', '),
          city: currentStaff.city || '',
          state: currentStaff.state || '',
          country: currentStaff.country || '',
          postalCode: currentStaff.postalCode || '',
          latitude: currentStaff.latitude ?? 0,
          longitude: currentStaff.longitude ?? 0,
          taxNumber: currentStaff.taxNumber || '',
          specialty: Array.isArray(currentStaff.specialities)
            ? currentStaff.specialities
            : [currentStaff.specialty || 'generalNurse'],
          ratePerHour: currentStaff.ratePerHour ?? 12,
          platformPercent: currentStaff.platformPercent ?? 10,
          avatarUrl: currentStaff.avatarUrl || null,
          governmentId: [],
          nursingDegree: [],
          certifications: [],
        }
        : EMPTY_FORM_VALUES,
    [currentStaff, isEdit]
  );

  const methods = useForm({
    mode: 'onChange',
    resolver: zodResolver(StaffFormSchema),
    defaultValues,
  });

  const {
    reset,
    getValues,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, defaultValues, reset]);

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

  const handleFormSubmit = handleSubmit(async (data) => {
    if (!isEdit && !data.password) {
      methods.setError('password', { message: 'Password is required!' });
      return;
    }

    if (!isEdit && data.password && data.password.length < 6) {
      methods.setError('password', { message: 'Password must be at least 6 characters!' });
      return;
    }

    const hasCoords = await ensureFormAddressCoordinates(getValues, setValue, {
      addressField: 'locationSearch',
    });
    if (!hasCoords) {
      toast.error('Pick a location from the suggestions so map coordinates can be set.');
      return;
    }

    onSubmit({
      ...getValues(),
      location: getValues('fullAddress') || getValues('location'),
    });
    onClose();
  });

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={open}
      onClose={onClose}
      scroll="paper"
      disableScrollLock={isNested}
      sx={{
        ...(isNested && {
          zIndex: (theme) => theme.zIndex.modal + 20,
        }),
      }}
    >
      <Form methods={methods} onSubmit={handleFormSubmit}>
        <DialogTitle>{isEdit ? 'Edit Staff' : 'Add Staff'}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Field.UploadAvatar name="avatarUrl" />
            </Box>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
            >
              <Field.Text name="name" label="Name" />
              <Field.Text name="phoneNumber" label="Phone Number" />
              <Field.Text name="email" label="Email" />
              <Field.Text
                name="password"
                label="Password"
                type="password"
                placeholder={isEdit ? 'Leave blank to keep current' : ''}
              />
              <Field.Select name="gender" label="Gender" InputLabelProps={{ shrink: true }}>
                <MenuItem value="">Select gender</MenuItem>
                {STAFF_GENDER_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Field.Select>
              <Field.Text name="taxNumber" label="National Insurance / Tax Number" />
              <Field.Text
                name="fullAddress"
                label="Full address"
                helperText="Home or correspondence address"
                sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}
              />
              <Box sx={{ gridColumn: { xs: '1 / -1', sm: '1 / -1' } }}>
                <Field.StandaloneAddress
                  name="locationSearch"
                  label="Location"
                  helperText="Search map location for latitude & longitude"
                />
              </Box>
              <Field.Text name="city" label="City" />
              <Field.Text name="state" label="State" />
              <Field.Text name="country" label="Country" />
              <Field.Text name="postalCode" label="Postal code" />
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
            </Box>

            <Stack spacing={1.5}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Add required documents. Drag a file onto a row or tap Upload.
              </Typography>

              <StaffDocumentUploadRow
                name="governmentId"
                label="Government-issued ID"
                existingFiles={currentStaff?.documents?.governmentId}
                onRemove={handleRemoveFile('governmentId')}
                helperText="Upload government-issued ID"
              />

              <StaffDocumentUploadRow
                name="nursingDegree"
                label="Nursing Degree / Diploma"
                existingFiles={currentStaff?.documents?.nursingDegree}
                onRemove={handleRemoveFile('nursingDegree')}
                helperText="Upload nursing degree or diploma"
              />

              <StaffDocumentUploadRow
                name="certifications"
                label="Certifications (BLS, ACLS, First Aid)"
                existingFiles={currentStaff?.documents?.certifications}
                onRemove={handleRemoveFile('certifications')}
                helperText="Upload certifications"
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" color="primary" loading={isSubmitting}>
            {isEdit ? 'Save changes' : 'Add'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
