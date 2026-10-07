import { useMemo, useState, useCallback } from 'react';
import { format, subMonths, endOfMonth, startOfWeek, startOfMonth } from 'date-fns';

import { useTheme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Menu from '@mui/material/Menu';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Avatar from '@mui/material/Avatar';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fNumber, fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { useScopedUserId } from 'src/hooks/use-scoped-user-id';
import { useGetEarningsQuery, useLazyGetEarningsQuery } from 'src/store/Reducer/earnings-api';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Chart, useChart } from 'src/components/chart';
import { ModuleLoading } from 'src/components/loading-screen';
import { TableHeadCustom, TablePaginationCustom } from 'src/components/table';

import { AppWidgetSummary } from 'src/sections/overview/app/app-widget-summary';
import { DashboardEmptyState } from 'src/sections/dashboard/dashboard-empty-state';

import { PAYMENT_STATUSES } from '../earnings-api-utils';
import { exportEarningsReport, printEarningsReport } from '../earnings-actions';

// ----------------------------------------------------------------------

const CUSTOMER_ROLES = ['care-home', 'hospital', 'local-authority', 'user'];

const PERIOD_OPTIONS = [
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'lastMonth', label: 'Last month' },
];

const STATUS_META = {
  paid: { label: 'Paid', color: 'success', icon: 'solar:check-circle-bold' },
  processing: { label: 'Processing', color: 'info', icon: 'solar:clock-circle-bold' },
  pending: { label: 'Pending', color: 'warning', icon: 'solar:wallet-money-bold' },
  refunded: { label: 'Refunded', color: 'default', icon: 'solar:restart-bold' },
  refund_pending: { label: 'Refund pending', color: 'warning', icon: 'solar:restart-bold' },
  failed: { label: 'Failed', color: 'error', icon: 'solar:close-circle-bold' },
};

const EXPORT_LIMIT = 1000;

/** This week / this month run up to today, so the API's "previous" range is the same length. */
function periodRange(periodId, today = new Date()) {
  if (periodId === 'month') return { from: startOfMonth(today), to: today };
  if (periodId === 'lastMonth') {
    const lastMonth = subMonths(today, 1);
    return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
  }
  return { from: startOfWeek(today, { weekStartsOn: 1 }), to: today };
}

function percentChange(current, previous) {
  if (!previous) return undefined;
  return ((current - previous) / previous) * 100;
}

function statusLabel(status) {
  return STATUS_META[status]?.label || status || '—';
}

function plural(count, word) {
  return `${fNumber(count)} ${word}${count === 1 ? '' : 's'}`;
}

// ----------------------------------------------------------------------

