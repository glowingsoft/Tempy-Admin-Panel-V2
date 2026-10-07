import { memo } from 'react';
import PropTypes from 'prop-types';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

import { useBoolean } from 'src/hooks/use-boolean';
import { Label } from 'src/components/label';
import { UserQuickEditForm } from 'src/sections/user/user-quick-edit-form';
import { fDate, formatStr } from 'src/utils/format-time';
import { GenericTableRowActions } from 'src/components/generic-table/table-row-actions';

export const SampleTableRow = memo(({ row, serialNumber, onDeleteRow }) => {
  const quickEdit = useBoolean();

  const actions = [
    {
      key: 'edit',
      icon: 'solar:pen-bold',
      tooltip: 'Edit Wallet',
      color: quickEdit.value ? 'inherit' : 'default',
      onClick: quickEdit.onTrue,
    },
    {
      key: 'delete',
      icon: 'solar:trash-bin-trash-bold',
      tooltip: 'Delete Wallet',
      color: 'error',
      onClick: onDeleteRow,
    },
  ];

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
          <GenericTableRowActions actions={actions} />
        </TableCell>
      </TableRow>

      <UserQuickEditForm
        currentUser={row}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.row._id === nextProps.row._id &&
    prevProps.row.name === nextProps.row.name &&
    prevProps.row.balance === nextProps.row.balance &&
    prevProps.row.status === nextProps.row.status &&
    prevProps.row.createdAt === nextProps.row.createdAt &&
    prevProps.serialNumber === nextProps.serialNumber
  );
});

SampleTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  serialNumber: PropTypes.number.isRequired,
  onDeleteRow: PropTypes.func.isRequired,
};

SampleTableRow.displayName = 'SampleTableRow';