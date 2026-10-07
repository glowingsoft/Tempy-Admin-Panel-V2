import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { FaqsView } from 'src/sections/active-sections/faqs/faqs-view';

// ----------------------------------------------------------------------

const metadata = { title: `Faqs | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <FaqsView />
    </>
  );
}
