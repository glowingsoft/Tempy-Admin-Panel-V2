import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import { memo, useCallback, useMemo } from 'react';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { WALLET_STATUS_OPTIONS } from 'src/_mock';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import {
  TableEmptyRows,
  TableHeadCustom,
  TableNoData,
  TablePaginationCustom,
} from 'src/components/table';

import { useDeleteWalletMutation, useGetWalletsQuery } from 'src/store/Reducer/wallets-api';
import { applySorting } from 'src/utils/table-utils';

// Import flexible table system
import { createFilterField } from 'src/components/generic-table/table-filter-fields';
import { FlexibleTableFiltersResult } from 'src/components/generic-table/table-filters-result';
import { FlexibleTableToolbar } from 'src/components/generic-table/table-toolbar';
import { StatusTabsFilterWrapper } from 'src/components/generic-table/tabs-filter-wrapper';
import { useDataTable } from 'src/hooks/use-data-table';
import { useDeleteConfirmation } from 'src/hooks/use-delete-confirmation';

import { DATE_FORMAT_PRESETS } from 'src/utils/date-formatter';
import { SampleTableRow } from './sample-table-row';
import { DUMMYDATA } from './mocks/mock-data';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All', color: 'default' },
  ...WALLET_STATUS_OPTIONS.map((option) => ({
    ...option,
    color:
      (option.value === 'active' && 'success') ||
      (option.value === 'pending' && 'warning') ||
      (option.value === 'inactive' && 'error') ||
      'default',
  })),
];

const TABLE_HEAD = [
  { id: 'sr', label: 'Sr#', width: 80 },
  { id: 'name', label: 'Name' },
  { id: 'balance', label: 'Balance' },
  { id: 'createdAt', label: 'Created At' },
  { id: 'status', label: 'Status' },
  { id: 'action', label: 'Action', width: 100 },
];

// ----------------------------------------------------------------------

const TIME_PERIOD_OPTIONS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

const WALLET_FILTER_FIELDS = [
  createFilterField.status({
    options: STATUS_OPTIONS,
    showCounts: true,
  }),

  createFilterField.search({
    placeholder: 'Search wallets...',
  }),

  createFilterField.select({
    key: 'timePeriod',
    label: 'Time Period',
    options: TIME_PERIOD_OPTIONS,
    defaultValue: 'all',
  }),

  createFilterField.select({
    key: 'transactionType',
    label: 'Transaction Type',
    options: [
      { value: 'all', label: 'All Types' },
      { value: 'credit', label: 'Credit' },
      { value: 'debit', label: 'Debit' },
    ],
  }),

  // Date Range filter
  createFilterField.dateRange({
    key: 'dateRange',
    startLabel: 'Start Date',
    endLabel: 'End Date',
    displayFormat: DATE_FORMAT_PRESETS.UK, // Shows in chips: "05/12/2025"
    apiFormat: DATE_FORMAT_PRESETS.ISO, // Sends to API: "2025-12-05"
    outputFormat: 'flat',
  }),

  // Single date filter
  createFilterField.date({
    key: 'date',
    label: 'Created Date',
    placeholder: 'Select date',
    displayFormat: DATE_FORMAT_PRESETS.UK, // Shows in chips: "05/12/2025" (DD/MM/YYYY)
    apiFormat: DATE_FORMAT_PRESETS.ISO, // Sends to API: "2025-12-05"
  }),
];

// Generate default filter values from field definitions
const DEFAULT_FILTERS = WALLET_FILTER_FIELDS.reduce((acc, field) => {
  acc[field.key] = field.defaultValue;
  return acc;
}, {});

// ----------------------------------------------------------------------

// Memoized Table Content Component
const TableContent = memo(({
  isLoading,
  isFetching,
  sortedData,
  currentPage,
  itemsPerPage,
  onDeleteRow,
  table,
}) => (
  <TableBody>
    {!isLoading &&
      !isFetching &&
      sortedData.map((row, index) => (
        // DUMMYDATA.map((row, index) => (
        <SampleTableRow
          key={row._id}
          row={row}
          serialNumber={currentPage * itemsPerPage + index + 1}
          onDeleteRow={() => onDeleteRow(row._id, row.name)}
        />
      ))}

    {(isLoading || isFetching) && (
      <TableEmptyRows height={table.dense ? 56 : 76} emptyRows={itemsPerPage} />
    )}

    <TableNoData notFound={!isLoading && !isFetching && sortedData.length === 0} />

    {/* TODO: Comment this when real data come! */}
    {/* <TableNoData notFound={!isLoading && !isFetching && DUMMYDATA.length === 0} /> */}
  </TableBody>
));

