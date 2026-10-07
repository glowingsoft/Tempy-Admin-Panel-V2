import { format } from 'date-fns';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';

import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { getJobDateParts } from 'src/components/jobs/job-date-filters';

import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

export function SupplierUpcomingJobsCard({
  title = 'Upcoming jobs',
  jobsHref,
  jobs = [],
  loading = false,
  onJobClick,
}) {
  return (
    <Card sx={{ height: 1 }}>
      <CardHeader
        title={title}
        subheader={jobs.length ? 'Tap a job for details' : undefined}
        action={
          jobsHref ? (
            <Button
              component={RouterLink}
              href={jobsHref}
              size="small"
              color="inherit"
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
            >
              Jobs
            </Button>
          ) : null
        }
      />
      <Stack sx={{ p: 1, pt: 0 }}>
        {loading ? (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 2 }}>
            Loading jobs…
          </Typography>
        ) : jobs.length ? (
          jobs.map((job) => {
            const parts = getJobDateParts(job);
            const parsedDate = parts.day ? new Date(job.shiftDate) : null;
            const weekday = parts.weekday || (parsedDate ? format(parsedDate, 'EEE') : '—');
            const day = parts.day || (parsedDate ? format(parsedDate, 'd') : '—');
            const month = parts.month || (parsedDate ? format(parsedDate, 'MMM') : '');

            return (
              <ListItemButton
                key={job.cardKey || job.id}
                onClick={() => onJobClick?.(job)}
                sx={{ borderRadius: 1, py: 1.25 }}
              >
                <Box
                  sx={{
                    mr: 1.5,
                    minWidth: 52,
                    py: 0.5,
                    borderRadius: 1,
                    bgcolor: 'secondary.lighter',
                    color: 'secondary.dark',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: 10, fontWeight: 800, lineHeight: 1.1 }}>
                    {weekday}
                  </Typography>
                  <Typography sx={{ fontSize: 16, fontWeight: 800, lineHeight: 1.1 }}>
                    {day}
                  </Typography>
                  <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{month}</Typography>
                </Box>
                <ListItemText
                  primary={job.title || 'Job'}
                  secondary={[parts.time || job.schedule, job.address].filter(Boolean).join(' · ')}
                  primaryTypographyProps={{ typography: 'subtitle2', noWrap: true }}
                  secondaryTypographyProps={{ component: 'span', typography: 'caption' }}
                />
                <Iconify
                  icon="eva:arrow-ios-forward-fill"
                  width={16}
                  sx={{ color: 'text.disabled', flexShrink: 0 }}
                />
              </ListItemButton>
            );
          })
        ) : (
          <DashboardEmptyState
            message="No upcoming jobs"
            hint="Jobs with future shift dates will show here"
          />
        )}
      </Stack>
    </Card>
  );
}