export function AgencyEarningsView({ role = 'agency' }) {
  const theme = useTheme();
  const userId = useScopedUserId();

  const [periodId, setPeriodId] = useState('week');
  const [workerFilter, setWorkerFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [periodAnchor, setPeriodAnchor] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const period = PERIOD_OPTIONS.find((item) => item.id === periodId) || PERIOD_OPTIONS[0];

  const range = useMemo(() => {
    const { from, to } = periodRange(periodId);
    return { from: format(from, 'yyyy-MM-dd'), to: format(to, 'yyyy-MM-dd') };
  }, [periodId]);

  const filterArgs = {
    role,
    userId,
    ...range,
    workerId: workerFilter?.id,
    paymentStatus: statusFilter,
  };

  const { data, isLoading, isFetching, isError, error } = useGetEarningsQuery(
    { ...filterArgs, page: page + 1, limit: rowsPerPage },
    { skip: !userId }
  );
  const [fetchAllEarnings, { isFetching: isExporting }] = useLazyGetEarningsQuery();

  const isSpend = data ? data.type === 'spend' : CUSTOMER_ROLES.includes(role);
  const isNurse = role === 'nurse';

  const labels = isSpend
    ? {
        title: 'Spending',
        description: 'The accepted bid charged when the booking is created (GBP £), before the platform fee.',
        total: 'Total spent',
        paid: 'Paid',
        shifts: 'Shifts booked',
        series: 'Spent',
        person: 'Staff',
      }
    : {
        title: 'Earnings',
        description: isNurse
          ? 'Pay for shifts you won directly. Shifts through an agency or home care company are counted only; that employer is paid.'
          : 'What you are owed after the platform fee, once the shift is completed and the customer payment has been paid out.',
        total: 'Total earned',
        paid: 'Paid out',
        shifts: 'Shifts billed',
        series: 'Earned',
        person: isNurse ? 'Client' : 'Staff',
      };

  const summary = data?.summary;
  const previous = data?.previous;
  const daily = data?.daily;
  const history = data?.history || [];
  const topWorkers = data?.topWorkers;
  const categories = daily?.categories || [];

  // A nurse's rows are their own shifts, so show who the shift was for instead.
  const personOf = (row) =>
    isNurse
      ? { name: row.customerName, caption: row.jobName }
      : { name: row.worker.name, caption: row.worker.jobRole, avatarUrl: row.worker.avatarUrl };

  const tableHead = [
    { id: 'reference', label: 'Shift' },
    { id: 'location', label: 'Location' },
    { id: 'person', label: labels.person },
    { id: 'hours', label: 'Hours', align: 'center' },
    { id: 'amount', label: isSpend ? 'You pay (£)' : 'You earn (£)', align: 'right' },
    { id: 'status', label: 'Status' },
  ];

  // Show every day on a week; thin the labels out on a month so they don't collide.
  const labelStep = categories.length > 10 ? Math.ceil(categories.length / 8) : 1;

  const chartOptions = useChart({
    colors: [theme.palette.primary.main],
    stroke: { width: 2, curve: 'straight' },
    xaxis: {
      categories,
      labels: {
        rotate: 0,
        formatter: (value) => (categories.indexOf(value) % labelStep === 0 ? value : ''),
      },
    },
    yaxis: {
      tickAmount: 4,
      labels: {
        formatter: (value) => fCurrency(value, { notation: 'compact', maximumFractionDigits: 1 }),
      },
    },
    tooltip: {
      x: {
        formatter: (value, { dataPointIndex } = {}) => {
          const date = daily?.dates?.[dataPointIndex];
          return date ? format(new Date(`${date}T00:00:00`), 'EEE d MMM yyyy') : value;
        },
      },
      y: {
        formatter: (value, { dataPointIndex } = {}) => {
          const bookings = daily?.bookings?.[dataPointIndex] || 0;
          return bookings ? `${fCurrency(value)} · ${plural(bookings, 'shift')}` : fCurrency(value);
        },
      },
    },
    grid: { strokeDashArray: 3 },
  });

  const handlePeriodSelect = useCallback((id) => {
    setPeriodId(id);
    setWorkerFilter(null);
    setStatusFilter('');
    setPeriodAnchor(null);
    setPage(0);
  }, []);

  const handleWorkerClick = useCallback((worker) => {
    setWorkerFilter((prev) => (prev?.id === worker.id ? null : { id: worker.id, name: worker.name }));
    setPage(0);
  }, []);

  const handleStatusClick = useCallback((status) => {
    setStatusFilter((prev) => (prev === status ? '' : status));
    setPage(0);
  }, []);

  const handleExport = async () => {
    try {
      const all = await fetchAllEarnings({ ...filterArgs, page: 1, limit: EXPORT_LIMIT }).unwrap();
      exportEarningsReport({
        title: labels.title,
        periodLabel: `${period.label} (${range.from} to ${range.to})`,
        summaryRows: [
          [`${labels.total} (£)`, all.summary.total.amount.toFixed(2)],
          ...PAYMENT_STATUSES.map((status) => [
            `${statusLabel(status)} (£)`,
            all.summary[status].amount.toFixed(2),
          ]),
          [labels.shifts, all.summary.total.bookings],
          ['Hours', all.summary.total.hours],
        ],
        topWorkers: all.topWorkers || [],
        columns: [
          { label: 'Shift ref', value: (row) => row.reference },
          { label: 'Date', value: (row) => row.date },
          { label: 'Time', value: (row) => row.time },
          { label: 'Job', value: (row) => row.jobName },
          { label: 'Location', value: (row) => row.location },
          { label: 'Address', value: (row) => row.address },
          { label: labels.person, value: (row) => personOf(row).name },
          { label: 'Hours', value: (row) => row.hours },
          { label: 'Amount (£)', value: (row) => row.amount.toFixed(2) },
          { label: 'Status', value: (row) => statusLabel(row.paymentStatus) },
        ],
        rows: all.history,
        filename: `${labels.title.toLowerCase()}-${range.from}-to-${range.to}.csv`,
      });
      if (all.meta.totalRecords > EXPORT_LIMIT) {
        toast.warning(`Exported the first ${EXPORT_LIMIT} of ${all.meta.totalRecords} shifts`);
      } else {
        toast.success(`${labels.title} report exported`);
      }
    } catch (exportError) {
      toast.error(exportError?.data?.message || 'Could not export the report');
    }
  };

  const statCards = summary
    ? [
        {
          title: labels.total,
          total: summary.total.amount,
          percent: percentChange(summary.total.amount, previous?.total.amount),
          color: theme.palette.primary.main,
          series: daily?.earned,
        },
        {
          title: labels.paid,
          total: summary.paid.amount,
          percent: percentChange(summary.paid.amount, previous?.paid.amount),
          color: theme.palette.success.main,
          series: daily?.paid,
        },
        {
          title: 'Pending',
          total: summary.pending.amount,
          percent: percentChange(summary.pending.amount, previous?.pending.amount),
          color: theme.palette.warning.main,
          series: daily?.pending,
        },
        {
          title: labels.shifts,
          total: summary.total.bookings,
          percent: percentChange(summary.total.bookings, previous?.total.bookings),
          color: theme.palette.info.main,
          series: daily?.bookings,
          isCount: true,
        },
      ]
    : [];

  const renderTrend = (
    <Card sx={{ p: 3, borderRadius: 3, height: 1 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Box>
          <Typography variant="h6">{labels.title} trend</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Daily {labels.series.toLowerCase()} on completed shifts, {period.label.toLowerCase()}
          </Typography>
        </Box>
        <Chip
          size="small"
          variant="soft"
          color="primary"
          label={`${fCurrency(summary?.total.amount || 0)} total`}
        />
      </Stack>
      {daily?.earned?.some((value) => value > 0) ? (
        <Chart
          type="area"
          series={[{ name: labels.series, data: daily.earned }]}
          options={chartOptions}
          height={280}
        />
      ) : (
        <DashboardEmptyState
          message={`No completed shifts ${period.label.toLowerCase()}`}
          hint="Completed shifts will show here"
          minHeight={280}
        />
      )}
    </Card>
  );

  const renderPaymentStatus = (
    <Card sx={{ p: 3, borderRadius: 3, height: 1 }}>
      <Typography variant="h6">Payment status</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Completed shifts, {period.label.toLowerCase()}. Tap one to filter the table.
      </Typography>
      <Stack spacing={1.5}>
        {PAYMENT_STATUSES.filter(
          // Refunded and failed only appear once there's something in them.
          (status) => !['refunded', 'failed'].includes(status) || summary?.[status]?.bookings > 0
        ).map((status) => {
          const meta = STATUS_META[status];
          const block = summary?.[status] || { amount: 0, bookings: 0 };
          const isActive = statusFilter === status;
          return (
            <Stack
              key={status}
              direction="row"
              alignItems="center"
              spacing={1.5}
              onClick={() => handleStatusClick(status)}
              sx={{
                p: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                bgcolor: isActive ? 'action.selected' : 'background.neutral',
                border: (t) =>
                  `1px solid ${isActive ? t.vars.palette.text.disabled : t.vars.palette.divider}`,
                transition: 'background-color 0.2s',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'background.paper',
                  color: meta.color === 'default' ? 'text.secondary' : `${meta.color}.main`,
                }}
              >
                <Iconify icon={meta.icon} width={20} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2">{meta.label}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {plural(block.bookings, 'shift')}
                </Typography>
              </Box>
              <Typography variant="subtitle2">{fCurrency(block.amount)}</Typography>
            </Stack>
          );
        })}
      </Stack>

      {data?.breakdown && (
        <Stack spacing={0.75} sx={{ mt: 2.5 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Paid to suppliers
            </Typography>
            <Typography variant="subtitle2">{fCurrency(data.breakdown.paidToSuppliers)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Platform fees
            </Typography>
            <Typography variant="subtitle2">{fCurrency(data.breakdown.platformFee)}</Typography>
          </Stack>
        </Stack>
      )}

      {data?.agencySupplied && (
        <Alert severity="info" variant="outlined" sx={{ mt: 2.5 }}>
          {plural(data.agencySupplied.bookings, 'shift')} ({fNumber(data.agencySupplied.hours)}h)
          worked through your agency are paid by them and not included here.
        </Alert>
      )}
    </Card>
  );

  const renderTable = (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', height: 1 }}>
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography variant="h6">Completed shifts</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Newest first, with payment status
        </Typography>
      </Box>
      {isFetching && <LinearProgress sx={{ height: 2 }} />}
      {history.length ? (
        <>
          <Scrollbar>
            <Table size="small" sx={{ minWidth: 760 }}>
              <TableHeadCustom headLabel={tableHead} />
              <TableBody>
                {history.map((row) => {
                  const person = personOf(row);
                  return (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{row.reference || '—'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {[row.date, row.time].filter(Boolean).join(' · ')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {row.location || row.jobName || '—'}
                        </Typography>
                        {row.address && (
                          <Typography
                            variant="caption"
                            noWrap
                            display="block"
                            title={row.address}
                            sx={{ color: 'text.secondary', maxWidth: 200 }}
                          >
                            {row.address}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          {!isNurse && (
                            <Avatar
                              src={person.avatarUrl}
                              alt={person.name}
                              sx={{ width: 32, height: 32 }}
                            >
                              {person.name?.[0]?.toUpperCase()}
                            </Avatar>
                          )}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap>
                              {person.name || '—'}
                            </Typography>
                            {person.caption && (
                              <Typography
                                variant="caption"
                                noWrap
                                display="block"
                                sx={{ color: 'text.secondary' }}
                              >
                                {person.caption}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell align="center">{fNumber(row.hours)}h</TableCell>
                      <TableCell align="right">
                        {isNurse && row.creditedToEmployer ? (
                          <Typography variant="caption" color="text.secondary">
                            Paid to employer
                          </Typography>
                        ) : (
                          <Typography variant="subtitle2">
                            {fCurrency(isSpend ? row.gross || row.amount : row.totalAmount || row.amount)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Label
                          variant="soft"
                          color={STATUS_META[row.paymentStatus]?.color || 'default'}
                        >
                          {statusLabel(row.paymentStatus)}
                        </Label>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Scrollbar>
          <TablePaginationCustom
            count={data?.meta.totalRecords || 0}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value));
              setPage(0);
            }}
          />
        </>
      ) : (
        <DashboardEmptyState
          message="No completed shifts"
          hint={
            workerFilter || statusFilter
              ? 'Nothing matches these filters. Clear them to see all shifts.'
              : `Nothing completed ${period.label.toLowerCase()} yet`
          }
          minHeight={240}
        />
      )}
    </Card>
  );

  const renderTopWorkers = topWorkers && (
    <Card sx={{ p: 3, borderRadius: 3, height: 1 }}>
      <Typography variant="h6">Staff who earned the most</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Ranked by £ earned, {period.label.toLowerCase()}. Tap to filter the table.
      </Typography>

      <Stack spacing={1.5}>
        {topWorkers.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No staff earnings for this period yet.
          </Typography>
        ) : (
          topWorkers.map((worker) => {
            const isActive = workerFilter?.id === worker.id;
            return (
              <Stack
                key={worker.id || worker.name}
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={() => handleWorkerClick(worker)}
                sx={{
                  p: 1,
                  mx: -1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: isActive ? 'primary.lighter' : 'transparent',
                  '&:hover': { bgcolor: isActive ? 'primary.lighter' : 'action.hover' },
                }}
              >
                <Avatar src={worker.avatarUrl} alt={worker.name} sx={{ width: 40, height: 40 }}>
                  {worker.name[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Typography variant="subtitle2" noWrap>
                      #{worker.rank} {worker.name}
                    </Typography>
                    {worker.rank === 1 && (
                      <Chip
                        size="small"
                        color="primary"
                        label="Top"
                        sx={{ height: 18, fontSize: 10, fontWeight: 700 }}
                      />
                    )}
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }} display="block">
                    {[worker.jobRole, plural(worker.bookings, 'shift'), `${fNumber(worker.hours)}h`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography variant="subtitle2">{fCurrency(worker.amount)}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {worker.share.toFixed(0)}%
                  </Typography>
                </Box>
              </Stack>
            );
          })
        )}
      </Stack>
    </Card>
  );

  return (
    <DashboardContent
      maxWidth="xl"
      sx={{
        '@media print': {
          '& .MuiDrawer-root, & .MuiAppBar-root, .earnings-no-print': {
            display: 'none !important',
          },
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4">{labels.title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {labels.description}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap className="earnings-no-print">
          <Chip
            label={period.label}
            color="primary"
            variant="soft"
            onClick={(e) => setPeriodAnchor(e.currentTarget)}
            onDelete={(e) => setPeriodAnchor(e.currentTarget)}
            deleteIcon={<Iconify icon="eva:arrow-ios-downward-fill" width={16} />}
            sx={{ cursor: 'pointer' }}
          />
          {workerFilter && (
            <Chip
              label={workerFilter.name}
              variant="outlined"
              onDelete={() => {
                setWorkerFilter(null);
                setPage(0);
              }}
            />
          )}
          {statusFilter && (
            <Chip
              label={statusLabel(statusFilter)}
              variant="outlined"
              onDelete={() => {
                setStatusFilter('');
                setPage(0);
              }}
            />
          )}
          <Chip
            label={isExporting ? 'Exporting…' : 'Export report'}
            variant="outlined"
            icon={<Iconify icon="solar:export-bold" width={16} />}
            onClick={handleExport}
            disabled={!data || isExporting}
            sx={{ cursor: 'pointer' }}
          />
          <Chip
            label="Print"
            variant="outlined"
            icon={<Iconify icon="solar:printer-minimalistic-bold" width={16} />}
            onClick={printEarningsReport}
            sx={{ cursor: 'pointer' }}
          />
        </Stack>
      </Stack>

      <Menu
        anchorEl={periodAnchor}
        open={Boolean(periodAnchor)}
        onClose={() => setPeriodAnchor(null)}
      >
        {PERIOD_OPTIONS.map((option) => (
          <MenuItem
            key={option.id}
            selected={option.id === periodId}
            onClick={() => handlePeriodSelect(option.id)}
          >
            {option.label}
          </MenuItem>
        ))}
      </Menu>

      {isError && !data ? (
        <Alert severity="error">
          {error?.data?.message || error?.error || `Could not load ${labels.title.toLowerCase()}`}
        </Alert>
      ) : isLoading || !data ? (
        <ModuleLoading />
      ) : (
        <Grid container spacing={3}>
          {statCards.map((card) => (
            <Grid key={card.title} xs={12} sm={6} md={3}>
              <AppWidgetSummary
                title={card.title}
                percent={card.percent}
                total={card.total}
                formatTotal={card.isCount ? fNumber : fCurrency}
                trendLabel="vs previous period"
                chart={{ colors: [card.color], categories, series: card.series || [] }}
                sx={{ height: 1 }}
              />
            </Grid>
          ))}

          <Grid xs={12} lg={8}>
            {renderTrend}
          </Grid>

          <Grid xs={12} lg={4}>
            {renderPaymentStatus}
          </Grid>

          <Grid xs={12} lg={topWorkers ? 8 : 12}>
            {renderTable}
          </Grid>

          {topWorkers && (
            <Grid xs={12} lg={4}>
              {renderTopWorkers}
            </Grid>
          )}
        </Grid>
      )}
    </DashboardContent>
  );
}
