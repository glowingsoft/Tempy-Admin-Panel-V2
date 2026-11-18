import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { AppButton } from 'src/components/app-button';
import { Field, Form } from 'src/components/hook-form';

import { StaffDocumentUploadRow } from 'src/sections/staff/staff-document-upload-row';
import {
  StandaloneAddressInput,
  geocodeAddress,
} from 'src/sections/tempy-home/standalone-address-input';

import {
  applyAddressPlaceToForm,
  composeLocationFullAddress,
  extractAddressLine1,
} from './address-form-utils';
import { buildBranchProfilePayload } from './agency-branch-utils';
import {
  BRANCH_STATUS,
  BRANCH_STATUS_OPTIONS,
  CQC_RATING_OPTIONS,
  matchUkCounty,
} from './branches-constants';
import { isValidLngLat, parseCoordinates, toApiCoordinates } from './geo-coordinates';

const UK_POSTCODE_ONLY =
  /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

const ADDRESS_FIELDS = [
  'name',
  'locationName',
  'fullAddress',
  'addressLine1',
  'addressLine2',
  'city',
  'country',
  'state',
  'postalCode',
  'status',
];

const DEFAULT_UK_COUNTRY = 'United Kingdom';

function buildBranchSchema({
  hideImages = false,
  hideInsurance = false,
  showWebsite = false,
  hideState = false,
  stateLabel = 'State',
} = {}) {
  const websiteField = showWebsite
    ? zod
      .string()
      .trim()
      .optional()
      .refine(
        (value) => {
          if (!value) return true;
          try {
            const parsed = new URL(value.includes('://') ? value : `https://${value}`);
            return Boolean(parsed.hostname);
          } catch {
            return false;
          }
        },
        { message: 'Enter a valid website URL' }
      )
    : zod.string().optional();

  return zod
    .object({
      name: zod.string().trim().min(1, 'Name is required'),
      locationName: zod.string().trim().min(1, 'Location name is required'),
      longitude: zod.coerce.number().optional(),
      latitude: zod.coerce.number().optional(),
      fullAddress: zod.string().trim().min(1, 'Location is required'),
      addressLine1: zod
        .string()
        .trim()
        .min(1, 'Enter Address Line 1')
        .refine((value) => !UK_POSTCODE_ONLY.test(value), {
          message: 'Address Line 1 must include house number or name & street, not only a postcode',
        }),
      addressLine2: zod.string().trim().optional().default(''),
      city: zod.string().trim().min(1, 'Postal Town / City is required'),
      country: zod.string().trim().min(1, 'Country is required'),
      // County is optional on all addresses (client standard).
      state: zod.string().trim().optional().default(''),
      postalCode: zod.string().trim().min(1, 'Post Code is required'),
      status: zod.enum([
        BRANCH_STATUS.ACTIVE,
        BRANCH_STATUS.PENDING,
        BRANCH_STATUS.INACTIVE,
        BRANCH_STATUS.DELETED,
      ]),
      bio: zod
        .string()
        .trim()
        .min(1, 'Information is required')
        .max(2000, 'Information must be under 2000 characters'),
      website: websiteField,
      images: hideImages
        ? zod.array(zod.any()).default([])
        : zod.array(zod.any()).min(1, 'At least one image is required').default([]),
      certifications: zod.array(zod.any()).default([]),
      cqcRegistered: zod.boolean().optional(),
      cqcRegistrationNumber: zod.string().optional(),
      cqcRating: zod.string().optional(),
      insuranceCertificates: zod.array(zod.any()).default([]),
      insuranceExpiryDate: zod.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.longitude != null &&
        data.latitude != null &&
        (data.longitude !== 0 || data.latitude !== 0) &&
        !isValidLngLat(data.longitude, data.latitude)
      ) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          path: ['fullAddress'],
          message: 'Pick a location from the suggestions',
        });
      }
    });
}

function getCoords(branch) {
  const parsed = parseCoordinates(branch?.location?.coordinates);
  if (parsed) return parsed;
  return { longitude: 0, latitude: 0 };
}

export function resolveBranchStatus(status, fallback = BRANCH_STATUS.PENDING) {
  const raw = String(status || '').trim().toLowerCase();
  if (raw === 'delete') return BRANCH_STATUS.DELETED;
  return [
    BRANCH_STATUS.ACTIVE,
    BRANCH_STATUS.PENDING,
    BRANCH_STATUS.INACTIVE,
    BRANCH_STATUS.DELETED,
  ].includes(raw)
    ? raw
    : fallback;
}

