import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Field, Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { ModuleLoading } from 'src/components/loading-screen';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';
import { toast } from 'src/components/snackbar';
import { rowInPage, TableHeadCustom, TableNoData, TablePaginationCustom, useTable } from 'src/components/table';

import { handleApiError, isRateLimitError } from 'src/store/handleApiError';
import {
  useCreateAdminSupportTicketMutation,
  useDeleteAdminSupportTicketMutation,
  useGetAdminSupportTicketsQuery,
  useUpdateAdminSupportTicketMutation,
  ADMIN_SUPPORT_LIST_ARGS,
} from 'src/store/Reducer/support-api';

import { buildSupportPayload } from 'src/sections/support/support-api-utils';
import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'default' },
  { value: 'open', label: 'Open', color: 'warning' },
  { value: 'closed', label: 'Closed', color: 'success' },
];

const TABLE_HEAD = [
  { id: 'sr', label: 'Sr#', width: 72 },
  { id: 'name', label: 'Name', minWidth: 180 },
  { id: 'subject', label: 'Subject', minWidth: 160 },
  { id: 'message', label: 'Message', minWidth: 200 },
  { id: 'receivedAt', label: 'Received At', width: 140 },
  { id: 'status', label: 'Status', width: 100 },
  { id: 'actions', label: 'Actions', width: 100, align: 'right' },
];

const SupportSchema = zod.object({
  subject: zod.string().trim().min(1, { message: 'Subject is required!' }),
  message: zod.string().trim().min(1, { message: 'Message is required!' }),
  status: zod.string().min(1, { message: 'Status is required!' }),
  response: zod.string().optional(),
});

const DEFAULT_VALUES = {
  subject: '',
  message: '',
  status: 'open',
  response: '',
};

function statusColor(status) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.color || 'default';
}

function statusLabel(status) {
  return STATUS_OPTIONS.find((option) => option.value === status)?.label || status || '—';
}

