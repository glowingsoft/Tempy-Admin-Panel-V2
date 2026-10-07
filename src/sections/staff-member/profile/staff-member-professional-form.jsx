import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { getProfileUserId } from 'src/sections/account/account-profile-utils';

import {
  DBS_STATUS_OPTIONS,
  RTW_STATUS_OPTIONS,
  TRAINING_STATUS_OPTIONS,
  getVisibleQualifications,
  loadStaffProfessionalProfile,
  saveStaffProfessionalProfile,
} from './staff-member-profile-store';
import { StaffMemberPersonalSummaryField } from './staff-member-personal-summary-field';
import { useViewOnly } from 'src/hooks/use-view-only';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  clear: 'success',
  continuous: 'success',
  valid: 'success',
  pending: 'warning',
  due_soon: 'warning',
  time_limited: 'warning',
  expired: 'error',
  overdue: 'error',
  rejected: 'error',
};

export function StaffMemberProfessionalForm() {
  const viewOnly = useViewOnly();
  const { user } = useSelector((state) => state.user);
  const userId = getProfileUserId(user);
  const [profile, setProfile] = useState(() => loadStaffProfessionalProfile(userId));

  const verificationChips = useMemo(
    () => [
      { label: 'DBS', value: profile.dbs.status },
      { label: 'Right to work', value: profile.rtw.status },
    ],
    [profile]
  );

  const visibleQualifications = useMemo(
    () => getVisibleQualifications(profile),
    [profile]
  );

  const handleSave = () => {
    saveStaffProfessionalProfile(userId, profile);
    toast.success('Professional profile saved');
  };

  const updateTraining = (id, field, value) => {
    setProfile((prev) => ({
      ...prev,
      training: prev.training.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    }));
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {verificationChips.map((item) => (
          <Chip
            key={item.label}
            label={`${item.label}: ${item.value.replace('_', ' ')}`}
            color={STATUS_COLOR[item.value] || 'default'}
            variant="soft"
            size="small"
          />
        ))}
      </Stack>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Personal summary
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          A short introduction for care homes and families — about 100 words.
        </Typography>
        <StaffMemberPersonalSummaryField
          value={profile.bio}
          onChange={(next) => setProfile((prev) => ({ ...prev, bio: next }))}
        />
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Qualifications
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Shown after a certificate is uploaded. Original documents stay on file and are not
          displayed here.
        </Typography>
        {visibleQualifications.length ? (
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {visibleQualifications.map((item) => (
              <Chip
                key={item.id}
                color="success"
                variant="soft"
                icon={<Iconify icon="solar:check-circle-bold" width={16} />}
                label={item.title}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No qualifications listed yet. Upload a certificate on the Certificates tab to make one
            visible.
          </Typography>
        )}
      </Card>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Training
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Keep mandatory courses up to date so bookings stay compliant.
        </Typography>
        <Stack spacing={2}>
          {profile.training.map((course) => (
            <Grid key={course.id} container spacing={2} alignItems="center">
              <Grid xs={12} md={5}>
                <TextField
                  fullWidth
                  label="Course"
                  value={course.name}
                  onChange={(event) => updateTraining(course.id, 'name', event.target.value)}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  value={course.status}
                  onChange={(event) => updateTraining(course.id, 'status', event.target.value)}
                >
                  {TRAINING_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  type="date"
                  label="Expires"
                  InputLabelProps={{ shrink: true }}
                  value={course.expiresOn}
                  onChange={(event) => updateTraining(course.id, 'expiresOn', event.target.value)}
                />
              </Grid>
            </Grid>
          ))}
        </Stack>
      </Card>

      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Card sx={{ p: 3, height: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Iconify icon="solar:shield-check-bold" width={22} />
              <Typography variant="h6">DBS</Typography>
            </Stack>
            <Stack spacing={2}>
              <TextField
                select
                fullWidth
                label="Status"
                value={profile.dbs.status}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, dbs: { ...prev.dbs, status: event.target.value } }))
                }
              >
                {DBS_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Certificate number"
                value={profile.dbs.certificateNumber}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    dbs: { ...prev.dbs, certificateNumber: event.target.value },
                  }))
                }
              />
              <TextField
                fullWidth
                type="date"
                label="Issue date"
                InputLabelProps={{ shrink: true }}
                value={profile.dbs.issueDate}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, dbs: { ...prev.dbs, issueDate: event.target.value } }))
                }
              />
              <TextField
                fullWidth
                type="date"
                label="Expiry date"
                InputLabelProps={{ shrink: true }}
                value={profile.dbs.expiryDate}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, dbs: { ...prev.dbs, expiryDate: event.target.value } }))
                }
              />
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card sx={{ p: 3, height: 1 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Iconify icon="solar:document-medicine-bold" width={22} />
              <Typography variant="h6">Right to work</Typography>
            </Stack>
            <Stack spacing={2}>
              <TextField
                select
                fullWidth
                label="Status"
                value={profile.rtw.status}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, rtw: { ...prev.rtw, status: event.target.value } }))
                }
              >
                {RTW_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                label="Document type"
                value={profile.rtw.documentType}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    rtw: { ...prev.rtw, documentType: event.target.value },
                  }))
                }
              />
              <TextField
                fullWidth
                type="date"
                label="Expiry date (if time-limited)"
                InputLabelProps={{ shrink: true }}
                value={profile.rtw.expiryDate}
                onChange={(event) =>
                  setProfile((prev) => ({ ...prev, rtw: { ...prev.rtw, expiryDate: event.target.value } }))
                }
              />
              <Box sx={{ color: 'text.secondary' }}>
                <Typography variant="caption">
                  Continuous leave this blank. Time-limited RTW should always have an expiry.
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Admin viewing the account cannot save it. */}
      <Stack alignItems="flex-end" sx={{ display: viewOnly ? 'none' : 'flex' }}>
        <Button variant="contained" onClick={handleSave}>
          Save professional profile
        </Button>
      </Stack>
    </Stack>
  );
}
