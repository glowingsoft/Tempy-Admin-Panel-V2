import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { getJobDateParts, parseJobShiftDate } from 'src/components/jobs/job-date-filters';

// ----------------------------------------------------------------------

function jobsOnDay(jobs, day) {
  return jobs.filter((job) => {
    const parsed = parseJobShiftDate(job.shiftDate || job.shiftRows?.[0]?.date);
    return parsed && isSameDay(parsed, day);
  });
}

export function AgencyJobsCalendarView({ jobs = [], onJobClick }) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const selectedJobs = useMemo(() => jobsOnDay(jobs, selectedDay), [jobs, selectedDay]);

  const openJob = (event, job) => {
    event?.stopPropagation?.();
    onJobClick?.(job);
  };

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2, borderRadius: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="h6">{format(month, 'MMMM yyyy')}</Typography>
          <Stack direction="row">
            <IconButton size="small" onClick={() => setMonth((prev) => addMonths(prev, -1))}>
              <Iconify icon="eva:arrow-ios-back-fill" width={18} />
            </IconButton>
            <IconButton size="small" onClick={() => setMonth(startOfMonth(new Date()))}>
              <Iconify icon="solar:calendar-bold" width={18} />
            </IconButton>
            <IconButton size="small" onClick={() => setMonth((prev) => addMonths(prev, 1))}>
              <Iconify icon="eva:arrow-ios-forward-fill" width={18} />
            </IconButton>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 0.75,
          }}
        >
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
            <Typography
              key={label}
              variant="caption"
              sx={{ fontWeight: 700, color: 'text.secondary', textAlign: 'center', pb: 0.5 }}
            >
              {label}
            </Typography>
          ))}

          {days.map((day) => {
            const dayJobs = jobsOnDay(jobs, day);
            const inMonth = isSameMonth(day, month);
            const selected = isSameDay(day, selectedDay);

            return (
              <Box
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                sx={{
                  minHeight: 88,
                  p: 0.75,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'primary.lighter' : inMonth ? 'background.paper' : 'action.hover',
                  opacity: inMonth ? 1 : 0.55,
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                  {format(day, 'd')}
                </Typography>
                <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                  {dayJobs.slice(0, 3).map((job) => (
                    <Chip
                      key={job.cardKey || job.id}
                      label={job.title || 'Job'}
                      size="small"
                      onClick={onJobClick ? (event) => openJob(event, job) : undefined}
                      sx={{
                        height: 18,
                        fontSize: 9,
                        fontWeight: 700,
                        maxWidth: 1,
                        cursor: onJobClick ? 'pointer' : 'default',
                        '& .MuiChip-label': { px: 0.5, overflow: 'hidden', textOverflow: 'ellipsis' },
                      }}
                    />
                  ))}
                  {dayJobs.length > 3 ? (
                    <Typography variant="caption" sx={{ fontSize: 9, color: 'text.secondary' }}>
                      +{dayJobs.length - 3} more
                    </Typography>
                  ) : null}
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Card>

      <Card sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          {format(selectedDay, 'EEEE d MMMM yyyy')}
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {` · ${selectedJobs.length} job${selectedJobs.length === 1 ? '' : 's'}`}
          </Box>
        </Typography>

        {!selectedJobs.length ? (
          <Typography variant="body2" color="text.secondary">
            No jobs on this date.
          </Typography>
        ) : (
          <Stack spacing={1}>
            {selectedJobs.map((job) => {
              const parts = getJobDateParts(job);
              return (
                <Stack
                  key={job.cardKey || job.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  onClick={onJobClick ? () => onJobClick(job) : undefined}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: 'background.neutral',
                    ...(onJobClick
                      ? {
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                        }
                      : null),
                  }}
                >
                  <Box
                    sx={{
                      minWidth: 56,
                      py: 0.5,
                      px: 0.75,
                      borderRadius: 1,
                      bgcolor: 'primary.main',
                      color: 'primary.contrastText',
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontSize: 10, fontWeight: 700, lineHeight: 1.1 }}>
                      {parts.weekday}
                    </Typography>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, lineHeight: 1.1 }}>
                      {parts.day}
                    </Typography>
                    <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{parts.month}</Typography>
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap>
                      {job.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {parts.time || 'Time TBC'}
                      {job.address ? ` · ${job.address}` : ''}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
