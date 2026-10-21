import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { useSelector } from 'react-redux';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Portal from '@mui/material/Portal';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { EmptyContent } from 'src/components/empty-content';
import {
  mapDashboardStaffToShiftTeams,
  resolveRosterAccountKey,
} from 'src/sections/staff/company-roster-store';
import { useGetDashboardStaffQuery } from 'src/store/Reducer/staff-api';

import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';
import { JobMediaThumb } from 'src/components/jobs/job-image';
import { ShiftTimePickerPill } from 'src/components/shift-time-picker-pill';
import { ShiftDayHeaderCell } from 'src/components/shifts/shift-day-header-cell';
import { ShiftRotaGridScroll, useDragScroll } from 'src/components/shifts/shift-rota-grid-scroll';
import {
  ROSTER_SCOPE,
  countHiddenRosterMembers,
  countRosterMembers,
  mapTeamsByRosterScope,
} from 'src/components/shifts/roster-scope';
import {
  ALL_LOCATIONS_ID,
  formatLocationDistanceLabel,
  getLocationDisplayTitle,
  withAllLocationsOption,
} from 'src/components/shifts/location-options';
import { useActiveBranch } from 'src/sections/branches/active-branch-context';
import { getJobBidsPath } from 'src/sections/care-home/agreed-rates/agreed-rates-nav-utils';
import { toast } from 'src/components/snackbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { handleApiError } from 'src/store/handleApiError';
import { DashboardContent } from 'src/layouts/dashboard';
import { hideScrollY } from 'src/theme/styles/mixins';
import { StandaloneAddressInput } from 'src/sections/tempy-home/standalone-address-input';
import { _careHomeJobs } from 'src/_mock/_care-home-jobs';
import { useGetCareHomeBranchesQuery } from 'src/store/Reducer/care-home-branches-api';
import { useGetHospitalBranchesQuery } from 'src/store/Reducer/hospital-branches-api';
import { useGetLocalAuthorityBranchesQuery } from 'src/store/Reducer/local-authority-branches-api';
import { useUserAddressesQuery } from 'src/store/Reducer/user-branches-api';
import { useGetUserByIdQuery } from 'src/store/Reducer/users-api';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import {
  useCreateCareHomeJobMutation,
  useGetCareHomeBookingCalendarQuery,
  useGetCareHomeJobsQuery,
  useUpdateCareHomeJobMutation,
  useCancelCareHomeBookingMutation,
} from 'src/store/Reducer/care-home-jobs-api';
import {
  useCreateHospitalJobMutation,
  useGetHospitalBookingCalendarQuery,
  useGetHospitalJobsQuery,
  useUpdateHospitalJobMutation,
} from 'src/store/Reducer/hospital-jobs-api';
import {
  useCreateUserJobMutation,
  useGetUserBookingCalendarQuery,
  useGetUserJobsQuery,
  useUpdateUserJobMutation,
} from 'src/store/Reducer/user-jobs-api';
import {
  useCreateLocalAuthorityJobMutation,
  useGetLocalAuthorityBookingCalendarQuery,
  useGetLocalAuthorityJobsQuery,
  useUpdateLocalAuthorityJobMutation,
} from 'src/store/Reducer/local-authority-jobs-api';
import { isMongoObjectId } from 'src/sections/branches/agency-branch-utils';

import { PostJobDialog } from '../../jobs/post-job-dialog';
import { IncreaseJobRateDialog } from '../../jobs/increase-job-rate-dialog';
import { LeaveJobReviewDialog } from '../../jobs/leave-job-review-dialog';
import { PersonOffDialog } from '../person-off-dialog';
import { JobTypesProvider } from '../../jobs/context/job-types-provider';
import { PostedJobsSidebarPanel } from '../posted-jobs-sidebar-panel';
import { useEmployerPostedJobs } from '../use-employer-posted-jobs';
import { normalizePostedJobForSidebar } from '../posted-jobs-schedule-utils';
import {
  createCareHomeJobFromDraft,
  createJobDraftForCell,
  formatScheduleLabel,
  getGenderLabel,
  loadCareHomeJobs,
  normalizeSchedule,
  saveCareHomeJobs,
  teamLabelToJobType,
  findBestTeamForJobType,
  validateJobDraft,
  jobToDraft,
} from '../../jobs/care-home-job-utils';
import {
  buildCareHomeJobPayload,
  getCareHomeBranchLatLng,
  getFirstCareHomeBranchLatLng,
  getCareHomeUserLatLng,
  isJobCreateSoftError,
  mergeUserWithProfile,
} from '../../jobs/care-home-job-api-utils';
import { fCurrency } from 'src/utils/format-number';
import { pickApiReview, resolveJobReviewTarget, resolveReviewSubmitTarget } from 'src/sections/reviews/reviews-api-utils';
import {
  useCreateReviewMutation,
  useGetReviewsQuery,
  useUpdateReviewMutation,
} from 'src/store/Reducer/reviews-api';
import { formatCalendarMetaStats } from '../care-home-booking-calendar-api-utils';

const VIEW_ONLY = true;

function resolveLocations(config) {
  if (config?.locations?.length) return withAllLocationsOption(config.locations);
  return withAllLocationsOption([]);
}

const STAFF_COL_W = 188;
const DAY_COL_W = 146;
const ROW_H = 46;

const CARD_RIGHT_RAIL_W = 20;

function getRoleStripWidth(roleCode = '') {
  const len = String(roleCode).trim().length;
  if (len <= 2) return 22;
  if (len <= 3) return 26;
  return 30;
}

