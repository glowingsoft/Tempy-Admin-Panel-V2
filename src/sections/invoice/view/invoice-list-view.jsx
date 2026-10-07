import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import TableBody from '@mui/material/TableBody';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';

import { usePathname, useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import { useViewOnly } from 'src/hooks/use-view-only';

import { sumBy } from 'src/utils/helper';
import { fIsAfter, fIsBetween } from 'src/utils/format-time';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';
import { getInvoiceOverviewCopy, getInvoiceServiceOptionsForRole } from 'src/_mock';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { InvoiceAnalytic } from '../invoice-analytic';
import { InvoiceTableRow } from '../invoice-table-row';
import { InvoiceTableToolbar } from '../invoice-table-toolbar';
import { InvoiceTableFiltersResult } from '../invoice-table-filters-result';
import {
  exportInvoicesCsv,
  loadStoredInvoices,
  parseInvoicesCsv,
  printInvoices,
  saveStoredInvoices,
} from '../invoice-actions';
import { getInvoicePaths, getInvoiceRoleKey, isEmployerInvoiceRole } from '../invoice-route-utils';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'invoiceNumber', label: 'Billed to' },
  { id: 'createDate', label: 'Issued' },
  { id: 'dueDate', label: 'Due' },
  { id: 'price', label: 'Amount' },
  { id: 'sent', label: 'Copies', align: 'center' },
  { id: 'status', label: 'Status' },
  { id: '' },
];

// ----------------------------------------------------------------------

