import { useMemo, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { usePathname } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';

import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { JobMediaThumb, resolveJobImageSrc } from 'src/components/jobs/job-image';
import { ModuleLoading } from 'src/components/loading-screen';

import {
  useGetCareHomeJobByIdQuery,
  useGetCareHomeJobsQuery,
} from 'src/store/Reducer/care-home-jobs-api';
import {
  useGetHospitalJobByIdQuery,
  useGetHospitalJobsQuery,
} from 'src/store/Reducer/hospital-jobs-api';
import {
  useGetUserJobByIdQuery,
  useGetUserJobsQuery,
} from 'src/store/Reducer/user-jobs-api';
import {
  useGetLocalAuthorityJobByIdQuery,
  useGetLocalAuthorityJobsQuery,
} from 'src/store/Reducer/local-authority-jobs-api';
import {
  useCreateReviewMutation,
  useUpdateReviewMutation,
} from 'src/store/Reducer/reviews-api';
import { mapReviewMutationResponse, resolveReviewSubmitTarget } from 'src/sections/reviews/reviews-api-utils';
import { useJobsWithReviews } from 'src/sections/reviews/use-jobs-with-reviews';
import { usePrepareJobReview } from 'src/sections/reviews/use-prepare-job-review';
import { useRoleJobTypes } from 'src/sections/job-roles/use-role-job-types';

import { ClosedJobReview } from '../closed-job-review';
import { RateWorkerDialog } from '../rate-worker-dialog';
import { JobShiftAlertCard } from '../job-shift-alert-card';
import { JobAttendanceDialog } from 'src/sections/staff-member/jobs/job-attendance-dialog';
import {
  formatJobStartsInLabel,
  getJobStatusConfig,
  isEmployerJobCompleted,
  jobMayHaveAttendance,
  normalizeJobStatus,
} from '../care-home-job-utils';

// ----------------------------------------------------------------------

const FIELD_LABELS = {
  _id: 'Job ID',
  id: 'Job ID',
  title: 'Title',
  name: 'Name',
  status: 'Status',
  gender: 'Gender',
  description: 'Description',
  image: 'Job Image',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
  type: 'Job Type',
  shift: 'Shifts',
  worker: 'Worker',
  employer: 'Employer',
  user: 'Posted By',
  'location.fullAddress': 'Full Address',
  'location.city': 'City',
  'location.country': 'Country',
  'location.state': 'State',
  'location.postalCode': 'Postal Code',
  'location.type': 'Location Type',
  'location.name': 'Location Name',
  'user._id': 'User ID',
  'user.id': 'User ID',
  'user.name': 'User Name',
  'user.email': 'Email',
  'user.profileIcon': 'Profile Photo',
  'user.phone': 'Phone',
};

/** Full field paths the API returns but the details page should not show. */
const HIDDEN_FIELD_PATHS = ['location.title'];

const IMAGE_KEY_HINTS = ['image', 'icon', 'avatar', 'photo', 'picture', 'logo'];

/** Words that must stay uppercase when a label or value is title-cased. */
const TITLE_ACRONYMS = new Set(['ID', 'NHS', 'DBS', 'RTW', 'URL', 'FAQ', 'UK', 'PIN']);

/** Values under these keys are identifiers or free-form — never re-case them. */
const VERBATIM_VALUE_HINTS = [
  'email',
  'phone',
  'password',
  'postalcode',
  'postcode',
  'url',
  'link',
  'website',
  'token',
  'slug',
];

/** `snake_case` / `kebab-case` / `camelCase` / `CONSTANT` — a single unspaced word. */
const TOKEN_VALUE_PATTERN = /^[A-Za-z][A-Za-z0-9]*(?:[_-][A-Za-z0-9]+)*$/;

/** Capitalize each word, preserving acronyms and any existing inner caps (McDonald). */
function toTitleCase(text) {
  return String(text)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();
      if (TITLE_ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * True only for enum-like API values (`care_home`, `partTime`, `ACTIVE`).
 * Sentences, emails, URLs, ids, hashes and dates are left exactly as the API sent them.
 */
function isConvertibleToken(key, value) {
  if (typeof value !== 'string') return false;

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 40) return false;
  if (/\s/.test(trimmed)) return false;
  if (trimmed.includes('@') || /^https?:\/\//i.test(trimmed)) return false;
  if (/^[0-9a-f]{12,}$/i.test(trimmed)) return false;
  if (/\d{4}-\d{2}-\d{2}/.test(trimmed)) return false;

  const lowerKey = String(key).toLowerCase();
  if (VERBATIM_VALUE_HINTS.some((hint) => lowerKey.includes(hint))) return false;
  if (IMAGE_KEY_HINTS.some((hint) => lowerKey.includes(hint))) return false;

  return TOKEN_VALUE_PATTERN.test(trimmed);
}

/** `care_home` / `partTime` / `ACTIVE` -> `Care Home` / `Part Time` / `Active`. */
function formatTokenValue(value) {
  return toTitleCase(
    String(value)
      .trim()
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  );
}

function humanizeKey(key) {
  if (FIELD_LABELS[key]) return FIELD_LABELS[key];
  const leaf = String(key).split('.').pop() || key;
  return toTitleCase(
    leaf
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function isImageValue(key, value) {
  if (typeof value !== 'string') return false;
  const lowerKey = String(key).toLowerCase();
  const looksLikeImageKey = IMAGE_KEY_HINTS.some((hint) => lowerKey.includes(hint));
  const looksLikeUrl = /^https?:\/\//i.test(value) && /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(value);
  return looksLikeImageKey || looksLikeUrl;
}

function formatDateValue(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return fDateTime(parsed);
}

function formatFieldValue(key, value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (key.endsWith('createdAt') || key.endsWith('updatedAt') || key.endsWith('At')) {
    return formatDateValue(value) || String(value);
  }
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value) || typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  if (isConvertibleToken(key, value)) return formatTokenValue(value);
  return String(value);
}

function isHiddenIdField(path) {
  const leaf = String(path).split('.').pop() || '';
  return /^(id|_id)$/i.test(leaf) || /id$/i.test(leaf);
}

function flattenJobFields(source, prefix = '', depth = 0, seen = new WeakSet()) {
  if (source == null) return [];
  if (typeof source !== 'object') {
    if (isHiddenIdField(prefix)) return [];
    return [{ key: prefix || 'value', label: humanizeKey(prefix || 'value'), value: source }];
  }

  // Avoid blank-screen stack overflows from circular / huge API payloads.
  if (depth > 5) {
    if (isHiddenIdField(prefix)) return [];
    return [
      {
        key: prefix || 'value',
        label: humanizeKey(prefix || 'value'),
        value: Array.isArray(source) ? `[${source.length} items]` : '[Nested data]',
      },
    ];
  }

  if (seen.has(source)) return [];
  seen.add(source);

  if (Array.isArray(source)) {
    if (isHiddenIdField(prefix)) return [];
    return [
      {
        key: prefix || 'value',
        label: humanizeKey(prefix || 'value'),
        value: source,
      },
    ];
  }

  return Object.entries(source).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isHiddenIdField(path)) return [];
    // Skip noisy / recursive API blobs that are not useful in the details table.
    if (['raw', 'password', '__v', 'bids', 'coordinates'].includes(key)) return [];
    if (HIDDEN_FIELD_PATHS.includes(path)) return [];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenJobFields(value, path, depth + 1, seen);
    }
    return [{ key: path, label: humanizeKey(path), value }];
  });
}

