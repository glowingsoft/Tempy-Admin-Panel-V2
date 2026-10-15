import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

import { useTabs } from 'src/hooks/use-tabs';

import { fCurrency } from 'src/utils/format-number';
import { getStaffSpecialtyLabel, getStaffStatusLabel } from 'src/_mock/_staff';
import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { CustomTabs } from 'src/components/custom-tabs';

import { getAgencyStaffLocationOptionLabel } from 'src/sections/branches/agency-branch-utils';

import { useGetAgencyBranchesQuery } from 'src/store/Reducer/agency-branches-api';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { CareTutorStaffPanel } from 'src/sections/care-tutor/care-tutor-staff-panel';

function DetailField({ label, value }) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {label}
      </Typography>
      {typeof value === 'string' || typeof value === 'number' ? (
        <Typography variant="body2">{value}</Typography>
      ) : (
        value
      )}
    </Stack>
  );
}

function getSpecialitiesLabel(staff) {
  const values = Array.isArray(staff?.specialities)
    ? staff.specialities
    : [staff?.specialty || staff?.speciality];
  return values.map((value) => getStaffSpecialtyLabel(value)).join(', ') || '—';
}

function resolveBranchLabel(staff, branches = []) {
  if (staff?.branchName) return staff.branchName;

  const branchId = String(staff?.branch || '').trim();
  if (!branchId) return '—';

  const matched = branches.find((branch) => String(branch.id) === branchId);
  if (!matched) return branchId;

  return getAgencyStaffLocationOptionLabel(matched);
}

