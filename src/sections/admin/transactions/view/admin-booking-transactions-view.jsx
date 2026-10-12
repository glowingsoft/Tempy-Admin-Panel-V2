import { useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { useDebounce } from 'src/hooks/use-debounce';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TableHeadCustom, TableNoData, TablePaginationCustom } from 'src/components/table';

import { handleApiError } from 'src/store/handleApiError';
import {
  useGetAdminPlatformFeeQuery,
  useGetAdminTransactionByIdQuery,
  useGetAdminTransactionsQuery,
  useUpdateAdminPlatformFeeMutation,
} from 'src/store/Reducer/admin-transactions-api';
import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'paid', label: 'Paid' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'failed', label: 'Failed' },
];

const TABLE_HEAD = [
  { id: 'reference', label: 'Reference' },
  { id: 'job', label: 'Job' },
  { id: 'customer', label: 'Customer' },
  { id: 'worker', label: 'Worker' },
  { id: 'amount', label: 'Amount', align: 'right' },
  { id: 'platformFee', label: 'Platform fee', align: 'right' },
  { id: 'supplierAmount', label: 'Supplier amount', align: 'right' },
  { id: 'status', label: 'Status' },
  { id: 'payoutStatus', label: 'Payout' },
  { id: 'paidAt', label: 'Paid at' },
];

