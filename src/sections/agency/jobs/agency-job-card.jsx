import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AvatarGroup from '@mui/material/AvatarGroup';

import { Iconify } from 'src/components/iconify';
import { fCurrency } from 'src/utils/format-number';

// ----------------------------------------------------------------------

function DetailField({ label, value }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {value}
      </Typography>
    </Box>
  );
}

const actionButtonSx = {
  minWidth: 130,
  fontWeight: 700,
  borderRadius: 1,
  border: '2px solid #000',
  boxShadow: '4px 4px 0 0 #000',
  '&:hover': {
    boxShadow: '3px 3px 0 0 #000',
  },
};

function JobHeader({ job, onViewAllSchedules }) {
  const hasMultipleSchedules = job.schedules?.length > 1;

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
      justifyContent="space-between"
      spacing={1}
      sx={{ mb: 0.75 }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" flexWrap="wrap" alignItems="flex-start" spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {job.title}
          </Typography>

          {hasMultipleSchedules ? (
            <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ flex: 1 }}>
              <Stack spacing={0.25}>
                {job.schedules.map((item, index) => (
                  <Typography key={index} variant="body2" sx={{ color: 'text.secondary' }}>
                    {item}
                  </Typography>
                ))}
              </Stack>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onViewAllSchedules?.(job)}
                sx={{
                  minWidth: 'auto',
                  px: 1.25,
                  py: 0.25,
                  fontSize: 12,
                  fontWeight: 600,
                  borderColor: 'grey.400',
                  color: 'text.primary',
                  flexShrink: 0,
                }}
              >
                View All
              </Button>
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.secondary', pt: 0.25 }}>
              {job.schedule}
            </Typography>
          )}
        </Stack>
      </Box>

      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
        {job.postedAt}
      </Typography>
    </Stack>
  );
}

function PostedBySection({ postedBy }) {
  const isCareHome = postedBy?.type === 'care_home';

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>
        Posted By:
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        {isCareHome ? (
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 0.75,
              bgcolor: 'background.paper',
              border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:buildings-2-bold" width={16} />
          </Box>
        ) : (
          <Avatar src={postedBy.avatarUrl || undefined} alt={postedBy.name} sx={{ width: 28, height: 28 }}>
            {postedBy.name?.[0]}
          </Avatar>
        )}
        <Typography variant="body2">{postedBy.name}</Typography>
      </Stack>
    </Box>
  );
}

function ActiveJobFooter({ job, onAssignStaff, onViewStaff }) {
  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          ({job.rating} ★) ({job.reviewCount} reviews)
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {fCurrency(job.totalPay)}{' '}
          <Box component="span" sx={{ fontWeight: 500, color: 'text.secondary' }}>
            {fCurrency(job.hourlyRate)}/h
          </Box>
        </Typography>
      </Stack>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={1.5}>
        {job.actionType === 'viewStaff' && job.assignedStaff?.length > 0 && (
          <AvatarGroup
            max={3}
            sx={{
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                fontSize: 12,
                border: '2px solid #fff',
              },
            }}
          >
            {job.assignedStaff.map((member) => (
              <Avatar key={member.id || member.name} src={member.avatarUrl} alt={member.name} />
            ))}
          </AvatarGroup>
        )}

        {job.actionType === 'assignStaff' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => onAssignStaff?.(job)}
            sx={actionButtonSx}
          >
            Assign Staff
          </Button>
        )}

        {job.actionType === 'assigned' && (
          <Chip
            size="small"
            color="success"
            label="Assigned"
            sx={{ height: 32, fontWeight: 700, fontSize: 12, borderRadius: 1 }}
          />
        )}

        {job.actionType === 'bidUnavailable' && (
          <Chip
            size="small"
            variant="outlined"
            label="Bid unavailable"
            sx={{ height: 32, fontWeight: 600, fontSize: 12, borderRadius: 1, color: 'text.secondary' }}
          />
        )}

        {job.actionType === 'viewStaff' && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => onViewStaff?.(job)}
            sx={actionButtonSx}
          >
            View Staff
          </Button>
        )}
      </Stack>
    </>
  );
}

// ----------------------------------------------------------------------

export function AgencyJobCard({
  job,
  variant = 'new',
  onBid,
  onAssignStaff,
  onViewStaff,
  onViewAllSchedules,
}) {
  return (
    <Box
      sx={{
        p: 2.5,
        height: 1,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        bgcolor: (theme) => theme.vars.palette.grey[100],
        border: (theme) => `1px solid ${theme.vars.palette.divider}`,
      }}
    >
      <JobHeader job={job} onViewAllSchedules={onViewAllSchedules} />

      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
        #{job.id}
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, flexGrow: 1 }}>
        {job.description}
      </Typography>

      <Stack spacing={1.5} sx={{ mb: variant === 'active' ? 2 : 2.5 }}>
        {(job.schedule || job.schedules?.length) && (
          <DetailField
            label="Date & Time:"
            value={
              job.schedules?.length > 1 ? job.schedules.join(' · ') : job.schedule || job.schedules?.[0]
            }
          />
        )}
        <DetailField label="Address:" value={job.address} />
        {job.distance && <DetailField label="Distance:" value={job.distance} />}
        <DetailField label="Gender (Dependent/Care recipient)" value={job.gender} />
        <PostedBySection postedBy={job.postedBy} />
      </Stack>

      {variant === 'new' && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="contained" color="primary" onClick={() => onBid?.(job)} sx={actionButtonSx}>
            Bid Now
          </Button>
        </Box>
      )}

      {variant === 'active' && (
        <ActiveJobFooter job={job} onAssignStaff={onAssignStaff} onViewStaff={onViewStaff} />
      )}
    </Box>
  );
}