export function InvoiceListView() {
  const viewOnly = useViewOnly();
  const theme = useTheme();
  const location = useLocation();
  const pathname = usePathname();
  const invoicePaths = getInvoicePaths(pathname);
  const roleKey = invoicePaths.roleKey || getInvoiceRoleKey(pathname);
  const overviewCopy = getInvoiceOverviewCopy(roleKey);
  const serviceOptions = getInvoiceServiceOptionsForRole(roleKey);

  const router = useRouter();

  const table = useTable({ defaultDense: true });

  const confirm = useBoolean();

  const [tableData, setTableData] = useState(() => loadStoredInvoices(roleKey));

  useEffect(() => {
    saveStoredInvoices(tableData, roleKey);
  }, [tableData, roleKey]);

  useEffect(() => {
    setTableData(loadStoredInvoices(roleKey));
  }, [location.pathname, roleKey]);

  const persistRows = useCallback(
    (nextRows) => {
      setTableData(nextRows);
      saveStoredInvoices(nextRows, roleKey);
    },
    [roleKey]
  );

  const filters = useSetState({
    name: '',
    service: [],
    status: 'all',
    startDate: null,
    endDate: null,
  });

  const dateError = fIsAfter(filters.state.startDate, filters.state.endDate);

  const dataFiltered = applyFilter({
    inputData: tableData,
    filters: filters.state,
    dateError,
  });

  const dataInPage = rowInPage(dataFiltered, table.page, table.rowsPerPage);

  const canReset =
    !!filters.state.name ||
    filters.state.service.length > 0 ||
    filters.state.status !== 'all' ||
    (!!filters.state.startDate && !!filters.state.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const getInvoiceLength = (status) => tableData.filter((item) => item.status === status).length;

  const getTotalAmount = (status) =>
    sumBy(
      tableData.filter((item) => item.status === status),
      (invoice) => invoice.totalAmount
    );

  const getPercentByStatus = (status) => (getInvoiceLength(status) / tableData.length) * 100;

  const TABS = [
    {
      value: 'all',
      label: 'All',
      color: 'default',
      count: tableData.length,
    },
    {
      value: 'paid',
      label: 'Paid',
      color: 'success',
      count: getInvoiceLength('paid'),
    },
    {
      value: 'pending',
      label: 'Pending',
      color: 'warning',
      count: getInvoiceLength('pending'),
    },
    {
      value: 'overdue',
      label: 'Overdue',
      color: 'error',
      count: getInvoiceLength('overdue'),
    },
    {
      value: 'draft',
      label: 'Draft',
      color: 'default',
      count: getInvoiceLength('draft'),
    },
  ];

  const handleDeleteRow = useCallback(
    (id) => {
      const deleteRow = tableData.filter((row) => row.id !== id);

      toast.success('Delete success!');

      setTableData(deleteRow);
      saveStoredInvoices(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);
    },
    [dataInPage.length, table, tableData]
  );

  const handleDeleteRows = useCallback(() => {
    const count = table.selected.length;
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));

    toast.success(`Deleted ${count} invoice${count > 1 ? 's' : ''}`);

    setTableData(deleteRows);
    saveStoredInvoices(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });
  }, [dataFiltered.length, dataInPage.length, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(invoicePaths.edit(id));
    },
    [invoicePaths, router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(invoicePaths.details(id));
    },
    [invoicePaths, router]
  );

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  const handlePrintRows = useCallback(
    (rows) => {
      if (!rows.length) {
        toast.warning('No invoices to print');
        return;
      }
      toast.info(`Printing ${rows.length} invoice${rows.length > 1 ? 's' : ''}...`);
      printInvoices();
    },
    []
  );

  const handleExportRows = useCallback((rows, filename = 'invoices.csv') => {
    if (!rows.length) {
      toast.warning('No invoices to export');
      return;
    }

    exportInvoicesCsv(rows, filename);
    toast.success(`Exported ${rows.length} invoice${rows.length > 1 ? 's' : ''}`);
  }, []);

  const getSelectedRows = useCallback(
    () => tableData.filter((row) => table.selected.includes(row.id)),
    [table.selected, tableData]
  );

  const handleExportSelected = useCallback(
    (event) => {
      event.stopPropagation();
      handleExportRows(getSelectedRows(), 'selected-invoices.csv');
    },
    [getSelectedRows, handleExportRows]
  );

  const handlePrintSelected = useCallback(
    (event) => {
      event.stopPropagation();
      handlePrintRows(getSelectedRows());
    },
    [getSelectedRows, handlePrintRows]
  );

  const handleDeleteSelected = useCallback(
    (event) => {
      event.stopPropagation();
      if (!table.selected.length) {
        toast.warning('Select invoices to delete');
        return;
      }
      confirm.onTrue();
    },
    [confirm, table.selected.length]
  );

  const handleImportFile = useCallback(
    (file) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const imported = parseInvoicesCsv(String(event.target?.result || ''), tableData);

          if (!imported.length) {
            toast.error('No valid rows found in CSV file');
            return;
          }

          const nextRows = [...imported, ...tableData];
          persistRows(nextRows);
          toast.success(`Imported ${imported.length} invoice${imported.length > 1 ? 's' : ''}`);
        } catch (error) {
          console.error(error);
          toast.error('Could not import CSV file');
        }
      };

      reader.readAsText(file);
    },
    [persistRows, tableData]
  );

  const selectedRows = tableData.filter((row) => table.selected.includes(row.id));
  const rowsToPrint = selectedRows.length ? selectedRows : dataFiltered;
  const rowsToExport = selectedRows.length ? selectedRows : dataFiltered;

  return (
    <>
      <DashboardContent
        sx={{
          '@media print': {
            '& .MuiDrawer-root, & .MuiAppBar-root, .invoice-no-print': {
              display: 'none !important',
            },
          },
        }}
      >
        <CustomBreadcrumbs
          heading="Invoices"
          links={[
            { name: 'Dashboard', href: invoicePaths.dashboard },
            { name: 'Invoices', href: invoicePaths.list },
            { name: 'List' },
          ]}
          action={
            viewOnly || isEmployerInvoiceRole(roleKey) ? null : (
              <Button
                component={RouterLink}
                href={invoicePaths.new}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                className="invoice-no-print"
              >
                New invoice
              </Button>
            )
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card sx={{ mb: { xs: 3, md: 5 }, borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: 'background.neutral' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography variant="h5">{overviewCopy.title}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 620 }}>
                  {overviewCopy.subtitle}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip color="primary" label="Monthly billing" />
                <Chip color="success" variant="outlined" label="Auto reminders" />
                <Chip color="warning" variant="outlined" label="3 due this week" />
              </Stack>
            </Stack>
          </Box>

          <Scrollbar sx={{ minHeight: 108 }}>
            <Stack
              direction="row"
              divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
              sx={{ py: 2 }}
            >
              <InvoiceAnalytic
                title="Total issued"
                total={tableData.length}
                percent={100}
                price={sumBy(tableData, (invoice) => invoice.totalAmount)}
                icon="solar:bill-list-bold-duotone"
                color={theme.vars.palette.info.main}
              />

              <InvoiceAnalytic
                title="Paid"
                total={getInvoiceLength('paid')}
                percent={getPercentByStatus('paid')}
                price={getTotalAmount('paid')}
                icon="solar:file-check-bold-duotone"
                color={theme.vars.palette.success.main}
              />

              <InvoiceAnalytic
                title="Pending"
                total={getInvoiceLength('pending')}
                percent={getPercentByStatus('pending')}
                price={getTotalAmount('pending')}
                icon="solar:sort-by-time-bold-duotone"
                color={theme.vars.palette.warning.main}
              />

              <InvoiceAnalytic
                title="Overdue"
                total={getInvoiceLength('overdue')}
                percent={getPercentByStatus('overdue')}
                price={getTotalAmount('overdue')}
                icon="solar:bell-bing-bold-duotone"
                color={theme.vars.palette.error.main}
              />

              <InvoiceAnalytic
                title="Draft"
                total={getInvoiceLength('draft')}
                percent={getPercentByStatus('draft')}
                price={getTotalAmount('draft')}
                icon="solar:file-corrupted-bold-duotone"
                color={theme.vars.palette.text.secondary}
              />
            </Stack>
          </Scrollbar>
        </Card>

        <Card>
          <Tabs
            value={filters.state.status}
            onChange={handleFilterStatus}
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

          <InvoiceTableToolbar
            filters={filters}
            dateError={dateError}
            onResetPage={table.onResetPage}
            onPrint={() => handlePrintRows(rowsToPrint)}
            onExport={() => handleExportRows(rowsToExport)}
            onImport={handleImportFile}
            options={{
              services: serviceOptions.map((option) => option.name),
              searchPlaceholder:
                roleKey === 'homeCareCompany' || roleKey === 'individualHomeCare'
                  ? 'Search client or invoice number...'
                  : 'Search customer or invoice number...',
            }}
          />

          {canReset && (
            <InvoiceTableFiltersResult
              filters={filters}
              onResetPage={table.onResetPage}
              totalResults={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) => {
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                );
              }}
              action={
                <Stack direction="row">
                  <Tooltip title="Export">
                    <IconButton color="primary" onClick={handleExportSelected}>
                      <Iconify icon="eva:download-outline" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Print">
                    <IconButton color="primary" onClick={handlePrintSelected}>
                      <Iconify icon="solar:printer-minimalistic-bold" />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete" style={viewOnly ? { display: 'none' } : undefined}>
                    <IconButton color="primary" onClick={handleDeleteSelected}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                <TableHeadCustom
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <InvoiceTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onViewRow={() => handleViewRow(row.id)}
                        onEditRow={viewOnly ? undefined : () => handleEditRow(row.id)}
                        onDeleteRow={viewOnly ? undefined : () => handleDeleteRow(row.id)}
                      />
                    ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
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

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={
          <>
            Are you sure want to delete <strong> {table.selected.length} </strong> items?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}

function applyFilter({ inputData, filters, dateError }) {
  const { name, status, service, startDate, endDate } = filters;

  let data = [...inputData];

  if (name) {
    data = data.filter(
      (invoice) =>
        invoice.invoiceNumber.toLowerCase().indexOf(name.toLowerCase()) !== -1 ||
        invoice.invoiceTo.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  if (status !== 'all') {
    data = data.filter((invoice) => invoice.status === status);
  }

  if (service.length) {
    data = data.filter((invoice) =>
      invoice.items.some((filterItem) => service.includes(filterItem.service))
    );
  }

  if (!dateError) {
    if (startDate && endDate) {
      data = data.filter((invoice) => fIsBetween(invoice.createDate, startDate, endDate));
    }
  }

  return data;
}
