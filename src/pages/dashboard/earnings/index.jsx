import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { AgencyEarningsView } from 'src/sections/agency/earnings/view/agency-earnings-view';

const metadata = { title: `Earnings | Dashboard - ${CONFIG.site.name}` };

export default function EarningsPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AgencyEarningsView role="care-home" />
    </>
  );
}
