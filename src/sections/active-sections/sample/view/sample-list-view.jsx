import { debounce } from 'lodash';
import isEqual from 'lodash/isEqual';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { LinearProgress, TableContainer } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { Scrollbar } from 'src/components/scrollbar';
import {
  emptyRows,
  TableEmptyRows,
  TableHeadCustom,
  TableNoData,
  TablePaginationCustom,
  useTable
} from 'src/components/table';

import { useGetWalletsQuery } from 'src/store/Reducer/wallets-api';
import { DevicesTableFiltersResult } from '../sample-table-filters-result';
import { DevicesTableRow } from '../sample-table-row';
import { DevicesTableToolbar } from '../sample-table-toolbar';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'serial', label: 'Sr No.' },
  { id: 'name', label: 'Name' },
  { id: 'balance', label: 'Balance' },
  { id: 'createdAt', label: 'Created At' },
  { id: 'status', label: 'Status' },
  { id: 'action', label: 'Action', width: 100 },
];

// ----------------------------------------------------------------------

export function SampleListView() {
  let count = 0;

  const router = useRouter();
  const table = useTable();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const defaultFilters = {
    name: '',
    title: '',
    role: [],
    service: [],
    status: 'all',
    startDate: null,
    endDate: null,
  };

  const [filters, setFilters] = useState(defaultFilters);
  const [searchInput, setSearchInput] = useState('');

  const {
    data: { data = [], total_length = 0 } = {},
    isLoading,
    status,
    refetch
  } = useGetWalletsQuery({
    page,
    search: filters.name,
  });

  console.log("total_length", total_length);

  const debouncedSearch = useMemo(
    () =>
      debounce((value) => {
        setFilters((prev) => ({ ...prev, name: value }));
      }, 300),
    [refetch]
  );

  const handleSearchChange = (event) => {
    const { value } = event.target;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const denseHeight = table.dense ? 52 : 72;
  const canReset = !isEqual(defaultFilters, filters);
  const notFound = !isLoading && data.length === 0;

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.invoice.edit(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.invoice.details(id));
    },
    [router]
  );

  useEffect(() => {
    setPage(0);
  }, [filters.name]);

  useEffect(() => {
    refetch();
  }, [page, rowsPerPage, filters.name, refetch]);

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      table.onResetPage();
      filters.setState({ status: newValue });
    },
    [filters, table]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
    setSearchInput('');
  }, []);

  const handleAddCampaign = () => {
    router.push(paths.dashboard.addCampaigns);
  }

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const dataFiltered = {};

  return (
    <Box sx={{ px: { xs: 2, md: 6 }, pb: 1, pt: 3, display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          gap: 1,
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'start', md: 'center' },
        }}
      >
        <CustomBreadcrumbs
          heading="Wallets"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Wallets' },
          ]}
          sx={{ mb: { xs: 3, md: 3 } }}
        />
      </Box>

      <Card>
        <DevicesTableToolbar
          filters={{ ...filters, name: searchInput }}
          onFilters={(name, value) => handleSearchChange({ target: { value } })}
        />

        {canReset && (
          <DevicesTableFiltersResult
            filters={filters}
            onFilters={(name, value) => setFilters((prev) => ({ ...prev, [name]: value }))}
            onResetFilters={handleResetFilters}
            results={total_length}
            sx={{ p: 2.5, pt: 0 }}
          />
        )}

        <Box sx={{ position: 'relative' }}>
          <TableContainer sx={{ position: 'relative', overflow: 'unset', zIndex: 100 }}>
            <Scrollbar sx={{ minHeight: 444 }}>
              {status === 'pending' ? (
                <Box sx={{ width: '100%' }}>
                  <LinearProgress />
                </Box>
              ) : (
                <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                  <TableHeadCustom
                    order={table.order}
                    orderBy={table.orderBy}
                    headLabel={TABLE_HEAD}
                    rowCount={dataFiltered.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                  />

                  <TableBody>
                    {data?.length > 0 ? (
                      data?.map((row, index) => (
                        (count = count + 1),
                        (
                          <DevicesTableRow
                            key={row.id || row._id || index}
                            row={row}
                            index={index + 1}
                            selected={table.selected.includes(row.id)}
                            onSelectRow={() => table.onSelectRow(row.id)}
                            onViewRow={() => handleViewRow(row.id)}
                            onEditRow={() => handleEditRow(row.id)}
                            counter={index + 1 + page * rowsPerPage}
                          />
                        )
                      ))
                    ) : (
                      <TableNoData notFound={notFound} />
                    )}

                    <TableEmptyRows
                      height={table.dense ? 56 : 56 + 20}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                    />

                    {/* <TableNoData notFound={notFound} /> */}
                  </TableBody>
                </Table>
              )}
            </Scrollbar>
          </TableContainer>
        </Box>

        <TablePaginationCustom
          page={page}
          count={total_length || 1}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Card>
    </Box>
  );
}
