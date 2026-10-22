import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addDays,
  eachDayOfInterval,
  format,
  parse,
  isValid,
  differenceInMinutes,
  subWeeks,
  addWeeks,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  startOfWeek,
} from 'date-fns';

import LoadingButton from '@mui/lab/LoadingButton';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Portal from '@mui/material/Portal';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';
import { getJobApiErrorMessage } from 'src/sections/care-home/jobs/care-home-job-api-utils';
import { ShiftDayHeaderCell } from 'src/components/shifts/shift-day-header-cell';
import { ShiftRotaGridScroll, useDragScroll } from 'src/components/shifts/shift-rota-grid-scroll';
import {
  ROSTER_SCOPE,
  countHiddenRosterMembers,
  countRosterMembers,
  mapTeamsByRosterScope,
} from 'src/components/shifts/roster-scope';
import { PostedJobsSidebarPanel } from 'src/sections/care-home/shifts/posted-jobs-sidebar-panel';
import { useEmployerPostedJobs } from 'src/sections/care-home/shifts/use-employer-posted-jobs';
import {
  ALL_LOCATIONS_ID,
  formatLocationDistanceLabel,
  getLocationDisplayTitle,
  withAllLocationsOption,
} from 'src/components/shifts/location-options';
import { toast } from 'src/components/snackbar';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { DashboardContent } from 'src/layouts/dashboard';
import { hideScrollY } from 'src/theme/styles/mixins';
import { useMockedUser } from 'src/auth/hooks';
import { useSelector } from 'react-redux';
import {
  buildSelfOnlyTeams,
  deriveStaffMapsFromTeams,
  filterTeamsForStaffMemberDashboard,
  hydrateStaffMemberCalendarTeams,
  remapShiftsOntoStaffRows,
} from 'src/components/shifts/self-only-rota';
import { StandaloneAddressInput } from 'src/sections/tempy-home/standalone-address-input';
import { useRoleJobTypes } from 'src/sections/job-roles/use-role-job-types';
import {
  JOB_TYPE_OPTIONS,
  teamLabelToJobType,
  findBestTeamForJobType,
} from 'src/sections/care-home/jobs/care-home-job-utils';
import {
  availabilityBlocksToShiftEntries,
  formatBusyDayLabel,
  removeAvailabilityBlock,
  upsertAvailabilityBlock,
} from 'src/sections/agency/shifts/agency-staff-availability';
import {
  buildAgencyAvailabilityPayload,
  availabilityListToShiftMap,
  flattenTeamsStaff,
  mapAgencyBranchesToLocations,
} from 'src/sections/agency/shifts/agency-availability-api-utils';
import {
  formatCalendarMetaStats,
  getAgencyBranchLatLng,
  getFirstAgencyBranchLatLng,
} from 'src/sections/agency/shifts/agency-booking-calendar-api-utils';
import { getAgencyUserLatLng, extractLatLng } from 'src/sections/agency/jobs/agency-job-api-utils';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { useGetUserByIdQuery } from 'src/store/Reducer/users-api';
import { useGetAgencyBranchesQuery } from 'src/store/Reducer/agency-branches-api';
import {
  useCreateAgencyAvailabilityMutation,
  useCreateAgencyBookingMutation,
  useDeleteAgencyAvailabilityMutation,
  useGetAgencyAvailabilityQuery,
  useGetAgencyBookingCalendarQuery,
  useUpdateAgencyAvailabilityMutation,
} from 'src/store/Reducer/agency-availability-api';
import { useGetAgencyBidsQuery } from 'src/store/Reducer/agency-bids-api';
import { canAssignFromAgencyBid } from 'src/sections/agency/bids/agency-bid-api-utils';
import { useGetHomeCareCompanyBranchesQuery } from 'src/store/Reducer/home-care-company-branches-api';
import {
  useCreateHomeCareCompanyAvailabilityMutation,
  useDeleteHomeCareCompanyAvailabilityMutation,
  useGetHomeCareCompanyAvailabilityQuery,
  useGetHomeCareCompanyBookingCalendarQuery,
  useUpdateHomeCareCompanyAvailabilityMutation,
} from 'src/store/Reducer/home-care-company-availability-api';
import { useGetNurseBranchesQuery } from 'src/store/Reducer/nurse-branches-api';
import {
  useCreateNurseAvailabilityMutation,
  useDeleteNurseAvailabilityMutation,
  useGetNurseAvailabilityQuery,
  useGetNurseBookingCalendarQuery,
  useUpdateNurseAvailabilityMutation,
} from 'src/store/Reducer/nurse-availability-api';
import { useViewOnly } from 'src/hooks/use-view-only';

const SIDEBAR_ACTIONS = [
  { id: 'add-shift', label: 'Smart Assign', icon: 'eva:person-add-fill' },
  { id: 'busy', label: 'Mark Busy (block auto-accept)', icon: 'eva:slash-fill' },
  { id: 'on-call', label: 'On Call Schedule', icon: 'eva:plus-fill' },
  { id: 'sleepover', label: 'Sleepover Schedule', icon: 'eva:plus-fill' },
  { id: 'day-off', label: 'Schedule this day off', icon: 'eva:plus-fill' },
  { id: 'not-scheduled', label: 'Not Scheduled', icon: 'eva:plus-fill' },
  { id: 'add-leave', label: 'Add Leave', icon: 'eva:plus-fill' },
];

const CALENDAR_SIDEBAR_ACTIONS = SIDEBAR_ACTIONS.filter((action) => action.id !== 'add-shift');

const STAFF_COL_W = 188;
const DAY_COL_W = 88;
const ROW_H = 46;
const TEAM_HEADER_H = 40;
const STAFF_CONTRACT_H = 48;

const AGENCY_TEAMS = [
  {
    id: 'mgmt-home-manager',
    color: '#e53935',
    badge: 'HM',
    badgeColor: '#546e7a',
    label: 'Management - Home Manager',
    staff: [
      { id: 1, name: 'Casey Smith', role: 'Home Manager' },
      { id: 2, name: 'david beattie', role: 'Deputy' },
      { id: 3, name: 'Vacant', isVacant: true },
    ],
  },
  {
    id: 'mgmt-deputy',
    color: '#212121',
    badge: 'DM',
    badgeColor: '#455a64',
    label: 'Management - Deputy Manager',
    staff: [
      { id: 4, name: 'Alice Brown', role: 'Deputy Manager' },
      { id: 5, name: 'Robert Green', role: 'Deputy Manager' },
    ],
  },
  {
    id: 'mgmt-head-care',
    color: '#455a64',
    badge: 'Ho',
    badgeColor: '#546e7a',
    label: 'Management - Head of Care',
    staff: [
      { id: 6, name: 'Carol White', role: 'Head of Care' },
      { id: 7, name: 'Dan Bishop', role: 'Head of Care' },
    ],
  },
  {
    id: 'care-assistant-bank',
    color: '#039be5',
    badge: 'CB',
    badgeColor: '#0277bd',
    label: 'Care - Care Assistant Days - Bank',
    staff: [
      { id: 8, name: 'Eve Johnson', role: 'Care Assistant' },
      { id: 9, name: 'Fiona Hart', role: 'Care Assistant' },
      { id: 10, name: 'Grace Lee', role: 'Care Assistant', isPast: true },
    ],
  },
  {
    id: 'care-senior',
    color: '#1565c0',
    badge: 'SC',
    badgeColor: '#1565c0',
    label: 'Care - Senior Care Days',
    staff: [
      { id: 11, name: 'Frank Miller', role: 'Senior Care' },
      { id: 12, name: 'Henry Davis', role: 'Senior Care', isPast: true },
    ],
  },
  {
    id: 'care-lead',
    color: '#00897b',
    badge: 'LC',
    badgeColor: '#00695c',
    label: 'Care - Lead Care Assistant Days',
    staff: [
      { id: 13, name: 'Iris Wilson', role: 'Lead Care Assistant' },
      { id: 14, name: 'Jack Taylor', role: 'Lead Care Assistant', isPast: true },
    ],
  },
  {
    id: 'care-assistant',
    color: '#0277bd',
    badge: 'CA',
    badgeColor: '#0288d1',
    label: 'Care - Care Assistant Days',
    staff: [
      { id: 15, name: 'Karen Adams', role: 'Care Assistant' },
      { id: 16, name: 'Leo Martin', role: 'Care Assistant' },
      { id: 17, name: 'Maria Scott', role: 'Care Assistant', isPast: true },
    ],
  },
  {
    id: 'care-senior-nights',
    color: '#0d47a1',
    badge: 'SN',
    badgeColor: '#1565c0',
    label: 'Care - Senior Care Nights',
    staff: [
      { id: 18, name: 'Nina Brooks', role: 'Senior Care' },
      { id: 19, name: 'Owen Clarke', role: 'Senior Care' },
    ],
  },
  {
    id: 'care-lead-nights',
    color: '#004d40',
    badge: 'LN',
    badgeColor: '#00695c',
    label: 'Care - Lead Care Assistant Nights',
    staff: [
      { id: 20, name: 'Paula Nguyen', role: 'Lead Care Assistant' },
      { id: 21, name: 'Quinn Patel', role: 'Lead Care Assistant' },
    ],
  },
  {
    id: 'others',
    color: '#9e9e9e',
    badge: 'OT',
    badgeColor: '#757575',
    label: 'Others',
    staff: [
      { id: 22, name: 'Sam Rivera', role: 'Unassigned', isPast: true },
      { id: 23, name: 'Taylor Brooks', role: 'Unassigned', isPast: true },
      { id: 24, name: 'Jordan Lee', role: 'Unassigned', isPast: true },
    ],
  },
];

const ALL_STAFF = AGENCY_TEAMS.flatMap((t) => t.staff.filter((s) => !s.isVacant));

const STAFF_TEAM_MAP = AGENCY_TEAMS.reduce((acc, team) => {
  team.staff.forEach((member) => {
    acc[member.id] = team;
  });
  return acc;
}, {});

const FORTNIGHT_START = new Date(2025, 4, 25);
const STAFF_MEMBER_SELF_ID = 9001;

function buildSelfOnlyInitialShifts(staffId, anchorDate = new Date()) {
  const origin = startOfWeek(
    anchorDate instanceof Date && isValid(anchorDate) ? anchorDate : new Date(),
    { weekStartsOn: 1 }
  );
  const shifts = {};
  let seedSeq = 0;
  const add = (dayOffset, start, end, meta = {}) => {
    const date = format(addDays(origin, dayOffset), 'yyyy-MM-dd');
    const key = cellKey(staffId, date);
    const existing = normalizeCellShifts(shifts[key]);
    seedSeq += 1;
    const entry = {
      id: `${staffId}-${date}-seed-${seedSeq}`,
      staffId,
      date,
      startTime: start,
      endTime: end,
      ...meta,
    };
    const nextEntries = withScheduleNumbers([...existing.filter(isTimedWorkShift), entry]);
    shifts[key] = nextEntries.length === 1 ? nextEntries[0] : nextEntries;
  };

  add(0, '09:00', '17:00');
  add(1, '09:00', '17:00');
  add(7, '08:30', '16:30');
  add(8, '09:00', '17:00');

  return shifts;
}

function buildDemoRotaShifts(staffIds = [], startDate = new Date()) {
  const origin = startOfWeek(
    startDate instanceof Date && isValid(startDate) ? startDate : new Date(),
    { weekStartsOn: 1 }
  );
  return staffIds.reduce(
    (acc, staffId) => ({ ...acc, ...buildSelfOnlyInitialShifts(staffId, origin) }),
    {}
  );
}


function formatShiftTime(t) {
  if (!t?.includes(':')) return '--:--';
  const [h, m] = t.split(':');
  const hour = parseInt(h, 10);
  const min = parseInt(m, 10);
  if (!Number.isFinite(hour) || !Number.isFinite(min)) return '--:--';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${String(min).padStart(2, '0')} ${suffix}`;
}

function shiftHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const start = parse(startTime, 'HH:mm', new Date());
  const end = parse(endTime, 'HH:mm', new Date());
  if (!isValid(start) || !isValid(end)) return 0;
  const diff = differenceInMinutes(end, start) / 60;
  return Number.isFinite(diff) ? diff : 0;
}

function formatHoursLabel(hours) {
  const value = Number.isFinite(hours) ? Math.round(hours) : 0;
  return `${value}h`;
}

function cellKey(staffId, date) {
  return `${staffId}-${date}`;
}

function coerceStaffId(value) {
  if (value == null || value === '') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = String(value).trim();
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw;
}

function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || '').trim());
}

function isStatusBlock(shift) {
  return Boolean(
    shift?.busy ||
    shift?.dayOff ||
    shift?.leave ||
    shift?.blocksAutoAccept ||
    shift?.onCall ||
    shift?.sleepover ||
    shift?.allDay
  );
}

function isTimedWorkShift(shift) {
  return Boolean(shift && !isStatusBlock(shift) && shift.startTime && shift.endTime);
}

function normalizeCellShifts(raw) {
  if (!raw) return [];
  return (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
}

function getDayShifts(shifts, staffId, date) {
  return normalizeCellShifts(shifts[cellKey(staffId, date)]);
}

function getTimedDayShifts(shifts, staffId, date) {
  return getDayShifts(shifts, staffId, date).filter(isTimedWorkShift);
}

function flattenShiftEntries(shifts) {
  return Object.values(shifts).flatMap((value) => normalizeCellShifts(value));
}

function withScheduleNumbers(entries) {
  const timed = entries.filter(isTimedWorkShift);
  const count = timed.length;
  return entries.map((entry) => {
    if (!isTimedWorkShift(entry)) return entry;
    const index = timed.findIndex((item) => item.id === entry.id) + 1;
    return {
      ...entry,
      scheduleIndex: index,
      scheduleCount: count,
    };
  });
}

function writeDayShifts(shiftsMap, staffId, date, entries) {
  const key = cellKey(staffId, date);
  const next = { ...shiftsMap };
  const numbered = withScheduleNumbers(entries.filter(Boolean));

  if (!numbered.length) {
    delete next[key];
    return next;
  }

  next[key] = numbered.length === 1 ? numbered[0] : numbered;
  return next;
}

function collapseAcceptedJobsOntoStaff(shifts = {}, staffId) {
  if (!staffId) return {};
  let next = {};
  flattenShiftEntries(shifts)
    .filter(isTimedWorkShift)
    .forEach((shift) => {
      if (!shift.date) return;
      const current = getDayShifts(next, staffId, shift.date);
      if (current.some((item) => String(item.id) === String(shift.id))) return;
      next = writeDayShifts(next, staffId, shift.date, [...current, { ...shift, staffId }]);
    });
  return next;
}

function createShiftId(staffId, date) {
  return `${staffId}-${date}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function buildInitialShifts() {
  const shifts = { ...availabilityBlocksToShiftEntries() };
  let seedSeq = 0;
  const add = (staffId, dayOffset, start, end, meta = {}) => {
    const date = format(addDays(FORTNIGHT_START, dayOffset), 'yyyy-MM-dd');
    const key = cellKey(staffId, date);
    const existing = normalizeCellShifts(shifts[key]);
    if (existing.some(isStatusBlock)) return;

    seedSeq += 1;
    const entry = {
      id: `${staffId}-${date}-seed-${seedSeq}`,
      staffId,
      date,
      startTime: start,
      endTime: end,
      ...meta,
    };

    if (isStatusBlock(entry)) {
      shifts[key] = entry;
      return;
    }

    const nextEntries = withScheduleNumbers([...existing.filter(isTimedWorkShift), entry]);
    shifts[key] = nextEntries.length === 1 ? nextEntries[0] : nextEntries;
  };

  add(1, 0, '08:00', '12:00', { warning: true, location: 'Sunrise Care Home' });
  add(1, 0, '13:00', '17:00', { location: 'Meadow View Residence' }); // same day · 2 shifts
  add(1, 1, '08:00', '17:00');
  add(1, 2, '08:00', '17:00', { shield: true });
  add(1, 4, '08:00', '17:00');
  add(2, 0, '08:00', '12:00', { warning: true });
  add(2, 0, '14:00', '20:00', { location: 'Agnes Care — Client A' }); // same day · 2 shifts
  add(2, 3, '08:00', '17:00');
  add(8, 0, '07:00', '15:00');
  add(8, 1, '07:00', '15:00');
  add(8, 5, '07:00', '15:00', { shield: true });
  add(9, 2, '08:00', '16:00');
  add(11, 0, '08:00', '16:00');
  add(11, 3, '08:00', '16:00', { warning: true });
  add(15, 1, '08:00', '16:00');
  add(15, 4, '08:00', '16:00');
  add(3, 6, '00:00', '23:59', { allDay: true });
  add(3, 10, '00:00', '23:59', { allDay: true, shield: true });

  return shifts;
}

function computeStats(shifts) {
  const entries = flattenShiftEntries(shifts);
  let totalHours = 0;
  entries.forEach((shift) => {
    if (isStatusBlock(shift) && !shift.allDay) return;
    if (shift.allDay || shift.dayOff || shift.leave || shift.busy) return;
    totalHours += shiftHours(shift.startTime, shift.endTime);
  });
  return {
    hours: `${Math.round(totalHours)}h`,
    cost: `£${Math.round(totalHours * 13.65).toLocaleString()}`,
    count: String(entries.filter(isTimedWorkShift).length),
  };
}

function computeStaffHours(shifts, staffId, days) {
  return days.reduce((acc, day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return (
      acc +
      getTimedDayShifts(shifts, staffId, dateStr).reduce(
        (sum, sh) => sum + shiftHours(sh.startTime, sh.endTime),
        0
      )
    );
  }, 0);
}

function computeStaffBreakStatus(shifts, staffId, days) {
  const needsBreak = days.some((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return getTimedDayShifts(shifts, staffId, dateStr).some(
      (sh) => shiftHours(sh.startTime, sh.endTime) > 6
    );
  });
  return needsBreak ? 'Break Required' : 'No Breaks';
}

function applyFormPreviewHours(shifts, staffId, days, formPreview) {
  let hours = computeStaffHours(shifts, staffId, days);
  if (!formPreview || formPreview.staffId !== staffId || !formPreview.date) return hours;

  const startTime = timeInputToHHMM(formPreview.startTime);
  const endTime = timeInputToHHMM(formPreview.endTime);
  if (!startTime || !endTime) return hours;

  const previewH = shiftHours(startTime, endTime);
  const editingId = formPreview.editingId;
  const dayShifts = getTimedDayShifts(shifts, formPreview.staffId, formPreview.date);

  if (editingId) {
    const existing = dayShifts.find((item) => item.id === editingId);
    if (existing) hours -= shiftHours(existing.startTime, existing.endTime);
  }

  hours += previewH;
  return Number.isFinite(hours) ? hours : computeStaffHours(shifts, staffId, days);
}

function computeDayHours(shifts, days) {
  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return flattenShiftEntries(shifts).reduce((acc, shift) => {
      if (shift.date !== dateStr || shift.allDay || shift.dayOff || shift.leave || shift.busy) {
        return acc;
      }
      if (!isTimedWorkShift(shift)) return acc;
      return acc + shiftHours(shift.startTime, shift.endTime);
    }, 0);
  });
}

