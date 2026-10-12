import { useMemo, useCallback, useState, useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePathname, useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { usePersistedViewMode } from 'src/hooks/use-persisted-view-mode';
import { useViewOnly } from 'src/hooks/use-view-only';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { JobMediaThumb } from 'src/components/jobs/job-image';
import { ModuleLoading } from 'src/components/loading-screen';

import {
  useCreateCareHomeJobMutation,
  useDeleteCareHomeJobMutation,
  useGetCareHomeJobsQuery,
  useLazyGetCareHomeJobByIdQuery,
  useUpdateCareHomeJobMutation,
} from 'src/store/Reducer/care-home-jobs-api';
import {
  useCreateHospitalJobMutation,
  useDeleteHospitalJobMutation,
  useGetHospitalJobsQuery,
  useLazyGetHospitalJobByIdQuery,
  useUpdateHospitalJobMutation,
} from 'src/store/Reducer/hospital-jobs-api';
import {
  useCreateUserJobMutation,
  useDeleteUserJobMutation,
  useGetUserJobsQuery,
  useLazyGetUserJobByIdQuery,
  useUpdateUserJobMutation,
} from 'src/store/Reducer/user-jobs-api';
import {
  useCreateLocalAuthorityJobMutation,
  useDeleteLocalAuthorityJobMutation,
  useGetLocalAuthorityJobsQuery,
  useLazyGetLocalAuthorityJobByIdQuery,
  useUpdateLocalAuthorityJobMutation,
} from 'src/store/Reducer/local-authority-jobs-api';
import { useGetCareHomeBranchesQuery } from 'src/store/Reducer/care-home-branches-api';
import { useGetHospitalBranchesQuery } from 'src/store/Reducer/hospital-branches-api';
import { useGetLocalAuthorityBranchesQuery } from 'src/store/Reducer/local-authority-branches-api';
import { useGetHomeCareCompanyBranchesQuery } from 'src/store/Reducer/home-care-company-branches-api';
import { useUserAddressesQuery } from 'src/store/Reducer/user-branches-api';
import {
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useUpdateReviewMutation,
} from 'src/store/Reducer/reviews-api';
import { mapReviewMutationResponse, resolveReviewSubmitTarget } from 'src/sections/reviews/reviews-api-utils';
import { useJobsWithReviews } from 'src/sections/reviews/use-jobs-with-reviews';
import { usePrepareJobReview } from 'src/sections/reviews/use-prepare-job-review';
import { useActiveBranch } from 'src/sections/branches/active-branch-context';
import { useRoleJobTypes } from 'src/sections/job-roles/use-role-job-types';
import { jobMatchesActiveBranch } from 'src/sections/branches/active-branch';

import {
  buildCareHomeJobPayload,
  isJobCreateSoftError,
} from '../care-home-job-api-utils';
import { PostJobDialog } from '../post-job-dialog';
import { ClosedJobReview } from '../closed-job-review';
import { LeaveJobReviewDialog } from '../leave-job-review-dialog';
import { JobTypesProvider } from '../context/job-types-provider';
import { EMPTY_JOB_LIST_FILTERS, JobListFilterBar, hasJobListFilters } from '../job-list-filter-bar';
import { appendAgencyJobRequest } from '../agency-job-request';
import { JobAttendanceDialog } from 'src/sections/staff-member/jobs/job-attendance-dialog';
import {
  ACTIVE_JOB_HORIZON_OPTIONS,
  CREATED_JOB_API_STATUS_OPTIONS,
  CREATED_JOB_FILL_OPTIONS,
  countJobsByApiStatus,
  formatJobStartsInLabel,
  formatScheduleLabel,
  getGenderLabel,
  getJobStatusConfig,
  isEmployerJobCompleted,
  isJobPendingFill,
  isJobScheduledWithWorkers,
  jobMayHaveAttendance,
  jobHasWorkerRating,
  getWorkerRatingOption,
  jobMatchesDashboardFilter,
  normalizeJobStatus,
  normalizeReceivingBids,
  resolveJobApiStatus,
  sortJobsByCreatedAtDesc,
  sortSchedulesByStart,
} from '../care-home-job-utils';

const ROWS_PER_PAGE_GRID = 12;
const ROWS_PER_PAGE_LIST = 10;


const GENDER_LABELS = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
};

function JobStatusBadges({ job }) {
  const receivingBids = normalizeReceivingBids(job);
  const status = normalizeJobStatus(job.apiStatus || job.status);
  const statusConfig = getJobStatusConfig(status);

  return (
    <>
      {receivingBids ? (
        <Chip label="Receiving bids" size="small" color="info" variant="soft" />
      ) : (
        <Chip
          label={statusConfig.label}
          size="small"
          color={statusConfig.color}
          variant="soft"
        />
      )}
    </>
  );
}

function getBidsHref(pathname = '', jobId) {
  const base =
    pathname.includes('/jobs/')
      ? pathname.replace(/\/jobs\/[^/?]+$/, '/jobs/bids')
      : paths.dashboard.jobs.bids;

  if (!jobId) return base;
  return `${base}?jobId=${encodeURIComponent(jobId)}`;
}

function getCreatedJobDetailsHref(pathname, jobId) {
  const current = String(pathname || '').replace(/\/+$/, '');
  const createdBase = current.includes('/jobs/')
    ? current.replace(/\/jobs\/.*$/, '/jobs/created')
    : paths.dashboard.jobs.created;

  if (!jobId) return createdBase;
  return `${createdBase}/${encodeURIComponent(jobId)}`;
}

function jobHasBids(job) {
  return (
    Number(job?.bidCount) > 0 ||
    Number(job?.acceptedBidsCount) > 0 ||
    Boolean(job?.hasAcceptedBid)
  );
}

