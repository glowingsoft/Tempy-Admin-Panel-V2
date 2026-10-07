import Button from '@mui/material/Button';

import { RouterLink } from 'src/routes/components';
import { usePathname } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { getInvoicePaths } from 'src/sections/invoice/invoice-route-utils';

import { CareHomeInvoiceDetails } from '../care-home-invoice-details';
import { findCareHomeInvoice } from '../care-home-invoice-actions';

function BackToInvoicesButton({ href }) {
  return (
    <Button
      color="inherit"
      component={RouterLink}
      href={href}
      startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
      sx={{ mb: 1, alignSelf: 'flex-start' }}
    >
      Back
    </Button>
  );
}

export function CareHomeInvoiceDetailsView({ invoice: initialInvoice }) {
  const invoicePaths = getInvoicePaths(usePathname());
  const invoice = initialInvoice;

  if (!invoice) {
    return (
      <DashboardContent>
        <BackToInvoicesButton href={invoicePaths.list} />
        <CustomBreadcrumbs
          heading="Payment not found"
          links={[
            { name: 'Dashboard', href: invoicePaths.dashboard },
            { name: 'Invoices', href: invoicePaths.list },
            { name: 'Not found' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <BackToInvoicesButton href={invoicePaths.list} />
      <CustomBreadcrumbs
        heading={invoice.shiftTitle || invoice.invoiceNumber}
        links={[
          { name: 'Dashboard', href: invoicePaths.dashboard },
          { name: 'Invoices', href: invoicePaths.list },
          { name: invoice.invoiceNumber },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <CareHomeInvoiceDetails invoice={invoice} />
    </DashboardContent>
  );
}

export function resolveCareHomeInvoice(id) {
  return findCareHomeInvoice(id);
}
