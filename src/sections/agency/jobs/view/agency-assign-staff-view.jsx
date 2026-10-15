import { useCallback, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Collapse from '@mui/material/Collapse';

import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';
import { DashboardContent } from 'src/layouts/dashboard';
import { hideScrollY } from 'src/theme/styles/mixins';
import { fCurrency } from 'src/utils/format-number';

import { AgencyJobStaffBlock } from '../agency-job-staff-block';
import { AgencyJobCalendarBlock } from '../agency-job-calendar-block';
import { AssignStaffPopover } from '../agency-assign-staff-popover';

import { AGENCY_JOB_TABS } from 'src/_mock/_agency-jobs';
import {
  ASSIGN_AGENCIES,
  SHIFT_LEGEND,
  getCategoriesForJob,
  getDaysForJob,
  getInitialSelectedCell,
  getShiftConfig,
  getStaffById,
  getStatsForAgency,
  formatDayRangeLabel,
  formatDistanceKm,
  getDistanceKm,
  resolveAssignViewMode,
  resolveAssignScreenMode,
  withStaffDistances,
} from 'src/_mock/_agency-assign-staff';

const SIDEBAR_W = 280;

const CELL_STATUS_LABELS = {
  upcoming: 'Upcoming Shift',
  completed: 'Completed Shift',
  assigned: 'Assigned Shift',
  replacement: 'Needs Replacement',
  pending: 'Pending Request',
  noshow: 'Staff Did Not Appear',
  empty: 'Unassigned',
};

function getShiftStatusLabel(cell) {
  if (!cell?.status) return 'Shift';
  return CELL_STATUS_LABELS[cell.status] || 'Shift';
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

function formatShiftLabel(dateStr, shiftId) {
  const date = parseISO(dateStr);
  const dayLabel = format(date, 'EEE MMM d');
  if (shiftId === '09a-05p') return `${dayLabel}, 09:00 AM - 05:00 PM`;
  if (shiftId === '02p-06p' || shiftId === '03a-06p') return `${dayLabel}, 02:00 PM - 06:00 PM`;
  if (shiftId === '10p-06a') return `${dayLabel}, 10:00 PM - 06:00 AM`;
  return `${dayLabel}, ${shiftId}`;
}

function buildInitialShiftSelection(categories, activeJob) {
  const selection = {};

  categories.forEach((category) => {
    category.jobs.forEach((jobItem) => {
      const key = `${category.id}-${jobItem.id}`;
      if (activeJob?.id === jobItem.id && activeJob?.assignShift?.shiftId) {
        selection[key] = activeJob.assignShift.shiftId;
      } else if (activeJob?.id === jobItem.id && activeJob?.assignShifts?.shiftIds?.[0]) {
        selection[key] = activeJob.assignShifts.shiftIds[0];
      } else {
        selection[key] = jobItem.shiftRows[0]?.id;
      }
    });
  });

  return selection;
}

function JobCategorySection({
  category,
  days,
  dateRangeLabel,
  viewMode,
  activeJobId,
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
        <Box sx={{ px: 1, py: 1.5 }}>
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
              />
            )
          )}
        </Box>
      </Collapse>
    </Box>
  );
}


