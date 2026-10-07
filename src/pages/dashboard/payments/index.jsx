import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { AgencyPaymentsView } from 'src/sections/agency/payments/view/agency-payments-view';

const metadata = { title: `Payments | Dashboard - ${CONFIG.site.name}` };

export default function PaymentsPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AgencyPaymentsView />
    </>
  );
}
