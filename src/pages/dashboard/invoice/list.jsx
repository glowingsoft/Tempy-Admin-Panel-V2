import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { InvoiceListView } from 'src/sections/invoice/view';
import { CareHomeInvoiceListView } from 'src/sections/care-home/invoices/view/care-home-invoice-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Invoice list | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { pathname } = useLocation();
  const isCareHomeInvoices = pathname.startsWith('/dashboard/invoice');

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {isCareHomeInvoices ? <CareHomeInvoiceListView /> : <InvoiceListView />}
    </>
  );
}