function ProfileCard({ staff, branchLabel, onToggleFavorite }) {
  return (
    <Card sx={{ p: 3, borderRadius: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="flex-start">
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar src={staff.avatarUrl || undefined} alt={staff.name} sx={{ width: 100, height: 100 }}>
            {staff.name?.[0]}
          </Avatar>
          {onToggleFavorite ? (
            <IconButton
              size="small"
              onClick={onToggleFavorite}
              sx={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 28,
                height: 28,
                bgcolor: 'background.paper',
                border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                '&:hover': { bgcolor: 'background.paper' },
              }}
            >
              <Iconify
                icon={staff.isFavorite ? 'solar:heart-bold' : 'solar:heart-linear'}
                width={16}
                sx={{ color: staff.isFavorite ? 'error.main' : 'text.primary' }}
              />
            </IconButton>
          ) : null}
        </Box>

        <Stack spacing={1.25} sx={{ flexGrow: 1, pt: 0.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {staff.name}
          </Typography>
          <Typography variant="body2">{staff.email}</Typography>
          <Typography variant="body2">{staff.phone}</Typography>
          {!staff.phoneVerified && staff.phoneVerified !== undefined && (
            <Typography
              variant="caption"
              sx={{ color: 'error.main', textDecoration: 'underline', display: 'block' }}
            >
              Not verified
            </Typography>
          )}
          <Box sx={{ pt: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              Gender
            </Typography>
            <Typography variant="body2">{staff.gender}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              National Insurance / Tax Number
            </Typography>
            <Typography variant="body2">
              {staff.taxNumber != null && String(staff.taxNumber).trim()
                ? String(staff.taxNumber)
                : '—'}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Divider sx={{ my: 3, borderStyle: 'dashed' }} />

      <Grid container spacing={3}>
        <Grid xs={12} sm={6}>
          <Stack spacing={2.5}>
            <DetailField label="Location" value={branchLabel} />
            <DetailField label="Specialties" value={getSpecialitiesLabel(staff)} />
            <DetailField label="Rate per hour" value={fCurrency(staff.ratePerHour ?? 0)} />
            <DetailField label="Platform percent" value={`${staff.platformPercent ?? 10}%`} />
            <DetailField label="Joined On" value={staff.joinedOn || staff.addedOn || '—'} />
          </Stack>
        </Grid>
        <Grid xs={12} sm={6}>
          <Stack spacing={2.5}>
            <DetailField label="Employee ID" value={staff.id} />
            <DetailField
              label="Status"
              value={getStaffStatusLabel(staff.status)}
            />
          </Stack>
        </Grid>
      </Grid>
    </Card>
  );
}

function DocumentPreview({ title, files = [] }) {
  const list = Array.isArray(files) ? files : [];

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{title}</Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {list.length ? (
          list.map((file, index) => {
            const name = file?.name || `document-${index + 1}`;
            const preview = file?.preview || '';
            const url = file?.url || preview || '';
            const isPdf = String(name).toLowerCase().endsWith('.pdf');
            const clickable = Boolean(url);

            return (
              <Box
                key={`${name}-${index}`}
                component={clickable ? 'a' : 'div'}
                href={clickable ? url : undefined}
                target={clickable ? '_blank' : undefined}
                rel={clickable ? 'noopener noreferrer' : undefined}
                title={name}
                sx={{
                  width: 88,
                  minHeight: 88,
                  p: 0.75,
                  borderRadius: 1,
                  overflow: 'hidden',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  textDecoration: 'none',
                  color: 'inherit',
                  cursor: clickable ? 'pointer' : 'default',
                  bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.12),
                  border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                  '&:hover': clickable
                    ? { borderColor: 'primary.main', bgcolor: 'action.hover' }
                    : undefined,
                }}
              >
                {preview && !isPdf ? (
                  <Box
                    component="img"
                    src={preview}
                    alt={name}
                    sx={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 0.5 }}
                  />
                ) : (
                  <Iconify
                    icon={isPdf ? 'solar:file-text-bold' : 'solar:document-bold'}
                    width={28}
                    sx={{ color: 'text.secondary' }}
                  />
                )}
                <Typography
                  variant="caption"
                  sx={{
                    width: 1,
                    px: 0.25,
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'text.secondary',
                  }}
                >
                  {name}
                </Typography>
              </Box>
            );
          })
        ) : (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            No documents
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}

function ReviewItem({ review }) {
  return (
    <Stack direction="row" spacing={2}>
      <Avatar
        variant="rounded"
        src={review.avatarUrl}
        alt={review.name}
        sx={{ width: 48, height: 48 }}
      />
      <Box sx={{ flexGrow: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="subtitle2">{review.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {review.postedAt}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.75 }}>
          {review.comment}
        </Typography>
        <Stack direction="row" spacing={0.25}>
          {[...Array(5)].map((_, i) => (
            <Iconify
              key={i}
              icon="eva:star-fill"
              width={14}
              sx={{ color: i < review.rating ? 'warning.main' : 'action.disabled' }}
            />
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}

function ReviewsSection({ reviews }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 3);

  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader title="Recent Reviews" />
      <CardContent>
        {!reviews.length ? (
          <Typography variant="body2" color="text.secondary">
            No reviews yet.
          </Typography>
        ) : (
          <>
            <Stack spacing={2.5} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {visible.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </Stack>
            {reviews.length > 3 && (
              <Button color="inherit" sx={{ mt: 2, px: 0 }} onClick={() => setShowAll((p) => !p)}>
                {showAll ? 'View Less' : 'View More'}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function MetricCard({ title, value }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.08),
        border: (theme) => `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
      }}
    >
      <Typography variant="h5" sx={{ mb: 0.5 }}>
        {value}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {title}
      </Typography>
    </Box>
  );
}

function JobCard({ job }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.06),
        border: (theme) => `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
      }}
    >
      <Stack spacing={1.25}>
        <Typography variant="subtitle1">{job.serviceType}</Typography>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Iconify icon="solar:map-point-bold" width={16} sx={{ color: 'error.main' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {job.location}
          </Typography>
        </Stack>
        <Typography variant="body2">{job.schedule}</Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">{fCurrency(job.totalPay)}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {fCurrency(job.hourlyRate)}/h
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}


export function AgencyStaffDetailsContent({ staff }) {
  const jobTabs = useTabs('active');
  const { user } = useSelector((state) => state.user);
  const orgId = useMemo(() => getProfileUserId(user), [user]);

  const { data: branchesData } = useGetAgencyBranchesQuery(
    { page: 0, limit: 100 },
    {
      // Layout ActiveBranchProvider already loads the same list — reuse cache.
      skip: Boolean(staff?.branchName),
      refetchOnMountOrArgChange: 60,
      refetchOnFocus: false,
    }
  );
  const branchLabel = useMemo(
    () => resolveBranchLabel(staff, branchesData?.data || []),
    [branchesData?.data, staff]
  );

  const reviews = staff.reviews || [];
  const activeJobs = staff.jobs?.active || [];
  const completedJobs = staff.jobs?.completed || [];
  const currentJobs = jobTabs.value === 'active' ? activeJobs : completedJobs;

  return (
    <Stack spacing={3}>
      {/* Row 1: Profile + Documents */}
      <Grid container spacing={3}>
        <Grid xs={12} md={7}>
          <ProfileCard staff={staff} branchLabel={branchLabel} />
        </Grid>

        <Grid xs={12} md={5}>
          <Stack spacing={3}>
            <CareTutorStaffPanel
              orgId={orgId}
              staffId={String(staff.id || staff._id || '')}
              staffName={staff.name}
              compact
            />
            <Card sx={{ p: 3, borderRadius: 2, height: 1 }}>
              <Typography variant="h6" sx={{ mb: 2.5 }}>
                Documents
              </Typography>
              <Stack spacing={3}>
                <DocumentPreview title="Government-issued ID" files={staff.documents?.governmentId} />
                <DocumentPreview title="Nursing Degree / Diploma" files={staff.documents?.nursingDegree} />
                <DocumentPreview title="Certifications (BLS, ACLS, First Aid)" files={staff.documents?.certifications} />
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Row 2: Reviews + Metrics */}
      <Grid container spacing={3}>
        <Grid xs={12} md={7}>
          <ReviewsSection reviews={reviews} />
        </Grid>

        <Grid xs={12} md={5}>
          <Grid container spacing={2}>
            <Grid xs={6}>
              <MetricCard
                title="This Month Earning"
                value={fCurrency(staff.metrics?.monthEarning ?? 0)}
              />
            </Grid>
            <Grid xs={6}>
              <MetricCard
                title="Pending Invoices"
                value={staff.metrics?.pendingInvoices ?? 0}
              />
            </Grid>
            <Grid xs={6}>
              <MetricCard
                title="Average Staff Rating"
                value={`${staff.metrics?.averageRating ?? 0} ★`}
              />
            </Grid>
            <Grid xs={6}>
              <MetricCard
                title="No-Shows This Month"
                value={String(staff.metrics?.noShows ?? 0).padStart(2, '0')}
              />
            </Grid>
            <Grid xs={12}>
              <MetricCard
                title="Late Check-ins This Month"
                value={String(staff.metrics?.lateCheckins ?? 0).padStart(2, '0')}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Row 3: Jobs */}
      <Card sx={{ borderRadius: 2 }}>
        <CardHeader title="Jobs" sx={{ pb: 0 }} />
        <CustomTabs
          value={jobTabs.value}
          onChange={jobTabs.onChange}
          sx={{
            mx: 3,
            mt: 1,
            mb: 0,
            boxShadow: (theme) =>
              `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          <Tab value="active" label="Active" />
          <Tab value="completed" label="Completed" />
        </CustomTabs>

        <CardContent>
          <Grid container spacing={2}>
            {currentJobs.map((job) => (
              <Grid key={job.id} xs={12} sm={6} md={4}>
                <JobCard job={job} />
              </Grid>
            ))}
            {!currentJobs.length && (
              <Grid xs={12}>
                <Typography variant="body2" sx={{ color: 'text.secondary', py: 3, textAlign: 'center' }}>
                  No {jobTabs.value} jobs found
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Stack>
  );
}
