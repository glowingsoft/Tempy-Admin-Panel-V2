import { useState, useCallback, useMemo, useEffect } from 'react';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';

import { paths } from 'src/routes/paths';
import { useBoolean } from 'src/hooks/use-boolean';
import { useSetState } from 'src/hooks/use-set-state';
import { useViewOnly } from 'src/hooks/use-view-only';
import { DashboardContent } from 'src/layouts/dashboard';
import { toast } from 'src/components/snackbar';
import { mergeStatusCounts } from 'src/utils/status-counts';
import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';
import { AGENCY_STAFF_STATUS_TABS } from 'src/_mock/_staff';
import {
  useCreateHomeCareCompanyStaffMutation,
  useDeleteHomeCareCompanyStaffMutation,
  useGetHomeCareCompanyStaffQuery,
  useImportHomeCareCompanyStaffMutation,
  useLazyGetHomeCareCompanyStaffImportTemplateQuery,
  useUpdateHomeCareCompanyStaffMutation,
} from 'src/store/Reducer/home-care-company-staff-api';
import { AgencyStaffTableRow } from 'src/sections/agency/staff/agency-staff-table-row';
import { StaffTableToolbar } from 'src/sections/staff/staff-table-toolbar';
import { AGENCY_STAFF_TABLE_HEAD, STAFF_TABLE_SX } from 'src/sections/staff/staff-table-styles';
import { HomeCareCompanyStaffFormDialog } from '../home-care-company-staff-form-dialog';
import { HomeCareCompanyStaffDetailsDialog } from '../home-care-company-staff-details-dialog';
import { StaffImportDialog } from 'src/sections/staff/staff-import-dialog';
import { saveCompanyRosterStaff } from 'src/sections/staff/company-roster-store';
import { saveTemplateResponse } from 'src/sections/staff/staff-import-utils';

const TABLE_HEAD = AGENCY_STAFF_TABLE_HEAD;
const TABLE_SX = STAFF_TABLE_SX;
const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

function applyFilter({ inputData, filters }) {
  const { name, status } = filters;
  let data = inputData;

  if (status && status !== 'all') {
    data = data.filter((staff) => (staff.status || 'pending') === status);
  }

  if (!name) return data;

  const query = name.toLowerCase();
  return data.filter(
    (staff) =>
      String(staff.name || '')
        .toLowerCase()
        .includes(query) ||
      String(staff.email || '')
        .toLowerCase()
        .includes(query) ||
      String(staff.id || '')
        .toLowerCase()
        .includes(query) ||
      String(staff.specialty || '')
        .toLowerCase()
        .includes(query)
  );
}

