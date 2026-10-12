import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ModuleLoading } from 'src/components/loading-screen';
import { TableHeadCustom, TableNoData, TablePaginationCustom, useTable } from 'src/components/table';

import { handleApiError } from 'src/store/handleApiError';

import { DashboardStatCard } from 'src/sections/dashboard/dashboard-stat-card';
import { AdminPlatformRules } from 'src/sections/admin/recruitment/admin-platform-rules';

import { getRecruitmentStatusOption } from '../admin-recruitment-constants';
import { useAdminRecruitment } from '../use-admin-recruitment';

const STATUS_FILTERS = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'ended', label: 'Ended' },
];

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'worker', label: 'Worker' },
  { id: 'employer', label: 'Employer' },
  { id: 'supplier', label: 'Supplier', width: 140 },
  { id: 'shifts', label: 'Shifts', width: 90, align: 'center' },
  { id: 'fee', label: 'Fee', width: 90, align: 'center' },
  { id: 'status', label: 'Status', width: 130 },
  { id: 'created', label: 'Created', width: 120 },
  { id: 'responded', label: 'Responded', width: 120 },
  { id: 'ended', label: 'Ended', width: 120 },
  { id: 'action', label: '', width: 120 },
];

// ----------------------------------------------------------------------

export function AdminRecruitmentView() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('accepted');
  const [endingRow, setEndingRow] = useState(null);
  const table = useTable({ defaultRowsPerPage: 10 });
  const { requests, totalRecords, summary, isLoading, isError, error, refetch, endHire, ending } =
    useAdminRecruitment(statusFilter, { page: table.page, limit: table.rowsPerPage });

  const dataFiltered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((row) => {
      if (!query) return true;
      return [
        row.workerName,
        row.workerEmail,
        row.employerName,
        row.employerType,
        row.supplierType,
        row.status,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [requests, search, statusFilter]);

  useEffect(() => {
    table.onResetPage();
  }, [search, statusFilter, table.onResetPage]);

  const notFound = !dataFiltered.length;

  const handleEndHire = async () => {
    if (!endingRow?.id) return;
    try {
      await endHire(endingRow.id).unwrap();
      toast.success('Permanent hire ended');
      setEndingRow(null);
    } catch (err) {
      toast.error(handleApiError(err) || 'Could not end this hire');
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <CustomBreadcrumbs
        heading="Permanent hire"
        links={[
          { name: 'Dashboard', href: paths.adminDashboard.root },
          { name: 'Permanent hire' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <AdminPlatformRules />

      <Alert severity="info" sx={{ mb: 3 }}>
        Accepted offers and current permanent hires. End a hire when that placement is finished.
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <DashboardStatCard
            title="Accepted"
            total={summary.accepted}
            icon="solar:document-text-bold-duotone"
            color="primary"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <DashboardStatCard
            title="Hired"
            total={summary.hired}
            icon="solar:user-check-rounded-bold-duotone"
            color="success"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <DashboardStatCard
            title="Total"
            total={summary.total}
            icon="solar:users-group-rounded-bold-duotone"
            color="info"
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <DashboardStatCard
            title="Conversion rate"
            total={`${summary.conversionRate}%`}
            icon="solar:chart-2-bold-duotone"
            color="primary"
          />
        </Box>
      </Stack>

      <Card>
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
            placeholder="Search worker, employer, supplier..."
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
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: { md: 220 } }}
          >
            {STATUS_FILTERS.map((option) => (
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
              <Button color="inherit" size="small" onClick={refetch}>
                Retry
              </Button>
            }
          >
            {handleApiError(error) || 'Could not load permanent hires'}
          </Alert>
        ) : null}

        {isLoading ? (
          <ModuleLoading />
        ) : (
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 1080 }}>
            <TableHeadCustom headLabel={TABLE_HEAD} />

            <TableBody>
              {dataFiltered.map((row) => {
                const status = getRecruitmentStatusOption(row.status);
                const canEnd = !row.endedAt && (row.status === 'accepted' || row.status === 'hired');
                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{row.workerName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.workerEmail}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{row.employerName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.employerType || '—'}
                      </Typography>
                    </TableCell>

                    <TableCell>{row.supplierType || '—'}</TableCell>
                    <TableCell align="center">{row.shiftsWorked}</TableCell>
                    <TableCell align="center">{fCurrency(row.fee)}</TableCell>

                    <TableCell>
                      <Label color={status.color} variant="soft">
                        {status.label}
                      </Label>
                    </TableCell>

                    <TableCell>{row.offerDate ? fDate(row.offerDate) : '—'}</TableCell>
                    <TableCell>{row.respondedAt ? fDate(row.respondedAt) : '—'}</TableCell>
                    <TableCell>{row.endedAt ? fDate(row.endedAt) : '—'}</TableCell>

                    <TableCell align="right">
                      {canEnd ? (
                        <Button size="small" color="error" variant="outlined" onClick={() => setEndingRow(row)}>
                          End hire
                        </Button>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              <TableNoData notFound={notFound} />
            </TableBody>
          </Table>
        </Scrollbar>
        )}

        {!isLoading ? (
          <TablePaginationCustom
            page={table.page}
            count={totalRecords}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        ) : null}
      </Card>

      <ConfirmDialog
        open={Boolean(endingRow)}
        onClose={() => {
          if (!ending) setEndingRow(null);
        }}
        title="End hire"
        content={`End the permanent hire for ${endingRow?.workerName || 'this worker'}?`}
        action={
          <Button variant="contained" color="error" disabled={ending} onClick={handleEndHire}>
            End hire
          </Button>
        }
      />

      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button
          component="a"
          href={paths.adminDashboard.root}
          color="inherit"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
        >
          Back to dashboard
        </Button>
      </Stack>
    </DashboardContent>
  );
}