function getTwoLetterCode(label = '') {
  const words = String(label)
    .replace(/[-–—]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

function getShiftTypeLabel({ jobType, roleCode, teamLabel, staffRole } = {}) {
  return getTwoLetterCode(teamLabel || jobType || staffRole || roleCode);
}

function formatStaffCount(count) {
  if (count == null || count === '') return null;
  return String(count);
}
const SHIFT_CARD_MENU = [
  { id: 'details', label: 'View shift details' },
  { id: 'bids', label: 'View bids' },
  { id: 'rate', label: 'Increase rate' },
  { id: 'rateWorker', label: 'Rate worker' },
  { id: 'cancelBooking', label: 'Cancel booking' },
];

const ShiftReviewLookupContext = createContext(() => null);

const ShiftCancelBookingContext = createContext(null);

function resolveShiftJobId(shift) {
  return String(shift?.jobId || shift?.job?._id || shift?.job?.id || '').trim();
}

function shiftAllowsViewBids(card, shift, member) {
  if (!shift) return false;
  if (shift.receivingBids === true || shift.isBiddingAllowed === true) return true;
  const filled = typeof card?.filled === 'boolean' ? card.filled : isRotaShiftFilled(shift, member);
  return !filled;
}

function shiftAllowsIncreaseRate(card, shift, member) {
  return shiftAllowsViewBids(card, shift, member) && Boolean(resolveShiftJobId(shift));
}

function isRotaShiftCompleted(shift) {
  if (!shift) return false;
  const status = String(shift.status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (['completed', 'complete', 'done', 'finished'].includes(status)) return true;

  if (!shift.date || !shift.endTime) return false;
  try {
    const endAt = parse(`${shift.date} ${shift.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
    return isValid(endAt) && endAt.getTime() < Date.now();
  } catch {
    return false;
  }
}

function shiftAllowsRateWorker(card, shift, member) {
  if (!shift) return false;
  const filled = typeof card?.filled === 'boolean' ? card.filled : isRotaShiftFilled(shift, member);
  if (!filled) return false;
  return isRotaShiftCompleted(shift);
}

const CLOSED_BOOKING_STATUSES = [
  'cancel',
  'cancelled',
  'canceled',
  'cancelledbyworker',
  'cancelledbyemployer',
  'cancelledbyuser',
  'inprogress',
  'completed',
];

function shiftAllowsCancelBooking(shift) {
  if (!shift || shift.cancelled) return false;
  if (!String(shift.bookingId || '').trim()) return false;
  const status = String(shift.status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (CLOSED_BOOKING_STATUSES.includes(status)) return false;
  return !isRotaShiftCompleted(shift);
}

function buildReviewJobFromShift(shift, member, existingReview = null) {
  if (!shift) return null;
  const bookingId = String(shift.bookingId || shift.apiId || shift.id || '').trim();
  const workerId = String(shift.workerId || member?.id || '').trim();
  const workerName = String(member?.name || shift.displayName || '').trim();

  return {
    id: resolveShiftJobId(shift) || bookingId,
    type: shift.jobType || shift.roleCode || member?.role || 'Shift',
    title: workerName || shift.jobType || 'Completed shift',
    bookingId: bookingId || undefined,
    workerId: workerId || undefined,
    worker: {
      id: workerId,
      name: workerName,
      profileIcon: member?.avatarUrl || '',
    },
    workerName,
    review: existingReview || shift.review || null,
  };
}
const TEAM_HEADER_H = 40;
const STAFF_CONTRACT_H = 48;

const CARD = {
  shiftBg: '#d2e6f7',
  shiftBgFaded: '#e8f2fa',
  badgeBg: '#9ec9eb',
  badgeText: '#1a6fb5',
  leaveBg: '#c5ddb0',
  leaveText: '#3d5234',
  unavailableBg: '#ececec',
  timeText: '#37474f',
  nameText: '#263238',
  pillBorder: '#cfd8dc',
  gridBorder: '#e8e8e8',
  filledBg: '#c8e6c9',
  filledBorder: '#66bb6a',
  filledBadgeBg: '#81c784',
  filledBadgeText: '#1b5e20',
  filledBgAlt: '#bbdefb',
  filledBorderAlt: '#64b5f6',
  filledBadgeBgAlt: '#64b5f6',
  filledBadgeTextAlt: '#0d47a1',
  unfilledBg: '#ffcdd2',
  unfilledBorder: '#e57373',
  unfilledBadgeBg: '#ef9a9a',
  unfilledBadgeText: '#b71c1c',
};

function isRotaShiftFilled(shift, member) {
  if (!shift) return false;
  if (member?.isVacant) return false;

  if (shift.receivingBids === true || shift.isBiddingAllowed === true) return false;

  const status = String(shift.status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
  if (
    ['open', 'unfilled', 'unassigned', 'posted', 'pending', 'receivingbids', 'bidding'].includes(status)
  ) {
    return false;
  }
  if (['filled', 'booked', 'accepted', 'assigned', 'confirmed', 'completed'].includes(status)) {
    return true;
  }

  const hasWorker = Boolean(String(shift.workerId || '').trim());
  const hasBooking = Boolean(String(shift.bookingId || '').trim());
  if (hasWorker || hasBooking) return true;

  const displayName = String(shift.displayName || '')
    .trim()
    .toLowerCase();
  if (!displayName || displayName === 'unassigned' || displayName === 'vacant' || displayName === 'unknown') {
    return false;
  }

  if (shift.fromJob || resolveShiftJobId(shift)) {
    return false;
  }

  const roleLabel = String(shift.jobType || shift.roleCode || member?.role || '')
    .trim()
    .toLowerCase();
  if (roleLabel && displayName === roleLabel) {
    return false;
  }
  const memberName = String(member?.name || '')
    .trim()
    .toLowerCase();
  const memberRole = String(member?.role || '')
    .trim()
    .toLowerCase();
  if (memberName && memberRole && memberName === memberRole && !hasWorker && !hasBooking) {
    return false;
  }

  if (member && !member.isVacant && shift.startTime && shift.endTime) return true;

  return false;
}

function getShiftFillColors(filled) {
  if (filled) {
    return {
      bg: CARD.filledBgAlt,
      border: CARD.filledBorderAlt,
      badgeBg: CARD.filledBadgeBgAlt,
      badgeText: CARD.filledBadgeTextAlt,
      label: 'Filled',
    };
  }
  return {
    bg: CARD.unfilledBg,
    border: CARD.unfilledBorder,
    badgeBg: CARD.unfilledBadgeBg,
    badgeText: CARD.unfilledBadgeText,
    label: 'Unfilled',
  };
}

const CARE_HOME_TEAMS = [
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
      {
        id: 8,
        name: 'Eve Johnson',
        role: 'Care Assistant',
        fromAgency: true,
        agencyId: 'ag-001',
        agencyName: 'CarePlus Agency',
      },
      {
        id: 9,
        name: 'Fiona Hart',
        role: 'Care Assistant',
        fromAgency: true,
        agencyId: 'ag-001',
        agencyName: 'CarePlus Agency',
      },
      {
        id: 10,
        name: 'Grace Lee',
        role: 'Care Assistant',
        fromAgency: true,
        agencyId: 'ag-002',
        agencyName: 'Prime Health Services',
        isPast: true,
      },
    ],
  },
  {
    id: 'care-senior',
    color: '#1565c0',
    badge: 'SC',
    badgeColor: '#1565c0',
    label: 'Care - Senior Care Days',
    staff: [
      {
        id: 11,
        name: 'Frank Miller',
        role: 'Senior Care',
        fromAgency: true,
        agencyId: 'ag-003',
        agencyName: 'Jaosh Care Agency',
      },
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

function deriveStaffMaps(teams) {
  const allStaff = teams.flatMap((t) => t.staff.filter((s) => !s.isVacant));
  const staffTeamMap = teams.reduce((acc, team) => {
    team.staff.forEach((member) => {
      acc[member.id] = team;
    });
    return acc;
  }, {});
  return { allStaff, staffTeamMap };
}

let LOCATIONS = [];
let TEAMS = CARE_HOME_TEAMS;
let ALL_STAFF = deriveStaffMaps(CARE_HOME_TEAMS).allStaff;
let STAFF_TEAM_MAP = deriveStaffMaps(CARE_HOME_TEAMS).staffTeamMap;

function applyRotaConfig(config) {
  TEAMS = config?.teams?.length ? config.teams : CARE_HOME_TEAMS;
  LOCATIONS = resolveLocations(config);
  const maps = deriveStaffMaps(TEAMS);
  ALL_STAFF = maps.allStaff;
  STAFF_TEAM_MAP = maps.staffTeamMap;
}

const FORTNIGHT_START = new Date(2025, 4, 25);


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

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function buildInitialShifts() {
  const shifts = {};
  const add = (staffId, dayOffset, data) => {
    if (!ALL_STAFF.some((s) => s.id === staffId)) return;
    const date = format(addDays(FORTNIGHT_START, dayOffset), 'yyyy-MM-dd');
    shifts[`${staffId}-${date}`] = { id: `${staffId}-${date}`, staffId, date, ...data };
  };
  const staffName = (id) => ALL_STAFF.find((s) => s.id === id)?.name || 'Staff';
  const roleFor = (id) => STAFF_TEAM_MAP[id]?.badge || 'CA';

  add(8, 6, { kind: 'shift', roleCode: 'DA', startTime: '08:00', endTime: '20:00', displayName: staffName(8), warning: true, staffCount: 2, hasBreak: true, verified: true });
  add(8, 7, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '20:00', displayName: staffName(8), warning: true, staffCount: 2, hasBreak: true, verified: true });
  add(8, 8, { kind: 'leave', leaveTitle: 'All Day (11h)', leaveSubtitle: 'SSP', leaveType: 'ssp' });
  add(8, 9, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '20:00', displayName: staffName(8), faded: true, staffCount: 2, hasBreak: true });
  add(8, 10, { kind: 'shift', roleCode: 'TP CA', startTime: '08:00', endTime: '20:00', displayName: staffName(8), staffCount: 2, hasBreak: true });
  add(8, 11, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '20:00', displayName: staffName(8), warning: true, hasBreak: true });

  add(9, 6, { kind: 'leave', leaveTitle: 'All Day (7.5h)', leaveSubtitle: 'Unpaid Sick Leave', leaveType: 'sick' });
  add(9, 8, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '20:00', displayName: staffName(9), staffCount: 1, hasBreak: true });
  add(9, 10, { kind: 'shift', roleCode: 'FH CA', startTime: '08:00', endTime: '20:00', displayName: staffName(9), warning: true, hasBreak: true });


  add(11, 6, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '20:00', displayName: staffName(11), warning: true, staffCount: 2, verified: true });
  add(11, 7, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '20:00', displayName: staffName(11), hasBreak: true, staffCount: 2, verified: true });
  add(11, 8, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '20:00', displayName: staffName(11), staffCount: 2, hasBreak: true });
  add(11, 10, { kind: 'unavailable' });
  add(11, 12, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '20:00', displayName: staffName(11), hasBreak: true });

  add(1, 0, { kind: 'shift', roleCode: roleFor(1), startTime: '08:00', endTime: '17:00', displayName: staffName(1), warning: true, hasBreak: true, staffCount: 2, verified: true });
  add(1, 1, { kind: 'shift', roleCode: roleFor(1), startTime: '08:00', endTime: '17:00', displayName: staffName(1), hasBreak: true, staffCount: 2, verified: true });
  add(1, 2, { kind: 'shift', roleCode: roleFor(1), startTime: '08:00', endTime: '17:00', displayName: staffName(1), shield: true });
  add(1, 4, { kind: 'shift', roleCode: roleFor(1), startTime: '08:00', endTime: '17:00', displayName: staffName(1) });
  add(2, 0, { kind: 'shift', roleCode: roleFor(2), startTime: '08:00', endTime: '17:00', displayName: staffName(2), warning: true, hasBreak: true, staffCount: 1, verified: true });
  add(2, 3, { kind: 'shift', roleCode: roleFor(2), startTime: '08:00', endTime: '17:00', displayName: staffName(2), hasBreak: true });
  add(15, 1, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '16:00', displayName: staffName(15), hasBreak: true, staffCount: 2 });
  add(15, 4, { kind: 'shift', roleCode: 'CA', startTime: '08:00', endTime: '16:00', displayName: staffName(15), verified: true });

  TEAMS.forEach((team) => {
    team.staff
      .filter((s) => !s.isVacant && !s.isPast)
      .forEach((member, mi) => {
        const hasAny = Object.values(shifts).some((s) => s.staffId === member.id);
        if (hasAny) return;
        const dayA = (mi * 2) % 10;
        const dayB = (dayA + 3) % 12;
        add(member.id, dayA, {
          kind: 'shift',
          roleCode: team.badge,
          startTime: '08:00',
          endTime: '16:00',
          displayName: member.name,
          hasBreak: true,
          staffCount: 1,
          verified: true,
        });
        add(member.id, dayB, {
          kind: 'shift',
          roleCode: team.badge,
          startTime: '09:00',
          endTime: '17:00',
          displayName: member.name,
          hasBreak: true,
          staffCount: 1,
        });
        if (mi % 3 === 0) {
          add(member.id, (dayA + 1) % 12, {
            kind: 'leave',
            leaveTitle: 'All Day',
            leaveSubtitle: 'Holiday Leave',
            leaveType: 'holiday',
          });
        }
      });
  });

  return shifts;
}

function computeStats(shifts) {
  const entries = Object.values(shifts);
  let totalHours = 0;
  entries.forEach((shift) => {
    if (shift.kind === 'unavailable' || shift.faded) return;
    if (shift.kind === 'leave' || shift.leave) {
      totalHours += 11;
      return;
    }
    if (shift.allDay || shift.dayOff || shift.onCall || shift.sleepover) return;
    if (shift.startTime && shift.endTime) {
      totalHours += shiftHours(shift.startTime, shift.endTime);
    }
  });
  return {
    hours: `${Math.round(totalHours)}h`,
    cost: `£${Math.round(totalHours * 13.65).toLocaleString()}`,
    count: String(entries.filter((s) => s.kind === 'shift' || (s.startTime && !s.leave && !s.dayOff)).length),
  };
}

function computeStaffHours(shifts, staffId, days) {
  return days.reduce((acc, day) => {
    const sh = shifts[`${staffId}-${format(day, 'yyyy-MM-dd')}`];
    if (!sh || sh.faded || sh.kind === 'unavailable') return acc;
    if (sh.kind === 'leave' || sh.leave) return acc + 11;
    if (sh.allDay || sh.dayOff || sh.onCall || sh.sleepover) return acc;
    if (sh.startTime && sh.endTime) return acc + shiftHours(sh.startTime, sh.endTime);
    return acc;
  }, 0);
}

function computeStaffBreakStatus(shifts, staffId, days) {
  const needsBreak = days.some((day) => {
    const sh = shifts[`${staffId}-${format(day, 'yyyy-MM-dd')}`];
    if (!sh || sh.allDay || sh.dayOff || sh.leave || sh.onCall || sh.sleepover) return false;
    return shiftHours(sh.startTime, sh.endTime) > 6;
  });
  return needsBreak ? 'Break Required' : 'No Breaks';
}

function applyFormPreviewHours(shifts, staffId, days, formPreview) {
  let hours = computeStaffHours(shifts, staffId, days);
  if (!formPreview || formPreview.staffId !== staffId || !formPreview.date) return hours;

  const startTime = timeInputToHHMM(formPreview.startTime);
  const endTime = timeInputToHHMM(formPreview.endTime);
  if (!startTime || !endTime) return hours;

  const key = `${formPreview.staffId}-${formPreview.date}`;
  const existing = shifts[key];
  const previewH = shiftHours(startTime, endTime);

  if (existing && !existing.allDay && !existing.dayOff && !existing.leave && !existing.onCall && !existing.sleepover) {
    hours -= shiftHours(existing.startTime, existing.endTime);
  }
  hours += previewH;
  return Number.isFinite(hours) ? hours : computeStaffHours(shifts, staffId, days);
}

function computeDayHours(shifts, days) {
  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return Object.values(shifts).reduce((acc, shift) => {
      if (shift.date !== dateStr || shift.faded || shift.kind === 'unavailable') return acc;
      if (shift.kind === 'leave' || shift.leave) return acc + 11;
      if (shift.allDay || shift.dayOff || shift.onCall || shift.sleepover) return acc;
      if (shift.startTime && shift.endTime) return acc + shiftHours(shift.startTime, shift.endTime);
      return acc;
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

function buildFormInputs(shift, staff) {
  return {
    startInput: shift?.startTime?.slice(0, 5) || '',
    endInput: shift?.endTime?.slice(0, 5) || '',
    staffId: staff?.id || '',
    shiftLocation: shift?.location || '',
  };
}

const MODAL_W = 300;
const SIDEBAR_W = 268;
const FORM_BADGE_W = 44;

function getModalPosition(anchorRect) {
  if (!anchorRect) {
    return { bottom: 24, left: SIDEBAR_W + 12 };
  }

  const top = anchorRect.bottom + 10;
  let left = anchorRect.left + anchorRect.width / 2 - MODAL_W / 2;
  left = Math.max(12, Math.min(left, window.innerWidth - MODAL_W - 12));

  const maxTop = window.innerHeight - 180;
  return { top: Math.min(top, maxTop), left };
}

function timeInputToHHMM(value) {
  if (!value?.trim()) return '';
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
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
    const sh = shifts[`${staffId}-${format(day, 'yyyy-MM-dd')}`];
    if (!sh || sh.allDay || sh.dayOff || sh.leave || sh.onCall || sh.sleepover) return false;
    return shiftHours(sh.startTime, sh.endTime) > 6;
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

  const shift = shifts[`${staffId}-${preferredDate}`];
  return shift?.location?.trim() || '';
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
  onStartInputChange,
  onEndInputChange,
  onStaffIdChange,
  onShiftLocationChange,
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onNotesSave,
  onStaffChange,
}) {
  const [moreAnchor, setMoreAnchor] = useState(null);
  const [addMenuAnchor, setAddMenuAnchor] = useState(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesDraft, setNotesDraft] = useState(shift?.notes || '');

  useEffect(() => {
    setNotesDraft(shift?.notes || '');
  }, [shift?.id, shift?.notes, date, staffId]);

  const handleSave = (keepOpen = false) => {
    if (!staffId || !date) return;

    const startTime = timeInputToHHMM(startInput);
    const endTime = timeInputToHHMM(endInput);

    if (!startTime || !endTime) {
      toast.error('Select start and end times');
      return;
    }

    onSave({
      staffId: Number(staffId),
      date,
      startTime,
      endTime,
      location: shiftLocation?.trim() || '',
      notes: shift?.notes || '',
    });
    if (!keepOpen) onClose();
  };

  const buildCurrentPayload = () => {
    const startTime = timeInputToHHMM(startInput) || shift?.startTime;
    const endTime = timeInputToHHMM(endInput) || shift?.endTime;

    if (!staffId || !date || !startTime || !endTime) {
      toast.error('Select start and end times first');
      return null;
    }

    return {
      staffId: Number(staffId),
      date,
      startTime,
      endTime,
      location: shiftLocation?.trim() || shift?.location || '',
      notes: notesDraft || shift?.notes || '',
    };
  };

  const handleRemove = () => {
    const target = shift || { staffId: Number(staffId), date };
    if (!target.staffId || !target.date) {
      toast.error('No shift selected to remove');
      return;
    }
    onDelete?.(target);
    setMoreAnchor(null);
    onClose();
  };

  const handleDuplicate = () => {
    const payload = buildCurrentPayload();
    if (!payload) return;
    onDuplicate?.(payload);
    setMoreAnchor(null);
  };

  const handleOpenNotes = () => {
    setNotesDraft(shift?.notes || '');
    setMoreAnchor(null);
    setNotesOpen(true);
  };

  const handleSaveNotes = () => {
    const payload = buildCurrentPayload();
    if (!payload) return;
    onNotesSave?.({ ...payload, notes: notesDraft.trim() });
    setNotesOpen(false);
  };

  const badge = team?.badge || '—';
  const badgeColor = team?.badgeColor || '#546e7a';
  const selectedStaffName =
    (team?.staff || ALL_STAFF).find((s) => s.id === Number(staffId))?.name || 'Staff';
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

        <Box sx={{ flex: 1, minWidth: 0, p: 1, position: 'relative', bgcolor: '#fafafa' }}>
          <Stack direction="row" spacing={0.75} alignItems="flex-end" sx={{ mb: 0.75 }}>
            <ShiftTimePickerPill
              value={startInput}
              onChange={onStartInputChange}
              isStart
              label="Start"
              defaultTime="09:00"
              timeInputToHHMM={timeInputToHHMM}
            />
            <ShiftTimePickerPill
              value={endInput}
              onChange={onEndInputChange}
              label="End"
              defaultTime="17:00"
              timeInputToHHMM={timeInputToHHMM}
            />
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography
              sx={{
                flex: 1,
                mr: 0.5,
                fontSize: 13,
                fontWeight: 600,
                color: '#263238',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedStaffName}
            </Typography>
            <IconButton size="small" sx={{ p: 0.25 }} onClick={(e) => setMoreAnchor(e.currentTarget)}>
              <Iconify icon="eva:more-vertical-fill" width={16} sx={{ color: '#757575' }} />
            </IconButton>
          </Stack>

          <Box sx={{ mt: 0.75 }}>
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
        <Button
          fullWidth
          size="small"
          onClick={() => handleSave(false)}
          startIcon={<Iconify icon="eva:plus-fill" width={14} sx={{ color: '#006064' }} />}
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
          Add Shift
        </Button>
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
      </Box>

      <Menu anchorEl={moreAnchor} open={Boolean(moreAnchor)} onClose={() => setMoreAnchor(null)}>
        <MenuItem onClick={handleRemove}>Remove shift</MenuItem>
        <MenuItem onClick={handleDuplicate}>Duplicate shift</MenuItem>
        <MenuItem onClick={handleOpenNotes}>Add notes</MenuItem>
      </Menu>

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

      <Dialog open={notesOpen} onClose={() => setNotesOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>Shift notes</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            placeholder="Add notes for this shift..."
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            sx={{ mt: 0.5 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setNotesOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveNotes}>
            Save notes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}


function AddShiftPopover({ open, position, onClose, formProps }) {
  const modalPos = useMemo(() => getModalPosition(position), [position]);

  if (!open || !formProps) return null;

  return (
    <Portal>
      <Box
        onClick={onClose}
        sx={{ position: 'fixed', inset: 0, zIndex: 1299, bgcolor: 'transparent' }}
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

function TimePill({ label, faded }) {
  return (
    <Box
      component="span"
      sx={{
        bgcolor: '#fff',
        border: `1px solid ${CARD.pillBorder}`,
        borderRadius: '10px',
        px: 0.65,
        py: 0.15,
        fontSize: 10,
        fontWeight: 700,
        color: faded ? '#90a4ae' : CARD.timeText,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        display: 'inline-block',
      }}
    >
      {label}
    </Box>
  );
}

function getJobTypeAbbrev(type = '') {
  const trimmed = String(type).trim();
  if (!trimmed) return 'JOB';
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    return words
      .map((word) => word[0])
      .join('')
      .slice(0, 4)
      .toUpperCase();
  }
  return trimmed.slice(0, 4).toUpperCase();
}

function findTeamForJobType(jobType, teams = TEAMS) {
  return findBestTeamForJobType(jobType, teams);
}

function resolveStaffIdForJobType(jobType, clickedStaffId, teams = TEAMS) {
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

function getJobTypeRoleCode(jobType, staffId) {
  const type = String(jobType || '').trim();
  if (type) return type;
  const team = STAFF_TEAM_MAP[staffId];
  return String(team?.label || team?.badge || '').trim();
}

function buildJobGridShift(draft, staffId, schedule, scheduleIndex, allSchedules) {
  const member = ALL_STAFF.find((s) => s.id === staffId);
  const key = `${staffId}-${schedule.date}`;
  const normalizedSchedule = normalizeSchedule(schedule, draft);
  const normalizedSchedules = allSchedules.map((entry) => normalizeSchedule(entry, draft));

  return {
    id: key,
    staffId,
    date: schedule.date,
    kind: 'shift',
    fromJob: true,
    jobId: String(draft.id || draft._id || '').trim() || undefined,
    receivingBids: normalizedSchedule.receivingBids !== false,
    roleCode: getJobTypeRoleCode(draft.type, staffId),
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    displayName: member?.name || 'Staff',
    jobType: draft.type || '',
    image: draft.image || '',
    gender: draft.gender || 'not_specified',
    description: draft.description || '',
    hasBreak: normalizedSchedule.breakIncluded,
    breakMins: normalizedSchedule.breakMins,
    location: draft.address || '',
    scheduleIndex: scheduleIndex + 1,
    scheduleCount: allSchedules.length,
    jobSchedules: normalizedSchedules,
  };
}

function getShiftRowHeight() {
  return ROW_H;
}

function resolveShiftCard(shift, member, team = null) {
  if (!shift) return null;
  if (shift.kind === 'unavailable') return { type: 'unavailable' };
  if (shift.kind === 'leave') return { type: 'leave', ...shift };
  if (shift.leave) {
    return {
      type: 'leave',
      leaveTitle: shift.leaveTitle || 'All Day',
      leaveSubtitle: shift.leaveSubtitle || 'Leave',
      leaveType: shift.leaveType || 'ssp',
    };
  }
  if (shift.dayOff) return { type: 'tag', bg: '#fff3e0', border: '#ffcc80', color: '#ef6c00', label: 'Day Off' };
  if (shift.onCall) return { type: 'tag', bg: '#e3f2fd', border: '#90caf9', color: '#1565c0', label: 'On Call' };
  if (shift.sleepover) return { type: 'tag', bg: '#ede7f6', border: '#b39ddb', color: '#5e35b1', label: 'Sleepover' };
  if (shift.allDay) return { type: 'tag', bg: '#EEF0FC', border: '#D5DAF7', color: '#5865DC', label: '+ All Day' };
  if (shift.fromJob) {
    const rowLabel = team?.label || STAFF_TEAM_MAP[shift.staffId]?.label || '';
    const filled = isRotaShiftFilled(shift, member);
    return {
      type: 'jobShift',
      filled,
      fillColors: getShiftFillColors(filled),
      roleCode: getShiftTypeLabel({
        teamLabel: rowLabel,
        jobType: shift.jobType,
        roleCode: shift.roleCode,
        staffRole: member?.role,
      }),
      startTime: shift.startTime,
      endTime: shift.endTime,
      displayName: shift.displayName || member?.name || 'Staff',
      jobType: rowLabel || shift.jobType || '',
      image: shift.image || '',
      gender: shift.gender || '',
      description: shift.description || '',
      hasBreak: shift.hasBreak,
      breakMins: shift.breakMins,
      address: shift.location || '',
      scheduleIndex: shift.scheduleIndex,
      scheduleCount: shift.scheduleCount,
      jobSchedules: shift.jobSchedules || [],
    };
  }
  const rowLabel = team?.label || STAFF_TEAM_MAP[shift.staffId]?.label || '';
  const filled = isRotaShiftFilled(shift, member);
  return {
    type: 'shift',
    filled,
    fillColors: getShiftFillColors(filled),
    roleCode: getShiftTypeLabel({
      teamLabel: rowLabel,
      jobType: shift.jobType,
      roleCode: shift.roleCode,
      staffRole: member?.role,
    }),
    jobType: rowLabel || shift.jobType || '',
    startTime: shift.startTime,
    endTime: shift.endTime,
    displayName: shift.displayName || member?.name || 'Staff',
    faded: shift.faded,
    hasBreak: shift.hasBreak,
    staffCount: shift.staffCount,
    warning: shift.warning,
    verified: shift.verified,
    shield: shift.shield,
  };
}

function ShiftDetailField({ label, value, children }) {
  const content = children ?? value;
  if (content == null || content === '' || content === '—') return null;

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
        {content}
      </Typography>
    </Box>
  );
}

function ShiftDetailsDialog({
  open,
  onClose,
  card,
  shift,
  member,
  onViewBids,
  onIncreaseRate,
  onRateWorker,
}) {
  if (!open || !shift) return null;

  const team = STAFF_TEAM_MAP[shift.staffId || member?.id];
  const isJobShift = card?.type === 'jobShift' || shift.fromJob;
  const genderLabel = shift.gender ? getGenderLabel(shift.gender) : 'Not specified';
  const breakLabel = shift.hasBreak
    ? `Break: ${shift.breakMins ?? 30} min`
    : shift.hasBreak === false
      ? 'No break'
      : card?.hasBreak
        ? 'Break included'
        : 'No break';
  const dateLabel = shift.date
    ? format(parse(shift.date, 'yyyy-MM-dd', new Date()), 'EEE d MMM yyyy')
    : '';
  const timeLabel = `${formatShiftTime(shift.startTime)} - ${formatShiftTime(shift.endTime)}`;
  const fillLabel =
    card?.fillColors?.label ||
    (typeof card?.filled === 'boolean'
      ? card.filled
        ? 'Filled'
        : 'Unfilled'
      : isRotaShiftFilled(shift, member)
        ? 'Filled'
        : 'Unfilled');
  const canViewBids = shiftAllowsViewBids(card, shift, member);
  const canIncreaseRate = shiftAllowsIncreaseRate(card, shift, member) && typeof onIncreaseRate === 'function';
  const canRateWorker = shiftAllowsRateWorker(card, shift, member) && typeof onRateWorker === 'function';
  const findShiftReview = useContext(ShiftReviewLookupContext);
  const workerRated = canRateWorker && Boolean(findShiftReview(shift, member));
  const onCancelBooking = useContext(ShiftCancelBookingContext);
  const canCancelBooking = Boolean(onCancelBooking) && shiftAllowsCancelBooking(shift);

  return (
    <Dialog open={open} onClose={() => onClose?.()} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 1, pr: 6, position: 'relative' }}>
        Shift details
        <IconButton
          aria-label="Close"
          onClick={() => onClose?.()}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={1.1}>
          <ShiftDetailField label="Coverage" value={fillLabel} />
          {isJobShift && (
            <JobMediaThumb
              image={shift.image || card?.image}
              alt={shift.jobType || card?.jobType || 'Job'}
              width="100%"
              height={150}
            />
          )}
          <ShiftDetailField label="Staff" value={member?.name || card?.displayName || '—'} />
          <ShiftDetailField label="Role" value={member?.role || team?.label || '—'} />
          {isJobShift && <ShiftDetailField label="Job type" value={shift.jobType || card?.jobType} />}
          <ShiftDetailField label="Date" value={dateLabel} />
          <ShiftDetailField label="Time" value={timeLabel} />
          <Box>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Typography
              variant="body2"
              sx={{
                lineHeight: 1.45,
                fontWeight: 700,
                color: shift.cancelled ? 'error.main' : canRateWorker ? 'warning.main' : 'success.main',
              }}
            >
              {shift.cancelled ? 'Cancelled' : canRateWorker ? 'Completed' : shift.status || 'Active'}
            </Typography>
          </Box>
          {isJobShift && <ShiftDetailField label="Address" value={shift.location || card?.address} />}
          {isJobShift && <ShiftDetailField label="Gender" value={genderLabel} />}
          <ShiftDetailField label="Break" value={breakLabel} />
          {isJobShift && shift.description && (
            <ShiftDetailField label="Description" value={shift.description} />
          )}
          {!isJobShift && shift.location && <ShiftDetailField label="Location" value={shift.location} />}
          {isJobShift && (card?.jobSchedules?.length > 1 || shift.scheduleCount > 1) && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                All shifts ({shift.scheduleCount || card?.jobSchedules?.length})
              </Typography>
              <Stack spacing={0.5}>
                {(card?.jobSchedules?.length ? card.jobSchedules : []).map((entry, index) => (
                  <Typography key={entry.id || `${entry.date}-${index}`} variant="body2">
                    {formatScheduleLabel(entry)}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        {canRateWorker ? (
          <Button
            variant="contained"
            color="warning"
            onClick={() => {
              onRateWorker?.(shift, member);
              onClose?.();
            }}
          >
            {workerRated ? 'Update rating' : 'Rate worker'}
          </Button>
        ) : null}
        {canIncreaseRate ? (
          <Button
            variant="outlined"
            color="warning"
            onClick={() => {
              onIncreaseRate?.(shift);
              onClose?.();
            }}
          >
            Increase rate
          </Button>
        ) : null}
        {canViewBids ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              onViewBids?.(shift);
              onClose?.();
            }}
          >
            View bids
          </Button>
        ) : null}
        {canCancelBooking ? (
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              onCancelBooking(shift, member);
              onClose?.();
            }}
          >
            Cancel booking
          </Button>
        ) : null}
        <Button onClick={() => onClose?.()}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function RotaShiftCard({
  card,
  shift,
  member,
  onStaffPick,
  onOpenDetails,
  onViewBids,
  onIncreaseRate,
  onRateWorker,
  viewOnly = VIEW_ONLY,
}) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const ignoreOpenRef = useRef(false);
  const canViewBids = shiftAllowsViewBids(card, shift, member);
  const canIncreaseRate = shiftAllowsIncreaseRate(card, shift, member) && typeof onIncreaseRate === 'function';
  const canRateWorker = shiftAllowsRateWorker(card, shift, member) && typeof onRateWorker === 'function';
  const findShiftReview = useContext(ShiftReviewLookupContext);
  const workerRated = canRateWorker && Boolean(findShiftReview(shift, member));
  const onCancelBooking = useContext(ShiftCancelBookingContext);
  const canCancelBooking = Boolean(onCancelBooking) && shiftAllowsCancelBooking(shift);

  const cardSx = { width: '100%', height: '100%', borderRadius: '6px', overflow: 'hidden', position: 'relative' };

  const openDetails = (event) => {
    event?.stopPropagation?.();
    if (ignoreOpenRef.current || detailsOpen) return;
    onOpenDetails?.();
    setDetailsOpen(true);
  };

  const closeDetails = () => {
    ignoreOpenRef.current = true;
    setDetailsOpen(false);
    window.setTimeout(() => {
      ignoreOpenRef.current = false;
    }, 400);
  };

  const handleCardClick = (event) => {
    event?.stopPropagation?.();
    // Client: completed shift → rate worker
    if (canRateWorker) {
      onRateWorker?.(shift, member);
      return;
    }
    // Client: unfilled shift click → view bids
    if (canViewBids) {
      onViewBids?.(shift);
      return;
    }
    openDetails(event);
  };

  const handleMenuAction = (actionId) => {
    setMenuAnchor(null);
    if (actionId === 'rateWorker' && shift) {
      onRateWorker?.(shift, member);
      return;
    }
    if (actionId === 'rate' && shift) {
      onIncreaseRate?.(shift);
      return;
    }
    if (actionId === 'bids' && shift) {
      onViewBids?.(shift);
      return;
    }
    if (actionId === 'cancelBooking' && shift) {
      onCancelBooking?.(shift, member);
      return;
    }
    if (actionId === 'details' && shift) {
      openDetails();
    }
  };

  const menuItems = SHIFT_CARD_MENU.filter((item) => {
    if (item.id === 'bids') return canViewBids;
    if (item.id === 'rate') return canIncreaseRate;
    if (item.id === 'rateWorker') return canRateWorker;
    if (item.id === 'cancelBooking') return canCancelBooking;
    return true;
  }).map((item) => (item.id === 'rateWorker' && workerRated ? { ...item, label: 'Update rating' } : item));

  const detailsDialog = (
    <ShiftDetailsDialog
      open={detailsOpen}
      onClose={closeDetails}
      card={card}
      shift={shift}
      member={member}
      onViewBids={onViewBids}
      onIncreaseRate={onIncreaseRate}
      onRateWorker={onRateWorker}
    />
  );

  if (card.type === 'unavailable') {
    return (
      <Box sx={{ ...cardSx, bgcolor: CARD.unavailableBg, border: `1px solid ${CARD.gridBorder}`, display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0.4 }}>
        <Iconify icon="solar:forbidden-circle-bold" width={13} sx={{ color: '#bdbdbd' }} />
        <Typography sx={{ fontSize: 9.5, fontWeight: 600, color: '#9e9e9e' }}>Unavailable</Typography>
      </Box>
    );
  }

  if (card.type === 'leave') {
    const icons = { ssp: 'solar:airplane-bold', sick: 'solar:sad-circle-bold', holiday: 'solar:airplane-bold' };
    return (
      <Box sx={{ ...cardSx, bgcolor: CARD.leaveBg, border: '1px solid #adc896', display: 'flex', alignItems: 'center', px: 0.6, gap: 0.45, minWidth: 0 }}>
        <Iconify icon={icons[card.leaveType] || icons.ssp} width={14} sx={{ color: '#424242', flexShrink: 0 }} />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Tooltip title={card.leaveTitle} placement="top" arrow>
            <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: CARD.leaveText, lineHeight: 1.15 }} noWrap>
              {card.leaveTitle}
            </Typography>
          </Tooltip>
          <Tooltip title={card.leaveSubtitle} placement="top" arrow>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: CARD.leaveText, lineHeight: 1.15 }} noWrap>
              {card.leaveSubtitle}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
    );
  }

  if (card.type === 'tag') {
    return (
      <Box sx={{ ...cardSx, bgcolor: card.bg, border: `1px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 0.5, minWidth: 0 }}>
        <Tooltip title={card.label} placement="top" arrow>
          <Typography sx={{ fontSize: 10, fontWeight: 600, color: card.color }} noWrap>
            {card.label}
          </Typography>
        </Tooltip>
      </Box>
    );
  }

  if (card.type === 'jobShift') {
    const genderLabel = card.gender ? getGenderLabel(card.gender) : 'Not specified';
    const breakLabel = card.hasBreak ? `Break ${card.breakMins || 0}m` : 'No break';
    const scheduleBadge =
      card.scheduleCount > 1 ? `${card.scheduleIndex}/${card.scheduleCount}` : null;
    const stripW = getRoleStripWidth(card.roleCode);
    const fill = card.fillColors || getShiftFillColors(card.filled);

    const tooltipContent = (
      <Stack spacing={0.35} sx={{ maxWidth: 280 }}>
        <Typography variant="caption" fontWeight={700}>
          {card.jobType}
        </Typography>
        <Typography variant="caption" display="block" fontWeight={700}>
          {fill.label}
        </Typography>
        {card.address && (
          <Typography variant="caption" display="block">
            {card.address}
          </Typography>
        )}
        <Typography variant="caption" display="block">
          Gender: {genderLabel} · {breakLabel}
        </Typography>
        {card.description && (
          <Typography variant="caption" display="block">
            {card.description}
          </Typography>
        )}
        {card.scheduleCount > 1 && (
          <Typography variant="caption" display="block" color="text.secondary">
            {card.scheduleCount} shifts in this job
          </Typography>
        )}
      </Stack>
    );

    return (
      <>
        <Tooltip title={tooltipContent} placement="top" arrow>
          <Box
            sx={{
              ...cardSx,
              bgcolor: fill.bg,
              display: 'flex',
              border: `1px solid ${fill.border}`,
              cursor: 'pointer',
            }}
            onClick={handleCardClick}
          >
            <Box
              sx={{
                width: stripW,
                minWidth: stripW,
                maxWidth: stripW,
                bgcolor: fill.badgeBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 0.2,
                flexShrink: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: stripW > 28 ? 7 : 8.5,
                  fontWeight: 800,
                  color: fill.badgeText,
                  textAlign: 'center',
                  lineHeight: 1.05,
                  wordBreak: 'break-word',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {card.roleCode}
              </Typography>
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 0.2,
                py: 0.35,
                pl: 0.45,
                pr: 0.35,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={0.35} sx={{ minWidth: 0 }}>
                <TimePill label={formatShiftTime(card.startTime)} />
                <TimePill label={formatShiftTime(card.endTime)} />
                {scheduleBadge && (
                  <Typography sx={{ fontSize: 8, fontWeight: 700, color: 'primary.main', flexShrink: 0 }}>
                    {scheduleBadge}
                  </Typography>
                )}
                <Box sx={{ flex: 1 }} />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuAnchor(e.currentTarget);
                  }}
                  sx={{ p: 0, width: 14, height: 14, color: '#b0bec5', flexShrink: 0 }}
                >
                  <Iconify icon="eva:more-vertical-fill" width={12} />
                </IconButton>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.35} sx={{ minWidth: 0, flex: 1 }}>
                <JobMediaThumb
                  image={card.image}
                  alt={card.jobType}
                  width={18}
                  height={18}
                  borderRadius={0.5}
                />
                {card.hasBreak && (
                  <Iconify icon="solar:cup-hot-bold" width={12} sx={{ color: '#8d6e63', flexShrink: 0 }} />
                )}
                <Tooltip title={card.displayName} placement="top" arrow>
                  <Typography
                    noWrap
                    sx={{ fontSize: 11.5, fontWeight: 700, color: CARD.nameText, lineHeight: 1.15, flex: 1, minWidth: 0 }}
                  >
                    {card.displayName}
                  </Typography>
                </Tooltip>
              </Stack>
            </Box>
          </Box>
        </Tooltip>

        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
          {menuItems.map((item) => (
            <MenuItem key={item.id} onClick={() => handleMenuAction(item.id)}>
              {item.label}
            </MenuItem>
          ))}
        </Menu>

        {detailsDialog}
      </>
    );
  }

  const faded = card.faded;
  const fill = card.fillColors || getShiftFillColors(card.filled);
  const bg = faded ? CARD.shiftBgFaded : fill.bg;
  const stripW = getRoleStripWidth(card.roleCode);
  const staffCountLabel = formatStaffCount(card.staffCount);
  const showMeta = Boolean(card.hasBreak || staffCountLabel);

  return (
    <>
      <Box
        sx={{
          ...cardSx,
          bgcolor: bg,
          display: 'flex',
          opacity: faded ? 0.55 : 1,
          border: `1px solid ${faded ? CARD.pillBorder : fill.border}`,
          cursor: 'pointer',
        }}
        onClick={handleCardClick}
      >
        <Tooltip
          title={`${card.jobType || card.roleCode || 'Shift'} · ${fill.label}`}
          placement="top"
          arrow
        >
          <Box
            sx={{
              width: stripW,
              minWidth: stripW,
              maxWidth: stripW,
              bgcolor: faded ? '#c5dff0' : fill.badgeBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 0.2,
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: stripW > 28 ? 7 : 8.5,
                fontWeight: 800,
                color: faded ? '#7eb0d4' : fill.badgeText,
                textAlign: 'center',
                lineHeight: 1.05,
                wordBreak: 'break-word',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {card.roleCode}
            </Typography>
          </Box>
        </Tooltip>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'grid',
            gridTemplateColumns: `minmax(0, 1fr) ${CARD_RIGHT_RAIL_W}px`,
            gridTemplateRows: '22px minmax(20px, 1fr)',
            columnGap: 0.25,
            rowGap: 0.25,
            alignContent: 'stretch',
            pt: 0.35,
            pb: 0.2,
            pl: 0.45,
            pr: 0.35,
            height: '100%',
          }}
        >
          <Box
            sx={{
              gridColumn: 1,
              gridRow: 1,
              display: 'flex',
              alignItems: 'flex-start',
              minWidth: 0,
              overflow: 'hidden',
              gap: 0.35,
              pt: 0.1,
            }}
          >
            <TimePill label={formatShiftTime(card.startTime)} faded={faded} />
            <TimePill label={formatShiftTime(card.endTime)} faded={faded} />
          </Box>

          <Box
            sx={{
              gridColumn: 1,
              gridRow: 2,
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
              width: '100%',
              gap: 0.4,
              overflow: 'hidden',
            }}
          >
            {showMeta && (
              <Stack direction="row" alignItems="center" spacing={0.35} sx={{ flexShrink: 0, mr: 0.15 }}>
                {card.hasBreak && (
                  <Iconify icon="solar:cup-hot-bold" width={12} sx={{ color: '#8d6e63', display: 'block' }} />
                )}
                {staffCountLabel && (
                  <Typography sx={{ fontSize: 9.5, fontWeight: 700, color: '#546e7a', lineHeight: 1, minWidth: '0.6em', textAlign: 'center' }}>
                    {staffCountLabel}
                  </Typography>
                )}
              </Stack>
            )}
            <Tooltip title={card.displayName} placement="top" arrow>
              <Typography
                noWrap
                sx={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: faded ? '#90a4ae' : CARD.nameText,
                  lineHeight: 1.15,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {card.displayName}
              </Typography>
            </Tooltip>
          </Box>

          <Stack
            alignItems="center"
            spacing={0.35}
            sx={{ gridColumn: 2, gridRow: '1 / 3', justifyContent: 'flex-start', pt: 0.55, flexShrink: 0 }}
          >
            {card.verified && !faded && (
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#43a047', flexShrink: 0 }} />
            )}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setMenuAnchor(e.currentTarget);
              }}
              sx={{ p: 0, m: 0, width: 14, height: 14, color: '#b0bec5', flexShrink: 0 }}
            >
              <Iconify icon="eva:more-vertical-fill" width={12} />
            </IconButton>
          </Stack>
        </Box>

        {card.warning && !faded && (
          <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 0, height: 0, borderLeft: '11px solid transparent', borderBottom: '11px solid #ff9800' }} />
        )}
        {card.shield && (
          <Iconify icon="solar:shield-warning-bold" width={10} sx={{ position: 'absolute', bottom: 2, right: 2, color: '#e53935', zIndex: 1 }} />
        )}
      </Box>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {menuItems.map((item) => (
          <MenuItem key={item.id} onClick={() => handleMenuAction(item.id)}>
            {item.label}
          </MenuItem>
        ))}
        {!viewOnly && shift && (
          <MenuItem
            onClick={() => {
              setMenuAnchor(null);
              toast.info('Remove shift');
            }}
            sx={{ color: 'error.main' }}
          >
            Remove shift
          </MenuItem>
        )}
      </Menu>

      {detailsDialog}
    </>
  );
}

