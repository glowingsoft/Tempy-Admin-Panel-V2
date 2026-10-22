import { useMemo } from 'react';
import { format } from 'date-fns';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';
import { hideScrollX } from 'src/theme/styles/mixins';

import { getAssignStaffDayCellSx, withStaffDistances } from './agency-assign-staff-utils';
import { isStaffBusyOnDateInSet } from 'src/sections/agency/shifts/agency-availability-api-utils';

const STAFF_COL_W = 188;
const DAY_COL_W = 56;
const CELL_H = 48;

function getEnabledDates(shiftRow) {
  return Object.entries(shiftRow.cells || {})
    .filter(([, cell]) => ['empty', 'replacement', 'pending'].includes(cell?.status))
    .map(([date]) => date);
}

function getInitialAssignments(shiftRow) {
  const map = {};
  Object.entries(shiftRow.cells || {}).forEach(([date, cell]) => {
    if (cell?.staffId && ['assigned', 'upcoming', 'completed'].includes(cell.status)) {
      map[date] = cell.staffId;
    }
  });
  return map;
}

function StaffDayCell({ cellData, onClick, readOnly }) {
  const { type, line1, line2 } = cellData;
  const clickable = !readOnly && (type === 'available' || type === 'assigned');
  const viewable = readOnly && type === 'assigned';

  return (
    <Box
      onClick={clickable || viewable ? onClick : undefined}
      sx={{
        width: DAY_COL_W,
        height: CELL_H,
        flexShrink: 0,
        mx: 0.2,
        borderRadius: 0.75,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 0.25,
        textAlign: 'center',
        ...getAssignStaffDayCellSx(type, { readOnly }),
        '&:hover':
          type === 'available' && !readOnly
            ? { bgcolor: 'action.hover', borderColor: 'text.secondary' }
            : undefined,
      }}
    >
      {line1 && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.58rem',
            fontWeight: 700,
            lineHeight: 1.15,
            color: type === 'assigned' ? 'success.dark' : 'text.primary',
          }}
        >
          {line1}
        </Typography>
      )}
      {line2 && (
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.52rem',
            lineHeight: 1.1,
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {line2}
        </Typography>
      )}
    </Box>
  );
}

