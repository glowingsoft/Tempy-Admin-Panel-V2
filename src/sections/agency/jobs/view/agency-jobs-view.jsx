import { Component, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Pagination from '@mui/material/Pagination';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter } from 'src/routes/hooks';

import { useTabs } from 'src/hooks/use-tabs';
import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';
import { usePersistedViewMode } from 'src/hooks/use-persisted-view-mode';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';
import { ConfirmDialog } from 'src/components/custom-dialog';
import {
  getStatusTabButtonSx,
  getStatusTabChipSx,
  STATUS_TAB_BUTTON_BASE_SX,
  STATUS_TABS_CONTAINER_SX,
} from 'src/components/table';
import {
  JOB_DATE_FILTERS,
  compareJobsNewestFirst,
  matchesJobDateFilter,
} from 'src/components/jobs/job-date-filters';

import { useGetAgencyJobsQuery } from 'src/store/Reducer/agency-jobs-api';
import {
  useGetAgencyBidsQuery,
  useLazyGetAgencyBidsQuery,
  useCreateAgencyBidMutation,
  useUpdateAgencyBidMutation,
  useDeleteAgencyBidMutation,
} from 'src/store/Reducer/agency-bids-api';
import { useGetHomeCareCompanyJobsQuery } from 'src/store/Reducer/home-care-company-jobs-api';
import {
  useGetHomeCareCompanyBidsQuery,
  useLazyGetHomeCareCompanyBidsQuery,
  useCreateHomeCareCompanyBidMutation,
  useUpdateHomeCareCompanyBidMutation,
  useDeleteHomeCareCompanyBidMutation,
} from 'src/store/Reducer/home-care-company-bids-api';
import { useGetNurseJobsQuery } from 'src/store/Reducer/nurse-jobs-api';
import {
  useGetNurseBidsQuery,
  useLazyGetNurseBidsQuery,
  useCreateNurseBidMutation,
  useUpdateNurseBidMutation,
  useDeleteNurseBidMutation,
} from 'src/store/Reducer/nurse-bids-api';
import {
  useGetNurseBookingsQuery,
  useLazyGetNurseBookingsQuery,
  useLazyGetNurseBookingLogsQuery,
  useCheckInOutNurseBookingMutation,
  useRespondNurseBookingOfferMutation,
} from 'src/store/Reducer/nurse-bookings-api';
import { useCancelAgencyBookingMutation } from 'src/store/Reducer/agency-availability-api';
import { useCancelHomeCareCompanyBookingMutation } from 'src/store/Reducer/home-care-company-availability-api';
import { useCreateNurseBookingMutation } from 'src/store/Reducer/nurse-availability-api';
import { useUploadAwsFileMutation } from 'src/store/Reducer/upload-api';
import { handleApiError } from 'src/store/handleApiError';
import { selectUser } from 'src/store/slices/userSlice';
import { getProfileUserId } from 'src/sections/account/account-profile-utils';
import { loadAgencyJobRequests } from 'src/sections/care-home/jobs/agency-job-request';
import {
  buildAgencyBidBody,
  bidMatchesShift,
  isServerBidId,
  isActiveAgencyBid,
  isAcceptedOrBookedBid,
  canAssignFromAgencyBid,
  canEditAgencyBid,
  normalizeAgencyBidStatus,
  mapAgencyBidMutationResponse,
  buildLocalBidFromCreate,
  findAgencyBidForJobCard,
  resolveAgencyAssignAction,
} from 'src/sections/agency/bids/agency-bid-api-utils';
import {
  buildDirectChatUrl,
  getBidderMessagesPath,
  getPosterParticipantFromJob,
} from 'src/sections/messaging/open-direct-chat';

import { AgencyFindJobCard } from '../agency-find-job-card';
import { AgencyJobsCalendarView } from '../agency-jobs-calendar-view';
import { AgencyJobsMapView } from '../agency-jobs-map-view';
import { AgencyJobBidDialog } from '../agency-job-bid-dialog';
import { AgencyJobCareDetailsDialog } from '../agency-job-care-details-dialog';
import { AgencyBidEditDialog } from '../../bids/agency-bid-edit-dialog';
import { AgencyAssignBookingDialog } from '../agency-assign-booking-dialog';
import { AgencyAssignStaffView } from './agency-assign-staff-view';
import {
  applyJobDistances,
  getAgencyUserLatLng,
  resolveShiftRowTabStatus,
  getSupplierJobApiStatus,
  normalizeBookingStatus,
  parseJobsCount,
  resolveSupplierBookingAction,
  SUPPLIER_JOB_STATUS_TABS,
} from '../agency-job-api-utils';
import {
  getAttendanceFallbackKey,
  getAttendanceKey,
  readAttendance,
  resolveJobAttendance,
} from 'src/sections/staff-member/jobs/staff-member-attendance';
import { StaffMemberAttendanceDialog } from 'src/sections/staff-member/jobs/staff-member-attendance-dialog';
import { JobAttendanceDialog } from 'src/sections/staff-member/jobs/job-attendance-dialog';
import { useLazyGetJobAttendanceBookingsQuery } from 'src/store/Reducer/job-attendance-api';
import { onRealtimeModels } from 'src/realtime/refetch-for-model';
import {
  buildCheckInOutBody,
  compressImageDataUrl,
  dataUrlToFile,
  EMPTY_ATTENDANCE,
  extractBookingIdFromResponse,
  getCheckInId,
  isMongoBookingId,
  findStaffBidForJob,
  mapAttendanceBlock,
  mapBookingUpdateResponse,
  matchNurseBookingId,
  findNurseBookingForShift,
  mergeAttendance,
  pickBookingIdFromBid,
  pickBookingIdOnly,
} from 'src/sections/staff-member/jobs/nurse-checkin-api-utils';
import { StaffMemberCheckInDialog } from 'src/sections/staff-member/jobs/staff-member-check-dialogs';
import { StaffMemberMissedCheckoutDialog } from 'src/sections/staff-member/jobs/staff-member-missed-checkout-dialog';
import { hasStaffShiftEnded } from 'src/sections/staff-member/jobs/staff-member-job-utils';
import { SupplierJobDetailsDialog } from '../supplier-job-details-dialog';
import { getBrowserPosition } from 'src/sections/staff-member/jobs/staff-member-location';
import {
  buildStaffJobRoleFilters,
  countStaffJobsByRole,
  filterStaffJobsByRole,
} from 'src/sections/staff-member/jobs/staff-member-job-filters';
import { useGetSupplierJobRoleChoicesQuery } from 'src/store/Reducer/supplier-job-roles-api';
import {
  EMPTY_JOB_LIST_FILTERS,
  JobListFilterBar,
  hasJobListFilters,
} from 'src/sections/care-home/jobs/job-list-filter-bar';

class JobsAltViewBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {this.state.error.message || 'This view failed to load. Try Grid or List.'}
        </Alert>
      );
    }
    return this.props.children;
  }
}

const ROWS_PER_PAGE_GRID = 15;
const ROWS_PER_PAGE_LIST = 10;

function getJobShiftRows(job) {
  if (job.shiftRows?.length) return job.shiftRows;

  if (job.schedules?.length) {
    return job.schedules.map((label, index) => ({ id: `schedule-${index}`, label }));
  }

  if (job.schedule) {
    return [{ id: 'schedule-0', label: job.schedule }];
  }

  return [];
}

function getJobShiftMeta(job) {
  const row = job.shiftRows?.[0];
  return {
    shiftDate: job.shiftDate || row?.date || '',
    shiftStartTime: job.shiftStartTime || row?.startTime || '',
  };
}

function countUniqueJobs(jobs = []) {
  return new Set(jobs.map((job) => String(job.id || job._id || '')).filter(Boolean)).size;
}

function countUniqueJobsByApiStatus(jobs = []) {
  const sets = {};
  jobs.forEach((job) => {
    const id = String(job.id || job._id || '');
    if (!id) return;
    const key = getSupplierJobApiStatus(job);
    if (!sets[key]) sets[key] = new Set();
    sets[key].add(id);
  });
  return Object.fromEntries(Object.entries(sets).map(([key, set]) => [key, set.size]));
}

function expandJobsByShift(jobs) {
  return jobs.flatMap((job) => {
    const shiftRows = getJobShiftRows(job);

    if (!shiftRows.length) {
      return [
        {
          ...job,
          cardKey: job.id,
          shiftRows: [],
          schedules: undefined,
        },
      ];
    }

    return shiftRows.map((row, index) => {
      const tabStatus = resolveShiftRowTabStatus(job.apiStatus, row);
      const ownershipKnown = row.mine !== undefined;
      const bookingId = (ownershipKnown ? row.bookingId : row.bookingId || job.bookingId) || '';
      const bookingStatus =
        (ownershipKnown ? row.bookingStatus : row.bookingStatus || job.bookingStatus) || '';
      const bookingAttendance =
        (ownershipKnown
          ? row.bookingAttendance
          : row.bookingAttendance || job.bookingAttendance) || null;
      return {
        ...job,
        hasAgreedRate: Boolean(row.hasAgreedRate || job.hasAgreedRate),
        cardKey: `${job.id}__${row.id || index}`,
        shiftRows: [row],
        schedule: row.label,
        schedules: undefined,
        shiftDate: row.date || job.shiftDate,
        shiftStartTime: row.startTime || job.shiftStartTime,
        shiftEndTime: row.endTime || job.shiftEndTime,
        breakType: row.breakType || job.breakType,
        breakMin: row.breakMin != null ? row.breakMin : job.breakMin,
        hourlyRate: row.hourlyRate != null ? row.hourlyRate : job.hourlyRate,
        totalPay: row.totalPay != null ? row.totalPay : job.totalPay,
        bookingId,
        status: tabStatus,
        bookingStatus,
        bookingAttendance,
        actionType:
          tabStatus === 'active' ? resolveSupplierBookingAction(bookingId, bookingStatus) : undefined,
        shiftType:
          job.shiftType === 'Multi Shift' || shiftRows.length > 1
            ? 'Single Shift'
            : job.shiftType || 'Single Shift',
      };
    });
  });
}

