import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import { Iconify } from 'src/components/iconify';
import { getJobDateParts, parseJobShiftDate } from 'src/components/jobs/job-date-filters';

// ----------------------------------------------------------------------

function jobsOnDay(jobs, day) {
  return jobs.filter((job) => {
    const parsed = parseJobShiftDate(job.shiftDate || job.shiftRows?.[0]?.date);
    return parsed && isSameDay(parsed, day);
  });
}

function buildMonthOptions(from = new Date()) {
  const start = startOfMonth(addMonths(from, -24));
  return Array.from({ length: 37 }, (_, index) => {
    const value = addMonths(start, index);
    return {
      key: format(value, 'yyyy-MM'),
      label: format(value, 'MMMM yyyy'),
      date: value,
    };
  });
}

function entryChipSx(job) {
  if (job.entryKind === 'availability') {
    return {
      height: 18,
      fontSize: 9,
      fontWeight: 700,
      maxWidth: 1,
      bgcolor: 'action.hover',
      color: 'text.secondary',
      '& .MuiChip-label': {
        px: 0.5,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      },
    };
  }

  return {
    height: 18,
    fontSize: 9,
    fontWeight: 700,
    maxWidth: 1,
    cursor: 'pointer',
    '& .MuiChip-label': {
      px: 0.5,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  };
}

const DAY_ADD_ACTIONS = [
  { id: 'busy', label: 'Mark Busy', icon: 'eva:slash-fill' },
  { id: 'on-call', label: 'On Call', icon: 'eva:plus-fill' },
  { id: 'sleepover', label: 'Sleepover', icon: 'eva:plus-fill' },
  { id: 'day-off', label: 'Day off', icon: 'eva:plus-fill' },
  { id: 'add-leave', label: 'Add leave', icon: 'eva:plus-fill' },
];

export function StaffMemberShiftsCalendar({
  jobs = [],
  month,
  onMonthChange,
  selectedDay,
  onSelectDay,
  onJobClick,
  onAddOnDay,
  adding = false,
}) {
  const [dayMenu, setDayMenu] = useState(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const monthOptions = useMemo(() => buildMonthOptions(new Date()), []);
  const selectedJobs = useMemo(() => jobsOnDay(jobs, selectedDay), [jobs, selectedDay]);
  const selectedAccepted = selectedJobs.filter((job) => job.entryKind !== 'availability');
  const selectedAvailability = selectedJobs.filter((job) => job.entryKind === 'availability');
  const monthKey = format(month, 'yyyy-MM');

  const openJob = (event, job) => {
    event.stopPropagation();
    if (job.entryKind === 'availability') return;
    onJobClick?.(job);
  };

  const openDayMenu = (event, day) => {
    event.stopPropagation();
    onSelectDay?.(day);
    setDayMenu({ anchorEl: event.currentTarget, day });
  };

  // Without `onAddOnDay` (admin viewing the account) the calendar is read-only: no add menu.
  const canAdd = typeof onAddOnDay === 'function';

  const handleDayClick = (event, day) => {
    onSelectDay?.(day);
    if (!canAdd || !isSameMonth(day, month)) return;
    setDayMenu({ anchorEl: event.currentTarget, day });
  };

  const closeDayMenu = () => setDayMenu(null);

  return (
    <Stack spacing={2}>
      <Card sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">{format(month, 'MMMM yyyy')}</Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TextField
              select
              size="small"
              value={monthOptions.some((item) => item.key === monthKey) ? monthKey : ''}
              onChange={(event) => {
                const next = monthOptions.find((item) => item.key === event.target.value);
                if (next) onMonthChange?.(next.date);
              }}
              sx={{ minWidth: 170 }}
            >
              {monthOptions.map((item) => (
                <MenuItem key={item.key} value={item.key}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>
            <IconButton size="small" onClick={() => onMonthChange?.(addMonths(month, -1))}>
              <Iconify icon="eva:arrow-ios-back-fill" width={18} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                onMonthChange?.(startOfMonth(new Date()));
                onSelectDay?.(new Date());
              }}
            >
              <Iconify icon="solar:calendar-bold" width={18} />
            </IconButton>
            <IconButton size="small" onClick={() => onMonthChange?.(addMonths(month, 1))}>
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
                onClick={(event) => handleDayClick(event, day)}
                sx={{
                  minHeight: 92,
                  p: 0.75,
                  borderRadius: 1,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selected ? 'primary.main' : 'divider',
                  bgcolor: selected ? 'primary.lighter' : inMonth ? 'background.paper' : 'action.hover',
                  opacity: inMonth ? 1 : 0.5,
                  position: 'relative',
                  '&:hover .day-plus': {
                    color: 'text.secondary',
                  },
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {format(day, 'd')}
                  </Typography>
                  {inMonth && canAdd ? (
                    <Tooltip title="Mark Busy, On Call, Leave…" arrow>
                      <Box
                        className="day-plus"
                        component="button"
                        type="button"
                        disabled={adding}
                        onClick={(event) => openDayMenu(event, day)}
                        aria-label="Add on this day"
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: 0,
                          border: 'none',
                          bgcolor: 'transparent',
                          color: 'text.disabled',
                          cursor: adding ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Iconify icon="eva:plus-fill" width={14} />
                      </Box>
                    </Tooltip>
                  ) : null}
                </Stack>
                <Stack spacing={0.25} sx={{ mt: 0.25 }}>
                  {dayJobs.slice(0, 3).map((job) => {
                    const parts = getJobDateParts(job);
                    // Availability tags: status only (no times). Jobs: show API times.
                    const label =
                      job.entryKind === 'availability'
                        ? job.title
                        : parts.time ||
                        [job.shiftStartTime, job.shiftEndTime].filter(Boolean).join('–') ||
                        job.title ||
                        '';
                    if (!label) return null;
                    return (
                      <Chip
                        key={job.cardKey || job.id}
                        label={label}
                        size="small"
                        onClick={(event) => openJob(event, job)}
                        sx={entryChipSx(job)}
                      />
                    );
                  })}
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

      <Menu
        anchorEl={dayMenu?.anchorEl}
        open={Boolean(dayMenu?.anchorEl)}
        onClose={closeDayMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {DAY_ADD_ACTIONS.map((action) => (
          <MenuItem
            key={action.id}
            disabled={adding}
            onClick={() => {
              const day = dayMenu?.day;
              closeDayMenu();
              if (day) onAddOnDay?.(action.id, day);
            }}
            sx={{ fontSize: 13, py: 1 }}
          >
            <Iconify icon={action.icon} width={16} sx={{ mr: 1.25, color: 'text.secondary' }} />
            {action.label}
          </MenuItem>
        ))}
      </Menu>

      <Card sx={{ p: 2.5, borderRadius: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
          {format(selectedDay, 'EEEE d MMMM yyyy')}
          <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            {selectedJobs.length
              ? ` · ${selectedJobs.length} item${selectedJobs.length === 1 ? '' : 's'}`
              : ''}
          </Box>
        </Typography>

        <Stack
          direction="row"
          flexWrap="wrap"
          spacing={0.75}
          useFlexGap
          sx={{ mb: 1.5, display: canAdd ? 'flex' : 'none' }}
        >
          {DAY_ADD_ACTIONS.map((action) => (
            <Button
              key={action.id}
              size="small"
              variant="outlined"
              disabled={adding}
              onClick={() => onAddOnDay?.(action.id, selectedDay)}
            >
              {action.label}
            </Button>
          ))}
        </Stack>

        {!selectedJobs.length ? (
          <Typography variant="body2" color="text.secondary">
            Nothing on this date. Click the day (or +) to add Busy / Sleepover / Leave…
          </Typography>
        ) : (
          <Stack spacing={1}>
            {selectedAvailability.map((job) => (
              <Stack
                key={job.cardKey || job.id}
                direction="row"
                spacing={1.5}
                alignItems="center"
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: 'background.neutral',
                }}
              >
                <Box
                  sx={{
                    minWidth: 72,
                    py: 0.75,
                    px: 0.75,
                    borderRadius: 1,
                    bgcolor: 'grey.300',
                    color: 'text.primary',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: 11, fontWeight: 800, lineHeight: 1.2 }}>
                    {job.title}
                  </Typography>
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle2" noWrap>
                    {job.title}
                  </Typography>
                  {(job.shiftStartTime || job.shiftEndTime) && (
                    <Typography variant="caption" color="text.secondary">
                      {[job.shiftStartTime, job.shiftEndTime].filter(Boolean).join(' – ')}
                    </Typography>
                  )}
                </Box>
              </Stack>
            ))}

            {selectedAccepted.map((job) => {
              const parts = getJobDateParts(job);
              return (
                <Stack
                  key={job.cardKey || job.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  onClick={() => onJobClick?.(job)}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: 'background.neutral',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
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
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="subtitle2" noWrap>
                      {job.title || 'Job'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {parts.time ||
                        [job.shiftStartTime, job.shiftEndTime].filter(Boolean).join(' – ')}
                      {job.address ? ` · ${job.address}` : ''}
                    </Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    color="primary.main"
                    sx={{ fontWeight: 700, flexShrink: 0 }}
                  >
                    Details
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        )}
      </Card>
    </Stack>
  );
}