function getGridContentWidth(dayCount, staffColWidth, dayColWidth) {
  return staffColWidth + dayCount * dayColWidth;
}

const GRID_LINE = '#e0e0e0';

/** Extends row grid lines to the right edge when the viewport is wider than the data columns */
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

function getHoursBarColor(hours) {
  if (hours > STAFF_CONTRACT_H) return '#ff9800';
  if (hours >= STAFF_CONTRACT_H * 0.9) return '#fbc02d';
  return '#5865DC';
}


function ShiftCell({
  shift,
  onClick,
  isActive,
  isRowActive,
  cellKey,
  viewOnly = VIEW_ONLY,
  member,
  team,
  onStaffPick,
  onOpenDetails,
  onViewBids,
  onIncreaseRate,
  onRateWorker,
  dayColWidth = DAY_COL_W,
}) {
  const canSelectEmpty = !shift && !member?.isVacant;
  const canClickFilled = Boolean(shift);

  const cellHeight = getShiftRowHeight();

  const cellSx = {
    width: dayColWidth,
    minWidth: dayColWidth,
    minHeight: cellHeight,
    alignSelf: 'stretch',
    borderRight: `1px solid ${CARD.gridBorder}`,
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    cursor: canSelectEmpty || (!viewOnly && canClickFilled) ? 'pointer' : 'default',
    p: '1px',
    flexShrink: 0,
    overflow: 'hidden',
    bgcolor: isActive ? '#e3f2fd' : isRowActive ? '#f9fdf7' : 'transparent',
    boxShadow: isActive ? 'inset 0 0 0 2px #42a5f5' : 'none',
    '&:hover .empty-plus': {
      color: 'text.secondary',
    },
  };

  const card = resolveShiftCard(shift, member, team);

  const handleClick = (event) => {
    if (canSelectEmpty) {
      onClick(event.currentTarget, null);
      return;
    }
    if (canClickFilled) {
      onClick(event.currentTarget, shift);
    }
  };

  return (
    <Box
      sx={cellSx}
      data-shift-cell={cellKey}
      onClick={canSelectEmpty || canClickFilled ? handleClick : undefined}
    >
      <Box
        sx={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {card ? (
          <RotaShiftCard
            card={card}
            shift={shift}
            member={member}
            onStaffPick={onStaffPick}
            onOpenDetails={onOpenDetails}
            onViewBids={onViewBids}
            onIncreaseRate={onIncreaseRate}
            onRateWorker={onRateWorker}
            viewOnly={viewOnly}
          />
        ) : canSelectEmpty ? (
          <Tooltip title="Click to book shift or mark person off" arrow>
            <Box
              className="empty-plus"
              aria-label="Add on this day"
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.disabled',
              }}
            >
              <Iconify icon="eva:plus-fill" width={14} />
            </Box>
          </Tooltip>
        ) : null}
      </Box>
    </Box>
  );
}


