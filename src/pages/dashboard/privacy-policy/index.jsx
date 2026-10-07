import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DashboardPrivacyView } from 'src/sections/dashboard-settings/view/dashboard-settings-pages';

// ----------------------------------------------------------------------

const metadata = { title: `Privacy Policy | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DashboardPrivacyView />
    </>
  );
}
