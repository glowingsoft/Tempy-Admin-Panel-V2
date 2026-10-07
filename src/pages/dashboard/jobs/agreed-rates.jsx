import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { useRoleModuleGuard } from 'src/auth/hooks';

import { SupplierAgreedRatesView } from 'src/sections/supplier-relationship/view/agreed-rates-view';

// ----------------------------------------------------------------------

const metadata = { title: `Agreed rates | Dashboard - ${CONFIG.site.name}` };

export default function AgreedRatesPage() {
  const shouldRedirect = useRoleModuleGuard('jobs.agreedRates');
  if (shouldRedirect) return null;

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <SupplierAgreedRatesView />
    </>
  );
}
