import { useMemo, useState, useCallback, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useDebounce } from 'src/hooks/use-debounce';
import { useSetState } from 'src/hooks/use-set-state';

import { DashboardContent } from 'src/layouts/dashboard';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { toast } from 'src/components/snackbar';
import { ModuleLoading } from 'src/components/loading-screen';
import {
  useTable,
  TableHeadCustom,
  TableNoData,
  TablePaginationCustom,
} from 'src/components/table';

import { handleApiError } from 'src/store/handleApiError';
import {
  useGetAdminUsersQuery,
  useUpdateAdminUserStatusMutation,
} from 'src/store/Reducer/admin-users-api';

import { ADMIN_ENTITY_STATUS_FILTERS, getAdminEntityStatusOption } from './admin-entity-status';
import {
  applyStoredStatuses,
  ACTIVE_STATUS_NOTE,
  INACTIVE_STATUS_NOTE,
  PENDING_STATUS_NOTE,
  SUSPENDED_STATUS_NOTE,
  setAccountStatusByEmail,
} from './admin-account-status';
import { ADMIN_USERS_TABLE_HEAD } from './admin-users-api-utils';
import { AdminEntityTableRow } from './admin-entity-table-row';

// ----------------------------------------------------------------------

function applyFilter({ inputData, filters, searchKeys }) {
  let data = inputData;

  if (filters.status && filters.status !== 'all') {
    data = data.filter((item) => item.status === filters.status);
  }

  const query = filters.name?.trim().toLowerCase();
  if (!query) return data;

  return data.filter((item) =>
    searchKeys.some((key) => String(item[key] || '').toLowerCase().includes(query))
  );
}