TableContent.displayName = 'TableContent';

// ----------------------------------------------------------------------

export function SampleListView() {
  const {
    table,
    filters,
    currentPage,
    itemsPerPage,
    searchDisplayValue,
    dataList,
    totalRecords,
    meta,
    isLoading,
    isFetching,
    canReset,
    activeFilters,
    handleSearchChange,
    handleFilterChange,
    handlePageChange,
    handleRowsPerPageChange,
    handleRemoveFilter,
    handleResetFilters,
  } = useDataTable({
    queryHook: useGetWalletsQuery,
    defaultFilters: DEFAULT_FILTERS,
    filterFields: WALLET_FILTER_FIELDS,
    defaultRowsPerPage: 10,
    debounceMs: 500,
  });

  const {
    confirm,
    itemToDelete,
    isDeleting,
    handleDeleteRow,
    handleConfirmDelete,
    handleCancelDelete,
  } = useDeleteConfirmation(useDeleteWalletMutation, {
    successMessage: 'Wallet deleted successfully!',
    errorMessage: 'Failed to delete wallet',
  });

  // Apply client-side sorting with memoization
  const sortedData = useMemo(() => applySorting(dataList, table.orderBy, table.order),
    [dataList, table.orderBy, table.order]
  );

  // Calculate status counts for tabs
  const getStatusCount = useCallback((status) => {
    const statusCounts = meta?.counts || {};
    if (status === 'all') {
      return Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
    }
    return statusCounts[status] || 0;
  },
    [meta]
  );

  // Get status filter field for tabs
  const statusFilterField = useMemo(
    () => WALLET_FILTER_FIELDS.find((f) => f.type === 'status'),
    []
  );

  // Get toolbar filter fields (exclude status as it's in tabs)
  const toolbarFilterFields = useMemo(
    () => WALLET_FILTER_FIELDS.filter((f) => f.type !== 'status'),
    []
  );

  return (
    <>
      <Box sx={{ px: { xs: 2, md: 6 }, pb: 5, pt: 3, display: 'flex', flexDirection: 'column' }}>
        <CustomBreadcrumbs
          heading="Sample List"
          links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: 'Sample List' }]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.user.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Sample
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          {/* Status Tabs Filter - Conditionally Rendered */}
          <StatusTabsFilterWrapper
            filterField={statusFilterField}
            value={filters.state.status}
            onChange={handleFilterChange}
            getCount={getStatusCount}
          />

          {/* Flexible Toolbar with Debounced Search */}
          <FlexibleTableToolbar
            filterFields={toolbarFilterFields}
            filterValues={{
              ...filters.state,
              search: searchDisplayValue,
            }}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
          />

          {/* Active Filters Display */}
          {canReset && (
            <FlexibleTableFiltersResult
              activeFilters={activeFilters}
              totalResults={totalRecords}
              onResetFilters={handleResetFilters}
              onRemoveFilter={handleRemoveFilter}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            {/* Loading Indicator */}
            {isFetching && (
              <LinearProgress
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 9,
                }}
              />
            )}

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={sortedData.length}
                  onSort={table.onSort}
                />

                <TableContent
                  isLoading={isLoading}
                  isFetching={isFetching}
                  sortedData={sortedData}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onDeleteRow={handleDeleteRow}
                  table={table}
                />
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={currentPage}
            dense={table.dense}
            count={totalRecords}
            rowsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Card>
      </Box>

      <ConfirmDialog
        open={confirm.value}
        onClose={handleCancelDelete}
        title="Delete Wallet"
        content={
          <>
            Are you sure you want to delete wallet <strong>{itemToDelete?.name}</strong>? This
            action cannot be undone.
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
            startIcon={isDeleting && <CircularProgress size={20} color="inherit" />}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </>
  );
}