import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { fCurrency } from 'src/utils/format-number';

import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';
import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'type', label: 'Organisation / person' },
  { id: 'billed', label: 'Billed', align: 'right' },
  { id: 'earned', label: 'Earned', align: 'right' },
];

export function AdminFinanceByOrg({
  title = 'Money billed & earned',
  subheader = 'By organisation or person type',
  list = [],
}) {
  const rows = Array.isArray(list) ? list : [];
  const billedTotal = rows.reduce((sum, row) => sum + (Number(row.billed) || 0), 0);
  const earnedTotal = rows.reduce((sum, row) => sum + (Number(row.earned) || 0), 0);

  return (
    <Card sx={{ height: 1, display: 'flex', flexDirection: 'column' }}>
      <CardHeader title={title} subheader={subheader} />

      {rows.length ? (
        <Scrollbar autoHide={false}>
          <TableContainer sx={{ minWidth: 480 }}>
            <Table>
              <TableHeadCustom headLabel={TABLE_HEAD} />
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>
                      <Typography variant="subtitle2">{row.label}</Typography>
                    </TableCell>
                    <TableCell align="right">{fCurrency(row.billed)}</TableCell>
                    <TableCell align="right">{fCurrency(row.earned)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <Typography variant="subtitle2">Total</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">{fCurrency(billedTotal)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="subtitle2">{fCurrency(earnedTotal)}</Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      ) : (
        <Stack sx={{ px: 3, pb: 3, flexGrow: 1 }}>
          <DashboardEmptyState message="No billed or earned totals yet" />
        </Stack>
      )}
    </Card>
  );
}
