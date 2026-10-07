import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { STAFF_STATUS_COLOR, getStaffSpecialtyLabel } from 'src/_mock/_staff';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function StaffTableRow({ row, onViewRow }) {
  const specialities = Array.isArray(row.specialities)
    ? row.specialities
    : [row.specialty].filter(Boolean);

  return (
    <TableRow hover tabIndex={-1}>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Avatar src={row.avatarUrl || undefined} alt={row.name} sx={{ width: 36, height: 36 }}>
            {row.name?.[0]}
          </Avatar>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {row.name || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.email || '—'}
            </Typography>
          </Stack>
        </Stack>
      </TableCell>

      <TableCell sx={{ minWidth: 180 }}>
        <Stack spacing={0.25}>
          <Typography variant="body2" noWrap>
            {row.role || row.userType || '—'}
          </Typography>
          {specialities.length ? (
            <Typography variant="caption" color="text.secondary" noWrap>
              {specialities.map(getStaffSpecialtyLabel).join(', ')}
            </Typography>
          ) : null}
        </Stack>
      </TableCell>

      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        {row.bookingCount ?? 0}
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.addedOn || '—'}</TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.latestShiftDate || '—'}</TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        {row.rating} ({row.reviewCount} reviews)
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Label color={STAFF_STATUS_COLOR[row.status] || 'default'} variant="soft">
          {row.status || 'active'}
        </Label>
      </TableCell>

      <TableCell align="center" sx={{ whiteSpace: 'nowrap', width: 56 }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
          <Tooltip title="View" placement="top" arrow>
            <IconButton size="small" onClick={() => onViewRow(row)}>
              <Iconify icon="solar:eye-bold" width={18} />
            </IconButton>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
}
