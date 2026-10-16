import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TableHeadCustom, TableNoData, TablePaginationCustom } from 'src/components/table';
import { ModuleLoading } from 'src/components/loading-screen';

import { handleApiError } from 'src/store/handleApiError';
import {
  useGetAdminPayoutsQuery,
  useRecordAdminPayoutMutation,
  useRefundAdminBookingMutation,
} from 'src/store/Reducer/gocardless-api';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'owed', label: 'Owed' },
  { value: 'paid', label: 'Paid' },
];

const TABLE_HEAD = [
  { id: 'supplier', label: 'Supplier' },
  { id: 'bank', label: 'Bank details', width: 260 },
  { id: 'bookings', label: 'Bookings', width: 100, align: 'center' },
  { id: 'amount', label: 'Amount', width: 120, align: 'right' },
  { id: 'reference', label: 'Reference', width: 220 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'action', label: 'Actions', width: 200, align: 'right' },
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

function defaultPayoutReference() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `Bank transfer ${yyyy}-${mm}-${dd}`;
}

export function AdminTransactionsView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(null);
  const [reference, setReference] = useState('');
  const [refundForm, setRefundForm] = useState(null);

  const isAllStatus = status === 'all';
  // API only accepts status=owed|paid — "all" needs both lists merged.
  const owedQuery = useGetAdminPayoutsQuery(
    {
      page: isAllStatus ? 1 : page + 1,
      limit: isAllStatus ? 100 : rowsPerPage,
      status: 'owed',
    },
    { skip: !isAllStatus && status !== 'owed' }
  );
  const paidQuery = useGetAdminPayoutsQuery(
    {
      page: isAllStatus ? 1 : page + 1,
      limit: isAllStatus ? 100 : rowsPerPage,
      status: 'paid',
    },
    { skip: !isAllStatus && status !== 'paid' }
  );

  const activeQuery = isAllStatus ? null : status === 'paid' ? paidQuery : owedQuery;
  const isLoading = isAllStatus
    ? owedQuery.isLoading || paidQuery.isLoading
    : Boolean(activeQuery?.isLoading);
  const isError = isAllStatus
    ? owedQuery.isError && paidQuery.isError
    : Boolean(activeQuery?.isError);
  const error = isAllStatus
    ? owedQuery.error || paidQuery.error
    : activeQuery?.error;

  const refetch = () => {
    if (isAllStatus || status === 'owed') owedQuery.refetch();
    if (isAllStatus || status === 'paid') paidQuery.refetch();
  };

  const [recordPayout, { isLoading: recording }] = useRecordAdminPayoutMutation();
  const [refundBooking, { isLoading: refunding }] = useRefundAdminBookingMutation();

  const counts = useMemo(() => {
    const source = paidQuery.data?.counts || owedQuery.data?.counts || {};
    return {
      owed: source.owed || { suppliers: 0, bookings: 0 },
      paid: source.paid || { suppliers: 0, bookings: 0 },
      allSuppliers:
        source.allSuppliers ??
        (source.owed?.suppliers || 0) + (source.paid?.suppliers || 0),
      allBookings:
        source.allBookings ?? (source.owed?.bookings || 0) + (source.paid?.bookings || 0),
    };
  }, [owedQuery.data?.counts, paidQuery.data?.counts]);

  const rows = useMemo(() => {
    if (isAllStatus) {
      const owedRows = (owedQuery.data?.rows || []).map((row) => ({
        ...row,
        payoutStatus: row.payoutStatus || 'owed',
      }));
      const paidRows = (paidQuery.data?.rows || []).map((row) => ({
        ...row,
        payoutStatus: row.payoutStatus || 'paid',
      }));
      const byId = new Map();
      [...owedRows, ...paidRows].forEach((row) => {
        const existing = byId.get(row.supplierId);
        if (!existing) {
          byId.set(row.supplierId, row);
          return;
        }
        // Prefer paid row when the same supplier appears in both.
        if (String(row.payoutStatus).toLowerCase() === 'paid') {
          byId.set(row.supplierId, row);
        }
      });
      return [...byId.values()];
    }
    return activeQuery?.data?.rows || [];
  }, [activeQuery?.data?.rows, isAllStatus, owedQuery.data?.rows, paidQuery.data?.rows]);

  const isPaidRow = (row) =>
    String(row.payoutStatus || '').toLowerCase() === 'paid' || Boolean(row.lastPaidAt);

  useEffect(() => {
    setPage(0);
  }, [status, rowsPerPage]);

  const dataFiltered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.name, row.accountHolderName, row.sortCode, row.accountNumber, ...(row.payoutReferences || [])]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [rows, search]);

  const pageRows = useMemo(() => {
    if (!isAllStatus && !search.trim()) return dataFiltered;
    const start = page * rowsPerPage;
    return dataFiltered.slice(start, start + rowsPerPage);
  }, [dataFiltered, isAllStatus, page, rowsPerPage, search]);

  const totalRecords = isAllStatus
    ? dataFiltered.length
    : activeQuery?.data?.meta?.hasTotal
      ? activeQuery.data.meta.totalRecords
      : null;
  const count =
    search.trim() || isAllStatus
      ? dataFiltered.length
      : totalRecords != null
        ? totalRecords
        : dataFiltered.length < rowsPerPage
          ? page * rowsPerPage + dataFiltered.length
          : page * rowsPerPage + dataFiltered.length + 1;

  const openAddPayout = (row) => {
    setReference(defaultPayoutReference());
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

  const handleAddPayout = async () => {
    if (!pending?.supplierId) return;
    const transferReference = reference.trim();
    if (!transferReference) {
      toast.error('Enter a transfer reference');
      return;
    }
    try {
      await recordPayout({
        supplierId: pending.supplierId,
        reference: transferReference,
      }).unwrap();
      toast.success('Payout recorded.');
      setPending(null);
      setReference('');
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not record this payout');
    }
  };

  const statusCount = (value) => {
    if (value === 'all') return counts.allSuppliers ?? 0;
    return counts[value]?.suppliers ?? 0;
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
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ p: 2.5, borderBottom: (theme) => `1px solid ${theme.vars.palette.divider}` }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
        >
          <FormControl size="small" sx={{ minWidth: { xs: 1, sm: 280 } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(event) => setStatus(event.target.value)}
              renderValue={(selected) =>
                STATUS_OPTIONS.find((option) => option.value === selected)?.label || 'All'
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ width: 1 }}>
                    <Typography variant="body2">{option.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                      {statusCount(option.value)}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
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
            sx={{ width: { xs: 1, sm: 280 }, flexShrink: 0 }}
          />
        </Stack>

        {isLoading ? (
          <ModuleLoading />
        ) : (
          <Scrollbar>
            <Table sx={{ minWidth: 1180 }}>
              <TableHeadCustom headLabel={TABLE_HEAD} />
              <TableBody>
                {pageRows.map((row) => {
                  const paid = isPaidRow(row);
                  const references = paid
                    ? (row.payoutReferences || []).filter(Boolean)
                    : [];
                  return (
                    <TableRow key={row.supplierId} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{row.name}</Typography>
                        {paid && row.lastPaidAt ? (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Paid {row.lastPaidAt}
                          </Typography>
                        ) : null}
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
                                <IconButton
                                  size="small"
                                  onClick={() => copyText(row.accountNumber, 'Account number')}
                                >
                                  <Iconify icon="solar:copy-bold" width={14} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell align="center">{row.bookingCount}</TableCell>
                      <TableCell align="right">{fCurrency(row.totalOwed)}</TableCell>
                      <TableCell>
                        {references.length ? (
                          <Stack spacing={0.25}>
                            {references.map((ref) => (
                              <Typography
                                key={ref}
                                variant="body2"
                                sx={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                              >
                                {ref}
                              </Typography>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            —
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Label variant="soft" color={paid ? 'success' : 'warning'}>
                          {paid ? 'Paid' : 'Owed'}
                        </Label>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                          {!paid ? (
                            <Button
                              size="small"
                              variant="contained"
                              disabled={row.bankDetailsMissing || recording}
                              onClick={() => openAddPayout(row)}
                            >
                              Add payout
                            </Button>
                          ) : null}
                          <Button
                            size="small"
                            variant="text"
                            color="inherit"
                            disabled={refunding || !row.bookingIds?.length}
                            onClick={() => openRefund(row)}
                          >
                            Refund
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableNoData notFound={!dataFiltered.length} />
              </TableBody>
            </Table>
          </Scrollbar>
        )}
        {!isLoading ? (
          <TablePaginationCustom
            page={page}
            count={count}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
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
        title="Add payout"
        content={
          pending ? (
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box>
                Record payout for <strong>{pending.name}</strong>
                {pending.totalOwed ? <> · {fCurrency(pending.totalOwed)}</> : null}
                {pending.sortCode || pending.accountNumber ? (
                  <>
                    {' '}
                    ({formatSortCode(pending.sortCode)}
                    {pending.accountNumber ? ` · ${pending.accountNumber}` : ''})
                  </>
                ) : null}
                . This only records the transfer — it does not move money.
              </Box>
              <TextField
                fullWidth
                size="small"
                label="Reference"
                placeholder="Bank transfer 2026-09-28"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          ) : null
        }
        action={
          <Button
            variant="contained"
            disabled={recording || pending?.bankDetailsMissing || !reference.trim()}
            onClick={handleAddPayout}
          >
            {recording ? 'Saving...' : 'Add payout'}
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