export function AgencyAssignStaffView({ job, currentTab = 'active', onBack, onTabChange }) {
  const screenMode = useMemo(() => resolveAssignScreenMode(job), [job]);
  const isViewOnly = screenMode === 'viewStaff';
  // Real agency staff list is not wired into this screen yet — never fall back to mock roster.
  const viewStaffList = useMemo(() => [], []);
  const assignStaffList = useMemo(() => [], []);

  const [viewMode, setViewMode] = useState(() => resolveAssignViewMode(job));
  const [dayOffset, setDayOffset] = useState(0);
  const visibleCategories = useMemo(() => getCategoriesForJob(job), [job]);
  const visibleDays = useMemo(() => getDaysForJob(job, dayOffset), [job, dayOffset]);
  const dateRangeLabel = useMemo(() => formatDayRangeLabel(visibleDays), [visibleDays]);

  const jobMeta = useMemo(
    () => ({
      image: job?.image || '',
      address: job?.address || '',
      latitude: job?.latitude ?? null,
      longitude: job?.longitude ?? null,
      gender: job?.gender || '',
      postedBy: job?.postedBy || null,
      rating: job?.rating ?? 0,
      reviewCount: job?.reviewCount ?? 0,
      totalPay: job?.totalPay ?? 0,
      hourlyRate: job?.hourlyRate ?? 0,
      postedDate: job?.schedule || '',
    }),
    [job]
  );

  const [agency, setAgency] = useState(job?.agencyId || 'careplus');
  const agencyStats = useMemo(() => getStatsForAgency(agency), [agency]);
  const [selectedShift, setSelectedShift] = useState(() => getInitialSelectedCell(job));
  const [expandedCategories, setExpandedCategories] = useState(() => {
    const categories = getCategoriesForJob(job);
    const config = getShiftConfig(job);
    if (config?.categoryId) {
      return { [config.categoryId]: true };
    }
    const first = categories[0];
    return first ? { [first.id]: true } : { 'senior-care-days': true };
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
  const [selectedStaffId, setSelectedStaffId] = useState(1);
  const cellRefs = useMemo(() => ({ current: {} }), []);

  const assignedStaff = useMemo(
    () => getStaffById(selectedShift?.assignedStaffId || 1),
    [selectedShift]
  );

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

  const nearestStaffList = useMemo(
    () =>
      withStaffDistances(assignStaffList, {
        latitude: jobMeta.latitude,
        longitude: jobMeta.longitude,
      }),
    [assignStaffList, jobMeta.latitude, jobMeta.longitude]
  );

  const toggleCategory = useCallback((id) => {
    setExpandedCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
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

  const handleAssign = useCallback((categoryId, jobId, shiftId, date, staffId) => {
    if (isViewOnly) return;

    const key = `${categoryId}-${jobId}-${shiftId}`;
    setAssignments((prev) => {
      const shiftMap = { ...(prev[key] || {}) };
      shiftMap[date] = staffId == null ? null : staffId;
      return { ...prev, [key]: shiftMap };
    });
  }, [isViewOnly]);

  const handleCellSelect = useCallback(({ categoryId, jobId, shiftId, date, staffId }) => {
    const label = formatShiftLabel(date, shiftId);

    setSelectedShift({
      categoryId,
      jobId,
      shiftId,
      date,
      label,
      duration: shiftId === '02p-06p' || shiftId === '03a-06p' ? '4h' : '8h',
      break: '30m',
      totalCost: shiftId === '02p-06p' || shiftId === '03a-06p' ? 60 : 120,
      hourlyRate: job?.hourlyRate || 0,
      earning: job?.totalPay || 0,
      status: isViewOnly ? 'Assigned Shift' : 'Upcoming Shift',
      assignedStaffId: staffId,
    });
  }, [job, isViewOnly]);

  const handleCalendarCellClick = useCallback(({ categoryId, jobId, shiftId, date, cell, anchorEl }) => {
    const label = formatShiftLabel(date, shiftId);

    setSelectedShift({
      categoryId,
      jobId,
      shiftId,
      date,
      label,
      duration: shiftId === '02p-06p' || shiftId === '03a-06p' ? '4h' : '8h',
      break: '30m',
      totalCost: shiftId === '02p-06p' || shiftId === '03a-06p' ? 60 : 120,
      hourlyRate: job?.hourlyRate || 0,
      earning: job?.totalPay || 0,
      status: getShiftStatusLabel(cell),
      assignedStaffId: cell?.staffId || 1,
    });

    if (!isViewOnly && cell?.status === 'empty' && anchorEl) {
      const rect = anchorEl.getBoundingClientRect();
      setPopoverAnchor({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      setPopoverShiftLabel(label);
      setPopoverCellKey({ categoryId, jobId, shiftId, date });
      setSearchQuery('');
      setSelectedStaffId(1);
    } else {
      setPopoverAnchor(null);
    }
  }, [job, isViewOnly]);

  const handlePopoverSelectStaff = useCallback(
    (staffId) => {
      setSelectedStaffId(staffId);
      if (!popoverCellKey) return;

      const { categoryId, jobId, shiftId, date } = popoverCellKey;

      setGridCells((prev) => ({
        ...prev,
        [categoryId]: {
          ...prev[categoryId],
          [jobId]: {
            ...prev[categoryId]?.[jobId],
            [shiftId]: {
              ...prev[categoryId]?.[jobId]?.[shiftId],
              [date]: { status: 'upcoming', staffId },
            },
          },
        },
      }));

      setSelectedShift((prev) => ({
        ...prev,
        assignedStaffId: staffId,
        status: 'Upcoming Shift',
      }));

      setPopoverAnchor(null);
    },
    [popoverCellKey]
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
              {isViewOnly ? 'View Staff' : 'Jobs'}
            </Typography>
          </Stack>

          <Box sx={{ px: 2, mb: 2 }}>
            <FormControl fullWidth size="small">
              <Select
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                sx={{ borderRadius: 1.5, fontSize: '0.875rem' }}
              >
                {ASSIGN_AGENCIES.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
              { label: 'Total Hours', value: agencyStats.hours },
              { label: 'Total Cost', value: agencyStats.cost },
              { label: 'Total Shifts', value: agencyStats.shifts },
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
              {selectedShift?.label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Total Earning {fCurrency(selectedShift?.earning)}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.5 }}>
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
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{
                  color:
                    selectedShift?.status === 'Needs Replacement'
                      ? '#f44336'
                      : selectedShift?.status === 'Pending Request'
                        ? '#fbc02d'
                        : selectedShift?.status === 'Staff Did Not Appear'
                          ? '#ff9800'
                          : '#4caf50',
                }}
              >
                {selectedShift?.status}
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ mx: 2, mb: 2, bgcolor: '#eeeeee', borderRadius: 1.5, p: 2 }}>
            <Stack spacing={1.5}>
              <JobMediaThumb
                image={jobMeta.image}
                alt={job?.title || job?.role || 'Job'}
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
                  {jobMeta.address}
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
                  {nearestStaffList.map((staff, index) => {
                    const isNearest = index === 0;
                    const isSelected = staff.id === assignedStaff?.id;

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
                        <Avatar
                          src={staff.avatarUrl}
                          sx={{ width: 28, height: 28, fontSize: 11 }}
                        >
                          {staff.initials}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={0.5} flexWrap="wrap" useFlexGap>
                            <Typography variant="caption" fontWeight={700} noWrap>
                              {index + 1}. {staff.name}
                            </Typography>
                            {isNearest && (
                              <Typography
                                variant="caption"
                                sx={{
                                  px: 0.5,
                                  py: 0.1,
                                  borderRadius: 0.5,
                                  bgcolor: 'success.main',
                                  color: 'common.white',
                                  fontWeight: 700,
                                  fontSize: '0.6rem',
                                  lineHeight: 1.4,
                                }}
                              >
                                NEAREST
                              </Typography>
                            )}
                          </Stack>
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
                <Typography variant="body2">{jobMeta.gender}</Typography>
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
                      {jobMeta.postedBy.name}
                    </Typography>
                    <Typography variant="caption">
                      ({jobMeta.rating} ★) ({jobMeta.reviewCount} reviews)
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          bgcolor: '#e0e0e0',
                          borderRadius: 1,
                          minWidth: 72,
                          textAlign: 'center',
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, fontSize: '1.125rem', lineHeight: 1.2 }}>
                          {fCurrency(jobMeta.totalPay)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          bgcolor: '#e0e0e0',
                          borderRadius: 1,
                          minWidth: 72,
                          textAlign: 'center',
                        }}
                      >
                        <Typography sx={{ fontWeight: 900, fontSize: '1.125rem', lineHeight: 1.2 }}>
                          {fCurrency(jobMeta.hourlyRate)}/h
                        </Typography>
                      </Box>
                    </Stack>
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
                  '&:hover': {
                    bgcolor: viewMode === 'calendar' ? '#e3f2fd' : 'action.hover',
                  },
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
                  '&:hover': {
                    bgcolor: viewMode === 'agency' ? '#e3f2fd' : 'action.hover',
                  },
                }}
              >
                Agency Grid
              </Button>
            </Box>

            <ShiftLegend items={SHIFT_LEGEND} />
          </Stack>

          <Box sx={{ px: 1, pb: 3 }}>
            {visibleCategories.map((category) => (
              <JobCategorySection
                key={category.id}
                category={category}
                days={visibleDays}
                dateRangeLabel={dateRangeLabel}
                viewMode={viewMode}
                activeJobId={job?.id}
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
                staffList={isViewOnly ? viewStaffList : assignStaffList}
              />
            ))}
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
