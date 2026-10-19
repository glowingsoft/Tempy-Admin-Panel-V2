import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

import { fCurrency } from 'src/utils/format-number';

import { handleApiError } from 'src/store/handleApiError';
import { saveBlobAsFile } from 'src/sections/staff/staff-import-utils';
import {
  useDownloadBookingPaymentInvoiceMutation,
  useGetBookingPaymentsQuery,
} from 'src/store/Reducer/booking-payments-api';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { ModuleLoading } from 'src/components/loading-screen';

const PAYMENT_STATUS_OPTIONS = [
  { value: '', label: 'All payment statuses' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'refunded', label: 'Refunded' },
];

const PAYOUT_STATUS_OPTIONS = [
  { value: '', label: 'All payout statuses' },
  { value: 'paid', label: 'Paid out' },
  { value: 'pending', label: 'Pending' },
  { value: 'owed', label: 'Owed' },
];

const SUMMARY_CARDS = [
  { key: 'total', label: 'Total' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'refunded', label: 'Refunded' },
];

function moneyLabel(money) {
  if (money?.formatted) return money.formatted;
  return fCurrency(money?.amount || 0);
}

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
  if (value.includes('pending') || value.includes('process') || value.includes('owed')) return 'warning';
  if (value.includes('paid') || value.includes('active') || value.includes('confirm')) return 'success';
  return 'default';
}

function hoursLabel(hours) {
  if (!hours) return '—';
  const rounded = Math.round(Number(hours) * 100) / 100;
  return `${rounded}h`;
}

