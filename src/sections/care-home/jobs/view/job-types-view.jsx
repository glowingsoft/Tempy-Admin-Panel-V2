import { useCallback, useEffect, useMemo, useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';
import { useViewOnly } from 'src/hooks/use-view-only';

import { DashboardContent } from 'src/layouts/dashboard';

import { fCurrency } from 'src/utils/format-number';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TableHeadCustom, TableNoData, TablePaginationCustom, useTable } from 'src/components/table';
import { ModuleLoading } from 'src/components/loading-screen';

import { handleApiError } from 'src/store/handleApiError';
import {
  useCreateAdminJobRoleMutation,
  useDeleteAdminJobRoleMutation,
  useGetAdminJobRolesQuery,
  useUpdateAdminJobRoleMutation,
} from 'src/store/Reducer/admin-job-roles-api';

import {
  ADMIN_JOB_ROLE_STATUSES,
  buildAdminJobRolePayload,
} from 'src/sections/admin/job-types/admin-job-roles-api-utils';

import { DashboardStatCard } from 'src/sections/dashboard/dashboard-stat-card';

import { JobTypesProvider, useJobTypes } from '../context/job-types-provider';
import { JobTypeFormDialog } from '../job-type-form-dialog';

const TABLE_HEAD = [
  { id: 'label', label: 'Type' },
  { id: 'category', label: 'Department', width: 160 },
  { id: 'name', label: 'Title', width: 260 },
  { id: 'action', label: 'Action', width: 100, align: 'right' },
];

const ADMIN_TABLE_HEAD = [
  { id: 'label', label: 'Job type / role' },
  { id: 'category', label: 'Department', width: 160 },
  { id: 'name', label: 'Title', width: 180 },
  { id: 'description', label: 'Description', width: 280 },
  { id: 'status', label: 'Status', width: 120 },
  { id: 'earned', label: 'Earning per role', width: 160, align: 'center' },
  { id: 'action', label: '', width: 88, align: 'right' },
];

const ADMIN_JOB_TYPE_STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  ...ADMIN_JOB_ROLE_STATUSES,
];

function formatMoneyOrDash(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '—';
  return fCurrency(num);
}

export function JobTypesView({ variant = 'care-home' }) {
  if (variant === 'admin') {
    return <AdminJobTypesViewContent />;
  }

  return (
    <JobTypesProvider>
      <LocalJobTypesViewContent />
    </JobTypesProvider>
  );
}

