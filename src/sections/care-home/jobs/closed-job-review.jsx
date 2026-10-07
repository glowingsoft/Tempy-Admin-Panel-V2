import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { resolveJobImageSrc } from 'src/components/jobs/job-image';

import {
  getJobWorkerName,
  getJobWorkerAvatarUrl,
  getWorkerRatingOption,
  isEmployerJobCompleted,
  jobHasWorkerRating,
} from './care-home-job-utils';

function workerInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'W';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function WorkerAvatar({ job, name }) {
  const src = resolveJobImageSrc(getJobWorkerAvatarUrl(job)) || undefined;

  return (
    <Avatar
      src={src}
      alt={name || 'Worker'}
      sx={{
        width: 44,
        height: 44,
        borderRadius: 1.25,
        bgcolor: 'primary.lighter',
        color: 'primary.dark',
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0,
      }}
    >
      {workerInitials(name)}
    </Avatar>
  );
}

export function ClosedJobReview({ job, onLeaveReview, sx }) {
  if (!isEmployerJobCompleted(job)) return null;

  const workerName = getJobWorkerName(job);
  const rated = jobHasWorkerRating(job);
  const ratingOption = rated ? getWorkerRatingOption(job.review) : null;
  const notes = String(job?.review?.comment || '').replace(/^\s*\[[^\]]+\]\s*/i, '');

  if (!rated) {
    return (
      <Box
        sx={{
          pt: 1.5,
          mt: 1.5,
          borderTop: (theme) => `1px dashed ${(theme.vars || theme).palette.divider}`,
          ...sx,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1.5}
        >
          {workerName ? (
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
              <WorkerAvatar job={job} name={workerName} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {workerName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assigned worker
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Box />
          )}

          {onLeaveReview ? (
            <Button
              variant="contained"
              size="small"
              color="warning"
              startIcon={<Iconify icon="eva:star-fill" width={16} />}
              onClick={(event) => {
                event.stopPropagation();
                onLeaveReview(job);
              }}
              sx={{ flexShrink: 0, ml: 'auto' }}
            >
              Rate worker
            </Button>
          ) : null}
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        pt: 1.5,
        mt: 1.5,
        borderTop: (theme) => `1px solid ${(theme.vars || theme).palette.divider}`,
        ...sx,
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ mb: 1.25 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          Worker rating
        </Typography>
        {onLeaveReview ? (
          <Button
            size="small"
            variant="text"
            onClick={(event) => {
              event.stopPropagation();
              onLeaveReview(job);
            }}
            sx={{ minWidth: 'auto' }}
          >
            Change
          </Button>
        ) : null}
      </Stack>

      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <WorkerAvatar job={job} name={workerName || 'Worker'} />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={1}
            sx={{ mb: 0.5 }}
          >
            <Typography variant="subtitle2" fontWeight={700}>
              {workerName || 'Worker'}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
              {job.review?.reviewedAt}
            </Typography>
          </Stack>

          <Chip
            label={ratingOption?.label || 'Rated'}
            size="small"
            color="primary"
            variant="soft"
            sx={{ mb: 0.75 }}
          />

          {notes ? (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {notes}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}
