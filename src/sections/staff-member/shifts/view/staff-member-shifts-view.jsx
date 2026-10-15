import { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { toast } from 'src/components/snackbar';
import { getUserIdentityIds } from 'src/components/shifts/self-only-rota';
import { ModuleLoading } from 'src/components/loading-screen';
import {
  buildAgencyAvailabilityPayload,
} from 'src/sections/agency/shifts/agency-availability-api-utils';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { useScopedUserId, useIsImpersonating } from 'src/hooks/use-scoped-user-id';
import { useViewOnly } from 'src/hooks/use-view-only';
import {
  useCreateNurseAvailabilityMutation,
  useGetNurseAvailabilityQuery,
} from 'src/store/Reducer/nurse-availability-api';
import { useGetNurseBookingsQuery } from 'src/store/Reducer/nurse-bookings-api';

import { StaffMemberShiftsCalendar } from '../staff-member-shifts-calendar';
import { StaffMemberAcceptedJobDialog } from '../staff-member-accepted-job-dialog';
import {
  countShiftsByPeriod,
  filterShiftsByPeriod,
  SHIFT_PERIOD_FILTERS,
} from '../staff-member-shifts-utils';

// ----------------------------------------------------------------------

/** Label from API `status` / title only — no invented copy. */
function availabilityTitleFromApi(entry = {}) {
  const raw =
    entry.displayLabel ||
    entry.raw?.status ||
    entry.apiStatus ||
    entry.status ||
    '';
  const text = String(raw).trim();
  if (!text) return '';
  const key = text.toLowerCase().replace(/[\s_-]+/g, '');
  if (key === 'busy' || key === 'unavailable') return 'Busy';
  if (key === 'oncall') return 'On Call';
  if (key === 'sleepover') return 'Sleepover';
  if (key === 'dayoff' || key === 'notscheduled' || key === 'unscheduled') return 'Day off';
  if (key === 'leave') return 'Leave';
  return text;
}

function mapAvailabilityToCalendarEntry(entry = {}) {
  if (!entry?.date) return null;
  const title = availabilityTitleFromApi(entry);
  if (!title) return null;
  return {
    id: entry.apiId || entry.id,
    cardKey: `availability-${entry.apiId || entry.id}`,
    title,
    shiftDate: entry.date,
    shiftStartTime: entry.startTime || '',
    shiftEndTime: entry.endTime || '',
    address: entry.location || '',
    role: title,
    apiStatus: entry.apiStatus || '',
    status: entry.apiStatus || '',
    entryKind: 'availability',
    staffId: entry.staffId || '',
    busy: Boolean(entry.busy),
    onCall: Boolean(entry.onCall),
    sleepover: Boolean(entry.sleepover),
    dayOff: Boolean(entry.dayOff),
    leave: Boolean(entry.leave),
    raw: entry.raw || entry,
  };
}

/**
 * Own availability only.
 * Under admin impersonation (`requireOwner`), drop rows without a matching staffId.
 */
function filterAvailabilityForUser(entries = [], identityIds, { requireOwner = false } = {}) {
  const allowed = identityIds instanceof Set ? identityIds : new Set(identityIds || []);
  if (!allowed.size) return requireOwner ? [] : entries;

  let anyHasOwner = false;
  const owned = [];

  entries.forEach((entry) => {
    const owner = String(entry?.staffId || '').trim();
    if (!owner) return;
    anyHasOwner = true;
    if (allowed.has(owner)) owned.push(entry);
  });

  if (anyHasOwner) return owned;
  return requireOwner ? [] : entries;
}

/** Map GET /web/nurse/booking rows → calendar job chips (this nurse only). */
function mapBookingsToCalendarJobs(bookings = []) {
  return (bookings || [])
    .filter((row) => row?.shiftDate && row?.shiftStartTime && row?.shiftEndTime)
    .filter((row) => {
      const status = String(row.status || '').toLowerCase();
      return !['cancelled', 'canceled', 'deleted', 'withdrawn', 'rejected'].includes(status);
    })
    .map((row) => ({
      id: row.jobId || row.id,
      cardKey: `booking-${row.id}`,
      bookingId: row.id,
      jobId: row.jobId || '',
      title: row.title || 'Shift',
      shiftDate: row.shiftDate,
      shiftStartTime: row.shiftStartTime,
      shiftEndTime: row.shiftEndTime,
      address: row.address || '',
      role: row.title || '',
      apiStatus: row.status || 'accepted',
      status: row.status || 'accepted',
      entryKind: 'job',
      staffId: row.workerId || '',
      raw: row.raw || row,
    }));
}

function mergeCalendarJobs(...lists) {
  const byKey = new Map();
  const keyOf = (job) =>
    job.entryKind === 'availability'
      ? `availability-${job.id || job.cardKey}`
      : `${job.bookingId || job.cardKey || `${job.shiftDate}-${job.shiftStartTime}-${job.shiftEndTime}-${job.title}`}`;

  lists.flat().forEach((job) => {
    if (!job) return;
    const key = keyOf(job);
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, {
        ...existing,
        ...job,
        bookingId: job.bookingId || existing.bookingId,
        id: job.id || existing.id,
        jobId: job.jobId || job.id || existing.jobId,
        entryKind: job.entryKind || existing.entryKind,
      });
      return;
    }
    byKey.set(key, job);
  });

  return Array.from(byKey.values());
}

