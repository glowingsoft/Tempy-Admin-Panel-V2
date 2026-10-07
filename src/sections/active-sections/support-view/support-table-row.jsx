import { Avatar, Box, Link, Stack } from '@mui/material';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import PropTypes from 'prop-types';
import { memo } from 'react';
import { GenericTableRowActions } from 'src/components/generic-table/table-row-actions';
import { Label } from 'src/components/label';
import EllipsisCellWithTooltip from 'src/components/table/ellipsis-cell-with-tooltip';
import { useBoolean } from 'src/hooks/use-boolean';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';
import { fDate, formatStr } from 'src/utils/format-time';
import QuickSupportReply from './components/quick-support-reply';
import { STATUS_OPTIONS } from './supports-list-view';

export const SupportTableRow = memo(({ row, serialNumber, onDeleteRow }) => {
    const reply = useBoolean();

    const router = useRouter();

    const actions = [
      {
        key: 'reply',
        icon: 'tabler:message-filled',
        tooltip: 'Reply',
        color: reply.value ? 'inherit' : 'default',
        onClick: () => {
          reply.onTrue();
        },
      },
    ];

    return (
      <>
        <TableRow hover tabIndex={-1}>
          <TableCell sx={{ whiteSpace: 'nowrap' }}>{serialNumber}</TableCell>

          <TableCell>
            <Stack spacing={2} direction="row" alignItems="center">
              <Avatar alt={row.name} src={row.avatar} />

              <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
                <Link color="inherit" sx={{ cursor: 'pointer' }} onClick={() => router.push(paths.dashboard.customers.details(1))}>
                  {' '}
                  {row.name}
                </Link>

                <Box component="span" sx={{ color: 'text.disabled' }}>
                  {row.email}
                </Box>
              </Stack>
            </Stack>
          </TableCell>

          <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.phone || '0'}</TableCell>

          <EllipsisCellWithTooltip maxWidth="150px">{row?.subject || 'N/A'}</EllipsisCellWithTooltip>

          <EllipsisCellWithTooltip maxWidth="200px">{row?.message || 'N/A'}</EllipsisCellWithTooltip>

          <TableCell sx={{ whiteSpace: 'nowrap' }}>{row?.createdAt ? fDate(row.createdAt, formatStr.paramCase.date) : 'N/A'}</TableCell>
          <TableCell>
            <Label variant="soft" color={STATUS_OPTIONS.find((option) => option.value === row.status)?.color || 'default'}>
              {row.status || 'N/A'}
            </Label>
          </TableCell>

          <TableCell>
            <Box sx={{ alignItems: 'center', display: 'flex', justifyContent: 'center' }}>{row.status === 'open' ? <GenericTableRowActions actions={actions} /> : '--'}</Box>
          </TableCell>
        </TableRow>

        {/* <UserQuickEditForm
        currentUser={row}
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
      /> */}
        <QuickSupportReply open={reply.value} onclose={() => reply.onFalse()} />
      </>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function for memo
    return (
      prevProps.row._id === nextProps.row._id &&
      prevProps.row.name === nextProps.row.name &&
      prevProps.row.balance === nextProps.row.balance &&
      prevProps.row.status === nextProps.row.status &&
      prevProps.row.createdAt === nextProps.row.createdAt &&
      prevProps.serialNumber === nextProps.serialNumber
    );
  }
);

SupportTableRow.propTypes = {
  row: PropTypes.object.isRequired,
  serialNumber: PropTypes.number.isRequired,
  onDeleteRow: PropTypes.func.isRequired,
};

SupportTableRow.displayName = 'SupportTableRow';
