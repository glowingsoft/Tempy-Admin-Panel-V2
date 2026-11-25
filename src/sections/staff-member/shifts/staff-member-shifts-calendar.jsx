import { useMemo, useRef, useState } from 'react';
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
import { toast } from 'src/components/snackbar';
import { getJobDateParts, parseJobShiftDate } from 'src/components/jobs/job-date-filters';


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
  { id: 'busy', label: 'Mark as busy', icon: 'eva:slash-fill' },
  { id: 'day-off', label: 'Day Off', icon: 'eva:plus-fill' },
  { id: 'add-leave', label: 'Add leave', icon: 'eva:plus-fill' },
  { id: 'other', label: 'Other', icon: 'eva:edit-2-fill' },
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
  const calendarRef = useRef(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const monthOptions = useMemo(() => buildMonthOptions(new Date()), []);
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

  const canAdd = typeof onAddOnDay === 'function';

  const handleDayClick = (event, day) => {
    onSelectDay?.(day);
    if (!canAdd || !isSameMonth(day, month)) return;
    setDayMenu({ anchorEl: event.currentTarget, day });
  };

  const closeDayMenu = () => setDayMenu(null);

  return (
    <Stack spacing={2}>
      <Card ref={calendarRef} className="staff-shifts-diary-print" sx={{ p: 2.5, borderRadius: 2 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">{format(month, 'MMMM yyyy')}</Typography>
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="solar:printer-minimalistic-bold" width={16} />}
              onClick={() => {
                if (!calendarRef.current) {
                  toast.error('Calendar not ready to export');
                  return;
                }
                window.print();
              }}
              sx={{ textTransform: 'none' }}
            >
              Save as image or PDF
            </Button>
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
                    <Tooltip title="Mark as busy, Day Off, Add leave, Other" arrow>
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
                    const label =
                      job.entryKind === 'availability'
                        ? job.notes
                          ? `${job.title}: ${job.notes}`
                          : job.title
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
    </Stack>
  );
}
