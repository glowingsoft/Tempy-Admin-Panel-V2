import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';

import { fCurrency, fNumber } from 'src/utils/format-number';
import { fDate, fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ModuleLoading } from 'src/components/loading-screen';

import { handleApiError } from 'src/store/handleApiError';
import { resolveProfileAssetUrl } from 'src/store/Reducer/upload-api';

import {
  CARE_HOME_TYPE_OPTIONS,
  SUPPLIER_BUSINESS_TYPE_OPTIONS,
} from 'src/sections/auth/jwt/care-home-register-utils';

import { extractAdminCredentials } from '../../shared/admin-users-api-utils';
import { useGetAdminUserByIdQuery } from 'src/store/Reducer/admin-users-api';
import { useGetUserByIdQuery, useUpdateUserByIdMutation } from 'src/store/Reducer/users-api';

import {
  impersonateAgency,
  impersonateCareHome,
  impersonateHospital,
  impersonateLocalAuthority,
  impersonateIndividualHomeCare,
  impersonateHomeCareCompany,
  impersonateStaffMember,
} from '../../admin-impersonation-utils';
import {
  ADMIN_ORG_PROFILE_KINDS,
  EMPTY_ORG_PROFILE_EXTRAS,
  extrasFromRecord,
  recordFromUserProfile,
  buildOrgProfileUserPutPayload,
  mergeOrgProfileExtras,
  saveOrgProfileExtras,
} from '../admin-org-profile-store';

// ----------------------------------------------------------------------

const IMPERSONATE = {
  agencies: (row, ctx) => impersonateAgency({ agency: row, ...ctx }),
  'care-homes': (row, ctx) => impersonateCareHome({ careHome: row, ...ctx }),
  hospitals: (row, ctx) => impersonateHospital({ hospital: row, ...ctx }),
  'local-authority': (row, ctx) => impersonateLocalAuthority({ record: row, ...ctx }),
  'individual-home-care': (row, ctx) => impersonateIndividualHomeCare({ record: row, ...ctx }),
  'home-care-companies': (row, ctx) => impersonateHomeCareCompany({ record: row, ...ctx }),
  'staff-members': (row, ctx) => impersonateStaffMember({ record: row, ...ctx }),
};

function asDisplayText(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  const text = value.trim();
  return text === '[object Object]' ? '' : text;
}

function formatMetric(value, { money = false } = {}) {
  if (value == null || value === '') return '—';
  if (typeof value === 'object') return '—';
  if (money) return fCurrency(value) || '—';
  return fNumber(value) || '—';
}