function FieldValue({ fieldKey, value, fallbackAlt }) {
  if (isImageValue(fieldKey, value)) {
    return (
      <JobMediaThumb
        image={value}
        alt={fallbackAlt || humanizeKey(fieldKey)}
        width={96}
        height={96}
        borderRadius={1.5}
      />
    );
  }

  return (
    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {formatFieldValue(fieldKey, value)}
    </Typography>
  );
}

function DetailsSection({ title, fields, fallbackAlt }) {
  if (!fields.length) return null;

  return (
    <Card>
      <CardHeader title={title} />
      <TableContainer>
        <Table size="small">
          <TableBody>
            {fields.map((field) => (
              <TableRow key={field.key}>
                <TableCell
                  sx={{
                    width: 220,
                    color: 'text.secondary',
                    verticalAlign: 'top',
                    fontWeight: 600,
                  }}
                >
                  {field.label}
                </TableCell>
                <TableCell>
                  <FieldValue fieldKey={field.key} value={field.value} fallbackAlt={fallbackAlt} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

function useCreatedJob(mode, id) {
  const skip = !id;
  const userById = useGetUserJobByIdQuery(id, { skip: skip || mode !== 'user' });
  const careById = useGetCareHomeJobByIdQuery(id, { skip: skip || mode !== 'careHome' });
  const hospitalById = useGetHospitalJobByIdQuery(id, { skip: skip || mode !== 'hospital' });
  const authorityById = useGetLocalAuthorityJobByIdQuery(id, {
    skip: skip || mode !== 'localAuthority',
  });
  const userList = useGetUserJobsQuery({ page: 0, limit: 100 }, { skip: skip || mode !== 'user' });
  const careList = useGetCareHomeJobsQuery(
    { page: 0, limit: 100 },
    { skip: skip || mode !== 'careHome' }
  );
  const hospitalList = useGetHospitalJobsQuery(
    { page: 0, limit: 100 },
    { skip: skip || mode !== 'hospital' }
  );
  const authorityList = useGetLocalAuthorityJobsQuery(
    { page: 0, limit: 100 },
    { skip: skip || mode !== 'localAuthority' }
  );

  const listRaw =
    (mode === 'user' && userList.data?.data) ||
    (mode === 'careHome' && careList.data?.data) ||
    (mode === 'hospital' && hospitalList.data?.data) ||
    (mode === 'localAuthority' && authorityList.data?.data) ||
    [];
  const list = Array.isArray(listRaw) ? listRaw : [];

  const fromList = list.find((job) => String(job?.id || job?._id) === String(id));
  const fromId =
    (mode === 'user' && userById.data?.id && userById.data) ||
    (mode === 'careHome' && careById.data?.id && careById.data) ||
    (mode === 'hospital' && hospitalById.data?.id && hospitalById.data) ||
    (mode === 'localAuthority' && authorityById.data?.id && authorityById.data) ||
    null;
  const job = fromId || fromList || null;
  const isLoading =
    userById.isLoading ||
    careById.isLoading ||
    hospitalById.isLoading ||
    authorityById.isLoading ||
    userList.isLoading ||
    careList.isLoading ||
    hospitalList.isLoading ||
    authorityList.isLoading;
  const isError =
    (mode === 'user' && userById.isError && userList.isError) ||
    (mode === 'careHome' && careById.isError && careList.isError) ||
    (mode === 'hospital' && hospitalById.isError && hospitalList.isError) ||
    (mode === 'localAuthority' && authorityById.isError && authorityList.isError);

  return { job, isLoading, isError };
}

const JOB_TYPES_ARGS = { page: 0, limit: 200 };

/** Job types for the active role — the API sends `type` as a bare id on the job payload. */
function useJobTypeTitles(mode) {
  const { data: list } = useRoleJobTypes(mode, { args: JOB_TYPES_ARGS });

  return useMemo(() => {
    const titleById = new Map();
    (Array.isArray(list) ? list : []).forEach((item) => {
      const typeId = String(item?.id || item?._id || '').trim();
      const title = String(item?.title || item?.name || item?.label || '').trim();
      if (typeId && title) titleById.set(typeId, title);
    });
    return titleById;
  }, [list]);
}

/** Readable job type: populated object → mapped title → job-type lookup → job name. */
function resolveJobTypeLabel(job, raw, titleById) {
  const typeValue = raw?.type ?? job?.type;

  if (typeValue && typeof typeValue === 'object') {
    const title = String(typeValue.title || typeValue.name || typeValue.label || '').trim();
    if (title) return title;
  }

  const mapped = String(job?.typeTitle || '').trim();
  if (mapped) return mapped;

  const typeId = String(
    job?.typeId || (typeof typeValue === 'string' ? typeValue : '') || ''
  ).trim();
  const matched = typeId ? titleById.get(typeId) : '';
  if (matched) return matched;

  // `name` is written from the job type title when the job is created.
  return String(job?.name || raw?.name || '').trim();
}

/** Collapse `type` (id string, or an expanded object) into one readable row, in place. */
function withResolvedJobType(fields, label) {
  if (!label) return fields;

  let replaced = false;
  const next = [];

  fields.forEach((field) => {
    if (field.key !== 'type' && !field.key.startsWith('type.')) {
      next.push(field);
      return;
    }
    if (replaced) return;
    replaced = true;
    next.push({ key: 'type', label: FIELD_LABELS.type, value: label });
  });

  if (!replaced) next.push({ key: 'type', label: FIELD_LABELS.type, value: label });

  return next;
}

function getModeFromPath(pathname) {
  if (String(pathname).includes('/individual-home-care/')) return 'user';
  if (String(pathname).includes('/hospital/')) return 'hospital';
  if (String(pathname).includes('/local-authority/')) return 'localAuthority';
  return 'careHome';
}

function splitFields(fields) {
  const overviewKeys = ['title', 'name', 'status', 'gender', 'description', 'type', 'image'];
  const locationKeys = ['location.'];
  const userKeys = ['user.'];
  const dateKeys = ['createdAt', 'updatedAt'];

  const overview = [];
  const location = [];
  const postedBy = [];
  const dates = [];

  fields.forEach((field) => {
    if (overviewKeys.includes(field.key)) overview.push(field);
    else if (locationKeys.some((key) => field.key.startsWith(key))) location.push(field);
    else if (userKeys.some((key) => field.key.startsWith(key))) postedBy.push(field);
    else if (dateKeys.includes(field.key)) dates.push(field);
  });

  return { overview, location, postedBy, dates };
}

export function CreatedJobDetailsView() {
  // Admin viewing this account cannot rate the worker.
  const viewOnly = useViewOnly();
  const { id = '' } = useParams();
  const pathname = usePathname();
  const mode = getModeFromPath(pathname);
  const jobTypeTitles = useJobTypeTitles(mode);
  const { job: loadedJob, isLoading, isError } = useCreatedJob(mode, id);
  const reviewDialog = useBoolean();
  const attendanceDialog = useBoolean();
  const [createReview, { isLoading: creatingReview }] = useCreateReviewMutation();
  const [updateReview, { isLoading: updatingReview }] = useUpdateReviewMutation();
  const loadedJobs = useMemo(() => (loadedJob ? [loadedJob] : []), [loadedJob]);
  const { jobs: jobsWithReviews, rememberReview } = useJobsWithReviews(mode, loadedJobs);
  const job = jobsWithReviews[0] || null;

  const { prepareReviewJob } = usePrepareJobReview(mode);
  const [reviewJob, setReviewJob] = useState(null);

  const handleLeaveReview = useCallback(async () => {
    const nextJob = await prepareReviewJob(job);
    if (!nextJob) return;
    setReviewJob(nextJob);
    reviewDialog.onTrue();
  }, [job, prepareReviewJob, reviewDialog]);

  const createdHref = useMemo(() => {
    const current = String(pathname || '').replace(/\/+$/, '');
    if (current.includes('/jobs/created/')) {
      return current.replace(/\/jobs\/created\/.*$/, '/jobs/created');
    }
    if (current.includes('/individual-home-care/')) {
      return paths.dashboard.individualHomeCare.jobs.created;
    }
    if (current.includes('/hospital/')) {
      return paths.dashboard.hospital.jobs.created;
    }
    if (current.includes('/local-authority/')) {
      return paths.dashboard.localAuthority.jobs.created;
    }
    return paths.dashboard.jobs.created;
  }, [pathname]);

  const completed = (() => {
    try {
      return job ? isEmployerJobCompleted(job) : false;
    } catch {
      return false;
    }
  })();
  const status = job ? normalizeJobStatus(job.apiStatus || job.status) : 'active';
  const showAttendance = Boolean(job) && (completed || jobMayHaveAttendance(job));
  const statusConfig =
    (completed ? getJobStatusConfig('completed') : getJobStatusConfig(status)) ||
    getJobStatusConfig('active');
  const startsInLabel = (() => {
    try {
      return job && status === 'active' && !completed ? formatJobStartsInLabel(job) : '';
    } catch {
      return '';
    }
  })();
  const raw =
    job?.raw && typeof job.raw === 'object' && !Array.isArray(job.raw) ? job.raw : job || {};
  let fields = [];
  try {
    fields = flattenJobFields(raw);
  } catch {
    fields = [];
  }
  fields = withResolvedJobType(fields, resolveJobTypeLabel(job, raw, jobTypeTitles));
  const typeImage = resolveJobImageSrc(
    raw.type && typeof raw.type === 'object' ? raw.type.image || raw.type.icon || raw.type.photo : ''
  );
  const ownImage = resolveJobImageSrc(raw.image || job?.image || '');
  const image = ownImage && ownImage !== typeImage ? raw.image || job?.image || '' : '';
  fields = fields.filter((field) => field.key !== 'image' || Boolean(image));
  const sections = splitFields(fields);
  const imageLabel = String(job?.title || job?.type || 'Job');
  const userPhoto = raw.user?.profileIcon || job?.user?.avatarUrl || '';

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
        reviewDialog.onFalse();
      } catch (err) {
        toast.error(err?.data?.message || err?.error || err?.message || 'Could not save rating');
      }
    },
    [createReview, rememberReview, reviewDialog, reviewJob, updateReview]
  );

  return (
    <DashboardContent>
      <Button
        component={RouterLink}
        href={createdHref}
        color="inherit"
        startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
        sx={{ mb: 1, alignSelf: 'flex-start' }}
      >
        Back
      </Button>

      <CustomBreadcrumbs
        heading={job?.title || job?.type || 'Job Details'}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Created Jobs', href: createdHref },
          { name: 'Details' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {isLoading ? (
        <ModuleLoading />
      ) : isError || !job ? (
        <EmptyContent
          title="Job Not Found"
          description="This job could not be loaded."
          action={
            <Button component={RouterLink} href={createdHref} variant="contained" sx={{ mt: 2 }}>
              Back to jobs
            </Button>
          }
        />
      ) : (
        <Stack spacing={3}>
          <Card sx={{ p: 3 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ sm: 'center' }}>
              {resolveJobImageSrc(image) ? (
                <JobMediaThumb
                  image={image}
                  alt={imageLabel}
                  width={96}
                  height={96}
                  borderRadius={2}
                />
              ) : null}
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="h5">{job.title || job.type}</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                  <Chip
                    label={statusConfig?.label || formatTokenValue(status)}
                    color={statusConfig?.color || 'default'}
                    variant="soft"
                  />
                  {startsInLabel ? (
                    <Chip label={startsInLabel} color="warning" variant="soft" />
                  ) : null}
                  {showAttendance ? (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Iconify icon="solar:camera-bold" width={16} />}
                      onClick={attendanceDialog.onTrue}
                    >
                      Attendance
                    </Button>
                  ) : null}
                </Stack>
                {job.address ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {job.address}
                  </Typography>
                ) : null}
              </Box>
              {raw.user?.name || userPhoto ? (
                <Stack alignItems="center" spacing={0.75}>
                  <Avatar
                    src={resolveJobImageSrc(userPhoto) || undefined}
                    alt={raw.user?.name || 'User'}
                    sx={{ width: 56, height: 56 }}
                  >
                    {raw.user?.name?.[0] || 'U'}
                  </Avatar>
                  <Typography variant="caption" color="text.secondary">
                    {raw.user?.name || 'Posted By'}
                  </Typography>
                </Stack>
              ) : null}
            </Stack>
            <ClosedJobReview
              job={job}
              onLeaveReview={viewOnly ? undefined : handleLeaveReview}
              sx={{ mt: 2.5, pt: 2 }}
            />
          </Card>

          <DetailsSection title="Job Details" fields={sections.overview} fallbackAlt={imageLabel} />
          {completed ? null : (
            <JobShiftAlertCard mode={mode} jobId={id} alert={job.alert ?? raw.alert} />
          )}
          <DetailsSection title="Location" fields={sections.location} fallbackAlt={imageLabel} />
          <DetailsSection title="Posted By" fields={sections.postedBy} fallbackAlt={raw.user?.name || imageLabel} />
          <DetailsSection title="Dates" fields={sections.dates} />
        </Stack>
      )}

      <JobAttendanceDialog
        open={attendanceDialog.value}
        mode={mode}
        job={job}
        onClose={attendanceDialog.onFalse}
      />

      {reviewJob && (
        <RateWorkerDialog
          open={reviewDialog.value}
          job={reviewJob}
          onClose={reviewDialog.onFalse}
          onSubmit={handleSubmitReview}
          submitting={creatingReview || updatingReview}
        />
      )}
    </DashboardContent>
  );
}

