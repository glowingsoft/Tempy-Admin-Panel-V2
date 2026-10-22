import { format } from 'date-fns';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';
import { hideScrollX } from 'src/theme/styles/mixins';

import { findStaffById, getAssignCalendarCellSx } from './agency-assign-staff-utils';

const ROW_LABEL_W = 72;
const DAY_COL_W = 52;
const CELL_H = 44;

function ShiftGridCell({ cell, staff, onClick, cellRef, readOnly }) {
  if (!cell) {
    return (
      <Box
        sx={{
          width: DAY_COL_W,
          height: CELL_H,
          flexShrink: 0,
          mx: 0.25,
          borderRadius: 1,
          bgcolor: 'transparent',
        }}
      />
    );
  }

  const isEmpty = cell?.status === 'empty';
  const isInteractive = !readOnly || !isEmpty;

  return (
    <Box
      ref={cellRef}
      onClick={isInteractive ? onClick : undefined}
      sx={{
        width: DAY_COL_W,
        height: CELL_H,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        cursor: isInteractive ? 'pointer' : 'default',
        mx: 0.25,
        ...getAssignCalendarCellSx(cell?.status),
        '&:hover': isInteractive ? { opacity: 0.9 } : undefined,
      }}
    >
      {isEmpty && !readOnly && (
        <Iconify icon="eva:plus-fill" width={18} sx={{ color: 'text.secondary' }} />
      )}
      {cell?.status === 'completed' && (
        <Stack alignItems="center" spacing={0}>
          <Avatar src={staff?.avatarUrl} sx={{ width: 28, height: 28, fontSize: 10 }}>
            {staff?.initials}
          </Avatar>
          <Iconify icon="eva:checkmark-fill" width={12} sx={{ color: 'success.main', mt: -0.5 }} />
        </Stack>
      )}
      {cell?.status === 'replacement' && (
        <Stack alignItems="center">
          <Avatar src={staff?.avatarUrl} sx={{ width: 28, height: 28, fontSize: 10 }}>
            {staff?.initials}
          </Avatar>
          <Iconify icon="eva:sync-fill" width={12} sx={{ color: 'error.main', mt: -0.5 }} />
        </Stack>
      )}
      {cell?.status === 'noshow' && (
        <Avatar src={staff?.avatarUrl} sx={{ width: 28, height: 28, fontSize: 10, opacity: 0.5 }}>
          {staff?.initials}
        </Avatar>
      )}
      {cell?.status === 'pending' && (
        <Avatar
          src={staff?.avatarUrl}
          sx={{ width: 28, height: 28, fontSize: 10, border: '2px solid', borderColor: 'warning.light' }}
        >
          {staff?.initials}
        </Avatar>
      )}
      {(cell?.status === 'assigned' || cell?.status === 'upcoming') && (
        <Avatar
          src={staff?.avatarUrl}
          sx={{
            width: 30,
            height: 30,
            fontSize: 11,
            border: cell.status === 'upcoming' ? '2px solid' : 'none',
            borderColor: cell.status === 'upcoming' ? 'info.main' : undefined,
          }}
        >
          {staff?.initials || '?'}
        </Avatar>
      )}
    </Box>
  );
}

export function AgencyJobCalendarBlock({
  categoryId,
  jobItem,
  days,
  gridCells,
  onCellClick,
  cellRefs,
  readOnly = false,
  staffList = [],
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, p: 1.5, mb: 1.5 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <JobMediaThumb image={jobItem.image} alt={`Job ${jobItem.id}`} width={48} height={48} />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
              #{jobItem.id}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.5 }}>
              {jobItem.description}
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ ...hideScrollX, overflowX: 'auto' }}>
        <Box sx={{ minWidth: ROW_LABEL_W + days.length * (DAY_COL_W + 4) }}>
          <Stack direction="row" sx={{ pl: `${ROW_LABEL_W}px`, mb: 0.5 }}>
            {days.map((day) => (
              <Box
                key={day.toISOString()}
                sx={{ width: DAY_COL_W, flexShrink: 0, textAlign: 'center', mx: 0.25 }}
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

          {jobItem.shiftRows.map((row) => (
            <Stack key={row.id} direction="row" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ width: ROW_LABEL_W, flexShrink: 0, fontSize: '0.7rem' }}
              >
                {row.label}
              </Typography>
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const cell =
                  gridCells[categoryId]?.[jobItem.id]?.[row.id]?.[dateKey] ||
                  row.cells?.[dateKey] ||
                  (row.date === dateKey ? { status: 'empty' } : null);
                const staff = cell?.staffId ? findStaffById(staffList, cell.staffId) : null;
                const refKey = `${categoryId}-${jobItem.id}-${row.id}-${dateKey}`;

                return (
                  <ShiftGridCell
                    key={dateKey}
                    cell={cell}
                    staff={staff}
                    readOnly={readOnly}
                    cellRef={(el) => {
                      cellRefs.current[refKey] = el;
                    }}
                    onClick={() =>
                      onCellClick({
                        categoryId,
                        jobId: jobItem.id,
                        shiftId: row.id,
                        date: dateKey,
                        cell,
                        anchorEl: cellRefs.current[refKey],
                      })
                    }
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

export function buildCalendarCellKey(categoryId, jobId, shiftId, date) {
  return `${categoryId}-${jobId}-${shiftId}-${date}`;
}