function StaffRow({
  member,
  team,
  days,
  shifts,
  selectedStaffId,
  activeCell,
  formPreview,
  onCellClick,
  onStaffSelect,
  onStaffPick,
  onOpenDetails,
  onViewBids,
  onIncreaseRate,
  onRateWorker,
  staffColWidth = STAFF_COL_W,
  dayColWidth = DAY_COL_W,
}) {
  const isSelected = selectedStaffId === member.id;
  const rowMinHeight = days.reduce((max, day) => Math.max(max, getShiftRowHeight()), ROW_H);
  const totalHours =
    formPreview && formPreview.staffId === member.id
      ? applyFormPreviewHours(shifts, member.id, days, formPreview)
      : days.reduce((acc, day) => {
        const sh = shifts[`${member.id}-${format(day, 'yyyy-MM-dd')}`];
        if (!sh || sh.faded || sh.kind === 'unavailable') return acc;
        if (sh.kind === 'leave' || sh.leave) return acc;
        if (sh.allDay || sh.dayOff || sh.onCall || sh.sleepover) return acc;
        if (sh.startTime && sh.endTime) return acc + shiftHours(sh.startTime, sh.endTime);
        return acc;
      }, 0);
  const barPct = Math.min(100, (totalHours / STAFF_CONTRACT_H) * 100);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'stretch',
        minHeight: rowMinHeight,
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
                {formatHoursLabel(totalHours)}
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
        const key = `${member.id}-${dateStr}`;
        return (
          <ShiftCell
            key={dateStr}
            cellKey={key}
            shift={shifts[key] || null}
            member={member}
            team={team}
            isActive={activeCell?.staffId === member.id && activeCell?.date === dateStr}
            isRowActive={isSelected}
            onClick={(el, s) => onCellClick(el, s, member, dateStr)}
            onStaffPick={onStaffPick}
            onOpenDetails={onOpenDetails}
            onViewBids={onViewBids}
            onIncreaseRate={onIncreaseRate}
            onRateWorker={onRateWorker}
            dayColWidth={dayColWidth}
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
  onStaffSelect,
  onStaffPick,
  onOpenDetails,
  onViewBids,
  onIncreaseRate,
  onRateWorker,
  collapsed,
  onToggle,
  staffColWidth = STAFF_COL_W,
  dayColWidth = DAY_COL_W,
  dragHandleProps = null,
}) {
  const computedShiftCount = team.staff.reduce(
    (acc, s) => acc + days.filter((d) => shifts[`${s.id}-${format(d, 'yyyy-MM-dd')}`]).length,
    0
  );
  const computedHours = team.staff.reduce(
    (acc, s) =>
      acc +
      days.reduce((a2, d) => {
        const sh = shifts[`${s.id}-${format(d, 'yyyy-MM-dd')}`];
        if (!sh || sh.faded || sh.kind === 'unavailable' || sh.kind === 'leave' || sh.leave) return a2;
        if (sh.allDay || sh.dayOff || sh.onCall || sh.sleepover) return a2;
        if (sh.startTime && sh.endTime) return a2 + shiftHours(sh.startTime, sh.endTime);
        return a2;
      }, 0),
    0
  );

  const apiTotals = team.totals && typeof team.totals === 'object' ? team.totals : null;
  const shiftCount =
    apiTotals && Number.isFinite(Number(apiTotals.totalShifts))
      ? Number(apiTotals.totalShifts)
      : computedShiftCount;
  const hours =
    apiTotals && Number.isFinite(Number(apiTotals.totalHours))
      ? Number(apiTotals.totalHours)
      : computedHours;
  const peopleCount =
    apiTotals && Number.isFinite(Number(apiTotals.totalPeople))
      ? Number(apiTotals.totalPeople)
      : team.staff.filter((member) => !member.isVacant).length;

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
            <Typography sx={{ fontSize: 10, color: '#757575' }}>{peopleCount}</Typography>
            <Iconify icon="solar:document-bold" width={13} sx={{ color: '#757575' }} />
            <Typography sx={{ fontSize: 10, color: '#757575' }}>{shiftCount}</Typography>
            <Iconify icon="solar:clock-circle-bold" width={13} sx={{ color: '#757575' }} />
            <Typography sx={{ fontSize: 10, color: '#757575' }}>{Math.round(hours)}h</Typography>
            <IconButton size="small" onClick={onToggle} sx={{ p: 0.2 }}>
              <Iconify icon={collapsed ? 'eva:chevron-right-fill' : 'eva:chevron-down-fill'} width={14} />
            </IconButton>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ width: '100%', minWidth: 0 }}>
            {dragHandleProps ? (
              <Box
                component="span"
                {...dragHandleProps}
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: 'grab',
                  color: 'text.disabled',
                  flexShrink: 0,
                  touchAction: 'none',
                  '&:active': { cursor: 'grabbing' },
                }}
                aria-label="Drag to reorder team"
              >
                <Iconify icon="nimbus:drag-dots" width={14} />
              </Box>
            ) : null}
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
            team={team}
            days={days}
            shifts={shifts}
            selectedStaffId={selectedStaffId}
            activeCell={activeCell}
            formPreview={formPreview}
            onStaffSelect={onStaffSelect}
            onStaffPick={onStaffPick}
            onOpenDetails={onOpenDetails}
            onViewBids={onViewBids}
            onIncreaseRate={onIncreaseRate}
            onRateWorker={onRateWorker}
            onCellClick={(el, shift, memberRow, dateStr) =>
              onCellClick(el, shift, memberRow, dateStr, team)
            }
            staffColWidth={staffColWidth}
            dayColWidth={dayColWidth}
          />
        ))}
    </Box>
  );
}

function SortableTeamGroup({ team, ...rest }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(team.id),
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.72 : 1,
        zIndex: isDragging ? 2 : 'auto',
        position: 'relative',
      }}
    >
      <TeamGroup
        team={team}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...rest}
      />
    </Box>
  );
}


