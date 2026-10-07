import { Helmet } from 'react-helmet-async';

import { useParams, usePathname } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { findStoredInvoice } from 'src/sections/invoice/invoice-actions';
import { getInvoiceRoleKey } from 'src/sections/invoice/invoice-route-utils';

import { InvoiceEditView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

const metadata = { title: `Invoice edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { id = '' } = useParams();
  const roleKey = getInvoiceRoleKey(usePathname());

  const currentInvoice = findStoredInvoice(id, roleKey);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <InvoiceEditView invoice={currentInvoice} />
    </>
  );
}
