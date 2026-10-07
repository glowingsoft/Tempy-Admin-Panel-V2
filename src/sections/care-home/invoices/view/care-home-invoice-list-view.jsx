import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { usePathname, useRouter } from 'src/routes/hooks';

import { useSetState } from 'src/hooks/use-set-state';

import { sumBy } from 'src/utils/helper';
import { fIsAfter, fTimestamp } from 'src/utils/format-time';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { CareHomeInvoiceTableRow } from '../care-home-invoice-table-row';
import { CareHomeInvoiceSummaryCards } from '../care-home-invoice-summary-cards';
import {
  getCareHomeInvoiceStats,
  loadCareHomeInvoices,
  saveCareHomeInvoices,
} from '../care-home-invoice-actions';
import { AUTO_CHARGE_DAYS } from '../care-home-invoice-data';
import { getInvoicePaths } from 'src/sections/invoice/invoice-route-utils';

const TABLE_HEAD = [
  { id: 'shift', label: 'Shift' },
  { id: 'shiftDate', label: 'Shift date' },
  { id: 'worker', label: 'Care worker' },
  { id: 'agency', label: 'Agency' },
  { id: 'amount', label: 'Amount (£)' },
  { id: 'payment', label: 'Payment' },
];

export function CareHomeInvoiceListView() {
  const theme = useTheme();
  const location = useLocation();
  const router = useRouter();
  const invoicePaths = getInvoicePaths(usePathname());
  const table = useTable({ defaultDense: true });
  const tableRef = useRef(null);

  const [tableData, setTableData] = useState(() => loadCareHomeInvoices());

  useEffect(() => {
    saveCareHomeInvoices(tableData);
  }, [tableData]);

  useEffect(() => {
    setTableData(loadCareHomeInvoices());
  }, [location.pathname]);

  const filters = useSetState({
    status: 'all',
    worker: 'all',
    agency: 'all',
    startDate: null,
    endDate: null,
  });

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const stats = useMemo(() => getCareHomeInvoiceStats(tableData), [tableData]);

  const workerOptions = useMemo(() => {
    const names = [...new Set(stats.occasional.map((row) => row.worker?.name).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [stats.occasional]);

  const agencyOptions = useMemo(() => {
    const names = [...new Set(stats.occasional.map((row) => row.agency?.name).filter(Boolean))];
    return names.sort((a, b) => a.localeCompare(b));
  }, [stats.occasional]);

  const dataFiltered = applyFilter({
    inputData: stats.occasional,
    filters: filters.state,
    dateError,
  });

  const notFound = !dataFiltered.length;

  const summaryCards = useMemo(
    () => [
      {
        value: 'all',
        label: 'Shift payments',
        count: stats.occasional.length,
        amount: sumBy(stats.occasional, (row) => row.totalAmount),
        icon: 'solar:bill-list-bold',
        color: 'primary',
      },
      {
        value: 'scheduled',
        label: 'Auto-charge pending',
        count: stats.scheduled.length,
        amount: sumBy(stats.scheduled, (row) => row.totalAmount),
        icon: 'solar:clock-circle-bold',
        color: 'warning',
      },
      {
        value: 'paid',
        label: 'Paid',
        count: stats.paid.length,
        amount: sumBy(stats.paid, (row) => row.totalAmount),
        icon: 'solar:check-circle-bold',
        color: 'success',
      },
    ],
    [stats]
  );

  const TABS = [
    { value: 'all', label: 'All', color: 'default', count: stats.occasional.length },
    { value: 'scheduled', label: 'Pending charge', color: 'warning', count: stats.scheduled.length },
    { value: 'paid', label: 'Paid', color: 'success', count: stats.paid.length },
  ];

  const applyStatusFilter = useCallback(
    (status) => {
      const nextStatus = filters.state.status === status && status !== 'all' ? 'all' : status;
      table.onResetPage();
      filters.setState({ status: nextStatus });
    },
    [filters, table]
  );

  const handleFilterStatus = useCallback(
    (_event, newValue) => {
      applyStatusFilter(newValue);
    },
    [applyStatusFilter]
  );

  const handleOpenDetails = useCallback(
    (id) => {
      const key = String(id || '').trim();
      if (!key || key === 'undefined' || key === 'null') return;
      router.push(invoicePaths.details(key));
    },
    [invoicePaths, router]
  );
  const hasFilters =
    filters.state.status !== 'all' ||
    filters.state.worker !== 'all' ||
    filters.state.agency !== 'all' ||
    Boolean(filters.state.startDate) ||
    Boolean(filters.state.endDate);

  const handleResetFilters = useCallback(() => {
    table.onResetPage();
    filters.setState({
      status: 'all',
      worker: 'all',
      agency: 'all',
      startDate: null,
      endDate: null,
    });
  }, [filters, table]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Invoices"
        links={[
          { name: 'Dashboard', href: invoicePaths.dashboard },
          { name: 'Invoices', href: invoicePaths.list },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Alert
        severity="info"
        icon={<Iconify icon="solar:info-circle-bold" width={22} />}
        sx={{ mb: 3, borderRadius: 2 }}
      >
        Shift payments for occasional staff only. When a shift is completed, the saved card is
        charged automatically after {AUTO_CHARGE_DAYS} days in £. You still pay if you leave a
        rating — a poor rating is only for non-attendance. Permanent or rotating staff are not
        billed this way yet.
      </Alert>

      <CareHomeInvoiceSummaryCards
        cards={summaryCards}
        activeFilter={filters.state.status}
        onFilter={applyStatusFilter}
      />

      <Card ref={tableRef} sx={{ scrollMarginTop: 96 }}>
        <Tabs
          value={filters.state.status}
          onChange={handleFilterStatus}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: 2.5,
            boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              iconPosition="end"
              icon={
                <Label
                  variant={
                    ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                    'soft'
                  }
                  color={tab.color}
                >
                  {tab.count}
                </Label>
              }
            />
          ))}
        </Tabs>

        <Stack
          spacing={2}
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          sx={{ p: 2.5 }}
        >
          <DatePicker
            label="From"
            value={filters.state.startDate}
            onChange={(value) => {
              table.onResetPage();
              filters.setState({ startDate: value });
            }}
            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
            sx={{ minWidth: { md: 168 } }}
          />
          <DatePicker
            label="To"
            value={filters.state.endDate}
            onChange={(value) => {
              table.onResetPage();
              filters.setState({ endDate: value });
            }}
            slotProps={{
              textField: {
                fullWidth: true,
                size: 'small',
                error: dateError,
                helperText: dateError ? 'End date must be after start date' : null,
              },
            }}
            sx={{ minWidth: { md: 168 } }}
          />
          <FormControl size="small" sx={{ minWidth: { md: 200 } }}>
            <InputLabel>Care worker</InputLabel>
            <Select
              label="Care worker"
              value={filters.state.worker}
              onChange={(event) => {
                table.onResetPage();
                filters.setState({ worker: event.target.value });
              }}
            >
              <MenuItem value="all">All workers</MenuItem>
              {workerOptions.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: { md: 200 } }}>
            <InputLabel>Agency</InputLabel>
            <Select
              label="Agency"
              value={filters.state.agency}
              onChange={(event) => {
                table.onResetPage();
                filters.setState({ agency: event.target.value });
              }}
            >
              <MenuItem value="all">All agencies</MenuItem>
              {agencyOptions.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {hasFilters ? (
            <Button color="inherit" onClick={handleResetFilters} sx={{ flexShrink: 0 }}>
              Clear
            </Button>
          ) : null}
        </Stack>

        <Box sx={{ position: 'relative' }}>
          <Scrollbar>
            <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
              <TableHeadCustom headLabel={TABLE_HEAD} rowCount={dataFiltered.length} />

              <TableBody>
                {dataFiltered
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <CareHomeInvoiceTableRow
                      key={row.id || row.invoiceNumber || row.shiftRef}
                      row={row}
                      onOpenDetails={() =>
                        handleOpenDetails(row.id || row.invoiceNumber || row.shiftRef)
                      }
                    />
                  ))}

                <TableEmptyRows
                  height={table.dense ? 56 : 76}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Box>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={dataFiltered.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>
    </DashboardContent>
  );
}

function applyFilter({ inputData, filters, dateError }) {
  const { status, worker, agency, startDate, endDate } = filters;
  let data = [...inputData];

  if (status === 'scheduled' || status === 'paid') {
    data = data.filter((row) => row.paymentStatus === status);
  }

  if (worker && worker !== 'all') {
    data = data.filter((row) => row.worker?.name === worker);
  }

  if (agency && agency !== 'all') {
    data = data.filter((row) => row.agency?.name === agency);
  }

  if (!dateError && (startDate || endDate)) {
    const startMs = startDate ? fTimestamp(startDate) : null;
    const endMs = endDate ? fTimestamp(endDate) : null;
    const startBound = typeof startMs === 'number' ? startMs : null;
    const endBound = typeof endMs === 'number' ? endMs + 24 * 60 * 60 * 1000 - 1 : null;

    data = data.filter((row) => {
      const rowMs = fTimestamp(row.shiftDate || row.completedAt);
      if (typeof rowMs !== 'number') return false;
      if (startBound != null && rowMs < startBound) return false;
      if (endBound != null && rowMs > endBound) return false;
      return true;
    });
  }

  return data.sort((a, b) => {
    const aTime = new Date(a.shiftDate || a.completedAt || 0).getTime();
    const bTime = new Date(b.shiftDate || b.completedAt || 0).getTime();
    return bTime - aTime;
  });
}
