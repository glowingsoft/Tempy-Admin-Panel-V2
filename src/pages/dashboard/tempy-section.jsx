import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { BlankView } from 'src/sections/blank/view';

// ----------------------------------------------------------------------

export function createTempySectionPage(title) {
  const metadata = { title: `${title} | Dashboard - ${CONFIG.site.name}` };

  return function TempySectionPage() {
    return (
      <>
        <Helmet>
          <title>{metadata.title}</title>
        </Helmet>

        <BlankView title={title} />
      </>
    );
  };
}
