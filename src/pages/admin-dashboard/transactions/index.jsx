import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { AdminBookingTransactionsView } from 'src/sections/admin/transactions/view/admin-booking-transactions-view';

// ----------------------------------------------------------------------

const metadata = { title: `Transactions | Admin - ${CONFIG.site.name}` };

export default function AdminTransactionsPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AdminBookingTransactionsView />
    </>
  );
}