export function StaffMemberShiftsView() {
  // Admin viewing this account: the calendar is read-only.
  const viewOnly = useViewOnly();
  const { user } = useSelector((state) => state.user);
  const scopeUserId = useScopedUserId();
  const isImpersonating = useIsImpersonating();
  const [selectedJob, setSelectedJob] = useState(null);
  const [shiftPeriodFilter, setShiftPeriodFilter] = useState('all');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [createAvailability, createAvailabilityState] = useCreateNurseAvailabilityMutation();

  const bookingRange = useMemo(() => {
    const start = startOfWeek(startOfMonth(addMonths(new Date(), -24)), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(addMonths(new Date(), 12)), { weekStartsOn: 1 });
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
    };
  }, []);

  const identityIds = useMemo(() => {
    const ids = new Set(getUserIdentityIds(user));
    if (scopeUserId) ids.add(String(scopeUserId));
    return ids;
  }, [scopeUserId, user]);

  const bookingsQuery = useGetNurseBookingsQuery(
    {
      page: 0,
      limit: 500,
      ...(scopeUserId
        ? {
          userId: scopeUserId,
          // Only under admin impersonation — direct nurse login trusts JWT scoping.
          requireOwner: isImpersonating,
        }
        : {}),
    },
    { skip: !scopeUserId, refetchOnMountOrArgChange: 60, refetchOnFocus: false }
  );

  const availabilityQuery = useGetNurseAvailabilityQuery(
    {
      page: 0,
      limit: 500,
      startDate: bookingRange.startDate,
      endDate: bookingRange.endDate,
      ...(scopeUserId
        ? {
          userId: scopeUserId,
          requireOwner: isImpersonating,
        }
        : {}),
    },
    { skip: !scopeUserId, refetchOnMountOrArgChange: 60, refetchOnFocus: false }
  );

  const allCalendarJobs = useMemo(() => {
    const fromBookings = mapBookingsToCalendarJobs(bookingsQuery.data?.data || []);
    const fromAvailability = filterAvailabilityForUser(
      (availabilityQuery.data?.data || []).map(mapAvailabilityToCalendarEntry).filter(Boolean),
      identityIds,
      { requireOwner: isImpersonating }
    );
    return mergeCalendarJobs(fromBookings, fromAvailability);
  }, [availabilityQuery.data?.data, bookingsQuery.data?.data, identityIds, isImpersonating]);

  const shiftPeriodCounts = useMemo(() => countShiftsByPeriod(allCalendarJobs), [allCalendarJobs]);

  const calendarJobs = useMemo(
    () => filterShiftsByPeriod(allCalendarJobs, shiftPeriodFilter),
    [allCalendarJobs, shiftPeriodFilter]
  );

  const calendarLoading = bookingsQuery.isLoading || availabilityQuery.isLoading;
  const calendarError = bookingsQuery.isError || availabilityQuery.isError;
  const calendarErrorMessage =
    bookingsQuery.error?.data?.message ||
    availabilityQuery.error?.data?.message ||
    bookingsQuery.error?.error ||
    availabilityQuery.error?.error ||
    'Could not load shifts';

  const handleAddOnDay = async (type, day) => {
    const date = format(day, 'yyyy-MM-dd');
    const staffId =
      scopeUserId ||
      getUserIdentityIds(user).find((id) => /^[a-f\d]{24}$/i.test(id)) ||
      '';
    const meta = {
      busy: { status: 'busy', startTime: '00:00', endTime: '23:59' },
      'on-call': { status: 'onCall', startTime: '00:00', endTime: '23:59' },
      sleepover: { status: 'sleepover', startTime: '22:00', endTime: '07:00' },
      'day-off': { status: 'dayOff', startTime: '00:00', endTime: '23:59' },
      'add-leave': { status: 'leave', startTime: '09:00', endTime: '18:00' },
    }[type];
    if (!meta) return;
    try {
      const body = buildAgencyAvailabilityPayload({
        status: meta.status,
        date,
        startTime: meta.startTime,
        endTime: meta.endTime,
        staffId,
      });
      await createAvailability(body).unwrap();
      toast.success('Added on calendar');
      await availabilityQuery.refetch();
    } catch (err) {
      toast.error(err?.data?.message || err?.error || err?.message || 'Could not add on this date');
    }
  };

  const handleMonthChange = (nextMonth) => {
    const start = startOfMonth(nextMonth);
    setMonth(start);
    setSelectedDay((prev) => {
      if (isSameMonth(prev, start)) return prev;
      const today = new Date();
      if (isSameMonth(today, start)) return today;
      return start;
    });
  };

  const handleJobCancelled = useCallback(() => {
    setSelectedJob(null);
    bookingsQuery.refetch();
    availabilityQuery.refetch();
  }, [availabilityQuery, bookingsQuery]);

  return (
    <DashboardContent maxWidth="xl">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Typography variant="h4">Shifts</Typography>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {SHIFT_PERIOD_FILTERS.map((filter) => {
            const selected = shiftPeriodFilter === filter.value;
            return (
              <Button
                key={filter.value}
                size="small"
                variant={selected ? 'contained' : 'outlined'}
                color={selected ? 'primary' : 'inherit'}
                onClick={() => setShiftPeriodFilter(filter.value)}
                sx={{
                  borderRadius: 5,
                  px: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'divider',
                }}
              >
                {filter.label}
                <Chip
                  size="small"
                  label={shiftPeriodCounts[filter.value] || 0}
                  sx={{
                    ml: 1,
                    height: 20,
                    fontSize: 11,
                    bgcolor: selected ? 'primary.contrastText' : 'action.hover',
                    color: selected ? 'primary.main' : 'text.secondary',
                  }}
                />
              </Button>
            );
          })}
        </Stack>
      </Stack>

      {calendarLoading ? (
        <ModuleLoading />
      ) : calendarError ? (
        <Alert severity="error">{calendarErrorMessage}</Alert>
      ) : (
        <StaffMemberShiftsCalendar
          jobs={calendarJobs}
          month={month}
          onMonthChange={handleMonthChange}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onJobClick={setSelectedJob}
          onAddOnDay={viewOnly ? undefined : handleAddOnDay}
          adding={createAvailabilityState.isLoading}
        />
      )}

      <StaffMemberAcceptedJobDialog
        open={Boolean(selectedJob)}
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onCancelled={handleJobCancelled}
      />
    </DashboardContent>
  );
}