export function HomeCareCompanyStaffListView() {
  // Admin viewing this account: staff can be viewed, not added, edited or deleted.
  const viewOnly = useViewOnly();
  const table = useTable({ defaultDense: true, defaultRowsPerPage: 10 });
  const formDialog = useBoolean();
  const viewDialog = useBoolean();
  const deleteDialog = useBoolean();
  const importDialog = useBoolean();
  const [importing, setImporting] = useState(false);

  const [formMode, setFormMode] = useState('add');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [staffToDelete, setStaffToDelete] = useState(null);
  const [errorToastShown, setErrorToastShown] = useState(false);
  const [statusCountCache, setStatusCountCache] = useState({});
  const filters = useSetState({ name: '', status: 'all' });

  const { data, isLoading, isError, error, refetch } = useGetHomeCareCompanyStaffQuery({
    page: table.page,
    limit: table.rowsPerPage,
    status: filters.state.status,
    keyword: filters.state.name.trim(),
  });

  const [createStaff, { isLoading: creatingStaff }] = useCreateHomeCareCompanyStaffMutation();
  const [updateStaff, { isLoading: updatingStaff }] = useUpdateHomeCareCompanyStaffMutation();
  const [deleteStaff, { isLoading: deletingStaff }] = useDeleteHomeCareCompanyStaffMutation();
  const [importStaff] = useImportHomeCareCompanyStaffMutation();
  const [fetchImportTemplate, { isFetching: downloadingTemplate }] =
    useLazyGetHomeCareCompanyStaffImportTemplateQuery();

  const staffList = useMemo(() => data?.data || [], [data]);
  const totalCount = data?.meta?.totalRecords ?? data?.total_length ?? staffList.length;
  const existingStaffEmails = useMemo(
    () => staffList.map((staff) => staff.email).filter(Boolean),
    [staffList]
  );

  useEffect(() => {
    if (!isError || errorToastShown) return;
    toast.error(error?.data?.message || error?.error || 'Could not load staff list.');
    setErrorToastShown(true);
  }, [error, errorToastShown, isError]);

  const dataFiltered = useMemo(
    () => applyFilter({ inputData: staffList, filters: { name: '', status: 'all' } }),
    [staffList]
  );

  const canReset = !!filters.state.name || filters.state.status !== 'all';
  const listLoading = isLoading;

  useEffect(() => {
    if (listLoading) return;
    setStatusCountCache((prev) =>
      mergeStatusCounts(prev, {
        list: staffList,
        status: filters.state.status,
        totalRecords: data?.total_length ?? data?.meta?.totalRecords,
        meta: data?.meta,
      })
    );
  }, [data, filters.state.status, listLoading, staffList]);
  const notFound =
    (!listLoading && !dataFiltered.length && canReset) || (!listLoading && !dataFiltered.length);
  const formBusy = creatingStaff || updatingStaff;

  const handleViewRow = useCallback(
    (row) => {
      setSelectedStaff(row);
      viewDialog.onTrue();
    },
    [viewDialog]
  );

  const handleOpenAdd = useCallback(() => {
    setFormMode('add');
    setSelectedStaff(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleEditRow = useCallback(
    (row) => {
      setFormMode('edit');
      setSelectedStaff(row);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleDeleteClick = useCallback(
    (row) => {
      setStaffToDelete(row);
      deleteDialog.onTrue();
    },
    [deleteDialog]
  );

  const handleFormSubmit = useCallback(
    async (payload) => {
      if (formMode === 'edit' && selectedStaff) {
        try {
          const editId = selectedStaff.membershipId || selectedStaff._id || selectedStaff.id;
          if (!editId) {
            toast.error('Staff record id missing — cannot update');
            throw new Error('Missing staff id');
          }
          await updateStaff({ id: editId, ...payload }).unwrap();
          toast.success('Staff updated successfully!');
          // List refreshes once via invalidatesTags — do not call refetch() again.
        } catch (err) {
          toast.error(err?.data?.message || err?.error || 'Failed to update staff');
          throw err;
        }
        return;
      }

      try {
        await createStaff(payload).unwrap();
        toast.success('Staff added successfully!');
        // List refreshes once via invalidatesTags — do not call refetch() again.
      } catch (err) {
        toast.error(err?.data?.message || err?.error || 'Failed to add staff');
        throw err;
      }
    },
    [createStaff, formMode, selectedStaff, updateStaff]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!staffToDelete) return;

    try {
      await deleteStaff(staffToDelete.id).unwrap();
      toast.success('Staff deleted successfully!');
      deleteDialog.onFalse();
      setStaffToDelete(null);
      table.onUpdatePageDeleteRow(dataFiltered.length);
      // List refreshes once via invalidatesTags — do not call refetch() again.
    } catch (err) {
      toast.error(err?.data?.message || err?.error || 'Failed to delete staff');
    }
  }, [staffToDelete, deleteStaff, deleteDialog, table, dataFiltered.length]);

  const handleImportStaff = useCallback(
    async (rows, file) => {
      if (!file) {
        toast.error('Choose a CSV file first');
        return;
      }

      setImporting(true);
      try {
        const response = await importStaff(file).unwrap();
        // Keep the local rota roster in step — Shifts reads teams from it.
        saveCompanyRosterStaff('home_care_company', rows, { merge: true });
        const teams = new Set(rows.map((row) => row.team || row.role).filter(Boolean));
        toast.success(
          response?.message ||
          `Imported ${rows.length} staff · ${teams.size} team${teams.size === 1 ? '' : 's'} for your rota. Open Shifts to review.`
        );
        importDialog.onFalse();
        // List refreshes once via invalidatesTags — do not call refetch() again.
      } catch (error) {
        toast.error(error?.data?.message || error?.error || 'Failed to import staff');
      } finally {
        setImporting(false);
      }
    },
    [importDialog, importStaff]
  );

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const response = await fetchImportTemplate().unwrap();
      if (!saveTemplateResponse(response, 'home-care-company-staff-import-template.csv')) {
        toast.error('Template download returned no file');
      }
    } catch (error) {
      // The file responseHandler nests an error body under `json`.
      toast.error(
        error?.data?.json?.message ||
        error?.data?.message ||
        error?.error ||
        'Failed to download template'
      );
    }
  }, [fetchImportTemplate]);

  return (
    <>
      <DashboardContent maxWidth={false}>
        <CustomBreadcrumbs
          heading="Staff"
          links={[{ name: 'Dashboard', href: paths.dashboard.homeCareCompany.root }, { name: 'Staff' }]}
          action={
            viewOnly ? null : (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Iconify icon="solar:upload-bold" />}
                  onClick={importDialog.onTrue}
                >
                  Import staff
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="mingcute:add-line" />}
                  onClick={handleOpenAdd}
                >
                  Add Staff
                </Button>
              </Stack>
            )
          }
          sx={{ mb: { xs: 2, md: 3 } }}
        />

        <Card>
          {listLoading && !staffList.length ? <ModuleLoading /> : null}

          <StaffTableToolbar
            filters={filters}
            staffList={staffList}
            statusCounts={statusCountCache}
            onResetPage={table.onResetPage}
            showAddButton={false}
            statusTabs={AGENCY_STAFF_STATUS_TABS}
          />

          {isError ? (
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
                {error?.data?.message || error?.error || 'Staff API is unavailable right now.'}
              </Alert>
            </Stack>
          ) : null}

          <Box sx={{ position: 'relative' }}>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={TABLE_SX}>
                <TableHeadCustom headLabel={TABLE_HEAD} rowCount={dataFiltered.length} />

                <TableBody>
                  {dataFiltered.map((row) => (
                    <AgencyStaffTableRow
                      key={row.id}
                      row={row}
                      onViewRow={handleViewRow}
                      onEditRow={viewOnly ? undefined : handleEditRow}
                      onDeleteRow={viewOnly ? undefined : handleDeleteClick}
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
            count={totalCount}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          />
        </Card>
      </DashboardContent>

      {formDialog.value ? (
        <HomeCareCompanyStaffFormDialog
          key={formMode === 'edit' ? selectedStaff?.id : 'add'}
          open
          onClose={() => {
            formDialog.onFalse();
            setSelectedStaff(null);
          }}
          currentStaff={formMode === 'edit' ? selectedStaff : null}
          onSubmit={handleFormSubmit}
          existingEmails={existingStaffEmails}
          submitting={formBusy}
        />
      ) : null}

      <HomeCareCompanyStaffDetailsDialog
        open={viewDialog.value}
        onClose={viewDialog.onFalse}
        staff={selectedStaff}
      />

      <StaffImportDialog
        open={importDialog.value}
        onClose={importDialog.onFalse}
        onImport={handleImportStaff}
        onDownloadTemplate={handleDownloadTemplate}
        importing={importing}
        downloadingTemplate={downloadingTemplate}
      />

      <ConfirmDialog
        open={deleteDialog.value}
        onClose={deletingStaff ? undefined : deleteDialog.onFalse}
        title="Delete Staff"
        content={
          staffToDelete ? (
            <>
              Are you sure you want to delete <strong>{staffToDelete.name}</strong>?
            </>
          ) : null
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete} disabled={deletingStaff}>
            Delete
          </Button>
        }
      />
    </>
  );
}