function CreatedJobHeading({ job, startsInLabel }) {
  const status = normalizeJobStatus(job.apiStatus || job.status);
  const statusChip = getJobStatusConfig(status);
  const hasBids = jobHasBids(job);
  const completed = isEmployerJobCompleted(job);
  const rated = jobHasWorkerRating(job);
  const ratingLabel = rated ? getWorkerRatingOption(job.review)?.label : '';
  const canEdit = status !== 'deleted' && !hasBids && !completed;
  const showDetailsHint = status !== 'deleted' && hasBids && !completed;

  return (
    <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="subtitle1" fontWeight={700} noWrap>
        {job.title || job.type}
      </Typography>
      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
        <Chip label={statusChip.label} size="small" color={statusChip.color} variant="soft" />
        {completed && !rated ? (
          <Chip
            label="Rating required"
            size="small"
            color="warning"
            variant="filled"
            icon={<Iconify icon="eva:star-fill" width={14} />}
          />
        ) : null}
        {completed && rated && ratingLabel ? (
          <Chip label={ratingLabel} size="small" color="primary" variant="soft" />
        ) : null}
        {Number(job.hourlyRate) > 0 ? (
          <Chip
            label={`${fCurrency(job.hourlyRate)}/h`}
            size="small"
            variant="outlined"
            color="primary"
          />
        ) : null}
        {canEdit ? (
          <Chip
            label="Increase rate"
            size="small"
            color="warning"
            variant="outlined"
            icon={<Iconify icon="solar:tag-price-bold" width={14} />}
          />
        ) : null}
        {showDetailsHint ? (
          <Chip
            label="Tap for details"
            size="small"
            color="primary"
            variant="outlined"
            icon={<Iconify icon="solar:eye-bold" width={14} />}
          />
        ) : null}
        {completed && !rated ? (
          <Chip
            label="Tap to rate"
            size="small"
            color="warning"
            variant="outlined"
            icon={<Iconify icon="eva:star-outline" width={14} />}
          />
        ) : null}
      </Stack>
      {startsInLabel ? (
        <Box>
          <Chip label={startsInLabel} size="small" color="warning" variant="soft" />
        </Box>
      ) : null}
    </Stack>
  );
}