function AdminJobTypesViewContent() {
  const formDialog = useBoolean();
  const deleteDialog = useBoolean();
  const table = useTable({ defaultRowsPerPage: 10 });

  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [editingJobType, setEditingJobType] = useState(null);
  const [jobTypeToDelete, setJobTypeToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const next = search.trim();
    if (next === keyword) return undefined;

    const timer = setTimeout(() => {
      setKeyword(next);
      table.onResetPage();
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword, search, table.onResetPage]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminJobRolesQuery(
    {
      page: table.page,
      limit: table.rowsPerPage,
      keyword,
      status: statusFilter === 'all' ? '' : statusFilter,
    },
    { refetchOnMountOrArgChange: 60, refetchOnFocus: false }
  );

  const [createJobRole] = useCreateAdminJobRoleMutation();
  const [updateJobRole] = useUpdateAdminJobRoleMutation();
  const [deleteJobRole] = useDeleteAdminJobRoleMutation();

  const jobTypes = useMemo(() => data?.data || [], [data?.data]);
  const totalCount = data?.total_length ?? data?.meta?.totalRecords ?? jobTypes.length;

  const insight = useMemo(() => {
    const departments = new Set(jobTypes.map((item) => item.category).filter(Boolean));
    const totalEarned = jobTypes.reduce((sum, item) => sum + (Number(item.earned) || 0), 0);
    const totalBilled = jobTypes.reduce((sum, item) => sum + (Number(item.billed) || 0), 0);
    const withRate = jobTypes.filter((item) => Number(item.avgRate) > 0);
    const avgRate = withRate.length
      ? withRate.reduce((sum, item) => sum + Number(item.avgRate), 0) / withRate.length
      : 0;
    return {
      types: jobTypes.length,
      departments: departments.size,
      totalEarned,
      totalBilled,
      avgRate,
    };
  }, [jobTypes]);

  const handleOpenAdd = useCallback(() => {
    setEditingJobType(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (jobType) => {
      setEditingJobType(jobType);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleFormSubmit = useCallback(
    async (formData) => {
      const payload = buildAdminJobRolePayload(formData);

      if (!payload.department || !payload.title) {
        toast.error('Department and title are required');
        return;
      }

      setSaving(true);
      try {
        if (editingJobType?.id) {
          await updateJobRole({ id: editingJobType.id, ...payload }).unwrap();
          toast.success('Job type updated');
        } else {
          await createJobRole(payload).unwrap();
          toast.success('Job type added');
        }
        setEditingJobType(null);
      } catch (err) {
        toast.error(handleApiError(err));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [createJobRole, editingJobType, updateJobRole]
  );

  const handleDeleteClick = useCallback(
    (jobType) => {
      setJobTypeToDelete(jobType);
      deleteDialog.onTrue();
    },
    [deleteDialog]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!jobTypeToDelete?.id) return;

    setSaving(true);
    try {
      await deleteJobRole(jobTypeToDelete.id).unwrap();
      toast.success('Job type deleted');
      setJobTypeToDelete(null);
      deleteDialog.onFalse();
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setSaving(false);
    }
  }, [deleteDialog, deleteJobRole, jobTypeToDelete]);

  return (
    <>
      <DashboardContent maxWidth="xl">
        <CustomBreadcrumbs
          heading="Job types & role earnings"
          links={[
            { name: 'Dashboard', href: paths.adminDashboard.root },
            { name: 'Job Types' },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenAdd}
            >
              Add type
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <DashboardStatCard
              title="Job types"
              total={insight.types}
              icon="solar:case-round-bold-duotone"
              color="primary"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <DashboardStatCard
              title="Departments"
              total={insight.departments}
              icon="solar:buildings-2-bold-duotone"
              color="info"
            />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <DashboardStatCard
              title="Earning (all roles)"
              total={formatMoneyOrDash(insight.totalEarned)}
              icon="solar:wallet-money-bold-duotone"
              color="success"
            />
          </Box>
        </Stack>

        <Card sx={{ width: 1, minWidth: 0, overflow: 'hidden' }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ p: 2.5, alignItems: { md: 'center' } }}
          >
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search department or title"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                table.onResetPage();
              }}
              sx={{ minWidth: { md: 220 } }}
            >
              {ADMIN_JOB_TYPE_STATUS_FILTERS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {isError ? (
            <Alert
              severity="error"
              sx={{ mx: 2.5, mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            >
              {handleApiError(error) || 'Failed to load job types'}
            </Alert>
          ) : null}

          {isLoading ? (
            <ModuleLoading />
          ) : (
            <Scrollbar sx={{ width: 1 }}>
              <Table size="small" sx={{ minWidth: 960 }}>
                <TableHeadCustom headLabel={ADMIN_TABLE_HEAD} rowCount={jobTypes.length} />

                <TableBody>
                  {jobTypes.map((jobType) => {
                    const statusMeta =
                      ADMIN_JOB_ROLE_STATUSES.find((item) => item.value === jobType.status) ||
                      ADMIN_JOB_ROLE_STATUSES[0];

                    return (
                      <TableRow key={jobType.id} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{jobType.label}</Typography>
                        </TableCell>

                        <TableCell>{jobType.category || '—'}</TableCell>

                        <TableCell>{jobType.name || '—'}</TableCell>

                        <TableCell sx={{ maxWidth: 320, whiteSpace: 'normal' }}>
                          {jobType.description || '—'}
                        </TableCell>

                        <TableCell>
                          <Label color={statusMeta.color} variant="soft">
                            {statusMeta.label}
                          </Label>
                        </TableCell>

                        <TableCell align="center">{formatMoneyOrDash(jobType.earned)}</TableCell>

                        <TableCell align="right">
                          <Stack direction="row" justifyContent="flex-end" spacing={0.25}>
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => handleOpenEdit(jobType)}>
                                <Iconify icon="solar:pen-bold" width={18} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(jobType)}
                              >
                                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  <TableNoData notFound={!jobTypes.length} />
                </TableBody>
              </Table>
            </Scrollbar>
          )}

          {!isLoading ? (
            <TablePaginationCustom
              count={totalCount}
              page={table.page}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onRowsPerPageChange={table.onChangeRowsPerPage}
            />
          ) : null}
        </Card>
      </DashboardContent>

      <JobTypeFormDialog
        key={editingJobType?.id || 'add'}
        open={formDialog.value}
        onClose={formDialog.onFalse}
        currentJobType={editingJobType}
        onSubmit={handleFormSubmit}
        submitting={saving}
        showStatus
      />

      <ConfirmDialog
        open={deleteDialog.value}
        onClose={deleteDialog.onFalse}
        title="Delete Job Type"
        content={
          jobTypeToDelete ? (
            <>
              Are you sure you want to delete <strong>{jobTypeToDelete.label}</strong>?
            </>
          ) : null
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={saving}
            onClick={handleConfirmDelete}
          >
            Delete
          </Button>
        }
      />
    </>
  );
}

function LocalJobTypesViewContent() {
  // Admin viewing this account: job types can be viewed, not added, edited or deleted.
  const viewOnly = useViewOnly();
  const hiddenIfViewOnly = viewOnly ? { display: 'none' } : undefined;
  const formDialog = useBoolean();
  const deleteDialog = useBoolean();

  const { jobTypes, addJobType, updateJobType, deleteJobType } = useJobTypes();

  const [editingJobType, setEditingJobType] = useState(null);
  const [jobTypeToDelete, setJobTypeToDelete] = useState(null);

  const handleOpenAdd = useCallback(() => {
    setEditingJobType(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (jobType) => {
      setEditingJobType(jobType);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleFormSubmit = useCallback(
    (formData) => {
      if (editingJobType) {
        updateJobType(editingJobType.id, formData);
        toast.success('Job type updated');
        return;
      }

      addJobType(formData);
      toast.success('Job type added');
    },
    [addJobType, editingJobType, updateJobType]
  );

  const handleDeleteClick = useCallback(
    (jobType) => {
      setJobTypeToDelete(jobType);
      deleteDialog.onTrue();
    },
    [deleteDialog]
  );

  const handleConfirmDelete = useCallback(() => {
    if (!jobTypeToDelete) return;

    deleteJobType(jobTypeToDelete.id);
    toast.success('Job type deleted');
    setJobTypeToDelete(null);
    deleteDialog.onFalse();
  }, [deleteJobType, deleteDialog, jobTypeToDelete]);

  return (
    <>
      <DashboardContent maxWidth="lg">
        <CustomBreadcrumbs
          heading="Job Types"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Jobs', href: paths.dashboard.jobs.created },
            { name: 'Job Types' },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenAdd}
              style={hiddenIfViewOnly}
            >
              Add Job Type
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <Scrollbar>
            <Table sx={{ minWidth: 720 }}>
              <TableHeadCustom headLabel={TABLE_HEAD} rowCount={jobTypes.length} />

              <TableBody>
                {jobTypes.map((jobType) => (
                  <TableRow key={jobType.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{jobType.label}</Typography>
                    </TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{jobType.category}</TableCell>

                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{jobType.name}</TableCell>

                    <TableCell align="right">
                      <Stack
                        direction="row"
                        justifyContent="flex-end"
                        spacing={0.25}
                        style={hiddenIfViewOnly}
                      >
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenEdit(jobType)}>
                            <Iconify icon="solar:pen-bold" width={18} />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(jobType)}
                          >
                            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}

                <TableNoData notFound={!jobTypes.length} />
              </TableBody>
            </Table>
          </Scrollbar>
        </Card>
      </DashboardContent>

      <JobTypeFormDialog
        key={editingJobType?.id || 'add'}
        open={formDialog.value}
        onClose={formDialog.onFalse}
        currentJobType={editingJobType}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={deleteDialog.value}
        onClose={deleteDialog.onFalse}
        title="Delete Job Type"
        content={
          jobTypeToDelete ? (
            <>
              Are you sure you want to delete <strong>{jobTypeToDelete.label}</strong>?
            </>
          ) : null
        }
        action={
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>
            Delete
          </Button>
        }
      />
    </>
  );
}
