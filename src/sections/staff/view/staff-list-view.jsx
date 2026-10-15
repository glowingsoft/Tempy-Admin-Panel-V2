import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';

import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import { useViewOnly } from 'src/hooks/use-view-only';

import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { mergeStatusCounts } from 'src/utils/status-counts';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ModuleLoading } from 'src/components/loading-screen';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { useGetDashboardStaffQuery } from 'src/store/Reducer/staff-api';

import { resolveStaffAccountKey } from '../staff-api-utils';
import { canUseFavorites } from '../favorites-api-utils';
import { useStaffFavorites } from '../use-staff-favorites';
import { StaffTableRow } from '../staff-table-row';
import { StaffTableToolbar } from '../staff-table-toolbar';
import { StaffDetailsDialog } from '../staff-details-dialog';
import { CARE_HOME_STAFF_TABLE_HEAD, STAFF_TABLE_SX } from '../staff-table-styles';

// ----------------------------------------------------------------------

const TABLE_HEAD = CARE_HOME_STAFF_TABLE_HEAD;
const TABLE_SX = STAFF_TABLE_SX;

// ----------------------------------------------------------------------

function applyFilter({ inputData, filters }) {
  const { name, status } = filters;

  let data = inputData;

  if (status && status !== 'all') {
    data = data.filter((staff) => (staff.status || 'active') === status);
  }

  if (!name) return data;

  const query = name.toLowerCase();

  return data.filter(
    (staff) =>
      staff.name.toLowerCase().includes(query) ||
      String(staff.id).toLowerCase().includes(query) ||
      String(staff.email || '')
        .toLowerCase()
        .includes(query) ||
      String(staff.role || staff.userType || '')
        .toLowerCase()
        .includes(query) ||
      (Array.isArray(staff.specialities) ? staff.specialities : [staff.specialty])
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
  );
}

// ----------------------------------------------------------------------

export function StaffListView() {
  const viewOnly = useViewOnly();
  const table = useTable({ defaultDense: true });
  const viewDialog = useBoolean();
  const { user } = useSelector((state) => state.user);
  const accountKey = useMemo(() => resolveStaffAccountKey(user), [user]);
  const dashboardHref = getDashboardRootPath(
    user?.permission,
    user?.accountState?.accountType || user?.accountType
  );

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [errorToastShown, setErrorToastShown] = useState(false);
  const [statusCountCache, setStatusCountCache] = useState({});

  const filters = useSetState({ name: '', status: 'all' });

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetDashboardStaffQuery({
    accountKey,
    page: 0,
    limit: 100,
    status: filters.state.status === 'all' ? '' : filters.state.status,
  });

  const favoritesEnabled = canUseFavorites(user);

  const {
    isFavoriteStaff,
    toggleFavoriteStaff,
    busy: favoriteBusy,
  } = useStaffFavorites({ skip: true });

  const staffList = useMemo(
    () =>
      (data?.data || []).map((staff) => ({
        ...staff,
        isFavorite: favoritesEnabled ? isFavoriteStaff(staff) : Boolean(staff.isFavorite),
      })),
    [data, favoritesEnabled, isFavoriteStaff]
  );

  useEffect(() => {
    if (!isError || errorToastShown) return;
    const message =
      error?.data?.message || error?.error || 'Could not load staff list. Please try again.';
    toast.error(message);
    setErrorToastShown(true);
  }, [error, errorToastShown, isError]);

  const dataFiltered = applyFilter({
    inputData: staffList,
    filters: filters.state,
  });

  useEffect(() => {
    if (isLoading || isFetching) return;
    setStatusCountCache((prev) =>
      mergeStatusCounts(prev, {
        list: staffList,
        status: filters.state.status,
        totalRecords: data?.total_length ?? data?.meta?.totalRecords,
        meta: data?.meta,
      })
    );
  }, [data, filters.state.status, isFetching, isLoading, staffList]);

  const canReset = !!filters.state.name || filters.state.status !== 'all';

  const notFound =
    (!isLoading && !isFetching && !dataFiltered.length && canReset) ||
    (!isLoading && !isFetching && !dataFiltered.length);

  const handleViewRow = useCallback(
    (row) => {
      setSelectedStaff(row);
      viewDialog.onTrue();
    },
    [viewDialog]
  );

  const handleToggleFavorite = useCallback(async () => {
    if (!favoritesEnabled) return;
    const staff = selectedStaff
      ? staffList.find((row) => row.id === selectedStaff.id) || selectedStaff
      : null;
    if (!staff || favoriteBusy) return;
    await toggleFavoriteStaff(staff);
  }, [favoriteBusy, favoritesEnabled, selectedStaff, staffList, toggleFavoriteStaff]);

  const selectedStaffRecord = selectedStaff
    ? staffList.find((staff) => staff.id === selectedStaff.id) || selectedStaff
    : null;

  return (
    <>
      <DashboardContent maxWidth={false}>
        <CustomBreadcrumbs
          heading="Staff"
          links={[{ name: 'Dashboard', href: dashboardHref }, { name: 'Staff' }]}
          sx={{ mb: { xs: 2, md: 3 } }}
        />

        <Card>
          {isLoading && !staffList.length ? <ModuleLoading /> : null}

          <StaffTableToolbar
            filters={filters}
            staffList={staffList}
            statusCounts={statusCountCache}
            onResetPage={table.onResetPage}
            showAddButton={false}
          />

          {isError && (
            <Stack spacing={1.5} sx={{ px: 2.5, pb: 2 }}>
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<Iconify icon="eva:refresh-fill" width={16} />}
                    onClick={() => {
                      setErrorToastShown(false);
                      refetch();
                    }}
                  >
                    Retry
                  </Button>
                }
              >
                {error?.data?.message ||
                  error?.error ||
                  'Staff API is unavailable right now.'}
              </Alert>
            </Stack>
          )}

          <Box sx={{ position: 'relative' }}>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={TABLE_SX}>
                <TableHeadCustom headLabel={TABLE_HEAD} rowCount={dataFiltered.length} />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <StaffTableRow key={row.id} row={row} onViewRow={handleViewRow} />
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
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <StaffDetailsDialog
        open={viewDialog.value}
        onClose={viewDialog.onFalse}
        staff={selectedStaffRecord}
        onToggleFavorite={favoritesEnabled && !viewOnly ? handleToggleFavorite : undefined}
      />
    </>
  );
}
