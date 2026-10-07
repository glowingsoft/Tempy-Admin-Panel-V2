import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

const STATUS_COLOR = {
  active: 'success',
  pending: 'warning',
  inactive: 'error',
};

export function AdminCareHomeTableRow({ row, onView }) {
  return (
    <TableRow hover tabIndex={-1}>
      <TableCell>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar src={row.avatarUrl} alt={row.name} sx={{ width: 36, height: 36 }}>
            {row.name?.[0]}
          </Avatar>
          <Typography variant="subtitle2" noWrap>
            {row.name}
          </Typography>
        </Stack>
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.email}</TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.location}</TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.staffCount}</TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.activeJobs}</TableCell>

      <TableCell>
        <Label variant="soft" color={STATUS_COLOR[row.status] || 'default'}>
          {row.status}
        </Label>
      </TableCell>

      <TableCell align="right">
        <Tooltip title="View care home dashboard" arrow>
          <Button
            size="small"
            variant="contained"
            startIcon={<Iconify icon="solar:eye-bold" width={16} />}
            onClick={() => onView(row)}
          >
            View
          </Button>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}
