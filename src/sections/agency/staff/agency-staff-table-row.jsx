import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fCurrency } from 'src/utils/format-number';
import { isDeletedStatus } from 'src/utils/status-counts';

import {
  STAFF_STATUS_COLOR,
  getStaffSpecialtyLabel,
  getStaffStatusHint,
  getStaffStatusLabel,
} from 'src/_mock/_staff';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

export function AgencyStaffTableRow({ row, onViewRow, onEditRow, onDeleteRow }) {
  const specialities = Array.isArray(row.specialities)
    ? row.specialities
    : [row.specialty].filter(Boolean);

  const isDeleted = isDeletedStatus(row.status);

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
        <Typography variant="body2" noWrap>
          {specialities.length ? specialities.map(getStaffSpecialtyLabel).join(', ') : '—'}
        </Typography>
      </TableCell>

      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        {fCurrency(row.ratePerHour)}
      </TableCell>

      <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
        {row.platformPercent != null ? `${row.platformPercent}%` : '—'}
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.addedOn || '—'}</TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>
        <Tooltip title={getStaffStatusHint(row.status)} placement="top" arrow>
          <span>
            <Label color={STAFF_STATUS_COLOR[row.status] || 'default'} variant="soft">
              {getStaffStatusLabel(row.status)}
            </Label>
          </span>
        </Tooltip>
      </TableCell>

      <TableCell align="center" sx={{ whiteSpace: 'nowrap', width: 116 }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
          <Tooltip title="View" placement="top" arrow>
            <IconButton size="small" onClick={() => onViewRow(row)}>
              <Iconify icon="solar:eye-bold" width={18} />
            </IconButton>
          </Tooltip>

          {/* Edit / Delete only when the screen allows changes (not for admin viewing). */}
          {onEditRow ? (
            <Tooltip title="Edit" placement="top" arrow>
              <IconButton size="small" onClick={() => onEditRow(row)}>
                <Iconify icon="solar:pen-bold" width={18} />
              </IconButton>
            </Tooltip>
          ) : null}

          {isDeleted || !onDeleteRow ? null : (
            <Tooltip title="Delete" placement="top" arrow>
              <IconButton size="small" color="error" onClick={() => onDeleteRow(row)}>
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