export function AgencyJobStaffBlock({
  categoryId,
  categoryTitle,
  jobItem,
  days,
  selectedShiftId,
  onSelectShift,
  assignments,
  onAssign,
  onCellSelect,
  readOnly = false,
  staffList,
  busyDateKeys = null,
}) {
  const selectedShift = jobItem.shiftRows.find((row) => row.id === selectedShiftId) || jobItem.shiftRows[0];
  const assignmentKey = `${categoryId}-${jobItem.id}-${selectedShift?.id}`;

  const enabledDates = useMemo(
    () => new Set(getEnabledDates(selectedShift)),
    [selectedShift]
  );

  const shiftAssignments = useMemo(() => {
    const initial = getInitialAssignments(selectedShift);
    const overrides = assignments[assignmentKey];
    if (!overrides) return initial;

    const merged = { ...initial };
    Object.entries(overrides).forEach(([date, staffId]) => {
      if (staffId == null) delete merged[date];
      else merged[date] = staffId;
    });
    return merged;
  }, [assignments, assignmentKey, selectedShift]);

  const shiftHasAssignment = useMemo(() => {
    const initial = getInitialAssignments(selectedShift);
    const merged = { ...initial, ...shiftAssignments };
    return Object.keys(merged).length > 0;
  }, [selectedShift, shiftAssignments]);

  const resolveCell = (staffId, dateKey) => {
    const shiftLabel = selectedShift?.label || '';
    const slotStaff = shiftAssignments[dateKey];
    const staffKey = String(staffId);

    if (slotStaff != null && String(slotStaff) === staffKey) {
      return {
        type: 'assigned',
        line1: shiftLabel,
        line2: categoryTitle,
      };
    }

    if (isStaffBusyOnDateInSet(busyDateKeys, staffId, dateKey)) {
      return {
        type: 'busy',
        line1: 'Busy',
        line2: 'No auto-accept',
      };
    }

    if (!enabledDates.has(dateKey)) {
      return { type: 'disabled', line1: '', line2: '' };
    }

    if (readOnly) {
      return { type: 'disabled', line1: '', line2: '' };
    }

    return { type: 'available', line1: '', line2: '' };
  };

  const handleStaffCellClick = (staffId, dateKey) => {
    const cell = resolveCell(staffId, dateKey);

    if (readOnly) {
      if (cell.type !== 'assigned') return;
      onCellSelect?.({
        categoryId,
        jobId: jobItem.id,
        shiftId: selectedShift.id,
        date: dateKey,
        staffId,
      });
      return;
    }

    if (cell.type !== 'available' && cell.type !== 'assigned') return;

    const current = shiftAssignments[dateKey];
    if (current === staffId) {
      onAssign(categoryId, jobItem.id, selectedShift.id, dateKey, null);
      return;
    }

    onAssign(categoryId, jobItem.id, selectedShift.id, dateKey, staffId);
    onCellSelect?.({
      categoryId,
      jobId: jobItem.id,
      shiftId: selectedShift.id,
      date: dateKey,
      staffId,
    });
  };

  const visibleStaff = useMemo(
    () =>
      withStaffDistances(staffList?.length ? staffList : [], {
        latitude: jobItem.latitude,
        longitude: jobItem.longitude,
      }),
    [staffList, jobItem.latitude, jobItem.longitude]
  );

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.25, mb: 1 }}>
        <Stack direction="row" alignItems="flex-start" spacing={1}>
          <JobMediaThumb image={jobItem.image} alt={categoryTitle || 'Job'} width={48} height={48} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 0.25 }}>
              <Typography variant="caption" fontWeight={700}>
                #{jobItem.id}
              </Typography>
              {categoryTitle && (
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  · {categoryTitle}
                </Typography>
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.45, mb: 0.75 }}>
              {jobItem.description}
            </Typography>
            {jobItem.requestDate && (
              <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                {jobItem.requestDate}
              </Typography>
            )}
            {jobItem.address && (
              <Stack direction="row" alignItems="flex-start" spacing={0.5}>
                <Iconify icon="eva:pin-fill" width={14} sx={{ color: 'text.secondary', mt: 0.1, flexShrink: 0 }} />
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.35 }}>
                  {jobItem.address}
                </Typography>
              </Stack>
            )}
          </Box>
        </Stack>
      </Box>

      <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
        {jobItem.shiftRows.map((shift) => {
          const isSelected = selectedShift?.id === shift.id;
          const hasData =
            isSelected && shiftHasAssignment
              ? true
              : Object.keys(getInitialAssignments(shift)).length > 0;

          return (
            <Button
              key={shift.id}
              size="small"
              onClick={() => onSelectShift(categoryId, jobItem.id, shift.id)}
              sx={{
                minWidth: 76,
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: 1,
                border: '2px solid',
                borderColor: isSelected ? 'success.main' : 'divider',
                bgcolor: isSelected
                  ? 'success.lighter'
                  : hasData
                    ? 'success.lighter'
                    : 'background.paper',
                color: 'text.primary',
                boxShadow: 'none',
                textTransform: 'none',
                py: 0.5,
                opacity: isSelected ? 1 : hasData ? 0.85 : 1,
                '&:hover': {
                  bgcolor: isSelected ? 'success.light' : 'action.hover',
                },
              }}
            >
              {shift.label}
            </Button>
          );
        })}
      </Stack>

      <Box sx={{ ...hideScrollX, overflowX: 'auto' }}>
        <Box sx={{ minWidth: STAFF_COL_W + days.length * (DAY_COL_W + 4) }}>
          <Stack direction="row" sx={{ pl: `${STAFF_COL_W}px`, mb: 0.5 }}>
            {days.map((day) => (
              <Box
                key={day.toISOString()}
                sx={{ width: DAY_COL_W, flexShrink: 0, textAlign: 'center', mx: 0.2 }}
              >
                <Typography variant="caption" fontWeight={600} display="block" sx={{ fontSize: '0.65rem' }}>
                  {format(day, 'EEE')}
                </Typography>
                <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>
                  {format(day, 'd MMM')}
                </Typography>
              </Box>
            ))}
          </Stack>

          {visibleStaff.map((staff, index) => (
            <Stack
              key={staff.id}
              direction="row"
              alignItems="center"
              sx={{
                mb: 0.35,
                py: 0.35,
                borderRadius: 1,
                bgcolor: index % 2 === 0 ? 'primary.lighter' : 'success.lighter',
              }}
            >
              <Box
                sx={{
                  width: STAFF_COL_W,
                  flexShrink: 0,
                  px: 0.75,
                  py: 0.35,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <Avatar src={staff.avatarUrl} sx={{ width: 34, height: 34, fontSize: 11 }}>
                    {staff.initials}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={700} noWrap sx={{ lineHeight: 1.25 }}>
                      {staff.name}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={0.2}>
                      <Iconify icon="material-symbols:star" width={11} sx={{ color: 'warning.main' }} />
                      <Typography variant="caption" sx={{ fontSize: '0.58rem', lineHeight: 1.2 }}>
                        {staff.rating} ({staff.reviews})
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      display="block"
                      sx={{ fontSize: '0.58rem', color: 'success.main', fontWeight: 600, lineHeight: 1.2 }}
                    >
                      {staff.hours}
                    </Typography>
                    {staff.distanceLabel && (
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ fontSize: '0.58rem', color: 'primary.main', fontWeight: 700, lineHeight: 1.2 }}
                      >
                        {staff.distanceLabel} away
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>

              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const cellData = resolveCell(staff.id, dateKey);

                return (
                  <StaffDayCell
                    key={dateKey}
                    cellData={cellData}
                    readOnly={readOnly}
                    onClick={() => handleStaffCellClick(staff.id, dateKey)}
                  />
                );
              })}
            </Stack>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export function buildAssignmentKey(categoryId, jobId, shiftId) {
  return `${categoryId}-${jobId}-${shiftId}`;
}
