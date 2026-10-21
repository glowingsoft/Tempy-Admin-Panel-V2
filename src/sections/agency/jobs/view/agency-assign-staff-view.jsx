import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';
import { toast } from 'src/components/snackbar';
import { DashboardContent } from 'src/layouts/dashboard';
import { hideScrollY } from 'src/theme/styles/mixins';
import { fCurrency } from 'src/utils/format-number';

import { getJobApiErrorMessage } from 'src/sections/care-home/jobs/care-home-job-api-utils';

import { useGetAgencyStaffQuery } from 'src/store/Reducer/agency-staff-api';
import { useGetHomeCareCompanyStaffQuery } from 'src/store/Reducer/home-care-company-staff-api';
import {
  agencyAvailabilityApi,
  useCreateAgencyBookingMutation,
} from 'src/store/Reducer/agency-availability-api';
import {
  homeCareCompanyAvailabilityApi,
  useCreateHomeCareCompanyBookingMutation,
} from 'src/store/Reducer/home-care-company-availability-api';
import { agencyJobsApi } from 'src/store/Reducer/agency-jobs-api';
import { agencyBidsApi } from 'src/store/Reducer/agency-bids-api';
import { homeCareCompanyJobsApi } from 'src/store/Reducer/home-care-company-jobs-api';
import { homeCareCompanyBidsApi } from 'src/store/Reducer/home-care-company-bids-api';

import { AgencyJobStaffBlock } from '../agency-job-staff-block';
import { AgencyJobCalendarBlock } from '../agency-job-calendar-block';
import { AssignStaffPopover } from '../agency-assign-staff-popover';
import {
  SHIFT_LEGEND,
  buildInitialShiftSelection,
  findStaffById,
  formatDayRangeLabel,
  formatDistanceKm,
  formatShiftLabel,
  getCategoriesForJob,
  getDaysForJob,
  getDistanceKm,
  getInitialSelectedCell,
  getShiftStatusLabel,
  readAcceptedBidId,
  resolveAssignScreenMode,
  resolveAssignViewMode,
  withStaffDistances,
} from '../agency-assign-staff-utils';

import { AGENCY_JOB_TABS } from 'src/_mock/_agency-jobs';

const SIDEBAR_W = 280;

function isMongoObjectId(value) {
  return /^[a-f\d]{24}$/i.test(String(value || '').trim());
}

