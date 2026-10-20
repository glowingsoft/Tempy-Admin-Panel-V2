import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';

import { handleApiError } from 'src/store/handleApiError';
import {
  useGetUserByIdQuery,
  useUpdateUserByIdMutation,
} from 'src/store/Reducer/users-api';

import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { CareTutorStaffPanel } from 'src/sections/care-tutor/care-tutor-staff-panel';
import { useViewOnly } from 'src/hooks/use-view-only';

import { StaffMemberCertificateUploadRow } from './staff-member-certificate-upload-row';
import { StaffMemberQualificationsList } from './staff-member-qualifications-list';
import { DEFAULT_STAFF_PROFESSIONAL_PROFILE } from './staff-member-profile-store';
import {
  buildStaffProfessionalUpdatePayload,
  mapStaffProfessionalFromProfile,
} from './staff-member-profile-api-utils';


const CERTIFICATE_SLOTS = [
  {
    key: 'governmentId',
    label: 'Government-issued ID',
    icon: 'solar:card-bold-duotone',
    helperText: 'Passport, driving licence or national ID (PDF or image)',
  },
  {
    key: 'nursingDegree',
    label: 'Nursing degree / diploma',
    icon: 'solar:diploma-bold-duotone',
    helperText: 'Degree, diploma or NMC registration evidence',
  },
  {
    key: 'professionalCerts',
    label: 'Training certificates (BLS, ACLS, First Aid)',
    icon: 'solar:medal-ribbons-star-bold-duotone',
    helperText: 'Mandatory and specialist training certificates',
  },
  {
    key: 'dbsCertificate',
    label: 'DBS certificate',
    icon: 'solar:shield-check-bold-duotone',
    helperText: 'Enhanced DBS certificate PDF or scan',
  },
  {
    key: 'rightToWork',
    label: 'Right to work',
    icon: 'solar:document-medicine-bold-duotone',
    helperText: 'Visa, share code evidence or passport',
  },
  {
    key: 'other',
    label: 'Other certificates',
    icon: 'solar:document-add-bold-duotone',
    helperText: 'Any extra professional documents',
  },
];

export function StaffMemberCertificatesForm() {
  const viewOnly = useViewOnly();
  const { user } = useSelector((state) => state.user);
  const userId = getProfileUserId(user);

  const {
    data: apiProfile,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetUserByIdQuery(userId, { skip: !userId });

  const [updateUser, { isLoading: saving }] = useUpdateUserByIdMutation();
  const [profile, setProfile] = useState(DEFAULT_STAFF_PROFESSIONAL_PROFILE);

  useEffect(() => {
    if (!apiProfile) return;
    setProfile(mapStaffProfessionalFromProfile(apiProfile));
  }, [apiProfile]);

  const certificates = profile.certificates || {};

  const handleChange = (key) => (nextFiles) => {
    setProfile((prev) => ({
      ...prev,
      certificates: {
        ...(prev.certificates || {}),
        [key]: nextFiles,
      },
    }));
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error('User id not found. Please sign in again.');
      return;
    }
    try {
      await updateUser({
        id: userId,
        ...buildStaffProfessionalUpdatePayload(profile),
      }).unwrap();
      toast.success('Certificates saved');
      refetch();
    } catch (err) {
      toast.error(handleApiError(err));
    }
  };

  if (isLoading && !apiProfile) {
    return <ModuleLoading />;
  }

  if (isError && !apiProfile) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        {error?.data?.message || error?.error || 'Could not load certificates'}
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <CareTutorStaffPanel
        orgId={userId}
        staffId={userId}
        staffName={user?.name || user?.fullName || user?.basicInfo?.name || 'You'}
      />

      <StaffMemberQualificationsList
        qualifications={profile.qualifications || []}
        onChange={
          viewOnly
            ? undefined
            : (qualifications) => setProfile((prev) => ({ ...prev, qualifications }))
        }
      />

      <Card sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Iconify icon="solar:diploma-bold" width={22} />
          <Typography variant="h6">Upload certificates</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Upload your ID, training and DBS files here so care homes can verify you. PDF, Word or
          image.
        </Typography>

        <Stack spacing={1.5}>
          {CERTIFICATE_SLOTS.map((slot) => (
            <StaffMemberCertificateUploadRow
              key={slot.key}
              label={slot.label}
              icon={slot.icon}
              helperText={slot.helperText}
              files={certificates[slot.key] || []}
              onChange={handleChange(slot.key)}
            />
          ))}
        </Stack>
      </Card>

      <Stack alignItems="flex-end" sx={{ display: viewOnly ? 'none' : 'flex' }}>
        <LoadingButton variant="contained" loading={saving} onClick={handleSave}>
          Save certificates
        </LoadingButton>
      </Stack>
    </Stack>
  );
}