function getAnchorPosition(anchor) {
  const rect = anchor.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left,
    bottom: rect.bottom,
    right: rect.right,
    width: rect.width,
    height: rect.height,
  };
}

function findTeamForJobType(jobType, teams = AGENCY_TEAMS) {
  return findBestTeamForJobType(jobType, teams);
}

function resolveStaffIdForJobType(jobType, clickedStaffId, teams = AGENCY_TEAMS) {
  const targetTeam = findTeamForJobType(jobType, teams);
  if (!targetTeam) {
    return { staffId: clickedStaffId, teamMatched: false };
  }

  const clickedInTargetTeam = targetTeam.staff.find(
    (member) => member.id === clickedStaffId && !member.isVacant
  );
  if (clickedInTargetTeam) {
    return { staffId: clickedStaffId, teamMatched: true, team: targetTeam };
  }

  const firstAvailable = targetTeam.staff.find((member) => !member.isVacant);
  return {
    staffId: firstAvailable?.id || clickedStaffId,
    teamMatched: true,
    team: targetTeam,
  };
}

function buildFormInputs(shift, staff, team, bid = null) {
  return {
    bidId: bid?.id || '',
    startInput: bid?.startTime || shift?.startTime?.slice(0, 5) || '',
    endInput: bid?.endTime || shift?.endTime?.slice(0, 5) || '',
    staffId: staff?.id || '',
    shiftLocation: bid?.location || bid?.address || shift?.location || '',
    manualJobType:
      bid?.jobTypeTitle || shift?.manualJobType || teamLabelToJobType(team?.label) || '',
  };
}

const MODAL_W = 300;
const SIDEBAR_W = 268;
const FORM_BADGE_W = 44;

function getModalPosition(anchorRect) {
  if (!anchorRect) {
    return { bottom: 24, left: SIDEBAR_W + 12 };
  }

  const MIN_TOP = 88;
  const top = Math.max(MIN_TOP, anchorRect.bottom + 12);
  let left = anchorRect.left + anchorRect.width / 2 - MODAL_W / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - MODAL_W - 12));

  const maxTop = window.innerHeight - 220;
  return { top: Math.min(top, Math.max(MIN_TOP, maxTop)), left };
}

function timeInputToHHMM(value) {
  if (!value?.trim()) return '';
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return '';

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return '';

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatTimeInputWhileTyping(value) {
  let next = value.replace(/[^\d:]/g, '');

  if ((next.match(/:/g) || []).length > 1) {
    const [hours, ...rest] = next.split(':');
    next = `${hours}:${rest.join('')}`;
  }

  if (!next.includes(':')) {
    const digits = next.replace(/\D/g, '').slice(0, 4);

    if (digits.length <= 2) {
      if (digits.length === 2 && Number(digits) > 23) {
        return digits.slice(0, 1);
      }
      return digits;
    }

    const hours = Math.min(Number(digits.slice(0, 2)), 23);
    const minutes = digits.slice(2, 4);
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const [rawHours = '', rawMinutes = ''] = next.split(':');
  let hours = rawHours.slice(0, 2);
  let minutes = rawMinutes.replace(/\D/g, '').slice(0, 2);

  if (hours && Number(hours) > 23) {
    hours = '23';
  }

  if (minutes.length === 1 && Number(minutes) > 5) {
    minutes = '5';
  }

  if (minutes.length === 2 && Number(minutes) > 59) {
    minutes = '59';
  }

  return minutes.length ? `${hours}:${minutes}` : hours;
}

function computeBreakLabelWithPreview(shifts, staffId, days, formPreview) {
  const longShiftInRota = days.some((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return getTimedDayShifts(shifts, staffId, dateStr).some(
      (sh) => shiftHours(sh.startTime, sh.endTime) > 6
    );
  });

  const previewStart = timeInputToHHMM(formPreview?.startTime);
  const previewEnd = timeInputToHHMM(formPreview?.endTime);

  const previewLong =
    formPreview?.staffId === staffId &&
    previewStart &&
    previewEnd &&
    shiftHours(previewStart, previewEnd) > 6;

  return longShiftInRota || previewLong ? 'Break Required' : 'No Breaks';
}

function formatTimeRangeLabel(startTime, endTime) {
  const display = (value) => {
    if (!value?.trim()) return '--:--';
    const normalized = timeInputToHHMM(value);
    if (normalized) return formatShiftTime(normalized);
    return '--:--';
  };

  const start = display(startTime);
  const end = display(endTime);
  if (start === '--:--' && end === '--:--') return '--:-- - --:--';
  return `${start} - ${end}`;
}

function ShiftDetailRow({ badge, icon, label }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 0.65 }}>
      {badge ? (
        <Box
          sx={{
            width: 22,
            height: 22,
            bgcolor: '#546e7a',
            color: '#fff',
            borderRadius: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 9,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {badge}
        </Box>
      ) : (
        <Iconify icon={icon} width={18} sx={{ color: '#757575', flexShrink: 0 }} />
      )}
      <Typography sx={{ fontSize: 12, color: '#616161', lineHeight: 1.3 }}>{label}</Typography>
    </Stack>
  );
}

function getStaffShiftLocation(shifts, staffId, preferredDate, liveLocation = '') {
  if (!preferredDate) return '';

  if (liveLocation?.trim()) return liveLocation.trim();

  const dayShifts = getTimedDayShifts(shifts, staffId, preferredDate);
  return dayShifts.find((shift) => shift.location?.trim())?.location?.trim() || '';
}

function ShiftDetailsExpandable({ selectedStaff, team, formPreview, shifts, days, locationLabel }) {
  const [expanded, setExpanded] = useState(true);

  if (!selectedStaff) return null;

  const previewStart = timeInputToHHMM(formPreview?.startTime);
  const previewEnd = timeInputToHHMM(formPreview?.endTime);

  const hours =
    previewStart && previewEnd
      ? applyFormPreviewHours(shifts, selectedStaff.id, days, {
        ...formPreview,
        startTime: previewStart,
        endTime: previewEnd,
      })
      : computeStaffHours(shifts, selectedStaff.id, days);

  const breakLabel = computeBreakLabelWithPreview(shifts, selectedStaff.id, days, formPreview);
  const timeRange = formatTimeRangeLabel(formPreview?.startTime, formPreview?.endTime);
  const role = selectedStaff.role || 'Staff';

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        fullWidth
        onClick={() => setExpanded((v) => !v)}
        endIcon={
          <Iconify icon={expanded ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'} width={14} />
        }
        sx={{
          justifyContent: 'flex-start',
          color: '#616161',
          fontSize: 11.5,
          fontWeight: 500,
          textTransform: 'none',
          px: 0,
          py: 0.5,
          minHeight: 'auto',
          '&:hover': { bgcolor: 'transparent', color: '#424242' },
        }}
      >
        {expanded ? 'Less Information' : 'More Information'}
      </Button>

      {expanded && (
        <Box sx={{ pl: 0.25, pt: 0.25 }}>
          <ShiftDetailRow badge={team?.badge} label={role} />
          <ShiftDetailRow icon="solar:clock-circle-outline" label={timeRange} />
          <ShiftDetailRow icon="solar:cup-hot-bold" label={breakLabel} />
          <ShiftDetailRow icon="solar:clock-circle-bold" label={formatHoursLabel(hours)} />
          {locationLabel && (
            <ShiftDetailRow icon="solar:map-point-bold" label={locationLabel} />
          )}
        </Box>
      )}
    </Box>
  );
}


function ShiftFormCard({
  team,
  shift,
  date,
  startInput,
  endInput,
  staffId,
  shiftLocation,
  manualJobType,
  bidId = '',
  assignableBids = [],
  assignMode = false,
  assigning = false,
  jobTypeOptions = JOB_TYPE_OPTIONS,
  onStartInputChange,
  onEndInputChange,
  onStaffIdChange,
  onShiftLocationChange,
  onManualJobTypeChange,
  onBidIdChange,
  onClose,
  onSave,
  onDelete,
  onCopy,
  onStaffChange,
}) {
  const [moreAnchor, setMoreAnchor] = useState(null);
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);

  const normalizedJobTypes = useMemo(
    () =>
      (jobTypeOptions || []).map((item) =>
        typeof item === 'string'
          ? { id: item, title: item }
          : {
            id: item.id || item.title || item.label,
            title: item.title || item.label || item.id,
          }
      ),
    [jobTypeOptions]
  );

  const selectedBid = useMemo(
    () => assignableBids.find((bid) => String(bid.id) === String(bidId)) || null,
    [assignableBids, bidId]
  );

  const displayStart = assignMode ? startInput || selectedBid?.startTime || '—' : startInput;
  const displayEnd = assignMode ? endInput || selectedBid?.endTime || '—' : endInput;
  const displayLocation =
    assignMode ? shiftLocation || selectedBid?.location || selectedBid?.address || '—' : shiftLocation;

  const handleSave = async (keepOpen = false) => {
    if (!staffId || !date) return;

    if (assignMode) {
      if (!bidId) {
        toast.error('Select a bid/shift to assign');
        return;
      }
      try {
        await Promise.resolve(
          onSave({
            bidId,
            staffId: coerceStaffId(staffId),
            date: selectedBid?.scheduleDate || date,
            startTime: displayStart !== '—' ? displayStart : '',
            endTime: displayEnd !== '—' ? displayEnd : '',
            location: displayLocation !== '—' ? displayLocation : '',
            manualJobType: manualJobType || '',
            notes: shift?.notes || '',
            assignMode: true,
          })
        );
        if (!keepOpen) onClose();
      } catch {

      }
      return;
    }

    const startTime = timeInputToHHMM(startInput);
    const endTime = timeInputToHHMM(endInput);

    if (!startTime || !endTime) {
      toast.error('Select start and end times');
      return;
    }

    try {
      await Promise.resolve(
        onSave({
          staffId: coerceStaffId(staffId),
          date,
          startTime,
          endTime,
          location: shiftLocation?.trim() || '',
          manualJobType: manualJobType || '',
          notes: shift?.notes || '',
        })
      );
      if (!keepOpen) onClose();
    } catch {

    }
  };

  const buildCurrentPayload = () => {
    const startTime = timeInputToHHMM(startInput) || shift?.startTime;
    const endTime = timeInputToHHMM(endInput) || shift?.endTime;

    if (!staffId || !date || !startTime || !endTime) {
      toast.error('Select start and end times first');
      return null;
    }

    return {
      staffId: coerceStaffId(staffId),
      date,
      startTime,
      endTime,
      location: shiftLocation?.trim() || shift?.location || '',
      manualJobType: manualJobType || shift?.manualJobType || '',
      notes: shift?.notes || '',
    };
  };

  const handleRemove = () => {
    const target = shift || {
      staffId: coerceStaffId(staffId),
      date,
      busy: false,
      dayOff: false,
      leave: false,
    };

    if (!target.staffId || !target.date) {
      toast.error('No shift selected to remove');
      return;
    }

    onDelete?.(target);
    setMoreAnchor(null);
    onClose();
  };

  const handleCopy = () => {
    const payload = buildCurrentPayload();
    if (!payload) return;
    onCopy?.(payload);
    setMoreAnchor(null);
  };

  const badge = team?.badge || '—';
  const badgeColor = team?.badgeColor || '#546e7a';
  const filteredTeamStaff = (team?.staff || []).filter((s) => !s.isVacant);
  const staffOptions = filteredTeamStaff.length
    ? filteredTeamStaff
    : ALL_STAFF.filter((s) => !s.isVacant);
  const showOrangeCorner = !shift || shift?.warning;

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          border: '1px solid #e0e0e0',
          borderBottom: 'none',
          borderRadius: '6px 6px 0 0',
          overflow: 'hidden',
          bgcolor: '#fafafa',
        }}
      >
        <Box
          sx={{
            width: FORM_BADGE_W,
            minWidth: FORM_BADGE_W,
            bgcolor: badgeColor,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          {badge}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, px: 1.25, pt: 2, pb: 1.25, position: 'relative', bgcolor: '#fafafa' }}>
          <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 1.25, mt: 0.5 }}>
            <TextField
              label="Start"
              type="time"
              size="small"
              value={timeInputToHHMM(startInput) || ''}
              onChange={(e) => onStartInputChange(e.target.value)}
              inputProps={{ step: 60 }}
              InputLabelProps={{ shrink: true }}
              disabled={assigning}
              fullWidth
              sx={{
                flex: 1,
                minWidth: 0,
                '& .MuiInputBase-root': { fontSize: 13, bgcolor: '#fff' },
                '& .MuiInputBase-input': { py: 1 },
                '& .MuiInputLabel-root': { fontSize: 12 },
              }}
            />
            <TextField
              label="End"
              type="time"
              size="small"
              value={timeInputToHHMM(endInput) || ''}
              onChange={(e) => onEndInputChange(e.target.value)}
              inputProps={{ step: 60 }}
              InputLabelProps={{ shrink: true }}
              disabled={assigning}
              fullWidth
              sx={{
                flex: 1,
                minWidth: 0,
                '& .MuiInputBase-root': { fontSize: 13, bgcolor: '#fff' },
                '& .MuiInputBase-input': { py: 1 },
                '& .MuiInputLabel-root': { fontSize: 12 },
              }}
            />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <FormControl size="small" sx={{ flex: 1, mr: 0.5 }}>
              <Select
                value={staffId ?? ''}
                onChange={(e) => {
                  const nextId = coerceStaffId(e.target.value);
                  onStaffIdChange(nextId);
                  onStaffChange?.(nextId);
                }}
                displayEmpty
                variant="standard"
                disableUnderline
                IconComponent={(props) => (
                  <Iconify icon="eva:chevron-down-fill" {...props} width={14} sx={{ color: '#757575' }} />
                )}
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#263238',
                  '& .MuiSelect-select': { py: 0.25, pl: 0 },
                }}
              >
                {staffOptions.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton size="small" sx={{ p: 0.25 }} onClick={(e) => setMoreAnchor(e.currentTarget)}>
              <Iconify icon="eva:more-vertical-fill" width={16} sx={{ color: '#757575' }} />
            </IconButton>
          </Stack>

          {assignMode && (
            <Box sx={{ mt: 0.75 }}>
              <FormControl fullWidth size="small">
                <Select
                  displayEmpty
                  value={bidId || ''}
                  onChange={(e) => onBidIdChange?.(e.target.value)}
                  disabled={assigning}
                  renderValue={(selected) => {
                    if (!selected) {
                      return (
                        <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                          Select bid / shift
                        </Typography>
                      );
                    }
                    const bid = assignableBids.find((item) => String(item.id) === String(selected));
                    return (
                      <Typography sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bid?.schedule || bid?.jobTitle || selected}
                      </Typography>
                    );
                  }}
                  sx={{
                    fontSize: 12,
                    bgcolor: '#fff',
                    '& .MuiSelect-select': { py: 1 },
                  }}
                  MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
                >
                  <MenuItem value="">
                    <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Select bid</Typography>
                  </MenuItem>
                  {assignableBids.map((bid) => (
                    <MenuItem key={bid.id} value={bid.id} sx={{ fontSize: 12 }}>
                      {[bid.jobTitle, bid.schedule || `${bid.startTime || ''}–${bid.endTime || ''}`]
                        .filter(Boolean)
                        .join(' · ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          <Box sx={{ mt: 0.75 }}>
            {assignMode ? (
              <Box
                sx={{
                  px: 1.25,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: '#fff',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                  Location
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 12,
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                  }}
                >
                  {displayLocation}
                </Typography>
              </Box>
            ) : (
              <StandaloneAddressInput
                value={shiftLocation}
                onChange={onShiftLocationChange}
                label="Location"
                size="small"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: 12,
                    bgcolor: '#fff',
                  },
                }}
              />
            )}
          </Box>

          <Box sx={{ mt: 0.75 }}>
            <FormControl fullWidth size="small">
              <Select
                displayEmpty
                value={manualJobType || ''}
                onChange={(e) => onManualJobTypeChange?.(e.target.value)}
                renderValue={(selected) => {
                  if (!selected) {
                    return (
                      <Typography sx={{ fontSize: 11, color: 'text.disabled' }}>
                        Agency can assign manual shifts
                      </Typography>
                    );
                  }
                  return (
                    <Typography sx={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selected}
                    </Typography>
                  );
                }}
                sx={{
                  fontSize: 12,
                  bgcolor: '#fff',
                  '& .MuiSelect-select': { py: 1 },
                }}
                MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
              >
                <MenuItem value="">
                  <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>None</Typography>
                </MenuItem>
                {normalizedJobTypes.map((jobType) => (
                  <MenuItem key={jobType.id} value={jobType.title} sx={{ fontSize: 12 }}>
                    {jobType.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {showOrangeCorner && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 0,
                height: 0,
                borderLeft: '14px solid transparent',
                borderBottom: '14px solid #ff9800',
              }}
            />
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', borderRadius: '0 0 6px 6px', overflow: 'hidden', border: '1px solid #e0e0e0', borderTop: 'none' }}>
        <LoadingButton
          fullWidth
          size="small"
          loading={assigning}
          disabled={assigning || (assignMode && !bidId)}
          onClick={() => handleSave(false)}
          startIcon={
            <Iconify
              icon={assignMode ? 'eva:checkmark-circle-2-fill' : 'eva:plus-fill'}
              width={14}
              sx={{ color: '#006064' }}
            />
          }
          sx={{
            bgcolor: '#b3e5fc',
            color: '#006064',
            borderRadius: 0,
            textTransform: 'uppercase',
            fontSize: 11,
            fontWeight: 700,
            py: 1,
            letterSpacing: 0.3,
            '&:hover': { bgcolor: '#81d4fa' },
          }}
        >
          {assignMode ? 'Smart Assign' : 'Add Shift'}
        </LoadingButton>
        {!assignMode && (
          <Button
            size="small"
            onClick={(e) => setAddMenuAnchor(e.currentTarget)}
            sx={{
              bgcolor: '#b3e5fc',
              color: '#006064',
              borderRadius: 0,
              minWidth: 32,
              px: 0.5,
              borderLeft: '1px solid rgba(0, 96, 100, 0.15)',
              '&:hover': { bgcolor: '#81d4fa' },
            }}
          >
            <Iconify icon="eva:chevron-down-fill" width={14} />
          </Button>
        )}
      </Box>

      <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
        <MenuItem onClick={handleRemove}>Remove shift</MenuItem>
        <MenuItem onClick={handleCopy}>Copy shift</MenuItem>
      </Menu>

      {!assignMode && (
        <Menu anchorEl={addMenuAnchor} open={Boolean(addMenuAnchor)} onClose={() => setAddMenuAnchor(null)}>
          <MenuItem
            onClick={() => {
              handleSave(false);
              setAddMenuAnchor(null);
            }}
          >
            Add & close
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleSave(true);
              setAddMenuAnchor(null);
              toast.info('Add another shift for this staff member');
            }}
          >
            Add & create another
          </MenuItem>
        </Menu>
      )}
    </>
  );
}


function AddShiftPopover({ open, position, onClose, formProps, excludeLeft = 0 }) {
  const modalPos = useMemo(() => getModalPosition(position), [position]);

  if (!open || !formProps) return null;

  return (
    <Portal>
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: excludeLeft,
          zIndex: 1299,
          bgcolor: 'transparent',
        }}
      />

      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          position: 'fixed',
          zIndex: 1300,
          width: MODAL_W,
          maxWidth: MODAL_W,
          ...modalPos,
          filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.12))',
        }}
      >
        {position && (
          <Box
            sx={{
              position: 'absolute',
              top: -7,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '7px solid transparent',
              borderRight: '7px solid transparent',
              borderBottom: '7px solid #fafafa',
              zIndex: 2,
            }}
          />
        )}

        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            bgcolor: '#fff',
            border: '1px solid #e0e0e0',
            width: 22,
            height: 22,
            zIndex: 3,
            '&:hover': { bgcolor: '#f5f5f5' },
          }}
        >
          <Iconify icon="eva:close-fill" width={14} />
        </IconButton>

        <Box sx={{ width: MODAL_W, bgcolor: '#fff', borderRadius: 1, overflow: 'hidden' }}>
          <ShiftFormCard {...formProps} />
        </Box>
      </Box>
    </Portal>
  );
}

function formatApiStatusLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getShiftStyle(shift) {
  if (!shift) return null;
  const apiLabel = formatApiStatusLabel(shift.displayLabel || shift.apiStatus || shift.kind);

  if (shift.busy) {
    return {
      bg: '#eceff1',
      border: '#90a4ae',
      color: '#455a64',
      label: apiLabel && apiLabel.toLowerCase() !== 'shift' ? apiLabel : 'Busy',
    };
  }
  if (shift.dayOff) {
    return {
      bg: '#fff3e0',
      border: '#ffcc80',
      color: '#ef6c00',
      label: apiLabel && apiLabel.toLowerCase() !== 'shift' ? apiLabel : 'Day Off',
    };
  }
  if (shift.leave) return { bg: '#fce4ec', border: '#f48fb1', color: '#c2185b', label: apiLabel || 'Leave' };
  if (shift.onCall) return { bg: '#e3f2fd', border: '#90caf9', color: '#1565c0', label: apiLabel || 'On Call' };
  if (shift.sleepover) return { bg: '#ede7f6', border: '#b39ddb', color: '#5e35b1', label: apiLabel || 'Sleepover' };
  if (shift.allDay) return { bg: '#EEF0FC', border: '#D5DAF7', color: '#5865DC', label: apiLabel || '+ All Day' };
  return { bg: '#eeeeee', border: '#e0e0e0', color: '#424242', label: null };
}

function getHoursBarColor(hours) {
  if (hours > STAFF_CONTRACT_H) return '#ff9800';
  if (hours >= STAFF_CONTRACT_H * 0.9) return '#fbc02d';
  return '#5865DC';
}

function getGridContentWidth(dayCount, staffColWidth, dayColWidth) {
  return staffColWidth + dayCount * dayColWidth;
}

const GRID_LINE = '#e0e0e0';

function GridRowTail({ bgcolor = '#fff', dayColWidth = DAY_COL_W, showGridLines = true }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        alignSelf: 'stretch',
        borderBottom: showGridLines ? `1px solid ${GRID_LINE}` : 'none',
        bgcolor,
        ...(showGridLines && {
          backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${dayColWidth - 1}px, ${GRID_LINE} ${dayColWidth - 1}px, ${GRID_LINE} ${dayColWidth}px)`,
          backgroundSize: `${dayColWidth}px 100%`,
        }),
      }}
    />
  );
}


function isCopyableShift(shift) {
  if (!shift) return false;
  if (shift.busy || shift.dayOff || shift.leave || shift.onCall || shift.sleepover || shift.allDay) {
    return false;
  }
  return Boolean(shift.startTime && shift.endTime);
}

function AgencyShiftDetailField({ label, value }) {
  if (value == null || value === '' || value === '—') return null;
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
        {value}
      </Typography>
    </Box>
  );
}

function AgencyShiftDetailsDialog({
  open,
  onClose,
  shift,
  dayShifts = [],
  member,
  onEdit,
  onAddAnother,
  onCancelBooking,
  locked = false,
  calendarOnly = false,
}) {
  if (!shift) return null;

  const dateLabel = shift.date
    ? format(parse(shift.date, 'yyyy-MM-dd', new Date()), 'EEE d MMM yyyy')
    : '';
  const timedShifts = dayShifts.filter(isTimedWorkShift);
  const showList = timedShifts.length > 1;
  const statusLabel = shift.cancelled ? 'Cancelled' : shift.status || 'Active';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{ zIndex: 1600 }}
    >
      <DialogTitle sx={{ pb: 1, pr: 6, position: 'relative' }}>
        Shift details
        {showList ? ` · ${shift.scheduleIndex || 1}/${timedShifts.length}` : ''}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.1}>
          <AgencyShiftDetailField label="Staff" value={member?.name || '—'} />
          <AgencyShiftDetailField label="Role" value={member?.role || '—'} />
          <AgencyShiftDetailField label="Date" value={dateLabel} />
          <AgencyShiftDetailField
            label="Time"
            value={`${formatShiftTime(shift.startTime)} - ${formatShiftTime(shift.endTime)}`}
          />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.45,
                fontWeight: 700,
                color: shift.cancelled ? 'error.main' : 'success.main',
              }}
            >
              {statusLabel}
            </Typography>
          </Box>
          <AgencyShiftDetailField label="Location" value={shift.location} />
          <AgencyShiftDetailField label="Job type" value={shift.manualJobType} />

          {showList && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
                All shifts on this day ({timedShifts.length})
              </Typography>
              <Stack spacing={0.75}>
                {timedShifts.map((entry) => {
                  const active = entry.id === shift.id;
                  return (
                    <Box
                      key={entry.id}
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        border: (theme) =>
                          `1px solid ${active ? theme.palette.primary.main : theme.palette.divider}`,
                        bgcolor: (theme) =>
                          active ? `${theme.palette.primary.main}14` : 'transparent',
                      }}
                    >
                      <Typography variant="body2" fontWeight={700}>
                        Shift {entry.scheduleIndex}/{entry.scheduleCount} ·{' '}
                        {formatShiftTime(entry.startTime)} – {formatShiftTime(entry.endTime)}
                      </Typography>
                      {entry.location && (
                        <Typography variant="caption" color="text.secondary">
                          {entry.location}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5, gap: 1, flexWrap: 'wrap' }}>
        {!locked && (
          <Button color="error" onClick={() => onCancelBooking?.(shift)}>
            Cancel booking
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        {!locked && !calendarOnly && (
          <>
            <Button variant="outlined" onClick={() => onAddAnother?.(shift)}>
              Add another shift
            </Button>
            <Button variant="contained" onClick={() => onEdit?.(shift)}>
              Edit
            </Button>
          </>
        )}
        {(locked || calendarOnly) && (
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

function ShiftCell({
  shift,
  dayShifts: dayShiftsProp,
  onClick,
  onShiftClick,
  isActive,
  isRowActive,
  cellKey,
  dayColWidth = DAY_COL_W,
  canPaste = false,
  onCopyShift,
  onPasteShift,
  showEmptyPlus = true,
}) {
  const [contextMenu, setContextMenu] = useState(null);

  const dayShifts = dayShiftsProp?.length
    ? dayShiftsProp
    : normalizeCellShifts(shift);
  const timedShifts = dayShifts.filter(isTimedWorkShift);
  const statusShift = dayShifts.find(isStatusBlock) || null;
  const multi = timedShifts.length > 1;
  const rowMinH = multi ? Math.max(ROW_H, timedShifts.length * 26 + 10) : ROW_H;

  const cellSx = {
    width: dayColWidth,
    minWidth: dayColWidth,
    minHeight: rowMinH,
    alignSelf: 'stretch',
    borderRight: `1px solid ${GRID_LINE}`,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    cursor: 'pointer',
    p: 0.5,
    flexShrink: 0,
    overflow: 'hidden',
    bgcolor: isActive ? '#e3f2fd' : isRowActive ? '#f9fdf7' : 'transparent',
    boxShadow: isActive ? 'inset 0 0 0 2px #42a5f5' : 'none',
    '&:hover .empty-plus': {
      color: 'text.secondary',
    },
  };

  const blockBase = {
    width: '92%',
    height: multi ? 'auto' : '88%',
    borderRadius: 0.5,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    lineHeight: 1.05,
  };

  const style = getShiftStyle(statusShift || timedShifts[0] || shift);
  const copyTarget = timedShifts[0] || statusShift || shift;
  const canCopy = isCopyableShift(copyTarget);
  const showContextMenu = canCopy || canPaste;

  const handleContextMenu = (event) => {
    if (!showContextMenu) return;
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(
      contextMenu === null ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 } : null
    );
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  const contextMenuNode = (
    <Menu
      open={contextMenu !== null}
      onClose={handleCloseContextMenu}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu !== null ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
      }
      PaperProps={{
        onContextMenu: (e) => e.preventDefault(),
      }}
    >
      {canCopy && (
        <MenuItem
          onClick={() => {
            onCopyShift?.(copyTarget);
            handleCloseContextMenu();
          }}
        >
          Copy shift
        </MenuItem>
      )}
      {canPaste && (
        <MenuItem
          onClick={() => {
            onPasteShift?.();
            handleCloseContextMenu();
          }}
        >
          Paste shift
        </MenuItem>
      )}
    </Menu>
  );

  if (statusShift && getShiftStyle(statusShift)?.label) {
    const statusStyle = getShiftStyle(statusShift);
    return (
      <>
        <Box
          sx={cellSx}
          data-shift-cell={cellKey}
          onClick={(e) => onClick(e.currentTarget, statusShift, { openActions: true })}
          onContextMenu={handleContextMenu}
        >
          <Tooltip
            title={
              statusShift?.busy || statusShift?.blocksAutoAccept
                ? 'Busy / unavailable — blocked from auto-accept'
                : statusStyle.label
            }
            arrow
          >
            <Box
              sx={{
                ...blockBase,
                height: '88%',
                bgcolor: statusStyle.bg,
                border: `1px solid ${statusStyle.border}`,
              }}
            >
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: statusStyle.color }}>
                {statusStyle.label}
              </Typography>
            </Box>
          </Tooltip>
        </Box>
        {contextMenuNode}
      </>
    );
  }

  if (timedShifts.length) {
    return (
      <>
        <Box
          sx={{ ...cellSx, flexDirection: 'column', gap: 0.35, py: 0.4 }}
          data-shift-cell={cellKey}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClick(e.currentTarget, timedShifts[0], { addAnother: multi });
            }
          }}
          onContextMenu={handleContextMenu}
        >
          {timedShifts.map((entry) => {
            const entryStyle = getShiftStyle(entry) || style;
            const badge =
              entry.scheduleCount > 1
                ? `${entry.scheduleIndex}/${entry.scheduleCount}`
                : null;
            return (
              <Tooltip
                key={entry.id}
                title={
                  entry.location
                    ? `${formatShiftTime(entry.startTime)}–${formatShiftTime(entry.endTime)} · ${entry.location}`
                    : `${formatShiftTime(entry.startTime)}–${formatShiftTime(entry.endTime)}`
                }
                arrow
              >
                <Box
                  onClick={(e) => {
                    e.stopPropagation();
                    onShiftClick?.(e.currentTarget, entry, timedShifts);
                  }}
                  sx={{
                    ...blockBase,
                    width: '100%',
                    minHeight: multi ? 24 : undefined,
                    flex: multi ? '0 0 auto' : 1,
                    py: multi ? 0.25 : 0,
                    bgcolor: entryStyle.bg,
                    border: `1px solid ${entryStyle.border}`,
                    cursor: 'pointer',
                    '&:hover': { filter: 'brightness(0.97)' },
                  }}
                >
                  {multi ? (
                    <Stack direction="row" spacing={0.35} alignItems="center" justifyContent="center">
                      <Typography sx={{ fontSize: 9, fontWeight: 600, color: entryStyle.color }}>
                        {formatShiftTime(entry.startTime)}
                      </Typography>
                      <Typography sx={{ fontSize: 9, fontWeight: 600, color: entryStyle.color }}>
                        {formatShiftTime(entry.endTime)}
                      </Typography>
                      {badge && (
                        <Typography
                          sx={{ fontSize: 8, fontWeight: 800, color: 'primary.main', flexShrink: 0 }}
                        >
                          {badge}
                        </Typography>
                      )}
                    </Stack>
                  ) : (
                    <>
                      <Stack direction="row" spacing={0.35} alignItems="center" justifyContent="center">
                        <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: entryStyle.color }}>
                          {formatShiftTime(entry.startTime)}
                        </Typography>
                        {badge && (
                          <Typography sx={{ fontSize: 8, fontWeight: 800, color: 'primary.main' }}>
                            {badge}
                          </Typography>
                        )}
                      </Stack>
                      <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: entryStyle.color }}>
                        {formatShiftTime(entry.endTime)}
                      </Typography>
                    </>
                  )}
                  {entry.warning && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 0,
                        height: 0,
                        borderLeft: '7px solid transparent',
                        borderBottom: '7px solid #ff9800',
                      }}
                    />
                  )}
                </Box>
              </Tooltip>
            );
          })}
        </Box>
        {contextMenuNode}
      </>
    );
  }

  return (
    <>
      <Box
        data-shift-cell={cellKey}
        onClick={(e) => onClick(e.currentTarget, null, { openActions: true })}
        onContextMenu={handleContextMenu}
        sx={{ ...cellSx, alignItems: 'center' }}
      >
        <Tooltip title="Click to mark Busy, On Call, Leave…" arrow>
          <Box
            className="empty-plus"
            aria-label="Add on this day"
            sx={{
              display: showEmptyPlus ? 'inline-flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.disabled',
            }}
          >
            <Iconify icon="eva:plus-fill" width={14} />
          </Box>
        </Tooltip>
      </Box>
      {contextMenuNode}
    </>
  );
}


function StaffRow({
  member,
  days,
  shifts,
  selectedStaffId,
  activeCell,
  formPreview,
  onCellClick,
  onShiftClick,
  onStaffSelect,
  canPaste = false,
  onCopyShift,
  onPasteShift,
  staffColWidth = STAFF_COL_W,
  dayColWidth = DAY_COL_W,
  showEmptyPlus = true,
}) {
  const isSelected = selectedStaffId === member.id;
  const totalHours =
    formPreview && formPreview.staffId === member.id
      ? applyFormPreviewHours(shifts, member.id, days, formPreview)
      : computeStaffHours(shifts, member.id, days);
  const barPct = Math.min(100, (totalHours / STAFF_CONTRACT_H) * 100);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        minHeight: ROW_H,
        borderBottom: `1px solid ${GRID_LINE}`,
        bgcolor: isSelected ? '#f9fdf7' : '#fff',
        cursor: member.isVacant ? 'default' : 'pointer',
      }}
    >
      <Box
        onClick={() => !member.isVacant && onStaffSelect?.(member)}
        sx={{
          width: staffColWidth,
          minWidth: staffColWidth,
          flexShrink: 0,
          px: 1,
          py: 0.35,
          display: 'flex',
          alignItems: 'center',
          alignSelf: 'stretch',
          borderRight: `1px solid ${GRID_LINE}`,
          borderLeft: (theme) =>
            isSelected ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
          bgcolor: isSelected ? 'primary.lighter' : '#fff',
          cursor: member.isVacant ? 'default' : 'pointer',
          position: 'sticky',
          left: 0,
          zIndex: 5,
          boxShadow: '2px 0 0 0 rgba(0,0,0,0.04)',
          '&:hover': {
            bgcolor: member.isVacant ? '#fff' : isSelected ? 'primary.lighter' : '#fafafa',
          },
        }}
      >
        <Box sx={{ minWidth: 0, width: 'fit-content', maxWidth: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography
              sx={{
                fontSize: 11.5,
                fontWeight: isSelected ? 700 : member.isVacant ? 400 : 500,
                color: member.isVacant || member.isPast ? 'text.secondary' : 'text.primary',
                fontStyle: member.isVacant || member.isPast ? 'italic' : 'normal',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {member.name}
              {member.isPast ? ' (past)' : ''}
            </Typography>
            {!member.isVacant && (
              <Typography sx={{ fontSize: 10, color: '#757575', flexShrink: 0 }}>
                {Math.round(totalHours)}h
              </Typography>
            )}
          </Box>
          {!member.isVacant && (
            <Box
              sx={{
                mt: 0.2,
                height: 2.5,
                width: '100%',
                maxWidth: 88,
                bgcolor: '#e8e8e8',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${barPct}%`,
                  bgcolor: getHoursBarColor(totalHours),
                  borderRadius: 1,
                  transition: 'width 0.2s ease',
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {days.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const key = cellKey(member.id, dateStr);
        const dayShifts = getDayShifts(shifts, member.id, dateStr);
        return (
          <ShiftCell
            key={dateStr}
            cellKey={key}
            shift={dayShifts[0] || null}
            dayShifts={dayShifts}
            isActive={activeCell?.staffId === member.id && activeCell?.date === dateStr}
            isRowActive={isSelected}
            onClick={(el, shift, options) => onCellClick(el, shift, member, dateStr, options)}
            onShiftClick={(el, shift, list) => onShiftClick?.(el, shift, member, dateStr, list)}
            canPaste={canPaste && !member.isVacant}
            onCopyShift={onCopyShift}
            onPasteShift={() => onPasteShift?.(member.id, dateStr)}
            showEmptyPlus={showEmptyPlus && !member.isVacant}
          />
        );
      })}
      <GridRowTail bgcolor={isSelected ? '#f9fdf7' : '#fff'} dayColWidth={dayColWidth} />
    </Box>
  );
}


