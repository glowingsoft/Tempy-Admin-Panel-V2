import { useState } from 'react';
import { useSelector } from 'react-redux';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { resolveDashboardRole } from 'src/auth/utils/role-module-redirect';
import { getDashboardRootPath } from 'src/auth/utils/dashboard-path-utils';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { rowInPage, TablePaginationCustom, useTable } from 'src/components/table';

import { useRoleJobTypes } from 'src/sections/job-roles/use-role-job-types';

import {
  useGetAgreedRatesQuery,
  useCreateAgreedRateMutation,
  useUpdateAgreedRateMutation,
  useGetCustomerOptionsQuery,
  useRespondToAgreedRateMutation,
} from 'src/store/Reducer/supplier-relationships-api';

import {
  RATE_SLOTS,
  RATE_STATUS,
  getRoleApiBase,
  OPEN_RATE_STATUSES,
  getRelationshipSide,
  CUSTOMER_TYPE_OPTIONS,
  formatSpecialDayDate,
} from '../supplier-relationship-utils';
import { RowActionButton } from '../row-action-button';
import { AgreedRateDetailsDialog } from '../relationship-details-dialogs';
import { useViewOnly } from 'src/hooks/use-view-only';

// ----------------------------------------------------------------------

/** Rate changes usually start on 1 April. */
function nextFirstOfApril() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-04-01`;
}

function formatRates(rates) {
  return RATE_SLOTS.map((slot) => `${slot.label} ${fCurrency(rates[slot.key])}`).join(' · ');
}

function formatSpecialDays(rates) {
  return (rates.specialDays || [])
    .map((day) => `${day.name} (${formatSpecialDayDate(day)}) ${fCurrency(day.rate)}`)
    .join(' · ');
}

let specialDayKey = 0;

function newSpecialDay(day = {}) {
  specialDayKey += 1;
  return {
    key: specialDayKey,
    name: day.name || '',
    date: day.date || '',
    repeatsYearly: day.repeatsYearly ?? true,
    rate: day.rate ? String(day.rate) : '',
  };
}

/** Two entries on the same day clash; a yearly one clashes on month-day with any other. */
function findDuplicateSpecialDays(days) {
  const clashes = new Set();
  days.forEach((a, i) =>
    days.slice(i + 1).forEach((b) => {
      if (!a.date || !b.date) return;
      const sameDay =
        a.repeatsYearly || b.repeatsYearly ? a.date.slice(5) === b.date.slice(5) : a.date === b.date;
      if (sameDay) {
        clashes.add(a.key);
        clashes.add(b.key);
      }
    })
  );
  return clashes;
}

// ----------------------------------------------------------------------

export function SupplierAgreedRatesView() {
  // Admin viewing this account: rates can be viewed, not offered, changed or answered.
  const viewOnly = useViewOnly();
  const { user } = useSelector((state) => state.user);
  const isSupplier = getRelationshipSide(user) === 'supplier';
  const base = getRoleApiBase(user);

  // null = closed; {} = new offer; { row } = edit; { row, change: true } = propose a change
  const [form, setForm] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const { data, isLoading, isError } = useGetAgreedRatesQuery({ base }, { skip: !base });
  const [respond, { isLoading: isResponding }] = useRespondToAgreedRateMutation();

  const rows = data?.data || [];
  const table = useTable({ defaultRowsPerPage: 10 });
  const pageCount = Math.max(1, Math.ceil(rows.length / table.rowsPerPage));
  const safePage = Math.min(table.page, pageCount - 1);
  const pageRows = rowInPage(rows, safePage, table.rowsPerPage);

  const handleAction = async (row, action) => {
    try {
      await respond({ base, id: row.id, action }).unwrap();
      toast.success(`Rate ${action === 'withdraw' ? 'withdrawn' : `${action}ed`}`);
    } catch (err) {
      toast.error(err?.data?.message || 'Could not update the rate.');
    }
  };

  return (
    <DashboardContent maxWidth={false}>
      <CustomBreadcrumbs
        heading="Agreed rates"
        links={[
          {
            name: 'Dashboard',
            href: getDashboardRootPath(user?.permission, user?.accountState?.accountType),
          },
          { name: 'Agreed rates' },
        ]}
        action={
          isSupplier && !viewOnly && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setForm({})}
            >
              New rate
            </Button>
          )
        }
        sx={{ mb: { xs: 2, md: 3 } }}
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        {isSupplier
          ? 'Set your hourly rates for each customer and role. The customer accepts, rejects or asks for a review. To change an accepted rate, propose a new one with a start date (usually 1 April). It applies once the customer agrees. You can withdraw an open offer at any time.'
          : 'Suppliers set their hourly rates for you. Accept, reject, or request a review to ask for a lower rate. A rate change only applies once you accept it.'}
      </Alert>

      {isError && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          Could not load agreed rates.
        </Alert>
      )}

      <Card>
        <Scrollbar>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>{isSupplier ? 'Customer' : 'Supplier'}</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Rates (per hour)</TableCell>
                <TableCell>Starts</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" sx={{ width: 160 }}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageRows.map((row) => {
                const party = isSupplier ? row.customer : row.supplier;
                const status = RATE_STATUS[row.status] || RATE_STATUS.pending;
                const isOpen = OPEN_RATE_STATUSES.includes(row.status);

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{party.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {party.email}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.jobType}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{formatRates(row.rates)}</Typography>
                      {row.rates.specialDays.length > 0 && (
                        <Typography variant="caption" color="text.secondary" component="div">
                          {formatSpecialDays(row.rates)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{row.effectiveFrom ? fDate(row.effectiveFrom) : 'On acceptance'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={status.label} color={status.color} />
                      {row.status === 'reviewRequested' && (
                        <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                          {row.reviewNote || 'Customer asked for a lower rate'}
                          {row.reviewRates ? ` (asked: ${formatRates(row.reviewRates)})` : ''}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                        <RowActionButton
                          title="View details"
                          icon="solar:eye-bold"
                          onClick={() => setViewing(row)}
                        />
                        {!viewOnly && isSupplier && isOpen && (
                          <>
                            <RowActionButton
                              title="Edit"
                              icon="solar:pen-bold"
                              onClick={() => setForm({ row })}
                            />
                            <RowActionButton
                              title="Withdraw"
                              icon="solar:undo-left-round-bold"
                              color="error"
                              disabled={isResponding}
                              onClick={() => handleAction(row, 'withdraw')}
                            />
                          </>
                        )}
                        {!viewOnly && isSupplier && row.status === 'accepted' && (
                          <RowActionButton
                            title="Propose change"
                            icon="solar:restart-bold"
                            color="primary"
                            onClick={() => setForm({ row, change: true })}
                          />
                        )}
                        {!viewOnly && !isSupplier && isOpen && (
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
                            {row.status === 'pending' && (
                              <RowActionButton
                                title="Request review"
                                icon="solar:chat-round-money-bold"
                                color="warning"
                                onClick={() => setReviewing(row)}
                              />
                            )}
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}

              {!isLoading && !rows.length && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No agreed rates yet
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

      {isSupplier && form && (
        <RateFormDialog base={base} user={user} form={form} onClose={() => setForm(null)} />
      )}

      {reviewing && (
        <RequestReviewDialog base={base} row={reviewing} onClose={() => setReviewing(null)} />
      )}

      {viewing && <AgreedRateDetailsDialog row={viewing} onClose={() => setViewing(null)} />}
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

function RateFormDialog({ base, user, form, onClose }) {
  const { row, change } = form;
  const isEdit = Boolean(row && !change);

  const [customerType, setCustomerType] = useState('careHome');
  const [customer, setCustomer] = useState(row?.customer.id || '');
  const [jobType, setJobType] = useState(row?.jobTypeId || '');
  const [rates, setRates] = useState({
    day: row ? String(row.rates.day) : '',
    night: row ? String(row.rates.night) : '',
    weekend: row ? String(row.rates.weekend) : '',
  });
  const [specialDays, setSpecialDays] = useState(() =>
    (row?.rates.specialDays || []).map((day) => newSpecialDay(day))
  );
  const [effectiveFrom, setEffectiveFrom] = useState(
    change ? nextFirstOfApril() : String(row?.effectiveFrom || '').slice(0, 10)
  );

  const updateSpecialDay = (key, changes) =>
    setSpecialDays((prev) => prev.map((day) => (day.key === key ? { ...day, ...changes } : day)));

  const { data: customers } = useGetCustomerOptionsQuery(
    { base, userType: customerType },
    { skip: Boolean(row) }
  );
  const { data: jobTypes } = useRoleJobTypes(resolveDashboardRole(user), { skip: Boolean(row) });

  const [createRate, { isLoading: isCreating }] = useCreateAgreedRateMutation();
  const [updateRate, { isLoading: isUpdating }] = useUpdateAgreedRateMutation();

  const duplicateDays = findDuplicateSpecialDays(specialDays);
  const numericRates = {
    day: Number(rates.day),
    night: Number(rates.night),
    weekend: Number(rates.weekend),
    specialDays: specialDays.map((day) => ({
      name: day.name.trim(),
      date: day.date,
      repeatsYearly: day.repeatsYearly,
      rate: Number(day.rate),
    })),
  };
  const isValid =
    customer &&
    jobType &&
    RATE_SLOTS.every((slot) => numericRates[slot.key] > 0) &&
    numericRates.specialDays.every((day) => day.name && day.date && day.rate > 0) &&
    duplicateDays.size === 0;

  const handleSubmit = async () => {
    const body = { rates: numericRates, effectiveFrom: effectiveFrom || undefined };
    try {
      if (isEdit) {
        await updateRate({ base, id: row.id, ...body }).unwrap();
      } else {
        await createRate({ base, customer, jobType, ...body }).unwrap();
      }
      toast.success('Rate sent to the customer');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Could not save the rate.');
    }
  };

  const title = change ? 'Propose rate change' : isEdit ? 'Edit rate' : 'New rate';

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {row ? (
            <Typography variant="body2">
              <strong>{row.customer.name}</strong> · {row.jobType}
            </Typography>
          ) : (
            <>
              <TextField
                select
                label="Customer type"
                value={customerType}
                onChange={(e) => {
                  setCustomerType(e.target.value);
                  setCustomer('');
                }}
              >
                {CUSTOMER_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              >
                {(customers?.data || []).map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                    {option.email ? ` · ${option.email}` : ''}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Role"
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
              >
                {jobTypes.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.label || option.title}
                  </MenuItem>
                ))}
              </TextField>
            </>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            {RATE_SLOTS.map((slot) => (
              <TextField
                key={slot.key}
                label={`${slot.label} (£/h)`}
                value={rates[slot.key]}
                onChange={(e) => setRates((prev) => ({ ...prev, [slot.key]: e.target.value }))}
                inputProps={{ inputMode: 'decimal' }}
                fullWidth
              />
            ))}
          </Stack>

          <Stack spacing={1.5}>
            <div>
              <Typography variant="subtitle2">Special days</Typography>
              <Typography variant="caption" color="text.secondary">
                Optional. Agree a separate hourly rate for particular days, e.g. Christmas Day.
              </Typography>
            </div>

            {specialDays.map((day) => (
              <Stack
                key={day.key}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                alignItems={{ sm: 'flex-start' }}
              >
                <TextField
                  label="Name"
                  placeholder="e.g. Christmas Day"
                  value={day.name}
                  onChange={(e) => updateSpecialDay(day.key, { name: e.target.value })}
                  inputProps={{ maxLength: 60 }}
                  sx={{ flex: 1.4 }}
                />
                <TextField
                  type="date"
                  label="Date"
                  value={day.date}
                  onChange={(e) => updateSpecialDay(day.key, { date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  error={duplicateDays.has(day.key)}
                  helperText={duplicateDays.has(day.key) ? 'Another special day is on this date' : ''}
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Rate (£/h)"
                  value={day.rate}
                  onChange={(e) => updateSpecialDay(day.key, { rate: e.target.value })}
                  inputProps={{ inputMode: 'decimal' }}
                  sx={{ flex: 0.8 }}
                />
                <FormControlLabel
                  label="Every year"
                  control={
                    <Checkbox
                      checked={day.repeatsYearly}
                      onChange={(e) =>
                        updateSpecialDay(day.key, { repeatsYearly: e.target.checked })
                      }
                    />
                  }
                  sx={{ mr: 0, mt: { sm: 1 }, whiteSpace: 'nowrap' }}
                />
                <Tooltip title="Remove">
                  <IconButton
                    color="error"
                    onClick={() =>
                      setSpecialDays((prev) => prev.filter((item) => item.key !== day.key))
                    }
                    sx={{ mt: { sm: 1 }, alignSelf: { xs: 'flex-end', sm: 'flex-start' } }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={20} />
                  </IconButton>
                </Tooltip>
              </Stack>
            ))}

            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setSpecialDays((prev) => [...prev, newSpecialDay()])}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add special day
            </Button>
          </Stack>

          <TextField
            type="date"
            label="Starts on"
            value={effectiveFrom}
            onChange={(e) => setEffectiveFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText={
              change
                ? 'The current rate stays until this date. The new one applies only once the customer agrees.'
                : 'Leave empty to start as soon as the customer accepts.'
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          disabled={!isValid}
          loading={isCreating || isUpdating}
          onClick={handleSubmit}
        >
          Send to customer
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

function RequestReviewDialog({ base, row, onClose }) {
  const [note, setNote] = useState('');
  const [respond, { isLoading }] = useRespondToAgreedRateMutation();

  const handleSubmit = async () => {
    try {
      await respond({ base, id: row.id, action: 'review', note: note.trim() }).unwrap();
      toast.success('Review requested');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Could not request a review.');
    }
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Request review</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            {row.supplier.name} · {row.jobType}: {formatRates(row.rates)}
            {row.rates.specialDays.length > 0 && ` · ${formatSpecialDays(row.rates)}`}
          </Typography>
          <TextField
            autoFocus
            multiline
            minRows={3}
            label="What rate are you asking for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton variant="contained" loading={isLoading} onClick={handleSubmit}>
          Send
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
