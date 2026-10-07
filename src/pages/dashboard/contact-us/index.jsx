import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DashboardContactView } from 'src/sections/dashboard-settings/view/dashboard-contact-view';

// ----------------------------------------------------------------------

const metadata = { title: `Contact Us | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DashboardContactView />
    </>
  );
}
