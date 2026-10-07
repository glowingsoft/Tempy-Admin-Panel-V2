import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { rowInPage, TableHeadCustom, TableNoData, TablePaginationCustom, useTable } from 'src/components/table';
import { ModuleLoading } from 'src/components/loading-screen';

import { handleApiError } from 'src/store/handleApiError';
import {
  useGetAdminPayoutsQuery,
  useRecordAdminPayoutMutation,
  useRefundAdminBookingMutation,
} from 'src/store/Reducer/gocardless-api';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'supplier', label: 'Supplier' },
  { id: 'bank', label: 'Bank details', width: 280 },
  { id: 'bookings', label: 'Bookings', width: 110, align: 'center' },
  { id: 'owed', label: 'Total owed', width: 140, align: 'right' },
  { id: 'action', label: '', width: 150 },
];

function formatSortCode(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length !== 6) return value || '';
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
}

async function copyText(value, label) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  } catch {
    toast.error('Could not copy');
  }
}


export function AdminTransactionsView() {
  const { data: rows = [], isLoading, isError, error, refetch } = useGetAdminPayoutsQuery();
  const [recordPayout, { isLoading: recording }] = useRecordAdminPayoutMutation();
  const [refundBooking, { isLoading: refunding }] = useRefundAdminBookingMutation();
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(null);
  const [reference, setReference] = useState('');
  const [refundForm, setRefundForm] = useState(null);
  const table = useTable({ defaultRowsPerPage: 10 });

  const dataFiltered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.name, row.accountHolderName, row.sortCode, row.accountNumber]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [rows, search]);

  useEffect(() => {
    table.onResetPage();
  }, [search, table.onResetPage]);

  const pageCount = Math.max(1, Math.ceil(dataFiltered.length / table.rowsPerPage));
  const safePage = Math.min(table.page, pageCount - 1);
  const pageRows = rowInPage(dataFiltered, safePage, table.rowsPerPage);

  const openSettle = (row) => {
    setReference('');
    setPending(row);
  };

  const openRefund = (row) => {
    const bookingIds = Array.isArray(row.bookingIds) ? row.bookingIds : [];
    setRefundForm({
      supplierName: row.name,
      bookingId: bookingIds[0] || '',
      bookingIds,
      amount: '',
      reason: 'goodwill',
    });
  };

  const handleRefund = async () => {
    if (!refundForm?.bookingId) return;
    const amount = Number(refundForm.amount);
    try {
      await refundBooking({
        bookingId: refundForm.bookingId,
        amount: Number.isFinite(amount) && amount > 0 ? amount : undefined,
        reason: refundForm.reason,
      }).unwrap();
      toast.success('Refund recorded.');
      setRefundForm(null);
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not refund this booking');
    }
  };

  const handleRecord = async () => {
    if (!pending?.supplierId || pending.bankDetailsMissing) return;
    const transferReference = reference.trim();
    try {
      await recordPayout({
        supplierId: pending.supplierId,
        bookingIds: pending.bookingIds,
        reference: transferReference,
      }).unwrap();
      toast.success('Payout recorded.');
      setPending(null);
      setReference('');
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not record this payout');
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Payouts"
        links={[
          { name: 'Dashboard', href: paths.adminDashboard.root },
          { name: 'Payouts' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        A supplier is listed only after the shift is completed and the customer payment has been paid out. Tempy keeps
        the platform fee. Send the bank transfer yourself, then mark it as paid. Marking paid does not move money.
      </Alert>

      {isError ? (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {handleApiError(error) || 'Could not load payouts'}
        </Alert>
      ) : null}

      <Card>
        <Stack sx={{ p: 2.5 }}>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search supplier..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: { sm: 360 } }}
          />
        </Stack>

        {isLoading ? (
          <ModuleLoading />
        ) : (
          <Scrollbar>
            <Table sx={{ minWidth: 960 }}>
              <TableHeadCustom headLabel={TABLE_HEAD} />
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.supplierId} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{row.name}</Typography>
                    </TableCell>
                    <TableCell>
                      {row.bankDetailsMissing ? (
                        <Alert severity="warning" sx={{ py: 0.25 }}>
                          Bank details missing
                        </Alert>
                      ) : (
                        <Stack spacing={0.25}>
                          <Typography variant="body2">{row.accountHolderName || '—'}</Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              {formatSortCode(row.sortCode)} · {row.accountNumber}
                            </Typography>
                            <Tooltip title="Copy sort code">
                              <IconButton size="small" onClick={() => copyText(row.sortCode, 'Sort code')}>
                                <Iconify icon="solar:copy-bold" width={14} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Copy account number">
                              <IconButton size="small" onClick={() => copyText(row.accountNumber, 'Account number')}>
                                <Iconify icon="solar:copy-bold" width={14} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell align="center">{row.bookingCount}</TableCell>
                    <TableCell align="right">{fCurrency(row.totalOwed)}</TableCell>
                    <TableCell align="right">
                      <Stack spacing={0.75} alignItems="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          disabled={row.bankDetailsMissing || recording}
                          onClick={() => openSettle(row)}
                        >
                          Mark as paid
                        </Button>
                        <Button
                          size="small"
                          color="inherit"
                          disabled={refunding || !row.bookingIds?.length}
                          onClick={() => openRefund(row)}
                        >
                          Refund
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
                <TableNoData notFound={!dataFiltered.length} />
              </TableBody>
            </Table>
          </Scrollbar>
        )}
        {!isLoading ? (
          <TablePaginationCustom
            page={safePage}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        ) : null}
      </Card>

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => {
          if (recording) return;
          setPending(null);
          setReference('');
        }}
        title="Mark as paid"
        content={
          pending ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                Confirm the bank transfer of {fCurrency(pending.totalOwed)} has already been sent to{' '}
                <strong>{pending.name}</strong>
                {pending.sortCode || pending.accountNumber ? (
                  <>
                    {' '}
                    ({formatSortCode(pending.sortCode)}
                    {pending.accountNumber ? ` · ${pending.accountNumber}` : ''})
                  </>
                ) : null}
                . This only records the payout.
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Transfer reference"
                placeholder="BACS-2026-10-06-001"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          ) : null
        }
        action={
          <Button variant="contained" disabled={recording || pending?.bankDetailsMissing} onClick={handleRecord}>
            {recording ? 'Saving...' : 'Mark as paid'}
          </Button>
        }
      />

      <ConfirmDialog
        open={Boolean(refundForm)}
        onClose={() => {
          if (refunding) return;
          setRefundForm(null);
        }}
        title="Refund customer"
        content={
          refundForm ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                Refund <strong>{refundForm.supplierName}</strong>. A full refund leaves the amount empty. A partial
                refund uses the amount you enter. This does not pay the supplier.
              </Box>
              {refundForm.bookingIds.length > 1 ? (
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Booking"
                  value={refundForm.bookingId}
                  onChange={(event) => setRefundForm((current) => ({ ...current, bookingId: event.target.value }))}
                >
                  {refundForm.bookingIds.map((id) => (
                    <MenuItem key={id} value={id}>
                      {id}
                    </MenuItem>
                  ))}
                </TextField>
              ) : null}
              <TextField
                select
                fullWidth
                size="small"
                label="Reason"
                value={refundForm.reason}
                onChange={(event) => setRefundForm((current) => ({ ...current, reason: event.target.value }))}
              >
                <MenuItem value="goodwill">Goodwill</MenuItem>
                <MenuItem value="partial">Partial</MenuItem>
              </TextField>
              <TextField
                fullWidth
                size="small"
                label="Amount (GBP)"
                placeholder="Leave empty to refund the full charge"
                value={refundForm.amount}
                onChange={(event) => setRefundForm((current) => ({ ...current, amount: event.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          ) : null
        }
        action={
          <Button variant="contained" disabled={refunding || !refundForm?.bookingId} onClick={handleRefund}>
            {refunding ? 'Saving...' : 'Refund'}
          </Button>
        }
      />
    </DashboardContent>
  );
}