function TeamGroup({
  team,
  days,
  shifts,
  selectedStaffId,
  activeCell,
  formPreview,
  onCellClick,
  onShiftClick,
  onStaffSelect,
  collapsed,
  onToggle,
  canPaste = false,
  onCopyShift,
  onPasteShift,
  staffColWidth = STAFF_COL_W,
  dayColWidth = DAY_COL_W,
  showEmptyPlus = true,
}) {
  const shiftCount = team.staff.reduce(
    (acc, s) =>
      acc +
      days.reduce(
        (dayAcc, d) => dayAcc + getTimedDayShifts(shifts, s.id, format(d, 'yyyy-MM-dd')).length,
        0
      ),
    0
  );
  const hours = team.staff.reduce(
    (acc, s) => acc + computeStaffHours(shifts, s.id, days),
    0
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'stretch',
          bgcolor: '#fafafa',
          borderBottom: collapsed ? 'none' : `1px solid ${GRID_LINE}`,
          minHeight: TEAM_HEADER_H,
          ...(collapsed && { mb: 0.25 }),
        }}
      >
        <Box
          sx={{
            width: staffColWidth,
            minWidth: staffColWidth,
            flexShrink: 0,
            px: 1,
            py: 0.5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 0.2,
            borderRight: 'none',
            bgcolor: '#fafafa',
            position: 'sticky',
            left: 0,
            zIndex: 5,
            boxShadow: '2px 0 0 0 rgba(0,0,0,0.04)',
            alignSelf: 'stretch',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: '100%', justifyContent: 'flex-end' }}>
            <Iconify icon="solar:users-group-rounded-bold" width={13} sx={{ color: '#757575' }} />
            <Typography sx={{ fontSize: 10, color: '#757575' }}>{team.staff.length}</Typography>
            <Iconify icon="solar:document-bold" width={13} sx={{ color: '#757575' }} />
            <Typography sx={{ fontSize: 10, color: '#757575' }}>{shiftCount}</Typography>
            <Iconify icon="solar:clock-circle-bold" width={13} sx={{ color: '#757575' }} />
            <Typography sx={{ fontSize: 10, color: '#757575' }}>{Math.round(hours)}h</Typography>
            <IconButton size="small" onClick={onToggle} sx={{ p: 0.2 }}>
              <Iconify icon={collapsed ? 'eva:chevron-right-fill' : 'eva:chevron-down-fill'} width={14} />
            </IconButton>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: '100%', minWidth: 0 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: 0.5, bgcolor: team.color, flexShrink: 0 }} />
            <Typography
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: 10,
                fontWeight: 700,
                lineHeight: 1.35,
                color: 'text.primary',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {team.label}
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0, alignSelf: 'stretch', bgcolor: '#fafafa' }} />
      </Box>

      {!collapsed &&
        team.staff.map((member) => (
          <StaffRow
            key={member.id}
            member={member}
            days={days}
            shifts={shifts}
            selectedStaffId={selectedStaffId}
            activeCell={activeCell}
            formPreview={formPreview}
            onStaffSelect={onStaffSelect}
            onCellClick={(el, shift, memberRow, dateStr, options) =>
              onCellClick(el, shift, memberRow, dateStr, team, options)
            }
            onShiftClick={(el, shift, memberRow, dateStr, list) =>
              onShiftClick?.(el, shift, memberRow, dateStr, list, team)
            }
            canPaste={canPaste}
            onCopyShift={onCopyShift}
            onPasteShift={onPasteShift}
            staffColWidth={staffColWidth}
            dayColWidth={dayColWidth}
            showEmptyPlus={showEmptyPlus}
          />
        ))}
    </Box>
  );
}


