import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';
import { UserQuickEditForm } from 'src/sections/user/user-quick-edit-form';
import { fDate, formatStr } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function DevicesTableRow({ row, selected, onEditRow, counter, onSelectRow, onDeleteRow }) {
  const confirm = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{counter}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.name || ''}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>Rs. {row?.balance || ''}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDate(row?.createdAt, formatStr.paramCase.date)}</TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'active' && 'success') ||
              (row.status === 'inactive' && 'error') ||
              'default'
            }
          >
            {row.status}
          </Label>
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center">
            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color={quickEdit.value ? 'inherit' : 'default'}
                onClick={quickEdit.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color='error'
                onClick={confirm.onTrue}
              >
                <Iconify icon="solar:trash-bin-trash-bold" />
              </IconButton>
            </Tooltip>

            {/* <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton> */}
          </Stack>
        </TableCell>
      </TableRow>

      <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} />

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>

          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            Edit
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}


// import TableRow from '@mui/material/TableRow';
// import TableCell from '@mui/material/TableCell';
// import { fDate, formatStr } from 'src/utils/format-time';
// import { Label } from 'src/components/label';
// import { IconButton, Stack, Tooltip } from '@mui/material';
// import { Iconify } from 'src/components/iconify';

// // ----------------------------------------------------------------------

// export function DevicesTableRow({ row, counter, index, selected, onSelectRow, onViewRow, onEditRow, onDeleteRow }) {

//   return (

//     <TableRow hover selected={selected}>
//       <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.name || ''}</TableCell>

//       <TableCell sx={{ whiteSpace: 'nowrap' }}>Rs. {row?.balance || ''}</TableCell>

//       <TableCell sx={{ whiteSpace: 'nowrap' }}>{fDate(row?.createdAt, formatStr.paramCase.date)}</TableCell>

//       <TableCell>
//         <Label
//           variant="soft"
//           color={
//             (row.status === 'active' && 'success') ||
//             (row.status === 'inactive' && 'error') ||
//             'default'
//           }
//         >
//           {row.status}
//         </Label>
//       </TableCell>

//       <TableCell>
//         <Stack direction="row" alignItems="center">
//           <Tooltip title="Quick Edit" placement="top" arrow>
//             <IconButton
//               color={quickEdit.value ? 'inherit' : 'default'}
//               onClick={quickEdit.onTrue}
//             >
//               <Iconify icon="solar:pen-bold" />
//             </IconButton>
//           </Tooltip>

//           <Tooltip title="Quick Edit" placement="top" arrow>
//             <IconButton
//               color='error'
//               onClick={confirm.onTrue}
//             >
//               <Iconify icon="solar:trash-bin-trash-bold" />
//             </IconButton>
//           </Tooltip>

//           {/* <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
//                     <Iconify icon="eva:more-vertical-fill" />
//                   </IconButton> */}
//         </Stack>
//       </TableCell>
//     </TableRow>

//   );
// }