export function buildAgencyBranchPayload(data, { userId } = {}) {
  const branchName = String(data.name || '').trim();
  const locationName = String(data.locationName || '').trim();
  const locationTitle = locationName || branchName;
  const callerUserId = String(userId || data.userId || '').trim();
  const city = String(data.city || '').trim();
  const country = String(data.country || '').trim() || DEFAULT_UK_COUNTRY;
  const state = String(data.state || '').trim();
  const postalCode = String(data.postalCode || '').trim();
  const addressLine2 = String(data.addressLine2 || '').trim();

  return {
    name: branchName,
    locationName: locationTitle,
    location: {
      name: locationTitle,
      title: locationTitle,
      coordinates: toApiCoordinates(data.latitude, data.longitude),
      fullAddress: composeLocationFullAddress({
        addressLine1: data.addressLine1,
        addressLine2,
        fullAddress: data.fullAddress,
        city,
        state,
        postalCode,
        country,
      }),
      addressLine1: String(data.addressLine1 || '').trim(),
      addressLine2,
      city,
      country,
      state,
      postalCode,
    },
    status: resolveBranchStatus(data.status),
    ...buildBranchProfilePayload(data),
    ...(callerUserId ? { userId: callerUserId } : {}),
  };
}

export function buildAgencyBranchUpdatePayload(data) {
  return buildAgencyBranchPayload(data);
}

function resolveLocationName(locationObj, branch) {
  if (!locationObj && !branch) return '';
  return (
    locationObj?.name ||
    locationObj?.title ||
    locationObj?.locationName ||
    locationObj?.label ||
    branch?.locationName ||
    ''
  );
}

