import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DashboardSupportView } from 'src/sections/support/view/dashboard-support-view';

// ----------------------------------------------------------------------

const metadata = { title: `Support | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DashboardSupportView />
    </>
  );
}