function breakLabel(row) {
  if (!row.isBreak) return '';
  return row.breakMin ? `${row.breakMin} min break` : 'Break';
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
        {person.companyName ? (
          <Typography variant="caption" noWrap display="block" sx={{ color: 'text.secondary', maxWidth: 160 }}>
            {person.companyName}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
}

const TABLE_HEAD = [
  { id: 'reference', label: 'Reference' },
  { id: 'jobName', label: 'Job' },
  { id: 'customer', label: 'Customer' },
  { id: 'worker', label: 'Worker' },
  { id: 'shift', label: 'Shift' },
  { id: 'hours', label: 'Hours', align: 'center' },
  { id: 'amount', label: 'Amount', align: 'right' },
  { id: 'platformFee', label: 'Platform fee', align: 'right' },
  { id: 'status', label: 'Status' },
  { id: 'bookingStatus', label: 'Booking status' },
  { id: 'gateway', label: 'Gateway' },
  { id: 'paidAt', label: 'Paid at' },
  { id: 'invoice', label: 'Invoice', align: 'right' },
];

export function BookingPaymentsList({ role = 'care-home' }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [from, setFrom] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [payoutStatus, setPayoutStatus] = useState('');
  const [downloadingId, setDownloadingId] = useState('');
  const [downloadInvoice] = useDownloadBookingPaymentInvoiceMutation();

  const { data, isLoading, isError, error } = useGetBookingPaymentsQuery({
    role,
    from,
    paymentStatus,
    payoutStatus,
    page: page + 1,
    limit: rowsPerPage,
  });

  const payments = data?.payments || [];
  const clientPaged = payments.length > rowsPerPage;
  const visiblePayments = clientPaged ? payments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : payments;
  const totalRecords = data?.meta?.hasTotal ? data.meta.totalRecords : null;
  const count = clientPaged
    ? payments.length
    : totalRecords != null
      ? totalRecords
      : payments.length < rowsPerPage
        ? page * rowsPerPage + payments.length
        : page * rowsPerPage + payments.length + 1;

  const resetPage = () => setPage(0);

  const handleDownloadInvoice = async (row) => {
    if (!row.bookingId || downloadingId) return;
    setDownloadingId(row.bookingId);
    try {
      const result = await downloadInvoice({ role, bookingId: row.bookingId }).unwrap();
      if (result?.blob) {
        saveBlobAsFile(result.blob, result.filename || `invoice-${row.reference || row.bookingId}.pdf`);
        return;
      }
      toast.error(result?.json?.message || 'Could not download the invoice');
    } catch (err) {
      toast.error(err?.data?.json?.message || handleApiError(err) || 'Could not download the invoice');
    } finally {
      setDownloadingId('');
    }
  };

  const pagerCount = Math.max(count, page * rowsPerPage + (visiblePayments.length || (page > 0 ? 1 : 0)));

  const pagination = (
    <TablePaginationCustom
      count={pagerCount}
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={(event) => {
        setRowsPerPage(Number(event.target.value));
        setPage(0);
      }}
    />
  );

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography variant="h6">Payment history</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Bookings and the amount collected or owed on each one.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ px: 3, pb: 2 }}>
        <TextField
          select
          size="small"
          label="Payment status"
          value={paymentStatus}
          onChange={(event) => {
            setPaymentStatus(event.target.value);
            resetPage();
          }}
          sx={{ width: { xs: 1, md: 'auto' }, minWidth: { xs: 0, md: 200 } }}
        >
          {PAYMENT_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value || 'all-payment'} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Payout status"
          value={payoutStatus}
          onChange={(event) => {
            setPayoutStatus(event.target.value);
            resetPage();
          }}
          sx={{ width: { xs: 1, md: 'auto' }, minWidth: { xs: 0, md: 180 } }}
        >
          {PAYOUT_STATUS_OPTIONS.map((option) => (
            <MenuItem key={option.value || 'all-payout'} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          type="date"
          label="From"
          value={from}
          onChange={(event) => {
            setFrom(event.target.value);
            resetPage();
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: { xs: 1, md: 'auto' }, minWidth: { xs: 0, md: 160 } }}
        />
      </Stack>

      {data?.summary ? (
        <Box
          sx={{
            px: 3,
            pb: 2,
            display: 'grid',
            gap: 1.5,
            gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          }}
        >
          {SUMMARY_CARDS.map((card) => (
            <Box
              key={card.key}
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'background.neutral',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {card.label}
              </Typography>
              <Typography variant="subtitle1">{moneyLabel(data.summary[card.key])}</Typography>
            </Box>
          ))}
        </Box>
      ) : null}

      {isError && !data ? (
        <Alert severity="error" sx={{ mx: 3, mb: 3 }}>
          {handleApiError(error) || 'Could not load payments'}
        </Alert>
      ) : isLoading ? (
        <ModuleLoading />
      ) : visiblePayments.length ? (
        <>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 1280 }}>
              <TableHeadCustom headLabel={TABLE_HEAD} />
              <TableBody>
                {visiblePayments.map((row) => (
                  <TableRow key={row.id || row.reference} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{row.reference || '—'}</Typography>
                      {row.transactionId ? (
                        <Typography variant="caption" noWrap display="block" title={row.transactionId} sx={{ color: 'text.secondary', maxWidth: 180 }}>
                          {row.transactionId}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                        {row.jobName || '—'}
                      </Typography>
                      {row.employer?.name ? (
                        <Typography variant="caption" noWrap display="block" sx={{ color: 'text.secondary', maxWidth: 160 }}>
                          Employer: {row.employer.name}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <PersonCell person={row.customer} />
                    </TableCell>
                    <TableCell>
                      <PersonCell person={row.worker} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.date || '—'}</Typography>
                      <Typography variant="caption" display="block" sx={{ color: 'text.secondary' }}>
                        {row.time || '—'}
                      </Typography>
                      {breakLabel(row) ? (
                        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                          {breakLabel(row)}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell align="center">{hoursLabel(row.hours)}</TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">{row.formatted || fCurrency(row.amount)}</Typography>
                    </TableCell>
                    <TableCell align="right">{fCurrency(row.platformFee)}</TableCell>
                    <TableCell>
                      <Label variant="soft" color={statusColor(row.status)}>
                        {humanizeStatus(row.status)}
                      </Label>
                    </TableCell>
                    <TableCell>
                      <Label variant="soft" color={statusColor(row.bookingStatus)}>
                        {humanizeStatus(row.bookingStatus)}
                      </Label>
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{row.gateway || '—'}</TableCell>
                    <TableCell>{row.paidAt || '—'}</TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="inherit"
                        disabled={!row.bookingId || downloadingId === row.bookingId}
                        onClick={() => handleDownloadInvoice(row)}
                        startIcon={<Iconify icon="solar:download-bold" width={16} />}
                      >
                        {downloadingId === row.bookingId ? 'Downloading' : 'PDF'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
          {pagination}
        </>
      ) : (
        <>
          <DashboardEmptyState
            message="No payments yet"
            hint={paymentStatus || payoutStatus || from ? 'Nothing matches these filters.' : 'Payments appear here once a booking is created.'}
            minHeight={220}
          />
          {pagination}
        </>
      )}
    </Card>
  );
}