function humanizeStatus(value) {
  const raw = String(value || '').trim();
  if (!raw) return '—';
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusColor(status) {
  const value = String(status || '').toLowerCase();
  if (!value) return 'default';
  if (value.includes('refund')) return 'info';
  if (value.includes('fail') || value.includes('cancel') || value.includes('denied')) return 'error';
  if (value.includes('pending') || value.includes('process') || value.includes('not_due') || value === 'owed') return 'warning';
  if (value.includes('paid') || value.includes('active') || value.includes('confirm')) return 'success';
  return 'default';
}

function PersonCell({ person }) {
  if (!person?.name) return '—';
  return (
    <Stack direction="row" alignItems="center" spacing={1.25}>
      <Avatar src={person.avatarUrl} alt={person.name} sx={{ width: 32, height: 32 }}>
        {person.name[0]?.toUpperCase()}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
          {person.name}
        </Typography>
        {person.email ? (
          <Typography variant="caption" noWrap display="block" sx={{ color: 'text.secondary', maxWidth: 160 }}>
            {person.email}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

function DetailItem({ label, children }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Box sx={{ mt: 0.25 }}>{children || <Typography variant="body2">—</Typography>}</Box>
    </Box>
  );
}

function TransactionDetailsDialog({ transactionId, onClose }) {
  const { data, isLoading, isFetching, isError, error } = useGetAdminTransactionByIdQuery(transactionId, {
    skip: !transactionId,
  });
  const shiftLine = [data?.time, data?.isBreak ? (data.breakMin ? `${data.breakMin} min break` : 'Break') : ''].filter(Boolean).join(' · ');

  return (
    <Dialog open={Boolean(transactionId)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Transaction</DialogTitle>
      <DialogContent dividers>
        {isFetching ? <LinearProgress sx={{ mb: 2 }} /> : null}
        {isError ? (
          <Alert severity="error">{handleApiError(error) || 'Could not load this transaction'}</Alert>
        ) : isLoading || !data ? (
          <DashboardEmptyState message="Loading transaction" hint="" minHeight={160} />
        ) : (
          <Box
            sx={{
              pt: 1,
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            }}
          >
            <DetailItem label="Reference">
              <Typography variant="body2">{data.reference || '—'}</Typography>
            </DetailItem>
            <DetailItem label="Job">
              <Typography variant="body2">{data.jobName || '—'}</Typography>
            </DetailItem>
            <DetailItem label="Customer">
              <PersonCell person={data.customer} />
            </DetailItem>
            <DetailItem label="Worker">
              <PersonCell person={data.worker} />
            </DetailItem>
            <DetailItem label="Supplier">
              <PersonCell person={data.supplier} />
            </DetailItem>
            <DetailItem label="Shift">
              <Typography variant="body2">{data.date || '—'}</Typography>
              {shiftLine ? (
                <Typography variant="caption" color="text.secondary" display="block">
                  {shiftLine}
                </Typography>
              ) : null}
            </DetailItem>
            <DetailItem label="Amount">
              <Typography variant="body2">{fCurrency(data.amount)}</Typography>
            </DetailItem>
            <DetailItem label="Platform fee">
              <Typography variant="body2">
                {fCurrency(data.platformFee)}
                {data.platformFeePercent ? ` · ${data.platformFeePercent}%` : ''}
              </Typography>
            </DetailItem>
            <DetailItem label="Supplier amount">
              <Typography variant="body2">{fCurrency(data.supplierAmount)}</Typography>
            </DetailItem>
            <DetailItem label="Currency">
              <Typography variant="body2">{data.currency || '—'}</Typography>
            </DetailItem>
            <DetailItem label="Status">
              <Label variant="soft" color={statusColor(data.status)}>
                {humanizeStatus(data.status)}
              </Label>
            </DetailItem>
            <DetailItem label="Booking status">
              <Label variant="soft" color={statusColor(data.bookingStatus)}>
                {humanizeStatus(data.bookingStatus)}
              </Label>
            </DetailItem>
            <DetailItem label="Gateway">
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                {data.gateway || '—'}
              </Typography>
            </DetailItem>
            <DetailItem label="Gateway status">
              <Label variant="soft" color={statusColor(data.gatewayStatus)}>
                {humanizeStatus(data.gatewayStatus)}
              </Label>
            </DetailItem>
            <DetailItem label="Paid at">
              <Typography variant="body2">{data.paidAt || '—'}</Typography>
            </DetailItem>
            <DetailItem label="Payout status">
              <Label variant="soft" color={statusColor(data.payoutStatus)}>
                {humanizeStatus(data.payoutStatus)}
              </Label>
            </DetailItem>
            <DetailItem label="Payout at">
              <Typography variant="body2">{data.payoutAt || '—'}</Typography>
            </DetailItem>
            <DetailItem label="Payout reference">
              <Typography variant="body2">{data.payoutReference || '—'}</Typography>
            </DetailItem>
            <DetailItem label="Created at">
              <Typography variant="body2">{data.createdAt || '—'}</Typography>
            </DetailItem>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PlatformFeeCard() {
  const { data, isLoading, isError, error } = useGetAdminPlatformFeeQuery();
  const [updateFee, { isLoading: saving }] = useUpdateAdminPlatformFeeMutation();
  const [percent, setPercent] = useState('');

  useEffect(() => {
    if (data?.percent == null) return;
    setPercent(String(data.percent));
  }, [data?.percent]);

  const handleSave = async () => {
    const value = Number(percent);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      toast.error('Enter a percent from 0 to 100');
      return;
    }
    try {
      await updateFee({ percent: value }).unwrap();
      toast.success('Platform fee updated');
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not update the platform fee');
    }
  };

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6">Platform fee</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
        Percent kept on each customer payment. Supplier payouts use the amount left after this fee.
      </Typography>
      {isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {handleApiError(error) || 'Could not load the platform fee'}
        </Alert>
      ) : null}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
        <TextField
          label="Percent"
          type="number"
          size="small"
          value={percent}
          disabled={isLoading || saving}
          onChange={(event) => setPercent(event.target.value)}
          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          inputProps={{ min: 0, max: 100, step: 0.01 }}
          sx={{ width: 180 }}
        />
        <Button variant="contained" onClick={handleSave} disabled={isLoading || saving}>
          {saving ? 'Saving...' : 'Update fee'}
        </Button>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function AdminBookingTransactionsView() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const keyword = useDebounce(search.trim(), 400);

  useEffect(() => {
    setPage(0);
  }, [keyword, status, rowsPerPage]);

  const { data, isLoading, isFetching, isError, error } = useGetAdminTransactionsQuery({
    page: status ? 1 : page + 1,
    limit: status ? 100 : rowsPerPage,
    keyword,
    status,
  });

  const statusCounts = data?.statusCounts || {};
  const matchedTransactions = (data?.transactions || []).filter((row) => !status || String(row.status || '').toLowerCase() === status);
  const serverPaged = !status && matchedTransactions.length <= rowsPerPage;
  const transactions = serverPaged ? matchedTransactions : matchedTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const totalRecords = !status && data?.meta?.hasTotal ? data.meta.totalRecords : status ? matchedTransactions.length : null;
  const count =
    totalRecords != null
      ? totalRecords
      : matchedTransactions.length < rowsPerPage
        ? page * rowsPerPage + matchedTransactions.length
        : page * rowsPerPage + matchedTransactions.length + 1;

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs heading="Transactions" links={[{ name: 'Dashboard', href: paths.adminDashboard.root }, { name: 'Transactions' }]} sx={{ mb: { xs: 3, md: 5 } }} />

      <Stack spacing={3}>
        <PlatformFeeCard />

        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: 3, pt: 3, pb: 2 }}>
            <Typography variant="h6">Transactions</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Customer payments. Open a row to load the full transaction.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ px: 3, pb: 2 }}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search reference, job, customer, worker..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              sx={{ minWidth: { sm: 180 } }}
            >
              {STATUS_OPTIONS.map((option) => {
                const optionCount = option.value ? statusCounts[option.value] : null;
                return (
                  <MenuItem key={option.value || 'all-status'} value={option.value}>
                    {option.label}
                    {optionCount != null ? ` (${optionCount})` : ''}
                  </MenuItem>
                );
              })}
            </TextField>
          </Stack>

          {isFetching ? <LinearProgress sx={{ height: 2 }} /> : null}

          {isError && !data ? (
            <Alert severity="error" sx={{ mx: 3, mb: 3 }}>
              {handleApiError(error) || 'Could not load transactions'}
            </Alert>
          ) : (
            <>
              <Scrollbar>
                <Table size="small" sx={{ minWidth: 1100 }}>
                  <TableHeadCustom headLabel={TABLE_HEAD} />
                  <TableBody>
                    {transactions.map((row) => (
                      <TableRow key={row.id || row.reference} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedId(row.id)}>
                        <TableCell>
                          <Typography variant="subtitle2">{row.reference || '—'}</Typography>
                          {row.date ? (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {row.date}
                              {row.time ? ` · ${row.time}` : ''}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>{row.jobName || '—'}</TableCell>
                        <TableCell>
                          <PersonCell person={row.customer} />
                        </TableCell>
                        <TableCell>
                          <PersonCell person={row.worker} />
                        </TableCell>
                        <TableCell align="right">{fCurrency(row.amount)}</TableCell>
                        <TableCell align="right">{fCurrency(row.platformFee)}</TableCell>
                        <TableCell align="right">{fCurrency(row.supplierAmount)}</TableCell>
                        <TableCell>
                          <Label variant="soft" color={statusColor(row.status)}>
                            {humanizeStatus(row.status)}
                          </Label>
                        </TableCell>
                        <TableCell>
                          <Label variant="soft" color={statusColor(row.payoutStatus)}>
                            {humanizeStatus(row.payoutStatus)}
                          </Label>
                        </TableCell>
                        <TableCell>{row.paidAt || '—'}</TableCell>
                      </TableRow>
                    ))}

                    <TableNoData notFound={!isLoading && !transactions.length} />
                  </TableBody>
                </Table>
              </Scrollbar>
              <TablePaginationCustom
                count={count}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(0);
                }}
              />
            </>
          )}
        </Card>
      </Stack>

      <TransactionDetailsDialog transactionId={selectedId} onClose={() => setSelectedId('')} />
    </DashboardContent>
  );
}
