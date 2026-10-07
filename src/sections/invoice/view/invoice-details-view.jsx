import { usePathname } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceDetails } from '../invoice-details';
import { getInvoicePaths } from '../invoice-route-utils';

// ----------------------------------------------------------------------

export function InvoiceDetailsView({ invoice }) {
  const pathname = usePathname();
  const invoicePaths = getInvoicePaths(pathname);

  if (!invoice) {
    return (
      <DashboardContent>
        <CustomBreadcrumbs
          heading="Invoice not found"
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
      <CustomBreadcrumbs
        heading={invoice.invoiceNumber}
        links={[
          { name: 'Dashboard', href: invoicePaths.dashboard },
          { name: 'Invoices', href: invoicePaths.list },
          { name: invoice.invoiceNumber },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InvoiceDetails invoice={invoice} />
    </DashboardContent>
  );
}
