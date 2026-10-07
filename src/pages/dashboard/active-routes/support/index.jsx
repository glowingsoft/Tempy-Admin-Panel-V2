import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { SupportListView } from 'src/sections/active-sections/support-view/supports-list-view';


// ----------------------------------------------------------------------

const metadata = { title: `Support | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <SupportListView />
    </>
  );
}