export function AdminEntityListView({
  heading,
  breadcrumbLabel,
  data: dataProp = [],
  userType = '',
  tableHead,
  searchKeys = ['name', 'email', 'location', 'phone'],
  enableView = false,
  onView,
  viewTooltip = 'View dashboard',
  viewLabel = 'View',
  onProfile,
  profileKind = '',
  profileTooltip = 'Open profile',
  onRaiseAllegation,
  raiseAllegationTooltip = 'Raise allegation & suspend',
  searchPlaceholder,
}) {
  const filters = useSetState({ name: '' });
  const table = useTable({ defaultRowsPerPage: 25 });
  const debouncedKeyword = useDebounce(filters.state.name.trim(), 400);
  const confirmStatus = useBoolean();
  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const useApi = Boolean(userType);

  useEffect(() => {
    table.onResetPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedKeyword, statusFilter]);

  const {
    data: apiResult,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useGetAdminUsersQuery(
    {
      userType,
      page: table.page,
      limit: table.rowsPerPage,
      keyword: debouncedKeyword,
      status: statusFilter,
    },
    { skip: !useApi, refetchOnMountOrArgChange: 60, refetchOnFocus: false }
  );

  const [updateAdminUserStatus] = useUpdateAdminUserStatusMutation();

  const sourceData = useMemo(() => {
    if (useApi) return apiResult?.data || [];
    return Array.isArray(dataProp) ? dataProp : [];
  }, [useApi, apiResult?.data, dataProp]);

  const [items, setItems] = useState(() =>
    useApi ? sourceData : applyStoredStatuses(sourceData)
  );

  useEffect(() => {
    setItems(useApi ? sourceData : applyStoredStatuses(sourceData));
  }, [sourceData, useApi]);

  const resolvedTableHead = tableHead || ADMIN_USERS_TABLE_HEAD;

  const handleStatusChangeRequest = useCallback(
    (row, nextStatus) => {
      setPendingStatusChange({
        id: row.id,
        name: row.name,
        email: row.email,
        currentStatus: row.status,
        nextStatus,
      });
      confirmStatus.onTrue();
    },
    [confirmStatus]
  );

  const handleCloseStatusDialog = useCallback(() => {
    confirmStatus.onFalse();
    setPendingStatusChange(null);
  }, [confirmStatus]);

  const handleConfirmStatusChange = useCallback(async () => {
    if (!pendingStatusChange || statusSaving) return;

    const { id, email, nextStatus } = pendingStatusChange;
    const label = getAdminEntityStatusOption(nextStatus).label;

    if (useApi) {
      setStatusSaving(true);
      try {
        await updateAdminUserStatus({ id, status: nextStatus, userType }).unwrap();
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item))
        );
        confirmStatus.onFalse();
        setPendingStatusChange(null);
        toast.success(
          nextStatus === 'inactive'
            ? `Status updated to ${label}. Inactive users cannot log in; previously assigned jobs remain viewable where applicable.`
            : nextStatus === 'suspended'
              ? `Status updated to ${label}. Suspended users cannot log in.`
              : nextStatus === 'pending'
                ? `Status updated to ${label}. User cannot sign in until set to Active.`
                : nextStatus === 'active'
                  ? `Status updated to ${label}. User can now sign in.`
                  : `Status updated to ${label}`
        );
      } catch (err) {
        toast.error(handleApiError(err));
      } finally {
        setStatusSaving(false);
      }
      return;
    }

    if (email) {
      setAccountStatusByEmail(email, nextStatus);
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)));
    handleCloseStatusDialog();
    toast.success(
      nextStatus === 'inactive'
        ? `Status updated to ${label}. Inactive users cannot log in; previously assigned jobs remain viewable where applicable.`
        : nextStatus === 'suspended'
          ? `Status updated to ${label}. Suspended users cannot log in.`
          : nextStatus === 'pending'
            ? `Status updated to ${label}. User cannot sign in until set to Active.`
            : nextStatus === 'active'
              ? `Status updated to ${label}. User can now sign in.`
              : `Status updated to ${label}`
    );
  }, [
    confirmStatus,
    handleCloseStatusDialog,
    pendingStatusChange,
    statusSaving,
    updateAdminUserStatus,
    useApi,
    userType,
  ]);

  const dataFiltered = useMemo(
    () =>
      applyFilter({
        inputData: items,
        filters: useApi
          ? { name: '', status: 'all' }
          : { ...filters.state, status: statusFilter },
        searchKeys,
      }),
    [items, filters.state, searchKeys, statusFilter, useApi]
  );

  const totalCount = useApi
    ? (apiResult?.meta?.totalRecords ?? apiResult?.total_length ?? items.length)
    : dataFiltered.length;

  const notFound = !dataFiltered.length && !isLoading;
  const showLoading = useApi && (isLoading || (isFetching && !items.length));

  const pendingNextLabel = pendingStatusChange
    ? getAdminEntityStatusOption(pendingStatusChange.nextStatus).label
    : '';

  const isSettingInactive = pendingStatusChange?.nextStatus === 'inactive';
  const isSettingSuspended = pendingStatusChange?.nextStatus === 'suspended';
  const isSettingPending = pendingStatusChange?.nextStatus === 'pending';
  const isSettingActive = pendingStatusChange?.nextStatus === 'active';

  return (
    <>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading={heading}
          links={[
            { name: 'Admin', href: paths.adminDashboard.root },
            { name: breadcrumbLabel },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {useApi && isError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={() => refetch()}>
                Retry
              </Button>
            }
          >
            {handleApiError(error) || 'Failed to load users'}
          </Alert>
        )}

        <Card sx={{ width: 1, minWidth: 0, overflow: 'hidden' }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
            justifyContent="space-between"
            sx={{ p: { xs: 2, sm: 2.5 } }}
          >
            <TextField
              fullWidth
              value={filters.state.name}
              onChange={(event) => filters.setState({ name: event.target.value })}
              placeholder={searchPlaceholder || `Search ${breadcrumbLabel.toLowerCase()}...`}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: { sm: 400 } }}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: 160, flexShrink: 0 }}
              InputLabelProps={{ shrink: true }}
            >
              {ADMIN_ENTITY_STATUS_FILTERS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          <Box sx={{ position: 'relative' }}>
            {showLoading ? (
              <ModuleLoading />
            ) : (
              <Scrollbar sx={{ width: 1 }}>
                <Table size="medium" sx={{ minWidth: 960 }}>
                  <TableHeadCustom headLabel={resolvedTableHead} rowCount={dataFiltered.length} />

                  <TableBody>
                    {dataFiltered.map((row) => (
                      <AdminEntityTableRow
                        key={row.id}
                        row={row}
                        tableHead={resolvedTableHead}
                        enableView={enableView}
                        onView={onView}
                        viewTooltip={viewTooltip}
                        viewLabel={viewLabel}
                        onProfile={onProfile}
                        profileKind={profileKind}
                        profileTooltip={profileTooltip}
                        onRaiseAllegation={onRaiseAllegation}
                        raiseAllegationTooltip={raiseAllegationTooltip}
                        onStatusChangeRequest={handleStatusChangeRequest}
                      />
                    ))}

                    <TableNoData notFound={notFound} />
                  </TableBody>
                </Table>
              </Scrollbar>
            )}
          </Box>

          <TablePaginationCustom
            count={totalCount}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={confirmStatus.value}
        onClose={handleCloseStatusDialog}
        title="Change status"
        content={
          <>
            Are you sure you want to change the status of{' '}
            <strong>{pendingStatusChange?.name}</strong> to <strong>{pendingNextLabel}</strong>?
            {isSettingInactive && (
              <>
                <br />
                <br />
                {INACTIVE_STATUS_NOTE}
              </>
            )}
            {isSettingSuspended && (
              <>
                <br />
                <br />
                {SUSPENDED_STATUS_NOTE}
              </>
            )}
            {isSettingPending && (
              <>
                <br />
                <br />
                {PENDING_STATUS_NOTE}
              </>
            )}
            {isSettingActive && (
              <>
                <br />
                <br />
                {ACTIVE_STATUS_NOTE}
              </>
            )}
          </>
        }
        action={
          <Button
            variant="contained"
            color="primary"
            disabled={statusSaving}
            onClick={handleConfirmStatusChange}
          >
            {statusSaving ? 'Saving...' : 'Confirm'}
          </Button>
        }
      />
    </>
  );
}
