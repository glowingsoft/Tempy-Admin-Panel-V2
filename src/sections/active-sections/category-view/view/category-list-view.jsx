import { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { RouterLink } from 'src/routes/components';
import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDebouncedCallback } from 'src/hooks/use-debounce';
import { useSetState } from 'src/hooks/use-set-state';

import { WALLET_STATUS_OPTIONS } from 'src/_mock';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import StatusTabsFilter from 'src/components/filters/status-tabs-filter';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { toast } from 'src/components/snackbar';
import {
  TableEmptyRows,
  TableHeadCustom,
  TableNoData,
  TablePaginationCustom,
  useTable,
} from 'src/components/table';

import { useDeleteWalletMutation, useGetWalletsQuery } from 'src/store/Reducer/wallets-api';
import { applySorting } from 'src/utils/table-utils';
import { UserTableToolbar } from '../category-table-toolbar';
import { UserTableFiltersResult } from '../category-table-filters-result';
import { WalletTableRow } from '../category-table-row';
import { formatDateForAPI } from 'src/utils/format-date-for-api';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: 'All', color: 'default' },
  ...WALLET_STATUS_OPTIONS.map((option) => ({
    ...option,
    color:
      (option.value === 'active' && 'success') ||
      (option.value === 'pending' && 'warning') ||
      (option.value === 'banned' && 'error') ||
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

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];
const DEFAULT_ROWS_PER_PAGE = 10;

// ----------------------------------------------------------------------

export function CategoryListView({ categoryType }) {
  const table = useTable({ defaultRowsPerPage: DEFAULT_ROWS_PER_PAGE });
  const confirm = useBoolean();

  // Filter state
  const filters = useSetState({
    name: '',
    status: 'all',
    date: null,
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  // Single API Query - Fetch data with all filters
  const {
    data: responseData,
    isLoading,
    isFetching,
  } = useGetWalletsQuery(
    {
      page: currentPage,
      search: searchQuery,
      limit: itemsPerPage,
      status: filters.state.status === 'all' ? '' : filters.state.status,
      date: formatDateForAPI(filters.state.date),
    },
    {
      refetchOnMountOrArgChange: 30,
    }
  );

  // Delete mutation
  const [deleteItem, { isLoading: isDeleting }] = useDeleteWalletMutation();

  // Debounced search handler
  const debouncedSearch = useDebouncedCallback(
    (searchValue) => {
      setSearchQuery(searchValue);
      setCurrentPage(0);
    },
    500,
    []
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (event) => {
      const value = event.target.value;
      filters.setState({ name: value });
      debouncedSearch(value);
    },
    [filters, debouncedSearch]
  );

  // Handle date change
  const handleDateChange = useCallback(
    (newDate) => {
      filters.setState({ date: newDate });
      setCurrentPage(0);
    },
    [filters]
  );

  // Handle status filter change
  const handleFilterStatus = useCallback(
    (event, newValue) => {
      filters.setState({ status: newValue });
      setCurrentPage(0);
    },
    [filters]
  );

  // Handle pagination change
  const handlePageChange = useCallback((event, newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleRowsPerPageChange = useCallback((event) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }, []);

  // Handle delete row
  const handleDeleteRow = useCallback(
    (id, name) => {
      setItemToDelete({ id, name });
      confirm.onTrue();
    },
    [confirm]
  );

  // Handle confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await deleteItem(itemToDelete.id).unwrap();
      toast.success('Wallet deleted successfully!');
      confirm.onFalse();
      setItemToDelete(null);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete wallet');
      console.error('Delete error:', error);
    }
  }, [deleteItem, itemToDelete, confirm]);

  // Handle cancel delete
  const handleCancelDelete = useCallback(() => {
    if (!isDeleting) {
      confirm.onFalse();
      setItemToDelete(null);
    }
  }, [confirm, isDeleting]);

  // Handle reset page
  const handleResetPage = useCallback(() => {
    setCurrentPage(0);
  }, []);

  // Handle remove keyword filter
  const handleRemoveKeyword = useCallback(() => {
    filters.setState({ name: '' });
    setSearchQuery('');
    debouncedSearch.cancel();
    setCurrentPage(0);
  }, [filters, debouncedSearch]);

  // Handle remove status filter
  const handleRemoveStatus = useCallback(() => {
    filters.setState({ status: 'all' });
    setCurrentPage(0);
  }, [filters]);

  // Handle remove date filter
  const handleRemoveDate = useCallback(() => {
    filters.setState({ date: null });
    setCurrentPage(0);
  }, [filters]);

  // Handle reset all filters
  const handleResetFilters = useCallback(() => {
    filters.setState({ name: '', status: 'all', date: null });
    setSearchQuery('');
    debouncedSearch.cancel();
    setCurrentPage(0);
  }, [filters, debouncedSearch]);

  // Memoized calculations
  const dataList = useMemo(() => responseData?.data || [], [responseData?.data]);
  const totalRecords = useMemo(
    () => responseData?.total_length || 0,
    [responseData?.total_length]
  );
  const statusCounts = useMemo(
    () => responseData?.meta?.counts || {},
    [responseData?.meta?.counts]
  );

  // Apply client-side sorting
  const sortedData = useMemo(
    () => applySorting(dataList, table.orderBy, table.order),
    [dataList, table.orderBy, table.order]
  );

  // Check if filters are active
  const canReset = useMemo(
    () =>
      filters.state.name !== '' ||
      filters.state.status !== 'all' ||
      filters.state.date !== null,
    [filters.state.name, filters.state.status, filters.state.date]
  );

  // Check if no data found
  const notFound = useMemo(
    () => !isLoading && !isFetching && sortedData.length === 0,
    [isLoading, isFetching, sortedData.length]
  );

  // Calculate status counts for tabs
  const getStatusCount = useCallback(
    (status) => {
      if (status === 'all') {
        return Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
      }
      return statusCounts[status] || 0;
    },
    [statusCounts]
  );

  return (
    <>
      <Box sx={{ px: { xs: 2, md: 6 }, pb: 5, pt: 3, display: 'flex', flexDirection: 'column' }}>
        <CustomBreadcrumbs
          heading={`${categoryType} Categories`}
          links={[{ name: 'Dashboard', href: paths.dashboard.root }, { name: `${categoryType} Categories` }]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.user.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              New Category
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <StatusTabsFilter
            value={filters.state.status}
            options={STATUS_OPTIONS}
            onChange={handleFilterStatus}
            getCount={getStatusCount}
          />

          <UserTableToolbar
            filters={filters}
            onSearchChange={handleSearchChange}
            onDateChange={handleDateChange}
          />

          {canReset && (
            <UserTableFiltersResult
              filters={filters}
              totalResults={totalRecords}
              onResetPage={handleResetPage}
              onRemoveKeyword={handleRemoveKeyword}
              onRemoveStatus={handleRemoveStatus}
              onRemoveDate={handleRemoveDate}
              onResetFilters={handleResetFilters}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <Box sx={{ position: 'relative' }}>
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

                <TableBody>
                  {!isLoading &&
                    !isFetching &&
                    sortedData.map((row, index) => (
                      <WalletTableRow
                        key={row._id}
                        row={row}
                        serialNumber={currentPage * itemsPerPage + index + 1}
                        onDeleteRow={() => handleDeleteRow(row._id, row.name)}
                      />
                    ))}

                  {(isLoading || isFetching) && (
                    <TableEmptyRows height={table.dense ? 56 : 76} emptyRows={itemsPerPage} />
                  )}

                  <TableNoData
                    notFound={notFound}
                    title={
                      canReset
                        ? 'No wallets found matching your filters'
                        : 'No wallets found'
                    }
                  />
                </TableBody>
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
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
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