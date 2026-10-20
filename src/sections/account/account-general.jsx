import { z as zod } from 'zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Grid from '@mui/material/Unstable_Grid2';

import { fData } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { ModuleLoading } from 'src/components/loading-screen';

import { useBoolean } from 'src/hooks/use-boolean';
import { useMockedUser } from 'src/auth/hooks';
import { useRouter } from 'src/routes/hooks';
import { setUser, logout as logoutAction } from 'src/store/slices/userSlice';
import { clearImpersonation } from 'src/store/slices/impersonationSlice';
import { clearStoragePreservingUiPrefs } from 'src/hooks/use-persisted-view-mode';
import { useViewOnly } from 'src/hooks/use-view-only';
import { handleApiError } from 'src/store/handleApiError';
import {
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
} from 'src/store/Reducer/users-api';
import { useDeleteAccountMutation, useLogoutMutation } from 'src/store/Reducer/auth';
import { signOut as jwtSignOut } from 'src/auth/context/jwt/action';

import {
  buildLogoutPayload,
  buildUpdateProfilePayload,
  getProfileUserId,
} from './account-profile-utils';
import { isStaffMemberAccount } from 'src/sections/staff-member/profile/staff-member-profile-store';
import { StaffMemberPersonalSummaryField } from 'src/sections/staff-member/profile/staff-member-personal-summary-field';
import { resolveProfileAssetUrl, resolveUploadedAssetUrl } from 'src/store/Reducer/upload-api';
import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';
import { isValidLngLat } from 'src/sections/branches/geo-coordinates';
import { geocodeAddress } from 'src/sections/tempy-home/standalone-address-input';


