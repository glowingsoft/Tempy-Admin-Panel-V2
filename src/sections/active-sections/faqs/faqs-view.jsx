import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z as zod } from 'zod';

import LoadingButton from '@mui/lab/LoadingButton';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import { TablePaginationCustom } from 'src/components/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { Field, Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { handleApiError } from 'src/store/handleApiError';
import { useCreateFaqMutation, useDeleteFaqMutation, useGetAdminFaqsQuery, useUpdateFaqMutation } from 'src/store/Reducer/faqs-api';

import { buildFaqPayload } from 'src/sections/faqs/faq-api-utils';
import { FAQ_TYPE_OPTIONS, getFaqTypeLabel } from 'src/sections/faqs/faq-store';

// ----------------------------------------------------------------------

const FaqSchema = zod.object({
  type: zod.string().min(1, { message: 'Type is required!' }),
  heading: zod.string().trim().min(1, { message: 'Question is required!' }),
  detail: zod.string().trim().min(1, { message: 'Answer is required!' }),
});

const DEFAULT_VALUES = {
  type: 'careHome',
  heading: '',
  detail: '',
};

function FaqFormDialog({ open, onClose, onSubmit, currentFaq, submitting = false }) {
  const isEdit = Boolean(currentFaq);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(FaqSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const { reset, handleSubmit } = methods;

  useEffect(() => {
    if (!open) return;

    if (currentFaq) {
      reset({
        type: currentFaq.type || 'careHome',
        heading: currentFaq.heading || '',
        detail: currentFaq.detail || '',
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, currentFaq, reset]);

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  return (
    <Dialog fullWidth maxWidth="sm" open={open} onClose={submitting ? undefined : onClose}>
      <Form methods={methods} onSubmit={handleFormSubmit}>
        <DialogTitle>{isEdit ? 'Edit FAQ' : 'Add FAQ'}</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Field.Select name="type" label="Type" disabled={submitting}>
              {FAQ_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text name="heading" label="Question" placeholder="Enter the FAQ question" disabled={submitting} />

            <Field.Text name="detail" label="Answer" placeholder="Write the answer" multiline rows={5} disabled={submitting} />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button color="inherit" variant="outlined" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>

          <LoadingButton type="submit" color="primary" variant="contained" loading={submitting}>
            {isEdit ? 'Save changes' : 'Add FAQ'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

// ----------------------------------------------------------------------

export function FaqsView() {
  const formDialog = useBoolean();
  const confirmDelete = useBoolean();

  const [expanded, setExpanded] = useState(false);
  const [faqToDelete, setFaqToDelete] = useState(null);
  const [faqToEdit, setFaqToEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: faqsData, isLoading, isError, error, refetch } = useGetAdminFaqsQuery({ page: page + 1, limit: rowsPerPage }, { refetchOnMountOrArgChange: true });

  const [createFaq] = useCreateFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();
  const [deleteFaq] = useDeleteFaqMutation();

  const allFaqs = useMemo(() => faqsData?.data || [], [faqsData?.data]);
  const clientPaged = allFaqs.length > rowsPerPage;
  const faqs = useMemo(() => (clientPaged ? allFaqs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : allFaqs), [allFaqs, clientPaged, page, rowsPerPage]);
  const totalRecords = faqsData?.meta?.hasTotal ? faqsData.meta.totalRecords : null;
  const count = clientPaged
    ? allFaqs.length
    : totalRecords != null
      ? totalRecords
      : allFaqs.length < rowsPerPage
        ? page * rowsPerPage + allFaqs.length
        : page * rowsPerPage + allFaqs.length + 1;

  useEffect(() => {
    if (!faqs.length) {
      setExpanded(false);
      return;
    }
    setExpanded((prev) => (prev && faqs.some((item) => item.id === prev) ? prev : faqs[0].id));
  }, [faqs]);

  const handleAccordionChange = useCallback(
    (panel) => (event, isExpanded) => {
      setExpanded(isExpanded ? panel : false);
    },
    []
  );

  const handleOpenAdd = useCallback(() => {
    setFaqToEdit(null);
    formDialog.onTrue();
  }, [formDialog]);

  const handleOpenEdit = useCallback(
    (faq) => {
      setFaqToEdit(faq);
      formDialog.onTrue();
    },
    [formDialog]
  );

  const handleCloseForm = useCallback(() => {
    if (saving) return;
    formDialog.onFalse();
    setFaqToEdit(null);
  }, [formDialog, saving]);

  const handleSaveFaq = useCallback(
    async (data) => {
      const payload = buildFaqPayload(data);
      if (!payload.type || !payload.question || !payload.answer) {
        toast.error('Type, question and answer are required');
        return;
      }

      setSaving(true);
      try {
        if (faqToEdit?.id) {
          await updateFaq({ id: faqToEdit.id, ...payload }).unwrap();
          toast.success('FAQ updated successfully!');
        } else {
          const created = await createFaq(payload).unwrap();
          const newId = created?.data?._id || created?.data?.id || created?._id || created?.id || null;
          if (newId) setExpanded(String(newId));
          toast.success('FAQ added successfully!');
        }
        formDialog.onFalse();
        setFaqToEdit(null);
      } catch (err) {
        toast.error(handleApiError(err));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [createFaq, faqToEdit, formDialog, updateFaq]
  );

  const handleAskDelete = useCallback(
    (faq) => {
      setFaqToDelete(faq);
      confirmDelete.onTrue();
    },
    [confirmDelete]
  );

  const handleCloseDeleteDialog = useCallback(() => {
    if (saving) return;
    confirmDelete.onFalse();
    setFaqToDelete(null);
  }, [confirmDelete, saving]);

  const handleDeleteFaq = useCallback(async () => {
    if (!faqToDelete?.id) return;

    setSaving(true);
    try {
      await deleteFaq(faqToDelete.id).unwrap();
      if (expanded === faqToDelete.id) {
        setExpanded(false);
      }
      confirmDelete.onFalse();
      setFaqToDelete(null);
      toast.success('FAQ deleted successfully!');
    } catch (err) {
      toast.error(handleApiError(err));
    } finally {
      setSaving(false);
    }
  }, [confirmDelete, deleteFaq, expanded, faqToDelete]);

  return (
    <>
      <Box sx={{ px: { xs: 2, md: 6 }, pb: 5, pt: 3, display: 'flex', flexDirection: 'column' }}>
        <CustomBreadcrumbs
          heading="FAQs"
          links={[{ name: 'Dashboard', href: paths.adminDashboard.root }, { name: 'FAQs' }]}
          action={
            <Button variant="contained" color="primary" startIcon={<Iconify icon="mingcute:add-line" />} onClick={handleOpenAdd}>
              Add FAQ
            </Button>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Box>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Typography variant="h5">Manage frequently asked questions</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Assign each FAQ to a login type so it appears on that role&apos;s dashboard.
            </Typography>
          </Stack>

          {isError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              action={
                <Button color="inherit" size="small" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            >
              {handleApiError(error) || 'Failed to load FAQs'}
            </Alert>
          )}

          {isLoading ? (
            <LinearProgress sx={{ borderRadius: 0, height: 2 }} />
          ) : (
            <Stack spacing={2}>
              {faqs.length ? (
                faqs.map((faq, index) => (
                  <Accordion key={faq.id} expanded={expanded === faq.id} onChange={handleAccordionChange(faq.id)}>
                    <AccordionSummary expandIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2} sx={{ width: 1 }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                            <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                              FAQ {page * rowsPerPage + index + 1}
                            </Typography>
                            <Chip size="small" label={getFaqTypeLabel(faq.type)} color="primary" variant="soft" />
                          </Stack>
                          <Typography variant="subtitle1">{faq.heading}</Typography>
                        </Box>

                        <Stack direction="row" spacing={0.25} onClick={(event) => event.stopPropagation()}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleOpenEdit(faq)} onFocusCapture={(event) => event.stopPropagation()}>
                              <Iconify icon="solar:pen-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => handleAskDelete(faq)} onFocusCapture={(event) => event.stopPropagation()}>
                              <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Stack>
                    </AccordionSummary>

                    <AccordionDetails>
                      <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'pre-line' }}>
                        {faq.detail}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))
              ) : (
                <Stack spacing={1} alignItems="center" justifyContent="center" sx={{ py: 8, borderRadius: 2, bgcolor: 'background.neutral' }}>
                  <Iconify icon="solar:question-circle-bold" width={40} sx={{ color: 'text.disabled' }} />
                  <Typography variant="subtitle1">No FAQs available</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Create your first FAQ using the Add FAQ button.
                  </Typography>
                </Stack>
              )}
              <TablePaginationCustom
                count={count}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(0);
                }}
              />
            </Stack>
          )}
        </Box>
      </Box>

      <FaqFormDialog open={formDialog.value} onClose={handleCloseForm} onSubmit={handleSaveFaq} currentFaq={faqToEdit} submitting={saving} />

      <ConfirmDialog
        open={confirmDelete.value}
        onClose={handleCloseDeleteDialog}
        title="Delete FAQ"
        content={
          <>
            Are you sure you want to delete <strong>{faqToDelete?.heading}</strong>?
          </>
        }
        action={
          <Button variant="contained" color="error" disabled={saving} onClick={handleDeleteFaq}>
            {saving ? 'Deleting...' : 'Delete'}
          </Button>
        }
      />
    </>
  );
}
