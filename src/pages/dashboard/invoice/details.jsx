import { Helmet } from 'react-helmet-async';

import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

import { useParams, usePathname, useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { findStoredInvoice } from 'src/sections/invoice/invoice-actions';
import { getInvoicePaths, isEmployerInvoiceRole } from 'src/sections/invoice/invoice-route-utils';
import { InvoiceDetailsView } from 'src/sections/invoice/view';
import {
  CareHomeInvoiceDetailsView,
  resolveCareHomeInvoice,
} from 'src/sections/care-home/invoices/view/care-home-invoice-details-view';

// ----------------------------------------------------------------------

const metadata = { title: `Invoice details | Dashboard - ${CONFIG.site.name}` };

function InvoiceNotFound() {
  const router = useRouter();
  const invoicePaths = getInvoicePaths(usePathname());

  return (
    <DashboardContent>
      <Stack alignItems="center" spacing={2} sx={{ py: 10, textAlign: 'center' }}>
        <Iconify icon="solar:bill-list-bold-duotone" width={64} sx={{ color: 'text.disabled' }} />
        <Typography variant="h5">Invoice not found</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          This invoice could not be loaded. It may have been removed, or the link is invalid.
        </Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          onClick={() => router.push(invoicePaths.list)}
        >
          Back to invoices
        </Button>
      </Stack>
    </DashboardContent>
  );
}

function isValidInvoiceId(id) {
  const key = String(id || '').trim();
  return Boolean(key) && key !== 'undefined' && key !== 'null';
}

export default function Page() {
  const { id = '' } = useParams();
  const pathname = usePathname();
  const roleKey = getInvoicePaths(pathname).roleKey;
  const invoiceId = isValidInvoiceId(id) ? String(id).trim() : '';

  const careHomeInvoice = isEmployerInvoiceRole(roleKey) ? resolveCareHomeInvoice(invoiceId) : null;
  const storedInvoice = invoiceId ? findStoredInvoice(invoiceId, roleKey) : undefined;
  const invoice = careHomeInvoice || storedInvoice;
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {!invoice ? (
        <InvoiceNotFound />
      ) : careHomeInvoice ? (
        <CareHomeInvoiceDetailsView invoice={careHomeInvoice} />
      ) : (
        <InvoiceDetailsView invoice={storedInvoice} />
      )}
    </>
  );
}