export function BranchFormDialog({
  open,
  onClose,
  currentBranch,
  onSubmit,
  submitting = false,
  entityLabel = 'Location',
  addressOnly = false,
  showComplianceFields = false,
  hideImages = false,
  hideInsurance = false,
  showWebsite = false,
  hideState = false,
  stateLabel = 'County',
  sx,
}) {
  const isEdit = Boolean(currentBranch);
  const isLocationEntity = addressOnly;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const nameLabel = isLocationEntity ? 'Title' : 'Location name';

  const branchSchema = useMemo(
    () =>
      buildBranchSchema({
        hideImages,
        hideInsurance,
        showWebsite,
        hideState,
        stateLabel,
      }),
    [hideImages, hideInsurance, showWebsite, hideState, stateLabel]
  );

  const addressFields = useMemo(
    () =>
      ADDRESS_FIELDS.filter(
        (field) => field !== 'locationName' && !(hideState && field === 'state')
      ),
    [hideState]
  );

  const profileFields = useMemo(() => {
    const fields = ['bio'];
    if (showWebsite) fields.push('website');
    if (!hideImages) fields.push('images');
    return fields;
  }, [hideImages, showWebsite]);

  const steps = useMemo(() => {
    const list = [
      { key: 'address', label: 'Address' },
      { key: 'profile', label: 'Profile' },
    ];
    if (showComplianceFields) {
      list.push({ key: 'compliance', label: 'CQC' });
    }
    return list;
  }, [showComplianceFields]);

  const lastStepIndex = steps.length - 1;
  const stepKey = steps[activeStep]?.key || 'address';

  const defaultValues = useMemo(() => {
    const coords = getCoords(currentBranch);
    const locationObj =
      currentBranch?.location && typeof currentBranch.location === 'object'
        ? currentBranch.location
        : null;

    const titleOrName =
      currentBranch?.title || currentBranch?.name || currentBranch?.branchName || '';

    return {
      name: titleOrName,
      locationName: isLocationEntity
        ? titleOrName
        : resolveLocationName(locationObj, currentBranch),
      longitude: coords.longitude,
      latitude: coords.latitude,
      fullAddress:
        locationObj?.fullAddress ||
        (typeof currentBranch?.location === 'string' ? currentBranch.location : '') ||
        '',
      addressLine1:
        String(locationObj?.addressLine1 || '').trim() ||
        extractAddressLine1(
          locationObj?.fullAddress ||
            (typeof currentBranch?.location === 'string' ? currentBranch.location : '') ||
            ''
        ),
      addressLine2: String(locationObj?.addressLine2 || '').trim(),
      city: locationObj?.city || '',
      country: locationObj?.country || DEFAULT_UK_COUNTRY,
      state: matchUkCounty(locationObj?.state || '') || String(locationObj?.state || '').trim(),
      postalCode:
        locationObj?.postalCode != null && locationObj?.postalCode !== ''
          ? String(locationObj.postalCode)
          : '',
      status: resolveBranchStatus(currentBranch?.status),
      bio: currentBranch?.bio || '',
      website: currentBranch?.website || locationObj?.website || '',
      images: Array.isArray(currentBranch?.images) ? currentBranch.images : [],
      certifications: Array.isArray(currentBranch?.certifications)
        ? currentBranch.certifications
        : [],
      cqcRegistered: Boolean(currentBranch?.cqcRegistered),
      cqcRegistrationNumber: currentBranch?.cqcRegistrationNumber || '',
      cqcRating: currentBranch?.cqcRating || '',
      insuranceCertificates: Array.isArray(currentBranch?.insuranceCertificates)
        ? currentBranch.insuranceCertificates
        : [],
      insuranceExpiryDate: currentBranch?.insuranceExpiryDate || '',
    };
  }, [currentBranch, hideState, isLocationEntity, stateLabel]);

  const methods = useForm({
    resolver: zodResolver(branchSchema),
    defaultValues,
  });

  const { reset, handleSubmit, setValue, watch, trigger, setError, clearErrors, formState } =
    methods;
  const { errors } = formState;
  const busy = submitting || isSubmitting;
  const watchedName = watch('name');
  const watchedImages = watch('images') || [];
  const cqcRegistered = watch('cqcRegistered');
  const stateIsCountyEnum = !hideState && String(stateLabel || '').toLowerCase() === 'county';

  useEffect(() => {
    if (!open) return;
    setValue('locationName', String(watchedName || '').trim(), { shouldValidate: Boolean(watchedName) });
  }, [open, setValue, watchedName]);

  useEffect(() => {
    if (!open) return;
    reset(defaultValues);
    setIsSubmitting(false);
    setActiveStep(0);
  }, [open, currentBranch?.id, currentBranch?._id, reset]);

  const saveForm = useCallback(async () => {
    await handleSubmit(async (data) => {
      try {
        setIsSubmitting(true);
        const nextData = {
          ...data,
          locationName: String(data.name || '').trim(),
          country: String(data.country || '').trim() || DEFAULT_UK_COUNTRY,
        };
        await onSubmit?.(nextData);
        onClose?.();
      } catch {
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [handleSubmit, onClose, onSubmit]);

  const applyPlace = useCallback(
    (place) => {
      if (!place) return;
      applyAddressPlaceToForm(setValue, place, {
        addressField: 'fullAddress',
        updateSearchLabel: true,
        matchCountyEnum: stateIsCountyEnum,
      });
      if (hideState) {
        setValue('state', String(place.state || '').trim(), { shouldDirty: true });
      }
      clearErrors(['fullAddress', 'addressLine1', 'city', 'postalCode', 'country']);
    },
    [clearErrors, hideState, setValue, stateIsCountyEnum]
  );

  const ensureCoordinates = useCallback(async () => {
    const lng = Number(watch('longitude'));
    const lat = Number(watch('latitude'));
    if (isValidLngLat(lng, lat) && !(lng === 0 && lat === 0)) return true;

    const query = String(watch('fullAddress') || '').trim();
    if (!query) return false;

    const geocoded = await geocodeAddress(query);
    if (!geocoded) return false;
    applyPlace(geocoded);
    return true;
  }, [applyPlace, watch]);

  const handleNext = useCallback(async () => {
    if (stepKey === 'address') {
      const valid = await trigger(addressFields);
      if (!valid) return;

      const hasCoords = await ensureCoordinates();
      if (!hasCoords) {
        setError('fullAddress', {
          type: 'manual',
          message: 'Pick a suggestion or tap Find my location',
        });
        return;
      }
    }

    if (stepKey === 'profile') {
      const valid = await trigger(profileFields);
      if (!valid) return;
    }

    if (activeStep >= lastStepIndex) {
      await saveForm();
      return;
    }

    setActiveStep((prev) => prev + 1);
  }, [
    activeStep,
    addressFields,
    ensureCoordinates,
    lastStepIndex,
    profileFields,
    saveForm,
    setError,
    stepKey,
    trigger,
  ]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      sx={sx}
      PaperProps={{ sx: { maxHeight: 'calc(100dvh - 64px)' } }}
    >
      <Form methods={methods} onSubmit={(event) => event.preventDefault()}>
        <DialogTitle sx={{ pb: 1 }}>
          {isEdit ? `Edit ${entityLabel}` : `Add ${entityLabel}`}
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2, pb: 2.5, overflowY: 'auto' }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
            {steps.map((step) => (
              <Step key={step.key}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {stepKey === 'address' && (
            <Stack spacing={2.5}>
              <Field.Text
                name="name"
                label={nameLabel}
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={isLocationEntity && isEdit}
                helperText={
                  isLocationEntity && isEdit
                    ? 'Title is set when the location is created'
                    : undefined
                }
              />

              <StandaloneAddressInput
                value={watch('fullAddress')}
                onChange={(val) =>
                  setValue('fullAddress', val, { shouldDirty: true, shouldValidate: true })
                }
                onPlaceSelect={applyPlace}
                label="Location"
                size="small"
                labelPlacement="outlined"
                countryRestriction="gb"
                error={Boolean(errors.fullAddress)}
                helperText={errors.fullAddress?.message || undefined}
              />

              <Field.Text
                name="addressLine1"
                label="Address Line 1"
                placeholder="House number or name & street"
                size="small"
                InputLabelProps={{ shrink: true }}
                helperText={errors.addressLine1?.message || 'Required'}
              />

              <Field.Text
                name="addressLine2"
                label="Line 2 (optional)"
                size="small"
                InputLabelProps={{ shrink: true }}
              />

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Field.Text
                  name="city"
                  label="Postal Town / City"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                {!hideState ? (
                  <Field.Text
                    name="state"
                    label={`${stateLabel || 'County'} (optional)`}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                ) : null}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Field.Text
                  name="postalCode"
                  label="Post Code"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <Field.Text
                  name="country"
                  label="Country"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  inputProps={{ autoComplete: 'off' }}
                />
              </Stack>

              <Field.Select
                name="status"
                label="Status"
                size="small"
                InputLabelProps={{ shrink: true }}
              >
                {BRANCH_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
            </Stack>
          )}

          {stepKey === 'profile' && (
            <Stack spacing={2.5}>
              <Field.Text
                name="bio"
                label="Information"
                multiline
                minRows={3}
                size="small"
                InputLabelProps={{ shrink: true }}
                placeholder="Describe any relevant information and care requirements."
              />

              {showWebsite ? (
                <Field.Text
                  name="website"
                  label="Website"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  placeholder="https://example.com"
                  helperText="Optional link to this location’s website"
                  fullWidth
                />
              ) : null}

              {!hideImages ? (
                <Box>
                  <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
                    Images
                  </Typography>
                  <Field.Upload
                    multiple
                    thumbnail
                    name="images"
                    maxSize={10 * 1024 * 1024}
                    onRemove={(inputFile) =>
                      setValue(
                        'images',
                        watchedImages.filter((file) => file !== inputFile),
                        { shouldValidate: true, shouldDirty: true }
                      )
                    }
                    onRemoveAll={() =>
                      setValue('images', [], { shouldValidate: true, shouldDirty: true })
                    }
                    helperText="Upload photos of the premises (max 10 MB each)"
                  />
                </Box>
              ) : null}

              <StaffDocumentUploadRow
                name="certifications"
                label="Care related documentation"
                helperText="Optional — upload PDF / DOC. Original file names are kept on the document list."
              />

              {!hideInsurance ? (
                <>
                  <StaffDocumentUploadRow
                    name="insuranceCertificates"
                    label="Insurance (optional)"
                    helperText="Not required, but helpful — upload PDF / DOC if you have cover for this location"
                  />

                  <Field.Text
                    name="insuranceExpiryDate"
                    label="Insurance expiry date (optional)"
                    type="date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </>
              ) : null}
            </Stack>
          )}

          {stepKey === 'compliance' && (
            <Stack spacing={2.5}>
              <Field.Switch
                name="cqcRegistered"
                label="Registered with CQC"
                labelPlacement="start"
                sx={{
                  mx: 0,
                  width: 1,
                  justifyContent: 'space-between',
                  ml: 0,
                }}
              />

              <Field.Text
                name="cqcRegistrationNumber"
                label="CQC registration number"
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={!cqcRegistered}
                fullWidth
              />

              <Field.Select
                name="cqcRating"
                label="CQC rating"
                size="small"
                InputLabelProps={{ shrink: true }}
                disabled={!cqcRegistered}
                fullWidth
              >
                <MenuItem value="">
                  <em>Select rating</em>
                </MenuItem>
                {CQC_RATING_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
          <AppButton variant="outlined" color="inherit" onClick={onClose} disabled={busy}>
            Cancel
          </AppButton>

          <Box sx={{ flex: 1 }} />

          {activeStep > 0 && (
            <AppButton variant="outlined" color="inherit" onClick={handleBack} disabled={busy}>
              Back
            </AppButton>
          )}

          <AppButton onClick={handleNext} loading={busy}>
            {activeStep >= lastStepIndex
              ? isEdit
                ? 'Save Changes'
                : `Add ${entityLabel}`
              : 'Next'}
          </AppButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