function LeftSidebar({
  location,
  locations = [],
  onLocationChange,
  stats,
  showStaffDetail,
  selectedStaff,
  onBack,
  onAddJob,
  isMobile,
  hideLocationPicker = false,
  postedJobs = [],
  postedJobsLoading = false,
}) {
  const activeLocation = locations.find((loc) => loc.id === location) || locations[0];

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
        height: '100%',
        flexShrink: 0,
        ...hideScrollY,
      }}
    >
      <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
        {hideLocationPicker ? (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0, py: 0.5 }}>
            <Iconify
              icon="solar:map-point-bold"
              width={16}
              sx={{ color: 'primary.main', flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap fontWeight={700}>
                {getLocationDisplayTitle(activeLocation, locations) ||
                  activeLocation?.address ||
                  'Set address in profile'}
              </Typography>
              {activeLocation?.address ? (
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {activeLocation.address}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        ) : (
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
        )}
      </Box>

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
              borderBottom: '1px solid #e0e0e0',
              flexShrink: 0,
              textTransform: 'none',
            }}
          >
            Back
          </Button>

          <Box sx={{ p: 1.5, borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
            <Stack direction="row" spacing={1.25} alignItems="flex-start">
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#78909c', fontSize: 13 }}>
                {getInitials(selectedStaff.name)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#1a237e' }}>
                  {selectedStaff.name}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {selectedStaff.roleLabel || selectedStaff.role || 'Staff'}
                </Typography>
                {selectedStaff.fromAgency && selectedStaff.agencyName && (
                  <Typography sx={{ fontSize: 10.5, color: 'primary.main', fontWeight: 600, mt: 0.25 }}>
                    Via {selectedStaff.agencyName}
                  </Typography>
                )}
                {selectedStaff.timeRangeLabel && (
                  <Typography sx={{ fontSize: 11, color: 'text.secondary', fontWeight: 600 }}>
                    {selectedStaff.timeRangeLabel}
                  </Typography>
                )}
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
                    {selectedStaff.shiftDateLabel}
                    {selectedStaff.scheduleInfo ? ` · ${selectedStaff.scheduleInfo}` : ''}
                  </Typography>
                )}
                {selectedStaff.genderLabel && (
                  <Typography sx={{ fontSize: 10.5, color: 'text.disabled', mt: 0.35 }}>
                    Gender: {selectedStaff.genderLabel}
                  </Typography>
                )}
                {selectedStaff.description && (
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      color: 'text.disabled',
                      mt: 0.35,
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {selectedStaff.description}
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
                {selectedStaff.jobShiftsInPeriod?.length > 1 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: 'text.secondary', mb: 0.35 }}>
                      All added shifts
                    </Typography>
                    <Stack spacing={0.35}>
                      {selectedStaff.jobShiftsInPeriod.map((entry) => (
                        <Typography key={entry.date} sx={{ fontSize: 10, color: 'text.disabled', lineHeight: 1.35 }}>
                          {entry.dateLabel} · {formatShiftTime(entry.shift.startTime)} -{' '}
                          {formatShiftTime(entry.shift.endTime)}
                          {entry.shift.jobType ? ` · ${entry.shift.jobType}` : ''}
                        </Typography>
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            </Stack>
          </Box>
        </>
      )}

      <Stack spacing={0.5} sx={{ p: 1.5, flexShrink: 0 }}>
        <Button
          fullWidth
          size="small"
          startIcon={<Iconify icon="eva:plus-fill" width={14} />}
          onClick={onAddJob}
          // No `onAddJob` → read-only roster (admin viewing the account).
          style={onAddJob ? undefined : { display: 'none' }}
          sx={{
            justifyContent: 'flex-start',
            fontSize: 11.5,
            fontWeight: 700,
            color: 'primary.main',
            border: '1px solid',
            borderColor: '#81c784',
            bgcolor: '#f1f8e9',
            borderRadius: 1,
            py: 0.65,
            textTransform: 'none',
            flexShrink: 0,
            boxShadow: 'inset 0 0 0 1px rgba(129, 199, 132, 0.35)',
            '&:hover': {
              bgcolor: '#e8f5e9',
            },
          }}
        >
          Book shift
        </Button>
      </Stack>

      <PostedJobsSidebarPanel
        jobs={postedJobs}
        loading={postedJobsLoading}
        title="Posted jobs"
      />
    </Box>
  );
}

function loadTeamOrder(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function saveTeamOrder(storageKey, order) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(order.map(String)));
  } catch {
  }
}

function sortTeamsByOrder(teamsList = [], orderIds = []) {
  if (!teamsList.length) return [];
  if (!orderIds.length) return teamsList;

  const byId = new Map(teamsList.map((team) => [String(team.id), team]));
  const ordered = [];

  orderIds.forEach((id) => {
    const team = byId.get(String(id));
    if (team) {
      ordered.push(team);
      byId.delete(String(id));
    }
  });

  byId.forEach((team) => ordered.push(team));
  return ordered;
}


export function ShiftsView({
  rotaConfig,
  enableBookingCalendar = false,
  apiRole = 'careHome',
} = {}) {
  const useCalendarApi = Boolean(enableBookingCalendar);
  applyRotaConfig(rotaConfig);

  if (useCalendarApi) {
    TEAMS = [];
    ALL_STAFF = [];
    STAFF_TEAM_MAP = {};
  }

  const configKey = rotaConfig?.key || apiRole || 'care-home';
  const defaultLocationId = rotaConfig?.defaultLocationId || ALL_LOCATIONS_ID;

  return (
    <JobTypesProvider
      key={`job-types-${configKey}`}
      seedLabels={rotaConfig?.jobTypeLabels}
      storageKey={rotaConfig?.jobTypesStorageKey}
    >
      <ShiftsViewContent
        key={configKey}
        rotaConfig={rotaConfig}
        defaultLocationId={defaultLocationId}
        defaultStaff={null}
        enableBookingCalendar={enableBookingCalendar}
        apiRole={apiRole}
      />
    </JobTypesProvider>
  );
}

