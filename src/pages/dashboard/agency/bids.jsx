import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useRoleModuleGuard } from 'src/auth/hooks';

import { AgencyBidsView } from 'src/sections/agency/bids/view/agency-bids-view';

// ----------------------------------------------------------------------

const metadata = { title: `Bids | Agency Dashboard - ${CONFIG.site.name}` };

export default function AgencyBidsPage() {
  const shouldRedirect = useRoleModuleGuard('agency.bids');
  if (shouldRedirect) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AgencyBidsView mode="agency" />
    </>
  );
}