export const UpdateUserSchema = zod.object({
  displayName: zod.string().min(1, { message: 'Name is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  photoURL: zod.any().optional().nullable(),
  phoneNumber: zod.string().optional().nullable(),
  country: zod.string().optional().nullable(),
  address: zod.string().min(1, { message: 'Address is required!' }),
  state: zod.string().optional().nullable(),
  city: zod.string().optional().nullable(),
  zipCode: zod.string().optional().nullable(),
  longitude: zod.preprocess(
    (v) => (v === '' || v == null ? 0 : v),
    zod.coerce.number().optional()
  ),
  latitude: zod.preprocess(
    (v) => (v === '' || v == null ? 0 : v),
    zod.coerce.number().optional()
  ),
});

function resolveProfilePhotoValue(profile, fallbackUser) {
  const candidates = [
    fallbackUser?.photoURL,
    fallbackUser?.profileIcon,
    fallbackUser?.basicInfo?.profileIcon,
    profile?.photoURL,
    profile?.profileIconUrl,
    profile?.profileIcon,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === 'object' && !(candidate instanceof File)) {
      return candidate;
    }
    const url = resolveProfileAssetUrl(candidate);
    if (url) return url;
  }

  return null;
}

function buildDefaults(profile, fallbackUser) {
  return {
    displayName: profile?.name || fallbackUser?.basicInfo?.name || fallbackUser?.displayName || '',
    email: profile?.email || fallbackUser?.email || '',
    photoURL: resolveProfilePhotoValue(profile, fallbackUser),
    phoneNumber:
      profile?.phoneLabel ||
      (typeof fallbackUser?.phoneNumber === 'string' ? fallbackUser.phoneNumber : '') ||
      '',
    country: profile?.country || '',
    address: profile?.fullAddress || profile?.address || '',
    state: profile?.state || '',
    city: profile?.city || '',
    zipCode: profile?.postalCode || profile?.zipCode || '',
    longitude: profile?.longitude ?? 0,
    latitude: profile?.latitude ?? 0,
  };
}

export function AccountGeneral() {
  const viewOnly = useViewOnly();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useMockedUser();
  const deleteConfirm = useBoolean();

  const userId = getProfileUserId(user);
  const staffProfile = isStaffMemberAccount(user);
  const [personalSummary, setPersonalSummary] = useState('');

  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUserByIdQuery(userId, { skip: !userId });

  const [updateUser, { isLoading: updating }] = useUpdateUserByIdMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();
  const [logoutApi] = useLogoutMutation();

  const defaultValues = useMemo(() => buildDefaults(profile, user), [profile, user]);

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(UpdateUserSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    setValue,
    formState: { isSubmitting, dirtyFields },
  } = methods;

  useEffect(() => {
    reset(buildDefaults(profile, user));
  }, [profile, reset, user]);

  useEffect(() => {
    if (!staffProfile) return;
    setPersonalSummary(String(profile?.bio || '').trim());
  }, [profile?.bio, staffProfile]);

  const clearLocalSession = async () => {
    try {
      await jwtSignOut();
    } catch {
    }
    dispatch(logoutAction());
    dispatch(clearImpersonation());
    clearStoragePreservingUiPrefs();
    sessionStorage.clear();
    router.replace('/');
  };

  const onSubmit = handleSubmit(
    async (data) => {
      if (!userId) {
        toast.error('User id not found. Please sign in again.');
        return;
      }

      try {
        const address = String(data.address || '').trim();
        const longitude = Number(data.longitude);
        const latitude = Number(data.latitude);
        const missingCoordinates =
          !isValidLngLat(longitude, latitude) || (longitude === 0 && latitude === 0);

        let profileData = data;

        if (dirtyFields.address || missingCoordinates) {
          const geocoded = await geocodeAddress(address);
          const geoLatitude = Number(geocoded?.latitude);
          const geoLongitude = Number(geocoded?.longitude);

          if (
            !geocoded ||
            !isValidLngLat(geoLongitude, geoLatitude) ||
            (geoLongitude === 0 && geoLatitude === 0)
          ) {
            toast.error('Could not find this address on the map. Pick a suggestion from the list.');
            return;
          }

          setValue('latitude', geoLatitude, { shouldDirty: true });
          setValue('longitude', geoLongitude, { shouldDirty: true });

          const city = String(data.city || '').trim() || geocoded.city || '';
          const state = String(data.state || '').trim() || geocoded.state || '';
          const country = String(data.country || '').trim() || geocoded.country || '';
          const zipCode = String(data.zipCode || '').trim() || geocoded.postalCode || '';

          if (!String(data.city || '').trim() && city) setValue('city', city, { shouldDirty: true });
          if (!String(data.state || '').trim() && state) setValue('state', state, { shouldDirty: true });
          if (!String(data.country || '').trim() && country) {
            setValue('country', country, { shouldDirty: true });
          }
          if (!String(data.zipCode || '').trim() && zipCode) {
            setValue('zipCode', zipCode, { shouldDirty: true });
          }

          profileData = {
            ...data,
            latitude: geoLatitude,
            longitude: geoLongitude,
            city,
            state,
            country,
            zipCode,
          };
        }

        const payload = {
          ...buildUpdateProfilePayload(profileData),
          ...(staffProfile
            ? {
                bio: String(personalSummary || '').trim(),
                summary: String(personalSummary || '').trim(),
                about: String(personalSummary || '').trim(),
              }
            : {}),
        };
        const updated = await updateUser({ id: userId, ...payload }).unwrap();

        const updatedName = updated.name || payload.name;
        const updatedPhoto =
          resolveUploadedAssetUrl(data.photoURL) ||
          updated.profileIcon ||
          payload.profileIcon;

        dispatch(
          setUser({
            ...user,
            ...updated?.raw,
            basicInfo: {
              ...(user?.basicInfo || {}),
              ...(updated?.raw?.basicInfo || {}),
              name: updatedName,
              profileIcon: updatedPhoto,
            },
            name: updatedName,
            displayName: updatedName,
            profileIcon: updatedPhoto,
            photoURL: updatedPhoto,
            location: updated.location || payload.location,
            phoneNumber: updated.phoneNumber || payload.phoneNumber || user?.phoneNumber,
            email: updated.email || user?.email,
          })
        );

        toast.success('Profile updated successfully');
        refetch();

        const homePath = getDashboardRootPath(
          user?.permission,
          user?.accountState?.accountType || user?.accountType
        );
        router.replace(homePath || '/');
      } catch (err) {
        toast.error(handleApiError(err));
      }
    },
    (errors) => {
      const first = Object.values(errors || {}).find((e) => e?.message)?.message;
      toast.error(first || 'Please fix the highlighted fields.');
    }
  );

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount().unwrap();
      try {
        await logoutApi(buildLogoutPayload()).unwrap();
      } catch {
      }
      deleteConfirm.onFalse();
      toast.success('Account deleted');
      await clearLocalSession();
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  if (!userId) {
    return <Alert severity="warning">Unable to load profile. Please sign in again.</Alert>;
  }

  if (isLoading && !profile) {
    return <ModuleLoading />;
  }

  return (
    <>
      <Form methods={methods} onSubmit={onSubmit}>
        <Grid container spacing={3}>
          <Grid xs={12} md={4}>
            <Card sx={{ pt: 5, pb: 5, px: 3, textAlign: 'center' }}>
              <Field.UploadAvatar
                name="photoURL"
                maxSize={3145728}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                    <br />
                    Upload photo, then click Save changes
                  </Typography>
                }
              />
            </Card>
          </Grid>

          <Grid xs={12} md={8}>
            <Card sx={{ p: 3 }}>
              {isError ? (
                <Alert
                  severity="error"
                  sx={{ mb: 3 }}
                  action={
                    <Button color="inherit" size="small" onClick={() => refetch()}>
                      Retry
                    </Button>
                  }
                >
                  {handleApiError(error) || 'Could not load profile.'}
                </Alert>
              ) : null}

              <Box
                rowGap={3}
                columnGap={2}
                display="grid"
                gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
              >
                <Field.Text name="displayName" label="Name" />
                <Field.Text name="email" label="Email address" disabled />
                <Field.Phone name="phoneNumber" label="Phone number (optional)" />
                <Field.GoogleAddress name="address" label="Address" />
                <Field.Text name="country" label="Country" />
                <Field.Text name="state" label="State/region" />
                <Field.Text name="city" label="City" />
                <Field.Text name="zipCode" label="Zip/code" />
                {staffProfile ? (
                  <StaffMemberPersonalSummaryField
                    value={personalSummary}
                    onChange={setPersonalSummary}
                  />
                ) : null}
              </Box>

              <Stack
                spacing={3}
                alignItems="flex-end"
                sx={{ mt: 3, display: viewOnly ? 'none' : 'flex' }}
              >
                <LoadingButton type="submit" variant="contained" loading={isSubmitting || updating}>
                  Save changes
                </LoadingButton>
              </Stack>
            </Card>

            <Card
              sx={{ p: 3, mt: 3, borderColor: 'error.main', display: viewOnly ? 'none' : 'block' }}
              variant="outlined"
            >
              <Typography variant="h6" sx={{ mb: 1 }}>
                Delete account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Permanently delete your account and all associated data. This cannot be undone.
              </Typography>
              <Button color="error" variant="soft" onClick={deleteConfirm.onTrue}>
                Delete account
              </Button>
            </Card>
          </Grid>
        </Grid>
      </Form>

      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleting ? undefined : deleteConfirm.onFalse}
        title="Delete account"
        content="Are you sure you want to permanently delete your account?"
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={deleting}
            onClick={handleDeleteAccount}
          >
            Delete
          </LoadingButton>
        }
      />
    </>
  );
}
