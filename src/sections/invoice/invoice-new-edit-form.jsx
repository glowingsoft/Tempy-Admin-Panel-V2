import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { usePathname, useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { today, fIsAfter } from 'src/utils/format-time';

import { _addressBooks } from 'src/_mock';

import { Form, schemaHelper } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';

import { InvoiceNewEditDetails } from './invoice-new-edit-details';
import { InvoiceNewEditAddress } from './invoice-new-edit-address';
import { InvoiceNewEditStatusDate } from './invoice-new-edit-status-date';
import {
  buildInvoiceFromForm,
  generateInvoiceNumber,
  loadStoredInvoices,
  upsertStoredInvoice,
} from './invoice-actions';
import { getInvoicePaths, getInvoiceRoleKey } from './invoice-route-utils';

export const NewInvoiceSchema = zod
  .object({
    invoiceTo: zod.custom().refine((data) => data !== null, { message: 'Invoice to is required!' }),
    createDate: schemaHelper.date({ message: { required_error: 'Create date is required!' } }),
    dueDate: schemaHelper.date({ message: { required_error: 'Due date is required!' } }),
    items: zod.array(
      zod.object({
        title: zod.string().min(1, { message: 'Title is required!' }),
        service: zod.string().min(1, { message: 'Service is required!' }),
        quantity: zod.number().min(1, { message: 'Quantity must be more than 0' }),
        // Not required
        price: zod.number(),
        total: zod.number(),
        description: zod.string(),
      })
    ),
    // Not required
    taxes: zod.number(),
    status: zod.string(),
    discount: zod.number(),
    shipping: zod.number(),
    totalAmount: zod.number(),
    invoiceNumber: zod.string(),
    invoiceFrom: zod.custom().nullable(),
  })
  .refine((data) => !fIsAfter(data.createDate, data.dueDate), {
    message: 'Due date cannot be earlier than create date!',
    path: ['dueDate'],
  });

// ----------------------------------------------------------------------

export function InvoiceNewEditForm({ currentInvoice }) {
  const router = useRouter();
  const pathname = usePathname();
  const invoicePaths = getInvoicePaths(pathname);
  const roleKey = invoicePaths.roleKey || getInvoiceRoleKey(pathname);
  const isCreate = !currentInvoice;

  const loadingSave = useBoolean();

  const loadingSend = useBoolean();

  const storedInvoices = useMemo(() => loadStoredInvoices(roleKey), [roleKey]);

  const defaultValues = useMemo(
    () => ({
      invoiceNumber: currentInvoice?.invoiceNumber || generateInvoiceNumber(storedInvoices, roleKey),
      createDate: currentInvoice?.createDate || today(),
      dueDate: currentInvoice?.dueDate || null,
      taxes: currentInvoice?.taxes || 0,
      shipping: currentInvoice?.shipping || 0,
      status: currentInvoice?.status || 'draft',
      discount: currentInvoice?.discount || 0,
      invoiceFrom: currentInvoice?.invoiceFrom || _addressBooks[0],
      invoiceTo: currentInvoice?.invoiceTo || null,
      totalAmount: currentInvoice?.totalAmount || 0,
      items: currentInvoice?.items || [
        {
          title: '',
          description: '',
          service: '',
          quantity: 1,
          price: 0,
          total: 0,
        },
      ],
    }),
    [currentInvoice, roleKey, storedInvoices]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewInvoiceSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleSaveAsDraft = handleSubmit(async (data) => {
    loadingSave.onTrue();

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const invoice = buildInvoiceFromForm(data, { currentInvoice, send: false });
      upsertStoredInvoice(invoice, roleKey);
      reset();
      loadingSave.onFalse();
      toast.success(currentInvoice ? 'Invoice updated' : 'Invoice saved as draft');
      router.push(invoicePaths.list);
    } catch (error) {
      console.error(error);
      loadingSave.onFalse();
      toast.error('Could not save invoice');
    }
  });

  const handleCreateAndSend = handleSubmit(async (data) => {
    loadingSend.onTrue();

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const invoice = buildInvoiceFromForm(data, { currentInvoice, send: true });
      upsertStoredInvoice(invoice, roleKey);
      reset();
      loadingSend.onFalse();
      toast.success(currentInvoice ? 'Invoice updated and sent' : 'Invoice created and sent');
      router.push(invoicePaths.list);
    } catch (error) {
      console.error(error);
      loadingSend.onFalse();
      toast.error('Could not create invoice');
    }
  });

  return (
    <Form methods={methods}>
      {isCreate ? (
        <Stack spacing={3}>
          <Card sx={{ overflow: 'visible' }}>
            <Stack spacing={0.75} sx={{ px: 3, pt: 3, pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'common.white',
                    typography: 'subtitle2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  1
                </Box>
                <Typography variant="h6">Who is this invoice for?</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', pl: 4.5 }}>
                Choose who you are billing and who the invoice is from.
              </Typography>
            </Stack>
            <InvoiceNewEditAddress />
          </Card>

          <Card sx={{ overflow: 'visible' }}>
            <Stack spacing={0.75} sx={{ px: 3, pt: 3, pb: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'common.white',
                    typography: 'subtitle2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  2
                </Box>
                <Typography variant="h6">Invoice details</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', pl: 4.5 }}>
                Set the invoice number, status, issue date, and due date.
              </Typography>
            </Stack>
            <InvoiceNewEditStatusDate />
          </Card>

          <Card sx={{ overflow: 'visible' }}>
            <Stack spacing={0.75} sx={{ px: 3, pt: 3, pb: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'common.white',
                    typography: 'subtitle2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  3
                </Box>
                <Typography variant="h6">Line items</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary', pl: 4.5 }}>
                Add services, quantities, and prices. The total updates automatically.
              </Typography>
            </Stack>
            <InvoiceNewEditDetails />
          </Card>
        </Stack>
      ) : (
        <Card>
          <InvoiceNewEditAddress />
          <InvoiceNewEditStatusDate />
          <InvoiceNewEditDetails />
        </Card>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="flex-end"
        spacing={2}
        sx={{ mt: 3 }}
      >
        <LoadingButton
          color="inherit"
          size="large"
          variant="outlined"
          loading={loadingSave.value && isSubmitting}
          onClick={handleSaveAsDraft}
        >
          Save as draft
        </LoadingButton>

        <LoadingButton
          size="large"
          variant="contained"
          loading={loadingSend.value && isSubmitting}
          onClick={handleCreateAndSend}
        >
          {currentInvoice ? 'Update' : 'Create'} & send
        </LoadingButton>
      </Stack>
    </Form>
  );
}