function initialsFromName(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function resolveWorkerId(staff) {
  const candidates = [
    staff?.staffId,
    staff?.workerId,
    staff?.raw?.staffId,
    staff?.raw?.workerId,
    staff?.raw?.staff?._id,
    staff?.id,
  ];
  for (const candidate of candidates) {
    const id = String(candidate || '').trim();
    if (isMongoObjectId(id)) return id;
  }
  return '';
}

function mapApiStaffToAssignRoster(list = []) {
  return (Array.isArray(list) ? list : [])
    .filter((member) => member?.id && !member?.isVacant)
    .map((member, index) => {
      const worked = Number(member.totalHoursWorked ?? member.weeklyHours ?? 0) || 0;
      const allowed = Number(member.hoursAllowed ?? 60) || 60;
      const lat = Number(member.latitude);
      const lng = Number(member.longitude);
      const workerId = resolveWorkerId(member);
      return {
        id: member.id,
        staffId: member.staffId || member.id,
        workerId,
        name: member.name || 'Staff',
        hours: `${worked}h/${allowed}h this week`,
        rating: Number(member.rating ?? 0) || 0,
        reviews: Number(member.reviewCount ?? 0) || 0,
        avatarUrl: member.avatarUrl || '',
        initials: initialsFromName(member.name),
        rowBg: index % 2 === 0 ? '#eef5fc' : '#f5faf5',
        latitude: Number.isFinite(lat) && lat !== 0 ? lat : null,
        longitude: Number.isFinite(lng) && lng !== 0 ? lng : null,
      };
    })
    .filter((member) => member.workerId || member.id);
}

function ShiftLegend({ items }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, auto)',
        gap: 1,
        columnGap: 2.5,
        rowGap: 0.75,
        justifyContent: 'flex-end',
        maxWidth: 520,
      }}
    >
      {items.map((item) => (
        <Stack key={item.label} direction="row" alignItems="center" spacing={0.5} sx={{ whiteSpace: 'nowrap' }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: 0.5,
              flexShrink: 0,
              bgcolor: item.color,
              border: item.border
                ? `1px solid ${item.border}`
                : item.color === '#bdbdbd'
                  ? '1px solid #9e9e9e'
                  : 'none',
            }}
          />
          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

function JobCategorySection({
  category,
  days,
  dateRangeLabel,
  viewMode,
  expanded,
  onToggle,
  onPrevPeriod,
  onNextPeriod,
  jobShiftSelection,
  onSelectShift,
  assignments,
  onAssign,
  onCellSelect,
  gridCells,
  onCalendarCellClick,
  cellRefs,
  readOnly,
  staffList,
  assigning,
}) {
  return (
    <Box sx={{ mb: 1 }}>
      <Box
        onClick={onToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.25,
          px: 1,
          cursor: 'pointer',
          borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}`,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify
            icon={expanded ? 'eva:arrow-ios-downward-fill' : 'eva:arrow-ios-forward-fill'}
            width={18}
          />
          <Typography variant="subtitle1" fontWeight={700}>
            {category.title}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onPrevPeriod?.();
            }}
          >
            <Iconify icon="eva:arrow-ios-back-fill" width={16} />
          </IconButton>
          <Typography variant="caption" fontWeight={600}>
            {dateRangeLabel}
          </Typography>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onNextPeriod?.();
            }}
          >
            <Iconify icon="eva:arrow-ios-forward-fill" width={16} />
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 1, py: 1.5, opacity: assigning ? 0.7 : 1, pointerEvents: assigning ? 'none' : 'auto' }}>
          {category.jobs.map((jobItem) =>
            viewMode === 'agency' ? (
              <AgencyJobStaffBlock
                key={jobItem.id}
                categoryId={category.id}
                categoryTitle={category.title}
                jobItem={jobItem}
                days={days}
                selectedShiftId={jobShiftSelection[`${category.id}-${jobItem.id}`]}
                onSelectShift={onSelectShift}
                assignments={assignments}
                onAssign={onAssign}
                onCellSelect={onCellSelect}
                readOnly={readOnly}
                staffList={staffList}
              />
            ) : (
              <AgencyJobCalendarBlock
                key={jobItem.id}
                categoryId={category.id}
                jobItem={jobItem}
                days={days}
                gridCells={gridCells}
                onCellClick={onCalendarCellClick}
                cellRefs={cellRefs}
                readOnly={readOnly}
                staffList={staffList}
              />
            )
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

// ----------------------------------------------------------------------

export function AgencyAssignStaffView({
  job,
  currentTab = 'active',
  onBack,
  onTabChange,
  mode = 'agency',
}) {
  const dispatch = useDispatch();
  const isHomeCareCompany = mode === 'homeCareCompany';
  const screenMode = useMemo(() => resolveAssignScreenMode(job), [job]);
  const isViewOnly = screenMode === 'viewStaff';

  const agencyStaffQuery = useGetAgencyStaffQuery(
    { page: 0, limit: 200, status: 'active' },
    { skip: isHomeCareCompany }
  );
  const hccStaffQuery = useGetHomeCareCompanyStaffQuery(
    { page: 0, limit: 200, status: 'active' },
    { skip: !isHomeCareCompany }
  );

  const staffResponse = isHomeCareCompany ? hccStaffQuery.data : agencyStaffQuery.data;
  const staffLoading = isHomeCareCompany ? hccStaffQuery.isFetching : agencyStaffQuery.isFetching;

  const [createAgencyBooking, agencyAssignState] = useCreateAgencyBookingMutation();
  const [createHccBooking, hccAssignState] = useCreateHomeCareCompanyBookingMutation();
  const assigning = isHomeCareCompany ? hccAssignState.isLoading : agencyAssignState.isLoading;

  const assignStaffList = useMemo(
    () => mapApiStaffToAssignRoster(staffResponse?.data),
    [staffResponse?.data]
  );

  const [viewMode, setViewMode] = useState(() => resolveAssignViewMode(job));
  const [dayOffset, setDayOffset] = useState(0);
  const visibleCategories = useMemo(() => getCategoriesForJob(job), [job]);
  const visibleDays = useMemo(() => getDaysForJob(job, dayOffset), [job, dayOffset]);
  const dateRangeLabel = useMemo(() => formatDayRangeLabel(visibleDays), [visibleDays]);
  const acceptedBidId = useMemo(() => readAcceptedBidId(job), [job]);

  const jobMeta = useMemo(
    () => ({
      image: job?.image || '',
      address: job?.address || '',
      latitude: job?.latitude ?? null,
      longitude: job?.longitude ?? null,
      gender: job?.gender || '',
      postedBy: job?.postedBy || { name: '', avatarUrl: '' },
      rating: job?.rating ?? 0,
      reviewCount: job?.reviewCount ?? 0,
      totalPay: job?.totalPay ?? 0,
      hourlyRate: job?.hourlyRate ?? 0,
      postedDate: job?.schedule || '',
      title: job?.title || job?.role || 'Job',
    }),
    [job]
  );

  const [selectedShift, setSelectedShift] = useState(() => getInitialSelectedCell(job));
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const categories = getCategoriesForJob(job);
    const first = categories[0];
    return first ? { [first.id]: true } : {};
  });
  const [jobShiftSelection, setJobShiftSelection] = useState(() =>
    buildInitialShiftSelection(getCategoriesForJob(job), job)
  );
  const [assignments, setAssignments] = useState({});
  const [gridCells, setGridCells] = useState({});
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [popoverShiftLabel, setPopoverShiftLabel] = useState('');
  const [popoverCellKey, setPopoverCellKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const cellRefs = useMemo(() => ({ current: {} }), []);

  useEffect(() => {
    const categories = getCategoriesForJob(job);
    setSelectedShift(getInitialSelectedCell(job));
    setJobShiftSelection(buildInitialShiftSelection(categories, job));
    setAssignments({});
    setGridCells({});
    setExpandedCategories(() => {
      const first = categories[0];
      return first ? { [first.id]: true } : {};
    });
  }, [job?.id]);

  const nearestStaffList = useMemo(
    () =>
      withStaffDistances(assignStaffList, {
        latitude: jobMeta.latitude,
        longitude: jobMeta.longitude,
      }),
    [assignStaffList, jobMeta.latitude, jobMeta.longitude]
  );

  useEffect(() => {
    if (selectedStaffId != null) return;
    if (nearestStaffList[0]?.id != null) {
      setSelectedStaffId(nearestStaffList[0].id);
    }
  }, [nearestStaffList, selectedStaffId]);

  const assignedStaff = useMemo(() => {
    const fromSelection = findStaffById(assignStaffList, selectedShift?.assignedStaffId);
    if (fromSelection) return fromSelection;
    return null;
  }, [assignStaffList, selectedShift?.assignedStaffId]);

  const assignedStaffDistance = useMemo(
    () =>
      formatDistanceKm(
        getDistanceKm(
          { latitude: jobMeta.latitude, longitude: jobMeta.longitude },
          assignedStaff
        )
      ),
    [jobMeta.latitude, jobMeta.longitude, assignedStaff]
  );

  const shiftCountLabel = String(job?.shiftRows?.length || 0);

  const toggleCategory = useCallback((id) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleViewModeChange = useCallback((nextMode) => {
    setViewMode(nextMode);
    setPopoverAnchor(null);
  }, []);

  const handlePrevPeriod = useCallback(() => {
    setDayOffset((prev) => prev - 1);
  }, []);

  const handleNextPeriod = useCallback(() => {
    setDayOffset((prev) => prev + 1);
  }, []);

  const handleSelectShift = useCallback((categoryId, jobId, shiftId) => {
    setJobShiftSelection((prev) => ({ ...prev, [`${categoryId}-${jobId}`]: shiftId }));
  }, []);

  const applyLocalAssignment = useCallback((categoryId, jobId, shiftId, date, staffId) => {
    const key = `${categoryId}-${jobId}-${shiftId}`;
    setAssignments((prev) => {
      const shiftMap = { ...(prev[key] || {}) };
      shiftMap[date] = staffId == null ? null : staffId;
      return { ...prev, [key]: shiftMap };
    });

    setGridCells((prev) => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [jobId]: {
          ...prev[categoryId]?.[jobId],
          [shiftId]: {
            ...prev[categoryId]?.[jobId]?.[shiftId],
            [date]: staffId
              ? { status: 'upcoming', staffId }
              : { status: 'empty', staffId: null },
          },
        },
      },
    }));
  }, []);

  const persistAssignment = useCallback(
    async (staffMember) => {
      const workerId = resolveWorkerId(staffMember);
      if (!isMongoObjectId(acceptedBidId)) {
        toast.error('Missing accepted bid for this shift — assign from Active jobs after the bid is accepted.');
        return false;
      }
      if (!isMongoObjectId(workerId)) {
        toast.error('Select a valid staff member to assign');
        return false;
      }

      try {
        const body = { bid: acceptedBidId, worker: workerId };
        if (isHomeCareCompany) {
          await createHccBooking(body).unwrap();
          dispatch(
            homeCareCompanyAvailabilityApi.util.invalidateTags([
              { type: 'HomeCareCompanyBookingCalendar', id: 'LIST' },
            ])
          );
          dispatch(homeCareCompanyJobsApi.util.invalidateTags([{ type: 'HomeCareCompanyJob', id: 'LIST' }]));
          dispatch(homeCareCompanyBidsApi.util.invalidateTags([{ type: 'HomeCareCompanyBid', id: 'LIST' }]));
        } else {
          await createAgencyBooking(body).unwrap();
          dispatch(
            agencyAvailabilityApi.util.invalidateTags([{ type: 'AgencyBookingCalendar', id: 'LIST' }])
          );
          dispatch(agencyJobsApi.util.invalidateTags([{ type: 'AgencyJob', id: 'LIST' }]));
          dispatch(agencyBidsApi.util.invalidateTags([{ type: 'AgencyBid', id: 'LIST' }]));
        }
        toast.success('Staff assigned — check Shifts calendar');
        return true;
      } catch (err) {
        toast.error(
          getJobApiErrorMessage(err) ||
          err?.data?.message ||
          err?.error ||
          err?.message ||
          'Failed to assign staff'
        );
        return false;
      }
    },
    [acceptedBidId, createAgencyBooking, createHccBooking, dispatch, isHomeCareCompany]
  );

  const handleAssign = useCallback(
    async (categoryId, jobId, shiftId, date, staffId) => {
      if (isViewOnly || assigning) return;

      if (staffId == null) {
        applyLocalAssignment(categoryId, jobId, shiftId, date, null);
        return;
      }

      const staffMember = findStaffById(assignStaffList, staffId);
      if (!staffMember) {
        toast.error('Staff member not found');
        return;
      }

      const ok = await persistAssignment(staffMember);
      if (!ok) return;

      applyLocalAssignment(categoryId, jobId, shiftId, date, staffId);
      setSelectedShift((prev) => ({
        ...prev,
        categoryId,
        jobId,
        shiftId,
        date,
        assignedStaffId: staffId,
        status: 'Upcoming Shift',
      }));
    },
    [applyLocalAssignment, assignStaffList, assigning, isViewOnly, persistAssignment]
  );

  const handleCellSelect = useCallback(
    ({ categoryId, jobId, shiftId, date, staffId }) => {
      const shiftRows = visibleCategories.flatMap((category) =>
        category.jobs.flatMap((item) => item.shiftRows || [])
      );
      const label = formatShiftLabel(date, shiftId, shiftRows);
      const row = shiftRows.find((item) => String(item.id) === String(shiftId));

      setSelectedShift({
        categoryId,
        jobId,
        shiftId,
        date,
        label,
        duration: row?.startTime && row?.endTime ? `${row.startTime} – ${row.endTime}` : '—',
        break: row?.breakMin ? `${row.breakMin}m` : job?.breakMin ? `${job.breakMin}m` : '—',
        totalCost: row?.totalPay || job?.totalPay || 0,
        hourlyRate: row?.hourlyRate || job?.hourlyRate || 0,
        earning: row?.totalPay || job?.totalPay || 0,
        status: isViewOnly ? 'Assigned Shift' : 'Upcoming Shift',
        assignedStaffId: staffId,
      });
    },
    [isViewOnly, job, visibleCategories]
  );

  const handleCalendarCellClick = useCallback(
    ({ categoryId, jobId, shiftId, date, cell, anchorEl }) => {
      const shiftRows = visibleCategories.flatMap((category) =>
        category.jobs.flatMap((item) => item.shiftRows || [])
      );
      const label = formatShiftLabel(date, shiftId, shiftRows);
      const row = shiftRows.find((item) => String(item.id) === String(shiftId));

      setSelectedShift({
        categoryId,
        jobId,
        shiftId,
        date,
        label,
        duration: row?.startTime && row?.endTime ? `${row.startTime} – ${row.endTime}` : '—',
        break: row?.breakMin ? `${row.breakMin}m` : job?.breakMin ? `${job.breakMin}m` : '—',
        totalCost: row?.totalPay || job?.totalPay || 0,
        hourlyRate: row?.hourlyRate || job?.hourlyRate || 0,
        earning: row?.totalPay || job?.totalPay || 0,
        status: getShiftStatusLabel(cell),
        assignedStaffId: cell?.staffId || null,
      });

      if (!isViewOnly && cell?.status === 'empty' && anchorEl) {
        const rect = anchorEl.getBoundingClientRect();
        setPopoverAnchor({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        setPopoverShiftLabel(label);
        setPopoverCellKey({ categoryId, jobId, shiftId, date });
        setSearchQuery('');
        setSelectedStaffId(nearestStaffList[0]?.id ?? null);
      } else {
        setPopoverAnchor(null);
      }
    },
    [isViewOnly, job, nearestStaffList, visibleCategories]
  );

  const handlePopoverSelectStaff = useCallback(
    async (staffId) => {
      setSelectedStaffId(staffId);
      if (!popoverCellKey || assigning) return;

      const staffMember = findStaffById(assignStaffList, staffId);
      if (!staffMember) {
        toast.error('Staff member not found');
        return;
      }

      const ok = await persistAssignment(staffMember);
      if (!ok) return;

      const { categoryId, jobId, shiftId, date } = popoverCellKey;
      applyLocalAssignment(categoryId, jobId, shiftId, date, staffId);
      setSelectedShift((prev) => ({
        ...prev,
        assignedStaffId: staffId,
        status: 'Upcoming Shift',
      }));
      setPopoverAnchor(null);
    },
    [applyLocalAssignment, assignStaffList, assigning, persistAssignment, popoverCellKey]
  );

  return (
    <DashboardContent
      maxWidth={false}
      disablePadding
      sx={{
        height: { xs: 'auto', md: 'calc(100dvh - var(--layout-header-desktop-height) - 8px)' },
        minHeight: 0,
        overflow: 'auto',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: { md: '100%' }, minHeight: 0 }}>
        <Box
          sx={{
            width: { xs: 1, md: SIDEBAR_W },
            maxHeight: { xs: 320, md: 'none' },
            flexShrink: 0,
            borderRight: (theme) => `1px solid ${theme.vars.palette.divider}`,
            ...hideScrollY,
            overflowY: 'auto',
            bgcolor: 'background.paper',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 2, pb: 1.5 }}>
            <IconButton size="small" onClick={onBack}>
              <Iconify icon="eva:arrow-back-fill" width={22} />
            </IconButton>
            <Typography variant="h6" fontWeight={700}>
              {isViewOnly ? 'View Staff' : 'Assign Staff'}
            </Typography>
          </Stack>

          <Box sx={{ px: 2, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {jobMeta.title}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {jobMeta.postedBy?.name || 'Employer'}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              mx: 2,
              mb: 2,
              border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            {AGENCY_JOB_TABS.map((tab, index) => {
              const isActive = currentTab === tab.value;
              return (
                <Button
                  key={tab.value}
                  onClick={() => onTabChange?.(tab.value)}
                  sx={{
                    py: 1.1,
                    borderRadius: 0,
                    fontSize: '0.8rem',
                    fontWeight: isActive ? 700 : 500,
                    color: 'text.primary',
                    bgcolor: isActive ? '#e3f2fd' : 'background.paper',
                    borderRight: (theme) =>
                      index < AGENCY_JOB_TABS.length - 1
                        ? `1px solid ${theme.vars.palette.divider}`
                        : 'none',
                    '&:hover': {
                      bgcolor: isActive ? '#e3f2fd' : 'action.hover',
                    },
                  }}
                >
                  {tab.label}
                </Button>
              );
            })}
          </Box>

          <Stack direction="row" justifyContent="space-between" sx={{ px: 2, mb: 2 }}>
            {[
              { label: 'Shifts', value: shiftCountLabel },
              { label: 'Rate', value: fCurrency(jobMeta.hourlyRate) },
              { label: 'Pay', value: fCurrency(jobMeta.totalPay) },
            ].map((stat) => (
              <Box key={stat.label} sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  {stat.label}
                </Typography>
              </Box>
            ))}
          </Stack>

          <Box sx={{ mx: 2, mb: 1.5, bgcolor: '#eeeeee', borderRadius: 1.5, p: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              {selectedShift?.label || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Total Earning {fCurrency(selectedShift?.earning)}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
              {staffLoading && !assignedStaff ? (
                <CircularProgress size={24} />
              ) : assignedStaff ? (
                <>
                  <Avatar src={assignedStaff.avatarUrl} sx={{ width: 44, height: 44 }}>
                    {assignedStaff.initials}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {assignedStaff.name}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.25}>
                      <Iconify icon="material-symbols:star" width={14} sx={{ color: '#FFB800' }} />
                      <Typography variant="caption">
                        {assignedStaff.rating} ({assignedStaff.reviews})
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                      {assignedStaff.hours}
                    </Typography>
                    {assignedStaffDistance && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ color: 'primary.main', fontWeight: 700 }}
                      >
                        {assignedStaffDistance} away
                      </Typography>
                    )}
                  </Box>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {isViewOnly ? 'No staff assigned yet' : 'Select staff to assign'}
                </Typography>
              )}
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
              {[
                { icon: 'solar:clock-circle-bold', label: selectedShift?.duration },
                { icon: 'solar:cup-hot-bold', label: selectedShift?.break },
                { icon: 'solar:wallet-money-bold', label: fCurrency(selectedShift?.totalCost) },
                { icon: 'solar:tag-price-bold', label: `${fCurrency(selectedShift?.hourlyRate)}/h` },
              ].map((item) => (
                <Stack key={item.icon} alignItems="center" spacing={0.25}>
                  <Iconify icon={item.icon} width={18} sx={{ color: 'text.secondary' }} />
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                    {item.label}
                  </Typography>
                </Stack>
              ))}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor:
                    selectedShift?.status === 'Needs Replacement'
                      ? '#f44336'
                      : selectedShift?.status === 'Pending Request'
                        ? '#ffeb3b'
                        : selectedShift?.status === 'Staff Did Not Appear'
                          ? '#ff9800'
                          : '#4caf50',
                }}
              />
              <Typography variant="caption" fontWeight={600}>
                {selectedShift?.status || 'Shift'}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ mx: 2, mb: 2, bgcolor: '#eeeeee', borderRadius: 1.5, p: 2 }}>
            <Stack spacing={1.5}>
              <JobMediaThumb
                image={jobMeta.image}
                alt={jobMeta.title}
                width="100%"
                height={140}
              />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Date & Time
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {jobMeta.postedDate || '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Job location
                </Typography>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                  {jobMeta.address || '—'}
                </Typography>
              </Box>

              <Box>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                  <Iconify icon="solar:routing-2-bold" width={16} sx={{ color: 'primary.main' }} />
                  <Typography variant="caption" fontWeight={700} color="text.primary">
                    Nearest staff
                  </Typography>
                </Stack>

                <Stack spacing={0.75}>
                  {staffLoading && !nearestStaffList.length ? (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
                      <CircularProgress size={18} />
                      <Typography variant="caption" color="text.secondary">
                        Loading staff…
                      </Typography>
                    </Stack>
                  ) : null}
                  {!staffLoading && !nearestStaffList.length ? (
                    <Typography variant="caption" color="text.secondary">
                      No active staff found
                    </Typography>
                  ) : null}
                  {nearestStaffList.map((staff, index) => {
                    const isNearest = index === 0;
                    const isSelected = String(staff.id) === String(assignedStaff?.id || '');

                    return (
                      <Stack
                        key={staff.id}
                        direction="row"
                        alignItems="center"
                        spacing={1}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          bgcolor: isNearest ? 'success.lighter' : 'background.paper',
                          border: (theme) =>
                            `1px solid ${isSelected
                              ? theme.vars.palette.primary.main
                              : isNearest
                                ? theme.vars.palette.success.light
                                : theme.vars.palette.divider
                            }`,
                        }}
                      >
                        <Avatar src={staff.avatarUrl} sx={{ width: 28, height: 28, fontSize: 11 }}>
                          {staff.initials}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="caption" fontWeight={700} noWrap>
                            {index + 1}. {staff.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                            {staff.hours}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          sx={{ color: isNearest ? 'success.dark' : 'primary.main', flexShrink: 0 }}
                        >
                          {staff.distanceLabel || '—'}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body2">{jobMeta.gender || '—'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  Posted By
                </Typography>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  <Avatar src={jobMeta.postedBy.avatarUrl || undefined} sx={{ width: 36, height: 36 }}>
                    {jobMeta.postedBy.name?.[0]}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {jobMeta.postedBy.name || '—'}
                    </Typography>
                    <Typography variant="caption">
                      ({jobMeta.rating} ★) ({jobMeta.reviewCount} reviews)
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Box sx={{ flex: 1, ...hideScrollY, overflowY: 'auto', bgcolor: '#fafafa' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ p: 2, pb: 1 }}
          >
            <Box
              sx={{
                display: 'inline-flex',
                border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                borderRadius: 1,
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <Button
                size="small"
                onClick={() => handleViewModeChange('calendar')}
                sx={{
                  borderRadius: 0,
                  px: 2,
                  py: 0.75,
                  fontSize: '0.75rem',
                  fontWeight: viewMode === 'calendar' ? 700 : 500,
                  color: 'text.primary',
                  bgcolor: viewMode === 'calendar' ? '#e3f2fd' : 'background.paper',
                  borderRight: (theme) => `1px solid ${theme.vars.palette.divider}`,
                }}
              >
                Shift Calendar
              </Button>
              <Button
                size="small"
                onClick={() => handleViewModeChange('agency')}
                sx={{
                  borderRadius: 0,
                  px: 2,
                  py: 0.75,
                  fontSize: '0.75rem',
                  fontWeight: viewMode === 'agency' ? 700 : 500,
                  color: 'text.primary',
                  bgcolor: viewMode === 'agency' ? '#e3f2fd' : 'background.paper',
                }}
              >
                Agency Grid
              </Button>
            </Box>

            <Stack direction="row" alignItems="center" spacing={1}>
              {assigning ? <CircularProgress size={18} /> : null}
              <ShiftLegend items={SHIFT_LEGEND} />
            </Stack>
          </Stack>

          <Box sx={{ px: 1, pb: 3 }}>
            {!visibleCategories.length ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No shift data on this job yet.
              </Typography>
            ) : (
              visibleCategories.map((category) => (
                <JobCategorySection
                  key={category.id}
                  category={category}
                  days={visibleDays}
                  dateRangeLabel={dateRangeLabel}
                  viewMode={viewMode}
                  expanded={Boolean(expandedCategories[category.id])}
                  onToggle={() => toggleCategory(category.id)}
                  onPrevPeriod={handlePrevPeriod}
                  onNextPeriod={handleNextPeriod}
                  jobShiftSelection={jobShiftSelection}
                  onSelectShift={handleSelectShift}
                  assignments={assignments}
                  onAssign={handleAssign}
                  onCellSelect={handleCellSelect}
                  gridCells={gridCells}
                  onCalendarCellClick={handleCalendarCellClick}
                  cellRefs={cellRefs}
                  readOnly={isViewOnly}
                  staffList={assignStaffList}
                  assigning={assigning}
                />
              ))
            )}
          </Box>
        </Box>
      </Box>

      {viewMode === 'calendar' && !isViewOnly && (
        <AssignStaffPopover
          anchor={popoverAnchor}
          shiftLabel={popoverShiftLabel}
          staffList={nearestStaffList}
          search={searchQuery}
          onSearchChange={setSearchQuery}
          selectedStaffId={selectedStaffId}
          onSelectStaff={handlePopoverSelectStaff}
          onClose={() => setPopoverAnchor(null)}
        />
      )}
    </DashboardContent>
  );
}
