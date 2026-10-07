import { Navigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';
import { usePathname } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { InvoiceNewEditForm } from '../invoice-new-edit-form';
import { getInvoicePaths, isEmployerInvoiceRole } from '../invoice-route-utils';

// ----------------------------------------------------------------------

export function InvoiceEditView({ invoice }) {
  const invoicePaths = getInvoicePaths(usePathname());

  if (isEmployerInvoiceRole(invoicePaths.roleKey)) {
    return <Navigate to={invoicePaths.list} replace />;
  }

  if (!invoice) {
    return (
      <DashboardContent maxWidth="lg">
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
          <Box
            component={RouterLink}
            href={invoicePaths.list}
            sx={{ display: 'flex', alignItems: 'center', color: 'text.primary', textDecoration: 'none' }}
          >
            <Iconify icon="eva:arrow-back-fill" width={24} />
          </Box>
          <Typography variant="h4">Invoice not found</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          This invoice could not be loaded. It may have been removed, or the link is invalid.
        </Typography>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="lg">
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Box
          component={RouterLink}
          href={invoicePaths.list}
          sx={{ display: 'flex', alignItems: 'center', color: 'text.primary', textDecoration: 'none' }}
        >
          <Iconify icon="eva:arrow-back-fill" width={24} />
        </Box>
        <Typography variant="h4">Edit invoice</Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
        {invoice?.invoiceNumber || 'Update invoice details below.'}
      </Typography>

      <InvoiceNewEditForm currentInvoice={invoice} />
    </DashboardContent>
  );
}
