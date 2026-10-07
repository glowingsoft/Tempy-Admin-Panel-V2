import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DashboardAboutView } from 'src/sections/dashboard-settings/view/dashboard-settings-pages';

// ----------------------------------------------------------------------

const metadata = { title: `About Us | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DashboardAboutView />
    </>
  );
}
