import { useState } from 'react';
import { useSelector } from 'react-redux';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { fDate } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { rowInPage, TablePaginationCustom, useTable } from 'src/components/table';

import {
  useGetPermanentHiresQuery,
  useGetEligibleWorkersQuery,
  useRequestPermanentHireMutation,
  useGetPermanentHireSettingsQuery,
  useRespondToPermanentHireMutation,
} from 'src/store/Reducer/supplier-relationships-api';

import { RowActionButton } from '../row-action-button';
import { PermanentHireDetailsDialog } from '../relationship-details-dialogs';
import { HIRE_STATUS, getRoleApiBase, getRelationshipSide } from '../supplier-relationship-utils';
import { useViewOnly } from 'src/hooks/use-view-only';

// ----------------------------------------------------------------------

/**
 * Temp to permanent. A care home can request permanent status for agency or
 * home care company staff after the minimum shifts. There is no fee.
 */
export function PermanentHiresView() {
  // Admin viewing this account: hires can be viewed, not started or answered.
  const viewOnly = useViewOnly();
  const { user } = useSelector((state) => state.user);
  const isCareHome = getRelationshipSide(user) === 'customer';
  const base = getRoleApiBase(user);

  const [hireOpen, setHireOpen] = useState(false);
  const [viewing, setViewing] = useState(null);

  const { data: settings } = useGetPermanentHireSettingsQuery({ base }, { skip: !base });
  const { data, isLoading, isError } = useGetPermanentHiresQuery({ base }, { skip: !base });
  const [respond, { isLoading: isResponding }] = useRespondToPermanentHireMutation();

  const rows = data?.data || [];
  const table = useTable({ defaultRowsPerPage: 10 });
  const pageCount = Math.max(1, Math.ceil(rows.length / table.rowsPerPage));
  const safePage = Math.min(table.page, pageCount - 1);
  const pageRows = rowInPage(rows, safePage, table.rowsPerPage);

  const handleAction = async (row, action) => {
    try {
      await respond({ base, id: row.id, action }).unwrap();
      toast.success(
        { accept: 'Hire accepted', reject: 'Hire rejected', cancel: 'Request cancelled' }[action]
      );
    } catch (err) {
      toast.error(err?.data?.message || 'Could not update the request.');
    }
  };

  return (
    <DashboardContent maxWidth={false}>
      <CustomBreadcrumbs
        heading="Permanent hires"
        links={[
          {
            name: 'Dashboard',
            href: getDashboardRootPath(user?.permission, user?.accountState?.accountType),
          },
          { name: 'Permanent hires' },
        ]}
        action={
          isCareHome && !viewOnly && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setHireOpen(true)}
            >
              Hire permanently
            </Button>
          )
        }
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        {isCareHome ? 'You can' : 'A care home can'} request permanent status for agency or home
        care company staff after <strong>{settings?.minShifts ?? '—'}</strong> completed shifts.
        The worker accepts or rejects. They can be permanent with only one customer at a time.
      </Alert>

      {isError && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          Could not load permanent hires.
        </Alert>
      )}

      <Card>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Worker</TableCell>
                <TableCell>{isCareHome ? 'Agency' : 'Care home'}</TableCell>
                <TableCell>Shifts</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" sx={{ width: 160 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((row) => {
                const status = HIRE_STATUS[row.status] || HIRE_STATUS.pending;
                const isPending = row.status === 'pending';

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{row.worker.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.createdAt ? `Requested ${fDate(row.createdAt)}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {isCareHome
                        ? row.supplierType === 'nurse'
                          ? 'Solo nurse'
                          : row.supplier.name
                        : row.customer.name}
                    </TableCell>
                    <TableCell>{row.shiftsWorked}</TableCell>
                    <TableCell>
                      <Chip size="small" label={status.label} color={status.color} />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                        <RowActionButton
                          title="View details"
                          icon="solar:eye-bold"
                          onClick={() => setViewing(row)}
                        />
                        {!viewOnly && isPending && isCareHome && (
                          <RowActionButton
                            title="Cancel request"
                            icon="solar:close-circle-bold"
                            color="error"
                            disabled={isResponding}
                            onClick={() => handleAction(row, 'cancel')}
                          />
                        )}
                        {!viewOnly && isPending && !isCareHome && (
                          <>
                            <RowActionButton
                              title="Accept"
                              icon="solar:check-circle-bold"
                              color="success"
                              disabled={isResponding}
                              onClick={() => handleAction(row, 'accept')}
                            />
                            <RowActionButton
                              title="Reject"
                              icon="solar:close-circle-bold"
                              color="error"
                              disabled={isResponding}
                              onClick={() => handleAction(row, 'reject')}
                            />
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!isLoading && !rows.length && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No permanent hire requests yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
        <TablePaginationCustom
          page={safePage}
          count={rows.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {isCareHome && hireOpen && (
        <HireDialog base={base} settings={settings} onClose={() => setHireOpen(false)} />
      )}

      {viewing && <PermanentHireDetailsDialog row={viewing} onClose={() => setViewing(null)} />}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function HireDialog({ base, settings, onClose }) {
  const [selectedId, setSelectedId] = useState('');

  const { data } = useGetEligibleWorkersQuery({ base });
  const [requestHire, { isLoading }] = useRequestPermanentHireMutation();

  const minShifts = Number(settings?.minShifts) || 0;
  const workers = (data?.data || []).filter((item) => {
    const type = String(item.supplierType || '').toLowerCase().replace(/[\s-]/g, '_');
    return type === 'agency' || type === 'home_care_company';
  });
  const selected = workers.find((item) => item.id === selectedId);

  const handleSubmit = async () => {
    try {
      await requestHire({
        base,
        worker: selected.worker.id,
        supplier: selected.supplier?.id || undefined,
      }).unwrap();
      toast.success('Request sent');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Could not send the request.');
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Hire permanently</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            select
            label="Worker"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            helperText={
              workers.length
                ? `Staff need at least ${minShifts} completed shifts with you.`
                : 'No agency or home care company staff have completed enough shifts with you yet.'
            }
          >
            {workers.map((item) => (
              <MenuItem key={item.id} value={item.id} disabled={item.shiftsWorked < minShifts}>
                {item.worker.name} · {item.supplier?.name || 'Supplier'} · {item.shiftsWorked} shifts
              </MenuItem>
            ))}
          </TextField>

          {selected && (
            <Alert severity="info">
              {selected.worker.name} can accept or reject this request. Permanent status is a tag
              with your organisation only, and they cannot be permanent with another customer at
              the same time.
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          disabled={!selected}
          loading={isLoading}
          onClick={handleSubmit}
        >
          Send request
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
