import { Navigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';
import { usePathname } from 'src/routes/hooks';

import { useViewOnly } from 'src/hooks/use-view-only';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { InvoiceNewEditForm } from '../invoice-new-edit-form';
import { getInvoicePaths, isEmployerInvoiceRole } from '../invoice-route-utils';

// ----------------------------------------------------------------------

export function InvoiceCreateView() {
  const invoicePaths = getInvoicePaths(usePathname());
  const viewOnly = useViewOnly();

  // Admin viewing the account cannot create invoices for it either.
  if (viewOnly || isEmployerInvoiceRole(invoicePaths.roleKey)) {
    return <Navigate to={invoicePaths.list} replace />;
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
        <Typography variant="h4">New invoice</Typography>
      </Stack>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4, maxWidth: 640 }}>
        Add billing details, line items, and dates below. Save as draft to finish later, or create and send when
        ready.
      </Typography>

      <InvoiceNewEditForm />
    </DashboardContent>
  );
}