function CreatedJobCard({ job, viewMode = 'grid', onDelete, onLeaveReview, onOpen, onOpenAttendance }) {
  const pathname = usePathname();
  const router = useRouter();
  const bidsHref = getBidsHref(pathname, job.id);
  const detailsHref = getCreatedJobDetailsHref(pathname, job.id);
  const status = normalizeJobStatus(job.apiStatus || job.status);
  const receivingBids = normalizeReceivingBids(job);
  const bidCount = Number(job.bidCount) || 0;
  const completed = isEmployerJobCompleted(job);
  const rated = jobHasWorkerRating(job);
  const showAttendance =
    typeof onOpenAttendance === 'function' && (completed || jobMayHaveAttendance(job));
  const showBidsAction = !completed && (status === 'active' || receivingBids || bidCount > 0);
  const canEdit = status !== 'deleted' && !jobHasBids(job) && !completed;
  const openHint = completed
    ? rated
      ? 'Click to view this completed job'
      : 'Click to rate the worker'
    : canEdit
      ? 'No bids yet — click to increase the rate or edit this job'
      : 'Click to view job details';
  const orderedSchedules = sortSchedulesByStart(job.schedules);
  const primarySchedule = orderedSchedules[0];
  const scheduleSummary = primarySchedule
    ? formatScheduleLabel(primarySchedule, job)
    : 'No schedule';
  const hasMultipleSchedules = orderedSchedules.length > 1;
  const startsInLabel = status === 'active' && !completed ? formatJobStartsInLabel(job) : '';

  const cardSx = completed
    ? {
      borderLeft: (theme) =>
        `4px solid ${theme.vars.palette[rated ? 'success' : 'warning'].main}`,
    }
    : {};

  const handleOpen = () => {
    if (onOpen) {
      onOpen(job);
      return;
    }
    router.push(detailsHref);
  };

  if (viewMode === 'list') {
    return (
      <Card
        onClick={handleOpen}
        sx={{
          p: 1.5,
          borderRadius: 2,
          boxShadow: '0 2px 12px rgba(99, 115, 129, 0.1)',
          cursor: 'pointer',
          ...cardSx,
        }}
        title={openHint}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={{ xs: 1, md: 2 }}
        >
          <JobMediaThumb
            image={job.image}
            alt={job.type}
            width={56}
            height={56}
            sx={{ flexShrink: 0 }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <CreatedJobHeading job={job} startsInLabel={startsInLabel} />
            {hasMultipleSchedules && (
              <Chip
                label={`${orderedSchedules.length} shifts`}
                size="small"
                variant="outlined"
                sx={{ mt: 0.75 }}
              />
            )}

            <Tooltip title={scheduleSummary} arrow>
              <Typography variant="body2" color="text.secondary" noWrap sx={{ lineHeight: 1.45 }}>
                {scheduleSummary}
                {hasMultipleSchedules ? ` · +${orderedSchedules.length - 1} more` : ''}
              </Typography>
            </Tooltip>

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.35, minWidth: 0 }}>
              <Iconify icon="solar:map-point-bold" width={14} sx={{ color: 'text.secondary', flexShrink: 0 }} />
              <Tooltip title={job.address} arrow>
                <Typography variant="caption" color="text.secondary" noWrap>
                  {job.address}
                </Typography>
              </Tooltip>
            </Stack>
          </Box>

          <Stack alignItems={{ xs: 'flex-start', md: 'flex-end' }} spacing={0.25} sx={{ flexShrink: 0, minWidth: 110 }}>
            <Typography variant="caption" color="text.disabled">
              Posted {job.postedAt}
            </Typography>
            {showBidsAction && (
              <Typography variant="caption" fontWeight={600} color="primary.main">
                {bidCount} bid{bidCount === 1 ? '' : 's'}
              </Typography>
            )}
            {!receivingBids && job.assignedAgency && (
              <Typography variant="caption" fontWeight={600} color="success.main" noWrap>
                {job.assignedAgency}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            {showBidsAction && (
              <Button
                component={RouterLink}
                href={bidsHref}
                onClick={(event) => event.stopPropagation()}
                variant="contained"
                size="small"
                startIcon={<Iconify icon="solar:document-text-bold" width={16} />}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                View Bids
              </Button>
            )}
            {showAttendance ? (
              <Tooltip title="Attendance">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenAttendance(job);
                  }}
                >
                  <Iconify icon="solar:camera-bold" width={18} />
                </IconButton>
              </Tooltip>
            ) : null}
            {canEdit ? (
              <Tooltip title="Increase rate">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpen();
                  }}
                >
                  <Iconify icon="solar:tag-price-bold" width={18} />
                </IconButton>
              </Tooltip>
            ) : status !== 'deleted' ? (
              <Tooltip title={completed && !rated ? 'Rate worker' : 'View details'}>
                <IconButton
                  size="small"
                  color={completed && !rated ? 'warning' : 'primary'}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpen();
                  }}
                >
                  <Iconify
                    icon={completed && !rated ? 'eva:star-fill' : 'solar:eye-bold'}
                    width={18}
                  />
                </IconButton>
              </Tooltip>
            ) : null}
            {status !== 'deleted' && !completed && onDelete ? (
              <Tooltip title="Delete job">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(job);
                  }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Tooltip>
            ) : null}
          </Stack>
        </Stack>

        <ClosedJobReview job={job} onLeaveReview={onLeaveReview} sx={{ mt: 1.25, pt: 1.25 }} />
      </Card>
    );
  }

  return (
    <Card
      onClick={handleOpen}
      sx={{
        p: 2.5,
        height: '100%',
        borderRadius: 2,
        boxShadow: '0 4px 20px rgba(99, 115, 129, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        ...cardSx,
      }}
      title={openHint}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.5 }}
      >
        <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ minWidth: 0, flex: 1 }}>
          <JobMediaThumb image={job.image} alt={job.title || job.type} width={56} height={56} />
          <CreatedJobHeading job={job} startsInLabel={startsInLabel} />
        </Stack>

        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
          {showAttendance ? (
            <Tooltip title="Attendance">
              <IconButton
                size="small"
                color="primary"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenAttendance(job);
                }}
              >
                <Iconify icon="solar:camera-bold" width={18} />
              </IconButton>
            </Tooltip>
          ) : null}
          {canEdit ? (
            <Tooltip title="Increase rate">
              <IconButton
                size="small"
                color="primary"
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpen();
                }}
              >
                <Iconify icon="solar:tag-price-bold" width={18} />
              </IconButton>
            </Tooltip>
          ) : status !== 'deleted' ? (
            <Tooltip title={completed && !rated ? 'Rate worker' : 'View details'}>
              <IconButton
                size="small"
                color={completed && !rated ? 'warning' : 'primary'}
                onClick={(event) => {
                  event.stopPropagation();
                  handleOpen();
                }}
              >
                <Iconify
                  icon={completed && !rated ? 'eva:star-fill' : 'solar:eye-bold'}
                  width={18}
                />
              </IconButton>
            </Tooltip>
          ) : null}
          {status !== 'deleted' && !completed && onDelete ? (
            <Tooltip title="Delete job">
              <IconButton
                size="small"
                color="error"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(job);
                }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>

      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
        {orderedSchedules.map((schedule, index) => (
          <Stack key={schedule.id || `${schedule.date}-${index}`} direction="row" spacing={0.75} alignItems="flex-start">
            <Iconify
              icon="solar:calendar-clock-bold"
              width={16}
              sx={{ color: 'text.secondary', mt: 0.15, flexShrink: 0 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
              {formatScheduleLabel(schedule, job)}
              {schedule.allowedPersons
                ? ` · ${schedule.allowedPersons} person${schedule.allowedPersons === 1 ? '' : 's'}`
                : ''}
              {schedule.receivingBids === false ? ' · Bids closed' : ''}
            </Typography>
          </Stack>
        ))}
      </Stack>

      <Stack direction="row" spacing={0.75} alignItems="flex-start" sx={{ mb: 1 }}>
        <Iconify icon="solar:map-point-bold" width={16} sx={{ color: 'text.secondary', mt: 0.15, flexShrink: 0 }} />
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
          {job.address}
          {job.distanceInKm > 0 ? ` · ${job.distanceInKm} km` : ''}
        </Typography>
      </Stack>

      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: job.description ? 1 : 0 }}>
        {[
          job.gender ? `Gender: ${getGenderLabel(job.gender) || GENDER_LABELS[job.gender] || job.gender}` : null,
          job.averageRating > 0
            ? `Rating: ${Number(job.averageRating).toFixed(1)} (${job.totalReviews || 0})`
            : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Typography>

      {job.description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {job.description}
        </Typography>
      )}

      <ClosedJobReview job={job} onLeaveReview={onLeaveReview} sx={{ mt: 'auto' }} />

      <Box sx={{ pt: status === 'inactive' ? 1 : 1.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} flexWrap="wrap" useFlexGap>
          <Stack spacing={0.25}>
            <Typography variant="caption" color="text.disabled">
              Posted {job.postedAt}
            </Typography>
            {showBidsAction && (
              <Typography variant="caption" fontWeight={600} color="primary.main">
                {bidCount} bid{bidCount === 1 ? '' : 's'}
              </Typography>
            )}
            {!receivingBids && job.assignedAgency && (
              <Typography variant="caption" fontWeight={600} color="success.main">
                {job.assignedAgency}
              </Typography>
            )}
          </Stack>

          {showBidsAction && (
            <Button
              component={RouterLink}
              href={bidsHref}
              onClick={(event) => event.stopPropagation()}
              variant="contained"
              size="small"
              startIcon={<Iconify icon="solar:document-text-bold" width={18} />}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
              }}
            >
              View Bids
            </Button>
          )}
        </Stack>
      </Box>
    </Card>
  );
}


export function CreatedJobsView({ openPostOnMount = false, mode = 'careHome' }) {
  return (
    <JobTypesProvider>
      <CreatedJobsViewContent openPostOnMount={openPostOnMount} mode={mode} />
    </JobTypesProvider>
  );
}

const FILL_TAB_BIDS = { pending: 'unfilled', scheduled: 'filled' };

