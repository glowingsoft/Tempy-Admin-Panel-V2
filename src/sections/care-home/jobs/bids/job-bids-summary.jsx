import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';

import { BID_SUMMARY_TILES, getJobFilterLabel } from './job-bid-utils';

// ----------------------------------------------------------------------

/** Status count tiles — clicking one applies that status filter (click again to reset). */
export function JobBidsSummary({ counts = {}, activeStatus, onSelectStatus, loading = false }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: { xs: 1.5, md: 2 },
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
        mb: 3,
      }}
    >
      {BID_SUMMARY_TILES.map((tile) => {
        const selected = activeStatus === tile.value;

        return (
          <Card
            key={tile.value}
            sx={{
              borderRadius: 2,
              outline: (theme) => (selected ? `2px solid ${theme.vars.palette[tile.color].main}` : 'none'),
              outlineOffset: -2,
            }}
          >
            <CardActionArea
              aria-pressed={selected}
              aria-label={`${tile.label}: ${counts[tile.value] ?? 0}. ${selected ? 'Showing' : 'Show'} these bids`}
              onClick={() => onSelectStatus(selected && tile.value !== 'all' ? 'all' : tile.value)}
              sx={{ p: { xs: 1.5, md: 2 }, display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: 'flex-start' }}
            >
              <Box
                sx={{
                  width: { xs: 36, md: 44 },
                  height: { xs: 36, md: 44 },
                  flexShrink: 0,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: `${tile.color}.main`,
                  bgcolor: `${tile.color}.lighter`,
                }}
              >
                <Iconify icon={tile.icon} width={22} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" component="p" sx={{ lineHeight: 1.2 }}>
                  {loading ? <Skeleton width={32} /> : counts[tile.value] ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap component="p">
                  {tile.label}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
}

// ----------------------------------------------------------------------

/** Header for a single job (selected via the job filter or in the per-job view). */
export function JobBidsJobHeader({ job, bidCount, action, sx }) {
  if (!job) return null;

  const rate = Number(job.hourlyRate);

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2} sx={{ minWidth: 0, ...sx }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
        <JobMediaThumb image={job.image} alt={getJobFilterLabel(job)} width={52} height={52} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {getJobFilterLabel(job)}
          </Typography>
          <Stack direction="row" flexWrap="wrap" columnGap={2} rowGap={0.25} sx={{ color: 'text.secondary' }}>
            {job.address ? (
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ minWidth: 0, maxWidth: 1 }}>
                <Iconify icon="solar:map-point-bold" width={14} />
                <Typography variant="caption" noWrap>
                  {job.address}
                </Typography>
              </Stack>
            ) : null}
            {Number.isFinite(rate) && rate > 0 ? (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Iconify icon="solar:tag-price-bold" width={14} />
                <Typography variant="caption">Posted at {fCurrency(rate)}/h</Typography>
              </Stack>
            ) : null}
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify icon="solar:hand-money-bold" width={14} />
              <Typography variant="caption">
                {bidCount} bid{bidCount === 1 ? '' : 's'}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      </Stack>
      {action}
    </Stack>
  );
}

export function JobBidsSelectedJobCard({ job, bidCount, canIncreaseRate, onIncreaseRate, onClear }) {
  return (
    <Card sx={{ p: { xs: 2, md: 2.5 }, mb: 3, borderRadius: 2, bgcolor: 'background.neutral', boxShadow: 'none' }}>
      <JobBidsJobHeader
        job={job}
        bidCount={bidCount}
        action={
          <Stack direction="row" gap={1} flexWrap="wrap">
            {canIncreaseRate ? (
              <Button variant="contained" size="small" startIcon={<Iconify icon="solar:tag-price-bold" width={16} />} onClick={onIncreaseRate}>
                Increase rate
              </Button>
            ) : null}
            <Button size="small" variant="outlined" color="inherit" onClick={onClear}>
              Show all jobs
            </Button>
          </Stack>
        }
      />
    </Card>
  );
}