function withoutEmpty(source) {
  if (!source || typeof source !== 'object') return {};
  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function getActivityStats(record, group) {
  if (!record) return [];
  if (group === 'Customer') {
    return [
      { label: 'Spendings', value: formatMetric(record.spendings, { money: true }) },
      { label: 'Jobs posted', value: formatMetric(record.jobsPosted) },
      { label: 'Bookings', value: formatMetric(record.bookings ?? record.activeJobs) },
    ];
  }
  return [
    { label: 'Earnings', value: formatMetric(record.earnings, { money: true }) },
    { label: 'Bookings', value: formatMetric(record.bookings ?? record.activePlacements) },
    { label: 'Completed jobs', value: formatMetric(record.completedJobs) },
    { label: 'Active shifts', value: formatMetric(record.activeShifts) },
  ];
}

const SERVICE_AUDIENCE_LABELS = {
  careHome: 'Care homes',
  hospital: 'Hospitals',
  localAuthority: 'Local authorities',
  user: 'Individuals',
};

function formatVerification(value) {
  if (value === true) return 'Verified';
  if (value === false) return 'Not verified';
  const text = asDisplayText(value);
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

const BUSINESS_TYPE_LABELS = Object.fromEntries(
  [...SUPPLIER_BUSINESS_TYPE_OPTIONS, ...CARE_HOME_TYPE_OPTIONS].map((option) => [option.value, option.label])
);

function formatBusinessType(value) {
  const text = asDisplayText(value);
  return BUSINESS_TYPE_LABELS[text] || text;
}

const BRANCH_STATUS_COLORS = { active: 'success', pending: 'warning', inactive: 'error' };

function getAccountDetails(record, { isStaffMember, isPerson, isSupplier }) {
  if (!record) return [];
  const verification = record.verificationStatus || record.raw?.verificationStatus || {};
  const servicesTo = record.provideServicesTo || record.raw?.provideServicesTo;
  const audiences = servicesTo
    ? Object.entries(servicesTo)
      .filter(([, enabled]) => enabled)
      .map(([key]) => SERVICE_AUDIENCE_LABELS[key] || key)
      .join(', ')
    : '';

  return [
    ...(isPerson
      ? [
        { label: 'Gender', value: asDisplayText(record.gender) },
        { label: 'Date of birth', value: record.dob ? fDate(record.dob) : '' },
      ]
      : []),
    ...(isStaffMember ? [{ label: 'Tax number', value: asDisplayText(record.taxNumber) }] : []),
    { label: 'Timezone', value: asDisplayText(record.timezone) },
    ...(isSupplier
      ? [
        { label: 'Service radius', value: record.radius != null ? `${record.radius} km` : '' },
        { label: 'Provides services to', value: audiences },
      ]
      : []),
    { label: 'Email verification', value: formatVerification(verification.email) },
    { label: 'Phone verification', value: formatVerification(verification.phoneNumber) },
    { label: 'ID verification (Persona)', value: formatVerification(verification.persona) },
    { label: 'Joined', value: record.registeredAt || record.raw?.createdAt ? fDate(record.registeredAt || record.raw?.createdAt) : '' },
    { label: 'Last signed in', value: record.raw?.lastSignedIn ? fDateTime(record.raw.lastSignedIn) : '' },
    { label: 'Profile', value: formatProfileCompletion(record.raw) },
    { label: 'Terms accepted', value: formatTermsAccepted(record.raw?.termsAccepted) },
  ];
}

function fileExtensionSuffix(url) {
  const match = String(url || '').match(/\.([a-z0-9]{2,5})(\?|$)/i);
  return match ? ` (${match[1].toUpperCase()})` : '';
}

function formatProfileCompletion(raw) {
  const complete = raw?.completeDetails ?? raw?.accountState?.completeDetails;
  if (complete === true) return 'Complete';
  if (complete === false) return 'Incomplete';
  return '';
}

function formatTermsAccepted(terms) {
  if (!terms || typeof terms !== 'object') return '';
  if (!terms.acceptedAt) return 'Not accepted';
  return `Version ${terms.version} on ${fDate(terms.acceptedAt)}`;
}

export function AdminOrgProfileView() {
  const { id = '' } = useParams();
  const location = useLocation();
  const kind = location.pathname.split('/').filter(Boolean)[1] || '';
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);

  const config = ADMIN_ORG_PROFILE_KINDS[kind];
  const stateRow = location.state?.row;

  const { data: apiUser, isLoading, isError } = useGetAdminUserByIdQuery(id, {
    skip: !id,
  });
  const { data: usersApiProfile, isLoading: isUsersApiLoading } = useGetUserByIdQuery(id, {
    skip: !id,
  });
  const [updateUserById, { isLoading: isSavingProfile }] = useUpdateUserByIdMutation();

  const record = useMemo(() => {
    const fromUsersApi = recordFromUserProfile(usersApiProfile) || {};
    // Skip missing values so a later source can't blank out stats an earlier one returned.
    const merged = {
      ...withoutEmpty(stateRow),
      ...withoutEmpty(apiUser),
      ...withoutEmpty(fromUsersApi),
    };
    return {
      ...merged,
      name: asDisplayText(fromUsersApi.name || apiUser?.name || stateRow?.name),
      companyName: asDisplayText(fromUsersApi.companyName || merged.companyName),
      registrationNumber: asDisplayText(
        fromUsersApi.registrationNumber || merged.registrationNumber
      ),
      type: asDisplayText(fromUsersApi.type || merged.type),
      email: asDisplayText(fromUsersApi.email || apiUser?.email || stateRow?.email),
      phone: asDisplayText(fromUsersApi.phone || apiUser?.phone || stateRow?.phone),
      location: asDisplayText(fromUsersApi.location || apiUser?.location || stateRow?.location),
      city: asDisplayText(fromUsersApi.city || merged.city),
      country: asDisplayText(fromUsersApi.country || merged.country),
      avatarUrl: asDisplayText(fromUsersApi.avatarUrl || apiUser?.avatarUrl || stateRow?.avatarUrl),
    };
  }, [apiUser, stateRow, usersApiProfile]);

  const displayName = useMemo(() => {
    const name = record?.name;
    if (typeof name === 'string' && name.trim() && name !== '[object Object]') return name.trim();
    return config?.label || 'Profile';
  }, [config?.label, record?.name]);

  const isStaffMember = kind === 'staff-members';
  const isPerson = isStaffMember || kind === 'individual-home-care';

  const credentials = useMemo(() => {
    if (Array.isArray(record?.credentials) && record.credentials.length) return record.credentials;
    return extractAdminCredentials(record?.raw || {});
  }, [record]);

  const reviews = useMemo(() => {
    if (Array.isArray(record?.reviews) && record.reviews.length) return record.reviews;
    return Array.isArray(record?.raw?.reviews) ? record.raw.reviews : [];
  }, [record]);

  const jobRoles = useMemo(() => {
    if (Array.isArray(record?.jobRoles) && record.jobRoles.length) return record.jobRoles;
    return Array.isArray(record?.raw?.jobRoles) ? record.raw.jobRoles : [];
  }, [record]);

  const addresses = useMemo(() => {
    if (Array.isArray(record?.addresses) && record.addresses.length) return record.addresses;
    return Array.isArray(record?.raw?.addresses) ? record.raw.addresses : [];
  }, [record]);

  const branches = useMemo(() => {
    if (Array.isArray(record?.branches) && record.branches.length) return record.branches;
    return Array.isArray(record?.raw?.branches) ? record.raw.branches : [];
  }, [record]);

  const [extras, setExtras] = useState({ ...EMPTY_ORG_PROFILE_EXTRAS });

  useEffect(() => {
    const fromApi = extrasFromRecord(record);
    setExtras((prev) =>
      mergeOrgProfileExtras({
        bio: fromApi.bio || prev.bio,
        instructions: fromApi.instructions || prev.instructions,
        images: fromApi.images?.length ? fromApi.images : prev.images,
        documents: fromApi.documents?.length ? fromApi.documents : prev.documents,
      })
    );
  }, [kind, id, record]);

  useEffect(() => {
    if (location.hash !== '#activity') return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById('activity')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.hash, record?.id]);

  const persistProfile = async (nextExtras, successMessage) => {
    saveOrgProfileExtras(kind, id, nextExtras);
    if (!id) {
      if (successMessage) toast.success(successMessage);
      return;
    }
    await updateUserById({
      id,
      ...buildOrgProfileUserPutPayload({
        record,
        extras: nextExtras,
        usersApiProfile,
      }),
    }).unwrap();
    if (successMessage) toast.success(successMessage);
  };

  const handleSave = async () => {
    try {
      await persistProfile(extras, 'Profile saved');
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not save profile');
    }
  };

  const handleOpenDashboard = useCallback(() => {
    if (!record) return;
    const run = IMPERSONATE[kind];
    if (!run) {
      toast.info('Dashboard for this type is not available yet');
      return;
    }
    run(record, { adminUser: user, dispatch, router });
  }, [dispatch, kind, record, router, user]);

  if (!config) {
    return (
      <DashboardContent>
        <Alert severity="warning">Unknown organisation type.</Alert>
      </DashboardContent>
    );
  }

  const profileLoading = (isLoading || isUsersApiLoading) && !record?.id;

  return (
    <DashboardContent maxWidth="lg">
      <CustomBreadcrumbs
        heading={displayName}
        links={[
          { name: 'Dashboard', href: paths.adminDashboard.root },
          { name: config.label, href: config.listPath },
          { name: 'Profile' },
        ]}
        action={
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="solar:eye-bold" />}
            onClick={handleOpenDashboard}
            disabled={!record}
          >
            Open dashboard
          </Button>
        }
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      {profileLoading ? <ModuleLoading /> : null}
      {isError && !record ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          Could not load this profile from the API. Open it from the list to add bio and files.
        </Alert>
      ) : null}

      {profileLoading ? null : (
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
              <Avatar src={record?.avatarUrl} alt={displayName} sx={{ width: 72, height: 72 }}>
                {displayName?.[0]}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                  <Typography variant="h5">{displayName}</Typography>
                  <Label variant="soft">{config.group}</Label>
                  <Label variant="soft" color="info">
                    {config.label}
                  </Label>
                  {record?.blueTick ? (
                    <Label variant="soft" color="primary" startIcon={<Iconify icon="solar:verified-check-bold" />}>
                      Blue tick
                    </Label>
                  ) : null}
                  {Number(record?.totalReviews) > 0 ? (
                    <Label variant="soft" color="warning" startIcon={<Iconify icon="material-symbols:star" />}>
                      {Number(record.rating || 0).toFixed(1)} ({record.totalReviews}{' '}
                      {Number(record.totalReviews) === 1 ? 'review' : 'reviews'})
                    </Label>
                  ) : null}
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {[asDisplayText(record?.email), asDisplayText(record?.phone), asDisplayText(record?.location)]
                    .filter(Boolean)
                    .join(' · ') || 'No contact details on file'}
                </Typography>
                {asDisplayText(record?.companyName) || asDisplayText(record?.registrationNumber) ? (
                  <Typography variant="body2" color="text.secondary">
                    {[
                      asDisplayText(record.companyName),
                      asDisplayText(record.registrationNumber) &&
                      `Reg. ${asDisplayText(record.registrationNumber)}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                ) : null}
              </Box>
              <Button component={RouterLink} href={config.listPath} color="inherit">
                Back to list
              </Button>
            </Stack>
          </Card>

          <Card id="activity" sx={{ p: 3, scrollMarginTop: 96 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {config.group === 'Customer' ? 'Spendings & bookings' : 'Earnings & bookings'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              Activity for this {config.label.toLowerCase()}. Open the dashboard to see jobs and
              shifts in full.
            </Typography>
            <Grid container spacing={2}>
              {getActivityStats(record, config.group).map((stat) => (
                <Grid key={stat.label} xs={6} sm={3}>
                  <Box
                    sx={{
                      p: 2,
                      height: 1,
                      borderRadius: 1.5,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      {stat.label}
                    </Typography>
                    <Typography variant="h6" sx={{ mt: 0.5 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2.5 }}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:eye-bold" />}
                onClick={handleOpenDashboard}
                disabled={!record}
              >
                Open dashboard
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="solar:calendar-bold" />}
                onClick={handleOpenDashboard}
                disabled={!record}
              >
                View bookings
              </Button>
            </Stack>
          </Card>

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {isPerson ? 'Personal details' : 'Organisation details'}
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Company', value: asDisplayText(record?.companyName) },
                { label: 'Registration no.', value: asDisplayText(record?.registrationNumber) },
                { label: 'Business type', value: formatBusinessType(record?.type) },
                { label: 'Phone', value: asDisplayText(record?.phone) },
                { label: 'Email', value: asDisplayText(record?.email) },
                { label: 'Address', value: asDisplayText(record?.location) },
                { label: 'City', value: asDisplayText(record?.city) },
                { label: 'Country', value: asDisplayText(record?.country) },
                ...getAccountDetails(record, { isStaffMember, isPerson, isSupplier: config.group === 'Supplier' }),
              ]
                .filter((item) => item.value)
                .map((item) => (
                  <Grid key={item.label} xs={12} sm={6}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {item.label}
                    </Typography>
                    <Typography variant="body2">{item.value}</Typography>
                  </Grid>
                ))}
            </Grid>
          </Card>

          {jobRoles.length ? (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Job roles ({jobRoles.length})
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {jobRoles.map((role, index) => {
                  const title = asDisplayText(role?.title) || asDisplayText(role?.name) || asDisplayText(role);
                  const department = asDisplayText(role?.department);
                  return (
                    <Chip
                      key={role?._id || `${title}-${index}`}
                      variant="soft"
                      label={department ? `${department} · ${title}` : title}
                    />
                  );
                })}
              </Stack>
            </Card>
          ) : null}

          {branches.length ? (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Branches ({branches.length})
              </Typography>
              <Stack spacing={2} divider={<Divider flexItem />}>
                {branches.map((branch) => {
                  const branchName = asDisplayText(branch.name) || 'Branch';
                  const branchLocation = branch.location || {};
                  const address =
                    asDisplayText(branchLocation.fullAddress) ||
                    [branchLocation.city, branchLocation.state, branchLocation.country]
                      .map(asDisplayText)
                      .filter(Boolean)
                      .join(', ');
                  const status = asDisplayText(branch.status);
                  const cqc = branch.cqc || {};
                  const insurance = branch.insurance || {};
                  const compliance = [
                    {
                      label: 'CQC',
                      detail: asDisplayText(cqc.registrationNumber) && `Reg. ${cqc.registrationNumber}`,
                      url: resolveProfileAssetUrl(cqc.certificate),
                      verified: cqc.verified,
                    },
                    {
                      label: 'Insurance',
                      detail: insurance.expiryDate && `Expires ${fDate(insurance.expiryDate)}`,
                      url: resolveProfileAssetUrl(insurance.certificate),
                      verified: insurance.verified,
                    },
                    ...(branch.persona && typeof branch.persona === 'object'
                      ? [{ label: 'ID verification', always: true, verified: branch.persona.verified }]
                      : []),
                  ].filter((item) => item.always || item.detail || item.url);

                  return (
                    <Stack key={branch._id} direction="row" spacing={2}>
                      <Avatar
                        src={resolveProfileAssetUrl(branch.profileIcon)}
                        alt={branchName}
                        variant="rounded"
                        sx={{ width: 48, height: 48 }}
                      >
                        {branchName[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle2">{branchName}</Typography>
                          {status ? (
                            <Label
                              variant="soft"
                              color={BRANCH_STATUS_COLORS[status] || 'default'}
                              sx={{ textTransform: 'capitalize' }}
                            >
                              {status}
                            </Label>
                          ) : null}
                        </Stack>
                        {address ? (
                          <Typography variant="body2" color="text.secondary">
                            {address}
                          </Typography>
                        ) : null}
                        {asDisplayText(branch.bio) ? (
                          <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                            {branch.bio}
                          </Typography>
                        ) : null}
                        {compliance.length ? (
                          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                            {compliance.map((item) => (
                              <Stack key={item.label} direction="row" spacing={0.75} alignItems="center">
                                <Typography variant="caption" fontWeight={700}>
                                  {item.label}
                                </Typography>
                                {item.detail ? (
                                  <Typography variant="caption" color="text.secondary">
                                    {item.detail}
                                  </Typography>
                                ) : null}
                                {item.url ? (
                                  <Link
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    underline="hover"
                                    variant="caption"
                                  >
                                    Certificate
                                  </Link>
                                ) : null}
                                <Label variant="soft" color={item.verified ? 'success' : 'warning'}>
                                  {item.verified ? 'Verified' : 'Unverified'}
                                </Label>
                              </Stack>
                            ))}
                          </Stack>
                        ) : null}
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </Card>
          ) : null}

          {addresses.length ? (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Saved addresses ({addresses.length})
              </Typography>
              <Stack spacing={1.5}>
                {addresses.map((address, index) => {
                  const addressLocation = address?.location || {};
                  const text =
                    asDisplayText(addressLocation.fullAddress) ||
                    [addressLocation.city, addressLocation.state, addressLocation.postalCode, addressLocation.country]
                      .map(asDisplayText)
                      .filter(Boolean)
                      .join(', ');
                  const status = asDisplayText(address?.status);
                  return (
                    <Stack
                      key={address?._id || index}
                      direction="row"
                      spacing={1.5}
                      alignItems="flex-start"
                      sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}
                    >
                      <Iconify icon="solar:map-point-bold" width={20} sx={{ mt: 0.25, color: 'text.secondary' }} />
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                          <Typography variant="subtitle2">{asDisplayText(address?.title) || `Address ${index + 1}`}</Typography>
                          {status ? (
                            <Label variant="soft" color={BRANCH_STATUS_COLORS[status] || 'default'} sx={{ textTransform: 'capitalize' }}>
                              {status}
                            </Label>
                          ) : null}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                          {text || 'No address details'}
                        </Typography>
                      </Box>
                    </Stack>
                  );
                })}
              </Stack>
            </Card>
          ) : null}

          {isStaffMember || credentials.length ? (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                {isStaffMember ? 'Credentials' : 'Documents'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isStaffMember
                  ? 'Identity, degree and certification files uploaded by this staff member.'
                  : 'Identity and verification files uploaded by this account.'}
              </Typography>
              {credentials.length ? (
                <Stack spacing={2.5}>
                  {credentials.map((group) => (
                    <Box key={group.key}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {group.label}
                      </Typography>
                      <Box
                        sx={{
                          display: 'grid',
                          gap: 1.5,
                          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                        }}
                      >
                        {group.urls.map((url, index) =>
                          /\.(png|jpe?g|jfif|gif|webp|avif|bmp|svg)(\?|$)/i.test(url) ? (
                            <Box
                              key={url}
                              component="a"
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ display: 'block' }}
                            >
                              <Box
                                component="img"
                                src={url}
                                alt={`${group.label} ${index + 1}`}
                                sx={{ width: 1, height: 120, objectFit: 'cover', borderRadius: 1 }}
                              />
                            </Box>
                          ) : (
                            <Link
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              underline="hover"
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'background.neutral',
                                typography: 'body2',
                              }}
                            >
                              <Iconify icon="solar:file-bold" width={18} />
                              {`${group.label} ${index + 1}${fileExtensionSuffix(url)}`}
                            </Link>
                          )
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No credentials uploaded.
                </Typography>
              )}
            </Card>
          ) : null}

          {config.group === 'Supplier' || reviews.length ? (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Reviews{reviews.length ? ` (${reviews.length})` : ''}
              </Typography>
              {reviews.length ? (
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {reviews.map((review) => {
                    const reviewer = review.subject && typeof review.subject === 'object' ? review.subject : {};
                    const reviewerName = asDisplayText(reviewer.name) || 'Anonymous';
                    return (
                      <Stack key={review._id} direction="row" spacing={2}>
                        <Avatar src={resolveProfileAssetUrl(reviewer.profileIcon)} alt={reviewerName}>
                          {reviewerName[0]}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="subtitle2">{reviewerName}</Typography>
                            <Rating value={Number(review.rating) || 0} precision={0.5} size="small" readOnly />
                            {review.createdAt ? (
                              <Typography variant="caption" color="text.disabled">
                                {fDate(review.createdAt)}
                              </Typography>
                            ) : null}
                          </Stack>
                          {asDisplayText(review.jobName) ? (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Job: {review.jobName}
                            </Typography>
                          ) : null}
                          {asDisplayText(review.comment) ? (
                            <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word' }}>
                              {review.comment}
                            </Typography>
                          ) : null}
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No reviews yet.
                </Typography>
              )}
            </Card>
          ) : null}

          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Bio
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Who they are and how they work.
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              value={extras.bio || ''}
              onChange={(event) => setExtras((prev) => ({ ...prev, bio: event.target.value }))}
              placeholder="About this organisation or person..."
            />
          </Card>

          <Stack alignItems="flex-end">
            <LoadingButton
              variant="contained"
              loading={isSavingProfile}
              onClick={handleSave}
            >
              Save profile details
            </LoadingButton>
          </Stack>
        </Stack>
      )}
    </DashboardContent>
  );
}
