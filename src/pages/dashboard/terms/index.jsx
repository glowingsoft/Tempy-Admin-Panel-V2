import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DashboardTermsView } from 'src/sections/dashboard-settings/view/dashboard-settings-pages';

// ----------------------------------------------------------------------

const metadata = { title: `Terms and Conditions | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DashboardTermsView />
    </>
  );
}