function CreatedJobsViewContent({ openPostOnMount = false, mode = 'careHome' }) {
  const viewOnly = useViewOnly();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter') || '';
  const urlStatus = searchParams.get('status') || '';
  const initialDashboardFilter =
    urlFilter === 'scheduled' || urlFilter === 'pending' || urlFilter === 'completed'
      ? urlFilter
      : '';
  const initialStatusFilter =
    urlStatus === 'completed'
      ? 'completed'
      : urlFilter === 'completed'
        ? 'all'
        : initialDashboardFilter
          ? 'active'
          : 'all';

  const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
  const [dashboardFilter, setDashboardFilter] = useState(initialDashboardFilter);
  const [activeHorizon, setActiveHorizon] = useState('all');
  const [listFilters, setListFilters] = useState(EMPTY_JOB_LIST_FILTERS);
  const [editingJob, setEditingJob] = useState(null);
  const { activeBranchId, activeBranchName, isAllSites } = useActiveBranch();
  const postDialog = useBoolean();
  const deleteDialog = useBoolean();
  const reviewDialog = useBoolean();
  const isHospital = mode === 'hospital';
  const isUser = mode === 'user';
  const isLocalAuthority = mode === 'localAuthority';
  const isHomeCareCompany = mode === 'homeCareCompany';
  const skipCareHome = isHospital || isUser || isLocalAuthority || isHomeCareCompany;

  const branchListArgs = useMemo(() => ({ page: 0, limit: 100, status: '' }), []);
  const branchQueryOptions = { refetchOnMountOrArgChange: true };

  const careHomeBranchesQuery = useGetCareHomeBranchesQuery(branchListArgs, {
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
  const branchesData = isUser
    ? userBranchesQuery.data
    : isLocalAuthority
      ? localAuthorityBranchesQuery.data
      : isHospital
        ? hospitalBranchesQuery.data
        : isHomeCareCompany
          ? homeCareCompanyBranchesQuery.data
          : careHomeBranchesQuery.data;
  const branches = useMemo(
    () =>
      (branchesData?.data || []).filter((branch) => {
        const status = String(branch.status || 'active').toLowerCase();
        if (status === 'deleted' || status === 'delete' || status === 'inactive') return false;
        return true;
      }),
    [branchesData?.data]
  );

  const jobsQueryArgs = useMemo(
    () => ({
      page: 0,
      limit: 100,
      status:
        dashboardFilter === 'scheduled' || dashboardFilter === 'pending'
          ? 'active'
          : dashboardFilter === 'completed'
            ? ''
            : statusFilter === 'all'
              ? ''
              : statusFilter,
      dateFilter:
        dashboardFilter === 'completed' || statusFilter === 'completed' || activeHorizon === 'all'
          ? ''
          : activeHorizon,
      ...listFilters,
      bids: FILL_TAB_BIDS[dashboardFilter] || '',
    }),
    [activeHorizon, dashboardFilter, listFilters, statusFilter]
  );

  const { data: jobTypesList } = useRoleJobTypes(mode);
  const jobTypeOptions = useMemo(
    () =>
      jobTypesList
        .filter((item) => item.id && (item.status === 'active' || !item.status))
        .map((item) => ({ id: item.id, label: item.label || item.title })),
    [jobTypesList]
  );

  const careHomeJobsQuery = useGetCareHomeJobsQuery(jobsQueryArgs, {
    skip: skipCareHome,
    refetchOnMountOrArgChange: true,
  });
  const hospitalJobsQuery = useGetHospitalJobsQuery(jobsQueryArgs, {
    skip: !isHospital,
    refetchOnMountOrArgChange: true,
  });
  const userJobsQuery = useGetUserJobsQuery(jobsQueryArgs, {
    skip: !isUser,
    refetchOnMountOrArgChange: true,
  });
  const localAuthorityJobsQuery = useGetLocalAuthorityJobsQuery(jobsQueryArgs, {
    skip: !isLocalAuthority,
    refetchOnMountOrArgChange: true,
  });
  const activeJobsQuery = isLocalAuthority
    ? localAuthorityJobsQuery
    : isUser
      ? userJobsQuery
      : isHospital
        ? hospitalJobsQuery
        : careHomeJobsQuery;
  const {
    data: jobsData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = activeJobsQuery;

  const [createCareHomeJob] = useCreateCareHomeJobMutation();
  const [updateCareHomeJob] = useUpdateCareHomeJobMutation();
  const [deleteCareHomeJob, { isLoading: isDeletingCareHome }] = useDeleteCareHomeJobMutation();
  const [createHospitalJob] = useCreateHospitalJobMutation();
  const [updateHospitalJob] = useUpdateHospitalJobMutation();
  const [deleteHospitalJob, { isLoading: isDeletingHospital }] = useDeleteHospitalJobMutation();
  const [createUserJob] = useCreateUserJobMutation();
  const [updateUserJob] = useUpdateUserJobMutation();
  const [deleteUserJob, { isLoading: isDeletingUser }] = useDeleteUserJobMutation();
  const [createLocalAuthorityJob] = useCreateLocalAuthorityJobMutation();
  const [updateLocalAuthorityJob] = useUpdateLocalAuthorityJobMutation();
  const [deleteLocalAuthorityJob, { isLoading: isDeletingLocalAuthority }] =
    useDeleteLocalAuthorityJobMutation();

  const createJob = isLocalAuthority
    ? createLocalAuthorityJob
    : isUser
      ? createUserJob
      : isHospital
        ? createHospitalJob
        : createCareHomeJob;
  const [fetchCareHomeJobById] = useLazyGetCareHomeJobByIdQuery();
  const [fetchHospitalJobById] = useLazyGetHospitalJobByIdQuery();
  const [fetchUserJobById] = useLazyGetUserJobByIdQuery();
  const [fetchLocalAuthorityJobById] = useLazyGetLocalAuthorityJobByIdQuery();
  const fetchJobById = isLocalAuthority
    ? fetchLocalAuthorityJobById
    : isUser
      ? fetchUserJobById
      : isHospital
        ? fetchHospitalJobById
        : fetchCareHomeJobById;

  const updateJob = isLocalAuthority
    ? updateLocalAuthorityJob
    : isUser
      ? updateUserJob
      : isHospital
        ? updateHospitalJob
        : updateCareHomeJob;
  const deleteJob = isLocalAuthority
    ? deleteLocalAuthorityJob
    : isUser
      ? deleteUserJob
      : isHospital
        ? deleteHospitalJob
        : deleteCareHomeJob;
  const isDeleting = isLocalAuthority
    ? isDeletingLocalAuthority
    : isUser
      ? isDeletingUser
      : isHospital
        ? isDeletingHospital
        : isDeletingCareHome;

  const apiJobs = useMemo(() => jobsData?.data || [], [jobsData?.data]);
  const jobsCount = jobsData?.jobsCount || {};

  const { jobs, rememberReview, forgetReview } = useJobsWithReviews(mode, apiJobs);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [reviewJob, setReviewJob] = useState(null);
  const [attendanceJob, setAttendanceJob] = useState(null);
  const [page, setPage] = useState(1);
  const { viewMode, handleViewModeChange: onViewModeChange } = usePersistedViewMode(
    isLocalAuthority
      ? 'local-authority-created-jobs'
      : isUser
        ? 'user-created-jobs'
        : isHospital
          ? 'hospital-created-jobs'
          : 'care-home-created-jobs',
    'grid'
  );

  const listLoading = isLoading || isFetching;

  useEffect(() => {
    if (openPostOnMount && !viewOnly) {
      postDialog.onTrue();
    }
  }, [openPostOnMount]);

  useEffect(() => {
    if (!isError) return;
    toast.error(error?.data?.message || error?.error || 'Could not load created jobs.');
  }, [error, isError]);

  const allStatusCountsRef = useRef({});

  const filteredJobs = useMemo(() => {
    const byStatus =
      statusFilter === 'all'
        ? jobs.filter((job) => resolveJobApiStatus(job.apiStatus || job.status) !== 'deleted')
        : jobs.filter((job) => {
          const mapped = resolveJobApiStatus(job.apiStatus || job.status);
          if (!mapped) return true;
          return mapped === statusFilter;
        });

    return byStatus
      .filter((job) => FILL_TAB_BIDS[dashboardFilter] || jobMatchesDashboardFilter(job, dashboardFilter))
      .filter((job) => jobMatchesActiveBranch(job, activeBranchId));
  }, [activeBranchId, dashboardFilter, jobs, statusFilter]);

  useEffect(() => {
    if (statusFilter !== 'all') return;
    allStatusCountsRef.current = countJobsByApiStatus(jobs);
  }, [jobs, statusFilter]);

  const statusCounts = useMemo(() => {
    const fromMeta = Object.entries(jobsCount || {}).reduce((acc, [key, value]) => {
      acc[String(key).toLowerCase()] = Number(value) || 0;
      return acc;
    }, {});
    const fromList = statusFilter === 'all' ? countJobsByApiStatus(jobs) : allStatusCountsRef.current;

    return CREATED_JOB_API_STATUS_OPTIONS.reduce((acc, option) => {
      if (option.value === 'all') {
        acc.all = Number(fromMeta.all ?? fromMeta.total ?? jobsData?.total_length ?? jobs.length) || 0;
      } else if (fromMeta[option.value] != null) {
        acc[option.value] = Number(fromMeta[option.value]) || 0;
      } else if (statusFilter === option.value) {
        acc[option.value] = jobs.length;
      } else {
        acc[option.value] = Number(fromList[option.value]) || 0;
      }
      return acc;
    }, {});
  }, [jobs, jobsCount, jobsData?.total_length, statusFilter]);

  const displayedJobs = useMemo(
    () => (listFilters.sort ? filteredJobs : sortJobsByCreatedAtDesc(filteredJobs)),
    [filteredJobs, listFilters.sort]
  );

  const rowsPerPage = viewMode === 'grid' ? ROWS_PER_PAGE_GRID : ROWS_PER_PAGE_LIST;
  const pageCount = Math.max(1, Math.ceil(displayedJobs.length / rowsPerPage));
  const safePage = Math.min(page, pageCount);
  const paginatedJobs = displayedJobs.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const handleChangePage = useCallback((_event, newPage) => {
    setPage(newPage);
  }, []);

  const handleViewModeChange = useCallback(
    (event, nextView) => {
      onViewModeChange(event, nextView);
      if (nextView) setPage(1);
    },
    [onViewModeChange]
  );

  useEffect(() => {
    setPage(1);
  }, [activeBranchId, dashboardFilter, statusFilter]);

  useEffect(() => {
    const next =
      urlFilter === 'scheduled' || urlFilter === 'pending' || urlFilter === 'completed'
        ? urlFilter
        : '';
    setDashboardFilter(next);
    if (next === 'scheduled' || next === 'pending') setStatusFilter('active');
    if (next === 'completed') {
      setStatusFilter('all');
      setActiveHorizon('all');
    }
  }, [urlFilter]);

  const listShowsEveryJob =
    !dashboardFilter && statusFilter === 'all' && activeHorizon === 'all' && !hasJobListFilters(listFilters);

  const fillCountsFromJobs = useMemo(() => {
    const inActiveBranch = (job) =>
      jobMatchesActiveBranch(job, activeBranchId) &&
      resolveJobApiStatus(job.apiStatus || job.status) !== 'deleted';
    const visibleJobs = jobs.filter(inActiveBranch);

    return {
      all: visibleJobs.length,
      pending: visibleJobs.filter((job) => isJobPendingFill(job)).length,
      scheduled: visibleJobs.filter((job) => isJobScheduledWithWorkers(job) && !isEmployerJobCompleted(job)).length,
      completed: visibleJobs.filter((job) => isEmployerJobCompleted(job)).length,
    };
  }, [activeBranchId, jobs]);

  const savedFillCountsRef = useRef(fillCountsFromJobs);
  if (listShowsEveryJob) savedFillCountsRef.current = fillCountsFromJobs;

  const fillCounts = useMemo(() => {
    if (listShowsEveryJob) return fillCountsFromJobs;
    const saved = savedFillCountsRef.current;
    if (isFetching || isLoading) return saved;

    const inActiveBranch = (job) =>
      jobMatchesActiveBranch(job, activeBranchId) &&
      resolveJobApiStatus(job.apiStatus || job.status) !== 'deleted';
    const visibleJobs = jobs.filter(inActiveBranch);

    if (dashboardFilter === 'pending') return { ...saved, pending: visibleJobs.length };
    if (dashboardFilter === 'scheduled') return { ...saved, scheduled: visibleJobs.length };
    if (dashboardFilter === 'completed') return { ...saved, completed: visibleJobs.length };
    return saved;
  }, [activeBranchId, dashboardFilter, fillCountsFromJobs, isFetching, isLoading, jobs, listShowsEveryJob]);

  const syncCreatedJobsQuery = useCallback(
    (nextFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextFilter) params.set('filter', nextFilter);
      else params.delete('filter');
      params.delete('status');
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const handleStatusFilterChange = useCallback(
    (nextValue) => {
      if (!nextValue) return;
      setStatusFilter(nextValue);
      setDashboardFilter('');
      setActiveHorizon('all');
      setPage(1);
      syncCreatedJobsQuery('');
    },
    [syncCreatedJobsQuery]
  );

  const handleFillFilterChange = useCallback(
    (nextValue) => {
      const next =
        nextValue === 'pending' || nextValue === 'scheduled' || nextValue === 'completed'
          ? nextValue
          : '';
      setDashboardFilter(next);
      if (next === 'pending' || next === 'scheduled') {
        setStatusFilter('active');
      } else {
        setStatusFilter('all');
      }
      if (next === 'completed') setActiveHorizon('all');
      setPage(1);
      syncCreatedJobsQuery(next);
    },
    [syncCreatedJobsQuery]
  );

  const handleHorizonChange = useCallback((nextHorizon) => {
    if (!nextHorizon) return;
    setActiveHorizon(nextHorizon);
    setPage(1);
  }, []);

  const hasActiveFilters =
    statusFilter !== 'all' ||
    activeHorizon !== 'all' ||
    Boolean(dashboardFilter) ||
    hasJobListFilters(listFilters);

  const handleListFiltersChange = useCallback((next) => {
    setListFilters(next);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setStatusFilter('all');
    setDashboardFilter('');
    setActiveHorizon('all');
    setListFilters(EMPTY_JOB_LIST_FILTERS);
    setPage(1);
    syncCreatedJobsQuery('');
  }, [syncCreatedJobsQuery]);

  const handleOpenCreate = useCallback(() => {
    setEditingJob(null);
    postDialog.onTrue();
  }, [postDialog]);

  const handleClosePostDialog = useCallback(() => {
    postDialog.onFalse();
    setEditingJob(null);
  }, [postDialog]);

  const handleOpenJob = useCallback(
    async (job) => {
      const status = normalizeJobStatus(job?.apiStatus || job?.status);
      if (status === 'deleted') {
        toast.warning('This job has been deleted');
        return;
      }

      if (viewOnly) {
        router.push(getCreatedJobDetailsHref(pathname, job.id));
        return;
      }

      if (isEmployerJobCompleted(job)) {
        if (!jobHasWorkerRating(job)) {
          setReviewJob(job);
          reviewDialog.onTrue();
          return;
        }
        router.push(getCreatedJobDetailsHref(pathname, job.id));
        return;
      }

      if (!jobHasBids(job)) {
        let details = null;
        try {
          details = await fetchJobById(job.id).unwrap();
        } catch {
        }
        setEditingJob(details?.id ? { ...job, ...details } : job);
        postDialog.onTrue();
        return;
      }

      router.push(getCreatedJobDetailsHref(pathname, job.id));
    },
    [fetchJobById, pathname, postDialog, reviewDialog, router, viewOnly]
  );

  const handleSubmitJob = useCallback(
    async (draft) => {
      const branch =
        branches.find((item) => item.id === draft.branchId) ||
        branches.find((item) => item._id === draft.branchId) ||
        null;

      if (!draft.typeId) {
        throw new Error('Please select a job type');
      }
      if (!draft.branchId) {
        throw new Error(
          isUser || isHomeCareCompany
            ? 'Please select a location'
            : 'Please select a valid location'
        );
      }
      if (!branch) {
        throw new Error(
          isUser || isHomeCareCompany
            ? 'Please select a location'
            : 'Please select a valid location'
        );
      }

      const body = buildCareHomeJobPayload(
        {
          ...draft,
          location: branch?.location || draft.location,
        },
        branch,
        { includeStatus: Boolean(editingJob), isUser }
      );

      if (!body.name) throw new Error('Please enter a job name');
      if (!body.type) throw new Error('Please select a job type');
      if (!(body.branch || body.address))
        throw new Error(
          'Please select a location'
        );
      if (!body.shift?.length) throw new Error('Please add at least one shift');
      if (!editingJob?.id && !String(draft.image || '').trim()) {
        throw new Error('Please add a job image');
      }
      if (!editingJob?.id && !(Number(draft.hourlyRate) > 0)) {
        throw new Error('Please enter a rate per hour');
      }

      if (editingJob?.id) {
        try {
          await updateJob({ id: editingJob.id, ...body }).unwrap();
        } catch (err) {
          if (!isJobCreateSoftError(err)) throw err;
        }
        toast.success('Job updated successfully');
        return;
      }

      try {
        await createJob(body).unwrap();
      } catch (err) {
        if (!isJobCreateSoftError(err)) throw err;
      }

      if (draft.requestFromAgency && (draft.agencyId || draft.agencyName)) {
        appendAgencyJobRequest({
          ...draft,
          type: draft.name || draft.type,
          assignedAgency: draft.agencyName,
        });
        toast.success(
          draft.agencyName ? `Job created and request noted for ${draft.agencyName}` : 'Job created'
        );
      } else {
        toast.success('Job created successfully');
      }
    },
    [branches, createJob, editingJob, isHomeCareCompany, isUser, updateJob]
  );

  const handleDeleteRequest = useCallback(
    (job) => {
      setJobToDelete(job);
      deleteDialog.onTrue();
    },
    [deleteDialog]
  );

  const { prepareReviewJob } = usePrepareJobReview(mode);

  const handleLeaveReview = useCallback(
    async (job) => {
      const nextJob = await prepareReviewJob(job);
      if (!nextJob) return;
      setReviewJob(nextJob);
      reviewDialog.onTrue();
    },
    [prepareReviewJob, reviewDialog]
  );

  const handleCloseReviewDialog = useCallback(() => {
    reviewDialog.onFalse();
    setReviewJob(null);
  }, [reviewDialog]);

  const [createReview, { isLoading: creatingReview }] = useCreateReviewMutation();
  const [updateReview, { isLoading: updatingReview }] = useUpdateReviewMutation();
  const [deleteReview, { isLoading: deletingReview }] = useDeleteReviewMutation();

  const handleSubmitReview = useCallback(
    async ({ rating, comment }) => {
      if (!reviewJob) return;

      const target = resolveReviewSubmitTarget(reviewJob);
      if (!target?.objectId && !target?.reviewId) {
        toast.error('No completed booking or worker found to rate for this job.');
        return;
      }

      try {
        if (reviewJob.review?.id) {
          await updateReview({
            id: reviewJob.review.id,
            rating,
            comment,
            reviewType: reviewJob.review.reviewType || target.reviewType,
            objectId: reviewJob.review.objectId || target.objectId,
          }).unwrap();
          rememberReview(reviewJob.id, { ...reviewJob.review, rating, comment });
          toast.success('Rating updated');
        } else {
          const response = await createReview({
            reviewType: target.reviewType,
            objectId: target.objectId,
            rating,
            comment,
          }).unwrap();
          rememberReview(
            reviewJob.id,
            mapReviewMutationResponse(response) || { ...target, id: '', rating, comment }
          );
          toast.success('Worker rated');
        }
        handleCloseReviewDialog();
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err?.error || err?.message || 'Could not save rating');
      }
    },
    [createReview, handleCloseReviewDialog, refetch, rememberReview, reviewJob, updateReview]
  );

  const handleDeleteReview = useCallback(async () => {
    const reviewId = reviewJob?.review?.id;
    if (!reviewId) return;

    try {
      await deleteReview(reviewId).unwrap();
      forgetReview(reviewJob.id);
      toast.success('Review deleted');
      handleCloseReviewDialog();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.error || err?.message || 'Could not delete review');
    }
  }, [deleteReview, forgetReview, handleCloseReviewDialog, refetch, reviewJob]);

  const handleConfirmDelete = useCallback(async () => {
    if (!jobToDelete) return;
    const jobId = jobToDelete.id || jobToDelete._id;
    if (!jobId) {
      toast.error('Missing job id');
      return;
    }

    const isBackendCacheBug = (err) => {
      const text = [
        err?.data?.message,
        err?.data?.error?.message,
        err?.error,
        err?.message,
      ]
        .filter(Boolean)
        .join(' ');
      return /invalidateJobCache/i.test(text);
    };

    try {
      await deleteJob(jobId).unwrap();
      toast.success('Job deleted successfully');
      deleteDialog.onFalse();
      setJobToDelete(null);
    } catch (err) {

      if (isBackendCacheBug(err)) {
        toast.success('Job deleted (backend cache cleanup error — ask backend to fix invalidateJobCache)');
        deleteDialog.onFalse();
        setJobToDelete(null);
        refetch();
        return;
      }
      toast.error(err?.data?.message || err?.error || err?.message || 'Could not delete job');
    }
  }, [deleteJob, deleteDialog, jobToDelete, refetch]);

  return (
    <>
      <DashboardContent maxWidth="xl">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              component={RouterLink}
              href={
                isLocalAuthority
                  ? paths.dashboard.localAuthority.root
                  : isUser
                    ? paths.dashboard.individualHomeCare.root
                    : isHospital
                      ? paths.dashboard.hospital.root
                      : paths.dashboard.root
              }
              sx={{ display: 'flex', alignItems: 'center', color: 'text.primary', textDecoration: 'none' }}
            >
              <Iconify icon="eva:arrow-back-fill" width={24} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                {dashboardFilter === 'scheduled'
                  ? 'Active jobs'
                  : dashboardFilter === 'pending'
                    ? 'Receiving bids'
                    : dashboardFilter === 'completed' || statusFilter === 'completed'
                      ? 'Completed jobs'
                      : 'Created Jobs'}
              </Typography>
              {dashboardFilter === 'scheduled' ? (
                <Typography variant="body2" color="text.secondary">
                  Filled jobs with a worker assigned. Tap a job for details.
                </Typography>
              ) : dashboardFilter === 'pending' ? (
                <Typography variant="body2" color="text.secondary">
                  Unfilled jobs still receiving bids. Tap a job to update rates and details.
                </Typography>
              ) : dashboardFilter === 'completed' || statusFilter === 'completed' ? (
                <Typography variant="body2" color="text.secondary">
                  Finished jobs. Rate the worker for each one — a rating is required.
                </Typography>
              ) : !isAllSites && activeBranchName ? (
                <Typography variant="body2" color="text.secondary">
                  {activeBranchName}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            {isError && (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:refresh-fill" />}
                onClick={() => refetch()}
              >
                Retry
              </Button>
            )}
            {viewOnly ? null : (
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={handleOpenCreate}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                }}
              >
                Add Job
              </Button>
            )}
          </Stack>
        </Stack>

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            Filter jobs
          </Typography>
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
            {CREATED_JOB_FILL_OPTIONS.map((option) => {
              const isSelected = (dashboardFilter || 'all') === option.value;
              const count = fillCounts[option.value] || 0;
              const selectedColor = option.value === 'completed' ? 'success' : 'primary';

              return (
                <Button
                  key={option.value}
                  size="small"
                  variant={isSelected ? 'contained' : 'outlined'}
                  color={isSelected ? selectedColor : 'inherit'}
                  onClick={() => handleFillFilterChange(option.value)}
                  sx={{
                    borderRadius: 5,
                    px: 1.75,
                    py: 0.85,
                    minHeight: 38,
                    textTransform: 'none',
                    fontWeight: 700,
                    borderColor: 'divider',
                    ...(!isSelected && {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                    }),
                  }}
                >
                  {option.label}
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ ml: 0.75, fontWeight: 700, opacity: 0.8 }}
                  >
                    {count}
                  </Typography>
                </Button>
              );
            })}
          </Stack>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 3 }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <FormControl size="small" sx={{ minWidth: { xs: 1, sm: 240 }, flex: { xs: '1 1 100%', sm: '0 0 240px' } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(event) => handleStatusFilterChange(event.target.value)}
                renderValue={(selected) =>
                  CREATED_JOB_API_STATUS_OPTIONS.find((option) => option.value === selected)?.label ||
                  'All'
                }
              >
                {CREATED_JOB_API_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: 1 }}>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                        {statusCounts[option.value] || 0}
                      </Typography>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              size="small"
              color="inherit"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              startIcon={<Iconify icon="solar:restart-bold" width={16} />}
              sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}
            >
              Clear filters
            </Button>
          </Stack>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={viewMode}
            onChange={handleViewModeChange}
            sx={{
              flexShrink: 0,
              ml: { sm: 'auto' },
              '& .MuiToggleButton-root': {
                px: 1.25,
                py: 0.75,
                borderColor: 'divider',
                '&.Mui-selected': {
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                },
              },
            }}
          >
            <Tooltip title="Grid view">
              <ToggleButton value="grid" aria-label="Grid view">
                <Iconify icon="solar:widget-5-bold" width={18} />
              </ToggleButton>
            </Tooltip>
            <Tooltip title="List view">
              <ToggleButton value="list" aria-label="List view">
                <Iconify icon="solar:list-bold" width={18} />
              </ToggleButton>
            </Tooltip>
          </ToggleButtonGroup>
        </Stack>

        <JobListFilterBar
          value={listFilters}
          onChange={handleListFiltersChange}
          jobTypeOptions={jobTypeOptions}
          showBidsFilter={false}
          sx={{ mb: 3 }}
        />

        {dashboardFilter === 'completed' || statusFilter === 'completed' ? null : (
          <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1} sx={{ mb: 3 }}>
            {ACTIVE_JOB_HORIZON_OPTIONS.map((option) => {
              const isSelected = activeHorizon === option.value;

              return (
                <Button
                  key={option.value}
                  size="small"
                  variant={isSelected ? 'contained' : 'outlined'}
                  color={isSelected ? 'primary' : 'inherit'}
                  onClick={() => handleHorizonChange(option.value)}
                  sx={{
                    borderRadius: 5,
                    px: 1.5,
                    py: 0.75,
                    minHeight: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: 'divider',
                    ...(!isSelected && {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                    }),
                  }}
                >
                  {option.label}
                </Button>
              );
            })}
          </Stack>
        )}

        {listLoading && !displayedJobs.length ? <ModuleLoading /> : listLoading ? <LinearProgress sx={{ borderRadius: 0, height: 2 }} /> : null}

        {listLoading && !displayedJobs.length ? null : displayedJobs.length === 0 ? (
          <EmptyContent
            filled
            title={isError ? 'Could not load jobs' : 'No jobs found'}
            description={
              isError
                ? 'Check your connection and try again.'
                : dashboardFilter === 'pending'
                  ? 'No unfilled jobs receiving bids.'
                  : dashboardFilter === 'scheduled'
                    ? 'No filled (active) jobs yet.'
                    : dashboardFilter === 'completed' || statusFilter === 'completed'
                      ? 'No completed jobs yet.'
                      : hasActiveFilters
                        ? 'No jobs match this filter.'
                        : 'You don\'t have any jobs yet.'
            }
            action={
              isError ? (
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:refresh-fill" />}
                  onClick={() => refetch()}
                  sx={{ mt: 2 }}
                >
                  Retry
                </Button>
              ) : viewOnly ? null : (
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:plus-fill" />}
                  onClick={handleOpenCreate}
                  sx={{ mt: 2 }}
                >
                  Add a Job
                </Button>
              )
            }
          />
        ) : viewMode === 'grid' ? (
          <Grid container spacing={2.5}>
            {paginatedJobs.map((job) => (
              <Grid key={job.id} item xs={12} md={6}>
                <CreatedJobCard
                  job={job}
                  viewMode="grid"
                  onDelete={viewOnly ? undefined : handleDeleteRequest}
                  onLeaveReview={viewOnly ? undefined : handleLeaveReview}
                  onOpen={handleOpenJob}
                  onOpenAttendance={setAttendanceJob}
                />
              </Grid>
            ))}
          </Grid>
        ) : (
          <Stack spacing={1.25}>
            {paginatedJobs.map((job) => (
              <CreatedJobCard
                key={job.id}
                job={job}
                viewMode="list"
                onDelete={viewOnly ? undefined : handleDeleteRequest}
                onLeaveReview={viewOnly ? undefined : handleLeaveReview}
                onOpen={handleOpenJob}
                onOpenAttendance={setAttendanceJob}
              />
            ))}
          </Stack>
        )}

        {displayedJobs.length > rowsPerPage && (
          <Pagination
            page={safePage}
            count={pageCount}
            shape="circular"
            onChange={handleChangePage}
            sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}
          />
        )}
      </DashboardContent>

      <PostJobDialog
        mode={mode}
        open={postDialog.value}
        editingJob={editingJob}
        onClose={handleClosePostDialog}
        onSubmit={handleSubmitJob}
      />

      <LeaveJobReviewDialog
        open={reviewDialog.value}
        job={reviewJob}
        onClose={handleCloseReviewDialog}
        onSubmit={handleSubmitReview}
        onDelete={handleDeleteReview}
        submitting={creatingReview || updatingReview}
        deleting={deletingReview}
      />

      <JobAttendanceDialog
        open={Boolean(attendanceJob)}
        mode={mode}
        job={attendanceJob}
        onClose={() => setAttendanceJob(null)}
      />

      <ConfirmDialog
        open={deleteDialog.value}
        onClose={deleteDialog.onFalse}
        title="Delete job"
        content={
          <>
            Are you sure you want to delete <strong>{jobToDelete?.type}</strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        }
      />
    </>
  );
}
