import { format } from 'date-fns';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { JobMediaThumb } from 'src/components/jobs/job-image';
import { hideScrollX } from 'src/theme/styles/mixins';

import { getStaffById } from 'src/_mock/_agency-assign-staff';

// ----------------------------------------------------------------------

const ROW_LABEL_W = 72;
const DAY_COL_W = 52;
const CELL_H = 44;

const CELL_STYLES = {
  empty: { bgcolor: '#e0e0e0', border: '1px solid #bdbdbd' },
  assigned: { bgcolor: '#fff', border: '1px solid #e0e0e0' },
  upcoming: { bgcolor: '#e3f2fd', border: '2px solid #2196f3' },
  completed: { bgcolor: '#e8f5e9', border: '2px solid #4caf50' },
  replacement: { bgcolor: '#ffebee', border: '2px solid #f44336' },
  noshow: { bgcolor: '#fff3e0', border: '2px solid #ff9800' },
  pending: { bgcolor: '#fffde7', border: '2px solid #ffeb3b' },
};

function ShiftGridCell({ cell, staff, onClick, cellRef, readOnly }) {
  const style = CELL_STYLES[cell?.status] || CELL_STYLES.empty;
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
        ...style,
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
          <Iconify icon="eva:checkmark-fill" width={12} sx={{ color: '#4caf50', mt: -0.5 }} />
        </Stack>
      )}
      {cell?.status === 'replacement' && (
        <Stack alignItems="center">
          <Avatar src={staff?.avatarUrl} sx={{ width: 28, height: 28, fontSize: 10 }}>
            {staff?.initials}
          </Avatar>
          <Iconify icon="eva:sync-fill" width={12} sx={{ color: '#f44336', mt: -0.5 }} />
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
          sx={{ width: 28, height: 28, fontSize: 10, border: '2px solid #ffeb3b' }}
        >
          {staff?.initials}
        </Avatar>
      )}
      {(cell?.status === 'assigned' || cell?.status === 'upcoming') && staff && (
        <Avatar
          src={staff.avatarUrl}
          sx={{
            width: 30,
            height: 30,
            fontSize: 11,
            border: cell.status === 'upcoming' ? '2px solid #2196f3' : 'none',
          }}
        >
          {staff.initials}
        </Avatar>
      )}
    </Box>
  );
}

/** Calendar view — shift rows × days, grey + opens staff popover */
export function AgencyJobCalendarBlock({
  categoryId,
  jobItem,
  days,
  gridCells,
  onCellClick,
  cellRefs,
  readOnly = false,
}) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ bgcolor: '#e8e8e8', borderRadius: 1, p: 1.5, mb: 1.5 }}>
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
                  gridCells[categoryId]?.[jobItem.id]?.[row.id]?.[dateKey] || row.cells[dateKey];
                const staff = cell?.staffId ? getStaffById(cell.staffId) : null;
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
