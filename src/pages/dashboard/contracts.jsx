import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ContractsView } from 'src/sections/supplier-relationship/view/contracts-view';

// ----------------------------------------------------------------------

const metadata = { title: `Contracts | Dashboard - ${CONFIG.site.name}` };

export default function ContractsPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <ContractsView />
    </>
  );
}
