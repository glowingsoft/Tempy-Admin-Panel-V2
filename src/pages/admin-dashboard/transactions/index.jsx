import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminTransactionsView } from 'src/sections/admin/transactions/view/admin-transactions-view';

// ----------------------------------------------------------------------

const metadata = { title: `Payouts | Admin - ${CONFIG.site.name}` };

export default function AdminTransactionsPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AdminTransactionsView />
    </>
  );
}
