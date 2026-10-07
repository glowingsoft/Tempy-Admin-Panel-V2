// import PropTypes from 'prop-types';
// import { memo } from 'react';

// import Button from '@mui/material/Button';
// import IconButton from '@mui/material/IconButton';
// import Stack from '@mui/material/Stack';
// import TableCell from '@mui/material/TableCell';
// import TableRow from '@mui/material/TableRow';
// import Tooltip from '@mui/material/Tooltip';

// import { useBoolean } from 'src/hooks/use-boolean';

// import { Iconify } from 'src/components/iconify';
// import { Label } from 'src/components/label';
// import { UserQuickEditForm } from 'src/sections/user/user-quick-edit-form';
// import { fDate, formatStr } from 'src/utils/format-time';
// import { getStatusColor } from 'src/utils/table-utils';

// // ----------------------------------------------------------------------

// function UserTableRow({ row, serialNumber, onDeleteRow }) {
//   const quickEdit = useBoolean();

//   return (
//     <>
//       <TableRow hover tabIndex={-1}>
//         <TableCell sx={{ whiteSpace: 'nowrap' }}>{serialNumber}</TableCell>

//         <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.name || 'N/A'}</TableCell>

//         <TableCell sx={{ whiteSpace: 'nowrap' }}>
//           Rs. {row?.balance?.toLocaleString() || '0'}
//         </TableCell>

//         <TableCell sx={{ whiteSpace: 'nowrap' }}>
//           {row?.createdAt ? fDate(row.createdAt, formatStr.paramCase.date) : 'N/A'}
//         </TableCell>

//         <TableCell>
//           <Label variant="soft" color={getStatusColor(row.status)}>
//             {row.status || 'N/A'}
//           </Label>
//         </TableCell>

//         <TableCell>
//           <Stack direction="row" alignItems="center" spacing={0.5}>
//             <Tooltip title="Edit Wallet" placement="top" arrow>
//               <IconButton
//                 color={quickEdit.value ? 'inherit' : 'default'}
//                 onClick={quickEdit.onTrue}
//               >
//                 <Iconify icon="solar:pen-bold" />
//               </IconButton>
//             </Tooltip>

//             <Tooltip title="Delete Wallet" placement="top" arrow>
//               <IconButton color="error" onClick={onDeleteRow}>
//                 <Iconify icon="solar:trash-bin-trash-bold" />
//               </IconButton>
//             </Tooltip>
//           </Stack>
//         </TableCell>
//       </TableRow>

//       <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} />
//     </>
//   );
// }

// UserTableRow.propTypes = {
//   row: PropTypes.object.isRequired,
//   serialNumber: PropTypes.number.isRequired,
//   onDeleteRow: PropTypes.func.isRequired,
// };

// export default memo(UserTableRow);

import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { UserQuickEditForm } from 'src/sections/user/user-quick-edit-form';
import { fDate, formatStr } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function WalletTableRow({ row, serialNumber, onDeleteRow }) {
  const quickEdit = useBoolean();

  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{serialNumber}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.name || 'N/A'}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          Rs. {row?.balance?.toLocaleString() || '0'}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          {row?.createdAt ? fDate(row.createdAt, formatStr.paramCase.date) : 'N/A'}
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'active' && 'success') ||
              (row.status === 'inactive' && 'error') ||
              (row.status === 'pending' && 'warning') ||
              'default'
            }
          >
            {row.status || 'N/A'}
          </Label>
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title="Edit Wallet" placement="top" arrow>
              <IconButton
                color={quickEdit.value ? 'inherit' : 'default'}
                onClick={quickEdit.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Wallet" placement="top" arrow>
              <IconButton color="error" onClick={onDeleteRow}>
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>
          </Stack>
        </TableCell>
      </TableRow>

      <UserQuickEditForm
        currentUser={row}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
      />
    </>
  );
}