function LeftSidebar({
  location,
  locations = [],
  onLocationChange,
  hideLocations = false,
  hideStaffCard = false,
  stats,
  showStaffDetail,
  selectedStaff,
  activeAction,
  shiftFormOpen,
  shiftFormProps,
  shiftTeam,
  formPreview,
  shifts,
  days,
  onBack,
  onStaffAction,
  onAddShift,
  isMobile,
  actions = SIDEBAR_ACTIONS,
  postedJobs = [],
  postedJobsLoading = false,
  postedJobsTitle = 'Jobs',
}) {
  return (
    <Box
      sx={{
        width: isMobile ? '100%' : SIDEBAR_W,
        minWidth: isMobile ? '100%' : SIDEBAR_W,
        borderRight: isMobile ? 'none' : '1px solid #e0e0e0',
        borderBottom: isMobile ? '1px solid #e0e0e0' : 'none',
        bgcolor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        height: isMobile ? 'auto' : '100%',
        maxHeight: isMobile ? 'none' : '100%',

        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {!hideLocations && (
        <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          <FormControl fullWidth size="small">
            <Select
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              renderValue={(selected) => {
                const selectedLoc = locations.find((loc) => loc.id === selected);
                const selectedLabel = getLocationDisplayTitle(selectedLoc, locations) || selected;
                const distanceLabel = formatLocationDistanceLabel(selectedLoc);
                return (
                  <Tooltip
                    title={
                      selectedLoc?.isAll
                        ? selectedLoc.address || selectedLabel
                        : [selectedLabel, distanceLabel].filter(Boolean).join(' · ')
                    }
                    arrow
                  >
                    <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0, pr: 0.5 }}>
                      <Iconify
                        icon="solar:map-point-bold"
                        width={16}
                        sx={{ color: 'primary.main', flexShrink: 0 }}
                      />
                      <Typography
                        component="span"
                        noWrap
                        sx={{ fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}
                      >
                        {selectedLabel}
                      </Typography>
                      {distanceLabel ? (
                        <Typography
                          component="span"
                          sx={{ fontSize: 11, color: 'text.secondary', flexShrink: 0, fontWeight: 600 }}
                        >
                          {distanceLabel}
                        </Typography>
                      ) : null}
                    </Stack>
                  </Tooltip>
                );
              }}
              sx={{ fontSize: 13 }}
              MenuProps={{
                PaperProps: {
                  sx: { maxWidth: 360 },
                },
              }}
            >
              {locations.map((loc) => {
                const distanceLabel = formatLocationDistanceLabel(loc);
                const secondary = loc.isAll
                  ? loc.address || `${loc.locationCount || 0} sites`
                  : [loc.address, distanceLabel].filter(Boolean).join(' · ');

                return (
                  <MenuItem key={loc.id} value={loc.id}>
                    <Stack direction="row" alignItems="flex-start" spacing={0.75} sx={{ minWidth: 0, width: 1, py: 0.25 }}>
                      <Iconify
                        icon={loc.isAll ? 'solar:globus-bold' : 'solar:map-point-bold'}
                        width={16}
                        sx={{ color: 'text.secondary', flexShrink: 0, mt: 0.25 }}
                      />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
                          <Typography
                            component="span"
                            noWrap
                            sx={{ fontSize: 13, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}
                          >
                            {loc.isAll ? getLocationDisplayTitle(loc, locations) : loc.label}
                          </Typography>
                          {distanceLabel ? (
                            <Typography
                              component="span"
                              sx={{ fontSize: 11, color: 'primary.main', flexShrink: 0, fontWeight: 700 }}
                            >
                              {distanceLabel}
                            </Typography>
                          ) : null}
                        </Stack>
                        {secondary ? (
                          <Typography
                            component="span"
                            noWrap
                            sx={{
                              display: 'block',
                              fontSize: 11,
                              color: 'text.secondary',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {secondary}
                          </Typography>
                        ) : null}
                      </Box>
                    </Stack>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Box>
      )}

      <Stack
        spacing={0}
        sx={{
          borderBottom: '1px solid #e0e0e0',
          flexShrink: 0,
          ...(isMobile && { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }),
        }}
      >
        {[
          { label: 'Total Hours', value: stats.hours },
          { label: 'Total Cost', value: stats.cost },
          { label: 'Total Shifts', value: stats.count },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              px: 2,
              py: 1,
              borderBottom: isMobile ? 'none' : '1px solid #f0f0f0',
              borderRight: isMobile ? '1px solid #f0f0f0' : 'none',
            }}
          >
            <Typography sx={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>{item.value}</Typography>
            <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{item.label}</Typography>
          </Box>
        ))}
      </Stack>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          ...hideScrollY,
        }}
      >
        {showStaffDetail && selectedStaff && (
          <>
            <Button
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} sx={{ color: '#1565c0' }} />}
              onClick={onBack}
              sx={{
                justifyContent: 'flex-start',
                px: 2,
                py: 0.75,
                color: '#1565c0',
                fontWeight: 600,
                fontSize: 13,
                borderRadius: 0,
                borderBottom: shiftFormOpen ? 'none' : '1px solid #e0e0e0',
                flexShrink: 0,
                textTransform: 'none',
              }}
            >
              Back
            </Button>

            {shiftFormOpen && activeAction === 'add-shift' ? (
              <Box sx={{ px: 1, py: 1, borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                {shiftFormProps && (
                  <Box
                    sx={{
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      borderRadius: 1,
                      overflow: 'hidden',
                      mb: 0.75,
                    }}
                  >
                    <ShiftFormCard {...shiftFormProps} />
                  </Box>
                )}
                <ShiftDetailsExpandable
                  selectedStaff={selectedStaff}
                  team={shiftTeam}
                  formPreview={formPreview}
                  shifts={shifts}
                  days={days}
                  locationLabel={selectedStaff.locationLabel}
                />
              </Box>
            ) : hideStaffCard ? null : (
              <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
                <Stack direction="row" spacing={1.25} alignItems="flex-start">
                  <Avatar sx={{ width: 36, height: 36, bgcolor: '#78909c', fontSize: 13 }}>
                    {getInitials(selectedStaff.name)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a237e' }}>
                      {selectedStaff.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                      {selectedStaff.role || 'Staff'}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                      {selectedStaff.breakLabel || 'No Breaks'}
                    </Typography>
                    <Typography
                      key={selectedStaff.hoursLabel}
                      sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}
                    >
                      {selectedStaff.hoursLabel || '0h'}
                    </Typography>
                    {selectedStaff.shiftDateLabel && (
                      <Typography sx={{ fontSize: 10.5, color: 'text.disabled', mt: 0.35 }}>
                        Shift: {selectedStaff.shiftDateLabel}
                      </Typography>
                    )}
                    {selectedStaff.locationLabel && (
                      <Stack direction="row" spacing={0.5} alignItems="flex-start" sx={{ mt: 0.5 }}>
                        <Iconify
                          icon="solar:map-point-bold"
                          width={12}
                          sx={{ color: 'text.secondary', mt: 0.15, flexShrink: 0 }}
                        />
                        <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.35 }}>
                          {selectedStaff.locationLabel}
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Box>
            )}
          </>
        )}

        <Stack spacing={0.5} sx={{ p: 1.5, flexShrink: 0 }}>
          {actions.map((action) => {
            const isActive = activeAction === action.id;

            return (
              <Button
                key={action.id}
                fullWidth
                size="small"
                startIcon={<Iconify icon={action.icon} width={14} />}
                onClick={() => {
                  if (action.id === 'add-shift') {
                    onAddShift();
                    return;
                  }
                  onStaffAction(action.id);
                }}
                sx={{
                  justifyContent: 'flex-start',
                  fontSize: 11.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'primary.main' : 'text.primary',
                  border: '1px solid',
                  borderColor: isActive ? '#81c784' : '#e0e0e0',
                  bgcolor: isActive ? '#f1f8e9' : '#fff',
                  borderRadius: 1,
                  py: 0.65,
                  textTransform: 'none',
                  flexShrink: 0,
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(129, 199, 132, 0.35)' : 'none',
                  '&:hover': {
                    bgcolor: isActive ? '#e8f5e9' : '#fafafa',
                    borderColor: isActive ? '#66bb6a' : '#bdbdbd',
                  },
                }}
              >
                {action.label}
              </Button>
            );
          })}
        </Stack>

        <PostedJobsSidebarPanel
          jobs={postedJobs}
          loading={postedJobsLoading}
          title={postedJobsTitle}
        />
      </Box>
    </Box>
  );
}


export function AgencyShiftsView({
  mode,
  enableAvailabilityApi = false,
  apiRole = 'agency',
  embedded = false,
} = {}) {
  const viewOnly = useViewOnly();
  const { user: mockedUser } = useMockedUser();
  const { user: authUser } = useSelector((state) => state.user);
  const user = authUser || mockedUser;
  const isStaffMember = mode === 'staffMember';
  const isHomeCareCompanyApi = apiRole === 'homeCareCompany';
  const isNurseApi = apiRole === 'nurse';
  const isAgencyApi = !isHomeCareCompanyApi && !isNurseApi;
  const shiftsCalendarOnly = Boolean(enableAvailabilityApi);
  const useCalendarApi = Boolean(enableAvailabilityApi);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const gridRef = useRef(null);
  const { isPanning, handleMouseDown: handleGridMouseDown } = useDragScroll(gridRef);

  const agencyBranchesQuery = useGetAgencyBranchesQuery(
    { page: 0, limit: 100 },
    { skip: !useCalendarApi || !isAgencyApi, refetchOnMountOrArgChange: 60, refetchOnFocus: false }
  );
  const hccBranchesQuery = useGetHomeCareCompanyBranchesQuery(
    { page: 0, limit: 100 },
    {
      skip: !useCalendarApi || !isHomeCareCompanyApi,
      refetchOnMountOrArgChange: 60,
      refetchOnFocus: false,
    }
  );
  const nurseBranchesQuery = useGetNurseBranchesQuery(
    { page: 0, limit: 100, status: '' },
    { skip: true }
  );
  const branchesQuery = isNurseApi
    ? nurseBranchesQuery
    : isHomeCareCompanyApi
      ? hccBranchesQuery
      : agencyBranchesQuery;
  const agencyBranches = isNurseApi ? [] : branchesQuery.data?.data || [];
  const isBranchesLoading = isNurseApi ? false : branchesQuery.isLoading;
  const isBranchesError = isNurseApi ? false : branchesQuery.isError;
  const branchesResult = isNurseApi ? null : branchesQuery.data;


  const profileUserId = getProfileUserId(user);
  const sessionOrigin = useMemo(() => getAgencyUserLatLng(user), [user]);
  const needsProfileOrigin = Boolean(useCalendarApi && profileUserId && !sessionOrigin);
  const {
    data: profileData,
    isFetching: isProfileFetching,
    isError: isProfileError,
  } = useGetUserByIdQuery(profileUserId, {
    skip: !needsProfileOrigin,
  });
  const profileOrigin = useMemo(
    () => extractLatLng(profileData, { allowZero: false }),
    [profileData]
  );
  const userOrigin = sessionOrigin || profileOrigin;
  const waitingForProfileOrigin = Boolean(
    needsProfileOrigin && isProfileFetching && !profileOrigin && !isProfileError
  );

  const locationOrigin = useMemo(
    () => userOrigin || getFirstAgencyBranchLatLng(agencyBranches) || null,
    [userOrigin, agencyBranches]
  );

  const locations = useMemo(() => {
    if (isNurseApi && !isStaffMember) return [];
    if (useCalendarApi || isStaffMember) {
      const liveBranches = (agencyBranches || []).filter((branch) => {
        const status = String(branch.status || 'active').toLowerCase();
        return status !== 'deleted' && status !== 'delete' && status !== 'inactive';
      });
      const fromApi = mapAgencyBranchesToLocations(liveBranches).map((loc) => ({
        ...loc,
        latitude: loc.coordinates?.[1],
        longitude: loc.coordinates?.[0],
      }));
      return withAllLocationsOption(fromApi, locationOrigin);
    }
    return withAllLocationsOption([]);
  }, [agencyBranches, isNurseApi, isStaffMember, locationOrigin, useCalendarApi]);

  // GET {agency|home-care-company}/job-roles?status=active — nurses don't pick a job type here.
  const { data: jobTypesList } = useRoleJobTypes(isHomeCareCompanyApi ? 'homeCareCompany' : 'agency', {
    skip: !useCalendarApi || isNurseApi,
  });
  const jobTypeOptions = useMemo(() => {
    if (isNurseApi) return [];
    const fromApi = jobTypesList.filter((item) => item.status === 'active' || !item.status);
    return fromApi.length ? fromApi : JOB_TYPE_OPTIONS;
  }, [isNurseApi, jobTypesList]);

  const [createAgencyAvailability] = useCreateAgencyAvailabilityMutation();
  const [updateAgencyAvailability] = useUpdateAgencyAvailabilityMutation();
  const [deleteAgencyAvailability] = useDeleteAgencyAvailabilityMutation();
  const [createAgencyBooking] = useCreateAgencyBookingMutation();
  const [createHccAvailability] = useCreateHomeCareCompanyAvailabilityMutation();
  const [updateHccAvailability] = useUpdateHomeCareCompanyAvailabilityMutation();
  const [deleteHccAvailability] = useDeleteHomeCareCompanyAvailabilityMutation();
  const [createNurseAvailability] = useCreateNurseAvailabilityMutation();
  const [updateNurseAvailability] = useUpdateNurseAvailabilityMutation();
  const [deleteNurseAvailability] = useDeleteNurseAvailabilityMutation();

  const { data: agencyBidsData, refetch: refetchAgencyBids } = useGetAgencyBidsQuery(
    {
      page: 0,
      limit: 200,
      status: 'accepted',
      ...(profileUserId ? { userId: profileUserId } : {}),
    },
    {
      skip: !isAgencyApi,
      refetchOnMountOrArgChange: 60,
      refetchOnFocus: false,
      refetchOnReconnect: true,
    }
  );

  const assignableBids = useMemo(() => {
    const list = Array.isArray(agencyBidsData?.data) ? agencyBidsData.data : [];
    const assignable = list.filter((bid) => canAssignFromAgencyBid(bid));
    if (assignable.length) return assignable;
    return list.filter((bid) => bid?.id && !String(bid.bookingId || '').trim());
  }, [agencyBidsData?.data]);
  const createAvailability = isNurseApi
    ? createNurseAvailability
    : isHomeCareCompanyApi
      ? createHccAvailability
      : createAgencyAvailability;
  const updateAvailability = isNurseApi
    ? updateNurseAvailability
    : isHomeCareCompanyApi
      ? updateHccAvailability
      : updateAgencyAvailability;
  const deleteAvailability = isNurseApi
    ? deleteNurseAvailability
    : isHomeCareCompanyApi
      ? deleteHccAvailability
      : deleteAgencyAvailability;

  const [calendarTeams, setCalendarTeams] = useState(null);
  const [calendarMeta, setCalendarMeta] = useState(null);
  const [calendarDayWeather, setCalendarDayWeather] = useState({});
  const [calendarSynced, setCalendarSynced] = useState(false);

  const rosterTeams = useMemo(() => {
    if (useCalendarApi) {
      if (!calendarSynced || !Array.isArray(calendarTeams)) return [];
      if (isStaffMember) {
        if (calendarTeams.length) return hydrateStaffMemberCalendarTeams(calendarTeams, user);
        return buildSelfOnlyTeams(user, {
          id: STAFF_MEMBER_SELF_ID,
          role: 'Nurse',
          label: 'My shifts',
          badge: 'ME',
        });
      }
      return calendarTeams;
    }
    if (isStaffMember) {
      return buildSelfOnlyTeams(user, {
        id: STAFF_MEMBER_SELF_ID,
        role: 'Nurse',
        label: 'My shifts',
        badge: 'ME',
      });
    }
    return AGENCY_TEAMS;
  }, [calendarSynced, calendarTeams, isStaffMember, useCalendarApi, user]);

  const { allStaff: rosterAllStaff, staffTeamMap: rosterStaffTeamMap } = useMemo(
    () => deriveStaffMapsFromTeams(rosterTeams),
    [rosterTeams]
  );

  const TEAMS = rosterTeams;
  const ALL_STAFF = rosterAllStaff;
  const STAFF_TEAM_MAP = rosterStaffTeamMap;

  const [weekStart, setWeekStart] = useState(() =>
    enableAvailabilityApi
      ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : FORTNIGHT_START
  );
  const [viewRange, setViewRange] = useState('Fortnight');
  const [shifts, setShifts] = useState(() => {
    if (enableAvailabilityApi) return {};
    if (isStaffMember) return buildSelfOnlyInitialShifts(STAFF_MEMBER_SELF_ID);
    return buildInitialShifts();
  });
  const postedJobsRole = isHomeCareCompanyApi
    ? 'homeCareCompany'
    : isAgencyApi
      ? 'agency'
      : '';
  const { jobs: postedJobs, loading: postedJobsLoading } = useEmployerPostedJobs(postedJobsRole || 'agency', {
    skip: !useCalendarApi || !postedJobsRole || isStaffMember || isNurseApi,
  });
  const [collapsed, setCollapsed] = useState({});
  const [location, setLocation] = useState(() => ALL_LOCATIONS_ID);
  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    if (!rosterAllStaff.length) {
      if (useCalendarApi) setSelectedStaff(null);
      return;
    }
    setSelectedStaff((prev) => {
      if (prev && rosterAllStaff.some((member) => member.id === prev.id)) return prev;
      return rosterAllStaff.find((member) => !member.isVacant) || rosterAllStaff[0] || null;
    });
  }, [rosterAllStaff, useCalendarApi]);

  useEffect(() => {
    if (!isStaffMember) return;
    const self = rosterAllStaff[0];
    if (!self) return;
    setSelectedStaff(self);
    // Don't wipe live calendar/API shifts with demo self-only cells
    if (useCalendarApi) return;
    setShifts(buildSelfOnlyInitialShifts(self.id));
  }, [isStaffMember, rosterAllStaff, useCalendarApi]);

  useEffect(() => {
    if (!locations.length) return;
    if (!locations.some((loc) => loc.id === location)) {
      setLocation(locations[0]?.id || ALL_LOCATIONS_ID);
    }
  }, [locations, location]);
  const [focusedShiftDate, setFocusedShiftDate] = useState('');
  const [showStaffDetail, setShowStaffDetail] = useState(true);
  const [rosterScope, setRosterScope] = useState(() =>
    enableAvailabilityApi ? ROSTER_SCOPE.ALL : ROSTER_SCOPE.CURRENT
  );
  const [lockToggled, setIsLocked] = useState(false);
  const isLocked = lockToggled || viewOnly;
  const notifyLocked = () => {
    if (!viewOnly) toast.warning('Rota is locked — unlock to make changes');
  };
  const [activeSidebarAction, setActiveSidebarAction] = useState(() =>
    ''
  );
  const [copiedShift, setCopiedShift] = useState(null);
  const [cellActionMenu, setCellActionMenu] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    open: false,
    position: null,
    shift: null,
    staff: null,
    team: null,
    date: '',
    mode: 'edit',
  });
  const [detailsState, setDetailsState] = useState({
    open: false,
    shift: null,
    dayShifts: [],
    member: null,
    team: null,
    date: '',
  });

  const [formInputs, setFormInputs] = useState({
    bidId: '',
    startInput: '',
    endInput: '',
    staffId: '',
    shiftLocation: '',
    manualJobType: '',
  });

  const [formPreview, setFormPreview] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const closeShiftForm = useCallback(() => {
    setFormPreview(null);
    setFormInputs({
      bidId: '',
      startInput: '',
      endInput: '',
      staffId: '',
      shiftLocation: '',
      manualJobType: '',
    });
    setShiftForm({
      open: false,
      position: null,
      shift: null,
      staff: null,
      team: null,
      date: '',
      mode: 'edit',
    });
  }, []);

  const closeDetailsDialog = useCallback(() => {
    setDetailsState({
      open: false,
      shift: null,
      dayShifts: [],
      member: null,
      team: null,
      date: '',
    });
  }, []);

  const openShiftForm = useCallback(({ shift, staff, team, date, position, mode = 'edit', bid = null }) => {
    const formShift = mode === 'add' ? null : shift;
    const defaultBid =
      bid ||
      (mode === 'add' && isAgencyApi
        ? assignableBids.find((item) => item.scheduleDate === date) || assignableBids[0] || null
        : null);
    setFormInputs(buildFormInputs(formShift, staff, team, defaultBid));
    setShiftForm({
      open: true,
      position,
      shift: formShift,
      staff,
      team,
      date: defaultBid?.scheduleDate || date,
      mode,
    });
  }, [assignableBids, isAgencyApi]);

  const getCellPosition = useCallback((staffId, date) => {
    const el = gridRef.current?.querySelector(`[data-shift-cell="${staffId}-${date}"]`);
    return el ? getAnchorPosition(el) : null;
  }, []);

  const days = useMemo(() => {
    if (viewRange === 'Month') {
      const start = startOfMonth(weekStart);
      return eachDayOfInterval({ start, end: endOfMonth(start) });
    }
    const count = viewRange === 'Week' ? 7 : 14;
    return eachDayOfInterval({ start: weekStart, end: addDays(weekStart, count - 1) });
  }, [weekStart, viewRange]);

  const calendarRange = useMemo(() => {
    if (!days.length) return null;
    return {
      startDate: format(days[0], 'yyyy-MM-dd'),
      endDate: format(days[days.length - 1], 'yyyy-MM-dd'),
    };
  }, [days]);

  const calendarOrigin = useMemo(() => {
    if (isNurseApi) {
      return userOrigin || null;
    }
    if (location && location !== ALL_LOCATIONS_ID) {
      const selectedBranch = agencyBranches.find((branch) => String(branch.id) === String(location));
      const fromBranch = getAgencyBranchLatLng(selectedBranch);
      if (fromBranch) return fromBranch;
    }
    return userOrigin || getFirstAgencyBranchLatLng(agencyBranches) || null;
  }, [isNurseApi, location, agencyBranches, userOrigin]);

  const calendarOriginReady = Boolean(
    calendarOrigin ||
    (isNurseApi && !waitingForProfileOrigin) ||
    (!waitingForProfileOrigin &&
      !isBranchesLoading &&
      (Boolean(branchesResult) || isBranchesError))
  );

  const calendarQueryArgs = useMemo(() => {
    if (!calendarRange?.startDate || !calendarRange?.endDate || !calendarOriginReady) return null;
    const origin = calendarOrigin || { latitude: 0.1, longitude: 0.1 };
    const args = {
      latitude: Number(origin.latitude),
      longitude: Number(origin.longitude),
      startDate: calendarRange.startDate,
      endDate: calendarRange.endDate,
    };
    if (!isNurseApi && location && location !== ALL_LOCATIONS_ID) {
      args.branch = location;
    }
    return args;
  }, [calendarRange, calendarOrigin, calendarOriginReady, isNurseApi, location]);

  const agencyCalendarQuery = useGetAgencyBookingCalendarQuery(calendarQueryArgs, {
    skip: !useCalendarApi || !calendarQueryArgs || !isAgencyApi,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });
  const hccCalendarQuery = useGetHomeCareCompanyBookingCalendarQuery(calendarQueryArgs, {
    skip: !useCalendarApi || !calendarQueryArgs || !isHomeCareCompanyApi,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });
  const nurseCalendarQuery = useGetNurseBookingCalendarQuery(calendarQueryArgs, {
    skip: !useCalendarApi || !calendarQueryArgs || !isNurseApi,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });
  const {
    data: calendarData,
    isLoading: isCalendarLoading,
    isFetching: isCalendarFetching,
    isError: isCalendarError,
    error: calendarError,
    refetch: refetchCalendar,
  } = isNurseApi
      ? nurseCalendarQuery
      : isHomeCareCompanyApi
        ? hccCalendarQuery
        : agencyCalendarQuery;

  const availabilityQueryArgs = useMemo(() => {
    if (!calendarRange?.startDate || !calendarRange?.endDate) return null;
    return {
      page: 0,
      limit: 500,
      startDate: calendarRange.startDate,
      endDate: calendarRange.endDate,
    };
  }, [calendarRange]);

  const agencyAvailabilityListQuery = useGetAgencyAvailabilityQuery(availabilityQueryArgs, {
    skip: !useCalendarApi || !availabilityQueryArgs || !isAgencyApi,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });
  const hccAvailabilityListQuery = useGetHomeCareCompanyAvailabilityQuery(availabilityQueryArgs, {
    skip: !useCalendarApi || !availabilityQueryArgs || !isHomeCareCompanyApi,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });
  const nurseAvailabilityListQuery = useGetNurseAvailabilityQuery(availabilityQueryArgs, {
    skip: !useCalendarApi || !availabilityQueryArgs || !isNurseApi,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });
  const { data: availabilityData } = isNurseApi
    ? nurseAvailabilityListQuery
    : isHomeCareCompanyApi
      ? hccAvailabilityListQuery
      : agencyAvailabilityListQuery;

  useEffect(() => {
    if (!useCalendarApi || !calendarData) return;

    const baseShifts =
      calendarData.shifts && typeof calendarData.shifts === 'object' ? calendarData.shifts : {};
    const rawTeams = Array.isArray(calendarData.teams) ? calendarData.teams : [];
    let baseTeams = isStaffMember ? hydrateStaffMemberCalendarTeams(rawTeams, user) : rawTeams;
    if (isStaffMember && !baseTeams.length) {
      baseTeams = buildSelfOnlyTeams(user, {
        id: STAFF_MEMBER_SELF_ID,
        role: 'Nurse',
        label: 'My shifts',
        badge: 'ME',
      });
    }
    const availabilityList = Array.isArray(availabilityData?.data) ? availabilityData.data : [];
    const staffList = flattenTeamsStaff(baseTeams.length ? baseTeams : rawTeams);
    const visibleStaff = flattenTeamsStaff(baseTeams);

    let mergedShifts = availabilityList.length
      ? availabilityListToShiftMap(availabilityList, {
        keepExisting: baseShifts,
        staffList,
        onlyMatchedStaff: false,
      })
      : baseShifts;

    if (isStaffMember && visibleStaff.length) {
      mergedShifts = remapShiftsOntoStaffRows(mergedShifts, visibleStaff, {
        user,
        attachUnmatched: true,
      });
    }

    setCalendarTeams(baseTeams);
    setCalendarMeta(calendarData.meta || null);
    setCalendarDayWeather(
      calendarData.dayWeather && typeof calendarData.dayWeather === 'object'
        ? calendarData.dayWeather
        : {}
    );
    setCalendarSynced(true);
    setShifts(mergedShifts);
  }, [useCalendarApi, calendarData, availabilityData, isStaffMember, user, calendarRange, weekStart]);

  useEffect(() => {
    if (!useCalendarApi || !isCalendarError) return;
    const message =
      calendarError?.data?.message ||
      calendarError?.error ||
      'Failed to load booking calendar';
    toast.error(message);
  }, [useCalendarApi, isCalendarError, calendarError, isStaffMember, user, weekStart]);

  const stats = useMemo(() => {
    if (useCalendarApi) {
      if (!calendarSynced) return { hours: '0h', cost: '£0', count: '0' };
      if (calendarMeta) return formatCalendarMetaStats(calendarMeta);
    }
    return computeStats(shifts);
  }, [useCalendarApi, calendarSynced, calendarMeta, shifts]);
  const dayHours = useMemo(() => computeDayHours(shifts, days), [shifts, days]);
  const staffColWidth = isMobile ? 140 : STAFF_COL_W;
  const dayColWidth = isMobile ? 104 : DAY_COL_W;
  const gridContentWidth = getGridContentWidth(days.length, staffColWidth, dayColWidth);

  const activeCell = useMemo(() => {
    if (!shiftForm.open || !shiftForm.staff?.id || !shiftForm.date) {
      return null;
    }
    return { staffId: shiftForm.staff.id, date: shiftForm.date };
  }, [shiftForm.open, shiftForm.staff, shiftForm.date]);

  const dateRangeLabel = `${format(weekStart, 'd MMM')} - ${format(days[days.length - 1], 'd MMM')}`;

  const rosterCtx = useMemo(
    () => ({ shifts, days, keepIdleMembers: isStaffMember }),
    [shifts, days, isStaffMember]
  );
  const showStaffRoleChrome = !isStaffMember;

  const visibleTeams = useMemo(
    () =>
      isStaffMember || isNurseApi
        ? TEAMS
        : mapTeamsByRosterScope(TEAMS, rosterScope, rosterCtx),
    [TEAMS, rosterScope, rosterCtx, isStaffMember, isNurseApi]
  );

  const visibleStaffCount = useMemo(() => countRosterMembers(visibleTeams), [visibleTeams]);

  // Supplier calendar with no keys in `data`: no saved job types and no shifts in range.
  const showChooseJobTypes =
    useCalendarApi && calendarSynced && !isStaffMember && !isCalendarFetching && TEAMS.length === 0;

  const hiddenRosterCount = useMemo(
    () => countHiddenRosterMembers(TEAMS, rosterScope, rosterCtx),
    [TEAMS, rosterScope, rosterCtx]
  );

  const selectedStaffWithHours = useMemo(() => {
    if (!selectedStaff) return null;
    const previewStart = timeInputToHHMM(formPreview?.startTime);
    const previewEnd = timeInputToHHMM(formPreview?.endTime);
    const hours =
      previewStart && previewEnd
        ? applyFormPreviewHours(shifts, selectedStaff.id, days, {
          ...formPreview,
          startTime: previewStart,
          endTime: previewEnd,
        })
        : computeStaffHours(shifts, selectedStaff.id, days);
    const breakLabel = computeBreakLabelWithPreview(shifts, selectedStaff.id, days, formPreview);
    const activeShiftDate =
      shiftForm.open && shiftForm.date
        ? shiftForm.date
        : focusedShiftDate || '';

    const locationLabel = getStaffShiftLocation(
      shifts,
      selectedStaff.id,
      activeShiftDate,
      shiftForm.open ? formInputs.shiftLocation : ''
    );

    const shiftDateLabel = activeShiftDate
      ? format(parse(activeShiftDate, 'yyyy-MM-dd', new Date()), 'EEE d MMM')
      : '';

    return {
      ...selectedStaff,
      hoursLabel: formatHoursLabel(hours),
      breakLabel,
      locationLabel,
      shiftDateLabel,
    };
  }, [
    selectedStaff,
    shifts,
    days,
    formPreview,
    shiftForm.date,
    shiftForm.open,
    formInputs.shiftLocation,
    focusedShiftDate,
  ]);

  const handleFormStaffChange = useCallback((staffId) => {
    const member = ALL_STAFF.find((s) => String(s.id) === String(staffId));
    if (member) {
      setSelectedStaff(member);
      setShowStaffDetail(true);
    }
  }, [ALL_STAFF]);

  const handleStartInputChange = useCallback((value) => {
    setFormInputs((prev) => ({ ...prev, startInput: value }));
  }, []);

  const handleEndInputChange = useCallback((value) => {
    setFormInputs((prev) => ({ ...prev, endInput: value }));
  }, []);

  const handleStaffIdChange = useCallback(
    (staffId) => {
      setFormInputs((prev) => {
        if (isAgencyApi && shiftForm.mode === 'add' && prev.bidId) {
          return { ...prev, staffId };
        }
        const dayShifts = shiftForm.date ? getTimedDayShifts(shifts, staffId, shiftForm.date) : [];
        const shift = dayShifts[0] || null;
        return {
          ...prev,
          staffId,
          startInput: shift?.startTime?.slice(0, 5) || '',
          endInput: shift?.endTime?.slice(0, 5) || '',
          shiftLocation: shift?.location || '',
          manualJobType: shift?.manualJobType || '',
        };
      });
    },
    [isAgencyApi, shifts, shiftForm.date, shiftForm.mode]
  );

  const handleShiftLocationChange = useCallback((value) => {
    setFormInputs((prev) => ({ ...prev, shiftLocation: value }));
  }, []);

  const handleManualJobTypeChange = useCallback((value) => {
    setFormInputs((prev) => ({ ...prev, manualJobType: value }));
  }, []);

  const handleBidIdChange = useCallback(
    (nextBidId) => {
      const bid = assignableBids.find((item) => String(item.id) === String(nextBidId));
      setFormInputs((prev) => ({
        ...prev,
        bidId: nextBidId || '',
        startInput: bid?.startTime || '',
        endInput: bid?.endTime || '',
        shiftLocation: bid?.location || bid?.address || '',
        manualJobType: bid?.jobTypeTitle || prev.manualJobType || '',
      }));
      if (bid?.scheduleDate) {
        setShiftForm((prev) => ({ ...prev, date: bid.scheduleDate }));
      }
    },
    [assignableBids]
  );

  useEffect(() => {
    if (!shiftForm.open || !formInputs.staffId || !shiftForm.date) return;
    setFormPreview({
      staffId: coerceStaffId(formInputs.staffId),
      date: shiftForm.date,
      startTime: timeInputToHHMM(formInputs.startInput) || formInputs.startInput,
      endTime: timeInputToHHMM(formInputs.endInput) || formInputs.endInput,
      location: formInputs.shiftLocation?.trim() || '',
      editingId: shiftForm.mode === 'edit' ? shiftForm.shift?.id : null,
    });
  }, [formInputs, shiftForm.open, shiftForm.date, shiftForm.mode, shiftForm.shift?.id]);

  useEffect(() => {
    if (!shiftForm.open || !shiftForm.staff?.id || !shiftForm.date) return;
    const position = getCellPosition(shiftForm.staff.id, shiftForm.date);
    if (!position) return;
    setShiftForm((prev) => {
      if (!prev.open) return prev;
      const same =
        prev.position?.top === position.top &&
        prev.position?.left === position.left &&
        prev.position?.bottom === position.bottom;
      return same ? prev : { ...prev, position };
    });
  }, [shiftForm.open, shiftForm.staff?.id, shiftForm.date, getCellPosition]);

  const sidebarActions = useMemo(() => {
    if (shiftsCalendarOnly && !isAgencyApi) return CALENDAR_SIDEBAR_ACTIONS;
    return SIDEBAR_ACTIONS;
  }, [isAgencyApi, shiftsCalendarOnly]);

  const handleCellClick = useCallback(
    (anchor, shift, staff, date, team, options = {}) => {
      if (isLocked) {
        notifyLocked();
        return;
      }

      if (staff?.isVacant) {
        toast.info('Select a real staff row to mark availability');
        return;
      }

      if (staff?.isPlaceholder) {
        toast.info('No shifts for this job type yet. Shifts will appear here once they are booked.');
        return;
      }

      const timed = getTimedDayShifts(shifts, staff.id, date);
      const status = getDayShifts(shifts, staff.id, date).find(isStatusBlock);

      if (isTimedWorkShift(shift) && !options?.addAnother && !status) {
        setShowStaffDetail(false);
        setDetailsState({
          open: true,
          shift,
          dayShifts: timed,
          member: staff,
          team,
          date,
        });
        return;
      }

      setSelectedStaff(staff);
      setFocusedShiftDate(date);
      setShowStaffDetail(true);

      if (!timed.length || status || options?.openActions) {
        closeShiftForm();
        setCellActionMenu({
          anchorEl: anchor,
          staff,
          date,
          team,
          actions: sidebarActions,
        });
        return;
      }

      if (shiftsCalendarOnly && !isAgencyApi) {
        closeShiftForm();
        setCellActionMenu({
          anchorEl: anchor,
          staff,
          date,
          team,
          actions: sidebarActions,
        });
        return;
      }

      setActiveSidebarAction('add-shift');
      openShiftForm({
        shift: status || null,
        staff,
        team,
        date,
        position: getAnchorPosition(anchor),
        mode: timed.length && !status ? 'add' : shift ? 'edit' : 'add',
      });
    },
    [closeShiftForm, isAgencyApi, isLocked, openShiftForm, shifts, shiftsCalendarOnly, sidebarActions]
  );

  const handleShiftClick = useCallback(
    (anchor, shift, staff, date, dayShifts, team) => {
      setShowStaffDetail(false);
      setDetailsState({
        open: true,
        shift,
        dayShifts: dayShifts?.length ? dayShifts : getTimedDayShifts(shifts, staff.id, date),
        member: staff,
        team: team || STAFF_TEAM_MAP[staff.id],
        date,
      });
    },
    [shifts]
  );

  const openAddShiftPopover = useCallback(() => {
    if (shiftsCalendarOnly && !isAgencyApi) {
      return;
    }
    if (isLocked) {
      notifyLocked();
      return;
    }
    if (isAgencyApi && !assignableBids.length) {
      toast.warning('No accepted bids available to assign. Check Bids first.');
      return;
    }

    const staff =
      (selectedStaff && !selectedStaff.isVacant ? selectedStaff : null) ||
      ALL_STAFF.find((member) => !member.isVacant && isMongoObjectId(member.staffId || member.id)) ||
      ALL_STAFF.find((member) => !member.isVacant) ||
      null;

    if (!staff) {
      toast.warning('No real staff available to assign. Add staff first.');
      return;
    }

    const team = STAFF_TEAM_MAP[staff.id] || TEAMS[0];
    const date = format(days[0], 'yyyy-MM-dd');
    const timed = getTimedDayShifts(shifts, staff.id, date);
    setFocusedShiftDate(date);
    setActiveSidebarAction('add-shift');
    setShowStaffDetail(true);
    openShiftForm({
      shift: null,
      staff,
      team,
      date,
      position: getCellPosition(staff.id, date),
      mode: timed.length ? 'add' : 'add',
    });
  }, [
    ALL_STAFF,
    STAFF_TEAM_MAP,
    TEAMS,
    assignableBids.length,
    days,
    getCellPosition,
    isAgencyApi,
    isLocked,
    openShiftForm,
    selectedStaff,
    shifts,
    shiftsCalendarOnly,
  ]);

  const resolveApiStaffId = useCallback(
    (rowStaffId) => {
      const member = ALL_STAFF.find((s) => String(s.id) === String(rowStaffId));
      if (member?.isVacant) return '';

      const candidates = [
        member?.staffId,
        member?.raw?.staffId,
        member?.raw?.workerId,
        member?.raw?.worker?._id,
        member?.raw?.worker?.id,
        member?.raw?.user?._id,
        member?.raw?.user?.id,
        member?.membershipId,
        member?.id,
        rowStaffId,
      ];

      for (const candidate of candidates) {
        const id = String(candidate || '').trim();
        if (isMongoObjectId(id)) return id;
        if (id.includes('__')) {
          const tail = id.split('__').pop();
          if (isMongoObjectId(tail)) return tail;
        }
      }
      return '';
    },
    [ALL_STAFF]
  );

  const selectedBranch = useMemo(() => {
    if (!location || location === ALL_LOCATIONS_ID) {
      return locations.find((loc) => !loc.isAll)?.branch || null;
    }
    return locations.find((loc) => loc.id === location)?.branch || null;
  }, [location, locations]);

  const resolveTypeId = useCallback(
    (manualJobType) => {
      const title = String(manualJobType || '').trim();
      if (!title) return '';
      const match = (Array.isArray(jobTypeOptions) ? jobTypeOptions : []).find((item) => {
        if (typeof item === 'string') return item === title;
        return item.title === title || item.label === title || item.id === title;
      });
      if (!match) return '';
      return typeof match === 'string' ? match : String(match.id || '');
    },
    [jobTypeOptions]
  );

  const handleSaveShift = useCallback(
    async (form) => {
      if (isAgencyApi && (form.assignMode || shiftForm.mode === 'add')) {
        const bidId = String(form.bidId || formInputs.bidId || '').trim();
        const workerId = resolveApiStaffId(form.staffId);
        if (!bidId) {
          toast.error('Select a bid/shift to assign');
          throw new Error('Missing bid');
        }
        if (!workerId || !isMongoObjectId(workerId)) {
          toast.error('Select a real staff member (Vacant rows cannot be assigned)');
          throw new Error('Missing worker');
        }

        setAssigning(true);
        try {
          const result = await createAgencyBooking({ bid: bidId, worker: workerId }).unwrap();
          toast.success(
            result?.message || result?.data?.message || 'Shift assigned successfully'
          );
          try {
            await Promise.all([refetchAgencyBids(), refetchCalendar()]);
          } catch {
          }
          return;
        } catch (err) {
          toast.error(
            getJobApiErrorMessage(err) ||
              err?.data?.message ||
              err?.error ||
              err?.message ||
              'Failed to assign shift'
          );
          throw err;
        } finally {
          setAssigning(false);
        }
      }

      let targetStaffId = form.staffId;
      let teamMatched = false;
      let matchedTeam = null;

      if (form.manualJobType?.trim()) {
        const resolved = resolveStaffIdForJobType(form.manualJobType, form.staffId);
        targetStaffId = resolved.staffId;
        teamMatched = resolved.teamMatched;
        matchedTeam = resolved.team;
      }

      const editingId = shiftForm.mode === 'edit' ? shiftForm.shift?.id : null;
      const member = ALL_STAFF.find((s) => s.id === targetStaffId);
      const typeId = resolveTypeId(form.manualJobType);


      const apiId = shiftForm.mode === 'edit' ? shiftForm.shift?.apiId || null : null;

      setShifts((prev) => {
        const sourceStaffId = shiftForm.shift?.staffId || form.staffId;
        const sourceDate = shiftForm.shift?.date || form.date;

        const targetDay = getDayShifts(prev, targetStaffId, form.date);
        if (targetDay.some((s) => s.busy || s.dayOff || s.leave || s.blocksAutoAccept)) {
          removeAvailabilityBlock(targetStaffId, form.date);
        }

        let working = { ...prev };

        if (editingId && (sourceStaffId !== targetStaffId || sourceDate !== form.date)) {
          const oldEntries = getDayShifts(working, sourceStaffId, sourceDate).filter(
            (entry) => entry.id !== editingId
          );
          working = writeDayShifts(working, sourceStaffId, sourceDate, oldEntries);
          if (
            getDayShifts(prev, sourceStaffId, sourceDate).some(
              (s) => s.busy || s.dayOff || s.leave || s.blocksAutoAccept
            )
          ) {
            removeAvailabilityBlock(sourceStaffId, sourceDate);
          }
        }

        const currentEntries = getDayShifts(working, targetStaffId, form.date).filter(
          (entry) => !isStatusBlock(entry)
        );

        const nextEntry = {
          id: editingId || apiId || createShiftId(targetStaffId, form.date),
          apiId: apiId || undefined,
          staffId: targetStaffId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location || selectedBranch?.location?.fullAddress || '',
          manualJobType: form.manualJobType || '',
          typeId: typeId || '',
          notes:
            form.notes ??
            currentEntries.find((entry) => entry.id === editingId)?.notes ??
            '',
        };

        let nextEntries;
        if (editingId && currentEntries.some((entry) => entry.id === editingId)) {
          nextEntries = currentEntries.map((entry) =>
            entry.id === editingId ? { ...entry, ...nextEntry, id: editingId } : entry
          );
        } else {
          nextEntries = [...currentEntries, nextEntry];
        }

        const next = writeDayShifts(working, targetStaffId, form.date, nextEntries);
        const hours = computeStaffHours(next, targetStaffId, days);
        const isUpdate = Boolean(editingId);
        toast.success(
          isUpdate
            ? `Shift updated — ${member?.name} now at ${Math.round(hours)}h (${nextEntries.length} on day)`
            : `Shift added — ${member?.name} now at ${Math.round(hours)}h (${nextEntries.length} on day)`
        );
        return next;
      });

      if (form.manualJobType?.trim()) {
        if (!teamMatched) {
          toast.warning(
            `No matching team row for "${form.manualJobType}". Shift added on the selected staff row.`
          );
        } else if (targetStaffId !== form.staffId && matchedTeam?.label) {
          toast.info(`Shift added under ${matchedTeam.label}`);
        }
      }

      if (member) setSelectedStaff(member);
      setFormPreview(null);
      closeDetailsDialog();
    },
    [
      ALL_STAFF,
      closeDetailsDialog,
      createAgencyBooking,
      days,
      formInputs.bidId,
      isAgencyApi,
      refetchAgencyBids,
      refetchCalendar,
      resolveApiStaffId,
      resolveStaffIdForJobType,
      resolveTypeId,
      selectedBranch,
      shiftForm.mode,
      shiftForm.shift,
    ]
  );

  const handleDeleteShift = useCallback(
    async (shift) => {
      const member = ALL_STAFF.find((s) => s.id === shift.staffId);
      const isAvailabilityBlock = Boolean(
        shift?.busy ||
        shift?.dayOff ||
        shift?.leave ||
        shift?.blocksAutoAccept ||
        shift?.onCall ||
        shift?.sleepover
      );
      const apiId = shift.apiId || null;

      if (useCalendarApi && isAvailabilityBlock && apiId) {
        try {
          await deleteAvailability(apiId).unwrap();
        } catch (err) {
          toast.error(err?.data?.message || err?.error || err?.message || 'Could not delete');
          return;
        }
      }

      if (isAvailabilityBlock) {
        removeAvailabilityBlock(shift.staffId, shift.date);
      }

      setShifts((prev) => {
        const remaining = getDayShifts(prev, shift.staffId, shift.date).filter(
          (entry) => entry.id !== shift.id
        );
        const next = writeDayShifts(prev, shift.staffId, shift.date, remaining);
        const hours = computeStaffHours(next, shift.staffId, days);
        toast.success(
          isAvailabilityBlock
            ? `Availability block removed — ${member?.name} can be auto-accepted again`
            : `Shift removed — ${member?.name} now at ${Math.round(hours)}h`
        );
        return next;
      });
      setFormPreview(null);
      closeDetailsDialog();
    },
    [ALL_STAFF, closeDetailsDialog, days, deleteAvailability, useCalendarApi]
  );

  const handleCancelBooking = useCallback(
    async (shift) => {
      const member = ALL_STAFF.find((s) => s.id === shift.staffId);

      setShifts((prev) => {
        const remaining = getDayShifts(prev, shift.staffId, shift.date).filter(
          (entry) => entry.id !== shift.id
        );
        const next = writeDayShifts(prev, shift.staffId, shift.date, remaining);
        toast.success(`Booking cancelled — ${member?.name || 'Staff'}`);
        return next;
      });
      setFormPreview(null);
      closeDetailsDialog();
    },
    [ALL_STAFF, closeDetailsDialog]
  );

  const handleCopyShift = useCallback((source) => {
    if (!isCopyableShift(source) && !(source?.startTime && source?.endTime)) {
      toast.error('Nothing to copy');
      return;
    }

    setCopiedShift({
      startTime: source.startTime,
      endTime: source.endTime,
      location: source.location || '',
      manualJobType: source.manualJobType || '',
      notes: source.notes || '',
    });
    toast.success('Shift copied — Ctrl+V or right-click Paste');
  }, []);

  const handlePasteShift = useCallback(
    async (staffId, date) => {
      if (isLocked) {
        notifyLocked();
        return;
      }
      if (!copiedShift) {
        toast.info('Copy a shift first');
        return;
      }
      if (!staffId || !date) {
        toast.info('Select a day cell to paste into');
        return;
      }

      const member = ALL_STAFF.find((s) => s.id === staffId);
      if (!member || member.isVacant) {
        toast.warning('Cannot paste onto a vacant row');
        return;
      }

      const existingDay = getDayShifts(shifts, staffId, date);
      if (existingDay.some((s) => s.busy || s.dayOff || s.leave || s.blocksAutoAccept)) {
        toast.warning('Cannot paste over a busy / leave day');
        return;
      }

      setShifts((prev) => {
        const current = getTimedDayShifts(prev, staffId, date);
        const nextEntry = {
          id: createShiftId(staffId, date),
          staffId,
          date,
          startTime: copiedShift.startTime,
          endTime: copiedShift.endTime,
          location: copiedShift.location || '',
          manualJobType: copiedShift.manualJobType || '',
          notes: copiedShift.notes || '',
        };
        const next = writeDayShifts(prev, staffId, date, [...current, nextEntry]);
        toast.success(
          `Shift pasted on ${format(parse(date, 'yyyy-MM-dd', new Date()), 'EEE d MMM')} — ${member.name} (${current.length + 1} on day)`
        );
        return next;
      });

      setFocusedShiftDate(date);
      setSelectedStaff(member);
      setShowStaffDetail(true);
    },
    [ALL_STAFF, copiedShift, isLocked, shifts]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      const isPasteShortcut =
        (event.ctrlKey || event.metaKey) && String(event.key || '').toLowerCase() === 'v';
      if (!isPasteShortcut) return;

      const tag = event.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) return;

      event.preventDefault();
      const staffId = activeCell?.staffId || selectedStaff?.id;
      const date = activeCell?.date || focusedShiftDate;
      handlePasteShift(staffId, date);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeCell, focusedShiftDate, handlePasteShift, selectedStaff?.id]);

  const shiftFormCardProps = useMemo(() => {
    if (!shiftForm.open) return null;
    const assignMode = isAgencyApi && shiftForm.mode === 'add';

    return {
      team: shiftForm.team,
      shift: shiftForm.shift,
      date: shiftForm.date,
      startInput: formInputs.startInput,
      endInput: formInputs.endInput,
      staffId: formInputs.staffId,
      shiftLocation: formInputs.shiftLocation,
      manualJobType: formInputs.manualJobType,
      bidId: formInputs.bidId,
      assignableBids,
      assignMode,
      assigning,
      jobTypeOptions,
      onStartInputChange: handleStartInputChange,
      onEndInputChange: handleEndInputChange,
      onStaffIdChange: handleStaffIdChange,
      onShiftLocationChange: handleShiftLocationChange,
      onManualJobTypeChange: handleManualJobTypeChange,
      onBidIdChange: handleBidIdChange,
      onClose: closeShiftForm,
      onSave: handleSaveShift,
      onDelete: handleDeleteShift,
      onCopy: handleCopyShift,
      onStaffChange: handleFormStaffChange,
    };
  }, [
    shiftForm.open,
    shiftForm.team,
    shiftForm.shift,
    shiftForm.date,
    shiftForm.mode,
    formInputs,
    assignableBids,
    assigning,
    isAgencyApi,
    handleStartInputChange,
    handleEndInputChange,
    handleStaffIdChange,
    handleShiftLocationChange,
    handleManualJobTypeChange,
    handleBidIdChange,
    closeShiftForm,
    handleSaveShift,
    handleDeleteShift,
    handleCopyShift,
    handleFormStaffChange,
    jobTypeOptions,
  ]);

  const applySpecialShift = useCallback(
    async (type, context = {}) => {
      if (isLocked) {
        notifyLocked();
        return;
      }
      const staff = context.staff || selectedStaff || TEAMS[0].staff[0];
      const date =
        context.date ||
        (focusedShiftDate && days.some((day) => format(day, 'yyyy-MM-dd') === focusedShiftDate)
          ? focusedShiftDate
          : format(days[0], 'yyyy-MM-dd'));

      closeShiftForm();
      setSelectedStaff(staff);
      setFocusedShiftDate(date);
      setShowStaffDetail(true);

      if (type === 'not-scheduled') {
        const datesToClear = [date];
        if (useCalendarApi) {
          const idsToDelete = [];
          datesToClear.forEach((dateKey) => {
            getDayShifts(shifts, staff.id, dateKey).forEach((entry) => {
              if (
                entry?.apiId &&
                (entry.busy ||
                  entry.dayOff ||
                  entry.leave ||
                  entry.blocksAutoAccept ||
                  entry.onCall ||
                  entry.sleepover)
              ) {
                idsToDelete.push(entry.apiId);
              }
            });
          });
          try {
            await Promise.all(idsToDelete.map((id) => deleteAvailability(id).unwrap()));
          } catch (err) {
            toast.error(err?.data?.message || err?.error || err?.message || 'Could not clear availability');
            return;
          }
        }

        setShifts((prev) => {
          const next = { ...prev };
          datesToClear.forEach((dateKey) => {
            const entries = getDayShifts(next, staff.id, dateKey);
            if (entries.some((entry) => entry.busy || entry.dayOff || entry.leave || entry.blocksAutoAccept)) {
              removeAvailabilityBlock(staff.id, dateKey);
            }
            delete next[cellKey(staff.id, dateKey)];
          });
          toast.success('Marked as not scheduled');
          return next;
        });
        setActiveSidebarAction(type);
        setFormPreview(null);
        return;
      }

      const meta = {
        busy: {
          busy: true,
          blocksAutoAccept: true,
          startTime: '00:00',
          endTime: '23:59',
          note: 'Staff marked busy — blocked from auto-accept',
        },
        'on-call': { onCall: true, startTime: '00:00', endTime: '23:59' },
        sleepover: { sleepover: true, startTime: '22:00', endTime: '07:00' },
        'day-off': {
          dayOff: true,
          blocksAutoAccept: true,
          startTime: '00:00',
          endTime: '23:59',
          note: 'Day off requested — blocked from auto-accept',
        },
        'add-leave': {
          leave: true,
          blocksAutoAccept: true,
          startTime: '09:00',
          endTime: '18:00',
          note: 'Leave requested — blocked from auto-accept',
        },
      }[type];

      if (!meta) return;


      const isDayFreeForAvailability = (dateKey, { allowExistingBlock = false } = {}) => {
        if (getTimedDayShifts(shifts, staff.id, dateKey).length > 0) return false;
        const block = getDayShifts(shifts, staff.id, dateKey).find(
          (entry) =>
            entry?.busy ||
            entry?.dayOff ||
            entry?.leave ||
            entry?.blocksAutoAccept ||
            entry?.onCall ||
            entry?.sleepover
        );
        if (!block) return true;
        return Boolean(allowExistingBlock && block.apiId);
      };

      let targetDate = date;
      if (!isDayFreeForAvailability(targetDate, { allowExistingBlock: true })) {
        toast.warning('This day already has a booking');
        return;
      }

      const targetKey = `${staff.id}-${targetDate}`;
      setFocusedShiftDate(targetDate);

      const existingBlock = getDayShifts(shifts, staff.id, targetDate).find(
        (entry) =>
          entry?.busy ||
          entry?.dayOff ||
          entry?.leave ||
          entry?.blocksAutoAccept ||
          entry?.onCall ||
          entry?.sleepover
      );
      const editingApiId = existingBlock?.apiId || null;

      let apiId = editingApiId;
      let apiSuccessMessage = '';
      if (useCalendarApi) {
        try {
          const apiStaffId = resolveApiStaffId(staff.id);
          if (!apiStaffId) {
            toast.error('Could not resolve staff id for availability — refresh and try again');
            return;
          }
          const body = buildAgencyAvailabilityPayload({
            status: type,
            date: targetDate,
            startTime: meta.startTime,
            endTime: meta.endTime,
            staffId: apiStaffId,
            notes: meta.note || '',
          });
          if (editingApiId) {
            const updated = await updateAvailability({ id: editingApiId, ...body }).unwrap();
            apiId = editingApiId;
            apiSuccessMessage = String(updated?.message || '').trim();
          } else {
            const created = await createAvailability(body).unwrap();
            apiId =
              created?.data?._id ||
              created?.data?.id ||
              created?._id ||
              created?.id ||
              null;
            apiSuccessMessage = String(created?.message || '').trim();
          }
        } catch (err) {
          const apiMessage = err?.data?.message || err?.error || err?.message || '';
          if (/overlap/i.test(String(apiMessage))) {
            toast.warning(apiMessage || 'Time overlaps an existing shift or leave');
          } else {
            toast.error(apiMessage || 'Could not save availability');
          }
          return;
        }
      }

      if (!useCalendarApi && (type === 'busy' || type === 'day-off' || type === 'add-leave')) {
        upsertAvailabilityBlock({
          staffId: staff.id,
          date: targetDate,
          type: type === 'add-leave' ? 'leave' : type === 'day-off' ? 'dayOff' : 'busy',
          note: meta.note,
        });
      }

      const shortLabels = {
        busy: 'Marked busy',
        'on-call': 'On call scheduled',
        sleepover: 'Sleepover scheduled',
        'day-off': 'Day off scheduled',
        'add-leave': 'Leave added',
      };

      setShifts((prev) => ({
        ...prev,
        [targetKey]: {
          id: apiId || targetKey,
          apiId: apiId || undefined,
          staffId: staff.id,
          date: targetDate,
          ...meta,
        },
      }));

      toast.success(apiSuccessMessage || shortLabels[type] || 'Saved');

      setActiveSidebarAction(type);
      setFormPreview(null);
      refetchCalendar?.();
    },
    [
      TEAMS,
      closeShiftForm,
      createAvailability,
      days,
      deleteAvailability,
      focusedShiftDate,
      isLocked,
      resolveApiStaffId,
      selectedStaff,
      shifts,
      updateAvailability,
      useCalendarApi,
      refetchCalendar,
    ]
  );

  const handleStaffSelect = useCallback((member) => {
    if (member?.isPlaceholder) return;
    setSelectedStaff((prev) => {
      if (prev?.id !== member.id) {
        setFocusedShiftDate('');
      }
      return member;
    });
    setShowStaffDetail(!isStaffMember);
  }, [isStaffMember]);

  const handlePrevPeriod = () => {
    setWeekStart((prev) => {
      if (viewRange === 'Week') return subWeeks(prev, 1);
      if (viewRange === 'Month') return startOfMonth(subMonths(prev, 1));
      return addDays(prev, -14);
    });
  };

  const handleNextPeriod = () => {
    setWeekStart((prev) => {
      if (viewRange === 'Week') return addWeeks(prev, 1);
      if (viewRange === 'Month') return startOfMonth(addMonths(prev, 1));
      return addDays(prev, 14);
    });
  };
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gridRef.current?.requestFullscreen?.();
      toast.info('Fullscreen enabled');
    } else {
      document.exitFullscreen?.();
      toast.info('Fullscreen exited');
    }
  };

  const layoutSx = {
    height: isMobile ? 'auto' : 'calc(100dvh - var(--layout-header-desktop-height) - 8px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
    minHeight: 0,
    position: 'relative',
  };

  const LayoutRoot = DashboardContent;

  return (
    <LayoutRoot disablePadding maxWidth={false} sx={layoutSx}>
      {((useCalendarApi && isCalendarLoading && !calendarSynced) ||
        (postedJobsLoading && !postedJobs?.length)) ? (
        <ModuleLoading
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 3,
            bgcolor: 'background.paper',
          }}
        />
      ) : null}
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
        <LeftSidebar
          location={location}
          locations={locations}
          hideLocations={isNurseApi && !isStaffMember}
          hideStaffCard={isStaffMember}
          onLocationChange={(val) => {
            setLocation(val);
            const selected = locations.find((l) => l.id === val);
            const distance = formatLocationDistanceLabel(selected);
            toast.info(
              selected?.isAll
                ? `Showing all locations (${selected.locationCount || locations.length - 1})`
                : `Location: ${selected?.label || val}${distance ? ` · ${distance}` : ''}`
            );
          }}
          stats={stats}
          showStaffDetail={showStaffDetail}
          selectedStaff={selectedStaffWithHours}
          activeAction={activeSidebarAction}
          shiftFormOpen={
            (!shiftsCalendarOnly || isAgencyApi) &&
            shiftForm.open &&
            activeSidebarAction === 'add-shift'
          }
          shiftFormProps={shiftFormCardProps}
          shiftTeam={shiftForm.team || STAFF_TEAM_MAP[selectedStaff?.id]}
          formPreview={formPreview}
          shifts={shifts}
          days={days}
          onBack={() => {
            setShowStaffDetail(false);
            setFocusedShiftDate('');
            closeShiftForm();
          }}
          onAddShift={openAddShiftPopover}
          onStaffAction={applySpecialShift}
          isMobile={isMobile}
          actions={sidebarActions}
          postedJobs={postedJobs}
          postedJobsLoading={postedJobsLoading}
          postedJobsTitle={isHomeCareCompanyApi ? 'Jobs' : 'Jobs'}
        />

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', minWidth: 0 }}>
          <Box
            sx={{
              px: 2,
              py: isMobile ? 1.25 : 0.75,
              borderBottom: '1px solid #e0e0e0',
              bgcolor: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              flexShrink: 0,
              minHeight: 48,
              overflow: 'hidden',
              flexWrap: 'wrap',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton size="small" onClick={handlePrevPeriod}>
                <Iconify icon="eva:arrow-ios-back-fill" width={16} />
              </IconButton>
              <Typography sx={{ fontSize: 13, fontWeight: 600, minWidth: 110, textAlign: 'center' }}>
                {dateRangeLabel}
              </Typography>
              <IconButton size="small" onClick={handleNextPeriod}>
                <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
              </IconButton>
            </Stack>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={viewRange}
                onChange={(e) => {
                  const next = e.target.value;
                  setViewRange(next);
                  if (next === 'Month') {
                    setWeekStart((prev) => startOfMonth(prev));
                  }
                }}
                sx={{ fontSize: 12 }}
              >
                <MenuItem value="Week">Week</MenuItem>
                <MenuItem value="Fortnight">Fortnight</MenuItem>
                <MenuItem value="Month">Month</MenuItem>
              </Select>
            </FormControl>

            {showStaffRoleChrome ? (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                <Tooltip
                  title={
                    rosterScope === ROSTER_SCOPE.CURRENT
                      ? 'Current: only active staff working in this period. Past leavers and vacant slots are hidden.'
                      : 'All: full roster including vacant slots and people who have left.'
                  }
                >
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Button
                      size="small"
                      onClick={() => setRosterScope(ROSTER_SCOPE.CURRENT)}
                      sx={{
                        fontSize: 11.5,
                        color: 'text.primary',
                        bgcolor: rosterScope === ROSTER_SCOPE.CURRENT ? '#e8f5e9' : '#f5f5f5',
                        border: '1px solid',
                        borderColor: rosterScope === ROSTER_SCOPE.CURRENT ? '#81c784' : '#e0e0e0',
                        textTransform: 'none',
                        px: 1.5,
                        minWidth: 'auto',
                        fontWeight: rosterScope === ROSTER_SCOPE.CURRENT ? 700 : 500,
                      }}
                    >
                      Current
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setRosterScope(ROSTER_SCOPE.ALL)}
                      sx={{
                        fontSize: 11.5,
                        color: 'text.primary',
                        bgcolor: rosterScope === ROSTER_SCOPE.ALL ? '#e3f2fd' : '#f5f5f5',
                        border: '1px solid',
                        borderColor: rosterScope === ROSTER_SCOPE.ALL ? '#90caf9' : '#e0e0e0',
                        textTransform: 'none',
                        px: 1.5,
                        minWidth: 'auto',
                        fontWeight: rosterScope === ROSTER_SCOPE.ALL ? 700 : 500,
                      }}
                    >
                      All
                    </Button>
                    <Typography sx={{ fontSize: 11, color: 'text.secondary', pl: 0.5, whiteSpace: 'nowrap' }}>
                      {visibleStaffCount} shown
                      {hiddenRosterCount > 0 ? ` · ${hiddenRosterCount} hidden` : ''}
                    </Typography>
                  </Stack>
                </Tooltip>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
              </>
            ) : null}

            <Box sx={{ flex: 1 }} />

            <IconButton
              size="small"
              style={viewOnly ? { display: 'none' } : undefined}
              onClick={() => {
                setIsLocked((prev) => !prev);
                toast.info(isLocked ? 'Rota unlocked' : 'Rota locked');
              }}
              sx={{ color: isLocked ? '#e53935' : 'inherit' }}
            >
              <Iconify icon="solar:lock-bold" width={16} />
            </IconButton>
            <IconButton size="small" onClick={toggleFullscreen}>
              <Iconify icon="solar:full-screen-bold" width={16} />
            </IconButton>
          </Box>

          <ShiftRotaGridScroll
            gridRef={gridRef}
            gridContentWidth={gridContentWidth}
            gridLine={GRID_LINE}
            isPanning={isPanning}
            onGridMouseDown={handleGridMouseDown}
            stickyLeftWidth={staffColWidth}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'stretch',
                position: 'sticky',
                top: 0,
                zIndex: 5,
                bgcolor: '#fff',
                borderBottom: `1px solid ${GRID_LINE}`,
              }}
            >
              <Box
                sx={{
                  width: staffColWidth,
                  minWidth: staffColWidth,
                  borderRight: `1px solid ${GRID_LINE}`,
                  bgcolor: '#fff',
                  position: 'sticky',
                  left: 0,
                  zIndex: 6,
                  flexShrink: 0,
                  alignSelf: 'stretch',
                }}
              />
              {days.map((day, i) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const apiWeather = calendarDayWeather?.[dateKey] || null;
                return (
                  <ShiftDayHeaderCell
                    key={dateKey}
                    day={day}
                    hours={dayHours[i]}
                    dayColWidth={dayColWidth}
                    gridLine={GRID_LINE}
                    weatherType={apiWeather?.type || null}
                    dayWeather={apiWeather}
                  />
                );
              })}
              <GridRowTail dayColWidth={dayColWidth} />
            </Box>

            {showChooseJobTypes ? (
              <Box
                sx={{
                  position: 'sticky',
                  left: 0,
                  width: { xs: 'calc(100vw - 32px)', md: 560 },
                  maxWidth: '100%',
                  px: 3,
                  py: 6,
                  textAlign: 'center',
                  mx: 'auto',
                }}
              >
                <Iconify icon="solar:case-round-bold" width={40} sx={{ color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="subtitle1">Choose your job types to set up your calendar</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75, mb: 2.5 }}>
                  Each job type you provide gets its own row here, and your shifts show up under it.
                </Typography>
                <Button
                  component={RouterLink}
                  href={`${paths.dashboard.profile}?tab=jobTypes`}
                  variant="contained"
                  startIcon={<Iconify icon="solar:settings-bold" width={18} />}
                >
                  Choose job types
                </Button>
              </Box>
            ) : null}

            {visibleTeams.map((team) => (
              <TeamGroup
                key={team.id}
                team={team}
                days={days}
                shifts={shifts}
                selectedStaffId={showStaffDetail ? selectedStaff?.id : null}
                activeCell={activeCell}
                formPreview={formPreview}
                onCellClick={handleCellClick}
                onShiftClick={handleShiftClick}
                onStaffSelect={handleStaffSelect}
                collapsed={!!collapsed[team.id]}
                onToggle={() => setCollapsed((p) => ({ ...p, [team.id]: !p[team.id] }))}
                canPaste={Boolean(copiedShift)}
                onCopyShift={handleCopyShift}
                onPasteShift={handlePasteShift}
                staffColWidth={staffColWidth}
                dayColWidth={dayColWidth}
                showEmptyPlus={true}
              />
            ))}

            <Box sx={{ flex: 1, minHeight: 32, bgcolor: '#fff' }} />
          </ShiftRotaGridScroll>
        </Box>
      </Box>

      <Menu
        anchorEl={cellActionMenu?.anchorEl}
        open={Boolean(cellActionMenu?.anchorEl)}
        onClose={() => setCellActionMenu(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: { sx: { minWidth: 220, zIndex: (t) => t.zIndex.modal + 2 } },
        }}
      >
        {(cellActionMenu?.actions || CALENDAR_SIDEBAR_ACTIONS).map((action) => (
          <MenuItem
            key={action.id}
            onClick={() => {
              const context = cellActionMenu;
              setCellActionMenu(null);
              if (action.id === 'add-shift') {
                setActiveSidebarAction('add-shift');
                openShiftForm({
                  shift: null,
                  staff: context?.staff,
                  team: context?.team || STAFF_TEAM_MAP[context?.staff?.id],
                  date: context?.date,
                  position: getAnchorPosition(context?.anchorEl),
                  mode: 'add',
                });
                return;
              }
              applySpecialShift(action.id, {
                staff: context?.staff,
                date: context?.date,
              });
            }}
            sx={{ fontSize: 13, py: 1 }}
          >
            <Iconify icon={action.icon} width={16} sx={{ mr: 1.25, color: 'text.secondary' }} />
            {action.label.replace(' (block auto-accept)', '')}
          </MenuItem>
        ))}
      </Menu>

      <AddShiftPopover
        open={(!shiftsCalendarOnly || isAgencyApi) && shiftForm.open}
        position={shiftForm.position}
        onClose={closeShiftForm}
        formProps={shiftFormCardProps}
        excludeLeft={isMobile ? 0 : SIDEBAR_W}
      />

      <AgencyShiftDetailsDialog
        open={detailsState.open}
        onClose={closeDetailsDialog}
        shift={detailsState.shift}
        dayShifts={detailsState.dayShifts}
        member={detailsState.member}
        locked={isLocked}
        calendarOnly={shiftsCalendarOnly}
        onEdit={(shift) => {
          closeDetailsDialog();
          if (isLocked) {
            notifyLocked();
            return;
          }
          if (detailsState.member) setSelectedStaff(detailsState.member);
          setShowStaffDetail(true);
          setActiveSidebarAction('add-shift');
          openShiftForm({
            shift,
            staff: detailsState.member,
            team: detailsState.team || STAFF_TEAM_MAP[detailsState.member?.id],
            date: detailsState.date || shift.date,
            position: getCellPosition(detailsState.member?.id, detailsState.date || shift.date),
            mode: 'edit',
          });
        }}
        onAddAnother={(shift) => {
          closeDetailsDialog();
          if (isLocked) {
            notifyLocked();
            return;
          }
          if (detailsState.member) setSelectedStaff(detailsState.member);
          setShowStaffDetail(true);
          setActiveSidebarAction('add-shift');
          openShiftForm({
            shift: null,
            staff: detailsState.member,
            team: detailsState.team || STAFF_TEAM_MAP[detailsState.member?.id],
            date: detailsState.date || shift.date,
            position: getCellPosition(detailsState.member?.id, detailsState.date || shift.date),
            mode: 'add',
          });
        }}
        onCancelBooking={(shift) => {
          handleCancelBooking(shift);
        }}
      />
    </LayoutRoot>
  );
}