function ShiftsViewContent({
  rotaConfig = null,
  defaultLocationId = ALL_LOCATIONS_ID,
  defaultStaff = null,
  enableBookingCalendar = false,
  apiRole = 'careHome',
}) {
  const viewOnly = useViewOnly();
  applyRotaConfig(rotaConfig);

  const useCalendarApi = Boolean(enableBookingCalendar);
  const isCareHomeApi = apiRole === 'careHome';
  const isHospitalApi = apiRole === 'hospital';
  const isUserApi = apiRole === 'user';
  const isLocalAuthorityApi = apiRole === 'localAuthority';
  const { user } = useSelector((state) => state.user);
  const { enabled: siteSwitcherEnabled, activeBranchId, setActiveBranchId } = useActiveBranch();
  const [calendarTeams, setCalendarTeams] = useState(null);
  const [calendarMeta, setCalendarMeta] = useState(null);
  const [calendarDayWeather, setCalendarDayWeather] = useState({});
  const [calendarSynced, setCalendarSynced] = useState(false);
  const rosterAccountKey = resolveRosterAccountKey(apiRole);

  const dashboardStaffQuery = useGetDashboardStaffQuery(
    { accountKey: rosterAccountKey, page: 0, limit: 200, status: 'active' },
    {
      skip: !useCalendarApi,
      refetchOnMountOrArgChange: 60,
      refetchOnFocus: false,
    }
  );

  const staffApiTeams = useMemo(
    () => (useCalendarApi ? mapDashboardStaffToShiftTeams(dashboardStaffQuery.data?.data) : []),
    [useCalendarApi, dashboardStaffQuery.data?.data]
  );

  if (useCalendarApi) {
    const apiTeams = calendarSynced && Array.isArray(calendarTeams) ? calendarTeams : [];
    // Prefer booking-calendar role groups; if empty after sync, fall back to staff API (not localStorage).
    TEAMS = calendarSynced ? (apiTeams.length > 0 ? apiTeams : staffApiTeams) : [];
    const maps = deriveStaffMaps(TEAMS);
    ALL_STAFF = maps.allStaff;
    STAFF_TEAM_MAP = maps.staffTeamMap;
  }

  const teams = TEAMS;
  const allStaff = ALL_STAFF;
  const staffTeamMap = STAFF_TEAM_MAP;
  const jobsStorageKey = rotaConfig?.jobsStorageKey || 'care-home-jobs';

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const gridRef = useRef(null);
  const { isPanning, handleMouseDown: handleGridMouseDown } = useDragScroll(gridRef);
  const postJobDialog = useBoolean();
  const [postJobContext, setPostJobContext] = useState(null);
  const [jobs, setJobs] = useState(() =>
    useCalendarApi ? [] : loadCareHomeJobs(rotaConfig?.jobsStorageKey ? [] : _careHomeJobs, jobsStorageKey)
  );
  const { jobs: apiPostedJobs, loading: postedJobsLoading } = useEmployerPostedJobs(apiRole, {
    skip: !useCalendarApi,
  });
  const localPostedJobs = useMemo(
    () => (useCalendarApi ? [] : jobs.map(normalizePostedJobForSidebar).filter(Boolean)),
    [jobs, useCalendarApi]
  );
  const postedJobs = useCalendarApi ? apiPostedJobs : localPostedJobs;
  const [weekStart, setWeekStart] = useState(() =>
    useCalendarApi ? startOfWeek(new Date(), { weekStartsOn: 1 }) : FORTNIGHT_START
  );
  const [viewRange, setViewRange] = useState('Fortnight');
  const [shifts, setShifts] = useState(() => (useCalendarApi ? {} : buildInitialShifts()));
  const [collapsed, setCollapsed] = useState({});
  const [location, setLocation] = useState(defaultLocationId || ALL_LOCATIONS_ID);
  const teamOrderStorageKey = `tempy-shifts-team-order-${apiRole || 'careHome'}`;
  const [teamOrderIds, setTeamOrderIds] = useState(() => loadTeamOrder(teamOrderStorageKey));
  const [cellActionMenu, setCellActionMenu] = useState(null);
  const [personOffState, setPersonOffState] = useState({
    open: false,
    staff: null,
    team: null,
    date: '',
  });
  const [postJobIntent, setPostJobIntent] = useState('bookShift');

  const careHomeBranchesQuery = useGetCareHomeBranchesQuery(
    { page: 0, limit: 100 },
    { skip: !useCalendarApi || !isCareHomeApi, refetchOnMountOrArgChange: 60, refetchOnFocus: false }
  );
  const hospitalBranchesQuery = useGetHospitalBranchesQuery(
    { page: 0, limit: 100 },
    { skip: !useCalendarApi || !isHospitalApi, refetchOnMountOrArgChange: 60, refetchOnFocus: false }
  );
  const localAuthorityBranchesQuery = useGetLocalAuthorityBranchesQuery(
    { page: 0, limit: 100 },
    {
      skip: !useCalendarApi || !isLocalAuthorityApi,
      refetchOnMountOrArgChange: 60,
      refetchOnFocus: false,
    }
  );
  const userId = isUserApi ? getProfileUserId(user) : '';
  const userProfileQuery = useGetUserByIdQuery(userId, { skip: !isUserApi || !userId });
  const userBranchesQuery = useUserAddressesQuery(
    { page: 0, limit: 100 },
    { skip: !useCalendarApi || !isUserApi }
  );

  const branchesResult = isHospitalApi
    ? hospitalBranchesQuery.data
    : isLocalAuthorityApi
      ? localAuthorityBranchesQuery.data
      : isUserApi
        ? userBranchesQuery.data
        : careHomeBranchesQuery.data;
  const isBranchesLoading = isHospitalApi
    ? hospitalBranchesQuery.isLoading
    : isLocalAuthorityApi
      ? localAuthorityBranchesQuery.isLoading
      : isUserApi
        ? userBranchesQuery.isLoading
        : careHomeBranchesQuery.isLoading;
  const isBranchesError = isHospitalApi
    ? hospitalBranchesQuery.isError
    : isLocalAuthorityApi
      ? localAuthorityBranchesQuery.isError
      : isUserApi
        ? userBranchesQuery.isError
        : careHomeBranchesQuery.isError;
  const branches = useMemo(() => {
    const list = isUserApi ? userBranchesQuery.data?.data : branchesResult?.data;
    return (list || []).filter((branch) => {
      const status = String(branch.status || 'active').toLowerCase();
      return status !== 'deleted' && status !== 'delete' && status !== 'inactive';
    });
  }, [isUserApi, userBranchesQuery.data?.data, branchesResult?.data]);

  const locationOrigin = useMemo(
    () =>
      getCareHomeUserLatLng(mergeUserWithProfile(user, userProfileQuery.data)) ||
      getFirstCareHomeBranchLatLng(branches) ||
      null,
    [user, userProfileQuery.data, branches]
  );

  const locations = useMemo(() => {
    if (isUserApi) {
      const home = branches[0];
      if (!home) {
        return [];
      }
      const coords = getCareHomeBranchLatLng(home);
      const address = home.location?.fullAddress || home.name || '';
      return [
        {
          id: home.id,
          label: address,
          address,
          latitude: coords?.latitude,
          longitude: coords?.longitude,
        },
      ];
    }
    if (useCalendarApi) {
      const fromApi = branches
        .filter((branch) => branch?.id && branch.status !== 'deleted' && branch.status !== 'delete')
        .map((branch) => {
          const coords = getCareHomeBranchLatLng(branch);
          return {
            id: branch.id,
            label: branch.branchName || branch.name || 'Location',
            address: branch.location?.fullAddress || '',
            latitude: coords?.latitude,
            longitude: coords?.longitude,
          };
        });
      return withAllLocationsOption(fromApi, locationOrigin);
    }
    return resolveLocations(rotaConfig);
  }, [isUserApi, useCalendarApi, branches, rotaConfig, locationOrigin]);

  useEffect(() => {
    if (!locations.length) return;
    const preferred =
      siteSwitcherEnabled && locations.some((loc) => loc.id === activeBranchId)
        ? activeBranchId
        : location;
    if (locations.some((loc) => loc.id === preferred)) {
      if (preferred !== location) setLocation(preferred);
      return;
    }
    setLocation(locations[0]?.id || ALL_LOCATIONS_ID);
  }, [activeBranchId, location, locations, siteSwitcherEnabled]);
  const [selectedStaff, setSelectedStaff] = useState(
    defaultStaff || teams[0]?.staff?.[0] || null
  );
  const [focusedShiftDate, setFocusedShiftDate] = useState('');
  const [showStaffDetail, setShowStaffDetail] = useState(false);
  const [rosterScope, setRosterScope] = useState(
    useCalendarApi ? ROSTER_SCOPE.ALL : ROSTER_SCOPE.CURRENT
  );
  const [lockToggled, setIsLocked] = useState(false);

  const isLocked = lockToggled || viewOnly;
  const notifyLocked = () => {
    if (!viewOnly) toast.warning('Rota is locked — unlock to make changes');
  };
  const [activeSidebarAction, setActiveSidebarAction] = useState('add-job');

  useEffect(() => {
    if (useCalendarApi) return;
    saveCareHomeJobs(jobs, jobsStorageKey);
  }, [jobs, jobsStorageKey, useCalendarApi]);

  const handleOpenPostJob = useCallback(
    (context = null) => {
      if (isLocked) {
        notifyLocked();
        return;
      }

      if (context?.staffId) {
        const member = allStaff.find((s) => s.id === context.staffId);
        if (member) {
          setSelectedStaff(member);
          setShowStaffDetail(true);
        }
        if (context.date) {
          setFocusedShiftDate(context.date);
        }
      }

      setPostJobIntent(
        context?.intent === 'job'
          ? 'job'
          : context?.intent === 'request'
            ? 'request'
            : 'bookShift'
      );
      setPostJobContext(context);
      postJobDialog.onTrue();
    },
    [allStaff, isLocked, postJobDialog]
  );

  const handleClosePostJob = useCallback(() => {
    postJobDialog.onFalse();
    setPostJobContext(null);
    setPostJobIntent('bookShift');
  }, [postJobDialog]);

  const [createCareHomeJob] = useCreateCareHomeJobMutation();
  const [createHospitalJob] = useCreateHospitalJobMutation();
  const [createUserJob] = useCreateUserJobMutation();
  const [createLocalAuthorityJob] = useCreateLocalAuthorityJobMutation();
  const [updateCareHomeJob] = useUpdateCareHomeJobMutation();
  const [cancelCareHomeBooking, { isLoading: isCancellingBooking }] = useCancelCareHomeBookingMutation();
  const [updateHospitalJob] = useUpdateHospitalJobMutation();
  const [updateUserJob] = useUpdateUserJobMutation();
  const [updateLocalAuthorityJob] = useUpdateLocalAuthorityJobMutation();
  const createJob =
    isHospitalApi
      ? createHospitalJob
      : isUserApi
        ? createUserJob
        : isLocalAuthorityApi
          ? createLocalAuthorityJob
          : createCareHomeJob;
  const updateJob =
    isHospitalApi
      ? updateHospitalJob
      : isUserApi
        ? updateUserJob
        : isLocalAuthorityApi
          ? updateLocalAuthorityJob
          : updateCareHomeJob;

  const careHomeJobsQuery = useGetCareHomeJobsQuery(
    { page: 0, limit: 100 },
    { skip: !useCalendarApi || !isCareHomeApi }
  );
  const hospitalJobsQuery = useGetHospitalJobsQuery(
    { page: 0, limit: 100 },
    { skip: !useCalendarApi || !isHospitalApi }
  );
  const userJobsQuery = useGetUserJobsQuery(
    { page: 0, limit: 100 },
    { skip: !useCalendarApi || !isUserApi }
  );
  const localAuthorityJobsQuery = useGetLocalAuthorityJobsQuery(
    { page: 0, limit: 100 },
    { skip: !useCalendarApi || !isLocalAuthorityApi }
  );
  const employerJobsQuery = isLocalAuthorityApi
    ? localAuthorityJobsQuery
    : isUserApi
      ? userJobsQuery
      : isHospitalApi
        ? hospitalJobsQuery
        : careHomeJobsQuery;
  const employerJobs = useMemo(() => employerJobsQuery.data?.data || [], [employerJobsQuery.data?.data]);
  const rateDialog = useBoolean();
  const [rateJob, setRateJob] = useState(null);
  const [cancelBookingTarget, setCancelBookingTarget] = useState(null);
  const reviewDialog = useBoolean();
  const [reviewJob, setReviewJob] = useState(null);
  const { data: reviewsData, refetch: refetchReviews } = useGetReviewsQuery(
    { page: 0, limit: 200 },
    { skip: !useCalendarApi }
  );
  const [createReview, { isLoading: creatingReview }] = useCreateReviewMutation();
  const [updateReview, { isLoading: updatingReview }] = useUpdateReviewMutation();

  const reviewsByObjectId = useMemo(() => {
    const map = new Map();
    (reviewsData?.data || []).forEach((review) => {
      if (!review?.objectId) return;
      map.set(`${review.reviewType || 'booking'}:${review.objectId}`, review);
    });
    return map;
  }, [reviewsData?.data]);

  const resolveDirectRequestTargetId = useCallback((context = {}, staff = null) => {

    const agencyCandidates = [context.agencyId, staff?.agencyId];
    for (const value of agencyCandidates) {
      const id = String(value || '').trim();
      if (id && isMongoObjectId(id)) return id;
    }

    const workerCandidates = [context.workerId, context.employeeId, staff?.id, context.staffId];
    for (const value of workerCandidates) {
      const id = String(value || '').trim();
      if (
        id &&
        isMongoObjectId(id) &&
        !String(id).startsWith('vacant-') &&
        !String(id).startsWith('worker-')
      ) {
        return id;
      }
    }
    return '';
  }, []);

  const postJobInitialDraft = useMemo(() => {
    if (!postJobContext?.date) return null;

    const team =
      postJobContext.team ||
      (postJobContext.staffId ? staffTeamMap[postJobContext.staffId] : null);
    const defaultType =
      postJobContext.defaultJobType || teamLabelToJobType(team?.label);

    const staff =
      allStaff.find((member) => member.id === postJobContext.staffId) ||
      teams.flatMap((t) => t.staff || []).find((member) => member.id === postJobContext.staffId) ||
      null;

    const directId = resolveDirectRequestTargetId(postJobContext, staff);
    const branchId =
      postJobContext.branchId ||
      (location && location !== ALL_LOCATIONS_ID ? location : '') ||
      '';

    const selectedBranch = branches.find((branch) => String(branch.id) === String(branchId));
    const address = selectedBranch
      ? selectedBranch.location?.fullAddress || selectedBranch.branchName || selectedBranch.name || ''
      : '';

    return createJobDraftForCell({
      date: postJobContext.date,
      type: defaultType,
      agencyId: postJobContext.agencyId || staff?.agencyId || '',
      agencyName: postJobContext.agencyName || staff?.agencyName || '',
      requestFromAgency: Boolean(
        postJobContext.requestFromAgency || postJobContext.agencyId || directId
      ),
      branchId,
      address,
      workerId: directId,
      employeeId: directId,
    });
  }, [
    postJobContext,
    staffTeamMap,
    allStaff,
    teams,
    location,
    branches,
    resolveDirectRequestTargetId,
  ]);

  const handleSubmitJob = useCallback(
    async (draft) => {
      if (!useCalendarApi) {
        const createdJob = createCareHomeJobFromDraft(draft);
        setJobs((prev) => [createdJob, ...prev]);
        toast.success('Job added successfully');
        setPostJobContext(null);
        return;
      }

      const validationError = validateJobDraft(draft);
      if (validationError) {
        throw new Error(validationError);
      }

      const branchId =
        String(draft.branchId || '').trim() ||
        (location && location !== ALL_LOCATIONS_ID ? location : '') ||
        String(branches[0]?.id || '');

      const branch =
        branches.find((item) => String(item.id) === String(branchId)) ||
        branches.find((item) => String(item._id) === String(branchId)) ||
        null;

      if (!draft.typeId) {
        throw new Error('Please select a job type');
      }
      if (!branchId || !branch) {
        throw new Error('Please select a valid location');
      }

      const staff =
        allStaff.find((member) => member.id === postJobContext?.staffId) ||
        allStaff.find((member) => member.id === selectedStaff?.id) ||
        null;

      const directId =
        resolveDirectRequestTargetId(
          {
            workerId: draft.workerId,
            employeeId: draft.employeeId,
            agencyId: draft.agencyId,
            staffId: postJobContext?.staffId,
          },
          staff
        ) || '';

      const schedules = (draft.schedules || []).map((entry) => ({
        ...entry,
        receivingBids: directId ? false : entry.receivingBids,
      }));

      const body = buildCareHomeJobPayload(
        {
          ...draft,
          branchId,
          workerId: directId,
          employeeId: directId,
          schedules,
          location: branch.location || draft.location,
        },
        branch,
        { isUser: isUserApi }
      );

      if (!body.name) throw new Error('Please enter a job name');
      if (!body.type) throw new Error('Please select a job type');
      if (!(body.branch || body.address)) {
        throw new Error('Please select a location');
      }
      if (!body.shift?.length) throw new Error('Please add at least one shift');

      try {
        await createJob(body).unwrap();
      } catch (err) {
        if (!isJobCreateSoftError(err)) throw err;
      }

      const clickedStaffId =
        postJobContext?.staffId || selectedStaff?.id || allStaff.find((s) => !s.isVacant)?.id;
      const { staffId: targetStaffId, teamMatched, team: matchedTeam } = resolveStaffIdForJobType(
        draft.type || draft.typeTitle,
        clickedStaffId,
        teams
      );
      const validSchedules = schedules.filter(
        (entry) => entry.date && entry.startTime && entry.endTime
      );

      if (validSchedules.length && targetStaffId) {
        const sortedDates = [...validSchedules]
          .map((entry) => parse(entry.date, 'yyyy-MM-dd', new Date()))
          .filter((date) => isValid(date))
          .sort((a, b) => a.getTime() - b.getTime());

        const focusDate = sortedDates.length
          ? format(sortedDates[0], 'yyyy-MM-dd')
          : validSchedules[0].date;

        setFocusedShiftDate(focusDate);
        if (sortedDates.length) setWeekStart(sortedDates[0]);
        if (matchedTeam?.id) {
          setCollapsed((prev) => ({ ...prev, [matchedTeam.id]: false }));
        }

        const targetMember = allStaff.find((s) => s.id === targetStaffId);
        if (targetMember) {
          setSelectedStaff(targetMember);
          setShowStaffDetail(true);
        }

        setShifts((prev) => {
          const next = { ...prev };
          validSchedules.forEach((schedule, index) => {
            const built = buildJobGridShift(
              { ...draft, schedules: validSchedules },
              targetStaffId,
              schedule,
              index,
              validSchedules
            );
            next[built.id] = {
              ...built,
              fromJob: true,
            };
          });
          return next;
        });

        if (!teamMatched) {
          toast.warning(
            `No matching team row for "${draft.type || draft.typeTitle}". Job posted on the selected staff row.`
          );
        }
      }

      if (directId) {
        const sentToAgency =
          Boolean(draft.agencyId && directId === draft.agencyId) ||
          Boolean(staff?.agencyId && directId === staff.agencyId);
        toast.success(
          sentToAgency
            ? `Direct request sent${draft.agencyName || staff?.agencyName ? ` to ${draft.agencyName || staff.agencyName}` : ''} — it will show on Agency → Find Jobs`
            : 'Request sent to worker (not an agency — will not appear on Agency Find Jobs)'
        );
      } else {
        toast.success('Job created successfully');
      }

      setPostJobContext(null);
    },
    [
      useCalendarApi,
      location,
      branches,
      allStaff,
      teams,
      postJobContext,
      selectedStaff,
      resolveDirectRequestTargetId,
      createJob,
    ]
  );
  const [shiftForm, setShiftForm] = useState({
    open: false,
    position: null,
    shift: null,
    staff: null,
    team: null,
    date: '',
  });

  const [formInputs, setFormInputs] = useState({
    startInput: '',
    endInput: '',
    staffId: '',
    shiftLocation: '',
  });

  const [formPreview, setFormPreview] = useState(null);

  const closeShiftForm = useCallback(() => {
    setFormPreview(null);
    setFormInputs({ startInput: '', endInput: '', staffId: '', shiftLocation: '' });
    setShiftForm({
      open: false,
      position: null,
      shift: null,
      staff: null,
      team: null,
      date: '',
    });
  }, []);

  const openShiftForm = useCallback(({ shift, staff, team, date, position }) => {
    setFormInputs(buildFormInputs(shift, staff));
    setShiftForm({
      open: true,
      position,
      shift,
      staff,
      team,
      date,
    });
  }, []);

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
    if (location && location !== ALL_LOCATIONS_ID) {
      const selectedBranch = branches.find((branch) => String(branch.id) === String(location));
      const fromBranch = getCareHomeBranchLatLng(selectedBranch);
      if (fromBranch) return fromBranch;
    }
    return getCareHomeUserLatLng(user) || getFirstCareHomeBranchLatLng(branches) || null;
  }, [location, branches, user]);

  const calendarOriginReady = Boolean(
    calendarOrigin ||
    isUserApi ||
    (!isBranchesLoading && (Boolean(branchesResult) || isBranchesError))
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
    if (!isUserApi && location && location !== ALL_LOCATIONS_ID) {
      args.branch = location;
    }
    return args;
  }, [calendarRange, calendarOrigin, calendarOriginReady, isUserApi, location]);

  const careHomeCalendarQuery = useGetCareHomeBookingCalendarQuery(calendarQueryArgs, {
    skip: !useCalendarApi || !calendarQueryArgs || !isCareHomeApi,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const hospitalCalendarQuery = useGetHospitalBookingCalendarQuery(calendarQueryArgs, {
    skip: !useCalendarApi || !calendarQueryArgs || !isHospitalApi,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const userCalendarQuery = useGetUserBookingCalendarQuery(calendarQueryArgs, {
    skip: !useCalendarApi || !calendarQueryArgs || !isUserApi,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });
  const localAuthorityCalendarQuery = useGetLocalAuthorityBookingCalendarQuery(calendarQueryArgs, {
    skip: !useCalendarApi || !calendarQueryArgs || !isLocalAuthorityApi,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  const calendarData = isHospitalApi
    ? hospitalCalendarQuery.data
    : isUserApi
      ? userCalendarQuery.data
      : isLocalAuthorityApi
        ? localAuthorityCalendarQuery.data
        : careHomeCalendarQuery.data;
  const isCalendarLoading = isHospitalApi
    ? hospitalCalendarQuery.isLoading
    : isUserApi
      ? userCalendarQuery.isLoading
      : isLocalAuthorityApi
        ? localAuthorityCalendarQuery.isLoading
        : careHomeCalendarQuery.isLoading;
  const isCalendarFetching = isHospitalApi
    ? hospitalCalendarQuery.isFetching
    : isUserApi
      ? userCalendarQuery.isFetching
      : isLocalAuthorityApi
        ? localAuthorityCalendarQuery.isFetching
        : careHomeCalendarQuery.isFetching;
  const isCalendarError = isHospitalApi
    ? hospitalCalendarQuery.isError
    : isUserApi
      ? userCalendarQuery.isError
      : isLocalAuthorityApi
        ? localAuthorityCalendarQuery.isError
        : careHomeCalendarQuery.isError;
  const calendarError = isHospitalApi
    ? hospitalCalendarQuery.error
    : isUserApi
      ? userCalendarQuery.error
      : isLocalAuthorityApi
        ? localAuthorityCalendarQuery.error
        : careHomeCalendarQuery.error;

  useEffect(() => {
    if (!useCalendarApi || !calendarData) return;

    setCalendarTeams(Array.isArray(calendarData.teams) ? calendarData.teams : []);
    setCalendarMeta(calendarData.meta || null);
    setCalendarDayWeather(
      calendarData.dayWeather && typeof calendarData.dayWeather === 'object'
        ? calendarData.dayWeather
        : {}
    );
    setCalendarSynced(true);

    setShifts((prev) => {
      const next = { ...(calendarData.shifts || {}) };
      Object.entries(prev).forEach(([key, shift]) => {
        if (shift?.fromJob) next[key] = shift;
      });
      return next;
    });
  }, [useCalendarApi, calendarData]);

  useEffect(() => {
    if (!useCalendarApi || !isCalendarError) return;
    const message =
      calendarError?.data?.message ||
      calendarError?.error ||
      'Failed to load booking calendar';
    toast.error(message);
  }, [useCalendarApi, isCalendarError, calendarError]);

  useEffect(() => {
    if (!useCalendarApi || !calendarSynced) return;
    const exists =
      Boolean(selectedStaff?.id) &&
      (allStaff.some((member) => member.id === selectedStaff.id) ||
        teams.some((team) => team.staff?.some((member) => member.id === selectedStaff.id)));
    if (exists) return;
    const next =
      allStaff.find((member) => !member.isVacant) ||
      teams.flatMap((team) => team.staff || []).find((member) => !member.isVacant) ||
      teams[0]?.staff?.[0] ||
      null;
    setSelectedStaff(next);
  }, [useCalendarApi, calendarSynced, teams, allStaff, selectedStaff]);

  const stats = useMemo(() => {
    if (useCalendarApi) {
      if (!calendarSynced) return { hours: '0h', cost: '£0', count: '0' };
      if (calendarMeta) return formatCalendarMetaStats(calendarMeta);
    }
    return computeStats(shifts);
  }, [useCalendarApi, calendarSynced, calendarMeta, shifts]);
  const dayHours = useMemo(() => computeDayHours(shifts, days), [shifts, days]);
  const staffColWidth = isMobile ? 140 : STAFF_COL_W;
  const dayColWidth = isMobile ? 116 : DAY_COL_W;
  const gridContentWidth = getGridContentWidth(days.length, staffColWidth, dayColWidth);

  const activeCell = useMemo(() => {
    if (!shiftForm.open || !shiftForm.staff?.id || !shiftForm.date) {
      return null;
    }
    return { staffId: shiftForm.staff.id, date: shiftForm.date };
  }, [shiftForm.open, shiftForm.staff, shiftForm.date]);

  const dateRangeLabel = `${format(weekStart, 'd MMM')} - ${format(days[days.length - 1], 'd MMM')}`;

  const rosterCtx = useMemo(() => ({ shifts, days }), [shifts, days]);

  const visibleTeams = useMemo(
    () => sortTeamsByOrder(mapTeamsByRosterScope(teams, rosterScope, rosterCtx), teamOrderIds),
    [teams, rosterScope, rosterCtx, teamOrderIds]
  );

  useEffect(() => {
    if (!teams?.length) return;
    setTeamOrderIds((prev) => {
      const ids = teams.map((team) => String(team.id));
      const next = [...prev.filter((id) => ids.includes(String(id)))];
      ids.forEach((id) => {
        if (!next.includes(id)) next.push(id);
      });
      if (next.length === prev.length && next.every((id, index) => id === prev[index])) {
        return prev;
      }
      saveTeamOrder(teamOrderStorageKey, next);
      return next;
    });
  }, [teams, teamOrderStorageKey]);

  const teamSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleTeamDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      setTeamOrderIds((prev) => {
        const current = sortTeamsByOrder(visibleTeams, prev).map((team) => String(team.id));
        const oldIndex = current.indexOf(String(active.id));
        const newIndex = current.indexOf(String(over.id));
        if (oldIndex < 0 || newIndex < 0) return prev;
        const next = arrayMove(current, oldIndex, newIndex);
        saveTeamOrder(teamOrderStorageKey, next);
        return next;
      });
    },
    [teamOrderStorageKey, visibleTeams]
  );

  const visibleStaffCount = useMemo(() => countRosterMembers(visibleTeams), [visibleTeams]);

  const hiddenRosterCount = useMemo(
    () => countHiddenRosterMembers(teams, rosterScope, rosterCtx),
    [teams, rosterScope, rosterCtx]
  );

  const handleSidebarAddJob = useCallback(() => {
    const staff = selectedStaff || visibleTeams[0]?.staff?.[0] || teams[0]?.staff?.[0];
    if (!staff) return;
    const team = staffTeamMap[staff.id] || visibleTeams[0] || teams[0];
    const agencyId = String(staff.agencyId || '').trim();
    const directId = resolveDirectRequestTargetId(
      {
        agencyId,
        workerId: staff.id,
        staffId: staff.id,
      },
      staff
    );
    handleOpenPostJob({
      intent: 'bookShift',
      staffId: staff.id,
      date: format(days[0], 'yyyy-MM-dd'),
      team,
      defaultJobType: teamLabelToJobType(team?.label),
      agencyId: agencyId || undefined,
      agencyName: staff.agencyName || undefined,
      requestFromAgency: Boolean(agencyId || staff.fromAgency),
      workerId: directId,
      employeeId: directId,
      branchId: location && location !== ALL_LOCATIONS_ID ? location : '',
    });
  }, [
    days,
    handleOpenPostJob,
    selectedStaff,
    staffTeamMap,
    teams,
    visibleTeams,
    resolveDirectRequestTargetId,
    location,
  ]);

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

    const activeShift = activeShiftDate ? shifts[`${selectedStaff.id}-${activeShiftDate}`] : null;

    let jobTypeLabel = '';
    let genderLabel = '';
    let description = '';
    let timeRangeLabel = '';
    let scheduleInfo = '';
    let resolvedBreakLabel = breakLabel;
    let resolvedLocationLabel = locationLabel;
    let resolvedRoleLabel = selectedStaff.role || 'Staff';

    if (activeShift?.fromJob) {
      jobTypeLabel = activeShift.jobType || '';
      genderLabel = activeShift.gender ? getGenderLabel(activeShift.gender) : 'Not specified';
      description = activeShift.description || '';
      timeRangeLabel = `${formatShiftTime(activeShift.startTime)} - ${formatShiftTime(activeShift.endTime)}`;
      resolvedBreakLabel = activeShift.hasBreak
        ? `Break: ${activeShift.breakMins || 0} min`
        : 'No break';
      resolvedLocationLabel = activeShift.location?.trim() || '';
      resolvedRoleLabel = activeShift.jobType || selectedStaff.role || 'Staff';
      if (activeShift.scheduleCount > 1) {
        scheduleInfo = `Shift ${activeShift.scheduleIndex} of ${activeShift.scheduleCount}`;
      }
    }

    const jobShiftsInPeriod = days
      .map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const shift = shifts[`${selectedStaff.id}-${dateStr}`];
        if (!shift?.fromJob) return null;
        return {
          date: dateStr,
          dateLabel: format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'EEE d MMM'),
          shift,
        };
      })
      .filter(Boolean);

    return {
      ...selectedStaff,
      hoursLabel: formatHoursLabel(hours),
      breakLabel: resolvedBreakLabel,
      locationLabel: resolvedLocationLabel,
      shiftDateLabel,
      roleLabel: resolvedRoleLabel,
      jobTypeLabel,
      genderLabel,
      description,
      timeRangeLabel,
      scheduleInfo,
      jobShiftsInPeriod,
      activeShiftFromJob: Boolean(activeShift?.fromJob),
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
    const member = allStaff.find((s) => s.id === staffId);
    if (member) {
      setSelectedStaff(member);
      setShowStaffDetail(true);
    }
  }, [allStaff]);

  const handleStartInputChange = useCallback((value) => {
    setFormInputs((prev) => ({ ...prev, startInput: value }));
  }, []);

  const handleEndInputChange = useCallback((value) => {
    setFormInputs((prev) => ({ ...prev, endInput: value }));
  }, []);

  const handleStaffIdChange = useCallback(
    (staffId) => {
      setFormInputs((prev) => {
        const shift = shiftForm.date ? shifts[`${staffId}-${shiftForm.date}`] : null;
        return {
          ...prev,
          staffId,
          startInput: shift?.startTime?.slice(0, 5) || '',
          endInput: shift?.endTime?.slice(0, 5) || '',
          shiftLocation: shift?.location || '',
        };
      });
    },
    [shifts, shiftForm.date]
  );

  const handleShiftLocationChange = useCallback((value) => {
    setFormInputs((prev) => ({ ...prev, shiftLocation: value }));
  }, []);

  useEffect(() => {
    if (!shiftForm.open || !formInputs.staffId || !shiftForm.date) return;
    setFormPreview({
      staffId: Number(formInputs.staffId),
      date: shiftForm.date,
      startTime: timeInputToHHMM(formInputs.startInput) || formInputs.startInput,
      endTime: timeInputToHHMM(formInputs.endInput) || formInputs.endInput,
      location: formInputs.shiftLocation?.trim() || '',
    });
  }, [formInputs, shiftForm.open, shiftForm.date]);

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

  const handleCellClick = useCallback(
    (anchor, shift, staff, date, team) => {
      if (isLocked) {
        notifyLocked();
        return;
      }

      if (staff?.isVacant) return;

      setSelectedStaff(staff);
      setFocusedShiftDate(date);
      setShowStaffDetail(true);

      // Empty cells: book shift or mark person off from the cell
      if (!shift) {
        setCellActionMenu({
          anchorEl: anchor,
          staff,
          team,
          date,
        });
        return;
      }

      if (VIEW_ONLY) {
        return;
      }

      setActiveSidebarAction('add-job');
      openShiftForm({
        shift,
        staff,
        team,
        date,
        position: getAnchorPosition(anchor),
      });
    },
    [isLocked, openShiftForm]
  );

  const closeCellActionMenu = useCallback(() => {
    setCellActionMenu(null);
  }, []);

  const handleCellBookShift = useCallback(() => {
    if (!cellActionMenu?.staff) return;
    const { staff, team, date } = cellActionMenu;
    closeCellActionMenu();

    const agencyId = String(staff.agencyId || '').trim();
    const directId = resolveDirectRequestTargetId(
      {
        agencyId,
        workerId: staff.id,
        staffId: staff.id,
      },
      staff
    );

    handleOpenPostJob({
      intent: 'bookShift',
      staffId: staff.id,
      date,
      team,
      defaultJobType: teamLabelToJobType(team?.label),
      agencyId: agencyId || undefined,
      agencyName: staff.agencyName || undefined,
      requestFromAgency: Boolean(agencyId || staff.fromAgency),
      workerId: directId,
      employeeId: directId,
      branchId: location && location !== ALL_LOCATIONS_ID ? location : '',
    });
  }, [
    cellActionMenu,
    closeCellActionMenu,
    handleOpenPostJob,
    location,
    resolveDirectRequestTargetId,
  ]);

  const siteRoleLabels = useMemo(() => {
    if (!location || location === ALL_LOCATIONS_ID) return null;
    return teams.map((team) => team.label).filter(Boolean);
  }, [location, teams]);

  const handleDateHeaderClick = useCallback(
    (day) => {
      if (isLocked) {
        notifyLocked();
        return;
      }

      const date = format(day, 'yyyy-MM-dd');

      const singleSiteId =
        locations.filter((item) => !item.isAll).length === 1
          ? locations.find((item) => !item.isAll)?.id
          : '';
      const siteId =
        location && location !== ALL_LOCATIONS_ID ? location : singleSiteId || '';

      if (!isUserApi && !siteId) {
        toast.info('Select a site first — each site has its own roles');
        return;
      }

      const siteTeams = siteId ? teams : [];
      const onlyTeam = siteTeams.length === 1 ? siteTeams[0] : null;

      handleOpenPostJob({
        intent: 'request',
        date,
        team: onlyTeam || undefined,
        defaultJobType: onlyTeam ? teamLabelToJobType(onlyTeam.label) : '',
        branchId: siteId || (isUserApi ? location : ''),
      });
    },
    [handleOpenPostJob, isLocked, isUserApi, location, locations, teams]
  );

  const handleCellDayOff = useCallback(() => {
    if (!cellActionMenu?.staff || !cellActionMenu?.date) return;
    const { staff, team, date } = cellActionMenu;
    closeCellActionMenu();
    setPersonOffState({ open: true, staff, team, date });
  }, [cellActionMenu, closeCellActionMenu]);

  const handleClosePersonOff = useCallback(() => {
    setPersonOffState({ open: false, staff: null, team: null, date: '' });
  }, []);

  const handleConfirmPersonOff = useCallback(
    async ({ staff, date, type, notes }) => {
      if (!staff?.id || !date) return;

      const key = `${staff.id}-${date}`;
      const isLeave = type === 'leave';

      setShifts((prev) => ({
        ...prev,
        [key]: {
          id: key,
          staffId: staff.id,
          date,
          dayOff: !isLeave,
          leave: isLeave,
          notes: notes || '',
          startTime: '00:00',
          endTime: '23:59',
        },
      }));

      setSelectedStaff(staff);
      setFocusedShiftDate(date);
      setShowStaffDetail(true);
      setActiveSidebarAction(isLeave ? 'add-leave' : 'day-off');

      toast.success(
        isLeave
          ? `${staff.name || 'Staff'} marked as leave / person off`
          : `${staff.name || 'Staff'} marked as day off`
      );
    },
    []
  );

  const openAddShiftPopover = useCallback(() => {
    if (isLocked) {
      notifyLocked();
      return;
    }
    const staff = selectedStaff || teams[0]?.staff?.[0];
    if (!staff) return;
    const team = staffTeamMap[staff.id] || teams[0];
    const date = format(days[0], 'yyyy-MM-dd');
    const shift = shifts[`${staff.id}-${date}`] || null;
    setFocusedShiftDate(date);
    setActiveSidebarAction('add-job');
    setShowStaffDetail(true);
    openShiftForm({
      shift,
      staff,
      team,
      date,
      position: getCellPosition(staff.id, date),
    });
  }, [days, getCellPosition, isLocked, openShiftForm, selectedStaff, shifts, staffTeamMap, teams]);

  const handleSaveShift = useCallback(
    (form) => {
      const key = `${form.staffId}-${form.date}`;
      const member = allStaff.find((s) => s.id === form.staffId);

      setShifts((prev) => {
        const isUpdate = Boolean(prev[key]);
        const next = {
          ...prev,
          [key]: {
            ...(prev[key] || {}),
            id: key,
            staffId: form.staffId,
            date: form.date,
            startTime: form.startTime,
            endTime: form.endTime,
            location: form.location || '',
            notes: form.notes ?? prev[key]?.notes ?? '',
          },
        };
        const hours = computeStaffHours(next, form.staffId, days);
        toast.success(
          isUpdate
            ? `Shift updated — ${member?.name} now at ${Math.round(hours)}h`
            : `Shift added — ${member?.name} now at ${Math.round(hours)}h`
        );
        return next;
      });

      if (member) setSelectedStaff(member);
      setFormPreview(null);
    },
    [allStaff, days]
  );

  const handleDeleteShift = useCallback(
    (shift) => {
      const key = `${shift.staffId}-${shift.date}`;
      const member = allStaff.find((s) => s.id === shift.staffId);

      setShifts((prev) => {
        const next = { ...prev };
        delete next[key];
        const hours = computeStaffHours(next, shift.staffId, days);
        toast.success(`Shift removed — ${member?.name} now at ${Math.round(hours)}h`);
        return next;
      });
      setFormPreview(null);
    },
    [allStaff, days]
  );

  const handleDuplicateShift = useCallback(
    (form) => {
      if (isLocked) {
        notifyLocked();
        return;
      }

      const staffId = Number(form.staffId);
      const member = allStaff.find((s) => s.id === staffId);
      const currentIndex = days.findIndex((day) => format(day, 'yyyy-MM-dd') === form.date);

      let targetDate = null;
      for (let offset = 1; offset <= days.length; offset += 1) {
        const day = days[(Math.max(currentIndex, 0) + offset) % days.length];
        const dateKey = format(day, 'yyyy-MM-dd');
        if (dateKey === form.date) continue;
        if (!shifts[`${staffId}-${dateKey}`]) {
          targetDate = dateKey;
          break;
        }
      }

      if (!targetDate) {
        toast.warning('No empty day available in this period to duplicate into');
        return;
      }

      const key = `${staffId}-${targetDate}`;
      setShifts((prev) => {
        const next = {
          ...prev,
          [key]: {
            id: key,
            staffId,
            date: targetDate,
            startTime: form.startTime,
            endTime: form.endTime,
            location: form.location || '',
            notes: form.notes || '',
          },
        };
        toast.success(
          `Shift duplicated to ${format(parse(targetDate, 'yyyy-MM-dd', new Date()), 'EEE d MMM')} — ${member?.name}`
        );
        return next;
      });

      setFocusedShiftDate(targetDate);
      if (member) setSelectedStaff(member);

      const team = staffTeamMap[staffId] || teams[0];
      openShiftForm({
        shift: {
          id: key,
          staffId,
          date: targetDate,
          startTime: form.startTime,
          endTime: form.endTime,
          location: form.location || '',
          notes: form.notes || '',
        },
        staff: member || shiftForm.staff,
        team,
        date: targetDate,
        position: getCellPosition(staffId, targetDate),
      });
    },
    [allStaff, days, getCellPosition, isLocked, openShiftForm, shiftForm.staff, shifts, staffTeamMap, teams]
  );

  const handleNotesSave = useCallback(
    (form) => {
      if (isLocked) {
        notifyLocked();
        return;
      }

      const key = `${form.staffId}-${form.date}`;
      const member = allStaff.find((s) => s.id === form.staffId);

      setShifts((prev) => {
        const existing = prev[key];
        const next = {
          ...prev,
          [key]: {
            ...(existing || {}),
            id: key,
            staffId: form.staffId,
            date: form.date,
            startTime: form.startTime || existing?.startTime || '09:00',
            endTime: form.endTime || existing?.endTime || '17:00',
            location: form.location || existing?.location || '',
            notes: form.notes || '',
          },
        };
        toast.success(
          form.notes?.trim()
            ? `Notes saved — ${member?.name}`
            : `Notes cleared — ${member?.name}`
        );
        return next;
      });

      setShiftForm((prev) =>
        prev.open && prev.date === form.date && prev.staff?.id === form.staffId
          ? {
            ...prev,
            shift: {
              ...(prev.shift || {}),
              id: key,
              staffId: form.staffId,
              date: form.date,
              startTime: form.startTime,
              endTime: form.endTime,
              location: form.location || '',
              notes: form.notes || '',
            },
          }
          : prev
      );
    },
    [isLocked]
  );

  const shiftFormCardProps = useMemo(() => {
    if (!shiftForm.open) return null;

    return {
      team: shiftForm.team,
      shift: shiftForm.shift,
      date: shiftForm.date,
      startInput: formInputs.startInput,
      endInput: formInputs.endInput,
      staffId: formInputs.staffId,
      shiftLocation: formInputs.shiftLocation,
      onStartInputChange: handleStartInputChange,
      onEndInputChange: handleEndInputChange,
      onStaffIdChange: handleStaffIdChange,
      onShiftLocationChange: handleShiftLocationChange,
      onClose: closeShiftForm,
      onSave: handleSaveShift,
      onDelete: handleDeleteShift,
      onDuplicate: handleDuplicateShift,
      onNotesSave: handleNotesSave,
      onStaffChange: handleFormStaffChange,
    };
  }, [
    shiftForm.open,
    shiftForm.team,
    shiftForm.shift,
    shiftForm.date,
    formInputs,
    handleStartInputChange,
    handleEndInputChange,
    handleStaffIdChange,
    handleShiftLocationChange,
    closeShiftForm,
    handleSaveShift,
    handleDeleteShift,
    handleDuplicateShift,
    handleNotesSave,
    handleFormStaffChange,
  ]);

  const applySpecialShift = useCallback(
    (type) => {
      if (isLocked) {
        notifyLocked();
        return;
      }
      const staff = selectedStaff || teams[0]?.staff?.[0];
      if (!staff) return;
      const date = format(days[0], 'yyyy-MM-dd');
      const key = `${staff.id}-${date}`;

      if (type === 'not-scheduled') {
        setShifts((prev) => {
          const next = { ...prev };
          days.forEach((day) => {
            delete next[`${staff.id}-${format(day, 'yyyy-MM-dd')}`];
          });
          toast.success('Marked as not scheduled');
          return next;
        });
        setActiveSidebarAction(type);
        setFormPreview(null);
        return;
      }

      const meta = {
        'on-call': { onCall: true, startTime: '00:00', endTime: '23:59' },
        sleepover: { sleepover: true, startTime: '22:00', endTime: '07:00' },
        'day-off': { dayOff: true, startTime: '00:00', endTime: '23:59' },
        'add-leave': { leave: true, startTime: '00:00', endTime: '23:59' },
      }[type];

      if (!meta) return;

      const shortLabels = {
        'on-call': 'On call scheduled',
        sleepover: 'Sleepover scheduled',
        'day-off': 'Day off scheduled',
        'add-leave': 'Leave added',
      };

      setShifts((prev) => ({
        ...prev,
        [key]: { id: key, staffId: staff.id, date, ...meta },
      }));

      toast.success(shortLabels[type] || 'Saved');

      setActiveSidebarAction(type);
      setFormPreview(null);
    },
    [days, isLocked, selectedStaff, teams]
  );

  const handleStaffSelect = useCallback((member) => {
    setSelectedStaff((prev) => {
      if (prev?.id !== member.id) {
        setFocusedShiftDate('');
      }
      return member;
    });
    setShowStaffDetail(true);
  }, []);

  const handleCardStaffPick = useCallback((staff, shift) => {
    setSelectedStaff(staff);
    if (shift?.date) setFocusedShiftDate(shift.date);
    setShowStaffDetail(true);
  }, []);

  const handleOpenShiftDetails = useCallback(() => {
    setShowStaffDetail(false);
  }, []);

  const router = useRouter();

  const staffListPath = useMemo(() => {
    switch (apiRole) {
      case 'hospital':
        return paths.dashboard.hospital.staff;
      case 'localAuthority':
        return paths.dashboard.localAuthority.staff;
      case 'agency':
        return paths.dashboard.agency.staff;
      case 'homeCareCompany':
        return paths.dashboard.homeCareCompany.staff;
      case 'user':
        return paths.dashboard.individualHomeCare.staff;
      default:
        return paths.dashboard.staff.root;
    }
  }, [apiRole]);

  const showCompanyRolesEmpty =
    useCalendarApi && calendarSynced && visibleTeams.length === 0;

  const handleViewBids = useCallback(
    (shift) => {
      const jobId = resolveShiftJobId(shift);
      const base = getJobBidsPath(apiRole);
      if (jobId) {
        router.push(`${base}?jobId=${encodeURIComponent(jobId)}`);
        return;
      }
      router.push(base);
    },
    [apiRole, router]
  );

  const handleIncreaseRate = useCallback(
    (shift) => {
      const jobId = resolveShiftJobId(shift);
      if (!jobId) {
        toast.info('No job linked to this shift yet');
        return;
      }
      const job =
        employerJobs.find((item) => String(item.id) === String(jobId)) ||
        jobs.find((item) => String(item.id || item._id) === String(jobId)) ||
        null;
      if (!job) {
        toast.info('Open Jobs → Bids to increase the rate for this job');
        handleViewBids(shift);
        return;
      }
      setRateJob(job);
      rateDialog.onTrue();
    },
    [employerJobs, handleViewBids, jobs, rateDialog]
  );

  const handleCloseIncreaseRate = useCallback(() => {
    rateDialog.onFalse();
    setRateJob(null);
  }, [rateDialog]);

  const findShiftReview = useCallback(
    (shift, member) => {
      const bookingKey = String(shift?.bookingId || shift?.apiId || shift?.id || '').trim();
      const workerKey = String(shift?.workerId || member?.id || '').trim();
      return (
        pickApiReview(shift?.raw || {}) ||
        (bookingKey && reviewsByObjectId.get(`booking:${bookingKey}`)) ||
        (workerKey && reviewsByObjectId.get(`user:${workerKey}`)) ||
        null
      );
    },
    [reviewsByObjectId]
  );

  const handleRateWorker = useCallback(
    (shift, member) => {
      const existing = findShiftReview(shift, member);
      const jobLike = buildReviewJobFromShift(shift, member, existing);
      if (!jobLike) {
        toast.info('Unable to rate this shift');
        return;
      }
      const target = resolveJobReviewTarget(jobLike);
      if (!target?.objectId) {
        toast.info('No booking linked to this shift yet');
        return;
      }
      setReviewJob(jobLike);
      reviewDialog.onTrue();
    },
    [findShiftReview, reviewDialog]
  );

  const handleOpenCancelBooking = useCallback((shift, member) => {
    setCancelBookingTarget({ shift, member });
  }, []);

  const handleConfirmCancelBooking = useCallback(async () => {
    const id = String(cancelBookingTarget?.shift?.bookingId || '').trim();
    if (!id) {
      toast.error('Booking not found for this shift.');
      return;
    }
    try {
      await cancelCareHomeBooking(id).unwrap();
      toast.success('Booking cancelled');
      setCancelBookingTarget(null);
    } catch (error) {
      toast.error(handleApiError(error));
    }
  }, [cancelBookingTarget, cancelCareHomeBooking]);

  const handleCloseReviewDialog = useCallback(() => {
    reviewDialog.onFalse();
    setReviewJob(null);
  }, [reviewDialog]);

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
          toast.success('Rating updated');
        } else {
          await createReview({
            reviewType: target.reviewType,
            objectId: target.objectId,
            rating,
            comment,
          }).unwrap();
          toast.success('Worker rated');
        }
        handleCloseReviewDialog();
        refetchReviews?.();
      } catch (err) {
        toast.error(err?.data?.message || err?.error || err?.message || 'Could not save rating');
      }
    },
    [createReview, handleCloseReviewDialog, refetchReviews, reviewJob, updateReview]
  );

  const handleSubmitIncreaseRate = useCallback(
    async ({ job, nextRate }) => {
      if (!job?.id) throw new Error('Job not found');

      const draft = jobToDraft(job);
      const rateValue = String(nextRate);
      const nextDraft = {
        ...draft,
        hourlyRate: rateValue,
        schedules: (draft.schedules || []).map((entry) => ({
          ...entry,
          hourlyRate: rateValue,
        })),
      };

      const branch =
        branches.find((item) => item.id === nextDraft.branchId) ||
        branches.find((item) => item._id === nextDraft.branchId) ||
        null;

      if (!nextDraft.branchId || !branch) {
        throw new Error(
          'Please select a location on the job first'
        );
      }

      const body = buildCareHomeJobPayload(
        {
          ...nextDraft,
          location: branch?.location || nextDraft.location,
        },
        branch,
        { includeStatus: true, isUser: isUserApi }
      );

      if (!body.shift?.length) throw new Error('This job has no shifts to update');

      try {
        await updateJob({ id: job.id, ...body }).unwrap();
      } catch (err) {
        if (!isJobCreateSoftError(err)) throw err;
      }

      toast.success(`Rate updated to ${fCurrency(nextRate)}/h`);
      employerJobsQuery.refetch?.();
    },
    [branches, employerJobsQuery, isUserApi, updateJob]
  );

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

  return (
    <ShiftReviewLookupContext.Provider value={findShiftReview}>
      <ShiftCancelBookingContext.Provider value={isCareHomeApi && !viewOnly ? handleOpenCancelBooking : null}>
        <DashboardContent
          disablePadding
          maxWidth={false}
          sx={{
            height: isMobile ? 'auto' : 'calc(100dvh - var(--layout-header-desktop-height) - 8px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            minHeight: 0,
            position: 'relative',
          }}
        >
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
              hideLocationPicker={isUserApi}
              onLocationChange={(val) => {
                setLocation(val);
                if (siteSwitcherEnabled) setActiveBranchId(val);
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
              onBack={() => {
                setShowStaffDetail(false);
                setFocusedShiftDate('');
              }}
              onAddJob={viewOnly ? undefined : handleSidebarAddJob}
              isMobile={isMobile}
              postedJobs={postedJobs}
              postedJobsLoading={postedJobsLoading}
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

                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ ml: 0.5 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: 0.5,
                        bgcolor: CARD.unfilledBg,
                        border: `1px solid ${CARD.unfilledBorder}`,
                      }}
                    />
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Unfilled</Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: 0.5,
                        bgcolor: CARD.filledBgAlt,
                        border: `1px solid ${CARD.filledBorderAlt}`,
                      }}
                    />
                    <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Filled</Typography>
                  </Stack>
                </Stack>

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
                        onClick={handleDateHeaderClick}
                        clickHint="Request staff for this date"
                      />
                    );
                  })}
                  <GridRowTail />
                </Box>

                {showCompanyRolesEmpty ? (
                  <Box
                    sx={{
                      position: 'sticky',
                      left: 0,
                      width: '100cqw',
                      maxWidth: '100cqw',
                      boxSizing: 'border-box',
                      px: 3,
                      py: 6,
                      bgcolor: '#fff',
                      zIndex: 2,
                    }}
                  >
                    <EmptyContent
                      filled
                      title="No company roles on this rota yet"
                      description="Shifts are not pre-filled with default roles. Add staff with their roles and teams, then they appear here for your company."
                      action={
                        <Button
                          variant="contained"
                          onClick={() => router.push(staffListPath)}
                          sx={{ mt: 2.5 }}
                        >
                          Open Staff
                        </Button>
                      }
                      sx={{ px: 4, py: 7, minHeight: 360 }}
                    />
                  </Box>
                ) : (
                  <DndContext
                    sensors={teamSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleTeamDragEnd}
                  >
                    <SortableContext
                      items={visibleTeams.map((team) => String(team.id))}
                      strategy={verticalListSortingStrategy}
                    >
                      {visibleTeams.map((team) => (
                        <SortableTeamGroup
                          key={team.id}
                          team={team}
                          days={days}
                          shifts={shifts}
                          selectedStaffId={showStaffDetail ? selectedStaff?.id : null}
                          activeCell={activeCell}
                          formPreview={formPreview}
                          onCellClick={handleCellClick}
                          onStaffSelect={handleStaffSelect}
                          onStaffPick={handleCardStaffPick}
                          onOpenDetails={handleOpenShiftDetails}
                          onViewBids={handleViewBids}
                          onIncreaseRate={viewOnly ? undefined : handleIncreaseRate}
                          onRateWorker={viewOnly ? undefined : handleRateWorker}
                          collapsed={!!collapsed[team.id]}
                          onToggle={() => setCollapsed((p) => ({ ...p, [team.id]: !p[team.id] }))}
                          staffColWidth={staffColWidth}
                          dayColWidth={dayColWidth}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}

                <Box sx={{ flex: 1, minHeight: 32, bgcolor: '#fff' }} />
              </ShiftRotaGridScroll>
            </Box>
          </Box>

          <Menu
            anchorEl={cellActionMenu?.anchorEl}
            open={Boolean(cellActionMenu?.anchorEl)}
            onClose={closeCellActionMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          >
            <MenuItem onClick={handleCellBookShift}>
              <Iconify icon="solar:calendar-add-bold" width={18} sx={{ mr: 1 }} />
              Book shift
            </MenuItem>
            <MenuItem onClick={handleCellDayOff}>
              <Iconify icon="solar:user-block-rounded-bold" width={18} sx={{ mr: 1 }} />
              Person off / day off
            </MenuItem>
          </Menu>

          {!VIEW_ONLY && (
            <AddShiftPopover
              open={shiftForm.open}
              position={shiftForm.position}
              onClose={closeShiftForm}
              formProps={shiftFormCardProps}
            />
          )}

          <PostJobDialog
            open={postJobDialog.value}
            onClose={handleClosePostJob}
            onSubmit={handleSubmitJob}
            initialDraft={postJobInitialDraft}
            mode={apiRole}
            intent={postJobIntent}
            typeFieldLabel="Role"
            calendarTeamLabels={siteRoleLabels}
          />

          <IncreaseJobRateDialog
            open={rateDialog.value}
            job={rateJob}
            onClose={handleCloseIncreaseRate}
            onSubmit={handleSubmitIncreaseRate}
          />

          <LeaveJobReviewDialog
            open={reviewDialog.value}
            job={reviewJob}
            onClose={handleCloseReviewDialog}
            onSubmit={handleSubmitReview}
            submitting={creatingReview || updatingReview}
          />

          <PersonOffDialog
            open={personOffState.open}
            onClose={handleClosePersonOff}
            staff={personOffState.staff}
            date={personOffState.date}
            dateLabel={
              personOffState.date
                ? format(parse(personOffState.date, 'yyyy-MM-dd', new Date()), 'EEE d MMM yyyy')
                : ''
            }
            onConfirm={handleConfirmPersonOff}
          />

          <ConfirmDialog
            open={Boolean(cancelBookingTarget)}
            onClose={() => setCancelBookingTarget(null)}
            title="Cancel booking"
            content={
              <>
                Cancel{' '}
                <strong>
                  {cancelBookingTarget?.member?.name || cancelBookingTarget?.shift?.displayName || 'this worker'}
                </strong>
                {cancelBookingTarget?.shift?.date
                  ? ` on ${format(parse(cancelBookingTarget.shift.date, 'yyyy-MM-dd', new Date()), 'EEE d MMM yyyy')}`
                  : ''}
                ? If nobody has checked in, you are refunded in full.
              </>
            }
            action={
              <Button
                variant="contained"
                color="error"
                onClick={handleConfirmCancelBooking}
                disabled={isCancellingBooking}
              >
                {isCancellingBooking ? 'Cancelling…' : 'Cancel booking'}
              </Button>
            }
          />
        </DashboardContent>
      </ShiftCancelBookingContext.Provider>
    </ShiftReviewLookupContext.Provider>
  );
}