function SupportFormDialog({ open, onClose, onSubmit, currentItem, submitting = false }) {
  const isEdit = Boolean(currentItem);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(SupportSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (!open) return;

    if (currentItem) {
      reset({
        subject: currentItem.subject || '',
        message: currentItem.message || '',
        status: currentItem.status || 'open',
        response: currentItem.response || '',
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, currentItem, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={submitting ? undefined : onClose}>
      <Form methods={methods} onSubmit={handleFormSubmit}>
        <DialogTitle>{isEdit ? 'Edit Support' : 'Add Support'}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {!isEdit && (
              <>
                <Field.Text name="subject" label="Subject" disabled={submitting} />

                <Field.Text
                  name="message"
                  label="Message"
                  multiline
                  rows={4}
                  disabled={submitting}
                />
              </>
            )}

            {isEdit && (
              <Field.Select name="status" label="Status" disabled={submitting}>
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Field.Select>
            )}
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={submitting}>
            {isEdit ? 'Save changes' : 'Add Support'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

export function SupportListView() {
  const formDialog = useBoolean();
  const confirmDelete = useBoolean();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rateLimitedUntil, setRateLimitedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  const isRateLimited = now < rateLimitedUntil;
  const rateLimitSecondsLeft = isRateLimited
    ? Math.max(1, Math.ceil((rateLimitedUntil - now) / 1000))
    : 0;

  useEffect(() => {
    if (!isRateLimited) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isRateLimited]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminSupportTicketsQuery(ADMIN_SUPPORT_LIST_ARGS, {
    skip: isRateLimited,
    // Pick up new user Contact/Support tickets when opening this page.
    refetchOnMountOrArgChange: 60,
    refetchOnFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (isRateLimitError(error)) {
      setRateLimitedUntil((prev) => Math.max(prev, Date.now() + 90_000));
    }
  }, [error]);

  const markRateLimited = useCallback(() => {
    setRateLimitedUntil(Date.now() + 90_000);
    setNow(Date.now());
  }, []);

  const [createTicket] = useCreateAdminSupportTicketMutation();
  const [updateTicket] = useUpdateAdminSupportTicketMutation();
  const [deleteTicket] = useDeleteAdminSupportTicketMutation();

  const items = useMemo(() => data?.data || [], [data?.data]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!query) return true;
      return [item.name, item.email, item.phone, item.subject, item.message]
        .some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [items, search, statusFilter]);

  const table = useTable({ defaultRowsPerPage: 10 });

  useEffect(() => {
    table.onResetPage();
  }, [search, statusFilter, table.onResetPage]);

  const pageCount = Math.max(1, Math.ceil(filteredItems.length / table.rowsPerPage));
  const safePage = Math.min(table.page, pageCount - 1);
  const pageRows = rowInPage(filteredItems, safePage, table.rowsPerPage);

  const handleOpenAdd = useCallback(() => {
    setEditingItem(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (row) => {
      setEditingItem(row);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleCloseForm = useCallback(() => {
    if (saving) return;
    formDialog.onFalse();
    setEditingItem(null);
  }, [formDialog, saving]);

  const handleSave = useCallback(
    async (formData) => {
      if (isRateLimited) {
        toast.error(`Rate limited — wait ${rateLimitSecondsLeft}s`);
        return;
      }
      const isEdit = Boolean(editingItem?.id);
      const payload = buildSupportPayload({
        ...formData,
        // Edit UI only changes status — reuse existing fields for PUT
        subject: isEdit ? editingItem.subject || formData.subject : formData.subject,
        message: isEdit ? editingItem.message || formData.message : formData.message,
        response: isEdit
          ? editingItem.response || editingItem.message || 'Updated'
          : formData.response,
        includeResponse: isEdit,
      });

      if (!payload.subject || !payload.message) {
        toast.error('Subject and message are required');
        return;
      }

      setSaving(true);
      try {
        if (isEdit) {
          await updateTicket({ id: editingItem.id, ...payload }).unwrap();
          toast.success('Support updated successfully!');
        } else {
          await createTicket(payload).unwrap();
          toast.success('Support added successfully!');
        }
        formDialog.onFalse();
        setEditingItem(null);
      } catch (err) {
        if (isRateLimitError(err)) markRateLimited();
        toast.error(handleApiError(err));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [createTicket, editingItem, formDialog, isRateLimited, markRateLimited, rateLimitSecondsLeft, updateTicket]
  );

  const handleAskDelete = useCallback(
    (row) => {
      setItemToDelete(row);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleCloseDelete = useCallback(() => {
    if (saving) return;
    confirmDelete.onFalse();
    setItemToDelete(null);
  }, [confirmDelete, saving]);

  const handleConfirmDelete = useCallback(async () => {
    if (!itemToDelete?.id) return;
    if (isRateLimited) {
      toast.error(`Rate limited — wait ${rateLimitSecondsLeft}s`);
      return;
    }

    setSaving(true);
    try {
      await deleteTicket(itemToDelete.id).unwrap();
      confirmDelete.onFalse();
      setItemToDelete(null);
      toast.success('Support deleted successfully!');
    } catch (err) {
      if (isRateLimitError(err)) markRateLimited();
      toast.error(handleApiError(err));
    } finally {
      setSaving(false);
    }
  }, [confirmDelete, deleteTicket, isRateLimited, itemToDelete, markRateLimited, rateLimitSecondsLeft]);

  return (
    <>
      <Box sx={{ px: { xs: 2, md: 6 }, pb: 5, pt: 3, display: 'flex', flexDirection: 'column' }}>
        <CustomBreadcrumbs
          heading="Support"
          links={[
            { name: 'Dashboard', href: paths.adminDashboard.root },
            { name: 'Support' },
          ]}
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={handleOpenAdd}
            >
              Add Support
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        {(isRateLimited || isError) && (
          <Alert
            severity={isRateLimited || isRateLimitError(error) ? 'warning' : 'error'}
            sx={{ mb: 2 }}
            action={
              !isRateLimited ? (
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Retry
                </Button>
              ) : null
            }
          >
            {isRateLimited
              ? `Support API rate limited (429). Wait ${rateLimitSecondsLeft}s, then retry.`
              : handleApiError(error) || 'Failed to load support tickets'}
          </Alert>
        )}

        <Card>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ p: 2.5 }}
            alignItems={{ sm: 'center' }}
          >
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="all">All</MenuItem>
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, subject..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: { sm: 360 } }}
            />
          </Stack>

          {isLoading && !filteredItems.length ? (
            <ModuleLoading />
          ) : (
            <Scrollbar>
              <Table size="medium" sx={{ minWidth: 960 }}>
                <TableHeadCustom headLabel={TABLE_HEAD} rowCount={filteredItems.length} />

                <TableBody>
                  {pageRows.map((row, index) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{safePage * table.rowsPerPage + index + 1}</TableCell>

                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar src={row.avatar} alt={row.name} sx={{ width: 36, height: 36 }}>
                            {row.name?.[0]}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="subtitle2" noWrap>
                              {row.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                              {row.email || row.phone || '—'}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 180 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          title={row.subject || undefined}
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {row.subject || '—'}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography
                          variant="body2"
                          noWrap
                          title={row.message || undefined}
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {row.message || '—'}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {row.createdAt ? fDateTime(row.createdAt) : '—'}
                      </TableCell>

                      <TableCell>
                        <Label variant="soft" color={statusColor(row.status)}>
                          {statusLabel(row.status)}
                        </Label>
                      </TableCell>

                      <TableCell align="right">
                        <Stack direction="row" justifyContent="flex-end" spacing={0.25}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                              <Iconify icon="solar:pen-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleAskDelete(row)}
                            >
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

                  <TableNoData notFound={!filteredItems.length} />
                </TableBody>
              </Table>
            </Scrollbar>
          )}
          {!isLoading ? (
            <TablePaginationCustom
              page={safePage}
              count={filteredItems.length}
              rowsPerPage={table.rowsPerPage}
              onPageChange={table.onChangePage}
              onRowsPerPageChange={table.onChangeRowsPerPage}
            />
          ) : null}
        </Card>
      </Box>

      <SupportFormDialog
        open={formDialog.value}
        onClose={handleCloseForm}
        onSubmit={handleSave}
        currentItem={editingItem}
        submitting={saving}
      />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={handleCloseDelete}
        title="Delete Support"
        content={
          <>
            Are you sure you want to delete <strong>{itemToDelete?.subject}</strong>?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={saving}
            onClick={handleConfirmDelete}
          >
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </>
  );
}