export function AgencyJobsView({ mode = 'agency' }) {
  const isStaffMember = mode === 'staffMember';
  const viewOnly = useViewOnly();
  const isHomeCareCompany = mode === 'homeCareCompany';
  const useAgencyApis = mode === 'agency';
  const isSupplierJobs = mode === 'agency' || mode === 'homeCareCompany';
  const canAssignViaModal = mode === 'agency' || mode === 'homeCareCompany';
  const currentUser = useSelector(selectUser);
  const isImpersonating = useSelector((state) => Boolean(state?.impersonation?.isActive));
  const scopeUserId = useSelector((state) => {
    const impersonation = state?.impersonation;
    if (impersonation?.isActive && impersonation?.targetId) {
      return String(impersonation.targetId).trim();
    }
    return getProfileUserId(state?.user?.user);
  });
  const storagePrefix = `${isStaffMember ? 'nurse' : isHomeCareCompany ? 'hcc' : 'agency'}:${scopeUserId || 'anon'}`;
  const router = useRouter();
  const bidderMessagesPath = useMemo(() => getBidderMessagesPath(mode), [mode]);
  const tabs = useTabs('all');

  useEffect(() => {
    if (tabs.value === 'pending') tabs.setValue('all');
  }, [tabs]);
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [listFilters, setListFilters] = useState(EMPTY_JOB_LIST_FILTERS);
  const { viewMode: storedViewMode, setViewMode: persistViewMode } = usePersistedViewMode(
    isStaffMember
      ? 'staff-member-jobs'
      : isHomeCareCompany
        ? 'home-care-company-jobs'
        : 'agency-jobs',
    'grid'
  );
  const [viewMode, setViewMode] = useState(storedViewMode);
  const [bidJob, setBidJob] = useState(null);
  const [bidShift, setBidShift] = useState(null);
  const [bidSubmitError, setBidSubmitError] = useState('');
  const [bidSubmitBlocked, setBidSubmitBlocked] = useState(false);
  const [editingBid, setEditingBid] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [bidToDelete, setBidToDelete] = useState(null);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);
  const [localBidsByShift, setLocalBidsByShift] = useState({});
  const editBidDialog = useBoolean();
  const deleteBidDialog = useBoolean();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`${storagePrefix}-local-bids-by-shift`);
      setLocalBidsByShift(raw ? JSON.parse(raw) : {});
    } catch {
      setLocalBidsByShift({});
    }
  }, [storagePrefix]);

  const [createAgencyBidMutation, agencyCreateState] = useCreateAgencyBidMutation();
  const [updateAgencyBidMutation, agencyUpdateState] = useUpdateAgencyBidMutation();
  const [deleteAgencyBidMutation, agencyDeleteState] = useDeleteAgencyBidMutation();
  const [createHccBidMutation, hccCreateState] = useCreateHomeCareCompanyBidMutation();
  const [updateHccBidMutation, hccUpdateState] = useUpdateHomeCareCompanyBidMutation();
  const [deleteHccBidMutation, hccDeleteState] = useDeleteHomeCareCompanyBidMutation();
  const [createNurseBidMutation, nurseCreateState] = useCreateNurseBidMutation();
  const [updateNurseBidMutation, nurseUpdateState] = useUpdateNurseBidMutation();
  const [deleteNurseBidMutation, nurseDeleteState] = useDeleteNurseBidMutation();

  const createAgencyBid = isStaffMember
    ? createNurseBidMutation
    : isHomeCareCompany
      ? createHccBidMutation
      : createAgencyBidMutation;
  const updateAgencyBid = isStaffMember
    ? updateNurseBidMutation
    : isHomeCareCompany
      ? updateHccBidMutation
      : updateAgencyBidMutation;
  const deleteAgencyBid = isStaffMember
    ? deleteNurseBidMutation
    : isHomeCareCompany
      ? deleteHccBidMutation
      : deleteAgencyBidMutation;
  const isSubmittingBid = isStaffMember
    ? nurseCreateState.isLoading
    : isHomeCareCompany
      ? hccCreateState.isLoading
      : agencyCreateState.isLoading;
  const isUpdatingBid = isStaffMember
    ? nurseUpdateState.isLoading
    : isHomeCareCompany
      ? hccUpdateState.isLoading
      : agencyUpdateState.isLoading;
  const isDeletingBid = isStaffMember
    ? nurseDeleteState.isLoading
    : isHomeCareCompany
      ? hccDeleteState.isLoading
      : agencyDeleteState.isLoading;

  const [jobDetail, setJobDetail] = useState(null);
  const [jobDetailsDialog, setJobDetailsDialog] = useState(null);
  const [assignDialog, setAssignDialog] = useState({ open: false, job: null, bid: null });
  const [careDetailsJob, setCareDetailsJob] = useState(null);
  const [careDetailsTick, setCareDetailsTick] = useState(0);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [attendanceJob, setAttendanceJob] = useState(null);
  const [supplierAttendanceJob, setSupplierAttendanceJob] = useState(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [checkInJob, setCheckInJob] = useState(null);
  const [checkOutJob, setCheckOutJob] = useState(null);
  const [blockingBookingId, setBlockingBookingId] = useState('');
  const [checkInOutNurseBooking] = useCheckInOutNurseBookingMutation();
  const [respondNurseBookingOffer] = useRespondNurseBookingOfferMutation();
  const [cancelAgencyBooking] = useCancelAgencyBookingMutation();
  const [cancelHccBooking] = useCancelHomeCareCompanyBookingMutation();
  const [createNurseBooking] = useCreateNurseBookingMutation();
  const [uploadAwsFile] = useUploadAwsFileMutation();
  const [fetchNurseBookingLogs] = useLazyGetNurseBookingLogsQuery();
  const [fetchNurseBookings] = useLazyGetNurseBookingsQuery();
  const [fetchJobAttendanceBookings] = useLazyGetJobAttendanceBookingsQuery();
  const nurseBookingsQuery = useGetNurseBookingsQuery(
    { page: 0, limit: 200 },
    { skip: !isStaffMember }
  );

  const [browserOrigin, setBrowserOrigin] = useState(null);
  const [directRequests, setDirectRequests] = useState(() =>
    useAgencyApis ? loadAgencyJobRequests() : []
  );

  const profileOrigin = useMemo(() => getAgencyUserLatLng(currentUser), [currentUser]);
  const userOrigin = profileOrigin || browserOrigin;

  useEffect(() => {
    if (!useAgencyApis) return undefined;

    const syncDirectRequests = () => setDirectRequests(loadAgencyJobRequests());
    window.addEventListener('agency-job-requests-updated', syncDirectRequests);
    window.addEventListener('storage', syncDirectRequests);
    return () => {
      window.removeEventListener('agency-job-requests-updated', syncDirectRequests);
      window.removeEventListener('storage', syncDirectRequests);
    };
  }, [useAgencyApis]);

  useEffect(() => {
    if (profileOrigin) return undefined;

    let cancelled = false;
    getBrowserPosition({ timeout: 12000, maximumAge: 120000 })
      .then((position) => {
        if (cancelled) return;
        setBrowserOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      })
      .catch(() => {
      });

    return () => {
      cancelled = true;
    };
  }, [profileOrigin]);

  const jobsQueryArgs = useMemo(
    () => ({
      page: 0,
      limit: 100,
      status: tabs.value === 'all' ? '' : tabs.value,
      dateFilter: dateFilter === 'all' ? '' : dateFilter,
      ...listFilters,
    }),
    [dateFilter, listFilters, tabs.value]
  );

  const { data: jobRoleChoices } = useGetSupplierJobRoleChoicesQuery({
    role: isStaffMember ? 'nurse' : isHomeCareCompany ? 'homeCareCompany' : 'agency',
  });
  const jobTypeOptions = useMemo(
    () => (jobRoleChoices || []).map((item) => ({ id: item.id, label: item.label })),
    [jobRoleChoices]
  );
  const staffRoleFilters = useMemo(() => buildStaffJobRoleFilters(jobRoleChoices || []), [jobRoleChoices]);

  const agencyJobsQuery = useGetAgencyJobsQuery(jobsQueryArgs, {
    skip: !useAgencyApis,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
  });

  const hccJobsQuery = useGetHomeCareCompanyJobsQuery(jobsQueryArgs, {
    skip: !isHomeCareCompany,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
  });

  const nurseJobsQuery = useGetNurseJobsQuery(jobsQueryArgs, {
    skip: !isStaffMember,
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: true,
  });

  const jobsResponse = isStaffMember
    ? nurseJobsQuery.data
    : isHomeCareCompany
      ? hccJobsQuery.data
      : agencyJobsQuery.data;
  const jobsLoading = isStaffMember
    ? nurseJobsQuery.isLoading
    : isHomeCareCompany
      ? hccJobsQuery.isLoading
      : agencyJobsQuery.isLoading;
  const jobsFetching = isStaffMember
    ? nurseJobsQuery.isFetching
    : isHomeCareCompany
      ? hccJobsQuery.isFetching
      : agencyJobsQuery.isFetching;
  const jobsError = isStaffMember
    ? nurseJobsQuery.isError
    : isHomeCareCompany
      ? hccJobsQuery.isError
      : agencyJobsQuery.isError;
  const jobsErrorDetail = isStaffMember
    ? nurseJobsQuery.error
    : isHomeCareCompany
      ? hccJobsQuery.error
      : agencyJobsQuery.error;
  const refetchJobs = isStaffMember
    ? nurseJobsQuery.refetch
    : isHomeCareCompany
      ? hccJobsQuery.refetch
      : agencyJobsQuery.refetch;

  const [statusCountCache, setStatusCountCache] = useState({
    all: 0,
    active: 0,
    inactive: 0,
    completed: 0,
    deleted: 0,
  });
  const [dateCountCache, setDateCountCache] = useState({
    all: 0,
    next24Hours: 0,
    thisWeek: 0,
    nextWeek: 0,
  });

  const agencyBidsQuery = useGetAgencyBidsQuery(
    {
      page: 0,
      limit: 100,
      ...(useAgencyApis && scopeUserId
        ? { userId: scopeUserId, requireOwner: isImpersonating }
        : {}),
    },
    {
      skip: !useAgencyApis || !scopeUserId,
      refetchOnMountOrArgChange: 60,
      refetchOnFocus: false,
      refetchOnReconnect: true,
    }
  );
  const hccBidsQuery = useGetHomeCareCompanyBidsQuery(
    {
      page: 0,
      limit: 100,
      ...(isHomeCareCompany && scopeUserId
        ? { userId: scopeUserId, requireOwner: isImpersonating }
        : {}),
    },
    {
      skip: !isHomeCareCompany || !scopeUserId,
      refetchOnMountOrArgChange: 60,
      refetchOnFocus: false,
      refetchOnReconnect: true,
    }
  );
  const nurseBidsQuery = useGetNurseBidsQuery(
    {
      page: 0,
      limit: 100,
      ...(isStaffMember && scopeUserId
        ? { userId: scopeUserId, requireOwner: isImpersonating }
        : {}),
    },
    {
      skip: !isStaffMember || !scopeUserId,
      refetchOnMountOrArgChange: 60,
      refetchOnFocus: false,
      refetchOnReconnect: true,
    }
  );
  const bidsResponse = isStaffMember
    ? nurseBidsQuery.data
    : isHomeCareCompany
      ? hccBidsQuery.data
      : agencyBidsQuery.data;
  const refetchBids = isStaffMember
    ? nurseBidsQuery.refetch
    : isHomeCareCompany
      ? hccBidsQuery.refetch
      : agencyBidsQuery.refetch;

  const [fetchAgencyBidsLazy] = useLazyGetAgencyBidsQuery();
  const [fetchHccBidsLazy] = useLazyGetHomeCareCompanyBidsQuery();
  const [fetchNurseBidsLazy] = useLazyGetNurseBidsQuery();
  const fetchAgencyBids = isStaffMember
    ? fetchNurseBidsLazy
    : isHomeCareCompany
      ? fetchHccBidsLazy
      : fetchAgencyBidsLazy;

  useEffect(() => {
    try {
      sessionStorage.setItem(`${storagePrefix}-local-bids-by-shift`, JSON.stringify(localBidsByShift));
    } catch {
    }
  }, [localBidsByShift, storagePrefix]);

  useEffect(() => {
    const apiBids = bidsResponse?.data;
    if (!apiBids?.length) return;

    setLocalBidsByShift((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.entries(prev).forEach(([shiftId, local]) => {
        if (!local || !canEditAgencyBid(local)) return;
        const api = apiBids.find((b) => bidMatchesShift(b, shiftId, local.jobId || local.job || ''));
        if (!api || canEditAgencyBid(api)) return;
        next[shiftId] = {
          ...local,
          ...api,
          id: api.id || api._id || local.id,
          _id: api._id || api.id || local._id,
          status: normalizeAgencyBidStatus(api.status),
        };
        changed = true;
      });

      return changed ? next : prev;
    });
  }, [bidsResponse?.data]);


  const bidsByShiftId = useMemo(() => {
    const map = new Map();
    const apiBids = bidsResponse?.data || [];

    apiBids.forEach((bid) => {
      const shiftId = String(bid.shiftId || bid.shift || '');
      if (!shiftId) return;
      const status = normalizeAgencyBidStatus(bid.status);

      if (['withdrawn', 'deleted', 'cancelled', 'canceled'].includes(status)) return;
      map.set(shiftId, bid);
      if (isServerBidId(bid.id || bid._id)) {
        try {
          sessionStorage.setItem(`${storagePrefix}-bid-id:${shiftId}`, String(bid.id || bid._id));
        } catch {
        }
      }
    });

    Object.entries(localBidsByShift).forEach(([shiftId, bid]) => {
      if (!shiftId || !bid) return;
      const key = String(shiftId);
      const existing = map.get(key);
      const localStatus = normalizeAgencyBidStatus(bid.status);

      if (['withdrawn', 'deleted', 'cancelled', 'canceled'].includes(localStatus)) {
        return;
      }

      if (existing && !canEditAgencyBid(existing)) {
        return;
      }

      if (!isActiveAgencyBid(bid) && !canEditAgencyBid(bid)) {
        if (!existing) map.set(key, bid);
        return;
      }

      let apiMatch = existing;
      if (!isServerBidId(apiMatch?.id || apiMatch?._id) && !isServerBidId(bid.id || bid._id)) {
        const jobKey = String(bid.jobId || bid.job || '');
        if (jobKey) {
          apiMatch =
            apiBids.find(
              (b) =>
                isServerBidId(b.id || b._id) &&
                String(b.jobId || b.job || '') === jobKey &&
                (String(b.shiftId || b.shift || '') === key || !b.shiftId)
            ) || apiMatch;
        }
      }

      if (apiMatch && isServerBidId(apiMatch.id || apiMatch._id) && !isServerBidId(bid.id || bid._id)) {
        const id = apiMatch.id || apiMatch._id;
        map.set(key, {
          ...apiMatch,
          ...bid,
          id,
          _id: id,
          status: canEditAgencyBid(apiMatch) ? bid.status || apiMatch.status : apiMatch.status,
          jobId: apiMatch.jobId || bid.jobId,
          shiftId: apiMatch.shiftId || bid.shiftId || key,
        });
        try {
          sessionStorage.setItem(`${storagePrefix}-bid-id:${key}`, String(id));
        } catch {
        }
      } else if (isServerBidId(bid.id || bid._id) || !existing) {
        map.set(key, bid);
      }
    });
    return map;
  }, [bidsResponse?.data, localBidsByShift]);

  const resolveBidId = useCallback(
    async (shiftId, jobId = '', seedId = '') => {
      const key = String(shiftId || '');
      const jobKey = String(jobId || '');
      let bidId = seedId || '';

      if (isServerBidId(bidId)) return String(bidId);

      try {
        const cachedId = sessionStorage.getItem(`${storagePrefix}-bid-id:${key}`);
        if (isServerBidId(cachedId)) return String(cachedId);
      } catch {
      }

      const fromMap = key ? bidsByShiftId.get(key) : null;
      if (isServerBidId(fromMap?.id || fromMap?._id)) {
        return String(fromMap.id || fromMap._id);
      }

      const pickFromList = (list = []) => {
        if (!Array.isArray(list) || !list.length) return '';
        const withId = list.filter((b) => isServerBidId(b.id || b._id));
        const active = withId.filter((b) => isActiveAgencyBid(b));
        const pool = active.length ? active : withId;
        const byShift = key ? pool.find((b) => bidMatchesShift(b, key, jobKey)) : null;
        if (byShift) return String(byShift.id || byShift._id);
        const byJob = jobKey
          ? pool.find((b) => String(b.jobId || b.job || '') === jobKey)
          : null;
        if (byJob) return String(byJob.id || byJob._id);
        if (pool.length === 1) return String(pool[0].id || pool[0]._id);
        return '';
      };

      const fromCache = pickFromList(bidsResponse?.data || []);
      if (fromCache) return fromCache;

      try {
        const filtered = await fetchAgencyBids({
          page: 0,
          limit: 100,
          ...(key ? { shift: key } : {}),
          ...(jobKey ? { job: jobKey } : {}),
        }).unwrap();
        return pickFromList(filtered?.data || []) || '';
      } catch {
        return '';
      }
    },
    [bidsByShiftId, bidsResponse?.data, fetchAgencyBids, storagePrefix]
  );

  const findBidForShift = useCallback(
    async (shiftId, jobId = '', { includeInactive = false, network = true } = {}) => {
      const key = String(shiftId || '');
      if (!key) return null;

      const matchesFilter = (bid) => {
        if (!bid) return false;
        if (!includeInactive && !isActiveAgencyBid(bid)) return false;
        return true;
      };

      const cached = bidsByShiftId.get(key);
      if (cached && matchesFilter(cached) && isServerBidId(cached.id || cached._id)) {
        return cached;
      }

      const pick = (list = []) =>
        list.find(
          (bid) =>
            matchesFilter(bid) &&
            bidMatchesShift(bid, key, jobId) &&
            isServerBidId(bid.id || bid._id)
        ) ||
        list.find((bid) => matchesFilter(bid) && bidMatchesShift(bid, key, jobId)) ||
        null;

      const fromCache = pick(bidsResponse?.data || []);
      if (fromCache) return fromCache;

      if (!network) {
        return cached && matchesFilter(cached) ? cached : null;
      }

      try {
        const filtered = await fetchAgencyBids({
          page: 0,
          limit: 100,
          shift: key,
          ...(jobId ? { job: jobId } : {}),
        }).unwrap();
        const found = pick(filtered?.data || []);
        if (found) return found;
      } catch {
      }

      return cached && matchesFilter(cached) ? cached : null;
    },
    [bidsByShiftId, bidsResponse?.data, fetchAgencyBids]
  );

  const forgetBidForShift = useCallback((shiftId) => {
    const key = String(shiftId || '');
    if (!key) return;
    try {
      sessionStorage.removeItem(`${storagePrefix}-bid-id:${key}`);
    } catch {
    }
    setLocalBidsByShift((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, [storagePrefix]);

  const rememberBidForShift = useCallback((shiftId, bid) => {
    if (!shiftId || !bid) return;
    const key = String(shiftId);
    setLocalBidsByShift((prev) => ({
      ...prev,
      [key]: {
        ...bid,
        shiftId: key,
        status: bid.status || 'pending',
      },
    }));
    const savedId = bid.id || bid._id;
    if (isServerBidId(savedId)) {
      try {
        sessionStorage.setItem(`${storagePrefix}-bid-id:${key}`, String(savedId));
      } catch {
      }
    }
  }, [storagePrefix]);

  useEffect(() => {
    if (!isStaffMember) return;
    setLocalBidsByShift((prev) => {
      let changed = false;
      const next = {};
      Object.entries(prev).forEach(([key, bid]) => {
        if (bid && isServerBidId(bid.id || bid._id)) {
          next[key] = bid;
        } else {
          changed = true;
          try {
            sessionStorage.removeItem(`${storagePrefix}-bid-id:${key}`);
          } catch {
          }
        }
      });
      return changed ? next : prev;
    });
  }, [isStaffMember, storagePrefix]);

  useEffect(() => {
    const apiBids = bidsResponse?.data || [];
    if (!apiBids.length) return;

    setLocalBidsByShift((prev) => {
      let changed = false;
      const next = { ...prev };

      Object.entries(prev).forEach(([shiftKey, local]) => {
        if (!local || isServerBidId(local.id || local._id)) return;

        const match =
          apiBids.find(
            (b) =>
              isActiveAgencyBid(b) &&
              isServerBidId(b.id || b._id) &&
              (String(b.shiftId || b.shift || '') === shiftKey ||
                (local.jobId &&
                  String(b.jobId || b.job || '') === String(local.jobId || local.job || '')))
          ) || null;

        if (!match) return;

        const id = String(match.id || match._id);
        next[shiftKey] = {
          ...local,
          ...match,
          id,
          _id: id,
          bidAmount: local.bidAmount || match.bidAmount,
          notes: local.notes || match.notes,
          note: local.note || match.note,
        };
        changed = true;
        try {
          sessionStorage.setItem(`${storagePrefix}-bid-id:${shiftKey}`, id);
        } catch {
        }
      });

      return changed ? next : prev;
    });
  }, [bidsResponse?.data]);

  const agencyJobs = useMemo(() => {
    const apiJobs = jobsResponse?.data || [];

    if (isStaffMember) {
      return applyJobDistances(apiJobs, userOrigin);
    }

    const apiIds = new Set(apiJobs.map((job) => job.id));
    const incoming = (directRequests || []).filter((job) => job?.id && !apiIds.has(job.id));
    return applyJobDistances([...incoming, ...apiJobs], userOrigin);
  }, [isStaffMember, jobsResponse?.data, userOrigin, directRequests]);

  const listLoading = jobsLoading;

  const jobsRootPath = isStaffMember
    ? paths.dashboard.staffMember.root
    : isHomeCareCompany
      ? paths.dashboard.homeCareCompany.root
      : paths.dashboard.agency.root;

  const expandedJobs = useMemo(() => expandJobsByShift(agencyJobs), [agencyJobs]);

  useEffect(() => {
    if (!isStaffMember) return;
    try {
      localStorage.removeItem('staff-member-job-attendance');
    } catch {
    }
  }, [isStaffMember]);

  const getJobAssignState = useCallback(
    (job) => {
      const shiftId = job?.shiftRows?.[0]?.id || job?.shiftRows?.[0]?._id || '';
      const bid = findAgencyBidForJobCard(bidsByShiftId, {
        shiftId,
        jobId: job?.id || job?._id || '',
      });
      return {
        bid,
        ...resolveAgencyAssignAction({ job, bid }),
      };
    },
    [bidsByShiftId]
  );

  const tabJobs = useMemo(
    () =>
      tabs.value === 'all'
        ? expandedJobs.filter((job) => getSupplierJobApiStatus(job) !== 'deleted')
        : expandedJobs.filter((job) => getSupplierJobApiStatus(job) === tabs.value),
    [expandedJobs, tabs.value]
  );

  useEffect(() => {
    if (jobsLoading || jobsFetching) return;

    const fromApi = parseJobsCount(jobsResponse?.jobsCount);
    const fromList = countUniqueJobsByApiStatus(expandedJobs);
    const currentTotal =
      Number(fromApi.all ?? jobsResponse?.total_length) ||
      countUniqueJobs(
        tabs.value === 'all'
          ? expandedJobs.filter((job) => getSupplierJobApiStatus(job) !== 'deleted')
          : expandedJobs
      );

    setStatusCountCache((prev) => {
      const next = { ...prev, ...fromApi, [tabs.value]: fromApi[tabs.value] ?? currentTotal };
      delete next.pending;
      if (fromApi.all != null) next.all = fromApi.all;
      if (tabs.value === 'all') {
        Object.entries(fromList).forEach(([key, value]) => {
          if (key === 'pending') return;
          if (fromApi[key] == null && value > 0) next[key] = value;
        });
      }
      return next;
    });
  }, [expandedJobs, jobsFetching, jobsLoading, jobsResponse, tabs.value]);

  const tabCounts = statusCountCache;

  const activeCheckInIdsKey = useMemo(
    () =>
      (tabs.value === 'active' ? tabJobs : [])
        .map((job) => pickBookingIdOnly(job))
        .filter(Boolean)
        .sort()
        .join(','),
    [tabs.value, tabJobs]
  );

  useEffect(() => {
    if (!isStaffMember) return;

    const rows = (nurseBookingsQuery.data?.data || []).filter((row) => row.id && row.attendance);
    if (!rows.length) return;

    setAttendanceMap((prev) => {
      const next = { ...prev };
      let changed = false;
      rows.forEach((row) => {
        const mapped = mergeAttendance(mapAttendanceBlock(row.attendance), {
          ...EMPTY_ATTENDANCE,
          bookingStatus: normalizeBookingStatus(row.status),
        });
        const merged = mergeAttendance(mapped, prev[row.id]);
        if (JSON.stringify(merged) === JSON.stringify(prev[row.id])) return;
        next[row.id] = merged;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [isStaffMember, nurseBookingsQuery.data?.data]);

  useEffect(() => {
    if (!isStaffMember || !activeCheckInIdsKey) return undefined;

    const ids = activeCheckInIdsKey.split(',').filter(Boolean);
    let cancelled = false;

    ids.forEach(async (id) => {
      try {
        const attendance = await fetchNurseBookingLogs(id).unwrap();
        if (cancelled) return;
        setAttendanceMap((prev) => ({
          ...prev,
          [id]: mergeAttendance(prev[id], attendance),
        }));
      } catch {
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isStaffMember, activeCheckInIdsKey, fetchNurseBookingLogs]);

  const jobs = useMemo(() => {
    const nurseBookings = nurseBookingsQuery.data?.data || [];
    let list = tabJobs;

    if (isStaffMember) {
      list = filterStaffJobsByRole(list, roleFilter, staffRoleFilters);
    }

    list = (listFilters.sort ? [...list] : [...list].sort(compareJobsNewestFirst))
      .map((listedJob) => {
        let job = listedJob;
        const bid = findAgencyBidForJobCard(bidsByShiftId, {
          shiftId: job?.shiftRows?.[0]?.id || job?.shiftRows?.[0]?._id || '',
          jobId: job?.id || '',
        });

        const ownBooking = isStaffMember ? findNurseBookingForShift(nurseBookings, job, bid) : null;
        if (ownBooking && (!job.bookingId || job.bookingId === ownBooking.id)) {
          job = {
            ...job,
            bookingId: ownBooking.id,
            bookingStatus: job.bookingStatus || normalizeBookingStatus(ownBooking.status),
            bookingAttendance: job.bookingAttendance || ownBooking.attendance || null,
          };
        }

        const bookingId =
          pickBookingIdOnly(job) ||
          (isMongoBookingId(bid?.bookingId) ? String(bid.bookingId) : '') ||
          job.bookingId ||
          '';


        const wonByBid =
          job.status === 'new' && normalizeAgencyBidStatus(bid?.status) === 'accepted';

        const completedWork =
          String(job.apiStatus || '').toLowerCase() === 'completed' ||
          String(job.shiftRows?.[0]?.status || '').toLowerCase() === 'completed' ||
          String(job.bookingStatus || '').toLowerCase() === 'completed';

        const activeWork = job.status === 'active' || wonByBid;

        if (!(activeWork || completedWork) || !canAssignViaModal) {
          return bookingId ? { ...job, bookingId } : job;
        }

        const state = getJobAssignState(job);
        const workAction = ['assignStaff', 'assigned', 'reassign', 'awaitingWorker', 'viewStaff'].includes(
          state.actionType
        );

        if (completedWork && !activeWork && !workAction) {
          return bookingId ? { ...job, bookingId } : job;
        }

        return {
          ...job,
          status: activeWork ? 'active' : job.status,
          bookingId: state.bookingId || bookingId,
          actionType: state.actionType,
        };
      });


    if (tabs.value === 'completed') {
      list = list.filter((job) => {
        const row = job.shiftRows?.[0];
        if (!row) return true;
        return row.status === 'completed' || job.bookingStatus === 'completed';
      });
    }

    return list;
  }, [
    bidsByShiftId,
    canAssignViaModal,
    getJobAssignState,
    isStaffMember,
    listFilters.sort,
    nurseBookingsQuery.data?.data,
    roleFilter,
    staffRoleFilters,
    tabJobs,
    tabs.value,
  ]);

  const staffRoleCounts = useMemo(() => {
    if (!isStaffMember) return {};
    return countStaffJobsByRole(tabJobs, staffRoleFilters);
  }, [isStaffMember, staffRoleFilters, tabJobs]);

  useEffect(() => {
    if (jobsLoading || jobsFetching) return;
    const total = Number(jobsResponse?.total_length) || countUniqueJobs(tabJobs);
    setDateCountCache((prev) => ({ ...prev, [dateFilter]: total }));
  }, [dateFilter, jobsFetching, jobsLoading, jobsResponse, tabJobs]);

  const filterCounts = useMemo(() => {
    const fromApi = parseJobsCount(jobsResponse?.jobsCount);
    return JOB_DATE_FILTERS.reduce((acc, filter) => {
      acc[filter.value] =
        Number(fromApi[filter.value] ?? dateCountCache[filter.value]) || 0;
      return acc;
    }, {});
  }, [dateCountCache, jobsResponse?.jobsCount]);

  const rowsPerPage = viewMode === 'grid' ? ROWS_PER_PAGE_GRID : ROWS_PER_PAGE_LIST;
  const pageCount = Math.ceil(jobs.length / rowsPerPage) || 1;

  const paginatedJobs = useMemo(
    () => jobs.slice((page - 1) * rowsPerPage, page * rowsPerPage),
    [jobs, page, rowsPerPage]
  );

  useEffect(() => {
    setPage(1);
  }, [tabs.value, dateFilter, roleFilter, listFilters]);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleViewModeChange = useCallback((event, nextView) => {
    if (!nextView) return;
    setViewMode(nextView);
    persistViewMode(nextView);
    setPage(1);
  }, [persistViewMode]);

  const handleDateFilterChange = useCallback((nextFilter) => {
    if (nextFilter) {
      setDateFilter(nextFilter);
      setPage(1);
    }
  }, []);

  const handleRoleFilterChange = useCallback((nextFilter) => {
    if (nextFilter) {
      setRoleFilter(nextFilter);
      setPage(1);
    }
  }, []);

  const handleListFiltersChange = useCallback((next) => {
    setListFilters(next);
    setPage(1);
  }, []);

  const hasActiveFilters =
    tabs.value !== 'all' ||
    dateFilter !== 'all' ||
    hasJobListFilters(listFilters) ||
    (isStaffMember && roleFilter !== 'all');

  const handleClearFilters = useCallback(() => {
    tabs.setValue('all');
    setDateFilter('all');
    setRoleFilter('all');
    setListFilters(EMPTY_JOB_LIST_FILTERS);
    setPage(1);
  }, [tabs]);

  const handleCloseBid = useCallback(() => {
    setBidJob(null);
    setBidShift(null);
    setBidSubmitError('');
    setBidSubmitBlocked(false);
  }, []);

  const handleEditBid = useCallback(
    async (bid, job = null, shiftRow = null) => {
      const shiftId = String(
        shiftRow?.id || shiftRow?._id || bid?.shiftId || bid?.shift || ''
      );
      const jobId = String(job?.id || job?._id || bid?.jobId || bid?.job || '');

      const fresh = shiftId
        ? await findBidForShift(shiftId, jobId, { includeInactive: true, network: true })
        : null;
      const effective = fresh || bid;

      if (!canEditAgencyBid(effective)) {
        if (fresh && shiftId) {
          rememberBidForShift(shiftId, {
            ...effective,
            status: normalizeAgencyBidStatus(effective.status),
          });
        }
        toast.error('This offer can no longer be edited (declined or closed)');
        return;
      }

      let bidId = effective?.id || effective?._id || bid?.id || bid?._id || '';
      if (!isServerBidId(bidId)) {
        bidId = await resolveBidId(shiftId, jobId, '');
      }

      if (!isServerBidId(bidId)) {
        toast.error('Bid id nahi mili — Edit nahi ho sakti. Pehle Bid Now se bid add karo.');
        return;
      }

      const hydrated = {
        ...(effective || {}),
        id: String(bidId),
        _id: String(bidId),
        shiftId: shiftId || String(effective?.shiftId || ''),
        jobId: jobId || String(effective?.jobId || ''),
        jobTitle: effective?.jobTitle || job?.title || 'Job',
        careHome: effective?.careHome || job?.postedBy?.name || 'Care home',
        schedule: effective?.schedule || shiftRow?.label || job?.schedule || '',
        notes: effective?.notes || effective?.note || '',
        note: effective?.note || effective?.notes || '',
        bidAmount: Number(effective?.bidAmount ?? effective?.bid ?? 0) || 0,
        status: normalizeAgencyBidStatus(effective?.status || 'pending'),
        hasAgreedRate: Boolean(job?.hasAgreedRate || shiftRow?.hasAgreedRate || effective?.hasAgreedRate),
        agreedHourlyRate: effective?.agreedHourlyRate,
        hours: Number(effective?.hours) || undefined,
        startTime: shiftRow?.startTime || effective?.startTime || job?.shiftStartTime || '',
        endTime: shiftRow?.endTime || effective?.endTime || job?.shiftEndTime || '',
      };

      rememberBidForShift(hydrated.shiftId, hydrated);
      setEditingBid(hydrated);
      setEditingJob(job || null);
      setEditingShift(shiftRow || null);
      editBidDialog.onTrue();
    },
    [editBidDialog, findBidForShift, rememberBidForShift, resolveBidId]
  );

  const handleBid = useCallback(
    async (job, shiftRow) => {
      const shiftId = shiftRow?.id || shiftRow?._id;
      const jobId = job?.id || job?._id;

      if (shiftId) {
        const existing = await findBidForShift(shiftId, jobId, {
          network: false,
          includeInactive: true,
        });
        if (existing && isServerBidId(existing.id || existing._id)) {
          if (canEditAgencyBid(existing)) {
            rememberBidForShift(shiftId, existing);
            await handleEditBid(existing, job, shiftRow);
            return;
          }
          const status = normalizeAgencyBidStatus(existing.status);
          if (status === 'declined' || status === 'accepted') {
            toast.error('This offer can no longer be edited (declined or closed)');
            return;
          }
        }
      }

      setBidSubmitError('');
      setBidSubmitBlocked(false);
      setBidJob(job);
      setBidShift(shiftRow || null);
    },
    [findBidForShift, handleEditBid, rememberBidForShift]
  );

  const handleCloseEditBid = useCallback(() => {
    if (isUpdatingBid) return;
    editBidDialog.onFalse();
    setEditingBid(null);
    setEditingJob(null);
    setEditingShift(null);
  }, [editBidDialog, isUpdatingBid]);

  const handleSaveEditBid = useCallback(
    async (updates) => {
      if (!editingBid) return;

      if (!canEditAgencyBid(editingBid)) {
        toast.error('This offer can no longer be edited (declined or closed)');
        handleCloseEditBid();
        return;
      }

      const shiftId = String(editingBid.shiftId || editingBid.shift || '');
      const bidId = editingBid.id || editingBid._id || '';

      if (!isServerBidId(bidId)) {
        toast.error('Missing bid id — cannot update.');
        return;
      }

      try {
        const response = await updateAgencyBid({
          id: String(bidId),
          bid: Number(updates.bidAmount),
          note: updates.notes ?? editingBid.notes ?? editingBid.note ?? '',
        }).unwrap();

        const nextBid = mapAgencyBidMutationResponse(response, {
          ...editingBid,
          id: bidId,
          _id: bidId,
          bidAmount: updates.bidAmount,
          notes: updates.notes,
          note: updates.notes,
          status: 'pending',
        });

        const savedId = nextBid.id || nextBid._id || bidId;
        const savedShiftId = nextBid.shiftId || shiftId;

        rememberBidForShift(savedShiftId, {
          ...nextBid,
          id: String(savedId),
          _id: String(savedId),
          status: 'pending',
        });

        toast.success(`Bid updated to ${fCurrency(nextBid.bidAmount || updates.bidAmount)}`);
        handleCloseEditBid();
      } catch (error) {
        const message =
          error?.data?.message ||
          error?.error ||
          (typeof error?.data === 'string' ? error.data : null) ||
          'Failed to update bid.';
        const lower = String(message).toLowerCase();
        if (
          editingBid &&
          (lower.includes('reject') ||
            lower.includes('declin') ||
            lower.includes('accept') ||
            lower.includes('already'))
        ) {
          const shiftKey = String(editingBid.shiftId || editingBid.shift || '');
          if (shiftKey) {
            rememberBidForShift(shiftKey, {
              ...editingBid,
              status: lower.includes('accept') ? 'accepted' : 'declined',
            });
          }
          handleCloseEditBid();
        }
        toast.error(message);
      }
    },
    [editingBid, handleCloseEditBid, rememberBidForShift, updateAgencyBid]
  );

  const handleDeleteBidRequest = useCallback(
    async (bid, job = null, shiftRow = null) => {
      if (!canEditAgencyBid(bid) || isAcceptedOrBookedBid(bid) || String(job?.bookingId || '').trim()) {
        toast.error('Accepted bid cannot be deleted. Booking already exists.');
        return;
      }

      const shiftId = String(
        shiftRow?.id || shiftRow?._id || bid?.shiftId || bid?.shift || ''
      );
      const jobId = String(job?.id || job?._id || bid?.jobId || bid?.job || '');

      let bidId = bid?.id || bid?._id || '';
      if (!isServerBidId(bidId)) {
        bidId = await resolveBidId(shiftId, jobId, '');
      }

      if (!isServerBidId(bidId)) {
        toast.error('Bid id nahi mili — Delete nahi ho sakti.');
        return;
      }

      setBidToDelete({
        ...(bid || {}),
        id: String(bidId),
        _id: String(bidId),
        shiftId,
        jobId,
      });
      deleteBidDialog.onTrue();
    },
    [deleteBidDialog, resolveBidId]
  );

  const handleConfirmDeleteBid = useCallback(async () => {
    const shiftId = String(bidToDelete?.shiftId || bidToDelete?.shift || '');
    const bidId = bidToDelete?.id || bidToDelete?._id || '';

    if (!isServerBidId(bidId)) {
      toast.error('Missing bid id — cannot delete.');
      return;
    }

    try {
      await deleteAgencyBid(String(bidId)).unwrap();
      forgetBidForShift(shiftId);
      toast.success('Bid deleted successfully.');
      deleteBidDialog.onFalse();
      setBidToDelete(null);
      try {
        await Promise.all([refetchBids(), refetchJobs()]);
      } catch {
      }
    } catch (error) {
      toast.error(
        error?.data?.message ||
        error?.error ||
        (typeof error?.data === 'string' ? error.data : null) ||
        'Failed to delete bid.'
      );
    }
  }, [bidToDelete, deleteAgencyBid, deleteBidDialog, forgetBidForShift, refetchBids, refetchJobs]);

  const handleSubmitBid = useCallback(
    async (data) => {
      setBidSubmitError('');
      setBidSubmitBlocked(false);

      const amount = Number(data.bidPrice);
      if (!(amount > 0)) {
        toast.error('Enter a valid bid amount');
        return;
      }
      const job = data.job;
      const shiftRow = data.shiftRow || bidShift || job?.shiftRows?.[0];

      const jobId = job?.id || job?._id;
      const shiftId = shiftRow?.id || shiftRow?._id;

      if (!jobId || !shiftId) {
        toast.error('Missing job or shift id — cannot submit bid.');
        return;
      }

      const body = buildAgencyBidBody({
        shiftId,
        jobId,
        bid: amount,
        note: data.notes,
      });

      const saveLocalFromResponse = (response, seed = {}) => {
        const localBid = mapAgencyBidMutationResponse(response, {
          shiftId: String(shiftId),
          jobId: String(jobId),
          bidAmount: amount,
          notes: body.note,
          note: body.note,
          jobTitle: job?.title || 'Job',
          careHome: job?.postedBy?.name || 'Care home',
          schedule: shiftRow?.label || job?.schedule || '',
          image: job?.image || '',
          status: 'pending',
          ...seed,
        });
        rememberBidForShift(shiftId, localBid);
        const savedId = localBid.id || localBid._id;
        if (isServerBidId(savedId)) {
          try {
            sessionStorage.setItem(`${storagePrefix}-bid-id:${shiftId}`, String(savedId));
          } catch {
          }
        }
        return localBid;
      };

      const existing = await findBidForShift(shiftId, jobId, {
        includeInactive: false,
        network: false,
      });
      if (existing && canEditAgencyBid(existing) && isServerBidId(existing.id || existing._id)) {
        try {
          const response = await updateAgencyBid({
            id: existing.id || existing._id,
            bid: Number(amount),
            note: body.note,
          }).unwrap();

          saveLocalFromResponse(response, {
            id: existing.id || existing._id,
            _id: existing.id || existing._id,
            status: 'pending',
          });
          toast.success(`Bid updated to ${fCurrency(amount)}`);
          handleCloseBid();
        } catch (error) {
          const message =
            error?.data?.message ||
            error?.error ||
            (typeof error?.data === 'string' ? error.data : null) ||
            'Failed to update bid.';
          setBidSubmitError(String(message));
        }
        return;
      }

      try {
        const response = await createAgencyBid(body).unwrap();
        let localBid = saveLocalFromResponse(response);

        if (!isServerBidId(localBid.id || localBid._id)) {
          const found = await findBidForShift(shiftId, jobId, {
            includeInactive: false,
            network: true,
          });
          const resolvedId = found?.id || found?._id || '';
          if (isServerBidId(resolvedId)) {
            localBid = { ...localBid, id: resolvedId, _id: resolvedId, status: 'pending' };
            rememberBidForShift(shiftId, localBid);
          }
        }

        toast.success(`Bid of ${fCurrency(amount)} submitted.`);
        handleCloseBid();
      } catch (error) {
        const message =
          error?.data?.message ||
          error?.error ||
          (typeof error?.data === 'string' ? error.data : null) ||
          'Failed to submit bid. Please try again.';

        const messageText = String(message);
        setBidSubmitError(messageText);

        const alreadyExists =
          /already exists/i.test(messageText) ||
          /bid already/i.test(messageText) ||
          /duplicate bid/i.test(messageText);

        if (alreadyExists) {
          setBidSubmitBlocked(true);

          const fromError =
            error?.data?.data || error?.data?.bid || error?.data?.existingBid || null;
          let bid =
            fromError && typeof fromError === 'object'
              ? buildLocalBidFromCreate({ response: fromError, body, job, shiftRow })
              : null;

          let bidId = bid?.id || bid?._id || '';
          if (!isServerBidId(bidId)) {
            const found = await findBidForShift(shiftId, jobId, {
              includeInactive: true,
              network: true,
            });
            if (found) {
              bid = found;
              bidId = found.id || found._id || '';
            }
          }

          rememberBidForShift(shiftId, {
            ...(bid || {}),
            id: isServerBidId(bidId) ? String(bidId) : bid?.id || '',
            _id: isServerBidId(bidId) ? String(bidId) : bid?._id || '',
            shiftId: String(shiftId),
            jobId: String(jobId),
            bidAmount: bid?.bidAmount ?? amount,
            notes: bid?.notes || bid?.note || body.note,
            note: bid?.note || bid?.notes || body.note,
            status: 'pending',
            jobTitle: bid?.jobTitle || job?.title || 'Job',
            careHome: bid?.careHome || job?.postedBy?.name || 'Care home',
            schedule: bid?.schedule || shiftRow?.label || job?.schedule || '',
          });
        }
      }
    },
    [
      bidShift,
      createAgencyBid,
      findBidForShift,
      handleCloseBid,
      rememberBidForShift,
      updateAgencyBid,
    ]
  );

  const handleAssignStaff = useCallback(
    async (job) => {
      if (isStaffMember) return;

      if (canAssignViaModal) {
        const shiftId = job?.shiftRows?.[0]?.id || job?.shiftRows?.[0]?._id || '';
        let bid = findAgencyBidForJobCard(bidsByShiftId, {
          shiftId,
          jobId: job?.id || '',
        });
        let bidId = bid?.id || bid?._id || '';
        if (!isServerBidId(bidId) && shiftId) {
          try {
            bidId = await resolveBidId(shiftId, job?.id || '', '');
            if (isServerBidId(bidId)) {
              bid = { ...(bid || {}), id: bidId, _id: bidId };
            }
          } catch {
          }
        }

        const assignState = resolveAgencyAssignAction({ job, bid });
        if (assignState.actionType === 'assigned' || assignState.actionType === 'awaitingWorker') {
          toast.info('Staff already assigned for this shift');
          return;
        }

        if (assignState.actionType !== 'reassign' && !canAssignFromAgencyBid(bid)) {
          toast.warning(
            normalizeAgencyBidStatus(bid?.status) === 'pending'
              ? 'Bid is still pending — wait until the poster accepts it.'
              : 'No accepted bid for this shift — Active only shows accepted bids ready to assign.'
          );
          return;
        }

        setAssignDialog({ open: true, job, bid });
        return;
      }

      tabs.setValue('active');
      setJobDetail(job);
    },
    [bidsByShiftId, canAssignViaModal, isStaffMember, resolveBidId, tabs]
  );

  const handleCloseAssignDialog = useCallback(
    async (result) => {
      setAssignDialog({ open: false, job: null, bid: null });
      if (result?.assigned) {
        try {
          await Promise.all([refetchJobs(), refetchBids()]);
        } catch {
        }
      }
    },
    [refetchBids, refetchJobs]
  );

  const handleViewStaff = useCallback(
    (job) => {
      if (isStaffMember) return;
      tabs.setValue('active');
      setJobDetail(job);
    },
    [isStaffMember, tabs]
  );

  const handleCheckIn = useCallback((job) => {
    if (hasStaffShiftEnded(job)) {
      toast.error('This shift has already ended, so you can no longer check in.');
      return;
    }
    setCheckInJob(job);
  }, []);

  const handleChatWithPoster = useCallback(
    (job) => {
      const participant = getPosterParticipantFromJob(job);
      if (!participant.id) {
        toast.error('Cannot start chat — job poster profile is missing');
        return;
      }
      router.push(buildDirectChatUrl(bidderMessagesPath, participant));
    },
    [bidderMessagesPath, router]
  );

  const ensureStaffBookingId = useCallback(
    async (job) => {
      const jobId = String(job?.id || job?._id || '').trim();
      const notJobId = (value) => {
        const id = String(value || '').trim();
        return id && id !== jobId ? id : '';
      };

      const bid =
        findAgencyBidForJobCard(bidsByShiftId, {
          shiftId: job?.shiftRows?.[0]?.id || job?.shiftRows?.[0]?._id || '',
          jobId: job?.id || '',
        }) || findStaffBidForJob(bidsResponse?.data || [], job);

      const fromJob = notJobId(pickBookingIdOnly(job));
      if (fromJob) return fromJob;

      const fromBid = notJobId(pickBookingIdFromBid(bid));
      if (fromBid) return fromBid;

      let bookings = nurseBookingsQuery.data?.data || [];
      let fromList = matchNurseBookingId(bookings, job, bid);
      if (fromList) return fromList;

      try {
        const listed = await fetchNurseBookings({
          page: 0,
          limit: 200,
          job: job?.id || '',
          shift: job?.shiftRows?.[0]?.id || '',
        }).unwrap();
        bookings = listed?.data || [];
        fromList = matchNurseBookingId(bookings, job, bid);
        if (fromList) return fromList;
      } catch {
      }

      return '';
    },
    [bidsByShiftId, bidsResponse?.data, fetchNurseBookings, nurseBookingsQuery.data?.data]
  );


  const applyAttendance = useCallback((job, bookingId, attendance) => {
    const keys = [
      String(bookingId || '').trim(),
      getAttendanceKey(job),
      getAttendanceFallbackKey(job),
    ].filter(Boolean);
    if (!keys.length) return;

    setAttendanceMap((prev) => {
      const merged = keys.reduce((acc, key) => mergeAttendance(prev[key], acc), attendance);
      const unchanged = keys.every(
        (key) =>
          prev[key]?.checkInAt === merged.checkInAt &&
          prev[key]?.checkOutAt === merged.checkOutAt &&
          prev[key]?.bookingStatus === merged.bookingStatus &&
          prev[key]?.autoCheckedOut === merged.autoCheckedOut
      );
      if (unchanged) return prev;

      const next = { ...prev };
      keys.forEach((key) => {
        next[key] = merged;
      });
      return next;
    });
  }, []);

  const activeSupplierJobIdsKey = useMemo(
    () =>
      isSupplierJobs && tabs.value === 'active'
        ? [...new Set(tabJobs.map((job) => String(job?.id || '').trim()).filter(Boolean))]
          .sort()
          .join(',')
        : '',
    [isSupplierJobs, tabJobs, tabs.value]
  );

  const [attendanceRealtimeTick, setAttendanceRealtimeTick] = useState(0);
  const tabJobsRef = useRef(tabJobs);
  tabJobsRef.current = tabJobs;

  useEffect(() => {
    if (!isSupplierJobs) return undefined;
    return onRealtimeModels((models) => {
      if (models.includes('booking') || models.includes('job')) {
        setAttendanceRealtimeTick((n) => n + 1);
      }
    });
  }, [isSupplierJobs]);

  useEffect(() => {
    if (!activeSupplierJobIdsKey) return undefined;

    const jobIds = activeSupplierJobIdsKey.split(',').filter(Boolean);
    let cancelled = false;

    jobIds.forEach(async (jobId) => {
      try {
        const rows = await fetchJobAttendanceBookings({ mode, jobId, limit: 50 }).unwrap();
        if (cancelled || !Array.isArray(rows) || !rows.length) return;

        const job = tabJobsRef.current.find((row) => String(row.id) === String(jobId));
        if (!job) return;

        rows.forEach((row) => {
          const attendance = mapAttendanceBlock(row.attendance);
          if (!row.id) return;
          if (!attendance?.checkInAt && !attendance?.checkOutAt && !row.status) return;

          applyAttendance(job, row.id, {
            ...(attendance || EMPTY_ATTENDANCE),
            bookingStatus: normalizeBookingStatus(row.status),
          });
        });
      } catch {
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeSupplierJobIdsKey,
    applyAttendance,
    attendanceRealtimeTick,
    fetchJobAttendanceBookings,
    mode,
  ]);

  const supplierAttendanceJobRef = useRef(supplierAttendanceJob);
  supplierAttendanceJobRef.current = supplierAttendanceJob;

  const handleSupplierAttendanceLoaded = useCallback(
    (records) => {
      const job = supplierAttendanceJobRef.current;
      if (!job || !Array.isArray(records)) return;
      records.forEach((record) => {
        if (!record?.id) return;
        applyAttendance(job, record.id, {
          ...(record.attendance || EMPTY_ATTENDANCE),
          bookingStatus: record.bookingStatus || '',
        });
      });
    },
    [applyAttendance]
  );

  const uploadCheckInAsset = useCallback(
    async (dataUrl, filename) => {
      const raw = String(dataUrl || '');
      if (/^https?:\/\//i.test(raw)) return raw;
      const compressed = /\.png$/i.test(filename) ? raw : await compressImageDataUrl(raw);
      const file = dataUrlToFile(compressed || raw, filename);
      if (!file) throw new Error('Could not prepare the image for upload.');
      const result = await uploadAwsFile(file).unwrap();
      const url = result?.fileUrl || result?.file || '';
      if (!url || !/^https?:\/\//i.test(String(url))) {
        throw new Error('Image upload did not return a file URL.');
      }
      return url;
    },
    [uploadAwsFile]
  );

  const handleConfirmCheckIn = useCallback(
    async ({ job, photoDataUrl, signatureDataUrl, location }) => {
      if (!photoDataUrl || !signatureDataUrl) {
        toast.error('Proof picture and signature are required.');
        throw new Error('Proof picture and signature are required.');
      }

      try {
        const id = await ensureStaffBookingId(job);
        if (!id) {
          const message =
            'Is job ki booking backend pe create nahi hui. Check-in tab chalega jab booking ban jaye.';
          toast.error(message);
          throw new Error(message);
        }

        const [proofPicture, signature] = await Promise.all([
          uploadCheckInAsset(photoDataUrl, 'checkin-proof.jpg'),
          uploadCheckInAsset(signatureDataUrl, 'checkin-signature.png'),
        ]);

        const response = await checkInOutNurseBooking({
          id,
          body: buildCheckInOutBody({
            status: 'checkin',
            location,
            proofPicture,
            signature,
          }),
        }).unwrap();

        toast.success(`Checked in — ${job.title}`);
        setCheckInJob(null);

        const updated = mapBookingUpdateResponse(response);
        applyAttendance(job, id, {
          ...updated,
          checkInAt: updated.checkInAt || new Date().toISOString(),
          checkInProof: updated.checkInProof || proofPicture,
          checkInSignature: updated.checkInSignature || signature,
          bookingStatus: updated.bookingStatus || 'inProgress',
        });

        const attendance = await fetchNurseBookingLogs(id).unwrap().catch(() => null);
        if (attendance) applyAttendance(job, id, attendance);

        try {
          await refetchJobs();
        } catch {
        }
      } catch (error) {
        const raw =
          error?.data?.message ||
          error?.data?.error?.message ||
          (typeof error?.data === 'string' ? error.data : null) ||
          error?.message ||
          'Check-in failed. Please try again.';
        const message = /outside allowed radius/i.test(String(raw))
          ? 'Location outside allowed radius — your GPS is not close enough to the job site. Move nearer to the shift address (or ask the poster to fix the job map pin), then Detect GPS again.'
          : raw;
        const blockingId = String(error?.data?.data?.bookingId || '').trim();
        if (blockingId) {
          setBlockingBookingId(blockingId);
        } else {
          toast.error(message);
        }
        throw new Error(message);
      }
    },
    [
      applyAttendance,
      checkInOutNurseBooking,
      ensureStaffBookingId,
      fetchNurseBookingLogs,
      refetchJobs,
      uploadCheckInAsset,
    ]
  );

  const handleCheckOut = useCallback((job) => {
    setCheckOutJob(job);
  }, []);

  const handleOpenAttendance = useCallback(
    async (job) => {
      setAttendanceJob(job);

      setAttendanceLoading(true);
      try {
        const id = pickBookingIdOnly(job) || (await ensureStaffBookingId(job));
        if (!id) return;


        const listed = await fetchNurseBookings({
          page: 0,
          limit: 200,
          job: job?.id || '',
          shift: job?.shiftRows?.[0]?.id || '',
        })
          .unwrap()
          .catch(() => null);

        const booking = (listed?.data || []).find((row) => String(row.id) === String(id));
        if (booking?.attendance) {
          applyAttendance(
            job,
            id,
            mergeAttendance(mapAttendanceBlock(booking.attendance), {
              ...EMPTY_ATTENDANCE,
              bookingStatus: normalizeBookingStatus(booking.status),
            })
          );
        }

        const logs = await fetchNurseBookingLogs(id).unwrap().catch(() => null);
        if (logs) applyAttendance(job, id, logs);
      } catch {
      } finally {
        setAttendanceLoading(false);
      }
    },
    [applyAttendance, ensureStaffBookingId, fetchNurseBookingLogs, fetchNurseBookings]
  );

  const handleRespondOffer = useCallback(
    async (job, action) => {
      const id = await ensureStaffBookingId(job);
      if (!id) {
        toast.error('Booking not found for this shift.');
        return;
      }
      try {
        await respondNurseBookingOffer({ id, action }).unwrap();
        toast.success(action === 'accept' ? `Shift accepted — ${job.title}` : `Offer declined — ${job.title}`);
        refetchJobs();
      } catch (error) {
        toast.error(handleApiError(error));
      }
    },
    [ensureStaffBookingId, refetchJobs, respondNurseBookingOffer]
  );


  const handleConfirmCancelBooking = useCallback(async () => {
    const job = bookingToCancel;
    const id = String(job?.bookingId || job?.shiftRows?.[0]?.bookingId || '').trim();
    if (!id) {
      toast.error('Booking not found for this shift.');
      return;
    }
    setIsCancellingBooking(true);
    try {
      await (isHomeCareCompany ? cancelHccBooking : cancelAgencyBooking)(id).unwrap();
      toast.success(
        job.actionType === 'awaitingWorker'
          ? `Booking withdrawn — ${job.title}`
          : `Booking cancelled — ${job.title}`
      );
      setBookingToCancel(null);
      await Promise.all([refetchJobs(), refetchBids()]);
    } catch (error) {
      toast.error(handleApiError(error));
    } finally {
      setIsCancellingBooking(false);
    }
  }, [bookingToCancel, cancelAgencyBooking, cancelHccBooking, isHomeCareCompany, refetchBids, refetchJobs]);

  const handleConfirmCheckOut = useCallback(
    async ({ job, photoDataUrl, signatureDataUrl, location }) => {
      try {
        const id = await ensureStaffBookingId(job);
        if (!id) {
          const message =
            'Is job ki booking backend pe create nahi hui. Check-out tab chalega jab booking ban jaye.';
          toast.error(message);
          throw new Error(message);
        }

        const [proofPicture, signature] = await Promise.all([
          photoDataUrl ? uploadCheckInAsset(photoDataUrl, 'checkout-proof.jpg') : null,
          signatureDataUrl ? uploadCheckInAsset(signatureDataUrl, 'checkout-signature.png') : null,
        ]);

        const response = await checkInOutNurseBooking({
          id,
          body: buildCheckInOutBody({
            status: 'checkout',
            location,
            proofPicture,
            signature,
          }),
        }).unwrap();

        toast.success(`Checked out — ${job.title}`);
        setCheckOutJob(null);

        const updated = mapBookingUpdateResponse(response);
        applyAttendance(job, id, {
          ...updated,
          checkOutAt: updated.checkOutAt || new Date().toISOString(),
          checkOutProof: updated.checkOutProof || proofPicture || '',
          checkOutSignature: updated.checkOutSignature || signature || '',
          bookingStatus: updated.bookingStatus || 'completed',
        });

        const attendance = await fetchNurseBookingLogs(id).unwrap().catch(() => null);
        if (attendance) applyAttendance(job, id, attendance);

        try {
          await refetchJobs();
        } catch {
        }
      } catch (error) {
        const message =
          error?.data?.message ||
          error?.data?.error?.message ||
          (typeof error?.data === 'string' ? error.data : null) ||
          error?.message ||
          'Check-out failed. Please try again.';
        toast.error(message);
        throw new Error(message);
      }
    },
    [
      applyAttendance,
      checkInOutNurseBooking,
      ensureStaffBookingId,
      fetchNurseBookingLogs,
      refetchJobs,
      uploadCheckInAsset,
    ]
  );

  const handleBackFromDetail = useCallback(() => {
    setJobDetail(null);
  }, []);

  const handleDetailTabChange = useCallback(
    (tabValue) => {
      tabs.setValue(tabValue);
      if (tabValue !== 'active') {
        setJobDetail(null);
      }
    },
    [tabs]
  );

  const handleViewAllSchedules = useCallback((job) => {
    toast.info(`All schedules for ${job.title}`);
  }, []);

  const handleOpenCareDetails = useCallback((job) => {
    setCareDetailsJob(job);
  }, []);

  const handleOpenJobDetails = useCallback((job) => {
    if (!job) return;
    setJobDetailsDialog(job);
  }, []);

  const handleCloseCareDetails = useCallback((saved) => {
    setCareDetailsJob(null);
    if (saved) setCareDetailsTick((n) => n + 1);
  }, []);

  if (jobDetail && !isStaffMember) {
    return (
      <AgencyAssignStaffView
        job={jobDetail}
        currentTab={tabs.value}
        onBack={handleBackFromDetail}
        onTabChange={handleDetailTabChange}
      />
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
          <Box
            component={RouterLink}
            href={jobsRootPath}
            sx={{ display: 'flex', alignItems: 'center', color: 'text.primary', textDecoration: 'none' }}
          >
            <Iconify icon="eva:arrow-back-fill" width={24} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {isStaffMember ? 'Jobs' : 'Jobs'}
          </Typography>
        </Stack>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={viewMode}
          onChange={handleViewModeChange}
          sx={{
            alignSelf: { xs: 'flex-start', sm: 'center' },
            '& .MuiToggleButton-root': {
              px: { xs: 1, sm: 1.25 },
              py: 0.75,
              borderColor: 'divider',
              '&.Mui-selected': {
                bgcolor: 'primary.lighter',
                color: 'primary.main',
              },
            },
          }}
        >
          <Tooltip title="Grid view">
            <ToggleButton value="grid" aria-label="Grid view">
              <Iconify icon="solar:widget-5-bold" width={18} />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="List view">
            <ToggleButton value="list" aria-label="List view">
              <Iconify icon="solar:list-bold" width={18} />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Calendar view">
            <ToggleButton
              value="calendar"
              aria-label="Calendar view"
              onClick={() => handleViewModeChange(null, 'calendar')}
            >
              <Iconify icon="solar:calendar-bold" width={18} />
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Map view">
            <ToggleButton
              value="map"
              aria-label="Map view"
              onClick={() => handleViewModeChange(null, 'map')}
            >
              <Iconify icon="solar:map-point-bold" width={18} />
            </ToggleButton>
          </Tooltip>
        </ToggleButtonGroup>
      </Stack>

      {jobsError && (
        <Alert
          severity="error"
          sx={{ mb: 2.5 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<Iconify icon="eva:refresh-fill" width={16} />}
              onClick={() => refetchJobs()}
            >
              Retry
            </Button>
          }
        >
          {jobsErrorDetail?.data?.message ||
            jobsErrorDetail?.error ||
            'Could not load jobs. Please try again.'}
        </Alert>
      )}

      <Box sx={{ ...STATUS_TABS_CONTAINER_SX, width: 1, maxWidth: { xs: 1, md: 720 }, mb: 3 }}>
        {SUPPLIER_JOB_STATUS_TABS.map((tab, index) => {
          const isActive = tabs.value === tab.value;
          const tabColor = tab.color || 'default';
          const count = tabCounts[tab.value] ?? 0;

          return (
            <Button
              key={tab.value}
              onClick={() => tabs.setValue(tab.value)}
              sx={{
                ...STATUS_TAB_BUTTON_BASE_SX,
                flex: { xs: '1 0 auto', sm: 1 },
                minWidth: { xs: 88, sm: 0 },
                fontWeight: isActive ? 700 : 500,
                borderRight: (theme) =>
                  index < SUPPLIER_JOB_STATUS_TABS.length - 1
                    ? `1px solid ${theme.vars.palette.divider}`
                    : 'none',
                ...getStatusTabButtonSx(tabColor, isActive),
              }}
            >
              {tab.label}
              <Chip
                label={count}
                size="small"
                sx={{
                  ml: 0.75,
                  height: 20,
                  minWidth: 28,
                  maxWidth: 'none',
                  fontSize: 11,
                  fontWeight: 700,
                  ...getStatusTabChipSx(tabColor, isActive),
                  '& .MuiChip-label': {
                    px: 0.75,
                    overflow: 'visible',
                    textOverflow: 'clip',
                    whiteSpace: 'nowrap',
                  },
                }}
              />
            </Button>
          );
        })}
      </Box>

      <JobListFilterBar
        value={listFilters}
        onChange={handleListFiltersChange}
        jobTypeOptions={jobTypeOptions}
        sx={{ mb: 2.5 }}
      />

      {isStaffMember ? (
        <Stack spacing={1.5} sx={{ mb: 2.5 }}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {staffRoleFilters.map((filter) => {
              const isSelected = roleFilter === filter.value;

              return (
                <Button
                  key={filter.value}
                  size="small"
                  variant={isSelected ? 'contained' : 'outlined'}
                  color={isSelected ? 'secondary' : 'inherit'}
                  onClick={() => handleRoleFilterChange(filter.value)}
                  sx={{
                    borderRadius: 5,
                    px: 1.5,
                    py: 0.75,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: 'divider',
                    ...(!isSelected && {
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                    }),
                  }}
                >
                  {filter.label}
                  <Chip
                    size="small"
                    label={staffRoleCounts[filter.value] || 0}
                    sx={{
                      ml: 1,
                      height: 20,
                      fontSize: 11,
                      bgcolor: isSelected ? 'secondary.contrastText' : 'action.hover',
                      color: isSelected ? 'secondary.main' : 'text.secondary',
                    }}
                  />
                </Button>
              );
            })}
          </Stack>
        </Stack>
      ) : null}

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2.5 }}>
        {JOB_DATE_FILTERS.map((filter) => {
          const isSelected = dateFilter === filter.value;

          return (
            <Button
              key={filter.value}
              size="small"
              variant={isSelected ? 'contained' : 'outlined'}
              color={isSelected ? 'primary' : 'inherit'}
              onClick={() => handleDateFilterChange(filter.value)}
              sx={{
                borderRadius: 5,
                px: 1.5,
                py: 0.75,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'divider',
                ...(!isSelected && {
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                }),
              }}
            >
              {filter.label}
              <Chip
                size="small"
                label={filterCounts[filter.value] || 0}
                sx={{
                  ml: 1,
                  height: 20,
                  fontSize: 11,
                  bgcolor: isSelected ? 'primary.contrastText' : 'action.hover',
                  color: isSelected ? 'primary.main' : 'text.secondary',
                }}
              />
            </Button>
          );
        })}

        <Button
          size="small"
          color="inherit"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          startIcon={<Iconify icon="solar:restart-bold" width={16} />}
          sx={{
            borderRadius: 5,
            px: 1.5,
            minHeight: 36,
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.secondary',
          }}
        >
          Clear filters
        </Button>
      </Stack>

      {listLoading ? (
        <ModuleLoading />
      ) : viewMode === 'calendar' ? (
        <JobsAltViewBoundary>
          <AgencyJobsCalendarView
            jobs={jobs}
            onJobClick={isSupplierJobs ? handleOpenJobDetails : undefined}
          />
        </JobsAltViewBoundary>
      ) : viewMode === 'map' ? (
        <JobsAltViewBoundary>
          <AgencyJobsMapView jobs={jobs} />
        </JobsAltViewBoundary>
      ) : viewMode === 'grid' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 2,
          }}
        >
          {paginatedJobs.map((job) => {
            const shiftId = job.shiftRows?.[0]?.id || job.shiftRows?.[0]?._id;
            const rawBid = shiftId ? bidsByShiftId.get(String(shiftId)) || null : null;
            const existingBid =
              rawBid && isServerBidId(rawBid.id || rawBid._id) ? rawBid : null;

            return (
              <AgencyFindJobCard
                readOnly={viewOnly}
                key={`${job.cardKey || `${job.id}-${job.status}-${job.schedule || job.title}`}-${careDetailsTick}`}
                job={job}
                variant={tabs.value}
                viewMode="grid"
                mode={mode}
                attendance={readAttendance(attendanceMap, job)}
                existingBid={existingBid}
                onBid={handleBid}
                onEditBid={handleEditBid}
                onDeleteBid={handleDeleteBidRequest}
                onAssignStaff={handleAssignStaff}
                onViewStaff={handleViewStaff}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                onRespondOffer={handleRespondOffer}
                onCancelBooking={setBookingToCancel}
                onChat={isStaffMember ? handleChatWithPoster : undefined}
                onViewAllSchedules={handleViewAllSchedules}
                onOpenCareDetails={handleOpenCareDetails}
                onOpenAttendance={
                  (isStaffMember && handleOpenAttendance) ||
                  (isSupplierJobs && setSupplierAttendanceJob) ||
                  undefined
                }
                onOpenJob={isSupplierJobs ? handleOpenJobDetails : undefined}
              />
            );
          })}
        </Box>
      ) : (
        <Stack spacing={1}>
          {paginatedJobs.map((job) => {
            const shiftId = job.shiftRows?.[0]?.id || job.shiftRows?.[0]?._id;
            const rawBid = shiftId ? bidsByShiftId.get(String(shiftId)) || null : null;
            const existingBid =
              rawBid && isServerBidId(rawBid.id || rawBid._id) ? rawBid : null;

            return (
              <AgencyFindJobCard
                readOnly={viewOnly}
                key={`${job.cardKey || `${job.id}-${job.status}-${job.schedule || job.title}`}-${careDetailsTick}`}
                job={job}
                variant={tabs.value}
                viewMode="list"
                mode={mode}
                attendance={readAttendance(attendanceMap, job)}
                existingBid={existingBid}
                onBid={handleBid}
                onEditBid={handleEditBid}
                onDeleteBid={handleDeleteBidRequest}
                onAssignStaff={handleAssignStaff}
                onViewStaff={handleViewStaff}
                onCheckIn={handleCheckIn}
                onCheckOut={handleCheckOut}
                onRespondOffer={handleRespondOffer}
                onCancelBooking={setBookingToCancel}
                onChat={isStaffMember ? handleChatWithPoster : undefined}
                onViewAllSchedules={handleViewAllSchedules}
                onOpenCareDetails={handleOpenCareDetails}
                onOpenAttendance={
                  (isStaffMember && handleOpenAttendance) ||
                  (isSupplierJobs && setSupplierAttendanceJob) ||
                  undefined
                }
                onOpenJob={isSupplierJobs ? handleOpenJobDetails : undefined}
              />
            );
          })}
        </Stack>
      )}

      {!listLoading && !jobs.length && (
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            borderRadius: 2,
            bgcolor: (theme) => theme.vars.palette.grey[100],
            border: (theme) => `1px dashed ${theme.vars.palette.divider}`,
          }}
        >
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            No {tabs.value} jobs found
          </Typography>
        </Box>
      )}

      {!listLoading && viewMode !== 'calendar' && viewMode !== 'map' && jobs.length > rowsPerPage && (
        <Pagination
          page={page}
          count={pageCount}
          shape="circular"
          onChange={handleChangePage}
          sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}
        />
      )}

      <AgencyJobBidDialog
        open={Boolean(bidJob)}
        job={bidJob}
        shiftRow={bidShift}
        rateApiBase={isStaffMember ? '/web/nurse' : isHomeCareCompany ? '/web/home-care-company' : '/web/agency'}
        submitting={isSubmittingBid}
        submitError={bidSubmitError}
        submitBlocked={bidSubmitBlocked}
        onClose={handleCloseBid}
        onSubmit={handleSubmitBid}
      />

      <AgencyJobCareDetailsDialog
        open={Boolean(careDetailsJob)}
        job={careDetailsJob}
        onClose={handleCloseCareDetails}
      />

      <AgencyBidEditDialog
        open={editBidDialog.value}
        bid={editingBid}
        job={editingJob}
        shiftRow={editingShift}
        rateApiBase={isStaffMember ? '/web/nurse' : isHomeCareCompany ? '/web/home-care-company' : '/web/agency'}
        mode="edit"
        submitting={isUpdatingBid}
        onClose={handleCloseEditBid}
        onSubmit={handleSaveEditBid}
      />

      <AgencyAssignBookingDialog
        open={assignDialog.open}
        job={assignDialog.job}
        bid={assignDialog.bid}
        mode={mode}
        onClose={handleCloseAssignDialog}
      />

      <ConfirmDialog
        open={Boolean(bookingToCancel)}
        onClose={() => {
          if (isCancellingBooking) return;
          setBookingToCancel(null);
        }}
        title={bookingToCancel?.actionType === 'awaitingWorker' ? 'Withdraw booking' : 'Cancel booking'}
        content={
          <>
            {bookingToCancel?.actionType === 'awaitingWorker' ? 'Withdraw' : 'Cancel'} the booking for{' '}
            <strong>{bookingToCancel?.title}</strong>? If nobody has checked in, the customer is refunded in full.
          </>
        }
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={isCancellingBooking}
            onClick={handleConfirmCancelBooking}
          >
            {bookingToCancel?.actionType === 'awaitingWorker' ? 'Withdraw' : 'Cancel booking'}
          </LoadingButton>
        }
      />

      <ConfirmDialog
        open={deleteBidDialog.value}
        onClose={() => {
          if (isDeletingBid || isUpdatingBid) return;
          deleteBidDialog.onFalse();
          setBidToDelete(null);
        }}
        title="Delete bid"
        content="Are you sure you want to delete?"
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={isDeletingBid}
            onClick={handleConfirmDeleteBid}
          >
            Delete
          </LoadingButton>
        }
      />

      {isSupplierJobs && (
        <SupplierJobDetailsDialog
          open={Boolean(jobDetailsDialog)}
          job={jobDetailsDialog}
          onClose={() => setJobDetailsDialog(null)}
          showShiftAlert={isStaffMember && !viewOnly}
          showCancelShift={isStaffMember && !viewOnly}
          onCancelled={() => {
            setJobDetailsDialog(null);
            refetchJobs();
            if (isStaffMember) {
              refetchBids();
            }
          }}
        />
      )}

      <JobAttendanceDialog
        open={Boolean(supplierAttendanceJob)}
        mode={mode}
        job={supplierAttendanceJob}
        bookingId={supplierAttendanceJob?.bookingId}
        shiftId={supplierAttendanceJob?.shiftRows?.[0]?.id}
        fallbackAttendance={
          supplierAttendanceJob ? resolveJobAttendance(supplierAttendanceJob, null) : null
        }
        onAttendanceLoaded={handleSupplierAttendanceLoaded}
        onClose={() => setSupplierAttendanceJob(null)}
      />

      {isStaffMember && (
        <>
          <StaffMemberCheckInDialog
            open={Boolean(checkInJob)}
            job={checkInJob}
            onClose={() => setCheckInJob(null)}
            onConfirm={handleConfirmCheckIn}
            mode="checkin"
          />
          <StaffMemberCheckInDialog
            open={Boolean(checkOutJob)}
            job={checkOutJob}
            onClose={() => setCheckOutJob(null)}
            onConfirm={handleConfirmCheckOut}
            mode="checkout"
          />
          <StaffMemberMissedCheckoutDialog
            bookingId={blockingBookingId}
            uploadAsset={uploadCheckInAsset}
            onClose={() => setBlockingBookingId('')}
            onResolved={() => {
              setBlockingBookingId('');
              refetchJobs();
            }}
          />
          <StaffMemberAttendanceDialog
            open={Boolean(attendanceJob)}
            job={attendanceJob}
            attendance={
              attendanceJob
                ? resolveJobAttendance(attendanceJob, readAttendance(attendanceMap, attendanceJob))
                : null
            }
            loading={attendanceLoading}
            onClose={() => setAttendanceJob(null)}
          />
        </>
      )}
    </DashboardContent>
  );
}
