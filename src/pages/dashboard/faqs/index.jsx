import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { DashboardFaqsView } from 'src/sections/faqs/view/dashboard-faqs-view';

// ----------------------------------------------------------------------

const metadata = { title: `FAQs | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <DashboardFaqsView />
    </>
  );
}
